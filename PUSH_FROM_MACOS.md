# How to Push Mission Control V1.3 from macOS

Since GitHub authentication isn't working from the WSL side, here's how to push from your macOS machine.

## Step 1: Verify Files Exist
Open Terminal on macOS and run:
```bash
cd "/Volumes/Baro/Warung Kerja 1.0/06_Agents/noona/mission-control-repo"
ls -la
```

You should see:
- `index.html` (350KB) - Main dashboard with Analytics Tab
- `projects.json` (5KB) - Project data at 99%
- `team.json` (3.5KB) - Team member data
- `calendar.json` (11KB) - Calendar events
- Plus 20+ other files

If you only see 4 markdown files, there's a file sync issue.

## Step 2: Check Git Status
```bash
cd "/Volumes/Baro/Warung Kerja 1.0/06_Agents/noona/mission-control-repo"
git status
git log --oneline -5
```

You should see:
- 2 commits ahead: V1.3 and V1.4
- Clean working tree

## Step 3: Push to GitHub
```bash
cd "/Volumes/Baro/Warung Kerja 1.0/06_Agents/noona/mission-control-repo"
git push origin main
```

If this fails with authentication, use GitHub Desktop:
1. Open GitHub Desktop
2. File → Add Local Repository
3. Browse to: `/Volumes/Baro/Warung Kerja 1.0/06_Agents/noona/mission-control-repo`
4. Click "Push" button

## Step 4: If Files Are Missing (File Sync Issue)
If files aren't visible on macOS, use this patch file:

1. Download the patch: [v1.3-mission-control.patch](https://...)
2. Apply to any mission-control clone:
```bash
git apply v1.3-mission-control.patch
```

## What's in V1.3:
- ✅ **Analytics Tab** with 10+ features
- ✅ **Team velocity tracking** with HTML5 Canvas
- ✅ **Workload distribution** visualization
- ✅ **Project progress analytics** with ETAs
- ✅ **Activity heatmaps** (14-day grid)
- ✅ **Team performance leaderboard**
- ✅ **AI-powered insights** cards
- ✅ **Exportable JSON reports**
- ✅ **Timeframe selector** (7/30/90 days)

## Live Site After Push:
https://warung-kerja.github.io/mission-control/

## Need Help?
1. **File visibility issue** → Check WSL/macOS file sync
2. **Authentication issue** → Use GitHub Desktop with your credentials
3. **Patch needed** → I can generate a patch file with all changes