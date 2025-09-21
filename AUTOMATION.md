# Documentation Update Automation

## 📊 Current Status
- **Complete Coverage**: 175 pages, 1000 chunks
- **Coverage**: 100% of docs.socket.dev
- **Last Updated**: Run `npm run docs:stats` to check

## 🔄 Automation Options

### 1. GitHub Actions (Recommended)
**Automatic weekly updates via GitHub**

- ✅ **Already configured** in `.github/workflows/update-docs.yml`
- 🕐 **Schedule**: Every Sunday at 2 AM UTC
- 🚀 **Manual trigger**: Available via GitHub UI
- 📝 **Auto-commit**: Commits changes automatically
- 🔍 **Smart**: Only commits when docs actually change

**Setup:**
```bash
# Just push to GitHub - workflow is already configured
git add . && git commit -m "Initial setup" && git push
```

### 2. Local Cron Job
**Automatic updates on your Mac**

**Setup:**
```bash
# Edit crontab
crontab -e

# Add this line for weekly updates (Sundays at 2 AM)
0 2 * * 0 /Users/davidlarsen/Desktop/projects/mcp-socket-docs/scripts/update-docs.sh

# Or for daily updates at 3 AM
0 3 * * * /Users/davidlarsen/Desktop/projects/mcp-socket-docs/scripts/update-docs.sh
```

### 3. Manual Updates
**Run when needed**

```bash
# Quick update
npm run docs:update

# Full update with git handling
npm run update

# Check current stats
npm run docs:stats
```

### 4. Launchd (macOS Service)
**Native macOS scheduling**

Create `/Users/davidlarsen/Library/LaunchAgents/com.socket.docs.plist`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.socket.docs</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/davidlarsen/Desktop/projects/mcp-socket-docs/scripts/update-docs.sh</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Weekday</key>
        <integer>0</integer>
        <key>Hour</key>
        <integer>2</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
</dict>
</plist>
```

Then:
```bash
launchctl load ~/Library/LaunchAgents/com.socket.docs.plist
```

## 🎯 Recommendations

### For Most Users: GitHub Actions
- Zero maintenance
- Runs in the cloud
- Auto-commits updates
- Works even when your Mac is off

### For Local-Only: Cron Job
- Runs on your Mac
- No GitHub dependency
- You control commits manually

### For Development: Manual Updates
- Run `npm run docs:update` when needed
- Perfect for testing changes

## 🔧 Customization

### Change Update Frequency

**GitHub Actions:**
Edit `.github/workflows/update-docs.yml` cron schedule:
```yaml
# Daily at 6 AM
- cron: '0 6 * * *'

# Twice weekly (Wed, Sun)
- cron: '0 2 * * 0,3'
```

**Cron:**
```bash
# Daily at 3 AM
0 3 * * * /path/to/update-docs.sh

# Every 6 hours
0 */6 * * * /path/to/update-docs.sh
```

### Auto-restart Claude Desktop

Uncomment this line in `scripts/update-docs.sh`:
```bash
killall "Claude" 2>/dev/null || true
```

## 📈 Monitoring

Check if updates are working:
```bash
# View last update time
npm run docs:stats

# Check git history
git log --oneline docs/socket-docs.json

# View GitHub Actions (if using)
# Visit: https://github.com/your-repo/actions
```

## 🚨 Troubleshooting

**Updates not running?**
- Check cron with `crontab -l`
- Verify script permissions: `ls -la scripts/update-docs.sh`
- Check GitHub Actions status in repo

**Claude Desktop not picking up changes?**
- Restart Claude Desktop manually
- Or enable auto-restart in update script