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
        highestZIndex++;
        clickedWindow.style.zIndex = highestZIndex;
    }

    const titleBar = e.target.closest('.title-bar');
    if (titleBar && e.target.tagName !== 'BUTTON') {
        isDragging = true;
        draggedWindow = clickedWindow;

        offsetX = e.clientX - draggedWindow.offsetLeft;
        offsetY = e.clientY - draggedWindow.offsetTop;
    }
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging || !draggedWindow) return;

    let newX = e.clientX - offsetX;
    let newY = e.clientY - offsetY;

    if (newY < 0){
        newY = 0;
    }

    let bottomLimit = window.innerHeight - 70;
    if (newY > bottomLimit){
        newY = bottomLimit;
    }

    draggedWindow.style.left = newX + 'px';
    draggedWindow.style.top = newY + 'px';
});

document.addEventListener('mouseup', () => {
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

    if (choice === 'default') {
        document.body.style.backgroundImage = 'none';
        document.body.style.backgroundColor = '#2b6cb0';
    }
    else if (choice === 'custom'){
        if (customUrlInput.value) setWallpaper(customUrlInput.value);
    }
    else if (choice === 'nasa'){
        try {
            const response = await fetch('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY')
            const data = await response.json();

            if (data.media_type === 'image'){
                setWallpaper(data.url);      
            } else {
                throw new Error('Today APOD is a video, not an image.');
            }
        } catch (error) {
            console.error(error);
            nasaError.style.display = 'block';
            document.body.style.backgroundImage = 'none';
            document.body.style.backgroundColor = '#2b6cb0'
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

registerApp('notepad-window', 'taskbar-notepad', 'menu-notepad', 'np-min-btn', 'np-max-btn', 'np-close-btn');
registerApp('calculator-window', 'taskbar-calculator', 'menu-calculator', 'calc-min-btn', 'calc-max-btn', 'calc-close-btn');
registerApp('myFirstWindow', 'taskbar-app-1', null, 'min-btn', 'max-btn', 'close-btn');
registerApp('settings-window', 'taskbar-settings', 'menu-settings', 'set-min-btn', 'set-max-btn', 'set-close-btn');






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