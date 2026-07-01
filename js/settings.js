import { osState } from "./state.js";
import { osAlert, osConfirm, osPrompt } from "./dialog.js";
import { updateClock } from "./main.js";


/*Settings*/
const timeToggle = document.getElementById('time-format-toggle');
if (timeToggle) {
    timeToggle.checked = osState.use24HourTime;
    timeToggle.addEventListener('change', (e) => {
        osState.use24HourTime = e.target.checked;
        localStorage.setItem('use24HourTime', osState.use24HourTime);
        updateClock();
    });
}

const labelToggle = document.getElementById('icon-label-toggle');
const savedLabels = localStorage.getItem('showIconLabels');
if (savedLabels !== null){
    const showLabels = savedLabels === 'true';
    if (labelToggle) labelToggle.checked = showLabels;
    document.querySelector('.desktop-environment')?.classList.toggle('hide-labels', !showLabels);
}
if (labelToggle) {
    labelToggle.addEventListener('change', (e) => {
        localStorage.setItem('showIconLabels', e.target.checked);
        document.querySelector('.desktop-environment')?.classList.toggle('hide-labels', !e.target.checked);
    });
}

const themeSelect = document.getElementById('theme-select');
if (themeSelect) {
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
}

export function setWallpaper(url) {
    document.body.style.setProperty('background-image', `url('${url}')`, 'important');
    document.body.style.setProperty('background-size', 'cover', 'important');
    document.body.style.setProperty('background-position', 'center', 'important');
    document.body.style.setProperty('background-repeat', 'no-repeat', 'important');
}

const wallpaperSelect = document.getElementById('wallpaper-select');
const customUrlInput = document.getElementById('custom-wallpaper-url');
const nasaError = document.getElementById('nasa-error');

if (wallpaperSelect) {
    wallpaperSelect.addEventListener('change', async (e) => {
        const choice = e.target.value;
        if (customUrlInput) customUrlInput.style.display = choice === 'custom' ? 'block' : 'none';
        if (nasaError) nasaError.style.display = 'none';

        if (choice === 'default') {
            document.body.style.removeProperty('background-image');
            localStorage.setItem('wallp-opt', 'default');
        }
        else if (choice === 'custom' && customUrlInput && customUrlInput.value) {
            setWallpaper(customUrlInput.value);
            localStorage.setItem('wallpaper-url', customUrlInput.value);
            localStorage.setItem('wallp-opt', 'custom');
        }
        else if (choice === 'nasa') {
            if (nasaError) {
                nasaError.style.color = '#e0e0e0';
                nasaError.textContent = 'Connecting to NASA servers...';
                nasaError.style.display = 'block';
            }
            
            try {
                const response = await fetch('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY');
                if (response.status === 429) throw new Error('Rate Limit Exceeded');
                const data = await response.json();
                
                if (data.media_type === 'image') {
                    setWallpaper(data.url);
                    localStorage.setItem('nasa-img', data.url);
                    localStorage.setItem('wallp-opt', 'nasa');
                    if (nasaError) nasaError.style.display = 'none';
                } else throw new Error('Not an image');
            } catch (err) {
                if (nasaError) {
                    nasaError.style.color = '#ff5f56';
                    nasaError.textContent = 'NASA Image blocked (Rate Limit). Try custom URL.';
                }
                document.body.style.removeProperty('background-image');
                localStorage.setItem('wallp-opt', 'default');
            }
        }
    });
}

if (customUrlInput) {
    customUrlInput.addEventListener('input', (e) => {
        if (wallpaperSelect && wallpaperSelect.value === 'custom') setWallpaper(e.target.value);
    });
}


function sanitizeIdentity (input) {
    return input.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 16);
}

document.getElementById('btn-manage-identity')?.addEventListener('click', async () => {
    const currentPass = localStorage.getItem('os-password');
    
    if (currentPass && currentPass.length > 0) {
        let authenticated = false;
        while (!authenticated) {
            const attempt = await osPrompt("Enter current password to continue (or type 'recover'):", "", "Security Check");
            
            if (attempt === null) return; 
            
            if (attempt === currentPass) {
                authenticated = true;
            } else if (attempt.toLowerCase() === 'recover') {
                localStorage.removeItem('os-password'); 
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
    if (idWin) {
        idWin.style.display = 'flex';
        osState.highestZIndex++;
        idWin.style.zIndex = osState.highestZIndex;
    }
});

document.getElementById('id-show-password')?.addEventListener('change', (e) => {
    const passInput = document.getElementById('id-password-input');
    if (passInput) passInput.type = e.target.checked ? 'text' : 'password';
});

document.getElementById('id-close-btn')?.addEventListener('click', () => {
    const idWin = document.getElementById('identity-window');
    if (idWin) idWin.style.display = 'none';
});

document.getElementById('btn-save-new-identity')?.addEventListener('click', async () => {
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
    clearInterval(osState.systemClockInterval);
    document.body.style.pointerEvents = 'none';

    const shutScreen = document.getElementById('shutdown-screen');
    const shutText = document.getElementById('shutdown-text');
    const shutSpinner = document.getElementById('shutdown-spinner');

    if (shutScreen) shutScreen.style.display = 'flex';

    if (action === 'restart'){
        if (shutText) shutText.innerHTML = "Restarting...";
        sessionStorage.setItem('boot_context', 'warm');
    } else {
        if (shutText) shutText.innerHTML = "Shutting down...";
        sessionStorage.removeItem('boot_context');
    }

    requestAnimationFrame(() => {
        if (shutScreen) shutScreen.style.opacity = '1';
    });

    setTimeout(() => {
        if (action === 'restart'){
            location.reload();
        } else {
            if (shutSpinner) shutSpinner.style.display = 'none';
            if (document.body.classList.contains('theme-retro')){
                if (shutText) {
                    shutText.innerHTML = "It is now safe to turn off your browser";
                    shutText.style.color = '#ff8c00';
                }
            } else {
                if (shutText) shutText.innerHTML = "System halted.<br><br>You may now close the browser tab.";
            }
        }
    }, 2500);
}

document.getElementById('btn-shutdown')?.addEventListener('click', () => initiateSystemPower('shutdown'));
document.getElementById('btn-restart')?.addEventListener('click', () => initiateSystemPower('restart'));