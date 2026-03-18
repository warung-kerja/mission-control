#!/usr/bin/env python3
"""
Generate static calendar.json file from all data sources.
This script aggregates events from:
1. Manual calendar entries (JSON file)
2. OpenClaw cron jobs
3. Obsidian vault tasks with dates
"""

import json
import os
import sys
from datetime import datetime, timedelta
import re
from pathlib import Path

# Configuration
VAULT_PATH = "/mnt/d/Warung Kerja 1.0"
MANUAL_ENTRIES_PATH = "/mnt/d/Warung Kerja 1.0/calendar_entries.json"
CRON_JOBS_PATH = "/home/baro/.openclaw/cron/jobs.json"
OUTPUT_PATH = "/home/baro/.openclaw/workspace/mission-control/calendar.json"

def load_manual_entries():
    """Load manual calendar entries from JSON file."""
    try:
        if os.path.exists(MANUAL_ENTRIES_PATH):
            with open(MANUAL_ENTRIES_PATH, 'r') as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading manual entries: {e}")
    return []

def load_cron_jobs():
    """Load and parse OpenClaw cron jobs."""
    events = []
    try:
        if os.path.exists(CRON_JOBS_PATH):
            with open(CRON_JOBS_PATH, 'r') as f:
                cron_data = json.load(f)
            
            # Import croniter here to avoid dependency if not needed
            try:
                from croniter import croniter
                has_croniter = True
            except ImportError:
                print("Warning: croniter not installed, using simple cron parsing")
                has_croniter = False
            
            for job in cron_data.get('jobs', []):
                if not job.get('enabled', True):
                    continue
                
                job_id = job.get('id', 'unknown')
                name = job.get('name', f"Cron Job {job_id[:8]}")
                schedule = job.get('schedule', {})
                schedule_kind = schedule.get('kind')
                
                # Parse schedule based on type
                if schedule_kind == 'every':
                    every_ms = schedule.get('everyMs', 0)
                    if every_ms == 0:
                        continue
                    
                    # Convert ms to minutes
                    every_minutes = every_ms / (1000 * 60)
                    
                    if every_minutes < 30:
                        # Frequent job - show as [FREQ] event
                        events.append({
                            'title': f'[FREQ] {name}',
                            'start': datetime.now().isoformat(),
                            'end': (datetime.now() + timedelta(minutes=5)).isoformat(),
                            'type': 'cron',
                            'color': '#6b7280',  # gray
                            'description': f'Runs every {every_minutes:.1f} minutes'
                        })
                    else:
                        # Less frequent - show next occurrence
                        anchor_ms = schedule.get('anchorMs', 0)
                        if anchor_ms > 0:
                            anchor_time = datetime.fromtimestamp(anchor_ms / 1000)
                            next_time = anchor_time
                            while next_time < datetime.now():
                                next_time += timedelta(milliseconds=every_ms)
                            
                            events.append({
                                'title': name,
                                'start': next_time.isoformat(),
                                'end': (next_time + timedelta(minutes=5)).isoformat(),
                                'type': 'cron',
                                'color': '#3b82f6',  # blue
                                'description': f'Runs every {every_minutes/60:.1f} hours'
                            })
                
                elif schedule_kind == 'cron':
                    cron_expr = schedule.get('expr', '')
                    if cron_expr:
                        if has_croniter:
                            try:
                                base_time = datetime.now()
                                iter = croniter(cron_expr, base_time)
                                next_time = iter.get_next(datetime)
                                
                                events.append({
                                    'title': name,
                                    'start': next_time.isoformat(),
                                    'end': (next_time + timedelta(minutes=5)).isoformat(),
                                    'type': 'cron',
                                    'color': '#3b82f6',
                                    'description': f'Cron: {cron_expr}'
                                })
                            except Exception as e:
                                print(f"Error parsing cron expression {cron_expr}: {e}")
                        else:
                            # Simple fallback without croniter
                            events.append({
                                'title': name,
                                'start': datetime.now().isoformat(),
                                'end': (datetime.now() + timedelta(minutes=5)).isoformat(),
                                'type': 'cron',
                                'color': '#3b82f6',
                                'description': f'Cron: {cron_expr} (next run unknown)'
                            })
                
                elif schedule_kind == 'at':
                    at_time = schedule.get('at', '')
                    if at_time:
                        try:
                            event_time = datetime.fromisoformat(at_time.replace('Z', '+00:00'))
                            events.append({
                                'title': name,
                                'start': event_time.isoformat(),
                                'end': (event_time + timedelta(minutes=5)).isoformat(),
                                'type': 'cron',
                                'color': '#3b82f6'
                            })
                        except Exception as e:
                            print(f"Error parsing at time {at_time}: {e}")
    
    except Exception as e:
        print(f"Error loading cron jobs: {e}")
    
    return events

