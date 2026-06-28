/*Clock*/
let use24HourTime = false;
let highestZIndex = 10;
let isDragging = false;
let draggedWindow = null;
let offsetX = 0;
let offsetY = 0;

function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();
    let displayHours = hours;
    let ampm = '';
    
    if (!use24HourTime) {
        ampm = hours >= 12 ? ' PM' : ' AM';
        displayHours = hours % 12;
        displayHours = displayHours ? displayHours : 12;
    } else {
        displayHours = displayHours < 10 ? '0' + displayHours : displayHours;
    }

    minutes = minutes < 10 ? '0' + minutes : minutes;
    const colon = seconds % 2 === 0 ? ':' : ' ';
    document.querySelector('.clock').textContent = `${displayHours}${colon}${minutes} ${ampm}`;
}
setInterval(updateClock, 1000);


/*Drag and Drop*/

document.addEventListener('mousedown', (e) => {
    const clickedWindow = e.target.closest('.window, .welcome-modal');
    
    if (clickedWindow) {
        if(clickedWindow.id === 'welcome-window') {
            clickedWindow.style.zIndex = 99999;
        } else {
            highestZIndex++;
            clickedWindow.style.zIndex = highestZIndex;
        }
    }

    const titleBar = e.target.closest('.title-bar');
    const desktopIcon = e.target.closest('.desktop-icon');

    if (titleBar && e.target.tagName !== 'BUTTON') {
        isDragging = true;
        draggedWindow = clickedWindow;
        draggedWindow.style.transition = 'none'; // Prevent drag lag

        offsetX = e.clientX - draggedWindow.offsetLeft;
        offsetY = e.clientY - draggedWindow.offsetTop;
    }
    else if (desktopIcon) {
        e.preventDefault();
        isDragging = true;
        draggedWindow = desktopIcon;
        offsetX = e.clientX - desktopIcon.offsetLeft;
        offsetY = e.clientY - desktopIcon.offsetTop;
    }
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging || !draggedWindow) return;

    let newX = e.clientX - offsetX;
    let newY = e.clientY - offsetY;

    if (newX < 0) newX = 0;
    if (newY < 0) newY = 0; 

    const maxX = window.innerWidth - 50; 
    if (newX > maxX) newX = maxX;

    let bottomLimit = draggedWindow.classList.contains('desktop-icon') 
        ? window.innerHeight - 40 - draggedWindow.offsetHeight 
        : window.innerHeight - 70;

    if(newY > bottomLimit) newY = bottomLimit;

    draggedWindow.style.left = newX + 'px';
    draggedWindow.style.top = newY + 'px';
});

document.addEventListener('mouseup', () => {
    if (isDragging && draggedWindow && draggedWindow.classList.contains('desktop-icon')) {
        const currentX = parseInt(draggedWindow.style.left, 10);
        const currentY = parseInt(draggedWindow.style.top, 10);
        const snappedX = Math.round(currentX / 90) * 90 + 20;
        const snappedY = Math.round(currentY / 90) * 90 + 20;

        draggedWindow.style.left = snappedX + 'px';
        draggedWindow.style.top = snappedY + 'px';

        localStorage.setItem(draggedWindow.id + '-x', draggedWindow.style.left);
        localStorage.setItem(draggedWindow.id + '-y', draggedWindow.style.top);
    }

    if (draggedWindow && !draggedWindow.classList.contains('desktop-icon')) {
        draggedWindow.style.transition = ''; // Restore CSS animations
    }

    isDragging = false;
    draggedWindow = null;
});


/*Window Management*/

function toggleMaximize(win) {
    win.style.transition = ''; 

    if (win.classList.contains('maximized')) {
        win.classList.remove('maximized');
        win.style.top = win.getAttribute('data-prev-top');
        win.style.left = win.getAttribute('data-prev-left');
        win.style.width = win.getAttribute('data-prev-width');
        win.style.height = win.getAttribute('data-prev-height');
    } else {
        win.setAttribute('data-prev-top', win.style.top || win.offsetTop + 'px');
        win.setAttribute('data-prev-left', win.style.left || win.offsetLeft + 'px');
        win.setAttribute('data-prev-width', win.getBoundingClientRect().width + 'px');
        win.setAttribute('data-prev-height', win.getBoundingClientRect().height + 'px');
        
        win.classList.add('maximized');
        win.style.top = '';
        win.style.left = '';
        win.style.width = '';
        win.style.height = '';
    }
}

function registerApp(winId, taskbarId, menuId, minId, maxId, closeId) {
    const win = document.getElementById(winId);
    const taskbarBtn = document.getElementById(taskbarId);
    const menuBtn = document.getElementById(menuId);
    const minBtn = document.getElementById(minId);
    const maxBtn = document.getElementById(maxId);
    const closeBtn = document.getElementById(closeId);

    const openApp = () => {
        if (win.style.display === 'none') {
            win.classList.add('minimized');
            win.style.display = 'flex';
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    win.classList.remove('minimized');
                });
            });
        } else {
            win.classList.remove('minimized');
        }
        
        highestZIndex++;
        win.style.zIndex = highestZIndex;
        
        if (taskbarBtn) {
            taskbarBtn.style.display = 'block';
            taskbarBtn.classList.add('active');
        }
    };

    const closeApp = (permanentlyClose) => {
        win.classList.add('minimized'); 
        if (taskbarBtn) taskbarBtn.classList.remove('active');
        
        setTimeout(() => {
            if (win.classList.contains('minimized')) {
                win.style.display = 'none';
                if (permanentlyClose && taskbarBtn) taskbarBtn.style.display = 'none';
            }
        }, 300);
    };

    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            openApp();
            document.getElementById('start-menu').style.display = 'none';
            document.querySelector('.start-button').classList.remove('active');
        });
    }

    if (closeBtn) closeBtn.addEventListener('click', () => closeApp(true));
    if (minBtn) minBtn.addEventListener('click', () => closeApp(false));
    if (maxBtn) maxBtn.addEventListener('click', () => toggleMaximize(win));

    if (taskbarBtn) {
        taskbarBtn.addEventListener('click', () => {
            if (win.style.display === 'none' || win.classList.contains('minimized')) openApp();
            else closeApp(false);
        });
    }

    const desktopIcon = document.getElementById('desktop-' + winId.split('-')[0]);
    if (desktopIcon) desktopIcon.addEventListener('dblclick', openApp);
}

