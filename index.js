/*Custom Dialog engine*/

const osDialogOverlay = document.getElementById('os-dialog-overlay');
const osDialogTitle = document.getElementById('os-dialog-title');
const osDialogMessage = document.getElementById('os-dialog-message');
const osDialogInput = document.getElementById('os-dialog-input');
const btnOk = document.getElementById('os-dialog-btn-ok');
const btnCancel = document.getElementById('os-dialog-btn-cancel');
const btnClose = document.getElementById('os-dialog-close-btn');

function showOsDialog({type, message, title = "System", defaultValue = ""}){
    return new Promise((resolve) => {
        osDialogTitle.textContent = title;
        osDialogMessage.textContent = message;
        osDialogOverlay.style.display = 'flex';
        osDialogInput.style.display = type == 'prompt' ? 'block' : 'none';
        btnCancel.style.display = (type === 'confirm' || type === 'prompt') ? 'block' : 'none';
        osDialogInput.value = defaultValue;

        if (type === 'prompt') osDialogInput.focus();
        else btnOk.focus();

        const cleanup = (result) => {
            osDialogOverlay.style.display = 'none';
            btnOk.onclick = null;
            btnCancel.onclick = null;
            btnClose.onclick = null;
            osDialogInput.onkeydown = null;
            resolve(result);
        };

        btnOk.onclick = () => cleanup(type === 'prompt' ? osDialogInput.value : true);
        btnCancel.onclick = () => cleanup(type === 'prompt' ? null : false);
        btnClose.onclick = () => cleanup(type === 'prompt' ? null : false);

        osDialogInput.onkeydown = (e) => {
            if (e.key === 'Enter'){
                e.preventDefault();
                cleanup(osDialogInput.value);
            }
            if (e.key === 'Escape') cleanup(null);
        };
    });
}

