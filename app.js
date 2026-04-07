// Tab switching
function showTab(tabName, event) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabName + '-tab').style.display = 'block';
    
    // Add active class to clicked button
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        // Fallback: find button with matching onclick
        document.querySelectorAll('.nav-tab').forEach(button => {
            if (button.getAttribute('onclick') && button.getAttribute('onclick').includes(tabName)) {
                button.classList.add('active');
            }
        });
    }

    // Clear notification dot when tab is visited
    _clearTabNotif(tabName);
}

// Drag and drop
let draggedElement = null;

document.querySelectorAll('.task-card').forEach(card => {
    card.addEventListener('dragstart', function(e) {
        draggedElement = this;
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    });
    
    card.addEventListener('dragend', function() {
        this.classList.remove('dragging');
        draggedElement = null;
        updateCounts();
    });
});

document.querySelectorAll('.kanban-column').forEach(column => {
    column.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    });
    
    column.addEventListener('drop', function(e) {
        e.preventDefault();
        if (draggedElement) {
            const container = this.querySelector('.tasks-container');
            container.appendChild(draggedElement);
            addActivity(`Task moved to ${this.querySelector('.kanban-title').textContent}`);
        }
    });
});

function updateCounts() {
    document.querySelectorAll('.kanban-column').forEach(column => {
        const count = column.querySelectorAll('.task-card').length;
        column.querySelector('.kanban-count').textContent = count;
    });
}

function addActivity(message) {
    const activityList = document.getElementById('activity-list');
    const time = new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
    const newActivity = document.createElement('div');
    newActivity.className = 'activity-item';
    newActivity.innerHTML = `
        <div class="activity-time">${time}</div>
        <div>${message}</div>
        <div class="activity-agent">Baro the Creator</div>
    `;
    activityList.insertBefore(newActivity, activityList.firstChild);
}

function addTask(column) {
    const title = prompt('Task title:');
    if (title) {
        const columnEl = document.querySelector(`[data-status="${column}"] .tasks-container`);
        const newTask = document.createElement('div');
        newTask.className = 'task-card';
        newTask.draggable = true;
        newTask.innerHTML = `
            <div class="task-title">${title}</div>
            <div class="task-meta">
                <div class="task-assignee">
                    <div class="assignee-avatar">R</div>
                    <span>Raz</span>
                </div>
                <span class="task-priority priority-medium">Medium</span>
            </div>
        `;
        
        newTask.addEventListener('dragstart', function(e) {
            draggedElement = this;
            this.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });
        
        newTask.addEventListener('dragend', function() {
            this.classList.remove('dragging');
            draggedElement = null;
            updateCounts();
        });
        
        columnEl.appendChild(newTask);
        updateCounts();
        addActivity(`New task created: ${title}`);
    }
}

// Auto-refresh activity feed
setInterval(() => {
    const messages = [
        'Scanning passive income opportunities...',
        'Checking project status...',
        'Syncing with vault...',
        'Agent heartbeat check...'
    ];
    if (Math.random() > 0.7) {
        addActivity(messages[Math.floor(Math.random() * messages.length)]);
    }
}, 30000);

// Calendar Module
let currentDate = new Date();
let calendarEvents = [];

async function fetchCalendarEvents() {
    try {
        // Fetch from static calendar.json file
        const response = await fetch('calendar.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        calendarEvents = data.events || [];
        renderCalendar();
        renderOverview();
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        calendarEvents = [];
        renderCalendar();
    }
}

function getEventsForDate(date) {
    const dateStr = date.toISOString().split('T')[0];
    return calendarEvents.filter(event => event.date === dateStr);
}

function renderCalendar() {
    const calendarGrid = document.getElementById('calendar-grid');
    if (!calendarGrid) return;
    
    calendarGrid.innerHTML = '';
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Update month header
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('current-month').textContent = `${monthNames[month]} ${year}`;
    
    // Get first day of month and how many days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Day of week for first day (0 = Sunday, 6 = Saturday)
    const firstDayIndex = firstDay.getDay();
    
    // Add empty cells for days before first day of month
    for (let i = 0; i < firstDayIndex; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyDay);
    }
    
    // Add days of the month
    const today = new Date();
    const todayStr = today.toDateString();
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDate = new Date(year, month, day);
        const dayStr = dayDate.toDateString();
        const dateStr = dayDate.toISOString().split('T')[0];
        const isToday = dayStr === todayStr;
        
        const dayElement = document.createElement('div');
        dayElement.className = `calendar-day ${isToday ? 'today' : ''}`;
        dayElement.dataset.date = dateStr;
        
        const dayNumber = document.createElement('div');
        dayNumber.className = 'calendar-day-number';
        dayNumber.textContent = day;
        
        const eventsContainer = document.createElement('div');
        eventsContainer.className = 'calendar-day-events';
        
        const eventsForDay = getEventsForDate(dayDate);
        eventsForDay.slice(0, 2).forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = 'calendar-event';
            eventElement.textContent = event.title;
            eventElement.style.backgroundColor = event.color;
            eventsContainer.appendChild(eventElement);
        });
        
        if (eventsForDay.length > 2) {
            const moreElement = document.createElement('div');
            moreElement.className = 'calendar-event';
            moreElement.textContent = `+${eventsForDay.length - 2} more`;
            moreElement.style.backgroundColor = '#6b7280';
            eventsContainer.appendChild(moreElement);
        }
        
        dayElement.appendChild(dayNumber);
        dayElement.appendChild(eventsContainer);
        
        dayElement.addEventListener('click', () => selectDate(dayDate));
        calendarGrid.appendChild(dayElement);
    }
    
    // Select today's date by default
    selectDate(today);
}

function selectDate(date) {
    const dateStr = date.toDateString();
    document.getElementById('selected-date').textContent = dateStr;
    
    const eventsList = document.getElementById('events-list');
    eventsList.innerHTML = '';
    
    const eventsForDate = getEventsForDate(date);
    
    if (eventsForDate.length === 0) {
        eventsList.innerHTML = '<div class="event-item"><div class="event-title">No events scheduled</div><div class="event-meta">Add an event in calendar_entries.json</div></div>';
        return;
    }
    
    eventsForDate.forEach(event => {
        const eventElement = document.createElement('div');
        eventElement.className = 'event-item';
        eventElement.style.borderLeftColor = event.color;
        
        const title = document.createElement('div');
        title.className = 'event-title';
        title.textContent = event.title;
        
        const meta = document.createElement('div');
        meta.className = 'event-meta';
        meta.textContent = `${event.type.charAt(0).toUpperCase() + event.type.slice(1)} • ${event.source}`;
        
        eventElement.appendChild(title);
        eventElement.appendChild(meta);
        eventsList.appendChild(eventElement);
    });
}

// Initialize calendar when page loads
document.addEventListener('DOMContentLoaded', () => {
    fetchCalendarEvents();
    
    document.getElementById('prev-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    document.getElementById('next-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    // Also render calendar when tab is switched (in case it's not active initially)
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            if (button.getAttribute('onclick').includes('calendar')) {
                renderCalendar();
            }
        });
    });
});

// Projects Module JavaScript
let allProjects = [];
let projectsCurrentFilter = 'all';