registerApp('notepad-window', 'taskbar-notepad', 'menu-notepad', 'np-min-btn', 'np-max-btn', 'np-close-btn');
registerApp('calculator-window', 'taskbar-calculator', 'menu-calculator', 'calc-min-btn', 'calc-max-btn', 'calc-close-btn');
registerApp('explorer-window', 'taskbar-explorer', 'menu-explorer', 'exp-min-btn', 'exp-max-btn', 'exp-close-btn');
registerApp('settings-window', 'taskbar-settings', 'menu-settings', 'set-min-btn', 'set-max-btn', 'set-close-btn');


/*Start and context menu*/

const startButton = document.querySelector('.start-button');
const startMenu = document.getElementById('start-menu');
const desktopContextMenu = document.getElementById('desktop-context-menu');
const fileContextMenu = document.getElementById('file-context-menu');

startButton.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = startMenu.style.display === 'block';
    startMenu.style.display = isVisible ? 'none' : 'block';
    startButton.classList.toggle('active', !isVisible);

    if (!isVisible) {
        const btnRect = startButton.getBoundingClientRect();
        startMenu.style.setProperty('left', btnRect.left + 'px', 'important');
        startMenu.style.setProperty('transform', 'none', 'important');
    }
});

document.addEventListener('click', (e) => {
    if (startMenu.style.display === 'block' && !startMenu.contains(e.target)) {
        startMenu.style.display = 'none';
        startButton.classList.remove('active');
    }
    desktopContextMenu.style.display = 'none';
    fileContextMenu.style.display = 'none';
});

document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.window') || e.target.closest('.taskbar') || e.target.closest('.start-menu') || e.target.closest('.welcome-modal')) return;
    e.preventDefault();
    desktopContextMenu.style.display = 'block';
    desktopContextMenu.style.left = e.clientX + 'px';
    desktopContextMenu.style.top = e.clientY + 'px';
});

document.getElementById('context-refresh').addEventListener('click', () => location.reload());
document.getElementById('context-settings').addEventListener('click', () => {
    document.getElementById('menu-settings').click();
});


/*Settings*/

const timeToggle = document.getElementById('time-format-toggle');
const savedTimeFormat = localStorage.getItem('use24HourTime');

if (savedTimeFormat !== null){
    use24HourTime = savedTimeFormat === 'true';
    timeToggle.checked = use24HourTime;
}
timeToggle.addEventListener('change', (e) => {
    use24HourTime = e.target.checked;
    localStorage.setItem('use24HourTime', use24HourTime);
    updateClock();
});


const labelToggle = document.getElementById('icon-label-toggle');
const savedLabels = localStorage.getItem('showIconLabels');

if (savedLabels !== null){
    const showLabels = savedLabels === 'true';
    labelToggle.checked = showLabels;
    document.querySelector('.desktop-environment').classList.toggle('hide-labels', !showLabels);
}
labelToggle.addEventListener('change', (e) => {
    localStorage.setItem('showIconLabels', e.target.checked);
    document.querySelector('.desktop-environment').classList.toggle('hide-labels', !e.target.checked);
});


const themeSelect = document.getElementById('theme-select');
themeSelect.value = localStorage.getItem('os-theme') || 'modern';
document.body.classList.toggle('theme-retro', themeSelect.value === 'retro');

themeSelect.addEventListener('change', (e) => {
    currentTheme = e.target.value;
    localStorage.setItem('os-theme', currentTheme);
    document.body.classList.toggle('theme-retro', currentTheme === 'retro');
    
    const startMenu = document.getElementById('start-menu');
    if (currentTheme === 'retro') {
        startMenu.style.left = '0px';
        startMenu.style.transform = 'none';
    } else {
        startMenu.style.left = '50%';
        startMenu.style.transform = 'translateX(-50%)';
    }
});

const wallpaperSelect = document.getElementById('wallpaper-select');
const customUrlInput = document.getElementById('custom-wallpaper-url');
const nasaError = document.getElementById('nasa-error');

function setWallpaper(url) {
    document.body.style.setProperty('background-image', `url('${url}')`, 'important');
    document.body.style.setProperty('background-size', 'cover', 'important');
    document.body.style.setProperty('background-position', 'center', 'important');
    document.body.style.setProperty('background-repeat', 'no-repeat', 'important');
}