const osAlert = (message, title) => showOsDialog({type: 'alert', message, title});
const osConfirm = (message, title) => showOsDialog({type: 'confirm', message, title});
const osPrompt = (message, defaultValue, title) => showOsDialog({type: 'prompt', message, title, defaultValue});





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
let systemClockInterval = setInterval(updateClock, 1000);


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
        draggedWindow.style.transition = 'none';

        offsetX = e.clientX - draggedWindow.offsetLeft;
        offsetY = e.clientY - draggedWindow.offsetTop;
    }
    else if (desktopIcon) {
        if (desktopIcon.classList.contains('custom-desktop-icon')) return; 

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
        const snappedX = Math.round(currentX / 100) * 100 + 20;
        const snappedY = Math.round(currentY / 100) * 100 + 20;

        draggedWindow.style.left = snappedX + 'px';
        draggedWindow.style.top = snappedY + 'px';

        localStorage.setItem(draggedWindow.id + '-x', draggedWindow.style.left);
        localStorage.setItem(draggedWindow.id + '-y', draggedWindow.style.top);
    }

    if (draggedWindow && !draggedWindow.classList.contains('desktop-icon')) {
        draggedWindow.style.transition = '';
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



/* Web Browser */

registerApp('browser-window', 'taskbar-browser', 'menu-browser', 'browser-min-btn', 'browser-max-btn', 'browser-close-btn');

const browserTabsContainer = document.getElementById('browser-tabs-container');
const browserIframeContainer = document.getElementById('browser-iframe-container');
const browserUrl = document.getElementById('browser-url');
const browserGoBtn = document.getElementById('browser-go-btn');
const browserBackBtn = document.getElementById('browser-back-btn');
const browserForwardBtn = document.getElementById('browser-forward-btn')
const browserRefreshBtn = document.getElementById('browser-refresh-btn');
const browserHomeBtn = document.getElementById('browser-home-btn');
const browserNewTabBtn = document.getElementById('browser-new-tab-btn');
const browserBookmarkBtn = document.getElementById('browser-bookmark-btn');
const browserBookmarkContainer = document.getElementById('browser-bookmarks-container');
const browserPadlock = document.getElementById('browser-padlock');
const browserLoader = document.getElementById('browser-loader')

let tabs = [];
let activeTabId = null;
let tabCounter = 0;

const isRetro = localStorage.getItem('os-theme') === 'retro';
const warningBanner = isRetro ? `<div class="sys-warning">⚠️ SYSTEM NOTE: The NetPortal network is a modern framework. It has not been optimized for Legacy BIOS (1995) UI rendering. We apologize for the anachronistic interface!</div>` : '';

const homeUrl = "data:text/html;charset=utf-8," + encodeURIComponent(`
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Segoe UI', sans-serif; background: #120e11; color: #e0e0e0; padding: 40px; text-align: center; margin: 0; }
            .sys-warning { background: #ffbd2e; color: #000; padding: 10px; font-size: 13px; font-weight: bold; border-radius: 6px; max-width: 800px; margin: 0 auto 30px auto; text-align: left; }
            .search-box { max-width: 600px; margin: 30px auto; display: flex; gap: 10px; }
            input { flex-grow: 1; padding: 12px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,183,197,0.3); color: #fff; border-radius: 8px; outline: none; font-size: 14px; }
            button { padding: 12px 24px; background: rgba(255,183,197,0.2); border: 1px solid rgba(255,183,197,0.4); color: #ffb7c5; border-radius: 8px; cursor: pointer; font-weight: bold; transition: 0.2s; }
            button:hover { background: rgba(255,183,197,0.3); }
            h1 { color: #ffb7c5; font-size: 36px; letter-spacing: 1px; margin-bottom: 5px; }
            p { color: #aaa; font-size: 15px; margin-bottom: 30px; }
            .category { text-align: left; max-width: 800px; margin: 0 auto 15px auto; padding-bottom: 8px; border-bottom: 1px solid rgba(255,183,197,0.1); color: #ffb7c5; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;}
            .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 15px; max-width: 800px; margin: 0 auto 40px auto; text-align: left; }
            .card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; cursor: pointer; transition: 0.2s; display: flex; flex-direction: column; gap: 6px;}
            .card:hover { background: rgba(255,183,197,0.08); border-color: #ffb7c5; transform: translateY(-3px); box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
            .card h3 { margin: 0; font-size: 16px; color: #fff; }
            .card p { margin: 0; font-size: 12px; color: #888; line-height: 1.4; }
            .dir-btn { margin-top: 10px; padding: 14px 32px; background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.4); color: #8bb4f9; border-radius: 8px; cursor: pointer; font-size: 15px; font-weight: bold; transition: 0.2s; }
            .dir-btn:hover { background: rgba(59,130,246,0.25); transform: translateY(-2px); }
        </style>
    </head>
    <body>
        ${warningBanner}
        <h1>EpochOS NetPortal</h1>
        <p>Your secure gateway to iframe-verified applications.</p>
        <div class="search-box">
            <input type="text" id="s" placeholder="Enter URL (Warning: Modern sites may block embedding)..." onkeydown="if(event.key==='Enter') parent.postMessage({type:'nav', val:this.value}, '*')">
            <button onclick="parent.postMessage({type:'nav', val:document.getElementById('s').value}, '*')">Go</button>
        </div>
        <div class="category">Featured Applications</div>
        <div class="grid">
            <div class="card" onclick="parent.postMessage({type:'nav', val:'https://wikipedia.org'}, '*')">
                <h3>Wikipedia</h3><p>The entire world is at your hands.</p>
            </div>
            <div class="card" onclick="parent.postMessage({type:'nav', val:'https://jspaint.app'}, '*')">
                <h3>🎨 JS Paint</h3><p>A flawless, web-based remake of classic MS Paint.</p>
            </div>
            <div class="card" onclick="parent.postMessage({type:'nav', val:'https://earth.nullschool.net/'}, '*')">
                <h3>🌍 Earth Nullschool</h3><p>A mesmerising visualization of global weather conditions.</p>
            </div>
            <div class="card" onclick="parent.postMessage({type:'nav', val:'https://hackertyper.net'}, '*')">
                <h3>💻 Hacker Typer</h3><p>Mash your keyboard to simulate writing complex code.</p>
            </div>
        </div>
        <button class="dir-btn" onclick="parent.postMessage({type:'nav', val:'webos://directory'}, '*')">Browse Complete Directory ➔</button>
    </body>
    </html>
`);

const directoryUrl = "data:text/html;charset=utf-8," + encodeURIComponent(`
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Segoe UI', sans-serif; background: #120e11; color: #e0e0e0; padding: 40px; margin: 0; }
            .sys-warning { background: #ffbd2e; color: #000; padding: 10px; font-size: 13px; font-weight: bold; border-radius: 6px; margin-bottom: 20px; }
            .header { display: flex; align-items: center; gap: 20px; border-bottom: 1px solid rgba(255,183,197,0.2); padding-bottom: 20px; margin-bottom: 30px; }
            .back-btn { padding: 10px 20px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 8px; cursor: pointer; transition: 0.2s; font-weight: bold; }
            .back-btn:hover { background: rgba(255,255,255,0.1); }
            h1 { color: #ffb7c5; margin: 0; font-size: 28px; }
            .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 15px; }
            .card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 15px; border-radius: 10px; cursor: pointer; transition: 0.2s; }
            .card:hover { background: rgba(255,183,197,0.08); border-color: #ffb7c5; transform: translateY(-2px); box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
            h3 { margin: 0 0 5px 0; font-size: 15px; color: #fff; }
            p { margin: 0; font-size: 12px; color: #888; line-height: 1.4; }
            .category-title { margin-top: 40px; margin-bottom: 15px; color: #ffb7c5; font-size: 18px; border-bottom: 1px dashed rgba(255,183,197,0.2); padding-bottom: 8px; letter-spacing: 1px; text-transform: uppercase; }
        </style>
    </head>
    <body>
        ${warningBanner}
        
        <div class="header">
            <button class="back-btn" onclick="parent.postMessage({type:'nav', val:'home'}, '*')">◀ Return to Portal</button>
            <h1>Application Directory</h1>
        </div>

        <div class="category-title">Games & Entertainment</div>
        <div class="grid">
            <div class="card" onclick="parent.postMessage({type:'nav', val:'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1'}, '*')"><h3>Video Player</h3><p>Test media streaming capabilities</p></div>
            <div class="card" onclick="parent.postMessage({type:'nav', val:'https://sandspiel.club/'}, '*')"><h3>Sandspiel</h3><p>Falling sand physics game</p></div>
            <div class="card" onclick="parent.postMessage({type:'nav', val:'https://bouncingdvdlogo.com/'}, '*')"><h3>DVD Logo</h3><p>Will it hit the corner?</p></div>
            <div class="card" onclick="parent.postMessage({type:'nav', val:'https://windows93.net/'}, '*')"><h3>Windows 93</h3><p>A glitchy, surreal OS parody</p></div>
        </div>

        <div class="category-title">Productivity & Tools</div>
        <div class="grid">
            <div class="card" onclick="parent.postMessage({type:'nav', val:'https://jspaint.app'}, '*')"><h3>JS Paint</h3><p>Pixel-perfect MS Paint remake</p></div>
            <div class="card" onclick="parent.postMessage({type:'nav', val:'https://hackertyper.net'}, '*')"><h3>Hacker Typer</h3><p>Mash keys to look like a coder</p></div>
            <div class="card" onclick="parent.postMessage({type:'nav', val:'https://www.desmos.com/calculator'}, '*')"><h3>Desmos</h3><p>Advanced graphing calculator</p></div>
            <div class="card" onclick="parent.postMessage({type:'nav', val:'webos://pun'}, '*')"><h3>v86 Emulator</h3><p>Run x86 operating systems</p></div>
        </div>

        <div class="category-title">Information & Visualizations</div>
        <div class="grid">
            <div class="card" onclick="parent.postMessage({type:'nav', val:'https://earth.nullschool.net/'}, '*')"><h3>Earth Nullschool</h3><p>Global wind and weather map</p></div>
            <div class="card" onclick="parent.postMessage({type:'nav', val:'https://stellarium-web.org/'}, '*')"><h3>Stellarium</h3><p>Online interactive planetarium</p></div>
            <div class="card" onclick="parent.postMessage({type:'nav', val:'https://threejs.org/examples/'}, '*')"><h3>Three.js</h3><p>Cutting-edge 3D web experiments</p></div>
            <div class="card" onclick="parent.postMessage({type:'nav', val:'https://example.com'}, '*')"><h3>Example.com</h3><p>Standard open testing domain</p></div>
            <div class="card" onclick="parent.postMessage({type:'nav', val:'https://wikipedia.org'}, '*')">
                <h3>Wikipedia</h3><p>The entire world is at your hands.</p>
            </div>
        </div>
    </body>
    </html>
`);

const punUrl = "data:text/html;charset=utf-8," + encodeURIComponent(`
    <body style="font-family:'Segoe UI', sans-serif; background:#120e11; color:#ffb7c5; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; text-align:center; margin:0;">
        <h2>Booting x86 architecture...</h2>
        <p style="color:#aaa; max-width:400px; line-height:1.5;">Wait... you are opening an OS inside an OS inside a web browser that is hosting on an OS?</p>
        <button onclick="parent.postMessage({type:'nav', val:'https://copy.sh/v86/'}, '*')" style="margin-top:30px; padding:12px 24px; background:rgba(255,183,197,0.15); border:1px solid rgba(255,183,197,0.3); color:#ffb7c5; border-radius:8px; cursor:pointer; font-weight:bold; transition:0.2s;">Proceed to Emulator ➔</button>
    </body>
`);


let bookmarks = JSON.parse(localStorage.getItem('os-bookmarks') || '[]');

window.addEventListener('message', (e) => {
    if (e.data && e.type === 'nav' || e.data.type === 'nav'){
        navigateActiveTab(e.data.val);
    }
});

function createTab(url = homeUrl){
    const id = `tab-${tabCounter++}`;
    
    let cleanDisplayUrl = url;
    if (url === homeUrl) cleanDisplayUrl = 'EpochOS NetPortal';
    else if (url === directoryUrl) cleanDisplayUrl = 'App Directory';
    
    const tabObj = {id, history: [url], historyIndex: 0, title: cleanDisplayUrl};
    tabs.push(tabObj);

    const iframe = document.createElement('iframe');
    iframe.id = `iframe-${id}`;
    iframe.src = url;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.background = '#fff';
    iframe.style.display = 'none';

    iframe.onload = () => {
        if (activeTabId === id) browserLoader.style.display = 'none';
        try {
            if (iframe.src.startsWith('data:')) {
                if (iframe.src === homeUrl) updateTabTitle(id, 'EpochOS NetPortal');
                else if (iframe.src === directoryUrl) updateTabTitle(id, 'App Directory');
                else if (iframe.src === punUrl) updateTabTitle(id, 'Incepti-OS');
                else updateTabTitle(id, 'Error');
            } else {
                let domain = new URL(iframe.src).hostname.replace('www.', '');
                updateTabTitle(id, domain);
            }
        } catch (e) {
            updateTabTitle(id, 'Secure Frame');
        }
    };
    
    browserIframeContainer.appendChild(iframe);
    renderTabs();
    switchTab(id);
}

function renderTabs() {
    document.querySelectorAll('.browser-tab').forEach(t => t.remove());

    tabs.forEach(tab => {
        const tabEl = document.createElement('div');
        tabEl.className = `browser-tab ${tab.id === activeTabId ? 'active' : ''}`;
        tabEl.dataset.id = tab.id;

        tabEl.innerHTML = `
            <span class="browser-tab-title">${tab.title}</span>
            <button class="browser-tab-close">x</button>
        `;

        tabEl.addEventListener('click', (e) => {
            if (e.target.classList.contains('browser-tab-close')){
                closeTab(tab.id);
            } else {
                switchTab(tab.id);
            }
        });

        browserTabsContainer.insertBefore(tabEl, browserNewTabBtn);
    });
}

function switchTab(id){
    activeTabId = id;
    const tabObj = tabs.find(t => t.id === id);

    document.querySelectorAll('#browser-iframe-container iframe').forEach(ifr => {
        ifr.style.display = ifr.id === `iframe-${id}` ? 'block' : 'none';
    });

    renderTabs();

    const currentUrl = tabObj.history[tabObj.historyIndex];
    if (currentUrl === homeUrl) browserUrl.value = 'webos://home';
    else if (currentUrl === directoryUrl) browserUrl.value = 'webos://directory';
    else browserUrl.value = currentUrl;
    updateSecurityPadlock(currentUrl);
    updateBookmarkIcon(currentUrl);
}

function closeTab(id){
    const tabIndex = tabs.findIndex(t => t.id === id);
    tabs.splice(tabIndex, 1);
    document.getElementById(`iframe-${id}`).remove();

    if (tabs.length === 0){
        createTab();
    } else if (activeTabId === id){
        const nextTab = tabs[Math.min(tabIndex, tabs.length - 1)];
        switchTab(nextTab.id);
    } else {
        renderTabs();
    }
}

function updateTabTitle(id, title){
    const tab = tabs.find(t => t.id === id);
    if (tab) tab.title = title;
    renderTabs();
}

function navigateActiveTab(url, addToHistory = true) {
    if (!activeTabId) return;
    
    const tab = tabs.find(t => t.id === activeTabId);
    let finalUrl = url.trim();
    
    if (finalUrl.toLowerCase() === 'home' || finalUrl === '' || finalUrl === 'webos://home') {
        finalUrl = homeUrl;
    } else if (finalUrl.toLowerCase() === 'webos://directory') {
        finalUrl = directoryUrl;
    } else if (finalUrl.toLowerCase() === 'webos://pun') {
        finalUrl = punUrl;
    } else if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://') && !finalUrl.startsWith('data:')) {
        if (finalUrl.includes('.') && !finalUrl.includes(' ')) {
            finalUrl = 'https://' + finalUrl;
        } else {
            finalUrl = "data:text/html;charset=utf-8," + encodeURIComponent(`
                <body style="font-family:sans-serif; background:#120e11; color:#fff; padding:30px; text-align:center;">
                    <h2 style="color:#ff5f56">⚠️ External Connection Blocked</h2>
                    <p style="color:#aaa; max-width:500px; margin:0 auto 20px auto; line-height:1.5;">
                        The domain you searched cannot be opened within an iframe browser. Modern web security prevents this for security reasons.\nBut you can enjoy some of the compatible ones in the complete website directory :)
                    </p>
                    <p>Searched Query: <strong style="color:#ffb7c5">${finalUrl}</strong></p>
                    <button onclick="parent.postMessage({type:'nav', val:'home'}, '*')" style="margin-top:20px; padding:10px 20px; background:#ffb7c5; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">Return to Portal</button>
                </body>
            `);
        }
    }

    const iframe = document.getElementById(`iframe-${activeTabId}`);
    browserLoader.style.display = 'block';
    iframe.src = finalUrl;
    
    if (finalUrl === homeUrl) browserUrl.value = 'webos://home';
    else if (finalUrl === directoryUrl) browserUrl.value = 'webos://directory';
    else browserUrl.value = finalUrl;
    
    updateSecurityPadlock(finalUrl);
    updateBookmarkIcon(finalUrl);

    if (addToHistory) {
        tab.history = tab.history.slice(0, tab.historyIndex + 1);
        tab.history.push(finalUrl);
        tab.historyIndex++;
    }
    
    let displayTitle = 'Secure Frame';
    if (finalUrl.startsWith('data:')) {
        if (finalUrl === homeUrl) displayTitle = 'EpochOS NetPortal';
        else if (finalUrl === directoryUrl) displayTitle = 'App Directory';
        else if (finalUrl === punUrl) displayTitle = 'Incepti-OS';
        else displayTitle = 'Error';
    } else {
        try { displayTitle = new URL(finalUrl).hostname.replace('www.', ''); } catch(e){}
    }
    updateTabTitle(activeTabId, displayTitle);
}

