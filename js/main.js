import { osState } from "./state.js";
import { initFileSystem, refreshFileExplorer } from "./fileSystem.js";
import { setWallpaper } from "./settings.js";
import { registerApp } from "./windowManager.js";
import './windowManager.js';
import './fileSystem.js';
import './browser.js';
import './terminal.js';
import './settings.js';
import './bootloader.js';
import './settings.js';
import './utils.js';


/*Clock*/ 

export function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();
    let displayHours = hours;
    let ampm = '';
    
    if (!osState.use24HourTime) {
        ampm = hours >= 12 ? ' PM' : ' AM';
        displayHours = hours % 12;
        displayHours = displayHours ? displayHours : 12;
    } else {
        displayHours = displayHours < 10 ? '0' + displayHours : displayHours;
    }

    minutes = minutes < 10 ? '0' + minutes : minutes;
    const colon = seconds % 2 === 0 ? ':' : ' ';
    const clockEl = document.querySelector('.clock');
    if (clockEl) clockEl.textContent = `${displayHours}${colon}${minutes} ${ampm}`;
}
osState.systemClockInterval = setInterval(updateClock, 1000);


/* System init*/

document.addEventListener('DOMContentLoaded', () => {
    initFileSystem(); 
    refreshFileExplorer();
    updateClock();
    
    const wallpOpt = localStorage.getItem('wallp-opt');
    const wSelect = document.getElementById('wallpaper-select');
    if (wSelect) wSelect.value = wallpOpt || 'default';

    if (wallpOpt === 'custom') setWallpaper(localStorage.getItem('wallpaper-url'));
    else if (wallpOpt === 'nasa') setWallpaper(localStorage.getItem('nasa-img'));

    document.querySelectorAll('.desktop-icon').forEach(icon => {
        const savedX = localStorage.getItem(icon.id + '-x');
        const savedY = localStorage.getItem(icon.id + '-y');
        if (savedX) icon.style.left = savedX;
        if (savedY) icon.style.top = savedY;
    });

    registerApp('notepad-window', 'taskbar-notepad', 'menu-notepad', 'np-min-btn', 'np-max-btn', 'np-close-btn');
    registerApp('calculator-window', 'taskbar-calculator', 'menu-calculator', 'calc-min-btn', 'calc-max-btn', 'calc-close-btn');
    registerApp('explorer-window', 'taskbar-explorer', 'menu-explorer', 'exp-min-btn', 'exp-max-btn', 'exp-close-btn');
    registerApp('settings-window', 'taskbar-settings', 'menu-settings', 'set-min-btn', 'set-max-btn', 'set-close-btn');
    
    console.log("EpochOS Core Modules Loaded Successfully.");
});


/*Start and context menu*/

const startButton = document.querySelector('.start-button');
const startMenu = document.getElementById('start-menu');
const desktopContextMenu = document.getElementById('desktop-context-menu');
const fileContextMenu = document.getElementById('file-context-menu');

if (startButton && startMenu) {
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
}

document.addEventListener('click', (e) => {
    if (startMenu && startMenu.style.display === 'block' && !startMenu.contains(e.target)) {
        startMenu.style.display = 'none';
        if (startButton) startButton.classList.remove('active');
    }
    if (desktopContextMenu) desktopContextMenu.style.display = 'none';
    if (fileContextMenu) fileContextMenu.style.display = 'none';
});

document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.window') || e.target.closest('.taskbar') || e.target.closest('.start-menu') || e.target.closest('.welcome-modal')) return;
    e.preventDefault();
    if (desktopContextMenu) {
        desktopContextMenu.style.display = 'block';
        desktopContextMenu.style.left = e.clientX + 'px';
        desktopContextMenu.style.top = e.clientY + 'px';
    }
});

document.getElementById('context-refresh').addEventListener('click', () => location.reload());
document.getElementById('context-settings').addEventListener('click', () => {
    document.getElementById('menu-settings').click();
});