async function loadProjects() {
    // Try live API first, fall back to static projects.json
    let data = null;
    try {
        const response = await fetch('http://localhost:3001/api/projects');
        if (response.ok) data = await response.json();
    } catch (_) {}

    if (!data) {
        try {
            const response = await fetch('projects.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const json = await response.json();
            // projects.json wraps array in { projects: [...] }
            data = json.projects || json;
        } catch (error) {
            console.error('Failed to load projects:', error);
            data = [];
        }
    }

    allProjects = Array.isArray(data) ? data : [];
    renderProjects();
    updateStats();
    renderOverview();
}

function renderProjects() {
    const grid = document.getElementById('projects-grid');
    if (!grid) return;
    
    const filteredProjects = allProjects.filter(project => {
        if (projectsCurrentFilter === 'all') return true;
        return project.status === projectsCurrentFilter;
    });
    
    if (filteredProjects.length === 0) {
        grid.innerHTML = `
            <div class="no-projects" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-secondary);">
                <p>No projects found with status: ${projectsCurrentFilter}</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = filteredProjects.map(project => `
        <div class="project-card" data-status="${project.status}">
            <div class="project-header">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 1.2rem;">${project.icon || '📋'}</span>
                    <h3 class="project-title">${project.name}</h3>
                </div>
                <span class="project-status status-${project.status}" style="background: ${project.color || '#6366f1'};">
                    ${project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </span>
            </div>
            <p class="project-description">${project.description || 'No description available'}</p>
            ${project.currentPhase ? `<div style="font-size:0.75rem;color:var(--accent-color);margin-bottom:0.5rem;padding:0.25rem 0.5rem;background:rgba(99,102,241,0.1);border-radius:4px;">⚡ ${project.currentPhase}</div>` : ''}
            ${project.liveNotes ? `<div style="font-size:0.72rem;color:var(--text-secondary);margin-bottom:0.5rem;font-style:italic;">📝 ${project.liveNotes.substring(0,100)}${project.liveNotes.length>100?'…':''}</div>` : ''}

            <div class="project-progress">
                <div class="progress-label">
                    <span>Progress</span>
                    <span>${project.progress || 0}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${project.progress || 0}%; background: ${project.color || '#6366f1'}"></div>
                </div>
            </div>
            
            <div style="margin-top: 1rem; font-size: 0.85rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span><strong>Lead:</strong> ${project.lead || 'Unassigned'}</span>
                    <span><strong>Version:</strong> ${project.version || 'V0.1'}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span><strong>Start:</strong> ${project.startDate || 'TBD'}</span>
                    <span><strong>Due:</strong> ${project.dueDate || 'TBD'}</span>
                </div>
            </div>
            
            ${project.features && project.features.length > 0 ? `
            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.5rem;">Features:</div>
                <div style="display: flex; flex-wrap: wrap; gap: 0.3rem;">
                    ${project.features.slice(0, 3).map(feature => `
                        <span style="font-size: 0.7rem; padding: 0.2rem 0.5rem; background: var(--card-bg); border-radius: 4px; border: 1px solid var(--border-color);">
                            ${feature.name}
                        </span>
                    `).join('')}
                    ${project.features.length > 3 ? `<span style="font-size: 0.7rem; padding: 0.2rem 0.5rem; color: var(--text-secondary);">+${project.features.length - 3} more</span>` : ''}
                </div>
            </div>
            ` : ''}
            
            <div class="project-meta">
                <span>Updated: ${project.lastUpdated ? new Date(project.lastUpdated).toLocaleDateString() : 'Unknown'}</span>
            </div>
        </div>
    `).join('');
}

function updateStats() {
    const total = allProjects.length;
    const active = allProjects.filter(p => p.status === 'active').length;
    const avgProgress = allProjects.length > 0 
        ? Math.round(allProjects.reduce((sum, p) => sum + (p.progress || 0), 0) / allProjects.length)
        : 0;
    
    document.getElementById('total-projects').textContent = total;
    document.getElementById('active-projects').textContent = active;
    document.getElementById('avg-progress').textContent = `${avgProgress}%`;
}

function setupProjectFilters() {
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            projectsCurrentFilter = this.getAttribute('data-filter');
            renderProjects();
        });
    });
}

// Initialize projects when page loads
document.addEventListener('DOMContentLoaded', () => {
    setupProjectFilters();

    // Refresh projects data when switching to projects tab
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            if (this.getAttribute('onclick') && this.getAttribute('onclick').includes('projects')) {
                setTimeout(() => { loadProjects(); }, 100);
            }
        });
    });
});

// Workspace Explorer Functions
let workspaceData = null;
let currentWorkspace = null;

// Load workspace data
// Cache for workspace data to avoid repeated loading
let workspaceDataCache = null;
let workspaceDataCacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

async function loadWorkspaceData(forceRefresh = false) {
    // Check cache first
    const now = Date.now();
    if (!forceRefresh && workspaceDataCache && workspaceDataCacheTime && 
        (now - workspaceDataCacheTime) < CACHE_DURATION) {
        console.log('Using cached workspace data');
        workspaceData = workspaceDataCache;
        return;
    }
    
    try {
        // Add cache-busting parameter if forcing refresh
        const url = forceRefresh ? 'workspaces.json?t=' + now : 'workspaces.json';
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        workspaceData = await response.json();
        
        // Update cache
        workspaceDataCache = workspaceData;
        workspaceDataCacheTime = now;
        
        console.log('Workspace data loaded:', workspaceData);
    } catch (error) {
        console.error('Error loading workspace data:', error);
        
        // Try to use cache even if expired when network fails
        if (workspaceDataCache) {
            console.log('Network error, using stale cache');
            workspaceData = workspaceDataCache;
        } else {
            // Fallback to empty data
            workspaceData = {
                workspaces: {},
                generated_at: new Date().toISOString()
            };
        }
    }
}

// Function to manually refresh workspace data
function refreshWorkspaceData() {
    console.log('Manually refreshing workspace data...');
    loadWorkspaceData(true).then(() => {
        // If we're currently viewing a workspace, refresh it
        if (currentWorkspace) {
            showWorkspace(currentWorkspace);
        }
        // Show notification
        showNotification('Workspace data refreshed', 'success');
    }).catch(error => {
        console.error('Failed to refresh workspace data:', error);
        showNotification('Failed to refresh workspace data', 'error');
    });
}

// Show workspace contents
function showWorkspace(agentName) {
    // Show loading indicator
    document.getElementById('workspace-content').innerHTML = `
        <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
            <div style="font-size: 2rem; margin-bottom: 1rem;">
                <div class="loading-spinner" style="display: inline-block; width: 40px; height: 40px; border: 3px solid rgba(99, 102, 241, 0.3); border-radius: 50%; border-top-color: var(--accent); animation: spin 1s linear infinite;"></div>
            </div>
            <div>Loading workspace data...</div>
            <div style="font-size: 0.8rem; margin-top: 0.5rem;">Fetching ${agentName}'s files</div>
        </div>
    `;
    
    if (!workspaceData) {
        setTimeout(() => {
            alert('Workspace data not loaded yet. Please wait...');
        }, 100);
        return;
    }
    
    const workspace = workspaceData.workspaces[agentName];
    if (!workspace) {
        document.getElementById('workspace-content').innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                <div style="font-size: 2rem; margin-bottom: 1rem;">❌</div>
                <div>Workspace not found: ${agentName}</div>
            </div>
        `;
        document.getElementById('workspace-stats').textContent = `Workspace not found: ${agentName}`;
        return;
    }
    
    currentWorkspace = agentName;
    
    // Update active tab
    document.querySelectorAll('.workspace-tab').forEach(tab => {
        tab.style.opacity = '0.7';
        tab.style.transform = 'scale(0.95)';
    });
    event.target.style.opacity = '1';
    event.target.style.transform = 'scale(1)';
    
    // Render workspace contents
    renderWorkspace(workspace);
    
    // Update stats
    document.getElementById('workspace-stats').textContent = 
        `${workspace.file_count} files • ${workspace.contents.length} items • Updated: ${new Date(workspace.last_updated).toLocaleTimeString()}`;
}

// Render workspace contents
function renderWorkspace(workspace, workspaceName = currentWorkspace) {
    const container = document.getElementById('workspace-content');
    
    if (!workspace.contents || workspace.contents.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                <div style="font-size: 2rem; margin-bottom: 1rem;">📂</div>
                <div>Workspace is empty</div>
                <div style="font-size: 0.8rem; margin-top: 0.5rem;">No files found in ${workspace.name}</div>
            </div>
        `;
        return;
    }
    
    // Group files by directory
    const filesByDir = {};
    workspace.contents.forEach(file => {
        const dir = file.path.includes('/') ? file.path.split('/')[0] : '/';
        if (!filesByDir[dir]) {
            filesByDir[dir] = [];
        }
        filesByDir[dir].push(file);
    });
    
    // Sort directories
    const sortedDirs = Object.keys(filesByDir).sort();
    
    let html = '<div style="display: flex; flex-direction: column; gap: 1rem;">';
    
    sortedDirs.forEach(dir => {
        const files = filesByDir[dir];
        
        html += `
            <div style="background: rgba(0,0,0,0.1); border-radius: 8px; padding: 1rem;">
                <div style="font-weight: bold; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                    <span>📁</span>
                    <span>${dir === '/' ? 'Root' : dir}</span>
                    <span style="font-size: 0.8rem; opacity: 0.7; margin-left: auto;">${files.length} files</span>
                </div>
                <div class="file-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem;">
        `;
        
        files.forEach(file => {
            // Determine icon and color based on file type
            let icon = '📄';
            let color = '#94a3b8';
            
            if (file.type === 'text') {
                icon = '📝';
                color = '#10b981';
            } else if (file.type === 'image') {
                icon = '🖼️';
                color = '#8b5cf6';
            }
            
            // Format file size
            let sizeText = '';
            if (file.size < 1024) {
                sizeText = `${file.size} B`;
            } else if (file.size < 1024 * 1024) {
                sizeText = `${(file.size / 1024).toFixed(1)} KB`;
            } else {
                sizeText = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
            }
            
            html += `
                <div class="file-item" onclick="showFilePreview(${JSON.stringify(file).replace(/"/g, '&quot;')}, '${workspaceName}')" 
                     style="background: rgba(0,0,0,0.2); border-radius: 6px; padding: 0.75rem; border-left: 3px solid ${color}; cursor: pointer; transition: all 0.2s; opacity: 0;"
                     onmouseover="this.style.transform='translateY(-2px)'; this.style.background='rgba(0,0,0,0.3)';"
                     onmouseout="this.style.transform='translateY(0)'; this.style.background='rgba(0,0,0,0.2)';"
                     title="Click to preview ${file.name}">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                        <span>${icon}</span>
                        <div style="font-weight: 500; font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${file.name}">
                            ${file.name}
                        </div>
                    </div>
                    <div style="font-size: 0.7rem; opacity: 0.7; display: flex; justify-content: space-between;">
                        <span>${file.extension}</span>
                        <span>${sizeText}</span>
                    </div>
                    <div style="font-size: 0.65rem; opacity: 0.6; margin-top: 0.25rem;">
                        ${new Date(file.modified).toLocaleDateString()}
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Add fade-in effect to file items
    setTimeout(() => {
        const fileItems = container.querySelectorAll('.file-grid > div');
        fileItems.forEach((item, index) => {
            item.style.animationDelay = `${index * 0.05}s`;
            item.classList.add('fade-in');
        });
    }, 10);
}

// Filter workspace files based on search and type
function filterWorkspaceFiles() {
    if (!currentWorkspace || !workspaceData) return;
    
    const searchTerm = document.getElementById('workspace-search').value.toLowerCase();
    const filterType = document.getElementById('workspace-filter-type').value;
    const workspace = workspaceData.workspaces[currentWorkspace];
    
    if (!workspace || !workspace.contents) return;
    
    // Filter files
    const filteredFiles = workspace.contents.filter(file => {
        // Filter by type
        if (filterType !== 'all' && file.type !== filterType) {
            return false;
        }
        
        // Filter by search term
        if (searchTerm) {
            const searchIn = `${file.name} ${file.path} ${file.extension} ${file.type}`.toLowerCase();
            return searchIn.includes(searchTerm);
        }
        
        return true;
    });
    
    // Create a temporary workspace object with filtered contents
    const filteredWorkspace = {
        ...workspace,
        contents: filteredFiles
    };
    
    // Re-render with filtered files
    renderWorkspace(filteredWorkspace, currentWorkspace);
    
    // Update stats
    const totalFiles = workspace.contents.length;
    const shownFiles = filteredFiles.length;
    document.getElementById('workspace-stats').textContent = 
        `${shownFiles} of ${totalFiles} files • ${filterType !== 'all' ? filterType + ' only • ' : ''}${searchTerm ? 'search: "' + searchTerm + '" • ' : ''}Updated: ${new Date().toLocaleTimeString()}`;
}

// Clear all filters
function clearWorkspaceFilters() {
    document.getElementById('workspace-search').value = '';
    document.getElementById('workspace-filter-type').value = 'all';
    
    if (currentWorkspace && workspaceData) {
        const workspace = workspaceData.workspaces[currentWorkspace];
        if (workspace) {
            renderWorkspace(workspace);
            document.getElementById('workspace-stats').textContent = 
                `${workspace.file_count} files • ${workspace.contents.length} items • Updated: ${new Date(workspace.last_updated).toLocaleTimeString()}`;
        }
    }
}

// ====================
// AUTO-REFRESH MODULE
// ====================
const REFRESH_INTERVAL_MS = 60000; // 60 seconds
let _lastRefreshTime = null;
let _refreshTimer = null;
let _refreshing = false;

function _setRefreshPill(state) {
    const pill  = document.getElementById('refresh-pill');
    const dot   = document.getElementById('refresh-dot');
    const label = document.getElementById('refresh-label');
    if (!pill) return;

    if (state === 'loading') {
        pill.classList.add('refreshing');
        if (dot) dot.className = 'refresh-dot';
        if (label) label.textContent = 'Refreshing…';
    } else if (state === 'done') {
        pill.classList.remove('refreshing');
        _lastRefreshTime = Date.now();
        _updateRefreshLabel();
    } else if (state === 'stale') {
        if (dot) dot.className = 'refresh-dot stale';
    }
}

function _updateRefreshLabel() {
    const label = document.getElementById('refresh-label');
    if (!label || !_lastRefreshTime) return;
    const sec = Math.round((Date.now() - _lastRefreshTime) / 1000);
    if (sec < 10)        label.textContent = 'Just now';
    else if (sec < 60)   label.textContent = `${sec}s ago`;
    else if (sec < 3600) label.textContent = `${Math.floor(sec / 60)}m ago`;
    else                 label.textContent = `${Math.floor(sec / 3600)}h ago`;

    const dot = document.getElementById('refresh-dot');
    if (dot) dot.className = sec > 90 ? 'refresh-dot stale' : 'refresh-dot';
}

async function _doRefresh() {
    if (_refreshing) return;
    _refreshing = true;
    _setRefreshPill('loading');
    try {
        await Promise.allSettled([
            loadTeamData(),
            fetchCalendarEvents(),
            loadProjects(),
            loadMemories()
        ]);
    } finally {
        _refreshing = false;
        _setRefreshPill('done');
    }
}

function manualRefresh() {
    _doRefresh();
    // Reset the timer so next auto-refresh is 60s from now
    if (_refreshTimer) clearInterval(_refreshTimer);
    _refreshTimer = setInterval(_doRefresh, REFRESH_INTERVAL_MS);
}

function _startAutoRefresh() {
    // Update the "X ago" label every 15s without full data reload
    setInterval(_updateRefreshLabel, 15000);
    // First auto-refresh after initial load completes
    _refreshTimer = setInterval(_doRefresh, REFRESH_INTERVAL_MS);
}

// ====================
// HEARTBEAT MODULE
// ====================
let heartbeatData = null;
const HEARTBEAT_INTERVAL_MS = 30000; // 30s — faster than general refresh

async function loadHeartbeat() {
    try {
        const res = await fetch('http://localhost:3001/api/heartbeat');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        heartbeatData = await res.json();
        renderHeartbeat();
    } catch (_) {
        // Graceful degradation — heartbeat only works locally
    }
}

function _hbStatusDot(status) {
    const map = { online: '#22c55e', away: '#f59e0b', idle: '#f59e0b', offline: '#6b7280' };
    const color = map[status] || map.offline;
    const pulse = status === 'online' ? 'animation:pulse 2s infinite;' : '';
    return `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};${pulse}flex-shrink:0;"></span>`;
}

function _hbTimeAgo(isoStr) {
    if (!isoStr) return 'unknown';
    try {
        const diff = (Date.now() - new Date(isoStr).getTime()) / 1000;
        if (diff < 60)   return 'just now';
        if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
        return `${Math.floor(diff/86400)}d ago`;
    } catch(_) { return ''; }
}