function updateSecurityPadlock(url) {
    browserPadlock.textContent = url.startsWith('https') ? '🔒' : '🔓';
    browserPadlock.style.color = url.startsWith('https') ? '#27c93f' : '#ffbd2e';
}

function renderBookmarks() {
    browserBookmarkContainer.innerHTML = '';
    bookmarks.forEach((bm, index) => {
        const el = document.createElement('div');
        el.className = 'bookmark-item';
        el.innerHTML = `${bm.name}`;
        el.addEventListener('click', () => navigateActiveTab(bm.url));
        el.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            bookmarks.splice(index, 1);
            localStorage.setItem('os-bookmarks', JSON.stringify(bookmarks));
            renderBookmarks();
            updateBookmarkIcon(browserUrl.value);
        });
        browserBookmarkContainer.appendChild(el);
    });
}

function updateBookmarkIcon(url) {
    const isBookmarked = bookmarks.some(b => b.url === url);
    browserBookmarkBtn.style.color = isBookmarked ? '#ffbd2e' : '';
}

browserNewTabBtn.addEventListener('click', () => createTab());
browserGoBtn.addEventListener('click', () => navigateActiveTab(browserUrl.value));
browserUrl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') navigateActiveTab(browserUrl.value);
});
browserRefreshBtn.addEventListener('click', () => {
    const iframe = document.getElementById(`iframe-${activeTabId}`);
    browserLoader.style.display = 'block';
    iframe.src = iframe.src;
});
browserHomeBtn.addEventListener('click', () => navigateActiveTab(homeUrl));
browserBackBtn.addEventListener('click', () => {
    const tab = tabs.find(t => t.id === activeTabId);
    if (tab.historyIndex > 0){
        tab.historyIndex--;
        navigateActiveTab(tab.history[tab.historyIndex], false);
    }
});
browserForwardBtn.addEventListener('click', () => {
    const tab = tabs.find(t => t.id === activeTabId);
    if (tab.historyIndex < tab.history.length - 1){
        tab.historyIndex++;
        navigateActiveTab(tab.history[tab.historyIndex], false);
    }
});

