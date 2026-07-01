import { osState } from "./state.js";
import { osAlert, osConfirm, osPrompt } from "./dialog.js";

/*File Manager*/

const breadcrumbs = document.getElementById('exp-breadcrumbs');
const fileListContainer = document.getElementById('file-list-container');
const sidebarItems = document.querySelectorAll('.sidebar-item');
const folderContextMenu = document.getElementById('folder-context-menu');
const expContent = document.querySelector('#explorer-window .window-content');
const fileContextMenu = document.getElementById('file-context-menu');

let nativeDragPaths = [];
let isListView = false;
let currentSort = { column: 'name', direction: 1};
let selectionBox = null;
let startX, startY;

function sanitizeFileName(name) {
    return name.replace(/[\\/:*?"<>]/g, '').trim() || 'Untitled.txt';
}

export function initFileSystem() {
    if (!localStorage.getItem('webos-file-Root/Documents/.keep')) localStorage.setItem('webos-file-Root/Documents/.keep', 'DIR');
    if (!localStorage.getItem('webos-file-Root/Desktop/.keep')) localStorage.setItem('webos-file-Root/Desktop/.keep', 'DIR');
}

function getUniqueName(directory, baseName) {
    let newName = baseName;
    let counter = 1;
    let ext = "";
    let namePart = baseName;

    if (baseName.includes('.') && !baseName.startsWith('.')) {
        ext = baseName.substring(baseName.lastIndexOf('.'));
        namePart = baseName.substring(0, baseName.lastIndexOf('.'));
    }

    while (true) {
        let exists = false;
        let testPath = `webos-file-${directory}/${newName}`;
        for (let i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i);
            if (key === testPath || key.startsWith(testPath + '/')) { exists = true; break; }
        }
        if (!exists) return newName;
        newName = `${namePart} (${counter})${ext}`;
        counter++;
    }
}

document.getElementById('menu-explorer').addEventListener('click', refreshFileExplorer);

sidebarItems.forEach(item => {
    item.addEventListener('click', () => {
        sidebarItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        osState.currentDirectory = item.getAttribute('data-path');
        breadcrumbs.textContent = osState.currentDirectory;
        document.querySelector('.explorer-search').value = '';
        refreshFileExplorer();
    });

    item.addEventListener('dragover', (e) => {
        e.preventDefault();
        item.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
        item.style.color = '#3b82f6';
    });
    
    item.addEventListener('dragleave', () => {
        item.style.backgroundColor = '';
        item.style.color = '';
    });
    
    item.addEventListener('drop', async (e) => {
        e.preventDefault();
        item.style.backgroundColor = '';
        item.style.color = '';
        const targetDir = item.getAttribute('data-path');
        
        await handleNativeDrop(targetDir); 
    });
});

document.getElementById('exp-up-btn').addEventListener('click', () => {
    if (osState.currentDirectory === 'Root' || osState.currentDirectory === 'Trash') return;
    osState.currentDirectory = osState.currentDirectory.substring(0, currentDirectory.lastIndexOf('/')) || 'Root';
    sidebarItems.forEach(i => i.classList.toggle('active', i.getAttribute('data-path') === osState.currentDirectory));
    breadcrumbs.textContent = osState.currentDirectory;
    document.querySelector('.explorer-search').value = '';
    refreshFileExplorer();
});

export function refreshDesktopIcons() {
    document.querySelectorAll('.custom-desktop-icon').forEach(icon => icon.remove());
    const desktopEnv = document.querySelector('.desktop-environment');

    const folders = new Set(), files = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('webos-file-Root/Desktop/')) {
            const relative = key.replace('webos-file-Root/Desktop/', '');
            const nextSlash = relative.indexOf('/');
            if (nextSlash === -1) {
                if (relative !== '.keep') files.push({ fileName: relative, fullPath: `Root/Desktop/${relative}`, key });
            } else {
                folders.add(relative.substring(0, nextSlash));
            }
        }
    }

    const createDesktopIcon = (name, type, path) => {
        const iconDiv = document.createElement('div');
        iconDiv.className = 'desktop-icon custom-desktop-icon';
        iconDiv.dataset.path = path;
        iconDiv.dataset.type = type;
        iconDiv.draggable = true;

        const safeId = 'desktop-custom-' + name.replace(/[^a-zA-Z0-9]/g, '');
        iconDiv.id = safeId;

        const savedX = localStorage.getItem(safeId + '-x');
        const savedY = localStorage.getItem(safeId + '-y');
        if (savedX) iconDiv.style.left = savedX;
        if (savedY) iconDiv.style.top = savedY;
        else { iconDiv.style.left = '20px'; iconDiv.style.top = '400px'; }

        const emoji = type === 'folder' ? '📁' : '📄';
        iconDiv.innerHTML = `<div class='icon-emoji'>${emoji}</div><div class='icon-label'>${name}</div>`;

        iconDiv.addEventListener('dblclick', () => {
            if (type === 'folder') {
                document.getElementById('menu-explorer').click();
                osState.currentDirectory = path;
                document.getElementById('exp-breadcrumbs').textContent = osState.currentDirectory;
                refreshFileExplorer();
            } else {
                document.getElementById('menu-notepad').click();
                document.getElementById('np-file-name').value = name;
                document.getElementById('notepad-textarea').value = localStorage.getItem(`webos-file-${path}`);
                osState.openedNotepadFilePath = path;
            }
        });

        iconDiv.addEventListener('dragstart', handleNativeDragStart);
        iconDiv.addEventListener('click', handleFileSelect);
        
        if (type === 'folder') {
            iconDiv.addEventListener('dragover', (e) => { e.preventDefault(); iconDiv.style.filter = 'brightness(1.5)'; });
            iconDiv.addEventListener('dragleave', () => { iconDiv.style.filter = ''; });
            iconDiv.addEventListener('drop', async (e) => {
                e.preventDefault(); e.stopPropagation();
                iconDiv.style.filter = '';
                await handleNativeDrop(path);
            });
        }

        desktopEnv.appendChild(iconDiv);
    };

    folders.forEach(folderName => createDesktopIcon(folderName, 'folder', `Root/Desktop/${folderName}`));
    files.forEach(file => createDesktopIcon(file.fileName, 'file', file.fullPath));
}