function renderHeartbeat() {
    if (!heartbeatData || !heartbeatData.agents) return;
    const agents = heartbeatData.agents;

    // --- Update Overview "Team Now" panel ---
    const teamList = document.getElementById('ov-team-list');
    if (teamList) {
        const agentNames = Object.keys(agents);
        if (agentNames.length) {
            teamList.innerHTML = agentNames.map(name => {
                const a = agents[name];
                const focus = a.currentFocus || 'Idle';
                const task  = a.currentTask  || a.cycleSummary || '';
                const since = _hbTimeAgo(a.lastSeen);
                return `
                <div style="display:flex;gap:0.75rem;align-items:flex-start;padding:0.75rem;background:rgba(0,0,0,0.2);border-radius:8px;margin-bottom:0.5rem;">
                    <div style="font-size:1.5rem;flex-shrink:0;">${_agentEmoji(name)}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:0.4rem;font-weight:600;font-size:0.9rem;">
                            ${_hbStatusDot(a.status)} ${name}
                            <span style="font-size:0.7rem;color:var(--text-secondary);font-weight:400;margin-left:auto;">${since}</span>
                        </div>
                        <div style="font-size:0.78rem;color:var(--accent-color);margin-top:0.15rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                            🎯 ${focus}
                        </div>
                        ${task ? `<div style="font-size:0.72rem;color:var(--text-secondary);margin-top:0.1rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${task.substring(0,80)}</div>` : ''}
                    </div>
                </div>`;
            }).join('');
        }
    }

    // --- Update Team tab member cards with live "currently working on" ---
    Object.entries(agents).forEach(([name, a]) => {
        // Find activity element in team card by data attribute
        const el = document.querySelector(`[data-agent-activity="${name}"]`);
        if (el && a.currentTask) {
            el.textContent = a.currentTask.substring(0, 100);
        }
        // Update status dot in team card
        const dotEl = document.querySelector(`[data-agent-status="${name}"]`);
        if (dotEl) {
            dotEl.style.background = a.status === 'online' ? '#10b981' : a.status === 'away' ? '#f59e0b' : '#6b7280';
        }
    });

    // --- Render Up Next panel ---
    renderUpNext();

    // --- Update Office tab desk activity bubbles ---
    Object.entries(agents).forEach(([name, a]) => {
        const bubble = document.querySelector(`[data-office-bubble="${name}"]`);
        if (bubble && a.currentTask) {
            bubble.textContent = a.currentTask.substring(0, 60) + (a.currentTask.length > 60 ? '…' : '');
        }
    });

    // --- Add live indicator to ov-online-count ---
    _ovTeamStats();
}

function _agentEmoji(name) {
    const map = { Baro: '🎨', noona: '⚡', Raz: '👑', raz: '👑' };
    return map[name] || map[name.charAt(0).toUpperCase() + name.slice(1)] || '🤖';
}

// ====================
// ACTIVITY FEED MODULE
// ====================
let activityFeedData = null;

async function loadActivityFeed() {
    try {
        const res = await fetch('http://localhost:3001/api/activity-feed');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        activityFeedData = await res.json();
        renderActivityFeed();
    } catch (_) {
        // Local only — graceful degradation
        const el = document.getElementById('ov-activity-feed');
        if (el && !activityFeedData) {
            el.innerHTML = `<div style="text-align:center;padding:1.5rem;color:var(--text-secondary);font-size:0.82rem;">
                Start data-bridge.py locally to see live agent activity
            </div>`;
        }
        const meta = document.getElementById('activity-feed-meta');
        if (meta && !activityFeedData) meta.textContent = 'local server only';
    }
}

function _activityAgentColor(agent) {
    const map = { Baro: '#f093fb', baro: '#f093fb', noona: '#6ee7b7', Noona: '#6ee7b7', Raz: '#fbbf24', raz: '#fbbf24' };
    return map[agent] || '#818cf8';
}

function renderActivityFeed(limit = 10) {
    const container = document.getElementById('ov-activity-feed');
    const meta = document.getElementById('activity-feed-meta');
    if (!container || !activityFeedData) return;

    const events = activityFeedData.events || [];
    if (!events.length) {
        container.innerHTML = `<div style="text-align:center;padding:1.5rem;color:var(--text-secondary);font-size:0.82rem;">No activity yet</div>`;
        return;
    }

    if (meta) meta.textContent = `${activityFeedData.total} events · updated just now`;
    _checkNotifications();

    container.innerHTML = events.slice(0, limit).map(e => {
        const color = _activityAgentColor(e.agent);
        const proj  = e.project ? `<span style="color:var(--text-secondary);font-size:0.7rem;"> · ${e.project}</span>` : '';
        const time  = e.timestamp ? _hbTimeAgo(e.timestamp) : '';
        const icon  = e.type === 'note' ? '📝' : e.type === 'summary' ? '📋' : '✅';
        const action = (e.action || '').length > 120 ? e.action.substring(0, 120) + '…' : e.action;
        return `
        <div style="display:flex;gap:0.75rem;padding:0.65rem 0;border-bottom:1px solid rgba(255,255,255,0.05);">
            <div style="width:3px;border-radius:2px;background:${color};flex-shrink:0;min-height:100%;"></div>
            <div style="flex:1;min-width:0;">
                <div style="display:flex;align-items:center;gap:0.4rem;margin-bottom:0.2rem;">
                    <span style="font-size:0.75rem;font-weight:600;color:${color};">${e.agent}</span>
                    ${proj}
                    <span style="margin-left:auto;font-size:0.68rem;color:var(--text-secondary);white-space:nowrap;">${time}</span>
                </div>
                <div style="font-size:0.78rem;color:var(--text-color);line-height:1.4;">${icon} ${action}</div>
            </div>
        </div>`;
    }).join('');
}

function renderUpNext() {
    const container = document.getElementById('ov-up-next');
    if (!container || !heartbeatData || !heartbeatData.agents) return;

    const agents = heartbeatData.agents;
    const items = [];

    Object.entries(agents).forEach(([name, a]) => {
        const color = _activityAgentColor(name);
        const steps = a.nextSteps || [];
        const notes = a.cycleSummary || '';

        // Detect blocker keywords in notes
        const blockerKeywords = ['blocked', 'blocker', 'waiting', 'depends on', 'cannot', 'need', 'requires'];
        const isBlocker = blockerKeywords.some(kw => notes.toLowerCase().includes(kw));

        steps.slice(0, 2).forEach(step => {
            items.push({ name, color, step, notes: isBlocker ? notes : '', isBlocker });
        });

        // If no nextSteps but has nextAction from activeProjects
        if (!steps.length && a.nextAction) {
            items.push({ name, color, step: a.nextAction, notes: isBlocker ? notes : '', isBlocker });
        }
    });

    if (!items.length) {
        container.innerHTML = `<div style="text-align:center;padding:1.5rem;color:var(--text-secondary);font-size:0.82rem;">No upcoming steps found</div>`;
        return;
    }

    container.innerHTML = items.map(({ name, color, step, notes, isBlocker }) => `
        <div class="up-next-item">
            <span class="up-next-agent-pill" style="background:${color}22;color:${color};">${name}</span>
            <div style="flex:1;min-width:0;">
                <div style="font-size:0.78rem;color:var(--text-color);line-height:1.4;">${step.substring(0, 110)}${step.length > 110 ? '…' : ''}</div>
                ${isBlocker && notes ? `<div class="up-next-blocker">⚠️ ${notes.substring(0, 100)}${notes.length > 100 ? '…' : ''}</div>` : ''}
            </div>
        </div>`).join('');
}

// ====================
// NOTIFICATION DOTS
// ====================
let _lastSeenActivityCount = 0;
const _tabNotifMap = {
    // tabName → selector for the nav button
};

function _setTabNotif(tabName, show) {
    const btn = document.querySelector(`.nav-tab[onclick*="${tabName}"]`);
    if (!btn) return;
    if (show) btn.classList.add('has-notif');
    else btn.classList.remove('has-notif');
}

function _clearTabNotif(tabName) {
    _setTabNotif(tabName, false);
    if (tabName === 'overview') _lastSeenActivityCount = activityFeedData?.total || 0;
}

function _checkNotifications() {
    // Activity feed has new events since last overview visit
    const currentCount = activityFeedData?.total || 0;
    if (currentCount > _lastSeenActivityCount && _lastSeenActivityCount > 0) {
        _setTabNotif('overview', true);
    }
}

// Patch showTab to clear notif on visit
const _origShowTab = typeof showTab === 'function' ? showTab : null;

// ====================
// PROJECT STATUS SYNC
// ====================
let liveProjectStatus = null;

async function loadLiveProjectStatus() {
    try {
        const res = await fetch('http://localhost:3001/api/project-status');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        liveProjectStatus = await res.json();
        _syncProjectProgress();
    } catch (_) { /* local only */ }
}

function _syncProjectProgress() {
    if (!liveProjectStatus || !liveProjectStatus.projects) return;
    liveProjectStatus.projects.forEach(lp => {
        // Match by name (case-insensitive, normalise dashes/spaces)
        const normLive = lp.name.toLowerCase().replace(/[-_\s]/g, '');
        allProjects.forEach(proj => {
            const normProj = (proj.name || '').toLowerCase().replace(/[-_\s]/g, '');
            if (normProj.includes(normLive) || normLive.includes(normProj)) {
                if (lp.progress) {
                    // Strip % and parse
                    const pct = parseInt(lp.progress);
                    if (!isNaN(pct)) proj.progress = pct;
                }
                if (lp.phase) proj.currentPhase = lp.phase;
                if (lp.notes) proj.liveNotes = lp.notes;
            }
        });
    });
    renderProjects();
    renderOverview();
}

// Initialize workspace explorer when page loads
document.addEventListener('DOMContentLoaded', () => {
    renderOverview();
    loadWorkspaceData();

    // Kick off initial data load, then mark refresh pill as "done" and start auto-refresh loop
    Promise.allSettled([
        loadTeamData(),
        loadMemories(),
        loadProjects(),
        fetchCalendarEvents()
    ]).then(() => {
        _setRefreshPill('done');
        _startAutoRefresh();
    });

    // Heartbeat — separate faster loop (30s), local only
    loadHeartbeat();
    setInterval(loadHeartbeat, HEARTBEAT_INTERVAL_MS);

    // Activity feed + project status sync — local only, refresh every 60s
    loadActivityFeed();
    loadLiveProjectStatus();
    setInterval(() => { loadActivityFeed(); loadLiveProjectStatus(); }, 60000);

    // Add styles for workspace tabs
    const style = document.createElement('style');
    style.textContent = `
        .workspace-tab {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.2s;
            opacity: 0.7;
            transform: scale(0.95);
        }
        .workspace-tab:hover {
            opacity: 0.9;
            transform: scale(1);
        }
    `;
    document.head.appendChild(style);
});

// Team Module JavaScript
let teamData = null;

async function loadTeamData() {
    try {
        const response = await fetch('team.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        teamData = await response.json();
        renderTeam();
        renderTeamStats();
        renderOffice();
        renderOverview();
    } catch (error) {
        console.error('Failed to load team data:', error);
        // Show error message
        document.getElementById('team-members-container').innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                <div style="font-size: 2rem; margin-bottom: 1rem;">❌</div>
                <div>Failed to load team data</div>
                <div style="font-size: 0.8rem; margin-top: 0.5rem;">${error.message}</div>
            </div>
        `;
    }
}

function renderTeam() {
    if (!teamData || !teamData.team) return;
    
    const container = document.getElementById('team-members-container');
    let html = '';
    
    // Sort team by level (hierarchy)
    const sortedTeam = [...teamData.team].sort((a, b) => (a.level || 0) - (b.level || 0));
    
    sortedTeam.forEach((member, index) => {
        // Determine status color
        let statusColor = '#94a3b8'; // default gray
        let statusText = member.status;
        
        switch(member.status) {
            case 'online':
                statusColor = '#10b981'; // green
                break;
            case 'offline':
                statusColor = '#ef4444'; // red
                break;
            case 'away':
            case 'idle':
                statusColor = '#f59e0b'; // yellow
                break;
            default:
                statusColor = '#94a3b8'; // gray
        }
        
        // Format last active time
        let lastActiveText = 'Unknown';
        if (member.lastActive) {
            const lastActive = new Date(member.lastActive);
            const now = new Date();
            const diffMs = now - lastActive;
            const diffMins = Math.floor(diffMs / 60000);
            
            if (diffMins < 1) {
                lastActiveText = 'Just now';
            } else if (diffMins < 60) {
                lastActiveText = `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
            } else if (diffMins < 1440) {
                const diffHours = Math.floor(diffMins / 60);
                lastActiveText = `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
            } else {
                const diffDays = Math.floor(diffMins / 1440);
                lastActiveText = `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
            }
        }
        
        // Create member card with hierarchy indicator
        const level = member.level || 0;
        const levelPadding = level * 40; // Indent based on hierarchy level
        
        html += `
            <div style="text-align: center; padding: 1.5rem; background: linear-gradient(135deg, ${member.color} 0%, ${member.color}99 100%); border-radius: 12px; width: 100%; max-width: 450px; color: white; position: relative; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-left: ${levelPadding}px;">
                <div style="position: absolute; top: 1rem; right: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <div data-agent-status="${member.name}" style="width: 10px; height: 10px; background: ${statusColor}; border-radius: 50%;"></div>
                    <span style="font-size: 0.7rem; opacity: 0.9; text-transform: capitalize;">${statusText}</span>
                </div>
                
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">${member.roleIcon}</div>
                <div style="font-size: 1.5rem; font-weight: bold;">${member.name}</div>
                <div style="font-size: 0.9rem; opacity: 0.9; margin-top: 0.5rem;">${member.role} • ${member.type}</div>
                
                ${member.reportsTo ? `
                <div style="margin-top: 0.5rem; font-size: 0.7rem; opacity: 0.8; display: flex; align-items: center; justify-content: center; gap: 0.3rem;">
                    <span>⬆️</span>
                    <span>Reports to: ${member.reportsTo}</span>
                </div>
                ` : ''}
                
                ${member.manages && member.manages.length > 0 ? `
                <div style="margin-top: 0.3rem; font-size: 0.7rem; opacity: 0.8; display: flex; align-items: center; justify-content: center; gap: 0.3rem;">
                    <span>⬇️</span>
                    <span>Manages: ${member.manages.join(', ')}</span>
                </div>
                ` : ''}
                
                <div style="margin-top: 1rem; font-size: 0.85rem; opacity: 0.9; padding: 0.5rem; background: rgba(255,255,255,0.1); border-radius: 6px;">
                    ${member.description}
                </div>
                
                <div style="margin-top: 0.5rem; font-size: 0.8rem; opacity: 0.8; font-style: italic; padding: 0.5rem;">
                    "${member.mission}"
                </div>
                
                <div style="margin-top: 0.5rem; font-size: 0.75rem; opacity: 0.9; display: flex; align-items: center; justify-content: center; gap: 0.3rem;">
                    <span>📝</span>
                    <span data-agent-activity="${member.name}">${member.activity || 'Standby'}</span>
                </div>
                
                ${member.skills && member.skills.length > 0 ? `
                <div style="margin-top: 0.5rem; font-size: 0.7rem; opacity: 0.8;">
                    <div style="margin-bottom: 0.2rem;">Skills:</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.3rem; justify-content: center;">
                        ${member.skills.slice(0, 3).map(skill => `
                            <span style="padding: 0.1rem 0.4rem; background: rgba(255,255,255,0.2); border-radius: 4px; font-size: 0.65rem;">
                                ${skill}
                            </span>
                        `).join('')}
                        ${member.skills.length > 3 ? `<span style="font-size: 0.65rem; opacity: 0.7;">+${member.skills.length - 3} more</span>` : ''}
                    </div>
                </div>
                ` : ''}
                
                <div style="margin-top: 1rem; font-size: 0.7rem; opacity: 0.7; display: flex; justify-content: space-between; padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.2);">
                    <span>Last active: ${lastActiveText}</span>
                    ${member.availability ? `<span>Availability: ${member.availability}</span>` : ''}
                </div>
                
                ${member.workspace ? `
                <div style="margin-top: 0.5rem; font-size: 0.65rem; opacity: 0.6; font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${member.workspace}
                </div>
                ` : ''}
                
                ${member.subAgents && member.subAgents.length > 0 ? `
                <div style="margin-top: 1rem; padding-top: 0.5rem; border-top: 1px dashed rgba(255,255,255,0.3);">
                    <div style="font-size: 0.7rem; opacity: 0.8; margin-bottom: 0.5rem;">Active Sub-agents:</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.3rem; justify-content: center;">
                        ${member.subAgents.map(sub => `
                            <div style="padding: 0.2rem 0.5rem; background: rgba(255,255,255,0.15); border-radius: 4px; font-size: 0.65rem; display: flex; align-items: center; gap: 0.2rem;">
                                <span>${sub.roleIcon}</span>
                                <span>${sub.name}</span>
                                <div style="width: 6px; height: 6px; background: ${sub.status === 'idle' ? '#f59e0b' : '#10b981'}; border-radius: 50%;"></div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        `;
        
        // Add connecting line between members (except after last one)
        if (index < sortedTeam.length - 1) {
            html += `<div style="height: 40px; width: 2px; background: var(--border-color); margin-left: ${levelPadding + 225}px;"></div>`;
        }
    });
    
    // Add sub-agents section if we have them in teamData
    if (teamData.subAgents && teamData.subAgents.length > 0) {
        html += `
            <div style="height: 40px; width: 2px; background: var(--border-color); margin-left: 225px;"></div>
            
            <div style="text-align: center; padding: 1.5rem; background: var(--card-bg); border-radius: 12px; width: 100%; max-width: 450px; border: 1px solid var(--border-color); position: relative; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-left: 80px;">
                <div style="position: absolute; top: 1rem; right: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 10px; height: 10px; background: #94a3b8; border-radius: 50%;"></div>
                    <span style="font-size: 0.7rem; opacity: 0.9;">variable</span>
                </div>
                <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🤖</div>
                <div style="font-size: 1.2rem; font-weight: bold;">Sub-agents</div>
                <div style="font-size: 0.9rem; opacity: 0.8; margin-top: 0.5rem;">Task-specific temporary agents</div>
                
                <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.8rem;">
                    ${teamData.subAgents.map(sub => {
                        let subStatusColor = '#94a3b8';
                        switch(sub.status) {
                            case 'online': subStatusColor = '#10b981'; break;
                            case 'offline': subStatusColor = '#ef4444'; break;
                            case 'idle': subStatusColor = '#f59e0b'; break;
                        }
                        
                        // Format last active for sub-agent
                        let subLastActive = 'Unknown';
                        if (sub.lastActive) {
                            const lastActive = new Date(sub.lastActive);
                            const now = new Date();
                            const diffMs = now - lastActive;
                            const diffHours = Math.floor(diffMs / 3600000);
                            subLastActive = `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
                        }
                        
                        return `
                            <div style="padding: 0.8rem; background: rgba(0,0,0,0.1); border-radius: 8px; text-align: left;">
                                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.3rem;">
                                    <span style="font-size: 1.2rem;">${sub.roleIcon}</span>
                                    <div style="font-weight: bold;">${sub.name}</div>
                                    <div style="flex: 1;"></div>
                                    <div style="display: flex; align-items: center; gap: 0.3rem;">
                                        <div style="width: 8px; height: 8px; background: ${subStatusColor}; border-radius: 50%;"></div>
                                        <span style="font-size: 0.7rem; opacity: 0.8; text-transform: capitalize;">${sub.status}</span>
                                    </div>
                                </div>
                                <div style="font-size: 0.8rem; opacity: 0.9;">${sub.role}</div>
                                <div style="font-size: 0.75rem; opacity: 0.8; margin-top: 0.3rem;">${sub.description}</div>
                                <div style="font-size: 0.7rem; opacity: 0.7; margin-top: 0.3rem; display: flex; justify-content: space-between;">
                                    <span>Parent: ${sub.parentAgent}</span>
                                    <span>Last active: ${subLastActive}</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div style="margin-top: 1rem; font-size: 0.75rem; opacity: 0.7; font-style: italic;">
                    "Execute specific tasks as needed, managed by parent agents"
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

function renderTeamStats() {
    if (!teamData) return;
    
    const container = document.getElementById('team-stats-container');
    
    // Count statuses for main team
    let onlineCount = 0;
    let offlineCount = 0;
    let awayCount = 0;
    let idleCount = 0;
    
    teamData.team.forEach(member => {
        switch(member.status) {
            case 'online':
                onlineCount++;
                break;
            case 'offline':
                offlineCount++;
                break;
            case 'away':
                awayCount++;
                break;
            case 'idle':
                idleCount++;
                break;
        }
    });
    
    // Count sub-agents
    let subAgentCount = 0;
    let subOnlineCount = 0;
    let subIdleCount = 0;
    
    if (teamData.subAgents) {
        subAgentCount = teamData.subAgents.length;
        teamData.subAgents.forEach(sub => {
            if (sub.status === 'online') subOnlineCount++;
            if (sub.status === 'idle') subIdleCount++;
        });
    }
    
    // Format last updated time
    let lastUpdatedText = 'Unknown';
    if (teamData.lastUpdated) {
        const lastUpdated = new Date(teamData.lastUpdated);
        const now = new Date();
        const diffMs = now - lastUpdated;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) {
            lastUpdatedText = 'Just now';
        } else if (diffMins < 60) {
            lastUpdatedText = `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
        } else if (diffMins < 1440) {
            const diffHours = Math.floor(diffMins / 60);
            lastUpdatedText = `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
        } else {
            lastUpdatedText = lastUpdated.toLocaleDateString();
        }
    }
    
    // Get hierarchy levels
    const hierarchyLevels = teamData.stats?.hierarchyLevels || 3;
    
    // Create stats HTML
    const html = `
        <div>
            <div style="font-weight: bold; color: var(--text-secondary);">Team Structure</div>
            <div>${teamData.hierarchy || 'Raz → Baro → Noona → [Sub-agents]'}</div>
        </div>
        <div>
            <div style="font-weight: bold; color: var(--text-secondary);">Data Source</div>
            <div><code>team.json</code> • Updated: ${lastUpdatedText}</div>
        </div>
        <div>
            <div style="font-weight: bold; color: var(--text-secondary);">Version</div>
            <div>${teamData.version || 'V0.8.2-enhanced'} • Enhanced hierarchy</div>
        </div>
        <div>
            <div style="font-weight: bold; color: var(--text-secondary);">Team Status</div>
            <div>
                <span style="color: #10b981;">${onlineCount} online</span> • 
                <span style="color: #ef4444;">${offlineCount} offline</span> • 
                <span style="color: #f59e0b;">${awayCount + idleCount} idle/away</span>
            </div>
        </div>
        <div>
            <div style="font-weight: bold; color: var(--text-secondary);">Sub-agents</div>
            <div>${subAgentCount} total • ${subOnlineCount} active • ${subIdleCount} idle</div>
        </div>
        <div>
            <div style="font-weight: bold; color: var(--text-secondary);">Hierarchy</div>
            <div>${hierarchyLevels} levels • ${teamData.team?.length || 0} main agents</div>
        </div>
    `;
    
    container.innerHTML = html;
}

// Backlog Module JavaScript
let backlogData = null;
let backlogCurrentFilter = 'all';

async function loadBacklog() {
    try {
        const response = await fetch('/home/baro/.openclaw/workspace/mission-control/Backlog.md');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        backlogData = text;
        renderBacklog();
        updateBacklogStats();
        updateProgressOverview();
        
        // Update last updated time
        const lastUpdatedEl = document.getElementById('backlog-last-updated');
        if (lastUpdatedEl) {
            const now = new Date();
            lastUpdatedEl.textContent = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        }
    } catch (error) {
        console.error('Failed to load backlog:', error);
        document.getElementById('backlog-content').innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--error-color);">
                <div style="font-size: 2rem; margin-bottom: 1rem;">❌</div>
                <div>Failed to load backlog data</div>
                <div style="font-size: 0.8rem; margin-top: 0.5rem;">${error.message}</div>
            </div>
        `;
    }
}

function renderBacklog() {
    if (!backlogData) return;
    
    const container = document.getElementById('backlog-content');
    
    // Parse markdown sections
    const sections = backlogData.split('\n## ');
    let html = '';
    
    sections.forEach((section, sectionIndex) => {
        if (sectionIndex === 0) {
            // Skip the first part (title and metadata)
            return;
        }
        
        const lines = section.split('\n');
        const title = lines[0].trim();
        const content = lines.slice(1).join('\n');
        
        // Skip empty sections
        if (!title || !content.trim()) return;
        
        // Determine section type by title
        const isPrioritySection = title.includes('Priority Tasks') || title.includes('Current Version');
        const isFutureSection = title.includes('Future Enhancements') || title.includes('V0.9') || title.includes('V1.');
        const isIssuesSection = title.includes('Known Issues') || title.includes('Technical Debt');
        const isMetricsSection = title.includes('Success Metrics') || title.includes('Development Goals');
        
        // Add section header
        html += `
            <div style="margin-bottom: 2rem; ${isPrioritySection ? 'border-left: 4px solid #3b82f6; padding-left: 1rem;' : ''}">
                <h4 style="margin-top: 0; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    ${getSectionIcon(title)} ${title}
                </h4>
        `;
        
        // Parse tasks within section
        const taskLines = content.split('\n');
        let inTaskList = false;
        let taskListHtml = '';
        
        taskLines.forEach(line => {
            const trimmedLine = line.trim();
            
            // Check for task items
            if (trimmedLine.startsWith('- [ ]') || trimmedLine.startsWith('- [x]') || trimmedLine.startsWith('- [X]')) {
                if (!inTaskList) {
                    taskListHtml += '<div style="margin-left: 1rem;">';
                    inTaskList = true;
                }
                
                const isDone = trimmedLine.includes('[x]') || trimmedLine.includes('[X]');
                const taskText = trimmedLine.replace(/^- \[[ xX]\]\s*/, '').trim();
                const priority = getTaskPriority(taskText);
                
                taskListHtml += `
                    <div style="margin-bottom: 0.5rem; padding: 0.5rem; background: ${isDone ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-hover)'}; border-radius: 6px; border-left: 3px solid ${isDone ? '#10b981' : priority.color};">
                        <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                            <div style="margin-top: 0.2rem;">${isDone ? '✅' : '⬜'}</div>
                            <div style="flex: 1;">
                                ${formatTaskText(taskText)}
                                ${priority.label ? `<span style="font-size: 0.7rem; background: ${priority.color}; color: white; padding: 0.1rem 0.4rem; border-radius: 4px; margin-left: 0.5rem;">${priority.label}</span>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            } else if (trimmedLine.startsWith('###')) {
                // Subsection
                const subTitle = trimmedLine.replace(/^###\s*/, '').trim();
                taskListHtml += `<h5 style="margin: 1rem 0 0.5rem 0; font-size: 0.9rem;">${subTitle}</h5>`;
            } else if (trimmedLine && !trimmedLine.startsWith('---') && !trimmedLine.startsWith('**') && !trimmedLine.startsWith('Created:')) {
                // Regular text
                if (inTaskList) {
                    taskListHtml += '</div>';
                    inTaskList = false;
                }
                html += `<p style="margin: 0.5rem 0; font-size: 0.85rem; color: var(--text-secondary);">${formatText(trimmedLine)}</p>`;
            }
        });
        
        if (inTaskList) {
            taskListHtml += '</div>';
        }
        
        html += taskListHtml;
        html += '</div>';
    });
    
    container.innerHTML = html;
}

function getSectionIcon(title) {
    if (title.includes('Priority')) return '🎯';
    if (title.includes('Future')) return '🚀';
    if (title.includes('Issues')) return '🐛';
    if (title.includes('Technical')) return '🔧';
    if (title.includes('Metrics')) return '📈';
    if (title.includes('Goals')) return '🎯';
    if (title.includes('Change Log')) return '📝';
    if (title.includes('Implementation')) return '⚙️';
    return '📋';
}

function getTaskPriority(taskText) {
    if (taskText.includes('High Priority') || taskText.includes('Critical')) {
        return { label: 'HIGH', color: '#ef4444' };
    }
    if (taskText.includes('Medium Priority')) {
        return { label: 'MEDIUM', color: '#f59e0b' };
    }
    if (taskText.includes('Low Priority')) {
        return { label: 'LOW', color: '#6b7280' };
    }
    return { label: '', color: '#94a3b8' };
}

function formatTaskText(text) {
    // Convert markdown bold to HTML
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

function formatText(text) {
    // Convert markdown links and formatting
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color: var(--accent-color);">$1</a>');
}

function updateBacklogStats() {
    if (!backlogData) return;
    
    const container = document.getElementById('backlog-stats');
    
    // Count tasks
    const totalTasks = (backlogData.match(/- \[[ xX]\]/g) || []).length;
    const doneTasks = (backlogData.match(/- \[[xX]\]/g) || []).length;
    const todoTasks = totalTasks - doneTasks;
    _ovBacklogStats(totalTasks, todoTasks);
    
    // Count priority tasks
    const priorityTasks = (backlogData.match(/High Priority|Medium Priority|Low Priority/g) || []).length;
    
    const html = `
        <div style="display: flex; justify-content: space-between;">
            <span>Total Tasks:</span>
            <span style="font-weight: bold;">${totalTasks}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
            <span>Completed:</span>
            <span style="font-weight: bold; color: #10b981;">${doneTasks}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
            <span>To Do:</span>
            <span style="font-weight: bold; color: #f59e0b;">${todoTasks}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
            <span>Priority Tasks:</span>
            <span style="font-weight: bold; color: #ef4444;">${priorityTasks}</span>
        </div>
        <div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid var(--border-color);">
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem;">
                <span>Completion:</span>
                <span style="font-weight: bold;">${totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0}%</span>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

function updateProgressOverview() {
    if (!backlogData) return;
    
    const container = document.getElementById('backlog-progress');
    
    // Count tasks by section
    const sections = backlogData.split('\n## ');
    let priorityTasks = 0;
    let priorityDone = 0;
    let futureTasks = 0;
    let futureDone = 0;
    let bugTasks = 0;
    let bugDone = 0;
    
    sections.forEach(section => {
        const lines = section.split('\n');
        const title = lines[0].trim();
        
        if (title.includes('Priority Tasks') || title.includes('Current Version')) {
            lines.forEach(line => {
                if (line.includes('- [ ]')) priorityTasks++;
                if (line.includes('- [x]') || line.includes('- [X]')) priorityDone++;
            });
        } else if (title.includes('Future Enhancements') || title.includes('V0.9') || title.includes('V1.')) {
            lines.forEach(line => {
                if (line.includes('- [ ]')) futureTasks++;
                if (line.includes('- [x]') || line.includes('- [X]')) futureDone++;
            });
        } else if (title.includes('Known Issues') || title.includes('Technical Debt')) {
            lines.forEach(line => {
                if (line.includes('- [ ]')) bugTasks++;
                if (line.includes('- [x]') || line.includes('- [X]')) bugDone++;
            });
        }
    });
    
    const totalPriority = priorityTasks + priorityDone;
    const totalFuture = futureTasks + futureDone;
    const totalBugs = bugTasks + bugDone;
    
    const html = `
        <div style="text-align: center; padding: 1rem; background: var(--bg-hover); border-radius: 8px;">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">🎯</div>
            <div style="font-weight: bold;">Priority Tasks</div>
            <div style="font-size: 0.9rem; margin-top: 0.3rem;">${priorityDone}/${totalPriority} done</div>
            <div style="margin-top: 0.5rem; height: 6px; background: var(--border-color); border-radius: 3px; overflow: hidden;">
                <div style="height: 100%; width: ${totalPriority > 0 ? (priorityDone / totalPriority) * 100 : 0}%; background: #3b82f6;"></div>
            </div>
        </div>
        
        <div style="text-align: center; padding: 1rem; background: var(--bg-hover); border-radius: 8px;">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">🚀</div>
            <div style="font-weight: bold;">Future Features</div>
            <div style="font-size: 0.9rem; margin-top: 0.3rem;">${futureDone}/${totalFuture} done</div>
            <div style="margin-top: 0.5rem; height: 6px; background: var(--border-color); border-radius: 3px; overflow: hidden;">
                <div style="height: 100%; width: ${totalFuture > 0 ? (futureDone / totalFuture) * 100 : 0}%; background: #8b5cf6;"></div>
            </div>
        </div>
        
        <div style="text-align: center; padding: 1rem; background: var(--bg-hover); border-radius: 8px;">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">🐛</div>
            <div style="font-weight: bold;">Bugs & Issues</div>
            <div style="font-size: 0.9rem; margin-top: 0.3rem;">${bugDone}/${totalBugs} fixed</div>
            <div style="margin-top: 0.5rem; height: 6px; background: var(--border-color); border-radius: 3px; overflow: hidden;">
                <div style="height: 100%; width: ${totalBugs > 0 ? (bugDone / totalBugs) * 100 : 0}%; background: #10b981;"></div>
            </div>
        </div>
        
        <div style="text-align: center; padding: 1rem; background: var(--bg-hover); border-radius: 8px;">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">📈</div>
            <div style="font-weight: bold;">Overall Progress</div>
            <div style="font-size: 0.9rem; margin-top: 0.3rem;">
                ${(priorityDone + futureDone + bugDone)}/${(totalPriority + totalFuture + totalBugs)} tasks
            </div>
            <div style="margin-top: 0.5rem; height: 6px; background: var(--border-color); border-radius: 3px; overflow: hidden;">
                <div style="height: 100%; width: ${(totalPriority + totalFuture + totalBugs) > 0 ? ((priorityDone + futureDone + bugDone) / (totalPriority + totalFuture + totalBugs)) * 100 : 0}%; background: linear-gradient(90deg, #3b82f6, #8b5cf6, #10b981);"></div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

function filterTasks(filterType) {
    backlogCurrentFilter = filterType;
    
    // Update button states
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`filter-${filterType}`).classList.add('active');
    
    // Apply filtering (this would be more sophisticated in a real implementation)
    // For now, just reload with a note
    loadBacklog();
}

function refreshBacklog() {
    loadBacklog();
    addActivity('Backlog refreshed');
}

function openBacklogFile() {
    // In a real implementation, this would open the file in an editor
    // For now, just show a message
    addActivity('Opening Backlog.md for editing');
    alert('In a full implementation, this would open Backlog.md in your default editor.');
}

function exportBacklog() {
    if (!backlogData) return;
    
    // Create JSON export
    const exportData = {
        timestamp: new Date().toISOString(),
        source: 'Backlog.md',
        stats: {
            totalTasks: (backlogData.match(/- \[[ xX]\]/g) || []).length,
            doneTasks: (backlogData.match(/- \[[xX]\]/g) || []).length,
            priorityTasks: (backlogData.match(/High Priority|Medium Priority|Low Priority/g) || []).length
        },
        content: backlogData
    };
    
    // Create download link
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `mission-control-backlog-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    addActivity('Backlog exported as JSON');
}

// Initialize backlog when tab is shown
document.addEventListener('DOMContentLoaded', () => {
    // Add event listener for backlog tab
    document.querySelectorAll('.nav-tab').forEach(button => {
        button.addEventListener('click', () => {
            if (button.getAttribute('onclick').includes('backlog')) {
                loadBacklog();
            }
        });
    });
});

// File Preview Modal Functions
function showFilePreview(file, workspaceName) {
    const modal = document.getElementById('file-preview-modal');
    const title = document.getElementById('preview-title');
    const content = document.getElementById('preview-content');
    
    // Set title
    title.textContent = `${file.name} (${workspaceName})`;
    
    // Show loading
    content.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <div style="font-size: 2rem; margin-bottom: 1rem;">⏳</div>
            <div>Loading preview...</div>
        </div>
    `;
    
    // Show modal
    modal.style.display = 'flex';
    
    // Load file content based on type
    setTimeout(() => {
        loadFileContent(file, workspaceName, content);
    }, 100);
}

async function loadFileContent(file, workspaceName, contentElement) {
    // Show file info while loading
    const fileInfo = `
        <div style="margin-bottom: 1.5rem;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
                <div style="background: rgba(0,0,0,0.1); padding: 0.75rem; border-radius: 6px;">
                    <div style="font-size: 0.8rem; opacity: 0.7;">File Type</div>
                    <div style="font-weight: bold;">${file.type === 'text' ? 'Text' : file.type === 'image' ? 'Image' : 'Other'}</div>
                </div>
                <div style="background: rgba(0,0,0,0.1); padding: 0.75rem; border-radius: 6px;">
                    <div style="font-size: 0.8rem; opacity: 0.7;">Size</div>
                    <div style="font-weight: bold;">${formatFileSize(file.size)}</div>
                </div>
                <div style="background: rgba(0,0,0,0.1); padding: 0.75rem; border-radius: 6px;">
                    <div style="font-size: 0.8rem; opacity: 0.7;">Modified</div>
                    <div style="font-weight: bold;">${new Date(file.modified).toLocaleString()}</div>
                </div>
                <div style="background: rgba(0,0,0,0.1); padding: 0.75rem; border-radius: 6px;">
                    <div style="font-size: 0.8rem; opacity: 0.7;">Extension</div>
                    <div style="font-weight: bold;">${file.extension}</div>
                </div>
            </div>
            
            <div style="background: rgba(0,0,0,0.1); padding: 0.75rem; border-radius: 6px;">
                <div style="font-size: 0.8rem; opacity: 0.7;">Full Path</div>
                <div style="font-family: monospace; font-size: 0.9rem; word-break: break-all;">${workspaceName}/${file.path}</div>
            </div>
        </div>
    `;
    
    // Show loading state
    contentElement.innerHTML = fileInfo + `
        <div style="background: rgba(0,0,0,0.2); border-radius: 8px; padding: 2rem; margin-top: 1rem; text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 1rem;">
                <div class="loading-spinner" style="display: inline-block; width: 40px; height: 40px; border: 3px solid rgba(99, 102, 241, 0.3); border-radius: 50%; border-top-color: var(--accent); animation: spin 1s linear infinite;"></div>
            </div>
            <div>Loading file content...</div>
            <div style="font-size: 0.8rem; opacity: 0.7; margin-top: 0.5rem;">Fetching ${file.name} from ${workspaceName}</div>
        </div>
    `;
    
    try {
        // Fetch file content from API
        const apiUrl = `http://localhost:3001/api/file/${encodeURIComponent(workspaceName)}/${encodeURIComponent(file.path)}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Show content based on file type
        let fileContent = '';
        
        if (file.type === 'text' && data.content) {
            // Format text content with syntax highlighting
            const escapedContent = escapeHtml(data.content);
            const highlightedContent = applySyntaxHighlighting(escapedContent, file.extension);
            
            fileContent = `
                <div style="background: rgba(0,0,0,0.2); border-radius: 8px; padding: 1rem; margin-top: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
                        <div style="font-weight: bold;">Content Preview</div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button onclick="copyFileContent('${escapeSingleQuotes(data.content)}')" style="background: var(--accent-color); color: white; border: none; padding: 0.3rem 0.75rem; border-radius: 4px; font-size: 0.8rem; cursor: pointer;">
                                📋 Copy Content
                            </button>
                            <button onclick="copyToClipboard('${workspaceName}/${file.path}')" style="background: rgba(0,0,0,0.3); color: var(--text-color); border: 1px solid var(--border-color); padding: 0.3rem 0.75rem; border-radius: 4px; font-size: 0.8rem; cursor: pointer;">
                                📁 Copy Path
                            </button>
                        </div>
                    </div>
                    <div style="background: #1a1a2e; color: #e2e8f0; font-family: 'Consolas', 'Monaco', 'Courier New', monospace; padding: 1rem; border-radius: 4px; max-height: 400px; overflow: auto; font-size: 0.85rem; line-height: 1.4; white-space: pre-wrap; word-break: break-all;">
                        ${highlightedContent}
                    </div>
                    <div style="margin-top: 0.5rem; font-size: 0.75rem; opacity: 0.7; display: flex; justify-content: space-between;">
                        <span>${data.content.length} characters</span>
                        <span>${data.content.split('\n').length} lines</span>
                    </div>
                </div>
            `;
        } else if (file.type === 'image') {
            fileContent = `
                <div style="background: rgba(0,0,0,0.2); border-radius: 8px; padding: 1rem; margin-top: 1rem;">
                    <div style="font-weight: bold; margin-bottom: 0.5rem;">Image Preview</div>
                    <div style="text-align: center; padding: 1rem; background: rgba(0,0,0,0.3); border-radius: 6px;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">🖼️</div>
                        <div>Image preview available via direct file access</div>
                        <div style="font-size: 0.8rem; opacity: 0.7; margin-top: 0.5rem;">
                            ${file.name} (${formatFileSize(file.size)})
                        </div>
                        <div style="margin-top: 1rem; font-size: 0.8rem;">
                            <button onclick="copyToClipboard('file://${data.workspace_path}/${file.path}')" style="background: var(--accent-color); color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">
                                📋 Copy File Path
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            fileContent = `
                <div style="background: rgba(0,0,0,0.2); border-radius: 8px; padding: 1rem; margin-top: 1rem;">
                    <div style="font-weight: bold; margin-bottom: 0.5rem;">File Information</div>
                    <div style="text-align: center; padding: 2rem; background: rgba(0,0,0,0.3); border-radius: 6px;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">📄</div>
                        <div>Preview not available for this file type</div>
                        <div style="font-size: 0.8rem; opacity: 0.7; margin-top: 0.5rem;">
                            ${file.extension} files cannot be previewed in this version
                        </div>
                        <div style="margin-top: 1rem; font-size: 0.8rem;">
                            <button onclick="copyToClipboard('${workspaceName}/${file.path}')" style="background: var(--accent-color); color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">
                                📋 Copy File Path
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        contentElement.innerHTML = fileInfo + fileContent;
        
    } catch (error) {
        console.error('Error loading file content:', error);
        
        // Show error state
        const errorContent = `
            <div style="background: rgba(239, 68, 68, 0.1); border-radius: 8px; padding: 1rem; margin-top: 1rem; border: 1px solid rgba(239, 68, 68, 0.3);">
                <div style="font-weight: bold; color: #ef4444; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                    <span>❌</span>
                    <span>Error Loading File</span>
                </div>
                <div style="font-size: 0.9rem; color: #fca5a5;">
                    Could not load file content: ${error.message}
                </div>
                <div style="margin-top: 1rem; font-size: 0.8rem; opacity: 0.7;">
                    <div>File: ${file.name}</div>
                    <div>Path: ${workspaceName}/${file.path}</div>
                    <div>Type: ${file.type}</div>
                </div>
                <div style="margin-top: 1rem;">
                    <button onclick="loadFileContent(${JSON.stringify(file).replace(/"/g, '&quot;')}, '${workspaceName}', contentElement)" 
                            style="background: rgba(0,0,0,0.3); color: var(--text-color); border: 1px solid var(--border-color); padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">
                        🔄 Retry
                    </button>
                </div>
            </div>
        `;
        
        contentElement.innerHTML = fileInfo + errorContent;
    }
}

// Helper functions for file content handling
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeSingleQuotes(text) {
    return text.replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r');
}

function applySyntaxHighlighting(content, extension) {
    // Simple syntax highlighting based on file extension
    let language = 'plaintext';
    
    if (extension === '.js' || extension === '.jsx') language = 'javascript';
    else if (extension === '.py') language = 'python';
    else if (extension === '.html') language = 'html';
    else if (extension === '.css') language = 'css';
    else if (extension === '.json') language = 'json';
    else if (extension === '.md') language = 'markdown';
    else if (extension === '.sh') language = 'bash';
    else if (extension === '.yaml' || extension === '.yml') language = 'yaml';
    else if (extension === '.xml') language = 'xml';
    
    // For now, return plain content. In a future enhancement, we could add actual syntax highlighting.
    // This is a placeholder for future syntax highlighting implementation.
    return content;
}

function copyFileContent(content) {
    navigator.clipboard.writeText(content).then(() => {
        // Show a subtle notification instead of alert
        const notification = document.createElement('div');
        notification.textContent = '✓ Content copied to clipboard';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--accent-color);
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-size: 0.9rem;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: fadeInOut 2s ease-in-out;
        `;
        
        // Add animation styles if not already present
        if (!document.querySelector('#copy-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'copy-notification-styles';
            style.textContent = `
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translateY(-10px); }
                    10% { opacity: 1; transform: translateY(0); }
                    90% { opacity: 1; transform: translateY(0); }
                    100% { opacity: 0; transform: translateY(-10px); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy content:', err);
        alert('Failed to copy content to clipboard');
    });
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function closeFilePreview() {
    document.getElementById('file-preview-modal').style.display = 'none';
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Show a subtle notification instead of alert
        const notification = document.createElement('div');
        notification.textContent = '✓ Copied to clipboard';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--accent-color);
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-size: 0.9rem;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: fadeInOut 2s ease-in-out;
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy to clipboard');
    });
}

// Close modal when clicking outside
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('file-preview-modal');
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeFilePreview();
        }
    });
});

// Quick Actions Functions
function sendQuickMessage(recipient, type) {
    let message = '';
    switch(type) {
        case 'status':
            message = `Hey ${recipient}, just checking in. What's your current status?`;
            break;
        default:
            message = `Hey ${recipient}, quick ping!`;
    }
    
    // For now, just copy to clipboard
    navigator.clipboard.writeText(message).then(() => {
        alert(`Message copied to clipboard: "${message}"`);
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy message');
    });
}

function generateStatusReport() {
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();
    
    const report = `📊 Status Report - ${dateStr} ${timeStr}

👤 Agent: Noona
📋 Status: Autonomous Development Session
🚀 Current Task: Building Quick Actions Dashboard for Mission Control
✅ Progress: Quick Actions tab added with team efficiency tools
🎯 Next: Testing and deployment
📝 Notes: Working on team efficiency improvements during morning session`;

    navigator.clipboard.writeText(report).then(() => {
        alert('Status report copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy report');
    });
}

function openProject(projectName) {
    let url = '';
    switch(projectName) {
        case 'mission-control':
            url = 'https://warung-kerja.github.io/mission-control/';
            break;
        case 'workspace-explorer':
            // This would open the workspace explorer in a new tab
            showTab('office'); // For now, show office tab
            return;
        default:
            alert(`Project ${projectName} not configured`);
            return;
    }
    
    window.open(url, '_blank');
}

function generateDailyReport() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    const report = `📅 Daily Report - ${dateStr}

🎯 Today's Focus:
1. Mission Control improvements
2. Team efficiency tools
3. Documentation updates

✅ Completed:
• Quick Actions Dashboard added to Mission Control
• Team status monitoring
• Quick message templates
• Resource links panel

🚧 In Progress:
• Testing Quick Actions functionality
• Mobile responsiveness improvements

📋 Upcoming:
• Memories Browser (V0.9)
• Real-time data updates
• Enhanced file preview system

💡 Notes:
Morning autonomous development session focused on team efficiency tools.
Quick Actions dashboard provides one-click access to common team workflows.`;

    navigator.clipboard.writeText(report).then(() => {
        alert('Daily report copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy report');
    });
}

function openGitHub() {
    window.open('https://github.com/warung-kerja', '_blank');
}

// ============================================================
// OVERVIEW TAB (Home screen)
// ============================================================

function renderOverview() {
    // Greeting + date
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const greetEl = document.getElementById('overview-greeting');
    if (greetEl) greetEl.textContent = `${greeting} 👋`;

    const dateEl = document.getElementById('overview-date');
    if (dateEl) dateEl.textContent = now.toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Hero stats
    _ovTeamStats();
    _ovProjectStats();
    _ovCalendarStats();
    _ovMemoryStats();

    // Panels
    _ovProjectsList();
    _ovTeamList();
    _ovEventsList();
}

function _ovTeamStats() {
    if (!teamData) return;
    const all = teamData.team || [];
    const online = all.filter(m => m.status === 'online').length;
    const el = document.getElementById('ov-online-count');
    if (el) el.textContent = `${online}/${all.length}`;
}

function _ovProjectStats() {
    const el = document.getElementById('ov-active-projects');
    if (!el) return;
    if (!allProjects.length) { el.textContent = '—'; return; }
    const active = allProjects.filter(p => p.status === 'active').length;
    el.textContent = active;
}

function _ovCalendarStats() {
    const el = document.getElementById('ov-upcoming-events');
    if (!el) return;
    if (!calendarEvents.length) { el.textContent = '—'; return; }
    const today = new Date();
    const weekOut = new Date(today); weekOut.setDate(today.getDate() + 7);
    const todayStr = today.toISOString().split('T')[0];
    const weekStr = weekOut.toISOString().split('T')[0];
    const count = calendarEvents.filter(e => e.date >= todayStr && e.date <= weekStr).length;
    el.textContent = count;
}

function _ovMemoryStats() {
    const el = document.getElementById('ov-memory-files');
    if (!el) return;
    if (memoriesData) {
        el.textContent = memoriesData.total_files || '—';
    }
}

function _ovBacklogStats(total, open) {
    const el = document.getElementById('ov-backlog-tasks');
    if (el) el.textContent = open !== undefined ? open : (total || '—');
}

function _ovProjectsList() {
    const el = document.getElementById('ov-projects-list');
    if (!el) return;
    if (!allProjects.length) {
        el.innerHTML = '<div style="color:var(--text-secondary);font-size:0.85rem;">No projects loaded</div>';
        return;
    }
    const active = allProjects.filter(p => p.status === 'active').slice(0, 4);
    el.innerHTML = active.map(p => `
        <div style="margin-bottom: 0.85rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.3rem;">
                <span style="font-size:0.85rem; font-weight:600;">${p.icon || '📁'} ${p.name}</span>
                <span style="font-size:0.75rem; color:var(--text-secondary);">${p.progress || 0}%</span>
            </div>
            <div style="height:5px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden;">
                <div style="height:100%; width:${p.progress || 0}%; background:${p.color || '#6366f1'}; border-radius:3px; transition:width 0.4s;"></div>
            </div>
        </div>`).join('');
}

function _ovTeamList() {
    const el = document.getElementById('ov-team-list');
    if (!el) return;
    if (!teamData) {
        el.innerHTML = '<div style="color:var(--text-secondary);font-size:0.85rem;">Loading…</div>';
        return;
    }
    const STATUS_COLOR = { online: '#10b981', away: '#f59e0b', idle: '#94a3b8', offline: '#ef4444' };
    const members = teamData.team || [];
    el.innerHTML = members.map(m => `
        <div style="display:flex; align-items:center; gap:0.75rem; padding:0.5rem 0; border-bottom:1px solid rgba(255,255,255,0.05);">
            <span style="font-size:1.3rem; flex-shrink:0;">${m.roleIcon || '🤖'}</span>
            <div style="flex:1; min-width:0;">
                <div style="font-size:0.85rem; font-weight:600;">${m.name}</div>
                <div style="font-size:0.75rem; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${m.activity || m.role}</div>
            </div>
            <span style="width:8px; height:8px; border-radius:50%; background:${STATUS_COLOR[m.status] || '#94a3b8'}; flex-shrink:0;"></span>
        </div>`).join('');
}

function _ovEventsList() {
    const el = document.getElementById('ov-events-list');
    if (!el) return;
    if (!calendarEvents.length) {
        el.innerHTML = '<div style="color:var(--text-secondary);font-size:0.85rem;">No calendar data</div>';
        return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    const upcoming = calendarEvents
        .filter(e => e.date >= todayStr)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 5);

    if (!upcoming.length) {
        el.innerHTML = '<div style="color:var(--text-secondary);font-size:0.85rem;">No upcoming events</div>';
        return;
    }
    el.innerHTML = upcoming.map(e => {
        const d = new Date(e.date + 'T00:00:00');
        const label = d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
        return `
            <div style="display:flex; align-items:center; gap:0.75rem; padding:0.45rem 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                <span style="width:8px; height:8px; border-radius:50%; background:${e.color || '#6366f1'}; flex-shrink:0;"></span>
                <div style="flex:1; min-width:0;">
                    <div style="font-size:0.83rem; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${e.title}</div>
                </div>
                <span style="font-size:0.72rem; color:var(--text-secondary); flex-shrink:0;">${label}</span>
            </div>`;
    }).join('');
}

// ============================================================
// OFFICE VISUALIZATION (V1.0)
// ============================================================

function renderOffice() {
    const container = document.getElementById('office-floors');
    if (!container) return;

    if (!teamData || !teamData.team) {
        container.innerHTML = `
            <div style="text-align:center;padding:3rem;color:var(--text-secondary);">
                <div style="font-size:2rem;margin-bottom:1rem;">⚠️</div>
                <div>Could not load team data</div>
            </div>`;
        return;
    }

    const STATUS_DOT = { online: 'dot-online', away: 'dot-away', idle: 'dot-idle', offline: 'dot-offline' };
    const STATUS_LABEL = { online: 'Online', away: 'Away', idle: 'Idle', offline: 'Offline' };

    function timeAgo(iso) {
        if (!iso) return 'Unknown';
        const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
        return `${Math.floor(diff/86400)}d ago`;
    }

    function deskHTML(member) {
        const dotClass = STATUS_DOT[member.status] || 'dot-idle';
        const statusLabel = STATUS_LABEL[member.status] || member.status;
        const skills = (member.skills || []).slice(0, 3);
        const color = member.color || '#6366f1';

        return `
            <div class="office-desk" style="border-color: ${color}40; color: ${color};">
                <div class="office-desk-avatar">${member.roleIcon || '🤖'}</div>
                <div class="office-desk-header">
                    <div class="office-desk-name" style="color: var(--text-color);">${member.name}</div>
                </div>
                <div class="office-desk-role">${member.role}</div>
                <div class="office-status-badge">
                    <span class="dot ${dotClass}"></span>
                    <span style="color:var(--text-color);">${statusLabel}</span>
                    <span style="color:var(--text-secondary); margin-left:0.25rem;">· ${timeAgo(member.lastActive)}</span>
                </div>
                <div class="office-activity">${member.activity || 'No current activity'}</div>
                ${skills.length ? `
                <div class="office-skills">
                    ${skills.map(s => `<span class="office-skill-tag">${s}</span>`).join('')}
                </div>` : ''}
                <div class="office-actions">
                    <button class="office-action-btn" onclick="showTab('team', event)">👥 Team</button>
                    <button class="office-action-btn" onclick="showTab('memories', event)">🧠 Memories</button>
                </div>
            </div>`;
    }

    // Group by hierarchy level
    const floors = {};
    const FLOOR_LABELS = { 0: '🏛️ Executive Floor', 1: '🎨 Creative Floor', 2: '🔧 Engineering Floor' };

    teamData.team.forEach(member => {
        const lvl = member.level ?? 2;
        if (!floors[lvl]) floors[lvl] = [];
        floors[lvl].push(member);

        // Sub-agents go on the same floor as their parent, +0.5 visual indent
        (member.subAgents || []).forEach(sub => {
            const subLvl = lvl + 1;
            if (!floors[subLvl]) floors[subLvl] = [];
            floors[subLvl].push(sub);
        });
    });

    const sortedLevels = Object.keys(floors).sort((a, b) => a - b);

    const html = sortedLevels.map(lvl => {
        const label = FLOOR_LABELS[lvl] || `Floor ${parseInt(lvl) + 1}`;
        const desks = floors[lvl].map(deskHTML).join('');
        return `
            <div class="office-floor">
                <div class="office-floor-label">${label}</div>
                <div class="office-desks">${desks}</div>
            </div>`;
    }).join('');

    container.innerHTML = html;

    const updated = teamData.lastUpdated
        ? `Team data last updated: ${new Date(teamData.lastUpdated).toLocaleString()}`
        : '';
    const el = document.getElementById('office-last-updated');
    if (el) el.textContent = updated;
}

// ============================================================
// MEMORIES BROWSER (V0.9)
// ============================================================

let memoriesData = null;

async function loadMemories() {
    const grid = document.getElementById('memories-grid');
    if (!grid) return;

    try {
        const response = await fetch('http://localhost:3001/api/memories');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        memoriesData = await response.json();
        renderMemories(memoriesData);
    } catch (err) {
        grid.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-secondary); grid-column: 1 / -1;">
                <div style="font-size: 2rem; margin-bottom: 1rem;">⚠️</div>
                <div>Could not load memories</div>
                <div style="font-size: 0.8rem; margin-top: 0.5rem;">Start data-bridge.py locally to enable this feature</div>
                <div style="font-size: 0.75rem; margin-top: 0.5rem; opacity: 0.6;">${err.message}</div>
            </div>`;
    }
}

function renderMemories(data, searchTerm = '') {
    const grid = document.getElementById('memories-grid');
    if (!grid) return;

    // Update stats
    document.getElementById('memories-total-agents').textContent = data.agent_count || 0;
    document.getElementById('memories-total-files').textContent = data.total_files || 0;
    document.getElementById('memories-total-size').textContent = formatFileSize(data.total_size || 0);
    _ovMemoryStats();

    const agents = data.agents || {};
    const agentNames = Object.keys(agents);

    if (agentNames.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:3rem; color:var(--text-secondary);">No memory files found.</div>`;
        return;
    }

    const AGENT_ICONS = { Baro: '🎨', noona: '🔧', bob: '🔍', haji: '🎭', obey: '🤖', Soba: '📊', Lin: '📡', _Shared_Memory: '🧠' };
    const TYPE_COLORS = { core: '#6366f1', daily: '#10b981', general: '#f59e0b' };

    grid.innerHTML = agentNames.map(agent => {
        const info = agents[agent];
        const icon = AGENT_ICONS[agent] || '🤖';

        let files = info.files || [];
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            files = files.filter(f =>
                f.name.toLowerCase().includes(term) ||
                f.preview.toLowerCase().includes(term)
            );
        }
        if (files.length === 0 && searchTerm) return '';

        const fileItems = files.map(f => {
            const color = TYPE_COLORS[f.type] || '#94a3b8';
            const date = new Date(f.modified).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
            const previewSnippet = f.preview.slice(0, 120).replace(/\n/g, ' ').replace(/#+\s*/g, '').trim();
            return `
                <div onclick="openMemoryFile('${escapeHtml(agent)}', '${escapeHtml(f.path)}')"
                     style="padding: 0.65rem 0.75rem; border-radius: 6px; cursor: pointer; border: 1px solid var(--border-color); background: rgba(0,0,0,0.15); transition: background 0.15s;"
                     onmouseover="this.style.background='rgba(99,102,241,0.1)'" onmouseout="this.style.background='rgba(0,0,0,0.15)'">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.3rem;">
                        <span style="width: 8px; height: 8px; border-radius: 50%; background: ${color}; flex-shrink: 0;"></span>
                        <span style="font-weight: 600; font-size: 0.85rem; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${f.name}</span>
                        <span style="font-size: 0.7rem; color: var(--text-secondary); flex-shrink: 0;">${date}</span>
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${previewSnippet || '—'}</div>
                </div>`;
        }).join('');

        return `
            <div style="background: var(--card-bg); border-radius: 12px; padding: 1.25rem; border: 1px solid var(--border-color);">
                <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 1rem;">
                    <span style="font-size: 1.4rem;">${icon}</span>
                    <div style="flex: 1;">
                        <div style="font-weight: 700; font-size: 1rem;">${agent}</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">${files.length} file${files.length !== 1 ? 's' : ''} • ${formatFileSize(info.total_size)}</div>
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    ${fileItems || '<div style="font-size:0.8rem;color:var(--text-secondary);text-align:center;padding:1rem;">No matches</div>'}
                </div>
            </div>`;
    }).join('');

    if (!grid.innerHTML.trim()) {
        grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:3rem; color:var(--text-secondary);">No results for "${searchTerm}"</div>`;
    }
}

function filterMemories() {
    if (!memoriesData) return;
    const term = document.getElementById('memories-search').value;
    renderMemories(memoriesData, term);
}

async function openMemoryFile(agent, filePath) {
    // Reuse the existing file preview modal
    const modal = document.getElementById('file-preview-modal');
    const title = document.getElementById('preview-title');
    const content = document.getElementById('preview-content');
    if (!modal) return;

    title.textContent = filePath.split('/').pop();
    content.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-secondary);">Loading…</div>';
    modal.style.display = 'flex';

    try {
        const encodedPath = filePath.split('/').slice(1).join('/'); // strip agent prefix
        const response = await fetch(`http://localhost:3001/api/file/${encodeURIComponent(agent)}/${encodedPath}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        if (data.content) {
            const highlighted = applySyntaxHighlighting(data.content, data.extension || '.md');
            content.innerHTML = `
                <div style="margin-bottom:1rem; display:flex; gap:1rem; flex-wrap:wrap; font-size:0.8rem; color:var(--text-secondary);">
                    <span>📄 ${data.name}</span>
                    <span>📦 ${formatFileSize(data.size)}</span>
                    <span>🕐 ${new Date(data.modified).toLocaleString()}</span>
                    <button onclick="copyFileContent(${JSON.stringify(data.content)})"
                            style="margin-left:auto; padding:0.3rem 0.75rem; background:var(--accent-color); color:white; border:none; border-radius:4px; cursor:pointer; font-size:0.8rem;">
                        Copy
                    </button>
                </div>
                <pre style="white-space:pre-wrap; word-break:break-word; font-size:0.85rem; line-height:1.6; font-family: monospace;">${highlighted}</pre>`;
        } else {
            content.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--text-secondary);">Cannot preview this file type (${data.extension || 'unknown'})</div>`;
        }
    } catch (err) {
        content.innerHTML = `<div style="text-align:center;padding:2rem;color:#ef4444;">Error loading file: ${err.message}</div>`;
    }
}

function copyMessageTemplate(type) {
    let template = '';
    switch(type) {
        case 'status':
            template = 'Working on [task], ETA [time]';
            break;
        case 'blocked':
            template = 'Need help with [issue]';
            break;
        case 'done':
            template = '[Task] is done, ready for review';
            break;
        default:
            template = 'Quick message';
    }
    
    navigator.clipboard.writeText(template).then(() => {
        alert(`Template copied: "${template}"`);
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy template');
    });
}

// ====================
// ====================
// V1.2: COLLABORATION TOOLS
// ====================

let currentChatAgent = 'Baro';
let chatHistory = {
    'Baro': [],
    'Noona': [],
    'Raz': [],
    'Team': []
};

const agentInfo = {
    'Baro': {
        name: 'Baro',
        avatar: '🎨',
        color: 'linear-gradient(135deg, #f093fb, #f5576c)',
        status: 'Online',
        subtitle: 'Creative Director • Usually responds in 5 min',
        responses: [
            "Great work on the implementation!",
            "Can you also update the documentation?",
            "The design looks solid, let's ship it!",
            "I\'ll review the changes in a moment.",
            "Raz wants to see this by EOD."
        ]
    },
    'Noona': {
        name: 'Noona',
        avatar: '🔧',
        color: 'linear-gradient(135deg, #4facfe, #00f2fe)',
        status: 'Online',
        subtitle: 'Engineer • Building things that work',
        responses: [
            "On it! Will have this done soon.",
            "Just pushed the changes to GitHub.",
            "Found a bug, fixing it now.",
            "The feature is ready for testing.",
            "Need any help with the deployment?"
        ]
    },
    'Raz': {
        name: 'Raz',
        avatar: '👑',
        color: 'linear-gradient(135deg, #fa709a, #fee140)',
        status: 'Busy',
        subtitle: 'Vision Keeper • Limited availability',
        responses: [
            "Looks good, approved for deployment.",
            "Can we simplify this?",
            "Focus on the core features first.",
            "Schedule a review for tomorrow.",
            "This aligns with our goals."
        ]
    },
    'Team': {
        name: 'Team Channel',
        avatar: '👥',
        color: 'linear-gradient(135deg, #667eea, #764ba2)',
        status: 'Online',
        subtitle: '3 members • Team-wide announcements',
        responses: []
    }
};

// Select agent for chat
function selectAgentChat(agentName) {
    currentChatAgent = agentName;
    const agent = agentInfo[agentName];
    
    // Update active state in list
    document.querySelectorAll('.agent-list-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.agent === agentName) {
            item.classList.remove('unread');
            item.classList.add('active');
        }
    });
    
    // Update chat header
    document.getElementById('chat-name').textContent = agent.name;
    document.getElementById('chat-status').textContent = agent.subtitle;
    document.getElementById('chat-avatar').textContent = agent.avatar;
    document.getElementById('chat-avatar').style.background = agent.color;
    
    // Load chat history
    renderChatMessages(agentName);
}

// Render chat messages
function renderChatMessages(agentName) {
    const container = document.getElementById('chat-messages');
    const messages = chatHistory[agentName] || [];
    
    if (messages.length === 0) {
        // Show default welcome message
        container.innerHTML = `
            <div class="chat-date-divider">
                <span>Today</span>
            </div>
            <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                <div style="font-size: 2rem; margin-bottom: 1rem;">💬</div>
                <div>Start a conversation with ${agentName}</div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="chat-date-divider">
                <span>Today</span>
            </div>
        `;
        messages.forEach(msg => {
            appendMessageToContainer(container, msg);
        });
    }
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

// Append message to container
function appendMessageToContainer(container, msg) {
    const agent = agentInfo[msg.sender];
    const isOwn = msg.sender === 'Noona';
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isOwn ? 'own' : ''}`;
    messageDiv.innerHTML = `
        <div class="chat-message-avatar" style="background: ${agent.color};">${agent.avatar}</div>
        <div class="chat-message-content">
            <div class="chat-message-text">${msg.text}</div>
            <div class="chat-message-meta">
                ${msg.sender} • ${msg.time} ${isOwn ? '✓✓' : ''}
            </div>
        </div>
    `;
    
    container.appendChild(messageDiv);
}

// Handle chat keypress
function handleChatKeypress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// Send message
function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    
    if (!text) return;
    
    const message = {
        sender: 'Noona',
        text: text,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    
    // Add to history
    if (!chatHistory[currentChatAgent]) {
        chatHistory[currentChatAgent] = [];
    }
    chatHistory[currentChatAgent].push(message);
    
    // Clear input
    input.value = '';
    
    // Render message
    const container = document.getElementById('chat-messages');
    
    // Remove empty state if present
    if (container.querySelector('.chat-message') === null && container.children.length <= 1) {
        container.innerHTML = '<div class="chat-date-divider"><span>Today</span></div>';
    }
    
    appendMessageToContainer(container, message);
    container.scrollTop = container.scrollHeight;
    
    // Simulate typing indicator and response
    if (currentChatAgent !== 'Team') {
        showTypingIndicator();
        
        setTimeout(() => {
            hideTypingIndicator();
            simulateResponse();
        }, 2000 + Math.random() * 2000);
    }
    
    // Add to activity feed
    addActivity(`Message sent to ${currentChatAgent}`);
}

// Show typing indicator
function showTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    const agent = agentInfo[currentChatAgent];
    indicator.querySelector('span').textContent = `${agent.name} is typing`;
    indicator.style.display = 'flex';
}

// Hide typing indicator
function hideTypingIndicator() {
    document.getElementById('typing-indicator').style.display = 'none';
}

// Simulate response
function simulateResponse() {
    const agent = agentInfo[currentChatAgent];
    if (!agent || !agent.responses || agent.responses.length === 0) return;
    
    const responseText = agent.responses[Math.floor(Math.random() * agent.responses.length)];
    
    const message = {
        sender: currentChatAgent,
        text: responseText,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    
    chatHistory[currentChatAgent].push(message);
    
    const container = document.getElementById('chat-messages');
    appendMessageToContainer(container, message);
    container.scrollTop = container.scrollHeight;
    
    // Add notification if not active
    if (currentChatAgent !== 'Noona') {
        addNotification(`New message from ${agent.name}`, responseText.substring(0, 50) + '...');
    }
}

// Delegate task
function delegateTask() {
    showDelegateTaskModal();
}

// Show delegate task modal
function showDelegateTaskModal() {
    const taskTitle = prompt('Task title:');
    if (!taskTitle) return;
    
    const assignee = prompt('Assign to (Baro/Noona/Raz):', currentChatAgent);
    if (!assignee) return;
    
    // Add to delegated tasks
    const container = document.getElementById('delegated-tasks-list');
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task-delegation-item';
    taskDiv.innerHTML = `
        <div class="task-delegation-title">${taskTitle}</div>
        <div class="task-delegation-assignee">
            <span>Assigned to: ${assignee}</span>
        </div>
        <span class="task-delegation-status status-pending">Pending</span>
    `;
    
    container.insertBefore(taskDiv, container.firstChild);
    
    // Add notification
    addNotification('📋 Task Delegated', `You assigned "${taskTitle}" to ${assignee}`);
    
    // Add to activity
    addActivity(`Task delegated: ${taskTitle} → ${assignee}`);
    
    // Simulate confirmation message
    setTimeout(() => {
        if (chatHistory[assignee]) {
            const message = {
                sender: assignee,
                text: `Got it! I'll work on "${taskTitle}"`,
                time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            };
            chatHistory[assignee].push(message);
            
            if (currentChatAgent === assignee) {
                const chatContainer = document.getElementById('chat-messages');
                appendMessageToContainer(chatContainer, message);
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        }
    }, 1500);
}