wallpaperSelect.addEventListener('change', async (e) => {
    const choice = e.target.value;
    customUrlInput.style.display = choice === 'custom' ? 'block' : 'none';
    nasaError.style.display = 'none';

    if (choice === 'default') {
        document.body.style.removeProperty('background-image');
        localStorage.setItem('wallp-opt', 'default');
    }
    else if (choice === 'custom' && customUrlInput.value) {
        setWallpaper(customUrlInput.value);
        localStorage.setItem('wallpaper-url', customUrlInput.value);
        localStorage.setItem('wallp-opt', 'custom');
    }
    else if (choice === 'nasa') {
        nasaError.style.color = '#e0e0e0';
        nasaError.textContent = 'Connecting to NASA servers...';
        nasaError.style.display = 'block';
        
        try {
            const response = await fetch('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY');
            if (response.status === 429) throw new Error('Rate Limit Exceeded');
            const data = await response.json();
            
            if (data.media_type === 'image') {
                setWallpaper(data.url);
                localStorage.setItem('nasa-img', data.url);
                localStorage.setItem('wallp-opt', 'nasa');
                nasaError.style.display = 'none';
            } else throw new Error('Not an image');
        } catch (err) {
            nasaError.style.color = '#ff5f56';
            nasaError.textContent = 'NASA Image blocked (Rate Limit). Try custom URL.';
            document.body.style.removeProperty('background-image');
            localStorage.setItem('wallp-opt', 'default');
        }
    }
});
customUrlInput.addEventListener('input', (e) => {
    if (wallpaperSelect.value === 'custom') setWallpaper(e.target.value);
});


/*Welcome Screen */

const welcomeOverlay = document.getElementById('welcome-overlay');
const welcomeWindow = document.getElementById('welcome-window');
const welcomeDontShow = document.getElementById('welcome-dont-show');
const welcomeToggleSwitch = document.getElementById('welcome-toggle-switch');

const shouldShowWelcome = localStorage.getItem('showWelcomeScreen') !== 'false';

welcomeToggleSwitch.checked = shouldShowWelcome;
welcomeDontShow.checked = !shouldShowWelcome;

if (shouldShowWelcome) {
    welcomeOverlay.style.display = 'block';
    welcomeWindow.style.display = 'flex';
}

function closeWelcomeScreen() {
    if(welcomeDontShow.checked) {
        localStorage.setItem('showWelcomeScreen', 'false');
        welcomeToggleSwitch.checked = false; // Sync settings app
    }
    welcomeOverlay.style.display = 'none';
    welcomeWindow.style.display = 'none';
}

document.getElementById('welcome-start-btn').addEventListener('click', closeWelcomeScreen);
document.getElementById('welcome-close-btn').addEventListener('click', closeWelcomeScreen);

welcomeToggleSwitch.addEventListener('change', (e) => {
    const show = e.target.checked;
    localStorage.setItem('showWelcomeScreen', show ? 'true' : 'false');
    welcomeDontShow.checked = !show; 
});



/*Calculator*/

const calcDisplay = document.getElementById('calc-display');
let currentInput = '', previousInput = '', operator = '';
let fullExpression = '';

document.querySelectorAll('.calc-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        const value = e.target.textContent;

        if (value === 'C') {
            currentInput = previousInput = operator = '';
            calcDisplay.value = '0';
            return;
        }

        if (value === '=') {
            if (!currentInput || !previousInput) return;
            const n1 = parseFloat(previousInput), n2 = parseFloat(currentInput);
            let result = 0;
            if (operator === '+') result = n1 + n2;
            if (operator === '-') result = n1 - n2;
            if (operator === '*') result = n1 * n2;
            if (operator === '/') result = n1 / n2;
            
            fullExpression = result.toString();
            calcDisplay.value = fullExpression;
            currentInput = result.toString();
            previousInput = operator = '';
            return;
        }

        if (['+', '-', '*', '/'].includes(value)) {
            if (!currentInput && !previousInput) return;
            if (currentInput) {
                operator = value;
                previousInput = currentInput;
                currentInput = '';
                fullExpression = previousInput + ' ' + operator + ' ';
                calcDisplay.value = fullExpression
            }
            return
        }

        currentInput += value;
        fullExpression = (previousInput ? previousInput + ' ' + operator + ' ' : ' ') + currentInput;
        calcDisplay.value = fullExpression;
    });
});


/*Notepad*/
const notepadTextarea = document.getElementById('notepad-textarea');
const npFileName = document.getElementById('np-file-name');
let openedNotepadFilePath = null;
let defaultSaveFolder = localStorage.getItem('default-save-path') || 'Root/Documents';
document.getElementById('default-save-select').value = defaultSaveFolder;

document.getElementById('default-save-select').addEventListener('change', (e) => {
    defaultSaveFolder = e.target.value;
    localStorage.setItem('default-save-path', defaultSaveFolder);
});