const desktopEnv = document.querySelector('.desktop-environment');
desktopEnv.addEventListener('dragover', (e) => e.preventDefault());
desktopEnv.addEventListener('drop', async (e) => {
    e.preventDefault();
    
    if (e.target.closest('.desktop-icon') && !e.target.closest('.custom-desktop-icon[data-type="folder"]')) return;

    if (nativeDragPaths.length > 0) {
        let cascadeOffset = 0;
        
        for (let sourcePath of nativeDragPaths) {
            const itemName = sourcePath.substring(sourcePath.lastIndexOf('/') + 1);
            const safeId = 'desktop-custom-' + itemName.replace(/[^a-zA-Z0-9]/g, '');
            const snappedX = Math.round((e.clientX - 40) / 90) * 90 + 20 + cascadeOffset;
            const snappedY = Math.round((e.clientY - 40) / 90) * 90 + 20 + cascadeOffset;
            localStorage.setItem(safeId + '-x', snappedX + 'px');
            localStorage.setItem(safeId + '-y', snappedY + 'px');
            const iconEl = document.getElementById(safeId);
            if (iconEl && sourcePath.startsWith('Root/Desktop/') && sourcePath.lastIndexOf('/') === 12) {
                iconEl.style.left = snappedX + 'px';
                iconEl.style.top = snappedY + 'px';
            }
            cascadeOffset += 25;
        }
        
        await handleNativeDrop('Root/Desktop');
    }
});

