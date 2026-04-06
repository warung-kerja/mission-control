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
VAULT_PATH = "/mnt/d/Warung Kerja 1.0"
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
    sync_hub = os.path.join(VAULT_PATH, "00_Sync_Hub")
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
    """Get all projects from projects.json"""
    try:
        # Try to read from projects.json in the current directory
        projects_file = os.path.join(os.path.dirname(__file__), 'projects.json')
        if os.path.exists(projects_file):
            with open(projects_file, 'r') as f:
                data = json.load(f)
                # Return the projects array from the JSON
                return jsonify(data.get('projects', []))
        
        # Fallback to reading from vault folders
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
    except Exception as e:
        print(f"Error loading projects: {e}")
        return jsonify([])

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

@app.route('/api/calendar')
def get_calendar():
    """Get calendar events from multiple sources"""
    events = []
    
    # Source 1: Manual entries from JSON file
    manual_path = os.path.join(VAULT_PATH, "calendar_entries.json")
    if os.path.exists(manual_path):
        try:
            with open(manual_path, 'r', encoding='utf-8') as f:
                manual_events = json.load(f)
                for event in manual_events:
                    event["source"] = "manual"
                    events.append(event)
        except:
            pass
    
    # Source 2: OpenClaw cron jobs
    cron_path = os.path.expanduser("~/.openclaw/cron/jobs.json")
    if os.path.exists(cron_path):
        try:
            with open(cron_path, 'r', encoding='utf-8') as f:
                cron_data = json.load(f)
                for job in cron_data.get("jobs", []):
                    if job.get("enabled", False):
                        schedule = job.get("schedule", {})
                        name = job.get("name", "Unnamed Job")
                        event = {
                            "id": job.get("id", ""),
                            "title": f"[CRON] {name}",
                            "date": "recurring",  # We'll need to parse cron expression
                            "type": "cron",
                            "source": "openclaw",
                            "color": "#8b5cf6",  # Purple accent
                            "description": f"Scheduled: {schedule.get('expr', 'N/A')}"
                        }
                        events.append(event)
        except Exception as e:
            print(f"Error reading cron: {e}")
    
    # Source 3: Tasks with dates from vault (to be implemented)
    # This would scan for tasks with due dates in frontmatter
    
    # Add some default events if empty
    if not events:
        events = [
            {"id": "1", "title": "Weekly Review", "date": "2026-03-20", "type": "meeting", "source": "manual", "color": "#10b981"},
            {"id": "2", "title": "Mission Control V0.6 Launch", "date": "2026-03-22", "type": "milestone", "source": "manual", "color": "#8b5cf6"},
            {"id": "3", "title": "Figma Template Review", "date": "2026-03-19", "type": "task", "source": "manual", "color": "#f59e0b"},
        ]
    
    return jsonify(events)

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

@app.route('/api/workspace/<agent_name>')
def get_workspace(agent_name):
    """Get workspace contents for an agent"""
    agent_workspace = os.path.join(VAULT_PATH, "06_Agents", agent_name)
    
    if not os.path.exists(agent_workspace):
        return jsonify({
            "error": f"Workspace not found for agent: {agent_name}",
            "path": agent_workspace
        }), 404
    
    try:
        contents = []
        for root, dirs, files in os.walk(agent_workspace):
            # Skip hidden directories
            dirs[:] = [d for d in dirs if not d.startswith('.')]
            
            for file in files:
                if file.startswith('.'):
                    continue
                    
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, agent_workspace)
                
                # Get file stats
                stat = os.stat(file_path)
                file_size = stat.st_size
                
                # Get file extension
                _, ext = os.path.splitext(file)
                ext = ext.lower()
                
                # Determine file type
                if ext in ['.md', '.txt', '.json', '.py', '.js', '.html', '.css']:
                    file_type = "text"
                elif ext in ['.jpg', '.jpeg', '.png', '.gif', '.svg']:
                    file_type = "image"
                else:
                    file_type = "other"
                
                contents.append({
                    "name": file,
                    "path": rel_path,
                    "type": file_type,
                    "size": file_size,
                    "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    "extension": ext if ext else "none"
                })
        
        # Sort by name
        contents.sort(key=lambda x: x["name"].lower())
        
        return jsonify({
            "agent": agent_name,
            "workspace_path": agent_workspace,
            "total_files": len(contents),
            "contents": contents
        })
        
    except Exception as e:
        return jsonify({
            "error": str(e),
            "agent": agent_name,
            "path": agent_workspace
        }), 500