function sanitizeFileName(name) {
    return name.replace(/[\\/:*?"<>]/g, '').trim() || 'Untitled.txt';
}

function showStatus(message, color = 'green') {
    const el = document.getElementById('np-status-text');
    el.textContent = message; el.style.color = color; el.style.display = 'inline';
    setTimeout(() => el.style.display = 'none', 2000);
}

document.getElementById('np-save-btn').addEventListener('click', () => {
    const fileName = sanitizeFileName(npFileName.value);
    let newKey;
    
    if (openedNotepadFilePath) {
        const lastSlash = openedNotepadFilePath.lastIndexOf('/');
        const folderPath = lastSlash !== -1 ? openedNotepadFilePath.substring(0, lastSlash) : 'Root';
        newKey = 'webos-file-' + folderPath + '/' + fileName;
        if (fileName !== openedNotepadFilePath.substring(lastSlash + 1)) {
            localStorage.removeItem('webos-file-' + openedNotepadFilePath);
        }
        openedNotepadFilePath = folderPath + '/' + fileName;
    } else {
        newKey = 'webos-file-' + defaultSaveFolder + '/' + fileName;
        openedNotepadFilePath = defaultSaveFolder + '/' + fileName;
    }

    localStorage.setItem(newKey, notepadTextarea.value);
    showStatus('Saved!', '#27c93f');
    refreshFileExplorer();
});

document.getElementById('np-clear-btn').addEventListener('click', () => {
    const fileName = npFileName.value.trim() || 'Untitled.txt';
    const currentKey = 'webos-file-' + (openedNotepadFilePath || defaultSaveFolder + '/' + fileName);
    
    if (localStorage.getItem(currentKey)) {
        if (confirm(`Move "${fileName}" to Recycle Bin?`)) {
            localStorage.setItem('webos-file-Trash/' + fileName, localStorage.getItem(currentKey));
            localStorage.removeItem(currentKey);
            notepadTextarea.value = '';
            showStatus('Deleted!', '#ff5f56');
            refreshFileExplorer();
        }
    }
});

document.getElementById('np-close-btn').addEventListener('click', () => {
    notepadTextarea.value = '';
    npFileName.value = 'Untitled.txt';
    openedNotepadFilePath = null;
});


/*File Manager*/
let currentDirectory = 'Root';
let targetFileForMenu = null;
const breadcrumbs = document.getElementById('exp-breadcrumbs');
const fileListContainer = document.getElementById('file-list-container');
const sidebarItems = document.querySelectorAll('.sidebar-item');

document.getElementById('menu-explorer').addEventListener('click', refreshFileExplorer);

sidebarItems.forEach(item => {
    item.addEventListener('click', () => {
        sidebarItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        currentDirectory = item.getAttribute('data-path');
        breadcrumbs.textContent = currentDirectory;
        refreshFileExplorer();
    });
});

document.getElementById('exp-up-btn').addEventListener('click', () => {
    if (currentDirectory === 'Root' || currentDirectory === 'Trash') return;
    currentDirectory = currentDirectory.substring(0, currentDirectory.lastIndexOf('/')) || 'Root';
    sidebarItems.forEach(i => i.classList.toggle('active', i.getAttribute('data-path') === currentDirectory));
    breadcrumbs.textContent = currentDirectory;
    refreshFileExplorer();
});

function refreshFileExplorer() {
    fileListContainer.innerHTML = '';
    let hasContent = false;
    const folders = new Set(), files = [];

    if (currentDirectory === 'Root') {
        folders.add('Documents');
        folders.add('Pictures');
    }

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('webos-file-')) {
            const fullPath = key.replace('webos-file-', '');
            if (fullPath.startsWith(currentDirectory + '/')) {
                const relativePath = fullPath.replace(currentDirectory + '/', '');
                const nextSlash = relativePath.indexOf('/');
                if (nextSlash === -1) files.push({fullPath, fileName: relativePath, key});
                else folders.add(relativePath.substring(0, nextSlash));
            }
        }
    }

    folders.forEach(folderName => {
        hasContent = true;
        const div = document.createElement('div');
        div.className = 'file-item';
        div.innerHTML = `<div class='icon-emoji'>📁</div><div class='icon-label'>${folderName}</div>`;
        div.addEventListener('dblclick', () => {
            currentDirectory += '/' + folderName;
            breadcrumbs.textContent = currentDirectory;
            sidebarItems.forEach(i => i.classList.remove('active'));
            refreshFileExplorer();
        });
        fileListContainer.appendChild(div);
    });

    files.forEach(file => {
        hasContent = true;
        const div = document.createElement('div');
        div.className = 'file-item';
        div.dataset.path = file.fullPath;
        div.innerHTML = `<div class='icon-emoji'>📄</div><div class='icon-label'>${file.fileName}</div>`;
        
        div.addEventListener('dblclick', () => {
            document.getElementById('menu-notepad').click();
            npFileName.value = file.fileName;
            notepadTextarea.value = localStorage.getItem(file.key);
            openedNotepadFilePath = file.fullPath;
        });

        div.addEventListener('contextmenu', (e) => {
            e.preventDefault(); e.stopPropagation();

            if (!div.classList.contains('selected')){
                document.querySelectorAll('.file-item.selected').forEach(f => f.classList.remove('selected'));
                div.classList.add('selected');
            }

            targetFileForMenu = file.fullPath;
            fileContextMenu.style.display = 'block';
            fileContextMenu.style.left = e.clientX + 'px';
            fileContextMenu.style.top = e.clientY + 'px';
            
            document.getElementById('file-context-restore').style.display = currentDirectory === 'Trash' ? 'block' : 'none';
            const selectedCount = document.querySelectorAll('.file-item.selected').length;
            document.getElementById('file-context-rename').style.display = (currentDirectory === 'Trash' || selectedCount > 1) ? 'none' : 'block';
        });

        div.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!e.ctrlKey && !e.metaKey){
                document.querySelectorAll('.file-item.selected').forEach(f = f.classList.remove('selected'));
            }
            div.classList.add('selected');
        });
        
        fileListContainer.appendChild(div);
    });

    if (!hasContent) {
        fileListContainer.innerHTML = '<p style="color: #888; font-size: 13px; width: 100%; text-align: center; grid-column: 1/-1;">This folder is empty.</p>';
    }
}

