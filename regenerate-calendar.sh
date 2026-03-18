#!/bin/bash
# Script to regenerate calendar.json and commit/push to GitHub

cd /home/baro/.openclaw/workspace/mission-control

# Activate virtual environment if it exists
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
fi

# Generate calendar.json
python3 generate-calendar-json.py

# Check if calendar.json was generated
if [ -f "calendar.json" ]; then
    echo "calendar.json generated successfully"
    
    # Add to git
    git add calendar.json
    git add generate-calendar-json.py
    git add regenerate-calendar.sh
    
    # Check if there are changes
    if git diff --cached --quiet; then
        echo "No changes to commit"
    else
        # Commit and push
        git commit -m "Auto-update: Regenerate calendar.json $(date '+%Y-%m-%d %H:%M')"
        
        # Try to push
        if git push origin main; then
            echo "Successfully pushed to GitHub"
        else
            echo "Failed to push to GitHub"
            # Store for manual push later
            echo "Changes committed locally, need manual push"
        fi
    fi
else
    echo "Error: calendar.json not generated"
    exit 1
fi