export function refreshFileExplorer() {
    fileListContainer.innerHTML = '';
    let hasContent = false;
    const folders = new Set(), files = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(`webos-file-${osState.currentDirectory}/`)) {
            const relativePath = key.replace(`webos-file-${osState.currentDirectory}/`, '');
            const nextSlash = relativePath.indexOf('/');
            if (nextSlash === -1) {
                if (relativePath !== '.keep') files.push({fullPath: `${osState.currentDirectory}/${relativePath}`, fileName: relativePath, key});
            } else {
                folders.add(relativePath.substring(0, nextSlash));
            }
        }
    }

    const searchQuery = document.querySelector('.explorer-search').value.toLowerCase();

    const getMeta = (pathKey) => {
        const metaKey = 'os-meta' + pathKey;
        let ts = localStorage.getItem(metaKey);
        if (!ts) {
            ts = Date.now();
            localStorage.setItem(metaKey, ts);
        }
        return {
            ts: parseInt(ts),
            str: new Date(parseInt(ts)).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})
        };
    };

    let folderArr = Array.from(folders).map(f => {
        const meta = getMeta(`webos-folder-${osState.currentDirectory}/${f}`);
        return { name: f, type: 'folder', ts: meta.ts, dateStr: meta.str };
    });
    
    let fileArr = Array.from(files).map(f => {
        const meta = getMeta(f.key);
        return {
            name: f.fileName,
            fullPath: f.fullPath,
            key: f.key,
            type: f.fileName.endsWith('.app') ? 'app' : 'file',
            ts: meta.ts,
            dateStr: meta.str
        };
    });

    const sortEngine = (a, b) => {
        let valA, valB;
        if (currentSort.column === 'name') { valA = a.name.toLowerCase(); valB = b.name.toLowerCase(); }
        else if (currentSort.column === 'date') { valA = a.ts; valB = b.ts; }
        else if (currentSort.column === 'type') { valA = a.type; valB = b.type; }

        if (valA < valB) return -1 * currentSort.direction;
        if (valA > valB) return 1 * currentSort.direction;
        return 0;
    };

    folderArr.sort(sortEngine);
    fileArr.sort(sortEngine);

    folderArr.forEach(folder => {
        if (searchQuery && !folder.name.toLowerCase().includes(searchQuery)) return;
        hasContent = true;
        const div = document.createElement('div');
        div.className = 'file-item folder-item';
        div.dataset.path = osState.currentDirectory + '/' + folder.name;
        div.dataset.type = 'folder';
        div.draggable = true;
        div.innerHTML = `
            <div class='icon-emoji'>📁</div>
            <div class='icon-label'>${folder.name}</div>
            <div class='list-col'>${folder.dateStr}</div>
            <div class='list-col'>File Folder</div>
        `;
        
        div.addEventListener('dblclick', () => {
            osState.currentDirectory += '/' + folder.name;
            breadcrumbs.textContent = osState.currentDirectory;
            sidebarItems.forEach(i => i.classList.remove('active'));
            document.querySelector('.explorer-search').value = '';
            refreshFileExplorer();
        });
        
        div.addEventListener('dragover', (e) => { e.preventDefault(); div.style.backgroundColor = 'rgba(59, 130, 246, 0.2)'; div.style.border = '1px dashed #3b82f6'; });
        div.addEventListener('dragleave', () => { div.style.backgroundColor = ''; div.style.border = ''; });
        div.addEventListener('drop', async (e) => {
            e.preventDefault(); div.style.backgroundColor = ''; div.style.border = '';
            await handleNativeDrop(div.dataset.path);
        });

        div.addEventListener('dragstart', handleNativeDragStart);
        div.addEventListener('contextmenu', handleFileContext);
        div.addEventListener('click', handleFileSelect);
        fileListContainer.appendChild(div);
    });

    fileArr.forEach(file => {
        if (searchQuery && !file.name.toLowerCase().includes(searchQuery)) return;
        hasContent = true;
        const div = document.createElement('div');
        div.className = 'file-item';
        div.dataset.path = file.fullPath;
        div.dataset.type = 'file';
        div.draggable = true;
        div.innerHTML = `
            <div class='icon-emoji'>📄</div>
            <div class='icon-label'>${file.name}</div>
            <div class='list-col'>${file.dateStr}</div>
            <div class='list-col'>${file.type === 'app' ? 'Application' : 'Text Document'}</div>
        `;
        
        div.addEventListener('dblclick', () => {
            document.getElementById('menu-notepad').click();
            document.getElementById('np-file-name').value = file.name;
            document.getElementById('notepad-textarea').value = localStorage.getItem(file.key);
            osState.openedNotepadFilePath = file.fullPath;
        });

        div.addEventListener('dragstart', handleNativeDragStart);
        div.addEventListener('contextmenu', handleFileContext);
        div.addEventListener('click', handleFileSelect);
        fileListContainer.appendChild(div);
    });

    if (osState.currentDirectory === 'Root/Desktop' && !searchQuery){
        const systemApps = [
            { name: 'Notepad', icon:'📝', id: 'menu-notepad', type: 'app', path: 'Notepad.app' },
            { name: 'Calculator', icon: '🧮', id: 'menu-calculator', type: 'app', path: 'Calculator.app'},
            { name: 'File Manager', icon: '📁', id: 'menu-explorer', type: 'app', path: 'Explorer.app'},
            { name: 'Terminal', icon: '⌨️', id: 'menu-terminal', type: 'app', path: 'Terminal.app'},
            { name: 'Browser', icon: '🌐', id: 'menu-browser', type: 'app', path: 'Browser.app'},
            { name: 'Settings', icon: '⚙️', id: 'menu-settings', type: 'app', path: 'Settings.app'}
        ];

        systemApps.sort(sortEngine);

        systemApps.forEach(app => {
            hasContent = true;
            const div = document.createElement('div');
            div.className = 'file-item system-app';
            div.dataset.path = `Root/Desktop/${app.name}`;
            div.innerHTML = `
                <div class='icon-emoji'>${app.icon}</div>
                <div class='icon-label'>${app.name}</div>
                <div class='list-col'>--</div>
                <div class='list-col'>Application</div>
            `;
            div.addEventListener('dblclick', () => { document.getElementById(app.id).click(); });
            div.addEventListener('contextmenu', handleFileContext);
            div.addEventListener('click', handleFileSelect);
            fileListContainer.appendChild(div);
        });
    }

    if (!hasContent) {
        fileListContainer.innerHTML = '<p style="color: #888; font-size: 13px; width: 100%; text-align: center; grid-column: 1/-1;">This folder is empty.</p>';
    }
    
    refreshDesktopIcons(); 
    
    const emptyBinBtn = document.getElementById('exp-empty-bin-btn');
    const upBtn = document.getElementById('exp-up-btn');
    if (emptyBinBtn) emptyBinBtn.style.display = osState.currentDirectory === 'Trash' ? 'block' : 'none';
    if (upBtn) upBtn.style.display = (osState.currentDirectory === 'Root' || osState.currentDirectory === 'Trash') ? 'none' : 'block';
}

