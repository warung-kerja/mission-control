#!/usr/bin/env python3
"""
Generate workspace data for Mission Control
"""

import os
import json
from datetime import datetime

def get_workspace_contents(workspace_path):
    """Get contents of a workspace directory"""
    contents = []
    
    if not os.path.exists(workspace_path):
        return contents
    
    try:
        for root, dirs, files in os.walk(workspace_path):
            # Skip hidden directories
            dirs[:] = [d for d in dirs if not d.startswith('.')]
            
            for file in files:
                if file.startswith('.'):
                    continue
                    
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, workspace_path)
                
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
        
    except Exception as e:
        print(f"Error reading {workspace_path}: {e}")
    
    return contents

def main():
    """Main function"""
    vault_path = "/mnt/d/Warung Kerja 1.0"
    agents_dir = os.path.join(vault_path, "06_Agents")
    
    if not os.path.exists(agents_dir):
        print(f"Error: Agents directory not found: {agents_dir}")
        return
    
    workspaces_data = {}
    
    # List all agent workspaces
    for item in os.listdir(agents_dir):
        item_path = os.path.join(agents_dir, item)
        if os.path.isdir(item_path):
            print(f"Processing workspace: {item}")
            
            # Get workspace contents
            contents = get_workspace_contents(item_path)
            
            # Count files
            file_count = len(contents)
            
            workspaces_data[item] = {
                "name": item,
                "path": item_path,
                "file_count": file_count,
                "contents": contents,
                "last_updated": datetime.now().isoformat()
            }
    
    # Save to JSON file
    output_file = "workspaces.json"
    with open(output_file, 'w') as f:
        json.dump({
            "generated_at": datetime.now().isoformat(),
            "agents_directory": agents_dir,
            "total_workspaces": len(workspaces_data),
            "workspaces": workspaces_data
        }, f, indent=2)
    
    print(f"\n✅ Workspace data saved to {output_file}")
    print(f"📊 Total workspaces: {len(workspaces_data)}")
    
    # Print summary
    for agent, data in workspaces_data.items():
        print(f"  • {agent}: {data['file_count']} files")

if __name__ == "__main__":
    main()