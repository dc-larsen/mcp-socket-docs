#!/bin/bash

# Socket.dev Documentation Update Script
# This script can be run manually or via cron

set -e

echo "🔄 Starting Socket.dev documentation update..."

# Change to project directory
cd "$(dirname "$0")/.."

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not available. Please install Node.js"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install --silent

# Run the scraper
echo "🕷️  Running documentation scraper..."
npm run scrape

# Check if running in git repository
if [ -d ".git" ]; then
    # Check for changes
    if git diff --quiet docs/socket-docs.json; then
        echo "ℹ️  No changes detected in documentation"
    else
        echo "✅ Changes detected - documentation updated!"

        # Optional: auto-commit (uncomment if desired)
        # git add docs/socket-docs.json
        # git commit -m "📚 Update Socket.dev documentation - $(date +'%Y-%m-%d %H:%M:%S')"
        # echo "📝 Changes committed to git"
    fi
else
    echo "⚠️  Not a git repository - skipping git operations"
fi

echo "🎉 Documentation update complete!"

# Optional: restart Claude Desktop to pick up changes
# killall "Claude" 2>/dev/null || true
# echo "🔄 Claude Desktop restarted to pick up changes"