// Add notification
function addNotification(title, message) {
    const container = document.getElementById('notifications-list');
    const notifDiv = document.createElement('div');
    notifDiv.className = 'notification-item unread';
    notifDiv.onclick = function() { markNotificationRead(this); };
    notifDiv.innerHTML = `
        <strong>${title}</strong>
        <div>${message}</div>
        <div class="notification-time">Just now</div>
    `;
    
    container.insertBefore(notifDiv, container.firstChild);
    
    // Update unread badge
    updateUnreadCount();
}

// Mark notification as read
function markNotificationRead(element) {
    element.classList.remove('unread');
    updateUnreadCount();
}

// Update unread notification count
function updateUnreadCount() {
    const unreadCount = document.querySelectorAll('.notification-item.unread').length;
    // Could update a badge here
}

// Start call (placeholder)
function startCall() {
    alert(`📹 Starting video call with ${currentChatAgent}...\n\n(Feature coming in V1.3)`);
}

// Show agent info (placeholder)
function showAgentInfo() {
    const agent = agentInfo[currentChatAgent];
    alert(`👤 ${agent.name}\nRole: ${agent.subtitle.split('•')[0].trim()}\nStatus: ${agent.status}\n\nLast seen: Just now`);
}

// Simulate incoming messages periodically
setInterval(() => {
    if (Math.random() > 0.8) {
        const agents = ['Baro', 'Raz'];
        const randomAgent = agents[Math.floor(Math.random() * agents.length)];
        
        if (randomAgent !== currentChatAgent) {
            // Mark as unread
            const listItem = document.querySelector(`.agent-list-item[data-agent="${randomAgent}"]`);
            if (listItem) {
                listItem.classList.add('unread');
            }
            
            // Add notification
            const agent = agentInfo[randomAgent];
            const randomMsg = agent.responses[Math.floor(Math.random() * agent.responses.length)];
            addNotification(`💬 ${agent.name}`, randomMsg.substring(0, 40) + '...');
        }
    }
}, 60000); // Every minute

