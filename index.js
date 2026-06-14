let use24HourTime = false;

function updateClock(){
    const now = new Date();
    
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();

    let displayHours = hours;
    let ampm = ''
    
    if(!use24HourTime){
        ampm = hours >= 12 ? ' PM' : ' AM';
        displayHours = hours % 12;
        displayHours = displayHours ? displayHours : 12;
    } else {
        displayHours = displayHours < 10 ? '0' + displayHours : displayHours;
    }

    minutes = minutes < 10 ? '0' + minutes : minutes;
    const colon = seconds % 2 === 0 ? ':' : ' ';

    const timeString = `${displayHours}${colon}${minutes} ${ampm}`;
    document.querySelector('.clock').textContent = timeString;
}

updateClock()
setInterval(updateClock, 1000)




let highestZIndex = 10;
let isDragging = false;
let draggedWindow = null;
let offsetX = 0;
let offsetY = 0;


document.addEventListener('mousedown', (e) => {
    const clickedWindow = e.target.closest('.window');
    if (clickedWindow) {

        if(clickedWindow.id === 'welcome-window'){
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

        offsetX = e.clientX - draggedWindow.offsetLeft;
        offsetY = e.clientY - draggedWindow.offsetTop;
    }
    else if (desktopIcon){
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

    let bottomLimit;

    if(draggedWindow.classList.contains('desktop-icon')){
        bottomLimit = window.innerHeight - 40 - draggedWindow.offsetHeight;
    } else {
        bottomLimit = window.innerHeight - 70;
    }

    if(newY > bottomLimit) newY = bottomLimit;

    draggedWindow.style.left = newX + 'px';
    draggedWindow.style.top = newY + 'px';
});

document.addEventListener('mouseup', () => {

    if (isDragging && draggedWindow && draggedWindow.classList.contains('desktop-icon')){
        localStorage.setItem(draggedWindow.id + '-x', draggedWindow.style.left);
        localStorage.setItem(draggedWindow.id + '-y', draggedWindow.style.top);
    }

    isDragging = false;
    draggedWindow = null;
});




function registerApp(winId, taskbarId, menuId, minId, maxId, closeId){
    const win = document.getElementById(winId);
    const taskbarBtn = document.getElementById(taskbarId);
    const menuBtn = document.getElementById(menuId);
    const minBtn = document.getElementById(minId);
    const maxBtn = document.getElementById(maxId);
    const closeBtn = document.getElementById(closeId);

    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            win.style.display = 'block';
            highestZIndex++;
            win.style.zIndex = highestZIndex;

            taskbarBtn.style.display = 'block';
            taskbarBtn.classList.add('active');

            document.getElementById('start-menu').style.display = 'none';
            document.querySelector('.start-button').classList.remove('active');
        });
    }

    if (closeBtn) closeBtn.addEventListener('click', () => {
        win.style.display = 'none';
        if (taskbarBtn) taskbarBtn.style.display = 'none';
    });

    if (maxBtn) maxBtn.addEventListener('click', () => {
        win.classList.toggle('maximized');
    });

    if (minBtn) minBtn.addEventListener('click', () => {
        win.style.display = 'none';
        if (taskbarBtn) taskbarBtn.classList.remove('active');
    })

    if (taskbarBtn) taskbarBtn.addEventListener('click', () => {
        if (win.style.display === 'none'){
            win.style.display = 'block';
            highestZIndex++;
            win.style.zIndex = highestZIndex;
            taskbarBtn.classList.add('active');
        } else {
            win.style.display = 'none';
            taskbarBtn.classList.remove('active');
        }
    });
}




const startButton = document.querySelector('.start-button');
const startMenu = document.getElementById('start-menu');

startButton.addEventListener('click', (e) => {
    e.stopPropagation();

    if (startMenu.style.display === 'block') {
        startMenu.style.display = 'none';
        startButton.classList.remove('active');
    } else {
        startMenu.style.display = 'block';
        startButton.classList.add('active');
    }
});

document.addEventListener('click', (e) => {
    if (startMenu.style.display === 'block' && !startMenu.contains(e.target)){
        startMenu.style.display = 'none';
        startButton.classList.remove('active');
    }
});