document.querySelector('.explorer-search').addEventListener('input', refreshFileExplorer);

function handleFileSelect(e) {
    e.stopPropagation();
    if (!e.ctrlKey && !e.metaKey){
        document.querySelectorAll('.file-item.selected, .custom-desktop-icon.selected').forEach(f => f.classList.remove('selected'));
    }
    this.classList.add('selected');
}

function handleFileContext(e) {
    e.preventDefault(); e.stopPropagation();
    if (!this.classList.contains('selected')){
        document.querySelectorAll('.file-item.selected').forEach(f => f.classList.remove('selected'));
        this.classList.add('selected');
    }

    osState.targetFileForMenu = this.dataset.path;
    fileContextMenu.style.display = 'block';
    folderContextMenu.style.display = 'none';
    fileContextMenu.style.left = e.clientX + 'px';
    fileContextMenu.style.top = e.clientY + 'px';
    
    document.getElementById('file-context-restore').style.display = osState.currentDirectory === 'Trash' ? 'block' : 'none';
    const selectedCount = document.querySelectorAll('.file-item.selected').length;
    document.getElementById('file-context-rename').style.display = (osState.currentDirectory === 'Trash' || selectedCount > 1) ? 'none' : 'block';
}

expContent.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.file-item') || osState.currentDirectory === 'Trash') return; 
    e.preventDefault();
    fileContextMenu.style.display = 'none';
    folderContextMenu.style.display = 'block';
    folderContextMenu.style.left = e.clientX + 'px';
    folderContextMenu.style.top = e.clientY + 'px';
    
    document.getElementById('folder-context-paste').style.opacity = osState.clipboard.paths.length ? '1' : '0.5';
    document.getElementById('folder-context-paste').style.pointerEvents = osState.clipboard.paths.length ? 'auto' : 'none';
});

document.addEventListener('click', () => { folderContextMenu.style.display = 'none'; fileContextMenu.style.display = 'none'; });