def parse_frontmatter(content):
    """Parse YAML frontmatter from markdown content."""
    frontmatter = {}
    if content.startswith('---'):
        parts = content.split('---', 2)
        if len(parts) >= 3:
            try:
                # Try to use yaml if available
                import yaml
                frontmatter = yaml.safe_load(parts[1])
            except ImportError:
                # Simple parsing without yaml
                lines = parts[1].strip().split('\n')
                for line in lines:
                    if ':' in line:
                        key, value = line.split(':', 1)
                        frontmatter[key.strip()] = value.strip().strip('"\'')
            except:
                pass
    return frontmatter or {}

def find_dates_in_text(text):
    """Find date-like patterns in text."""
    # Simple date patterns (YYYY-MM-DD, MM/DD/YYYY, etc.)
    date_patterns = [
        r'\b(\d{4})-(\d{1,2})-(\d{1,2})\b',  # YYYY-MM-DD
        r'\b(\d{1,2})/(\d{1,2})/(\d{4})\b',   # MM/DD/YYYY
        r'\b(\d{1,2})-(\d{1,2})-(\d{4})\b',   # DD-MM-YYYY
    ]
    
    dates = []
    for pattern in date_patterns:
        for match in re.finditer(pattern, text):
            dates.append(match.group(0))
    
    return dates

def scan_obsidian_vault():
    """Scan Obsidian vault for tasks with dates."""
    events = []
    sync_hub_path = os.path.join(VAULT_PATH, "00_Sync_Hub")
    
    if not os.path.exists(sync_hub_path):
        print(f"Sync Hub not found at {sync_hub_path}")
        return events
    
    try:
        for root, dirs, files in os.walk(sync_hub_path):
            for file in files:
                if file.endswith('.md'):
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                        
                        # Parse frontmatter
                        frontmatter = parse_frontmatter(content)
                        
                        # Check for dates in frontmatter
                        date_fields = ['date', 'due', 'scheduled', 'created', 'updated']
                        for field in date_fields:
                            if field in frontmatter:
                                date_str = str(frontmatter[field])
                                # Try to parse date
                                try:
                                    # Handle various date formats
                                    if 'T' in date_str:
                                        event_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                                    else:
                                        # Try common date formats
                                        for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%d-%m-%Y']:
                                            try:
                                                event_date = datetime.strptime(date_str, fmt)
                                                break
                                            except:
                                                continue
                                        else:
                                            continue
                                    
                                    # Create event
                                    title = frontmatter.get('title', os.path.splitext(file)[0])
                                    events.append({
                                        'title': title,
                                        'start': event_date.isoformat(),
                                        'end': (event_date + timedelta(hours=1)).isoformat(),
                                        'type': 'task',
                                        'color': '#10b981',  # green
                                        'description': f'From: {file}',
                                        'file': file
                                    })
                                except Exception as e:
                                    pass
                        
                        # Also check for dates in filename (e.g., Morning_Brief_2026-03-18.md)
                        filename_date_match = re.search(r'(\d{4}-\d{1,2}-\d{1,2})', file)
                        if filename_date_match:
                            try:
                                date_str = filename_date_match.group(1)
                                event_date = datetime.strptime(date_str, '%Y-%m-%d')
                                events.append({
                                    'title': os.path.splitext(file)[0],
                                    'start': event_date.isoformat(),
                                    'end': (event_date + timedelta(hours=1)).isoformat(),
                                    'type': 'task',
                                    'color': '#10b981',
                                    'description': f'Daily brief: {file}',
                                    'file': file
                                })
                            except:
                                pass
                        
                        # Also check for task items with dates in content
                        task_pattern = r'^- \[[ x]\] .*?\b(\d{4}-\d{1,2}-\d{1,2})\b'
                        for match in re.finditer(task_pattern, content, re.MULTILINE):
                            date_str = match.group(1)
                            try:
                                event_date = datetime.strptime(date_str, '%Y-%m-%d')
                                task_text = match.group(0)[6:]  # Remove "- [ ] "
                                events.append({
                                    'title': task_text[:50] + ('...' if len(task_text) > 50 else ''),
                                    'start': event_date.isoformat(),
                                    'end': (event_date + timedelta(hours=1)).isoformat(),
                                    'type': 'task',
                                    'color': '#10b981',
                                    'description': f'Task from: {file}',
                                    'file': file
                                })
                            except:
                                pass
                    
                    except Exception as e:
                        print(f"Error reading {file_path}: {e}")
    
    except Exception as e:
        print(f"Error scanning vault: {e}")
    
    return events