document.getElementById('time-format-select').addEventListener('change', (e) => {
    use24HourTime = e.target.value === '24';
    updateClock();
});

const wallpaperSelect = document.getElementById('wallpaper-select');
const customUrlInput = document.getElementById('custom-wallpaper-url');
const nasaError = document.getElementById('nasa-error');

function setWallpaper(url){
    document.body.style.backgroundImage = `url('${url}')`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
}

wallpaperSelect.addEventListener('change', async (e) => {
    const choice = e.target.value;

    customUrlInput.style.display = choice === 'custom' ? 'block' : 'none';
    
    nasaError.style.display = 'none';
    nasaError.style.color = 'red';
    nasaError.textContent = 'NASA Image not available right now. Falling back to default.';

    if (choice === 'default') {
        document.body.style.backgroundImage = 'none';
        document.body.style.backgroundColor = '#2b6cb0';
        localStorage.removeItem('wallpaper-url')
        localStorage.removeItem('nasa-img')
        localStorage.setItem('wallp-opt', 'default')
    }
    else if (choice === 'custom'){
        if (customUrlInput.value){
            setWallpaper(customUrlInput.value);
            localStorage.setItem('wallpaper-url', customUrlInput.value);
            localStorage.removeItem('nasa-img')
            localStorage.setItem('wallp-opt', 'custom')
        };
    }
    else if (choice === 'nasa'){

        nasaError.style.color = '#000080';
        nasaError.textContent = 'Connecting to NASA servers...';
        nasaError.style.display = 'block';
        document.body.style.cursor = 'wait';

        try {
            const response = await fetch('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY')
            const data = await response.json();

            if (data.media_type === 'image'){

                nasaError.textContent = 'Downloading high-res wallpaper...';

                const virtualImage = new Image();
                virtualImage.src = data.url;

                virtualImage.onload = () => {
                    setWallpaper(data.url);
                    nasaError.style.display = 'none';
                    document.body.style.cursor = 'default';
                    localStorage.setItem('nasa-img', data.url)
                    localStorage.removeItem(customUrlInput.value);
                    localStorage.setItem('wallp-opt', 'nasa');
                };

                virtualImage.onerror = () => {
                    throw new Error('NASA image file is corrupted or blocked.');
                };

            } else {
                throw new Error('Today APOD is a video, not an image.');
            }
        } catch (error) {
            console.error(error);
            nasaError.style.color = 'red';
            nasaError.textContent = 'NASA Image not availabe right now. Falling back to default.';
            nasaError.style.display = 'block';
            document.body.style.backgroundImage = 'none';
            document.body.style.backgroundColor = '#2b6cb0'
            document.body.style.cursor = 'default';
        } finally {
            document.body.style.cursor = 'default'
        }
    }
});

customUrlInput.addEventListener('input', (e) => {
    if (wallpaperSelect.value === 'custom'){
        setWallpaper(e.target.value);
    }
});



const calcDisplay = document.getElementById('calc-display');
const calcButtons = document.querySelectorAll('.calc-btn');

let currentInput = '';
let previousInput = '';
let operator = '';

calcButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        const value = e.target.textContent;

        if (value === 'C') {
            currentInput = '';
            previousInput = '';
            operator = '';
            calcDisplay.value = '0';
            return;
        }

        if (value === '='){
            if (currentInput === '' || previousInput === '') return;
            
            let result;

            const num1 = parseFloat(previousInput);
            const num2 = parseFloat(currentInput);

            if (operator === '+') result = num1 + num2;
            if (operator === '-') result = num1 - num2;
            if (operator === '*') result = num1 * num2;
            if (operator === '/') result = num1 / num2;

            calcDisplay.value = result;

            currentInput = result.toString();
            previousInput = '';
            operator = '';
            return;
        }

        if (['+', '-', '*', '/'].includes(value)){
            if (currentInput === '') return;

            operator = value;
            previousInput = currentInput;
            currentInput = '';
             return;
        }

        currentInput += value;
        calcDisplay.value = currentInput;
    });
});