browserBookmarkBtn.addEventListener('click', () => {
    const currentUrl = browserUrl.value;
    const existingIndex =bookmarks.findIndex(b => b.url === currentUrl);

    if (existingIndex !== -1){
        bookmarks.splice(existingIndex, 1);
    } else {
        let domain = 'Web Page';
        try {
            domain = new URL(currentUrl).hostname.replace('www.', '');
        } catch (e) {}
        bookmarks.push({ name: domain, url: currentUrl});
    }

    localStorage.setItem('os-bookmarks', JSON.stringify(bookmarks));
    renderBookmarks();
    updateBookmarkIcon(currentUrl);
});

createTab();
renderBookmarks();


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

themeSelect.addEventListener('change', async (e) => {
    if (await osConfirm("Changing the System Era requires a full system reboot. Restart the system now?", "System Settings")){
        localStorage.setItem('os-theme', e.target.value);
        document.body.style.display = 'none';
        setTimeout(() => location.reload(), 200);
    } else {
        e.target.value = localStorage.getItem('os-theme') || 'modern';
    }
});


const setUsername = document.getElementById('set-username-input');
const setHostname = document.getElementById('set-hostname-input');
const setPassword = document.getElementById('set-password-input');


document.getElementById('btn-manage-identity').addEventListener('click', async () => {
    const currentPass = localStorage.getItem('os-password');
    
    if (currentPass && currentPass.length > 0) {
        let authenticated = false;
        while (!authenticated) {
            const attempt = await osPrompt("Enter current password to continue (or type 'recover'):", "", "Security Check");
            
            if (attempt === null) return; 
            
            if (attempt === currentPass) {
                authenticated = true;
            } else if (attempt.toLowerCase() === 'recover') {
                localStorage.removeItem('os-password'); // Actually clear it!
                await osAlert("Security Override. Password has been removed.", "System Security");
                authenticated = true;
            } else {
                await osAlert("Incorrect password. Please try again.", "Authentication Failed");
            }
        }
    }

    document.getElementById('id-username-input').value = localStorage.getItem('os-username') || '';
    document.getElementById('id-hostname-input').value = localStorage.getItem('os-hostname') || '';
    document.getElementById('id-password-input').value = '';
    document.getElementById('id-show-password').checked = false;
    document.getElementById('id-password-input').type = 'password'; 
    
    const idWin = document.getElementById('identity-window');
    idWin.style.display = 'flex';
    highestZIndex++;
    idWin.style.zIndex = highestZIndex;
});

document.getElementById('id-show-password').addEventListener('change', (e) => {
    const passInput = document.getElementById('id-password-input');
    passInput.type = e.target.checked ? 'text' : 'password';
});

document.getElementById('id-close-btn').addEventListener('click', () => {
    document.getElementById('identity-window').style.display = 'none';
});

document.getElementById('btn-save-new-identity').addEventListener('click', async () => {
    if (await osConfirm("Applying new system identity requires a reboot. Proceed?", 'System Settings')){
        const uName = document.getElementById('id-username-input').value.trim();
        const hName = document.getElementById('id-hostname-input').value.trim();
        const pass = document.getElementById('id-password-input').value;

        if (uName) localStorage.setItem('os-username', sanitizeIdentity(uName.toLowerCase()));
        if (hName) localStorage.setItem('os-hostname', sanitizeIdentity(hName.toLowerCase()));
        if (pass !== '') localStorage.setItem('os-password', pass);

        document.body.style.display = 'none';
        setTimeout(() => location.reload(), 200);
    }
});


function initiateSystemPower(action) {
    clearInterval(systemClockInterval);
    document.body.style.pointerEvents = 'none';

    const shutScreen = document.getElementById('shutdown-screen');
    const shutText = document.getElementById('shutdown-text');
    const shutSpinner = document.getElementById('shutdown-spinner');

    shutScreen.style.display = 'flex';

    if (action === 'restart'){
        shutText.innerHTML = "Restarting...";
        sessionStorage.setItem('boot_context', 'warm');
    } else {
        shutText.innerHTML = "Shutting down...";
        sessionStorage.removeItem('boot_context');
    }

    requestAnimationFrame(() => {
        shutScreen.style.opacity = '1';
    });

    setTimeout(() => {
        if (action === 'restart'){
            location.reload();
        } else {
            shutSpinner.style.display = 'none';
            if (document.body.classList.contains('theme-retro')){
                shutText.innerHTML = "It is now safe to turn off your browser";
                shutText.style.color = '#ff8c00';
            } else {
                shutText.innerHTML = "System halted.<br><br>You may now close the browser tab."
            }
        }
    }, 2500)
}

document.getElementById('btn-shutdown').addEventListener('click', () => {
    initiateSystemPower('shutdown');
})

document.getElementById('btn-restart').addEventListener('click', () => {
    initiateSystemPower('restart');
})





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


/* Boot Sequence */

