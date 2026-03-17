#!/usr/bin/env python3
"""
Warung-Kerja Mission Control Data Bridge
Reads from Obsidian vault and serves data via local API
"""

from flask import Flask, jsonify
from flask_cors import CORS
import os
import json
import glob
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
VAULT_PATH = "/mnt/d/Baro Brain"
PORT = 3001

@app.route('/api/health')
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "online",
        "timestamp": datetime.now().isoformat(),
        "vault_path": VAULT_PATH
    })

@app.route('/api/tasks')
def get_tasks():
    """Get all tasks from the vault"""
    tasks = []
    
    # Scan for task files in Sync Hub
    sync_hub = os.path.join(VAULT_PATH, "00_🔄_Sync_Hub")
    if os.path.exists(sync_hub):
        for file in glob.glob(os.path.join(sync_hub, "*.md")):
            with open(file, 'r', encoding='utf-8') as f:
                content = f.read()
                filename = os.path.basename(file)
                tasks.append({
                    "id": filename.replace('.md', ''),
                    "title": content.split('\n')[0].replace('# ', ''),
                    "status": "backlog",
                    "assignee": "Baro",
                    "priority": "medium",
                    "source": filename
                })
    
    # Add some default tasks if vault is empty
    if not tasks:
        tasks = [
            {"id": "1", "title": "Build Calendar module", "status": "backlog", "assignee": "Baro", "priority": "medium"},
            {"id": "2", "title": "Build Projects tracker", "status": "backlog", "assignee": "Baro", "priority": "low"},
            {"id": "3", "title": "Build Data Bridge", "status": "done", "assignee": "Baro", "priority": "high"},
            {"id": "4", "title": "Mission Control V0.5", "status": "done", "assignee": "Baro", "priority": "high"},
        ]
    
    return jsonify(tasks)

@app.route('/api/projects')
def get_projects():
    """Get all projects from the vault"""
    projects = []
    
    projects_path = os.path.join(VAULT_PATH, "03_🚀_Active_Projects")
    if os.path.exists(projects_path):
        for folder in os.listdir(projects_path):
            folder_path = os.path.join(projects_path, folder)
            if os.path.isdir(folder_path):
                projects.append({
                    "id": folder,
                    "name": folder.replace('_', ' '),
                    "status": "active",
                    "progress": 0
                })
    
    return jsonify(projects)

@app.route('/api/activity')
def get_activity():
    """Get recent activity"""
    activities = [
        {
            "time": datetime.now().strftime("%H:%M"),
            "message": "Data Bridge started",
            "agent": "System"
        },
        {
            "time": "17:15",
            "message": "Task Board V0.5 deployed",
            "agent": "Baro the Creator"
        },
        {
            "time": "15:30",
            "message": "Building Task Board module",
            "agent": "Baro the Creator"
        }
    ]
    return jsonify(activities)

@app.route('/api/vault/status')
def vault_status():
    """Check vault connectivity"""
    exists = os.path.exists(VAULT_PATH)
    folders = []
    
    if exists:
        try:
            folders = [f for f in os.listdir(VAULT_PATH) if os.path.isdir(os.path.join(VAULT_PATH, f))]
        except:
            pass
    
    return jsonify({
        "connected": exists,
        "path": VAULT_PATH,
        "folders": folders
    })

if __name__ == '__main__':
    print("=" * 50)
    print("🚀 Warung-Kerja Mission Control Data Bridge")
    print("=" * 50)
    print(f"📁 Vault Path: {VAULT_PATH}")
    print(f"🌐 API URL: http://localhost:{PORT}")
    print(f"📋 Tasks Endpoint: http://localhost:{PORT}/api/tasks")
    print("=" * 50)
    print("Press Ctrl+C to stop")
    print()
    
    app.run(host='0.0.0.0', port=PORT, debug=False)