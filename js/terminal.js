import { osState } from "./state.js";
import { osAlert, osConfirm, osPrompt } from "./dialog.js";
import { registerApp } from "./windowManager.js";

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

updatePrompt();

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