import { osState } from "./state.js";
import { osAlert, osConfirm, osPrompt } from "./dialog.js";
import { registerApp } from "./windowManager.js";

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