function handleNativeDragStart(e) {
    if (!this.classList.contains('selected')) {
        document.querySelectorAll('.file-item.selected, .custom-desktop-icon.selected').forEach(f => f.classList.remove('selected'));
        this.classList.add('selected');
    }
    
    nativeDragPaths = Array.from(document.querySelectorAll('.file-item.selected, .custom-desktop-icon.selected'))
        .map(el => el.dataset.path)
        .filter(path => path);
        
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', nativeDragPaths.join(',')); 
}

async function handleNativeDrop(targetDirectory) {
    if (!nativeDragPaths.length) return;
    
    for (let sourcePath of nativeDragPaths) {
        const itemName = sourcePath.substring(sourcePath.lastIndexOf('/') + 1);
        if (targetDirectory.startsWith(sourcePath)) {
            await osAlert("Cannot move a folder into itself.", "File System Error");
            continue;
        }
        if (sourcePath === targetDirectory + '/' + itemName) continue;

        const protectedPaths = ['Root/Documents', 'Root/Desktop'];

        if (protectedPaths.includes(sourcePath) || sourcePath.endsWith('.app')){
            await osAlert("Not Allowed: Core folders and applications cannot be moved to a different directory.", "System Security");
            continue;
        }

        const safeName = getUniqueName(targetDirectory, itemName);
        const targetPathBase = `${targetDirectory}/${safeName}`;

        const keysToMove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key === `webos-file-${sourcePath}` || key.startsWith(`webos-file-${sourcePath}/`)) {
                keysToMove.push(key);
            }
        }
        
        keysToMove.forEach(key => {
            const relativeSuffix = key.replace(`webos-file-${sourcePath}`, '');
            const newKey = `webos-file-${targetPathBase}${relativeSuffix}`;
            localStorage.setItem(newKey, localStorage.getItem(key));
            localStorage.removeItem(key); 
        });
    }
    nativeDragPaths = [];
    refreshFileExplorer();
}

expContent.addEventListener('dragover', (e) => e.preventDefault());
expContent.addEventListener('drop', async (e) => {
    e.preventDefault();
    if (e.target.closest('.folder-item')) return;
    await handleNativeDrop(osState.currentDirectory);
});

document.getElementById('folder-context-new').addEventListener('click', async () => {
    let folderName = await osPrompt("Enter folder name:", "New Folder", "Create Directory");
    if (folderName) folderName = sanitizeFileName(folderName)
    if (!folderName) return;
    
    folderName = getUniqueName(osState.currentDirectory, folderName);
    localStorage.setItem(`webos-file-${osState.currentDirectory}/${folderName}/.keep`, 'DIR');
    refreshFileExplorer();
});

document.getElementById('file-context-copy').addEventListener('click', async () => {
    osState.clipboard.action = 'copy';
    
    const selected = Array.from(document.querySelectorAll('.file-item.selected')).map(el => el.dataset.path);
    const protectedPaths = ['Root/Documents', 'Root/Desktop'];
    let hasProtected = false;
    
    osState.clipboard.paths = selected.filter(path => {
        if (path && (protectedPaths.includes(path) || path.endsWith('.app'))) {
            hasProtected = true;
            return false;
        }
        return path;
    });

    if (hasProtected) {
        await osAlert("System Architecture Lock: Core folders and applications cannot be copied.", "System Security");
    }
});

document.getElementById('folder-context-paste').addEventListener('click', async () => {
    if (!osState.clipboard.paths || !osState.clipboard.paths.length || osState.clipboard.action !== 'copy') return;
    
    for (let sourcePath of osState.clipboard.paths) {
        if (!sourcePath) continue;
        const originalName = sourcePath.substring(sourcePath.lastIndexOf('/') + 1);
        
        if (osState.currentDirectory.startsWith(sourcePath)) {
            await osAlert("Cannot paste a folder into itself.", "System Error");
            continue;
        }

        const safeName = getUniqueName(osState.currentDirectory, originalName);
        const targetPathBase = `${osState.currentDirectory}/${safeName}`;

        const keysToCopy = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key === `webos-file-${sourcePath}` || key.startsWith(`webos-file-${sourcePath}/`)) {
                keysToCopy.push(key);
            }
        }
        
        keysToCopy.forEach(key => {
            const relativeSuffix = key.replace(`webos-file-${sourcePath}`, '');
            const newKey = `webos-file-${targetPathBase}${relativeSuffix}`;
            localStorage.setItem(newKey, localStorage.getItem(key));
        });
    }
    refreshFileExplorer();
});

