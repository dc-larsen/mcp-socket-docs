import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DocumentationService {
  constructor() {
    this.docsPath = path.join(__dirname, '..', 'docs', 'socket-docs.json');
    this.docs = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      const data = await fs.readFile(this.docsPath, 'utf8');
      this.docs = JSON.parse(data);
      this.initialized = true;
    } catch (error) {
      console.error('Failed to load documentation data:', error.message);
      this.docs = { pages: [], chunks: [] };
      this.initialized = true;
    }
  }

  async searchDocs(query, limit = 5) {
    await this.initialize();

    if (!this.docs || !this.docs.chunks) {
      return [];
    }

    const queryLower = query.toLowerCase();
    const results = [];

    for (const chunk of this.docs.chunks) {
      const score = this.calculateRelevanceScore(chunk, queryLower);
      if (score > 0) {
        results.push({
          ...chunk,
          score
        });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ score, ...chunk }) => chunk);
  }

  async getDoc(url) {
    await this.initialize();

    if (!this.docs || !this.docs.pages) {
      return null;
    }

    // Try exact match first
    let page = this.docs.pages.find(page => page.url === url);

    // If no exact match, try matching without fragment (everything before #)
    if (!page) {
      const urlWithoutFragment = url.split('#')[0];
      page = this.docs.pages.find(page => page.url === urlWithoutFragment);
    }

    // If still no match, try finding in chunks
    if (!page && this.docs.chunks) {
      const chunk = this.docs.chunks.find(chunk => chunk.url === url);
      if (chunk) {
        return {
          url: chunk.url,
          title: chunk.title,
          content: chunk.content,
          lastUpdated: chunk.lastUpdated
        };
      }
    }

    return page || null;
  }

  calculateRelevanceScore(chunk, queryLower) {
    let score = 0;
    const content = (chunk.content || '').toLowerCase();
    const title = (chunk.title || '').toLowerCase();

    // Exact phrase match in title (highest weight)
    if (title.includes(queryLower)) {
      score += 100;
    }

    // Exact phrase match in content
    if (content.includes(queryLower)) {
      score += 50;
    }

    // Individual word matches
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
    for (const word of queryWords) {
      if (title.includes(word)) {
        score += 10;
      }
      if (content.includes(word)) {
        score += 5;
      }
    }

    // Boost for API-related content
    if (queryLower.includes('api') && (content.includes('api') || title.includes('api'))) {
      score += 20;
    }

    // Boost for configuration content
    if (queryLower.includes('config') && (content.includes('config') || title.includes('config'))) {
      score += 20;
    }

    // Boost for SDK-related content (especially relevant for GitHub repos)
    if (queryLower.includes('sdk') && (content.includes('sdk') || title.includes('sdk'))) {
      score += 30;
    }

    // Boost for Python-related content
    if (queryLower.includes('python') && (content.includes('python') || title.includes('python'))) {
      score += 25;
    }

    // Boost for GitHub repository content when searching for installation, examples, etc.
    if ((queryLower.includes('install') || queryLower.includes('example') || queryLower.includes('usage')) &&
        (content.includes('github.com') || title.includes('github'))) {
      score += 15;
    }

    return score;
  }

  // Method to update documentation data (for manual updates)
  async updateDocs(newDocs) {
    this.docs = newDocs;
    await fs.writeFile(this.docsPath, JSON.stringify(newDocs, null, 2));
  }
}