document.getElementById('file-context-delete').addEventListener('click', () => {
    const selectedItems = document.querySelectorAll('.file-item.selected');
    
    if (selectedItems.length === 0) return;
    const isTrash = currentDirectory === 'Trash';
    const msg = selectedItems > 1
        ? (isTrash ? `Permanently delete ${selectedItems.length} items?` : `Move ${selectedItems.length} items to Recycle Bin?`)
        : (isTrash ? `Permanently delete this item?` : `Move to Recycle Bin?`);

    if (confirm(msg)){
        selectedItems.forEach(item => {
            const path = item.dataset.path;
            if (!path) return;

            const fileName = path.substring(path.lastIndexOf('/') + 1);
            if (isTrash) {
                localStorage.removeItem('webos-file-' + path);
            } else {
                localStorage.setItem('webos-file-Trash/' + fileName, localStorage.getItem('webos-file-' + path));
                localStorage.removeItem('webos-file-' + path);
            }
        });
        refreshFileExplorer();
        fileContextMenu.style.display = 'none'
    }
});

document.getElementById('file-context-rename').addEventListener('click', () => {
    if (!targetFileForMenu) return;
    const lastSlash = targetFileForMenu.lastIndexOf('/');
    const path = lastSlash !== -1 ? targetFileForMenu.substring(0, lastSlash) : 'Root';
    const oldName = targetFileForMenu.substring(lastSlash + 1);
    
    const newName = sanitizeFileName(prompt(`Rename "${oldName}":`, oldName));
    if (newName && newName !== oldName) {
        localStorage.setItem('webos-file-' + path + '/' + newName, localStorage.getItem('webos-file-' + targetFileForMenu));
        localStorage.removeItem('webos-file-' + targetFileForMenu);
        refreshFileExplorer();
    }
});

document.getElementById('file-context-restore').addEventListener('click', () => {
    const selectedItems = document.querySelectorAll('.file-item.selected');

    if (selectedItems.length > 0 && currentDirectory === 'Trash'){
        selectedItems.forEach(item => {
            const path = item.dataset.path;
            if (!path) return;

            const fileName = path.replace('Trash/', '');
            localStorage.setItem('webos-file-Root/' + fileName, localStorage.getItem('webos-file-' + path));
            localStorage.removeItem('webos-file-' + path);
        });
        refreshFileExplorer();
        fileContextMenu.style.display = 'none';
    }
});


document.addEventListener('DOMContentLoaded', () => {
    updateClock();
    
    const wallpOpt = localStorage.getItem('wallp-opt');
    if (wallpOpt === 'custom') setWallpaper(localStorage.getItem('wallpaper-url'));
    else if (wallpOpt === 'nasa') setWallpaper(localStorage.getItem('nasa-img'));
    if (wallpaperSelect) wallpaperSelect.value = wallpOpt || 'default';

    document.querySelectorAll('.desktop-icon').forEach(icon => {
        const savedX = localStorage.getItem(icon.id + '-x');
        const savedY = localStorage.getItem(icon.id + '-y');
        if (savedX) icon.style.left = savedX;
        if (savedY) icon.style.top = savedY;
    });

    refreshFileExplorer();
});


let isListView = false;
document.getElementById('exp-view-btn').addEventListener('click', () => {
    isListView = !isListView;
    document.getElementById('file-list-container').classList.toggle('list-view', isListView);
});

const originalRefresh = refreshFileExplorer;
refreshFileExplorer = function (){
    originalRefresh();
    const emptyBinBtn = document.getElementById('exp-empty-bin-btn');
    const upBtn = document.getElementById('exp-up-btn');

    if (emptyBinBtn){
        emptyBinBtn.style.display = currentDirectory === 'Trash' ? 'block' : 'none';
    }
    
    if (upBtn) {
        upBtn.style.display = (currentDirectory === 'Root' || currentDirectory === 'Trash') ? 'none' : 'block';
    }
};

document.getElementById('exp-empty-bin-btn').addEventListener('click', () => {
    if(confirm('Permanently delete all items in Recycle Bin? This cannot be undone.')){
        const keysToDelete = [];
        for(let i = 0; i < localStorage.length; i++){
            if (localStorage.key(i).startsWith('webos-file-Trash/')){
                keysToDelete.push(localStorage.key(i));
            }
        }
        keysToDelete.forEach(k => localStorage.removeItem(k));
        refreshFileExplorer();
    }
});


const expContent = document.querySelector('#explorer-window .window-content');
let selectionBox = null;
let startX, startY;

expContent.addEventListener('mousedown', (e) => {
    if (e.target.closest('.file-item') || e.button !== 0) return;

    const rect = expContent.getBoundingClientRect();

    if (e.clientX > rect.right - 18 && e.clientY > rect.bottom - 18) return;

    startX = e.clientX - rect.left + expContent.scrollLeft;
    startY = e.clientY - rect.top + expContent.scrollTop;

    selectionBox = document.createElement('div');
    selectionBox.className = 'selection-box';
    selectionBox.style.left = startX + 'px';
    selectionBox.style.top = startY + 'px';
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
    expContent.appendChild(selectionBox);

    document.querySelectorAll('.file-item.selected').forEach(f => f.classList.remove('selected'));
});

expContent.addEventListener('mousemove', (e) => {
    if (!selectionBox) return;
    const rect = expContent.getBoundingClientRect();
    const currentX = e.clientX - rect.left + expContent.scrollLeft;
    const currentY = e.clientY - rect.top + expContent.scrollTop;

    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    
    selectionBox.style.left = x + 'px';
    selectionBox.style.top = y + 'px';
    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';

    const boxRect = selectionBox.getBoundingClientRect();
    document.querySelectorAll('.file-item').forEach(item => {
        const itemRect = item.getBoundingClientRect();

        if(!(boxRect.right < itemRect.left || boxRect.left > itemRect.right || boxRect.bottom < itemRect.top || boxRect.top > itemRect.bottom)){
            item.classList.add('selected');
        } else {
            item.classList.remove('selected')
        }
    });
});

