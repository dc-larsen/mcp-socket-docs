# Claude Instructions for Socket.dev MCP Server

## 📋 Common Commands

### Update Documentation
When the user asks to "pull down the latest updates" or "update the docs":

1. **Pull latest changes from GitHub** (if using GitHub Actions):
   ```bash
   git pull
   ```

2. **OR run the scraper locally** (if not using GitHub):
   ```bash
   npm run scrape
   ```

3. **Check documentation stats**:
   ```bash
   npm run docs:stats
   ```

4. **Restart Claude Desktop** to pick up changes:
   - Tell user to quit and restart Claude Desktop
   - Or explain that MCP server will auto-reload on next query

### Check Status
When asked about current documentation status:
```bash
npm run docs:stats
git log --oneline -5 docs/socket-docs.json
```

### Manual Scrape
When asked to refresh/rescrape the documentation:
```bash
npm run scrape
```

## 🔧 Troubleshooting

### MCP Server Not Working
1. Check if server is running: `npm start`
2. Verify config in: `/Users/davidlarsen/Library/Application Support/Claude/claude_desktop_config.json`
3. Restart Claude Desktop

### Documentation Issues
1. Check file exists: `ls -la docs/socket-docs.json`
2. Verify content: `npm run docs:stats`
3. Re-scrape if needed: `npm run scrape`

### Git Issues
1. Check status: `git status`
2. Pull latest: `git pull`
3. Check remote: `git remote -v`

## 📁 Key Files
- **MCP Server**: `src/index.js`
- **Documentation Data**: `docs/socket-docs.json`
- **Scraper**: `scripts/scraper.js`
- **Claude Config**: `/Users/davidlarsen/Library/Application Support/Claude/claude_desktop_config.json`

## 🎯 Project Context
This is a Socket.dev documentation MCP server that:
- Provides `search_docs(query)` and `get_doc(url)` tools
- Contains 175 pages and 1000 chunks from docs.socket.dev
- Responds with JSON format: `{answer, citations, metadata}`
- Updates can be automated via GitHub Actions or local cron
- Serves as support documentation for Socket.dev queries

## 🔄 Update Workflow
1. User requests documentation update
2. Run appropriate command above
3. Verify stats show new data
4. Inform user to restart Claude Desktop
5. Test with a query to confirm updates work