const bootScreen = document.getElementById('boot-screen');
const bootText = document.getElementById('boot-text');
let enterSetupFlag = false;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function getUserHardwareData() {
    let gpu = "Standard VGA Graphics Adapter";
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    } catch(e) {}

    return {
        cores: navigator.hardwareConcurrency || 4,
        ramMB: (navigator.deviceMemory || 8) * 1024,
        gpuName: gpu.replace(/ANGLE \(|\)/g, '').split(',')[1]?.trim() || gpu,
        resolution: `${window.screen.width}x${window.screen.height}`,
        isMac: navigator.userAgent.includes('Mac'),
        isWin: navigator.userAgent.includes('Win')
    };
}

async function runBootSequence() {

    const bootContext = sessionStorage.getItem('boot_context') || 'cold';
    sessionStorage.removeItem('boot_context');
    let outputHTML = "";
    
    const updateScreen = (text) => {
        if (enterSetupFlag) return;
        outputHTML += text;
        bootText.innerHTML = outputHTML + '<span class="boot-cursor"></span>';
    };
    
    const replaceLastLine = (text) => {
        if (enterSetupFlag) return;
        const lastNewline = outputHTML.lastIndexOf('\n');
        if (lastNewline !== -1) outputHTML = outputHTML.substring(0, lastNewline + 1);
        else outputHTML = "";
        outputHTML += text;
        bootText.innerHTML = outputHTML + '<span class="boot-cursor"></span>';
    };

    const drawProgressBar = async (label, width, speed) => {
        updateScreen(`${label} [`);
        for (let i = 0; i < width; i++){
            await sleep(speed + (Math.random() * speed));
            replaceLastLine(`${label} [${'='.repeat(i + 1)}${' '.repeat(width - i -1)}]`);
        }
        updateScreen("] 100%\n");
    };

    const readLine = (promptText, isPassword = false) => {
        let inputStr = "";
        return new Promise(resolve => {
            const handler = (e) => {
                if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) return;

                if (e.key === 'Enter'){
                    e.preventDefault();
                    document.removeEventListener('keydown', handler);
                    updateScreen('\n');
                    resolve(inputStr.trim());
                } else if (e.key === 'Backspace') {
                    e.preventDefault();
                    if (inputStr.length > 0){
                        inputStr = inputStr.slice(0, -1);
                        const displayStr = isPassword ? '*'.repeat(inputStr.length) : inputStr;
                        replaceLastLine(promptText + displayStr);
                    }
                } else if (e.key.length === 1){
                    e.preventDefault();
                    if (inputStr.length < 24) { 
                        inputStr += e.key;
                        const displayStr = isPassword ? '*'.repeat(inputStr.length) : inputStr;
                        replaceLastLine(promptText + displayStr);
                    }
                }
            };
            document.addEventListener('keydown', handler);
        });
    };

    let theme = localStorage.getItem('os-theme')
    let username = localStorage.getItem('os-username');
    let hostname = localStorage.getItem('os-hostname');

    if (!theme || !username || !hostname) {
        bootText.innerHTML = '<span class="boot-cursor"></span>';
        await sleep(500);
        updateScreen("EpochOS Initial Setup Utility v2.0\n");
        updateScreen("==================================\n\n");
        await sleep(600);

        updateScreen("Verifying Hardware compatibility... ");
        await sleep(1000);
        updateScreen("OK\n");
        updateScreen("Mounting installation media... ");
        await sleep(800);
        updateScreen("OK\n\n");
        await sleep(500);

        updateScreen("STEP 1: System Architecture\n");
        updateScreen("------------------------------------------\n")
        updateScreen("  [1] Legacy BIOS (1995 Era)\n");
        updateScreen("  [2] Modern UEFI (Modern Era)\n\n");
        updateScreen("Selection (1/2): ");

        let arch = await new Promise(resolve => {
            const h = e => {
                if (e.key === '1'){ document.removeEventListener('keydown', h); resolve('retro'); }
                if (e.key === '2'){ document.removeEventListener('keydown', h); resolve('modern'); }
            }
            document.addEventListener('keydown', h);
        });

        replaceLastLine(`Selection (1/2): ${arch === 'retro' ? '1' : '2'}\n\n`);
        localStorage.setItem('os-theme', arch);
        document.body.classList.toggle('theme-retro', arch === 'retro');
        await sleep(600);
        updateScreen(`[ OK ] Architecture set to ${arch === 'retro' ? 'Legacy BIOS' : 'Modern UEFI'}\n\n`);
        await sleep(800)

        updateScreen("STEP 2: System Identification\n");
        updateScreen("------------------------------------------\n");
        const hostPrompt = "Enter network hostname (e.g. epochos-pc): ";
        updateScreen(hostPrompt);
        let hostInput = await readLine(hostPrompt);
        hostInput = hostInput || 'epochos';
        localStorage.setItem('os-hostname', sanitizeIdentity(hostInput.toLowerCase()));

        await sleep(300);
        const userPrompt = "Enter primary username: ";
        updateScreen(userPrompt);
        let userInput = await readLine(userPrompt);
        userInput = userInput || 'guest';
        localStorage.setItem('os-username', sanitizeIdentity(userInput.toLowerCase()));
        
        await sleep(300);
        const passPrompt = "Enter administrator password (leave blank for none): ";
        updateScreen(passPrompt);
        let passInput = await readLine(passPrompt, true);
        localStorage.setItem('os-password', passInput);

        await sleep(600);
        updateScreen(`[ OK ] User profile '${userInput.toLowerCase()}' created on '${hostInput.toLowerCase()}'.\n\n`);
        await sleep(800);

        updateScreen("STEP 3: File System Initialization\n");
        updateScreen("------------------------------------------\n")
        updateScreen("Format Virtual Hard Drive? All saved files will be lost. [y/n]: ");

        let format = await new Promise(resolve => {
            const h = e => {
                if(e.key.toLowerCase() === 'y'){ document.removeEventListener('keydown', h); resolve('y'); }
                if(e.key.toLowerCase() === 'n'){ document.removeEventListener('keydown', h); resolve('n'); }
            };
            document.addEventListener('keydown', h);
        });

        replaceLastLine(`Format Virtual Hard Drive? All saved files will be lost. [y/n]: ${format}\n\n`);
        await sleep(400);
        
        if (format === 'y'){
            const keysToDelete = [];
            for (let i = 0; i < localStorage.length; i++){
                if (localStorage.key(i).startsWith('webos-file-')) keysToDelete.push(localStorage.key(i));
            }
            keysToDelete.forEach(k => localStorage.removeItem(k));
            await drawProgressBar("Formatting /Root", 20, 100);
            await sleep(300);
        } else {
            updateScreen("[ OK ] Keeping existing file system intact.\n");
            await sleep(500);
        }

        updateScreen("\nSetup Complete. Generating system profiles...\n");
        await sleep(1500);
        await drawProgressBar("Writing NVRAM configuration", 15, 60);
        await sleep(1000);
        updateScreen("\nSystem will now reboot. Please stand by...\n");
        await sleep (1500);

        location.reload();
        return;
    }

    const hw = getUserHardwareData();
    const hostOS = hw.isMac ? "Darwin/macOS" : hw.isWin ? "Windows NT" : "Unix/Linux";

    if (theme === 'retro') {
        const logo = `
__      __   _    ___  ___ 
\\ \\    / /__| |__/ _ \\/ __|
 \\ \\/\\/ / -_) '_ \\(_) \\__ \\
  \\_/\\_/\\___|_.__/\\___/___/
  
EpochOS BIOS (C) 1995
=========================================
\n`;

        bootText.innerHTML = '<span class="boot-cursor"></span>';
        await sleep(800);
        updateScreen(logo);
        await sleep(300);

        if (bootContext === 'warm'){
            updateScreen("Warm Reset Detected. \n");
            await sleep(500);
            updateScreen("Bypassing POST Memory Test...\n");
            await sleep(1000);
            updateScreen("Initializing CMOS RAM... OK\n");
            await sleep(700);
            updateScreen("\nLoading Kernel Modules (Fast Mode):\n");
            
            const fastModules = ["VFS Bridge", "Network Sync", "GUI Compositor"];
            for (let mod of fastModules) {
                updateScreen(`  [ OK ] ${mod}\n`);
                await sleep(500 + Math.random() * 80);
            }
            await sleep(600);
        } else {
            updateScreen(`CPU: WebOS Virtual Processor (${hw.cores} Cores Detected)\n`);
            await sleep(150);
            updateScreen(`Video: ${hw.gpuName.substring(0, 45)}\n`); 
            await sleep(150);
            updateScreen(`Display: ${hw.resolution} Color Mode\n\n`);
            await sleep(500);
            
            updateScreen("Memory Test: 0KB");
            const totalKB = hw.ramMB * 1024;
            const chunk = Math.floor(totalKB / 22); 
            for (let i = 1024; i <= totalKB; i += chunk) {
                replaceLastLine(`Memory Test: ${i}KB`);
                await sleep(25 + Math.random() * 30); 
            }
            replaceLastLine(`Memory Test: ${totalKB}KB OK\n`);
            
            await sleep(300);
            updateScreen("\nCMOS Checksum... OK\n\n");
            await sleep(250);
            
            updateScreen("Detecting Primary Master   ... ");
            await sleep(100 + Math.random() * 600);
            updateScreen(`HOST DRIVE (${hostOS})\n`);
            
            updateScreen("Detecting Primary Slave    ... ");
            await sleep(400);
            updateScreen("None\n\n");
            
            updateScreen("Press ESC to change System Architecture\n\n");
            await sleep(500);

            updateScreen("PCI Device Listing...\n");
            await sleep(100);
            updateScreen("Bus Dev Fun Vendor Device  SVID  SDEV  Class\n");
            updateScreen("--------------------------------------------\n");
            await sleep(100);
            updateScreen("  0   0   0  8086   7190   0000  0000  Host Bridge\n");
            await sleep(50);
            updateScreen("  0  12   0  10EC   8139   0000  0000  Ethernet\n");
            await sleep(50);
            updateScreen("  1   0   0  10DE   0020   0000  0000  VGA Display\n\n");
            await sleep(700);

            updateScreen("Loading Kernel Modules:\n");
            const modules = ["Network Interface", "Graphical Window Manager", "Terminal AST Engine"];
            for (let mod of modules) {
                updateScreen(`  [ OK ] ${mod}\n`);
                await sleep(80 + Math.random() * 150);
            }
            
            await sleep(400);
        }

    } else {
        bootText.innerHTML = '<span class="boot-cursor"></span>';
        await sleep(250);

        if (bootContext === 'warm') {
            updateScreen("WebOS UEFI FastBoot v3.1.4\n");
            await sleep(150);
            updateScreen("Warm reset detected. Flushing ACPI tables... OK\n");
            await sleep(1000);
            updateScreen("Reloading microcode... OK\n");
            updateScreen("Bypassing full memory POST.\n\n");
            await sleep(800);

            const fastServices = [
                "Mounting Virtual File System (Fast Mode)",
                "Restoring NVRAM context",
                "Initializing Window Manager",
                "Loading Desktop Environment"
            ];
            
            for (let srv of fastServices) {
                updateScreen(`[  OK  ] ${srv}\n`);
                await sleep(400 + Math.random() * 50); // Scrolls quickly but visibly
            }
            await sleep(200);
        } else {
            updateScreen("EpochOS UEFI Firmware v3.1.4\n");
            await sleep(50);
            updateScreen("Initializing ACPI tables... OK\n\n");
            await sleep(100);
            
            updateScreen(`CPU: Local Host Processor (${hw.cores} Logical Cores)\n`);
            updateScreen(`RAM: ${hw.ramMB} MB DDR5-6400 MT/s\n`);
            updateScreen(`GPU: ${hw.gpuName}\n`);
            updateScreen(`DSP: ${hw.resolution} @ 60Hz\n`);
            updateScreen(`HST: ${hostOS} Bridge Established\n\n`);
            await sleep(300);

            updateScreen("Press ESC to change System Architecture...\n\n");
            await sleep(800);

            updateScreen("Scanning NVMe devices... ");
            await sleep(150);
            updateScreen("OK\n");
            updateScreen("nvme0n1: WEBOS-VFS-LOCAL (PCIe Gen5 x4) [ OK ]\n\n");
            await sleep(150);
            
            const services = [
                "Mounted /Root (ext4)",
                "Mounted /Trash",
                "Started Virtual File System",
                "Started Network Interface Manager",
                "Started Terminal AST Subsystem"
            ];

            for (let srv of services) {
                updateScreen(`[  OK  ] ${srv}\n`);
                await sleep(10 + Math.random() * 30);
            }
            
            await sleep(150);
            updateScreen("[  OK  ] Reached target GUI.\n");
            await sleep(400); 
        }
    }

    const savedPassword = localStorage.getItem('os-password');
    
    if (savedPassword && savedPassword.length > 0) {
        let authenticated = false;
        updateScreen(`\nSystem Locked. Authenticating User: ${username.toUpperCase()}\n`);
        
        while (!authenticated) {
            const passPrompt = "Enter Password (type 'recover' to bypass): ";
            updateScreen(passPrompt);
            const attempt = await readLine(passPrompt, true);
            
            if (attempt === savedPassword) {
                updateScreen("[ OK ] Access Granted.\n");
                authenticated = true;
            } else if (attempt.toLowerCase() === 'recover') {
                updateScreen("[ !! ] Security Override. Password Removed.\n");
                localStorage.removeItem('os-password');
                authenticated = true;
            } else {
                updateScreen("[ FAIL ] Incorrect Password. Try again.\n\n");
            }
        }
    } else {
        updateScreen(`\nAuthenticating user '${username}'... [ OK ]\n`);
    }

    updateScreen("\nStarting Desktop Environment...");
    await sleep(800);
    finishBoot();
}