document.addEventListener('mouseup', () => {
    if(selectionBox){
        selectionBox.remove();
        selectionBox = null;
    }
});



/* Terminal Engine */

registerApp('terminal-window', 'taskbar-terminal', 'menu-terminal', 'term-min-btn', 'term-max-btn', 'term-close-btn');

const termInput = document.getElementById('term-input');
const termOutput = document.getElementById('term-output');
const termPrompt = document.getElementById('term-prompt')
const termContent = document.getElementById('term-content');
const termSuggestions = document.getElementById('term-suggestions');

let termCurrentDir = 'Root'
let termHistory = [];
let historyIndex = -1;

termContent.addEventListener('click', () => termInput.focus());

function printLine(text, isHTML = false){
    const line = document.createElement('div');
    if (isHTML) line.innerHTML = text;
    else line.textContent = text;
    termOutput.appendChild(line);
    termContent.scrollTop = termContent.scrollHeight;
}

function updatePrompt() {
    termPrompt.textContent = `stardancer@webos:~/${termCurrentDir}$`;
}

function resolvePath(target) {

    if (target !== '/' && target.endsWith('/')){
        target = target.slice(0, -1);
    }

    if (target === '/' || target === 'Root'){
        return 'Root';
    }
    if (target === '..'){
        if (termCurrentDir === 'Root'){
            return 'Root';
        }
        return termCurrentDir.substring(0, termCurrentDir.lastIndexOf('/'))
    }
    if (target.startsWith('Root/')){
        return target
    }
    if (target.toLowerCase().startsWith('root/')){
        return 'Root/' + target.substring(5);
    }
    return `${termCurrentDir}/${target}`;
}


function parseCommandChain(input){
    const commands = [];
    let currentCommand = '';
    let inSingleQuote = false;
    let inDoubleQuote = false;

    for (let i = 0; i < input.length; i++){
        const char = input[i];
        const nextChar = input[i+1];

        if (char === "'" && !inDoubleQuote) inSingleQuote = !inSingleQuote;
        if (char === '"' && !inSingleQuote) inDoubleQuote = !inDoubleQuote;

        if (!inSingleQuote & !inDoubleQuote){
            if (char === ';'){
                commands.push(currentCommand.trim(), ';');
                currentCommand = '';
                continue;
            }
            if (char === '&' && nextChar === '&'){
                commands.push(currentCommand.trim(), '&&');
                currentCommand = '';
                i++;
                continue;
            }
            if (char === '|' && nextChar === '|'){
                commands.push(currentCommand.trim(), '||');
                currentCommand = '';
                i++;
                continue;
            }
        }
        currentCommand += char;
    }
    if (currentCommand.trim()) commands.push(currentCommand.trim());
    return commands.filter(Boolean);
}


termInput.addEventListener('keydown', (e) => {
    
    if (e.key !== 'Tab' && termSuggestions) {
        termSuggestions.innerHTML = '';
    }

    if (e.key === 'Enter') {
        const inputStr = termInput.value.trim();
        const line = document.createElement('div');
        const promptSpan = document.createElement('span');
        promptSpan.className = 'term-prompt';
        promptSpan.textContent = termPrompt.textContent;
        line.appendChild(promptSpan);
        line.appendChild(document.createTextNode(' ' + inputStr));
        termOutput.appendChild(line);
        termContent.scrollTop = termContent.scrollHeight;
        termInput.value = '';
        
        if (inputStr) {
            termHistory.push(inputStr);
            historyIndex = termHistory.length;

            const chain = parseCommandChain(inputStr);
            let lastSuccess = true;
            let skipNext = false;

            for (let i = 0; i < chain.length; i++){
                const c = chain[i].trim();

                if (c === '&&'){
                    if (!lastSuccess) skipNext = true;
                    continue;
                }
                if (c === '||'){
                    if (lastSuccess) skipNext = true;
                    continue;
                }
                if (c === ';'){
                    continue;
                }

                if (skipNext){
                    skipNext = false;
                    continue;
                }

                lastSuccess = executeCommand(c);
            }
        }
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (historyIndex > 0) {
            historyIndex--;
            termInput.value = termHistory[historyIndex];
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex < termHistory.length - 1) {
            historyIndex++;
            termInput.value = termHistory[historyIndex];
        } else {
            historyIndex = termHistory.length;
            termInput.value = '';
        }
    } else if (e.key === 'Tab') {
        e.preventDefault();

        const inputStr = termInput.value;
        const words = inputStr.split(' ');
        const lastWord = words[words.length - 1];

        if (!lastWord && words.length > 1) return;

        const commandsList = ['help', 'clear', 'pwd', 'ls', 'cd', 'cat', 'touch', 'mkdir', 'rm', 'echo', 'whoami', 'date', 'history', 'nano'];
        let possibleMatches = [];

        if (words.length === 1) {
            possibleMatches = commandsList.filter(cmd => cmd.startsWith(lastWord.toLowerCase()));
        } else {
            const contents = new Set();
            if (termCurrentDir === 'Root') {
                contents.add('Documents');
                contents.add('Pictures');
            }
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(`webos-file-${termCurrentDir}/`)) {
                    const relative = key.replace(`webos-file-${termCurrentDir}/`, '');
                    const nextSlash = relative.indexOf('/');
                    if (nextSlash === -1) contents.add(relative); 
                    else contents.add(relative.substring(0, nextSlash)); 
                }
            }
            const items = Array.from(contents);
            possibleMatches = items.filter(item => item.toLowerCase().startsWith(lastWord.toLowerCase()));
        }

        if (possibleMatches.length === 1) {
            let match = possibleMatches[0];
            let isDir = false;
            
            if (words.length > 1) {
                isDir = (match === 'Documents' || match === 'Pictures');
                for (let i = 0; i < localStorage.length; i++) {
                    if (localStorage.key(i).startsWith(`webos-file-${termCurrentDir}/${match}/`)) {
                        isDir = true; break;
                    }
                }
            }
            words[words.length - 1] = isDir ? match + '/' : match;
            termInput.value = words.join(' ');
        } 
        else if (possibleMatches.length > 1) {
            let prefix = possibleMatches[0];
            for (let i = 1; i < possibleMatches.length; i++) {
                while (possibleMatches[i].toLowerCase().indexOf(prefix.toLowerCase()) !== 0) {
                    prefix = prefix.substring(0, prefix.length - 1);
                    if (prefix === '') break;
                }
            }
            
            const exactPrefix = possibleMatches[0].substring(0, prefix.length);
            
            if (exactPrefix.length > 0) {
                words[words.length - 1] = exactPrefix;
                termInput.value = words.join(' ');
            }

            const sortedMatches = possibleMatches.sort();
            const formattedMatches = sortedMatches.map(m => {
                if (words.length === 1) return m; 
                
                let isDir = (m === 'Documents' || m === 'Pictures');
                for (let i = 0; i < localStorage.length; i++) {
                    if (localStorage.key(i).startsWith(`webos-file-${termCurrentDir}/${m}/`)) {
                        isDir = true; break;
                    }
                }
                return isDir ? `<span style="color: #3b82f6; font-weight: bold;">${m}/</span>` : m;
            });
            
            termSuggestions.innerHTML = formattedMatches.join('  ');
            termContent.scrollTop = termContent.scrollHeight;
        }
    }
});


