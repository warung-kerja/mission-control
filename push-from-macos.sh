#!/bin/bash
# Script to push Mission Control V1.3 from macOS

echo "=== Mission Control V1.3 Push Script ==="
echo ""

# Check if we're in the right directory
REPO_PATH="/Volumes/Baro/Warung Kerja 1.0/06_Agents/noona/mission-control-repo"
cd "$REPO_PATH" || { echo "Error: Cannot cd to $REPO_PATH"; exit 1; }

echo "1. Checking repository location..."
pwd

echo ""
echo "2. Listing files..."
ls -la

echo ""
echo "3. Checking git status..."
git status

echo ""
echo "4. Showing recent commits..."
git log --oneline -5

echo ""
echo "5. Attempting to push to GitHub..."
echo "   If this fails, use GitHub Desktop instead."
echo ""

read -p "Press Enter to continue with git push, or Ctrl+C to cancel..."

git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Mission Control V1.3 pushed to GitHub."
    echo "   Live site: https://warung-kerja.github.io/mission-control/"
else
    echo ""
    echo "❌ Push failed. Try these alternatives:"
    echo "   A. Use GitHub Desktop:"
    echo "      1. Open GitHub Desktop"
    echo "      2. File → Add Local Repository"
    echo "      3. Browse to: $REPO_PATH"
    echo "      4. Click 'Push' button"
    echo ""
    echo "   B. Check authentication:"
    echo "      git config --list | grep credential"
    echo "      git remote -v"
    echo ""
    echo "   C. Generate patch file for manual application"
fi