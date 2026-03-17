# Warung-Kerja Mission Control

A custom dashboard for managing AI agents, projects, and tasks.

## 🚀 Quick Start

### 1. View the Dashboard
**Live URL:** https://warung-kerja.github.io/mission-control/

### 2. Run the Data Bridge (for live data)

**Requirements:** Python 3.7+

**Install dependencies:**
```bash
cd mission-control
pip install flask flask-cors
```

**Start the Data Bridge:**
```bash
python data-bridge.py
```

The Data Bridge will:
- Connect to your Obsidian vault (`/mnt/d/Baro Brain`)
- Serve live data on `http://localhost:3001`
- Enable the dashboard to show real tasks and projects

### 3. API Endpoints

Once the Data Bridge is running:

- `http://localhost:3001/api/health` - Health check
- `http://localhost:3001/api/tasks` - Get all tasks
- `http://localhost:3001/api/projects` - Get all projects
- `http://localhost:3001/api/activity` - Get recent activity
- `http://localhost:3001/api/vault/status` - Vault connection status

## 📋 Features

### V0.5 (Current)
- ✅ Task Board with drag-and-drop Kanban
- ✅ Live Activity Feed
- ✅ Quick Actions Panel
- ✅ Navigation tabs (Tasks, Calendar, Projects, Team, Office)
- ✅ Data Bridge for live vault connection

### Coming Soon
- 📅 Calendar Module (V0.6)
- 🎯 Projects Tracker (V0.7)
- 👥 Team Org Chart (V0.8)
- 🏢 Office Visualization (V1.0)

## 🛠️ Development

The dashboard is built with vanilla HTML/CSS/JS and hosted on GitHub Pages.

To modify:
1. Edit `index.html`
2. Commit and push to GitHub
3. Changes deploy automatically

## 📁 Data Bridge Configuration

Edit `data-bridge.py` to change the vault path:

```python
VAULT_PATH = "/mnt/d/Baro Brain"  # Change this to your vault path
```

## 🤝 Mission Statement

Build an autonomous organization of AI agents that do work for us and produce value 24/7.