def normalize_event(event):
    """Normalize event to consistent format for frontend."""
    normalized = event.copy()
    
    # Ensure we have an id
    if 'id' not in normalized:
        import hashlib
        event_str = json.dumps(event, sort_keys=True)
        event_hash = hashlib.md5(event_str.encode()).hexdigest()[:8]
        normalized['id'] = f"event-{event_hash}"
    
    # Convert start/end to date if needed
    if 'start' in normalized and 'date' not in normalized:
        try:
            start_date = datetime.fromisoformat(normalized['start'].replace('Z', '+00:00'))
            normalized['date'] = start_date.strftime('%Y-%m-%d')
        except:
            normalized['date'] = normalized.get('start', '')
    
    # Ensure type field
    if 'type' not in normalized:
        normalized['type'] = 'task'
    
    # Add source field if not present
    if 'source' not in normalized:
        # Determine source based on event characteristics
        if normalized.get('type') == 'cron':
            normalized['source'] = 'openclaw'
        elif 'file' in normalized:
            normalized['source'] = 'obsidian'
        else:
            normalized['source'] = 'manual'
    
    # Ensure color field
    if 'color' not in normalized:
        # Assign colors based on type
        color_map = {
            'meeting': '#10b981',
            'task': '#f59e0b',
            'milestone': '#8b5cf6',
            'cron': '#3b82f6',
            'default': '#6b7280'
        }
        normalized['color'] = color_map.get(normalized['type'], color_map['default'])
    
    return normalized

def main():
    """Main function to generate calendar.json."""
    print("Generating calendar.json from all data sources...")
    
    # Load events from all sources
    manual_events = load_manual_entries()
    cron_events = load_cron_jobs()
    obsidian_events = scan_obsidian_vault()
    
    # Combine all events
    all_events = manual_events + cron_events + obsidian_events
    
    # Normalize all events
    normalized_events = [normalize_event(event) for event in all_events]
    
    # Sort by date
    normalized_events.sort(key=lambda x: x.get('date', ''))
    
    # Create output structure
    output = {
        'events': normalized_events,
        'generated_at': datetime.now().isoformat(),
        'counts': {
            'manual': len(manual_events),
            'cron': len(cron_events),
            'obsidian': len(obsidian_events),
            'total': len(all_events)
        }
    }
    
    # Write to file
    try:
        with open(OUTPUT_PATH, 'w') as f:
            json.dump(output, f, indent=2)
        print(f"Successfully generated {OUTPUT_PATH}")
        print(f"Total events: {len(all_events)} (manual: {len(manual_events)}, cron: {len(cron_events)}, obsidian: {len(obsidian_events)})")
    except Exception as e:
        print(f"Error writing output: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()