const desktopNotepad = document.getElementById('desktop-notepad');
const desktopCalc = document.getElementById('desktop-calculator');

desktopNotepad.addEventListener('dblclick', () => {
    document.getElementById('menu-notepad').click();
});

desktopCalc.addEventListener('dblclick', () => {
    document.getElementById('menu-calculator').click();
});

const contextMenu = document.getElementById('desktop-context-menu');

document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.window') || e.target.closest('.taskbar') || e.target.closest('.start-menu')){
        return;
    }

    e.preventDefault();

    contextMenu.style.display = 'block';
    contextMenu.style.left = e.clientX + 'px';
    contextMenu.style.top = e.clientY + 'px';
});

document.addEventListener('click', () => {
    if (contextMenu.style.display === 'block'){
        contextMenu.style.display = 'none';
    }
});

document.getElementById('context-refresh').addEventListener('click', () => {
    location.reload()
})

document.getElementById('context-settings').addEventListener('click', () => {
    document.getElementById('menu-settings').click();
})

document.getElementById('icon-label-select').addEventListener('change', (e) => {
    const desktopEnv = document.querySelector('.desktop-environment');
    if (e.target.value === 'hide'){
        desktopEnv.classList.add('hide-labels');
    } else {desktopEnv.classList.remove('hide-labels');}
})










registerApp('notepad-window', 'taskbar-notepad', 'menu-notepad', 'np-min-btn', 'np-max-btn', 'np-close-btn');
registerApp('calculator-window', 'taskbar-calculator', 'menu-calculator', 'calc-min-btn', 'calc-max-btn', 'calc-close-btn');
registerApp('settings-window', 'taskbar-settings', 'menu-settings', 'set-min-btn', 'set-max-btn', 'set-close-btn');




document.querySelectorAll('.desktop-icon').forEach(icon => {
    const savedX = localStorage.getItem(icon.id + '-x');
    const savedY = localStorage.getItem(icon.id + '-y');

    if (savedX) icon.style.left = savedX;
    if (savedY) icon.style.top = savedY;
})




const welcomeOverlay = document.getElementById('welcome-overlay');
const welcomeWindow = document.getElementById('welcome-window');
const welcomeStartBtn = document.getElementById('welcome-start-btn');
const welcomeCloseBtn = document.getElementById('welcome-close-btn');
const welcomeDontShow = document.getElementById('welcome-dont-show');
const welcomeToggleSelect = document.getElementById('welcome-toggle-select');

const showWelcome = localStorage.getItem('showWelcomeScreen');

if (showWelcome === 'false'){
    welcomeToggleSelect.value = 'hide';
} else {
    welcomeOverlay.style.display = 'block';
    welcomeWindow.style.display = 'block';
    welcomeToggleSelect.value = 'show';
}

function closeWelcomeScreen(){
    if(welcomeDontShow.checked){
        localStorage.setItem('showWelcomeScreen', 'false');
        welcomeToggleSelect.value = 'hide'; 
    }
    welcomeOverlay.style.display = 'none';
    welcomeWindow.style.display = 'none';
}

welcomeStartBtn.addEventListener('click', closeWelcomeScreen);
welcomeCloseBtn.addEventListener('click', closeWelcomeScreen);

welcomeToggleSelect.addEventListener('change', (e) => {
    if (e.target.value === 'hide'){
        localStorage.setItem('showWelcomeScreen', 'false');
        welcomeDontShow.checked = true;
    } else {
        localStorage.setItem('showWelcomeScreen', 'true');
        welcomeDontShow.checked = false;
    }
});





const notepadTextarea = document.getElementById('notepad-textarea');
const npFileName = document.getElementById('np-file-name');
const npSaveBtn = document.getElementById('np-save-btn');
const npClearBtn = document.getElementById('np-clear-btn');
const npStatusText = document.getElementById('np-status-text');

function showStatus(message, color = 'green'){
    if (!npStatusText) return;
    npStatusText.textContent = message;
    npStatusText.style.color = color;
    npStatusText.style.display = 'inline';

    setTimeout(() => {
        npStatusText.style.display = 'none';
    }, 2000);
}