@app.route('/api/workspace')
def list_workspaces():
    """List all agent workspaces"""
    agents_dir = os.path.join(VAULT_PATH, "06_Agents")
    
    if not os.path.exists(agents_dir):
        return jsonify({
            "error": "Agents directory not found",
            "path": agents_dir
        }), 404
    
    try:
        workspaces = []
        for item in os.listdir(agents_dir):
            item_path = os.path.join(agents_dir, item)
            if os.path.isdir(item_path):
                # Count files
                file_count = 0
                for root, dirs, files in os.walk(item_path):
                    # Skip hidden
                    dirs[:] = [d for d in dirs if not d.startswith('.')]
                    files = [f for f in files if not f.startswith('.')]
                    file_count += len(files)
                
                workspaces.append({
                    "name": item,
                    "path": item_path,
                    "file_count": file_count,
                    "is_agent": True
                })
        
        # Sort by name
        workspaces.sort(key=lambda x: x["name"].lower())
        
        return jsonify({
            "agents_directory": agents_dir,
            "total_workspaces": len(workspaces),
            "workspaces": workspaces
        })
        
    except Exception as e:
        return jsonify({
            "error": str(e),
            "path": agents_dir
        }), 500

@app.route('/api/file/<agent_name>/<path:file_path>')
def get_file_content(agent_name, file_path):
    """Get content of a specific file from an agent's workspace"""
    agent_workspace = os.path.join(VAULT_PATH, "06_Agents", agent_name)
    
    if not os.path.exists(agent_workspace):
        return jsonify({
            "error": f"Workspace not found for agent: {agent_name}",
            "path": agent_workspace
        }), 404
    
    # Construct full file path
    full_file_path = os.path.join(agent_workspace, file_path)
    
    # Security check: ensure the file is within the agent workspace
    try:
        full_file_path = os.path.normpath(full_file_path)
        if not full_file_path.startswith(os.path.normpath(agent_workspace)):
            return jsonify({
                "error": "Access denied: file path outside agent workspace",
                "agent": agent_name,
                "requested_path": file_path
            }), 403
    except Exception as e:
        return jsonify({
            "error": f"Path validation error: {str(e)}",
            "agent": agent_name,
            "requested_path": file_path
        }), 400
    
    if not os.path.exists(full_file_path):
        return jsonify({
            "error": f"File not found: {file_path}",
            "agent": agent_name,
            "full_path": full_file_path
        }), 404
    
    if not os.path.isfile(full_file_path):
        return jsonify({
            "error": f"Path is not a file: {file_path}",
            "agent": agent_name,
            "full_path": full_file_path
        }), 400
    
    try:
        # Get file info
        stat = os.stat(full_file_path)
        _, ext = os.path.splitext(full_file_path)
        ext = ext.lower()
        
        # Determine file type
        if ext in ['.md', '.txt', '.json', '.py', '.js', '.html', '.css', '.sh', '.yaml', '.yml', '.xml']:
            file_type = "text"
        elif ext in ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.bmp', '.webp']:
            file_type = "image"
        else:
            file_type = "other"
        
        # Read file content based on type
        if file_type == "text":
            # Read text files
            with open(full_file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            return jsonify({
                "agent": agent_name,
                "file_path": file_path,
                "name": os.path.basename(full_file_path),
                "type": file_type,
                "size": stat.st_size,
                "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                "extension": ext if ext else "none",
                "content": content,
                "mime_type": "text/plain"
            })
        elif file_type == "image":
            # For images, we could return base64 encoded content
            # But for now, just return file info
            return jsonify({
                "agent": agent_name,
                "file_path": file_path,
                "name": os.path.basename(full_file_path),
                "type": file_type,
                "size": stat.st_size,
                "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                "extension": ext if ext else "none",
                "content": None,
                "mime_type": f"image/{ext[1:]}" if ext else "image/*",
                "note": "Image content not served via API for security. Use direct file URL."
            })
        else:
            # For other file types, just return metadata
            return jsonify({
                "agent": agent_name,
                "file_path": file_path,
                "name": os.path.basename(full_file_path),
                "type": file_type,
                "size": stat.st_size,
                "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                "extension": ext if ext else "none",
                "content": None,
                "mime_type": "application/octet-stream",
                "note": "Binary file content not served via API."
            })
        
    except UnicodeDecodeError:
        return jsonify({
            "error": "File is not UTF-8 encoded text",
            "agent": agent_name,
            "file_path": file_path,
            "type": "binary"
        }), 400
    except Exception as e:
        return jsonify({
            "error": str(e),
            "agent": agent_name,
            "file_path": file_path
        }), 500

@app.route('/api/memories')
def get_all_memories():
    """Get memory files (MEMORY.md, SOUL.md, memory/ dir) for all agents"""
    agents_dir = os.path.join(VAULT_PATH, "06_Agents")
    MEMORY_FILENAMES = {'MEMORY.md', 'SOUL.md', 'IDENTITY.md', 'HEARTBEAT.md'}
    PREVIEW_LENGTH = 300

    if not os.path.exists(agents_dir):
        return jsonify({"error": "Agents directory not found", "path": agents_dir}), 404

    result = {}
    total_files = 0
    total_size = 0

    try:
        agents = sorted([
            d for d in os.listdir(agents_dir)
            if os.path.isdir(os.path.join(agents_dir, d))
        ])

        for agent in agents:
            agent_path = os.path.join(agents_dir, agent)
            agent_files = []

            # Collect top-level memory files
            for fname in MEMORY_FILENAMES:
                fpath = os.path.join(agent_path, fname)
                if os.path.isfile(fpath):
                    try:
                        stat = os.stat(fpath)
                        with open(fpath, 'r', encoding='utf-8', errors='replace') as f:
                            preview = f.read(PREVIEW_LENGTH)
                        agent_files.append({
                            "name": fname,
                            "path": f"{agent}/{fname}",
                            "type": "core",
                            "size": stat.st_size,
                            "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                            "preview": preview
                        })
                    except Exception:
                        pass

            # Collect files from memory/ subdirectory
            memory_subdir = os.path.join(agent_path, "memory")
            if os.path.isdir(memory_subdir):
                try:
                    for fname in sorted(os.listdir(memory_subdir)):
                        fpath = os.path.join(memory_subdir, fname)
                        if os.path.isfile(fpath) and fname.endswith('.md'):
                            try:
                                stat = os.stat(fpath)
                                with open(fpath, 'r', encoding='utf-8', errors='replace') as f:
                                    preview = f.read(PREVIEW_LENGTH)
                                agent_files.append({
                                    "name": fname,
                                    "path": f"{agent}/memory/{fname}",
                                    "type": "daily" if fname[:4].isdigit() else "general",
                                    "size": stat.st_size,
                                    "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                                    "preview": preview
                                })
                            except Exception:
                                pass
                except Exception:
                    pass

            if agent_files:
                total_files += len(agent_files)
                total_size += sum(f["size"] for f in agent_files)
                result[agent] = {
                    "files": agent_files,
                    "file_count": len(agent_files),
                    "total_size": sum(f["size"] for f in agent_files)
                }

        return jsonify({
            "agents": result,
            "agent_count": len(result),
            "total_files": total_files,
            "total_size": total_size,
            "generated_at": datetime.now().isoformat()
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    print("=" * 50)
    print("🚀 Warung-Kerja Mission Control Data Bridge")
    print("=" * 50)
    print(f"📁 Vault Path: {VAULT_PATH}")
    print(f"🌐 API URL: http://localhost:{PORT}")
    print(f"📋 Tasks Endpoint: http://localhost:{PORT}/api/tasks")
    print(f"📅 Calendar Endpoint: http://localhost:{PORT}/api/calendar")
    print(f"👥 Workspace Endpoint: http://localhost:{PORT}/api/workspace")
    print(f"👤 Agent Workspace: http://localhost:{PORT}/api/workspace/<agent_name>")
    print(f"📄 File Content: http://localhost:{PORT}/api/file/<agent_name>/<file_path>")
    print(f"🧠 Memories: http://localhost:{PORT}/api/memories")
    print("=" * 50)
    print("Press Ctrl+C to stop")
    print()
    
    app.run(host='0.0.0.0', port=PORT, debug=False)