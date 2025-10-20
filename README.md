# Socket.dev Documentation MCP Server

A Model Context Protocol (MCP) server that provides Socket.dev's public documentation directly within Claude Desktop. This enables Claude to answer Socket.dev-related questions with accurate, up-to-date information from official documentation.

## What is This?

This MCP server gives Claude access to:
- All public documentation from https://docs.socket.dev
- Socket Python SDK documentation from GitHub
- 175+ pages and 1000+ searchable documentation chunks

When you ask Claude questions about Socket.dev, it can search and retrieve accurate information from the official docs rather than relying on potentially outdated training data.

## Prerequisites

- Node.js 18 or higher
- Claude Desktop application
- macOS, Linux, or Windows

## Installation

### 1. Clone the Repository

```bash
cd ~/Desktop/projects
git clone https://github.com/SocketDev/mcp-socket-docs.git
cd mcp-socket-docs
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Verify Documentation Data

Check that the documentation is present:

```bash
npm run docs:stats
```

You should see output like:
```
Pages: 175 | Chunks: 1000 | Last updated: 2025-XX-XX
```

### 4. Configure Claude Desktop

Add this MCP server to your Claude Desktop configuration:

**Location:** `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)

```json
{
  "mcpServers": {
    "socket-docs": {
      "command": "node",
      "args": [
        "/Users/YOUR_USERNAME/Desktop/projects/mcp-socket-docs/src/index.js"
      ]
    }
  }
}
```

**Important:** Replace `YOUR_USERNAME` with your actual macOS username.

### 5. Restart Claude Desktop

Quit and restart Claude Desktop completely to load the MCP server.

## Verification

To verify the MCP server is working:

1. Open Claude Desktop
2. Start a new conversation
3. Look for the MCP server indicator (usually a small icon showing connected servers)
4. Ask Claude: "Can you search the Socket.dev docs for information about the Python SDK?"

Claude should now be able to search and retrieve Socket documentation.

## Available Tools

The MCP server provides two tools to Claude:

### `search_docs(query, limit)`
Search documentation for relevant content.

**Parameters:**
- `query` (string, required): Search query
- `limit` (number, optional): Maximum results to return (default: 5)

**Example:** "How do I install the Socket Python SDK?"

### `get_doc(url)`
Retrieve a specific documentation page by URL.

**Parameters:**
- `url` (string, required): Full URL to the documentation page

**Example:** "https://docs.socket.dev/docs/socket-python-sdk"

## Response Format

All responses follow this structure:

```json
{
  "answer": "The main content from the documentation",
  "citations": ["https://docs.socket.dev/docs/..."],
  "metadata": {
    "section_title": "Page Title",
    "last_updated": "2025-01-15"
  }
}
```

## Updating Documentation

### Automatic Updates (Recommended)

The repository includes a GitHub Actions workflow that automatically updates documentation weekly:

- **Schedule:** Every Sunday at 2 AM UTC
- **What it does:** Scrapes latest docs, commits changes if found
- **No action needed:** Updates happen automatically

You can also trigger a manual update:

1. Go to the repository on GitHub
2. Click "Actions" tab
3. Select "Update Socket.dev Documentation" workflow
4. Click "Run workflow"

### Manual Local Updates

If you want to update the documentation locally:

```bash
# Pull latest changes (if using GitHub Actions)
git pull

# OR run the scraper manually
npm run scrape

# Verify the update
npm run docs:stats

# Restart Claude Desktop to pick up changes
# (Quit completely, then reopen)
```

### Using the Update Script

A convenient shell script is included:

```bash
./scripts/update-docs.sh
```

This will:
- Install/update dependencies
- Run the scraper
- Show what changed
- Optionally commit the changes

## Development

### Project Structure

```
mcp-socket-docs/
├── src/
│   ├── index.js                 # MCP server implementation
│   └── documentation-service.js # Documentation search/retrieval
├── scripts/
│   ├── scraper.js              # Documentation scraper
│   └── update-docs.sh          # Update helper script
├── docs/
│   └── socket-docs.json        # Scraped documentation data
├── .github/
│   └── workflows/
│       └── update-docs.yml     # Auto-update workflow
└── package.json
```

