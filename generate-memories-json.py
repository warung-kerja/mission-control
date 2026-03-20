#!/usr/bin/env python3
"""
Generate memories.json from memory files for Mission Control
"""

import os
import json
import glob
from datetime import datetime

# Configuration
VAULT_PATH = "/mnt/d/Warung Kerja 1.0"
MEMORY_DIR = os.path.join(VAULT_PATH, "06_Agents", "noona", "memory")
PROJECTS_DIR = os.path.join(VAULT_PATH, "06_Agents", "noona", "projects")
OUTPUT_FILE = "memories.json"

def get_file_preview(filepath, max_lines=5, max_chars=200):
    """Get preview of file content"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            preview_lines = []
            for i in range(max_lines):
                line = f.readline()
                if not line:
                    break
                # Remove markdown headers and clean up
                line = line.strip()
                if line.startswith('# '):
                    line = line[2:]
                preview_lines.append(line)
            
            preview = " ".join(preview_lines)
            if len(preview) > max_chars:
                preview = preview[:max_chars] + "..."
            return preview
    except:
        return "Could not read file"

def generate_memories_json():
    """Generate memories.json file"""
    print("🔍 Scanning memory files...")
    
    memory_files = []
    project_files = []
    
    # Scan memory directory
    if os.path.exists(MEMORY_DIR):
        for filename in sorted(os.listdir(MEMORY_DIR)):
            if filename.endswith('.md'):
                filepath = os.path.join(MEMORY_DIR, filename)
                stat = os.stat(filepath)
                
                # Determine if it's a daily log
                is_daily = filename.startswith('2026-')
                date_str = filename.replace('.md', '') if is_daily else None
                
                memory_files.append({
                    "name": filename,
                    "path": filepath,
                    "type": "daily" if is_daily else "other",
                    "size": stat.st_size,
                    "modified": stat.st_mtime,
                    "preview": get_file_preview(filepath),
                    "date": date_str
                })
        print(f"  Found {len(memory_files)} memory files")
    
    # Scan projects directory
    if os.path.exists(PROJECTS_DIR):
        for project_name in sorted(os.listdir(PROJECTS_DIR)):
            project_path = os.path.join(PROJECTS_DIR, project_name)
            if os.path.isdir(project_path):
                memory_file = os.path.join(project_path, "MEMORY.md")
                if os.path.exists(memory_file):
                    stat = os.stat(memory_file)
                    
                    project_files.append({
                        "name": f"{project_name}/MEMORY.md",
                        "path": memory_file,
                        "type": "project",
                        "project": project_name,
                        "size": stat.st_size,
                        "modified": stat.st_mtime,
                        "preview": get_file_preview(memory_file)
                    })
        print(f"  Found {len(project_files)} project memory files")
    
    # Add general MEMORY.md
    general_memory = os.path.join(VAULT_PATH, "06_Agents", "noona", "MEMORY.md")
    if os.path.exists(general_memory):
        stat = os.stat(general_memory)
        
        memory_files.append({
            "name": "MEMORY.md",
            "path": general_memory,
            "type": "general",
            "size": stat.st_size,
            "modified": stat.st_mtime,
            "preview": get_file_preview(general_memory)
        })
        print("  Found general MEMORY.md")
    
    # Create output structure
    output = {
        "generated_at": datetime.now().isoformat(),
        "memory_directory": MEMORY_DIR,
        "projects_directory": PROJECTS_DIR,
        "stats": {
            "total_daily_files": len([f for f in memory_files if f['type'] == 'daily']),
            "total_project_files": len(project_files),
            "total_general_files": len([f for f in memory_files if f['type'] == 'general']),
            "total_other_files": len([f for f in memory_files if f['type'] == 'other']),
            "total_files": len(memory_files) + len(project_files)
        },
        "memory_files": memory_files,
        "project_files": project_files
    }
    
    # Write to file
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Generated {OUTPUT_FILE} with {len(memory_files) + len(project_files)} memory files")
    print(f"📊 Stats: {output['stats']['total_daily_files']} daily, {output['stats']['total_project_files']} project, {output['stats']['total_general_files']} general")
    
    return output

if __name__ == '__main__':
    generate_memories_json()