if (npSaveBtn){
    npSaveBtn.addEventListener('click', () => {
        const fileName = npFileName.value.trim() || 'Untitled.txt';

        const newKey = 'webos-file-' + currentDirectory + '/' + fileName;

        localStorage.setItem(newKey, notepadTextarea.value);
        showStatus('Saved!', 'green');
        refreshFileExplorer();
    });
}

if (npClearBtn) {
    npClearBtn.addEventListener('click', () => {
        const fileName = npFileName.value.trim() || 'Untitled.txt';
        const currentKey = 'webos-file-' + currentDirectory + '/' + fileName;
        const fileData = localStorage.getItem(currentKey);

        if (fileData !== null){

            if (currentDirectory === 'Trash'){
                if (confirm(`Are you sure you want to PERMANENTLY delete "${fileName}"?`)){
                    localStorage.removeItem(currentKey);
                    notepadTextarea.value = '';
                    showStatus('Deleted!', 'red');
                    refreshFileExplorer();
                }
            } 
            else {
                if (confirm(`Move "${fileName}" to Recycle Bin?`)){
                    localStorage.setItem('webos-file-Trash/' + fileName, fileData);
                    localStorage.removeItem(currentKey);

                    notepadTextarea.value = '';
                    showStatus('Item moved to Recycle Bin!', 'red');
                    refreshFileExplorer()

                }
            }
        }
    });
}




registerApp('explorer-window', 'taskbar-explorer', 'menu-explorer', 'exp-min-btn', 'exp-max-btn', 'exp-close-btn');

const desktopExplorer = document.getElementById('desktop-explorer');
desktopExplorer.addEventListener('dblclick', () => {
    document.getElementById('menu-explorer').click();
    refreshFileExplorer()
});

document.getElementById('menu-explorer').addEventListener('click', refreshFileExplorer);

const fileContextMenu = document.getElementById('file-context-menu');
let targetFileForMenu = null;
let currentDirectory = 'Root';
const sidebarItems = document.querySelectorAll('.sidebar-item');
const breadcrumbs = document.getElementById('exp-breadcrumbs');

sidebarItems.forEach(item => {
    item.addEventListener('click', () => {
        sidebarItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        currentDirectory = item.getAttribute('data-path');
        breadcrumbs.textContent = currentDirectory;
        refreshFileExplorer();
    })
})

document.addEventListener('click', () => {
    if (fileContextMenu.style.display && fileContextMenu.style.display === 'block'){
        fileContextMenu.style.display = 'none';
    }
})

const fileListContainer = document.getElementById('file-list-container');

function refreshFileExplorer(){
    fileListContainer.innerHTML = '';
    let hasContent = false;

    const foldersToDraw = new Set();
    const filesToDraw = [];

    if (currentDirectory === 'Root'){
        foldersToDraw.add('Documents');
        foldersToDraw.add('Pictures');
    }

    for(let i = 0; i < localStorage.length; i++){
        const key = localStorage.key(i);

        if(key.startsWith('webos-file-')){

            const fullPath = key.replace('webos-file-', '');

            if (fullPath.startsWith(currentDirectory + '/')){
                const relativePath = fullPath.replace(currentDirectory + '/', '');
                const nextSlashIndex = relativePath.indexOf('/');

                if (nextSlashIndex === -1){
                    filesToDraw.push({fullPath: fullPath, fileName: relativePath, key: key});
                } else {
                    const folderName = relativePath.substring(0, nextSlashIndex);
                    foldersToDraw.add(folderName);
                }
            }
        }
    }

    foldersToDraw.forEach(folderName => {
        hasContent = true;
        const folderDiv = document.createElement('div');
        folderDiv.className = 'file-item';
        folderDiv.innerHTML = `
            <div class='file-item-emoji'>📁</div>
            <div class='file-item-name'>${folderName}</div>
        `;

        folderDiv.addEventListener('dblclick', () => {
            currentDirectory = currentDirectory + '/' + folderName;

            breadcrumbs.textContent = currentDirectory;
            sidebarItems.forEach(i => i.classList.remove('active'));

            refreshFileExplorer();
        });

        fileListContainer.appendChild(folderDiv);
    });

    filesToDraw.forEach(file => {
        hasContent = true;
        const fileDiv = document.createElement('div');
        fileDiv.className = 'file-item';
        fileDiv.innerHTML = `
            <div class='file-item-emoji'>📄</div>
            <div class='file-item-name'>${file.fileName}</div>
        `;

        fileDiv.addEventListener('dblclick', () => {
            document.getElementById('menu-notepad').click();
            document.getElementById('np-file-name').value = file.fileName;
            document.getElementById('notepad-textarea').value = localStorage.getItem(file.key);

            const npWin = document.getElementById('notepad-window');
            highestZIndex++;
            npWin.style.zIndex = highestZIndex;
        });

        fileDiv.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            targetFileForMenu = file.fullPath;
            fileContextMenu.style.display = 'block';
            fileContextMenu.style.left = e.clientX + 'px';
            fileContextMenu.style.top = e.clientY + 'px';
        });

        fileListContainer.appendChild(fileDiv);
    });

    if(!hasContent){
        fileListContainer.innerHTML = '<p style="color: gray; font-size: 12px; width: 100%; grid-column: 1 / -1; text-align: center;">This folder is empty.</p>';
    }
}

