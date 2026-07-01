import { osState } from "./state.js";

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

export const osAlert = (message, title) => showOsDialog({type: 'alert', message, title});
export const osConfirm = (message, title) => showOsDialog({type: 'confirm', message, title});
export const osPrompt = (message, defaultValue, title) => showOsDialog({type: 'prompt', message, title, defaultValue});