// Initialize collaboration features when tab is shown
document.addEventListener('DOMContentLoaded', function() {
    const collabTab = document.getElementById('collaboration-tab');
    if (collabTab) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.target.style.display === 'block') {
                    // Initialize chat
                    selectAgentChat(currentChatAgent);
                }
            });
        });
        
        observer.observe(collabTab, { attributes: true, attributeFilter: ['style'] });
    }
    
    // Initialize analytics features
    initAnalytics();
});

// V1.3 Analytics & Reporting Functions
let currentTimeframe = '7d';


function initAnalytics() {
    generateHeatmap();
    drawVelocityChart();
}

function setTimeframe(timeframe) {
    currentTimeframe = timeframe;
    
    // Update button states
    document.querySelectorAll('.timeframe-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update metrics based on timeframe
    updateMetricsForTimeframe(timeframe);
    
    // Redraw charts
    drawVelocityChart();
    generateHeatmap();
}

function updateMetricsForTimeframe(timeframe) {
    const metrics = {
        '7d': { tasks: 47, velocity: 8.5, hours: 156, completion: '94%' },
        '30d': { tasks: 186, velocity: 7.2, hours: 624, completion: '91%' },
        '90d': { tasks: 542, velocity: 6.8, hours: 1872, completion: '89%' }
    };
    
    const data = metrics[timeframe];
    document.getElementById('tasks-completed').textContent = data.tasks;
    document.getElementById('avg-velocity').textContent = data.velocity;
    document.getElementById('hours-logged').textContent = data.hours;
    document.getElementById('completion-rate').textContent = data.completion;
}

function drawVelocityChart() {
    const canvas = document.getElementById('velocityCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Sample velocity data
    const days = currentTimeframe === '7d' ? 7 : currentTimeframe === '30d' ? 30 : 90;
    const data = [];
    for (let i = 0; i < days; i++) {
        data.push(Math.floor(Math.random() * 8) + 3); // Random between 3-10
    }
    
    const maxValue = Math.max(...data);
    const barWidth = (width - 40) / data.length;
    const scale = (height - 60) / maxValue;
    
    // Draw bars
    data.forEach((value, index) => {
        const barHeight = value * scale;
        const x = 20 + index * barWidth;
        const y = height - 40 - barHeight;
        
        // Create gradient
        const gradient = ctx.createLinearGradient(0, y, 0, height - 40);
        gradient.addColorStop(0, '#6366f1');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.3)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x + 2, y, barWidth - 4, barHeight);
        
        // Draw bar top highlight
        ctx.fillStyle = '#818cf8';
        ctx.fillRect(x + 2, y, barWidth - 4, 3);
    });
    
    // Draw baseline
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, height - 40);
    ctx.lineTo(width - 20, height - 40);
    ctx.stroke();
}

