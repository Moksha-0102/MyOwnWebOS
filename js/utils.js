import { osState } from "./state.js";
import { osAlert, osConfirm, osPrompt } from "./dialog.js";
import { refreshFileExplorer } from "./fileSystem.js";

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
    
    if (osState.openedNotepadFilePath) {
        const lastSlash = osState.openedNotepadFilePath.lastIndexOf('/');
        const folderPath = lastSlash !== -1 ? osState.openedNotepadFilePath.substring(0, lastSlash) : 'Root';
        newKey = 'webos-file-' + folderPath + '/' + fileName;
        if (fileName !== osState.openedNotepadFilePath.substring(lastSlash + 1)) {
            localStorage.removeItem('webos-file-' + osState.openedNotepadFilePath);
        }
        osState.openedNotepadFilePath = folderPath + '/' + fileName;
    } else {
        newKey = 'webos-file-' + defaultSaveFolder + '/' + fileName;
        osState.openedNotepadFilePath = defaultSaveFolder + '/' + fileName;
    }

    localStorage.setItem(newKey, notepadTextarea.value);
    showStatus('Saved!', '#27c93f');
    refreshFileExplorer();
});

document.getElementById('np-clear-btn').addEventListener('click', async () => {
    const fileName = npFileName.value.trim() || 'Untitled.txt';
    const currentKey = 'webos-file-' + (osState.openedNotepadFilePath || defaultSaveFolder + '/' + fileName);
    
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
    osState.openedNotepadFilePath = null;
});