document.getElementById('file-context-rename').addEventListener('click', async () => {
    if (!osState.targetFileForMenu) return;
    const protectedPaths = ['Root/Documents', 'Root/Desktop'];
    if (protectedPaths.includes(osState.targetFileForMenu) || osState.targetFileForMenu.endsWith('.app')){
        await osAlert("Not Allowed: Core folders and applications cannot be renamed.", "System Security");
        return;
    }

    const lastSlash = osState.targetFileForMenu.lastIndexOf('/');
    const path = lastSlash !== -1 ? osState.targetFileForMenu.substring(0, lastSlash) : 'Root';
    const oldName = osState.targetFileForMenu.substring(lastSlash + 1);
    
    const baseNewName = sanitizeFileName(await osPrompt(`Rename "${oldName}":`, oldName, "Rename File"));
    if (baseNewName && baseNewName !== oldName) {
        const safeNewName = getUniqueName(path, baseNewName);
        const keysToRename = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key === `webos-file-${osState.targetFileForMenu}` || key.startsWith(`webos-file-${osState.targetFileForMenu}/`)) keysToRename.push(key);
        }
        keysToRename.forEach(key => {
            const relativeSuffix = key.replace(`webos-file-${osState.targetFileForMenu}`, '');
            const newKey = `webos-file-${path}/${safeNewName}${relativeSuffix}`;
            localStorage.setItem(newKey, localStorage.getItem(key));
            localStorage.removeItem(key);
        });
        refreshFileExplorer();
    }
});

document.getElementById('file-context-delete').addEventListener('click', async () => {
    const selectedItems = document.querySelectorAll('.file-item.selected');
    if (selectedItems.length === 0) return;

    const protectedPaths = ['Root/Documents', 'Root/Desktop'];
    let containsProtected = false;
    selectedItems.forEach(item => {
        if (protectedPaths.includes(item.dataset.path) || item.dataset.path.endsWith('.app')){
            containsProtected = true;
        }
    });

    if (containsProtected) {
        await osAlert("Not Allowed: Core folders and applications cannot be deleted.", "System Security");
        return;
    }
    
    const isTrash = osState.currentDirectory === 'Trash';
    const msg = selectedItems.length > 1
        ? (isTrash ? `Permanently delete ${selectedItems.length} items?` : `Move ${selectedItems.length} items to Recycle Bin?`)
        : (isTrash ? `Permanently delete this item?` : `Move to Recycle Bin?`);

    if (await osConfirm(msg, "Confirm Deletion")){
        selectedItems.forEach(item => {
            const sourcePath = item.dataset.path;
            if (!sourcePath) return;

            const originalName = sourcePath.substring(sourcePath.lastIndexOf('/') + 1);
            const keysToDelete = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key === `webos-file-${sourcePath}` || key.startsWith(`webos-file-${sourcePath}/`)) keysToDelete.push(key);
            }
            
            const safeTrashName = isTrash ? originalName : getUniqueName('Trash', originalName);

            keysToDelete.forEach(key => {
                if (isTrash) {
                    localStorage.removeItem(key);
                } else {
                    const relativeSuffix = key.replace(`webos-file-${sourcePath}`, '');
                    localStorage.setItem(`webos-file-Trash/${safeTrashName}${relativeSuffix}`, localStorage.getItem(key));
                    localStorage.removeItem(key);
                }
            });
        });
        refreshFileExplorer();
    }
});