function generateHeatmap() {
    const container = document.getElementById('activity-heatmap');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Generate 14x4 grid (2 weeks)
    for (let i = 0; i < 56; i++) {
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';
        
        // Random activity level
        const activity = Math.random();
        if (activity > 0.8) {
            cell.style.background = 'rgba(99, 102, 241, 0.9)';
        } else if (activity > 0.6) {
            cell.style.background = 'rgba(99, 102, 241, 0.6)';
        } else if (activity > 0.4) {
            cell.style.background = 'rgba(99, 102, 241, 0.3)';
        } else {
            cell.style.background = 'var(--bg-card)';
        }
        
        // Add tooltip
        const hours = Math.floor(activity * 8);
        cell.title = `${hours} hours of activity`;
        
        container.appendChild(cell);
    }
}

function exportAnalyticsReport() {
    const report = {
        generatedAt: new Date().toISOString(),
        timeframe: currentTimeframe,
        metrics: {
            tasksCompleted: document.getElementById('tasks-completed').textContent,
            avgVelocity: document.getElementById('avg-velocity').textContent,
            hoursLogged: document.getElementById('hours-logged').textContent,
            completionRate: document.getElementById('completion-rate').textContent
        },
        teamPerformance: [
            { name: 'Noona', tasks: 47, hours: 78, efficiency: '98%' },
            { name: 'Baro', tasks: 28, hours: 52, efficiency: '95%' },
            { name: 'Raz', tasks: 12, hours: 18, efficiency: '88%' },
            { name: 'Bob', tasks: 8, hours: 8, efficiency: '85%' }
        ]
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${currentTimeframe}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addActivity('Analytics report exported');
}

// Initialize analytics when tab is shown
document.addEventListener('DOMContentLoaded', function() {
    const analyticsTab = document.getElementById('analytics-tab');
    if (analyticsTab) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.target.style.display === 'block') {
                    // Redraw charts when tab becomes visible
                    setTimeout(() => {
                        drawVelocityChart();
                        generateHeatmap();
                    }, 100);
                }
            });
        });
        
        observer.observe(analyticsTab, { attributes: true, attributeFilter: ['style'] });
    }
});
