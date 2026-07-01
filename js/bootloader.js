import { osState } from './state.js';
import { osAlert, osConfirm, osPrompt } from './dialog.js';



/*Welcome Screen */

const welcomeOverlay = document.getElementById('welcome-overlay');
const welcomeWindow = document.getElementById('welcome-window');
const welcomeDontShow = document.getElementById('welcome-dont-show');
const welcomeToggleSwitch = document.getElementById('welcome-toggle-switch');

const shouldShowWelcome = localStorage.getItem('showWelcomeScreen') !== 'false';

if (welcomeToggleSwitch) welcomeToggleSwitch.checked = shouldShowWelcome;
if (welcomeDontShow) welcomeDontShow.checked = !shouldShowWelcome;

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