function finishBoot() {
    bootScreen.style.opacity = '0';
    
    setTimeout(() => {
        bootScreen.style.display = 'none';
        
        const epa = document.getElementById('epa-logo');
        if (epa) epa.remove();
        
        if (enterSetupFlag) {
            document.getElementById('menu-settings').click();
        } else if (shouldShowWelcome) {
            welcomeOverlay.style.display = 'block';
            welcomeWindow.style.display = 'flex';
        }
    }, 500);
}

document.addEventListener('keydown', (e) => {
    if (bootScreen.style.display !== 'none' && e.key === 'Escape') {
        if (enterSetupFlag) return;
        enterSetupFlag = true;
        bootText.innerHTML += "\n\n<span style='color: #ff5f56; font-weight: bold;'>>> HARDWARE INTERRUPT: Rebooting to Architecture Setup... <<</span>"
        localStorage.removeItem('os-theme');
        setTimeout(() => location.reload(), 2000);
    }
});

window.addEventListener('load', runBootSequence);

function closeWelcomeScreen() {
    if(welcomeDontShow.checked) {
        localStorage.setItem('showWelcomeScreen', 'false');
        welcomeToggleSwitch.checked = false;
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

function sanitizeIdentity (input) {
    return input.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 16);
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

document.getElementById('np-clear-btn').addEventListener('click', async () => {
    const fileName = npFileName.value.trim() || 'Untitled.txt';
    const currentKey = 'webos-file-' + (openedNotepadFilePath || defaultSaveFolder + '/' + fileName);
    
    if (localStorage.getItem(currentKey)) {
        if (await osConfirm(`Move "${fileName}" to Recycle Bin?`, "Notepad")) {
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
let clipboard = { action: '', paths: [] };
const breadcrumbs = document.getElementById('exp-breadcrumbs');
const fileListContainer = document.getElementById('file-list-container');
const sidebarItems = document.querySelectorAll('.sidebar-item');
const folderContextMenu = document.getElementById('folder-context-menu');
const expContent = document.querySelector('#explorer-window .window-content');

function initFileSystem() {
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
        currentDirectory = item.getAttribute('data-path');
        breadcrumbs.textContent = currentDirectory;
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
    if (currentDirectory === 'Root' || currentDirectory === 'Trash') return;
    currentDirectory = currentDirectory.substring(0, currentDirectory.lastIndexOf('/')) || 'Root';
    sidebarItems.forEach(i => i.classList.toggle('active', i.getAttribute('data-path') === currentDirectory));
    breadcrumbs.textContent = currentDirectory;
    document.querySelector('.explorer-search').value = '';
    refreshFileExplorer();
});

function refreshDesktopIcons() {
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
                currentDirectory = path;
                document.getElementById('exp-breadcrumbs').textContent = currentDirectory;
                refreshFileExplorer();
            } else {
                document.getElementById('menu-notepad').click();
                document.getElementById('np-file-name').value = name;
                document.getElementById('notepad-textarea').value = localStorage.getItem(`webos-file-${path}`);
                openedNotepadFilePath = path;
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

function refreshFileExplorer() {
    fileListContainer.innerHTML = '';
    let hasContent = false;
    const folders = new Set(), files = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(`webos-file-${currentDirectory}/`)) {
            const relativePath = key.replace(`webos-file-${currentDirectory}/`, '');
            const nextSlash = relativePath.indexOf('/');
            if (nextSlash === -1) {
                if (relativePath !== '.keep') files.push({fullPath: `${currentDirectory}/${relativePath}`, fileName: relativePath, key});
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
        const meta = getMeta(`webos-folder-${currentDirectory}/${f}`);
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
        div.dataset.path = currentDirectory + '/' + folder.name;
        div.dataset.type = 'folder';
        div.draggable = true;
        div.innerHTML = `
            <div class='icon-emoji'>📁</div>
            <div class='icon-label'>${folder.name}</div>
            <div class='list-col'>${folder.dateStr}</div>
            <div class='list-col'>File Folder</div>
        `;
        
        div.addEventListener('dblclick', () => {
            currentDirectory += '/' + folder.name;
            breadcrumbs.textContent = currentDirectory;
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
            openedNotepadFilePath = file.fullPath;
        });

        div.addEventListener('dragstart', handleNativeDragStart);
        div.addEventListener('contextmenu', handleFileContext);
        div.addEventListener('click', handleFileSelect);
        fileListContainer.appendChild(div);
    });

    if (currentDirectory === 'Root/Desktop' && !searchQuery){
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
    if (emptyBinBtn) emptyBinBtn.style.display = currentDirectory === 'Trash' ? 'block' : 'none';
    if (upBtn) upBtn.style.display = (currentDirectory === 'Root' || currentDirectory === 'Trash') ? 'none' : 'block';
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

    targetFileForMenu = this.dataset.path;
    fileContextMenu.style.display = 'block';
    folderContextMenu.style.display = 'none';
    fileContextMenu.style.left = e.clientX + 'px';
    fileContextMenu.style.top = e.clientY + 'px';
    
    document.getElementById('file-context-restore').style.display = currentDirectory === 'Trash' ? 'block' : 'none';
    const selectedCount = document.querySelectorAll('.file-item.selected').length;
    document.getElementById('file-context-rename').style.display = (currentDirectory === 'Trash' || selectedCount > 1) ? 'none' : 'block';
}

expContent.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.file-item') || currentDirectory === 'Trash') return; 
    e.preventDefault();
    fileContextMenu.style.display = 'none';
    folderContextMenu.style.display = 'block';
    folderContextMenu.style.left = e.clientX + 'px';
    folderContextMenu.style.top = e.clientY + 'px';
    
    document.getElementById('folder-context-paste').style.opacity = clipboard.paths.length ? '1' : '0.5';
    document.getElementById('folder-context-paste').style.pointerEvents = clipboard.paths.length ? 'auto' : 'none';
});

document.addEventListener('click', () => { folderContextMenu.style.display = 'none'; fileContextMenu.style.display = 'none'; });

let nativeDragPaths = [];

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
    await handleNativeDrop(currentDirectory);
});

document.getElementById('folder-context-new').addEventListener('click', async () => {
    let folderName = await osPrompt("Enter folder name:", "New Folder", "Create Directory");
    if (folderName) folderName = sanitizeFileName(folderName)
    if (!folderName) return;
    
    folderName = getUniqueName(currentDirectory, folderName);
    localStorage.setItem(`webos-file-${currentDirectory}/${folderName}/.keep`, 'DIR');
    refreshFileExplorer();
});

document.getElementById('file-context-copy').addEventListener('click', async () => {
    clipboard.action = 'copy';
    
    const selected = Array.from(document.querySelectorAll('.file-item.selected')).map(el => el.dataset.path);
    const protectedPaths = ['Root/Documents', 'Root/Desktop'];
    let hasProtected = false;
    
    clipboard.paths = selected.filter(path => {
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
    if (!clipboard.paths || !clipboard.paths.length || clipboard.action !== 'copy') return;
    
    for (let sourcePath of clipboard.paths) {
        if (!sourcePath) continue;
        const originalName = sourcePath.substring(sourcePath.lastIndexOf('/') + 1);
        
        if (currentDirectory.startsWith(sourcePath)) {
            await osAlert("Cannot paste a folder into itself.", "System Error");
            continue;
        }

        const safeName = getUniqueName(currentDirectory, originalName);
        const targetPathBase = `${currentDirectory}/${safeName}`;

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
    if (!targetFileForMenu) return;
    const protectedPaths = ['Root/Documents', 'Root/Desktop'];
    if (protectedPaths.includes(targetFileForMenu) || targetFileForMenu.endsWith('.app')){
        await osAlert("Not Allowed: Core folders and applications cannot be renamed.", "System Security");
        return;
    }

    const lastSlash = targetFileForMenu.lastIndexOf('/');
    const path = lastSlash !== -1 ? targetFileForMenu.substring(0, lastSlash) : 'Root';
    const oldName = targetFileForMenu.substring(lastSlash + 1);
    
    const baseNewName = sanitizeFileName(await osPrompt(`Rename "${oldName}":`, oldName, "Rename File"));
    if (baseNewName && baseNewName !== oldName) {
        const safeNewName = getUniqueName(path, baseNewName);
        const keysToRename = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key === `webos-file-${targetFileForMenu}` || key.startsWith(`webos-file-${targetFileForMenu}/`)) keysToRename.push(key);
        }
        keysToRename.forEach(key => {
            const relativeSuffix = key.replace(`webos-file-${targetFileForMenu}`, '');
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
    
    const isTrash = currentDirectory === 'Trash';
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
    if (selectedItems.length > 0 && currentDirectory === 'Trash'){
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

let isListView = false;
let currentSort = { column: 'name', direction: 1 };

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
    highestZIndex++;
    propWindow.style.zIndex = highestZIndex;
}

document.getElementById('file-context-properties').addEventListener('click', () => {
    const item = document.querySelector(`.file-item[data-path="${targetFileForMenu}"]`);
    if (item) showProperties(targetFileForMenu, item.dataset.type);
});

document.getElementById('folder-context-properties').addEventListener('click', () => {
    showProperties(currentDirectory, 'folder');
});

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
    const user = localStorage.getItem('os-username') || 'guest';
    const host = localStorage.getItem('os-hostname') || 'webos';
    termPrompt.textContent = `${user}@${host}:~/${termCurrentDir}$`;
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
        line.style.display = 'flex';
        line.style.alignItems = 'flex-start';
        line.style.marginTop = '4px';
        const promptSpan = document.createElement('span');
        promptSpan.className = 'term-prompt';
        promptSpan.textContent = termPrompt.textContent;
        const contentSpan = document.createElement('span');
        contentSpan.textContent = inputStr;
        contentSpan.style.flexGrow = '1';
        contentSpan.style.whiteSpace = 'pre-wrap';

        line.appendChild(promptSpan);
        line.appendChild(contentSpan);
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
                contents.add('Desktop');
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
                isDir = (match === 'Documents' || match === 'Desktop');
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
                
                let isDir = (m === 'Documents' || m === 'Desktop');
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
            out("EpochOS Bash V2.0");
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
            out(localStorage.getItem('os-username') || 'guest');
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
                contents.add('<span style="color: #3b82f6; font-weight: bold;">Desktop/</span>');
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
                else if (dirLower === 'root/desktop') termCurrentDir = 'Root/Desktop';
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
            if (args.length > 2) { printLine("touch: multiple files not supported in EpochOS v1"); return false; }
            
            const touchPath = resolvePath(args[1]);
            if (!localStorage.getItem(`webos-file-${touchPath}`)) {
                localStorage.setItem(`webos-file-${touchPath}`, '');
                refreshFileExplorer(); 
            }
            break;

        case 'mkdir':
            if (!args[1]) { printLine("mkdir: missing operand"); return false; }
            if (args[1].startsWith('-')) { printLine(`mkdir: invalid option -- '${args[1].replace(/^-+/, '')}'`); return false; }
            if (args.length > 2) { printLine("mkdir: multiple directories not supported in EpochOS v1"); return false; }
            
            const dirPath = resolvePath(args[1]);
            localStorage.setItem(`webos-file-${dirPath}/.keep`, 'Directory placeholder');
            refreshFileExplorer();
            break;

        case 'rm':
            if (!args[1]) { printLine("rm: missing operand"); return false; }
            if (args[1].startsWith('-')) { printLine(`rm: invalid option -- '${args[1].replace(/^-+/, '')}'`); return false; }
            if (args.length > 2) { printLine("rm: multiple files not supported in EpochOS v1"); return false; }
            
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
            if (args.length > 2) { printLine("cat: multiple files not supported in EpochOS v1"); return false; }
            
            const catPath = resolvePath(args[1]);
            const fileData = localStorage.getItem(`webos-file-${catPath}`);
            if (fileData !== null) out(fileData);
            else { printLine(`cat: ${args[1]}: No such file or directory`); return false; }
            break;

        case 'nano':
            if (!args[1]) { printLine("nano: missing filename"); return false; }
            if (args[1].startsWith('-')) { printLine(`nano: invalid option -- '${args[1].replace(/^-+/, '')}'`); return false; }
            if (args.length > 2) { printLine("nano: multiple files not supported in EpochOS v1"); return false; }
            
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


/*System init*/

document.addEventListener('DOMContentLoaded', () => {
    initFileSystem(); 
    updateClock();
    if (typeof updatePrompt === 'function') updatePrompt();
    
    const wallpOpt = localStorage.getItem('wallp-opt');
    if (wallpOpt === 'custom' && typeof setWallpaper === 'function') {
        setWallpaper(localStorage.getItem('wallpaper-url'));
    } else if (wallpOpt === 'nasa' && typeof setWallpaper === 'function') {
        setWallpaper(localStorage.getItem('nasa-img'));
    }
    const wSelect = document.getElementById('wallpaper-select');
    if (wSelect) wSelect.value = wallpOpt || 'default';

    document.querySelectorAll('.desktop-icon').forEach(icon => {
        const savedX = localStorage.getItem(icon.id + '-x');
        const savedY = localStorage.getItem(icon.id + '-y');
        if (savedX) icon.style.left = savedX;
        if (savedY) icon.style.top = savedY;
    });

    refreshFileExplorer();
});