document.getElementById('file-context-delete').addEventListener('click', () => {
    if (targetFileForMenu){
        const fileName = targetFileForMenu.substring(targetFileForMenu.lastIndexOf('/') + 1)

        if (currentDirectory === 'Trash'){
            if ( confirm(`Are you sure you want to PERMANENTLY delete "${fileName}"? This cannot be undone.`)){
                localStorage.removeItem('webos-file-' + targetFileForMenu);
                refreshFileExplorer();
            }
        } else {
            if (confirm(`Move this file to the Recycle Bin?`)){
                const fileData = localStorage.getItem('webos-file-' + targetFileForMenu);
                const fileName = targetFileForMenu.substring(targetFileForMenu.lastIndexOf('/') + 1);

                localStorage.setItem('webos-file-Trash/' + fileName, fileData);
                localStorage.removeItem('webos-file-' + targetFileForMenu);
                refreshFileExplorer();
            }
        }
    }
})

document.getElementById('file-context-rename').addEventListener('click', () => {
    if (targetFileForMenu) {

        const lastSlashIndex = targetFileForMenu.lastIndexOf('/');
        let path = 'Root';
        let oldName = targetFileForMenu;

        if (lastSlashIndex !== -1) {
            path = targetFileForMenu.substring(0, lastSlashIndex);
            oldName = targetFileForMenu.substring(lastSlashIndex + 1);
        }

        const newName = prompt(`Enter a new name for "${targetFileForMenu}":`, targetFileForMenu);

        if (newName && newName.trim() !== '' && newName !== targetFileForMenu){
            const fileData = localStorage.getItem('webos-file-' + targetFileForMenu);

            localStorage.setItem('webos-file-' + path + '/' + newName.trim(), fileData);
            localStorage.removeItem('webos-file-' + targetFileForMenu);

            refreshFileExplorer();
        }
    }
})




function bootOS() {
    updateClock();
    setInterval(updateClock, 1000);

    const wallpOpt = localStorage.getItem('wallp-opt');
    const wallpDropDown = document.getElementById('wallpaper-select');
    if(wallpOpt === 'default'){
        document.body.style.backgroundImage = 'none';
        document.body.style.backgroundColor = '#2b6cb0';
        wallpDropDown.selectedIndex = 0;
    } else if (wallpOpt === 'custom'){
        setWallpaper(localStorage.getItem('wallpaper-url'))
        wallpDropDown.selectedIndex = 1;
    } else if (wallpOpt === 'nasa'){
        setWallpaper(localStorage.getItem('nasa-img'));
        wallpDropDown.selectedIndex = 2;
    } else {
        document.body.style.backgroundImage = 'none';
        document.body.style.backgroundColor = '#2b6cb0';
        wallpDropDown.selectedIndex = 0;
    }

    refreshFileExplorer()
}

document.addEventListener('DOMContentLoaded', bootOS)