document.getElementById('file-context-restore').addEventListener('click', () => {
    const selectedItems = document.querySelectorAll('.file-item.selected');
    if (selectedItems.length > 0 && osState.currentDirectory === 'Trash'){
        selectedItems.forEach(item => {
            const sourcePath = item.dataset.path;
            const originalName = sourcePath.replace('Trash/', '');
            const safeRestoreName = getUniqueName('Root', originalName);
            
            const keysToRestore = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key === `webos-file-${sourcePath}` || key.startsWith(`webos-file-${sourcePath}/`)) keysToRestore.push(key);
            }
            
            keysToRestore.forEach(key => {
                const relativeSuffix = key.replace(`webos-file-${sourcePath}`, '');
                localStorage.setItem(`webos-file-Root/${safeRestoreName}${relativeSuffix}`, localStorage.getItem(key));
                localStorage.removeItem(key);
            });
        });
        refreshFileExplorer();
    }
});

document.getElementById('exp-empty-bin-btn').addEventListener('click', async () => {
    if(await osConfirm('Permanently delete all items in Recycle Bin?', "System Settings")){
        const keysToDelete = [];
        for(let i = 0; i < localStorage.length; i++){
            if (localStorage.key(i).startsWith('webos-file-Trash/')) keysToDelete.push(localStorage.key(i));
        }
        keysToDelete.forEach(k => localStorage.removeItem(k));
        refreshFileExplorer();
    }
});

document.getElementById('exp-view-btn').addEventListener('click', () => {
    isListView = !isListView;
    document.getElementById('file-list-container').classList.toggle('list-view', isListView);
    document.getElementById('list-headers').style.display = isListView ? 'grid' : 'none';
});

document.querySelectorAll('.sort-header').forEach(header => {
    header.addEventListener('click', () => {
        const col = header.dataset.sort;
        if (currentSort.column === col) {
            currentSort.direction *= -1;
        } else {
            currentSort.column = col;
            currentSort.direction = 1;
            document.querySelectorAll('.sort-header').forEach(h => h.style.color = '#888');
            header.style.color = 'var(--text-color)';
        }
        document.querySelectorAll('.sort-arrow').forEach(a => a.textContent = '');
        header.querySelector('.sort-arrow').textContent = currentSort.direction === 1 ? '▲' : '▼';
        refreshFileExplorer();
    });
});

const propWindow = document.getElementById('properties-window');
document.getElementById('prop-close-btn').addEventListener('click', () => propWindow.style.display = 'none');

function showProperties(path, type) {
    if (!path) return;
    const name = path.substring(path.lastIndexOf('/') + 1);
    const location = path.substring(0, path.lastIndexOf('/'));
    
    document.getElementById('prop-name').value = name;
    document.getElementById('prop-location').textContent = location || 'Root';
    
    if (type === 'folder') {
        document.getElementById('prop-icon').textContent = '📁';
        document.getElementById('prop-type').textContent = 'File Folder';
        
        let fileCount = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(`webos-file-${path}/`) && !key.endsWith('.keep')) fileCount++;
        }
        document.getElementById('prop-contains').textContent = `${fileCount} Items`;
    } else {
        document.getElementById('prop-icon').textContent = '📄';
        document.getElementById('prop-type').textContent = name.endsWith('.app') ? 'Application' : 'Text Document';
        document.getElementById('prop-contains').textContent = '--';
    }
    
    propWindow.style.display = 'block';
    osState.highestZIndex++;
    propWindow.style.zIndex = osState.highestZIndex;
}

document.getElementById('file-context-properties').addEventListener('click', () => {
    const item = document.querySelector(`.file-item[data-path="${osState.targetFileForMenu}"]`);
    if (item) showProperties(osState.targetFileForMenu, item.dataset.type);
});

document.getElementById('folder-context-properties').addEventListener('click', () => {
    showProperties(osState.currentDirectory, 'folder');
});


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

    selectionBox.style.left = Math.min(startX, currentX) + 'px';
    selectionBox.style.top = Math.min(startY, currentY) + 'px';
    selectionBox.style.width = Math.abs(currentX - startX) + 'px';
    selectionBox.style.height = Math.abs(currentY - startY) + 'px';

    const boxRect = selectionBox.getBoundingClientRect();
    document.querySelectorAll('.file-item').forEach(item => {
        const itemRect = item.getBoundingClientRect();
        if(!(boxRect.right < itemRect.left || boxRect.left > itemRect.right || boxRect.bottom < itemRect.top || boxRect.top > itemRect.bottom)){
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
});

document.addEventListener('mouseup', () => {
    if(selectionBox){ selectionBox.remove(); selectionBox = null; }
});