function executeCommand(input) {

    if (input === ';' || input === '&&' || input === '||') return true;
    const args = [];    
    const regex = /"([^"]*)"|'([^']*)'|([^\s]+)/g;
    let match;
    while ((match = regex.exec(input)) !== null) {
        args.push(match[1] || match[2] || match[3]); 
    }
    
    if (args.length === 0) return true;

    let redirectFile = null;
    let append = false;
    let redirectIdx = args.findIndex(a => a === '>' || a === '>>');

    if (redirectIdx !== -1) {
        append = args[redirectIdx] === '>>';
        redirectFile = args[redirectIdx + 1];
        if (!redirectFile) {
            printLine(`bash: syntax error near unexpected token \`newline\``);
            return false;
        }
        redirectFile = resolvePath(redirectFile);
        args.splice(redirectIdx);
    }

    const cmd = args[0].toLowerCase();

    const out = (text, isHTML = false) => {
        if (redirectFile) {
            const existing = localStorage.getItem(`webos-file-${redirectFile}`);
            let newText = text;
            if (append && existing !== null) {
                newText = existing + (existing.length > 0 ? '\n' : '') + text;
            }
            localStorage.setItem(`webos-file-${redirectFile}`, newText);
            refreshFileExplorer();
        } else {
            printLine(text, isHTML);
        }
    };

    switch (cmd) {
        case 'help':
            if (args.length > 1) { printLine(`bash: help: no help topics match \`${args[1]}\``); return false; }
            out("WebOS Bash V2.0");
            out("Available commands:");
            out("  help     - Show this message");
            out("  clear    - Clear terminal screen");
            out("  pwd      - Print working directory");
            out("  ls       - List directory contents");
            out("  cd <dir> - Change directory");
            out("  cat <f>  - Read file contents");
            out("  touch <f>- Create an empty file");
            out("  mkdir <d>- Create a directory");
            out("  rm <f>   - Delete a file");
            out("  echo <t> - Print text to screen");
            out("  whoami   - Print current user");
            out("  date     - Print current system date");
            out("  history  - Show command history");
            out("  nano <f> - Edit file in GUI Notepad");
            break;
            
        case 'clear':
            if (args.length > 1) { printLine(`clear: command-line arguments not supported`); return false; }
            termOutput.innerHTML = '';
            break;
            
        case 'pwd':
            if (args.length > 1) {
                if (args[1].startsWith('-')) printLine(`pwd: invalid option -- '${args[1].replace(/^-+/, '')}'`);
                else printLine(`pwd: too many arguments`);
                return false;
            }
            out('/' + termCurrentDir);
            break;
            
        case 'whoami':
            if (args.length > 1) { printLine(`whoami: extra operand '${args[1]}'`); return false; }
            out('stardancer');
            break;
            
        case 'date':
            if (args.length > 1) { printLine(`date: invalid date '${args[1]}'`); return false; }
            out(new Date().toString());
            break;

        case 'history':
            if (args.length > 1) { printLine(`bash: history: too many arguments`); return false; }
            termHistory.forEach((h, i) => out(`  ${i + 1}  ${h}`));
            break;
            
        case 'echo':
            out(args.slice(1).join(' '));
            break;

        case 'ls':
            if (args.length > 1) {
                const invalidArg = args[1];
                if (invalidArg.startsWith('-')) printLine(`ls: invalid option -- '${invalidArg.replace(/^-+/, '')}'`);
                else printLine(`ls: cannot access '${invalidArg}': No such file or directory`);
                return false;
            }
            const contents = new Set();
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(`webos-file-${termCurrentDir}/`)) {
                    const relative = key.replace(`webos-file-${termCurrentDir}/`, '');
                    const nextSlash = relative.indexOf('/');
                    if (nextSlash === -1) contents.add(relative); 
                    else contents.add(`<span style="color: #3b82f6; font-weight: bold;">${relative.substring(0, nextSlash)}/</span>`); 
                }
            }
            if (termCurrentDir === 'Root') {
                contents.add('<span style="color: #3b82f6; font-weight: bold;">Documents/</span>');
                contents.add('<span style="color: #3b82f6; font-weight: bold;">Pictures/</span>');
            }
            if (contents.size > 0) out(Array.from(contents).sort().join('  '), true);
            break;
            
        case 'cd':
            if (args.length > 2) { printLine(`bash: cd: too many arguments`); return false; }
            if (args.length > 1 && args[1].startsWith('-')) { printLine(`bash: cd: ${args[1]}: invalid option`); return false; }
            
            if (!args[1]) {
                termCurrentDir = 'Root';
            } else {
                const newDir = resolvePath(args[1]);
                const dirLower = newDir.toLowerCase();
                
                if (dirLower === 'root') termCurrentDir = 'Root';
                else if (dirLower === 'root/documents') termCurrentDir = 'Root/Documents';
                else if (dirLower === 'root/pictures') termCurrentDir = 'Root/Pictures';
                else if (dirLower === 'root/trash' || dirLower === 'trash') termCurrentDir = 'Trash';
                else {
                    let folderExists = false;
                    for (let i = 0; i < localStorage.length; i++) {
                        if (localStorage.key(i).startsWith(`webos-file-${newDir}/`)) {
                            folderExists = true; break;
                        }
                    }
                    if (folderExists) termCurrentDir = newDir;
                    else { printLine(`bash: cd: ${args[1]}: No such file or directory`); return false; }
                }
            }
            updatePrompt();
            break;

        case 'touch':
            if (!args[1]) { printLine("touch: missing file operand"); return false; }
            if (args[1].startsWith('-')) { printLine(`touch: invalid option -- '${args[1].replace(/^-+/, '')}'`); return false; }
            if (args.length > 2) { printLine("touch: multiple files not supported in WebOS v1"); return false; }
            
            const touchPath = resolvePath(args[1]);
            if (!localStorage.getItem(`webos-file-${touchPath}`)) {
                localStorage.setItem(`webos-file-${touchPath}`, '');
                refreshFileExplorer(); 
            }
            break;

        case 'mkdir':
            if (!args[1]) { printLine("mkdir: missing operand"); return false; }
            if (args[1].startsWith('-')) { printLine(`mkdir: invalid option -- '${args[1].replace(/^-+/, '')}'`); return false; }
            if (args.length > 2) { printLine("mkdir: multiple directories not supported in WebOS v1"); return false; }
            
            const dirPath = resolvePath(args[1]);
            localStorage.setItem(`webos-file-${dirPath}/.keep`, 'Directory placeholder');
            refreshFileExplorer();
            break;

        case 'rm':
            if (!args[1]) { printLine("rm: missing operand"); return false; }
            if (args[1].startsWith('-')) { printLine(`rm: invalid option -- '${args[1].replace(/^-+/, '')}'`); return false; }
            if (args.length > 2) { printLine("rm: multiple files not supported in WebOS v1"); return false; }
            
            const rmPath = resolvePath(args[1]);
            if (localStorage.getItem(`webos-file-${rmPath}`)) {
                localStorage.removeItem(`webos-file-${rmPath}`);
                refreshFileExplorer();
            } else {
                printLine(`rm: cannot remove '${args[1]}': No such file`);
                return false;
            }
            break;

        case 'cat':
            if (!args[1]) { printLine("cat: missing operand"); return false; }
            if (args[1].startsWith('-')) { printLine(`cat: invalid option -- '${args[1].replace(/^-+/, '')}'`); return false; }
            if (args.length > 2) { printLine("cat: multiple files not supported in WebOS v1"); return false; }
            
            const catPath = resolvePath(args[1]);
            const fileData = localStorage.getItem(`webos-file-${catPath}`);
            if (fileData !== null) out(fileData);
            else { printLine(`cat: ${args[1]}: No such file or directory`); return false; }
            break;

        case 'nano':
            if (!args[1]) { printLine("nano: missing filename"); return false; }
            if (args[1].startsWith('-')) { printLine(`nano: invalid option -- '${args[1].replace(/^-+/, '')}'`); return false; }
            if (args.length > 2) { printLine("nano: multiple files not supported in WebOS v1"); return false; }
            
            const nanoPath = resolvePath(args[1]);
            
            if (!localStorage.getItem(`webos-file-${nanoPath}`)) {
                localStorage.setItem(`webos-file-${nanoPath}`, '');
                refreshFileExplorer();
            }
            
            document.getElementById('menu-notepad').click(); 
            document.getElementById('np-file-name').value = nanoPath.substring(nanoPath.lastIndexOf('/') + 1);
            document.getElementById('notepad-textarea').value = localStorage.getItem(`webos-file-${nanoPath}`);
            openedNotepadFilePath = nanoPath; 
            
            out(`Opening ${args[1]} in Notepad...`);
            break;

        default:
            printLine(`bash: ${cmd}: command not found`);
            return false;
    }
    
    return true;
}