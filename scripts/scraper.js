import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SocketDocsScraper {
  constructor() {
    this.baseUrl = 'https://docs.socket.dev';
    this.pages = [];
    this.chunks = [];
    this.visitedUrls = new Set();
  }

  async scrapeDocumentation() {
    console.log('Starting comprehensive Socket.dev documentation scrape...');

    // Fetch sitemap to get all available URLs
    console.log('Fetching sitemap...');
    const sitemapUrls = await this.fetchSitemapUrls();
    console.log(`Found ${sitemapUrls.length} URLs in sitemap`);

    // Filter to only docs.socket.dev URLs and valid documentation paths
    const validUrls = sitemapUrls.filter(url => {
      return url.startsWith(this.baseUrl) &&
             (url.includes('/docs/') || url.includes('/reference/') || url === this.baseUrl);
    });

    console.log(`Filtering to ${validUrls.length} valid documentation URLs`);

    // Scrape all valid URLs
    let successCount = 0;
    for (let i = 0; i < validUrls.length; i++) {
      const url = validUrls[i];
      console.log(`[${i+1}/${validUrls.length}] Scraping: ${url}`);

      const success = await this.scrapePage(url, false);
      if (success) successCount++;

      // Be nice to the server
      await this.delay(100);

      // Progress update every 20 pages
      if ((i + 1) % 20 === 0) {
        console.log(`Progress: ${i+1}/${validUrls.length} pages processed, ${successCount} successful`);
      }
    }

    console.log(`\n=== SCRAPING COMPLETE ===`);
    console.log(`Total URLs attempted: ${validUrls.length}`);
    console.log(`Successful scrapes: ${successCount}`);
    console.log(`Pages scraped: ${this.pages.length}`);
    console.log(`Chunks created: ${this.chunks.length}`);

    return {
      pages: this.pages,
      chunks: this.chunks,
      metadata: {
        lastScraped: new Date().toISOString().split('T')[0],
        totalPages: this.pages.length,
        totalChunks: this.chunks.length,
        sitemapUrlsFound: sitemapUrls.length,
        validUrlsAttempted: validUrls.length,
        successfulScrapes: successCount
      }
    };
  }

  async fetchSitemapUrls() {
    try {
      const sitemapUrl = `${this.baseUrl}/sitemap.xml`;
      const response = await fetch(sitemapUrl);

      if (!response.ok) {
        console.warn(`Failed to fetch sitemap: ${response.status}`);
        return [];
      }

      const xml = await response.text();

      // Parse XML to extract URLs (simple regex approach)
      const urlMatches = xml.match(/<loc>(.*?)<\/loc>/g);
      if (!urlMatches) {
        console.warn('No URLs found in sitemap');
        return [];
      }

      const urls = urlMatches
        .map(match => match.replace(/<\/?loc>/g, ''))
        .filter(url => url && url.startsWith('http'));

      return urls;
    } catch (error) {
      console.error('Error fetching sitemap:', error.message);
      return [];
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async scrapePage(url, followLinks = false, maxDepth = 0) {
    if (this.visitedUrls.has(url)) {
      return false;
    }

    this.visitedUrls.add(url);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`  ❌ Failed: ${response.status}`);
        return false;
      }

      const html = await response.text();
      const content = this.extractContent(html);
      const title = this.extractTitle(html);

      if (content && title) {
        const page = {
          url,
          title,
          content,
          lastUpdated: new Date().toISOString().split('T')[0]
        };

        this.pages.push(page);
        this.createChunks(page);
        console.log(`  ✅ Success: "${title.substring(0, 50)}..."`);
        return true;
      } else {
        console.log(`  ⚠️  No content: Missing title or content`);
        return false;
      }

    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      return false;
    }
  }

  extractContent(html) {
    // Remove script and style tags
    let content = html.replace(/<script[^>]*>.*?<\/script>/gis, '');
    content = content.replace(/<style[^>]*>.*?<\/style>/gis, '');

    // Extract main content (adjust selectors based on Socket.dev's structure)
    const mainContentRegex = /<main[^>]*>(.*?)<\/main>/is;
    const articleRegex = /<article[^>]*>(.*?)<\/article>/is;
    const contentRegex = /<div[^>]*class="[^"]*content[^"]*"[^>]*>(.*?)<\/div>/is;

    let match = content.match(mainContentRegex) ||
                content.match(articleRegex) ||
                content.match(contentRegex);

    if (match) {
      content = match[1];
    }

    // Remove HTML tags and clean up
    content = content.replace(/<[^>]*>/g, ' ');
    content = content.replace(/\s+/g, ' ');
    content = content.trim();

    return content.length > 50 ? content : null;
  }

  extractTitle(html) {
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    if (titleMatch) {
      return titleMatch[1].replace(/\s+/g, ' ').trim();
    }

    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (h1Match) {
      return h1Match[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }

    return 'Untitled';
  }

  extractLinks(html, baseUrl) {
    const links = [];
    const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>/gi;
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      let href = match[1];

      if (href.startsWith('/')) {
        href = this.baseUrl + href;
      } else if (href.startsWith('#')) {
        href = baseUrl + href;
      }

      if (href.startsWith(this.baseUrl)) {
        links.push(href);
      }
    }

    return [...new Set(links)];
  }

  shouldCrawlLink(url) {
    // Only crawl docs.socket.dev URLs
    if (!url.startsWith(this.baseUrl)) {
      return false;
    }

    // Normalize URL - remove fragments and trailing slashes
    const normalizedUrl = url.split('#')[0].replace(/\/$/, '');

    // Skip certain file types and problematic URLs
    const skipPatterns = [
      /\.(pdf|jpg|jpeg|png|gif|svg|zip|tar|gz|css|js|woff|woff2)$/i,
      /\/download\//,
      /\/assets\//,
      /\/static\//,
      /\/_next\//,
      /\/api\//,
      /\?/,  // Skip URLs with query parameters
      /#/,   // Skip fragment-only URLs
      /^https:\/\/docs\.socket\.dev$/ // Skip bare domain (we already process it)
    ];

    // Additional checks for Socket.dev specific patterns
    if (normalizedUrl === this.baseUrl) {
      return false; // Already processed
    }

    // Only allow URLs that look like documentation paths
    const validPathPattern = /^https:\/\/docs\.socket\.dev\/(docs|reference)/;
    if (!validPathPattern.test(normalizedUrl)) {
      return false;
    }

    return !skipPatterns.some(pattern => pattern.test(url));
  }

  createChunks(page) {
    const content = page.content;
    const maxChunkSize = 1000;

    if (content.length <= maxChunkSize) {
      this.chunks.push({
        url: page.url,
        title: page.title,
        content: content,
        lastUpdated: page.lastUpdated,
        section: 'main'
      });
      return;
    }

    // Split into smaller chunks
    const sentences = content.split(/[.!?]+/);
    let currentChunk = '';
    let chunkIndex = 0;

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) continue;

      if (currentChunk.length + trimmedSentence.length > maxChunkSize && currentChunk) {
        this.chunks.push({
          url: `${page.url}#chunk-${chunkIndex}`,
          title: page.title,
          content: currentChunk.trim(),
          lastUpdated: page.lastUpdated,
          section: `chunk-${chunkIndex}`
        });

        currentChunk = trimmedSentence;
        chunkIndex++;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
      }
    }

    if (currentChunk.trim()) {
      this.chunks.push({
        url: `${page.url}#chunk-${chunkIndex}`,
        title: page.title,
        content: currentChunk.trim(),
        lastUpdated: page.lastUpdated,
        section: `chunk-${chunkIndex}`
      });
    }
  }

  async saveDocs(docs) {
    const docsPath = path.join(__dirname, '..', 'docs', 'socket-docs.json');
    await fs.writeFile(docsPath, JSON.stringify(docs, null, 2));
    console.log(`Saved documentation to ${docsPath}`);
  }
}

// Run the scraper
async function main() {
  const scraper = new SocketDocsScraper();
  try {
    const docs = await scraper.scrapeDocumentation();
    await scraper.saveDocs(docs);
    console.log('Documentation scraping completed successfully!');
  } catch (error) {
    console.error('Scraping failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { SocketDocsScraper };