### Running in Development Mode

```bash
# Run with auto-reload on file changes
npm run dev

# Run normally
npm start
```

### Testing the Scraper

```bash
# Run the scraper to fetch latest docs
npm run scrape

# Check what was scraped
npm run docs:stats
```

## Troubleshooting

### MCP Server Not Showing in Claude

1. **Check configuration path:** Verify the path in `claude_desktop_config.json` is correct and points to your actual username
2. **Check Node.js version:** Run `node --version` (must be 18+)
3. **Restart completely:** Make sure to fully quit Claude Desktop (Cmd+Q on macOS), not just close the window
4. **Check logs:** Look in Claude Desktop logs for error messages

### Documentation Seems Outdated

```bash
# Update manually
cd ~/Desktop/projects/mcp-socket-docs
npm run scrape
npm run docs:stats

# Then restart Claude Desktop
```

### No Results When Searching

1. **Verify docs exist:**
   ```bash
   ls -lh docs/socket-docs.json
   npm run docs:stats
   ```

2. **Check file permissions:**
   ```bash
   chmod 644 docs/socket-docs.json
   ```

3. **Re-scrape if needed:**
   ```bash
   npm run scrape
   ```

### Cannot Run Scraper (Rate Limited)

The scraper is configured with delays to respect rate limits:
- 100ms delay between pages
- Uses public APIs (no authentication required)

If you hit rate limits, wait a few minutes and try again.

## Technical Details

### How Search Works

The documentation service uses a simple but effective relevance scoring algorithm:

- **Exact phrase match in title:** +100 points
- **Exact phrase match in content:** +50 points
- **Individual word matches:** +5-10 points each
- **Special boosts:** For API, SDK, Python-related content

### Data Format

The `docs/socket-docs.json` file contains:

```json
{
  "pages": [
    {
      "url": "https://docs.socket.dev/...",
      "title": "Page Title",
      "content": "Full page content...",
      "lastUpdated": "2025-01-15"
    }
  ],
  "chunks": [
    {
      "url": "https://docs.socket.dev/...#chunk-0",
      "title": "Page Title",
      "content": "Chunk content (max 1000 chars)...",
      "lastUpdated": "2025-01-15",
      "section": "chunk-0"
    }
  ],
  "metadata": {
    "lastScraped": "2025-01-15",
    "totalPages": 175,
    "totalChunks": 1000
  }
}
```

### Chunk Strategy

Long pages are split into ~1000 character chunks to:
- Improve search relevance
- Provide focused, specific answers
- Enable better citation granularity

## Contributing

### Updating the Scraper

If Socket.dev changes their documentation structure:

1. Edit `scripts/scraper.js`
2. Test with `npm run scrape`
3. Verify with `npm run docs:stats`
4. Commit and push changes

### Adding New Documentation Sources

To add more documentation sources (e.g., other GitHub repos):

1. Edit the `repositories` array in `scripts/scraper.js`:
   ```javascript
   this.repositories = [
     'SocketDev/socket-sdk-python',
     'SocketDev/your-new-repo'
   ];
   ```

2. Run the scraper: `npm run scrape`
3. Test in Claude Desktop

## Security

This repository contains:
- ✅ Only public documentation
- ✅ No API keys or secrets
- ✅ No authentication required
- ✅ Safe to make public

All accessed resources are publicly available without authentication.

## License

MIT

## Support

For issues or questions:
- **Internal Socket team:** Ask in #engineering or #support-team
- **MCP Server issues:** Create an issue in this repository
- **Socket.dev docs issues:** Contact the documentation team

## Useful Commands Reference

```bash
# Installation
npm install

# Run MCP server
npm start

# Development mode (auto-reload)
npm run dev

# Update documentation
npm run scrape

# Check documentation stats
npm run docs:stats

# Update script (with git integration)
./scripts/update-docs.sh

# Verify configuration
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

## Credits

Built by the Socket.dev team to improve support efficiency and accuracy through Claude Desktop integration.
