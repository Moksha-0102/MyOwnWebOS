import { osState } from "./state.js";

/*Drag and Drop*/

document.addEventListener('mousedown', (e) => {
    const clickedWindow = e.target.closest('.window, .welcome-modal');
    
    if (clickedWindow) {
        if(clickedWindow.id === 'welcome-window') {
            clickedWindow.style.zIndex = 99999;
        } else {
            osState.highestZIndex++;
            clickedWindow.style.zIndex = osState.highestZIndex;
        }
    }

    const titleBar = e.target.closest('.title-bar');
    const desktopIcon = e.target.closest('.desktop-icon');

    if (titleBar && e.target.tagName !== 'BUTTON') {
        osState.isDragging = true;
        osState.draggedWindow = clickedWindow;
        osState.draggedWindow.style.transition = 'none';

        osState.offsetX = e.clientX - osState.draggedWindow.offsetLeft;
        osState.offsetY = e.clientY - osState.draggedWindow.offsetTop;
    }
    else if (desktopIcon) {
        if (desktopIcon.classList.contains('custom-desktop-icon')) return; 

        e.preventDefault();
        osState.isDragging = true;
        osState.draggedWindow = desktopIcon;
        osState.offsetX = e.clientX - desktopIcon.offsetLeft;
        osState.offsetY = e.clientY - desktopIcon.offsetTop;
    }
});

document.addEventListener('mousemove', (e) => {
    if (!osState.isDragging || !osState.draggedWindow) return;

    let newX = e.clientX - osState.offsetX;
    let newY = e.clientY - osState.offsetY;

    if (newX < 0) newX = 0;
    if (newY < 0) newY = 0; 

    const maxX = window.innerWidth - 50; 
    if (newX > maxX) newX = maxX;

    let bottomLimit = osState.draggedWindow.classList.contains('desktop-icon') 
        ? window.innerHeight - 40 - osState.draggedWindow.offsetHeight 
        : window.innerHeight - 70;

    if(newY > bottomLimit) newY = bottomLimit;

    osState.draggedWindow.style.left = newX + 'px';
    osState.draggedWindow.style.top = newY + 'px';
});

document.addEventListener('mouseup', () => {
    if (osState.isDragging && osState.draggedWindow && osState.draggedWindow.classList.contains('desktop-icon')) {
        const currentX = parseInt(osState.draggedWindow.style.left, 10);
        const currentY = parseInt(osState.draggedWindow.style.top, 10);
        const snappedX = Math.round(currentX / 100) * 100 + 20;
        const snappedY = Math.round(currentY / 100) * 100 + 20;

        osState.draggedWindow.style.left = snappedX + 'px';
        osState.draggedWindow.style.top = snappedY + 'px';

        localStorage.setItem(osState.draggedWindow.id + '-x', osState.draggedWindow.style.left);
        localStorage.setItem(osState.draggedWindow.id + '-y', osState.draggedWindow.style.top);
    }

    if (osState.draggedWindow && !osState.draggedWindow.classList.contains('desktop-icon')) {
        osState.draggedWindow.style.transition = '';
    }

    osState.isDragging = false;
    osState.draggedWindow = null;
});


/* Window Management */

export function toggleMaximize(win) {
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

export function registerApp(winId, taskbarId, menuId, minId, maxId, closeId) {
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
        
        osState.highestZIndex++;
        win.style.zIndex = osState.highestZIndex;
        
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
