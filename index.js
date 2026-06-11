function updateClock(){
    const now = new Date();
    
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();

    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12;

    minutes = minutes < 10 ? '0' + minutes : minutes;

    const colon = seconds % 2 === 0 ? ':' : ' ';

    const timeString = `${hours}${colon}${minutes} ${ampm}`;

    document.querySelector('.clock').textContent = timeString;
}

updateClock()

setInterval(updateClock, 1000)

const myWindow = document.getElementById('myFirstWindow');
const titleBar = document.querySelector('.title-bar');

let isDragging = false;

let offsetX = 0;
let offsetY = 0;

titleBar.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'BUTTON') return;
    isDragging = true;

    offsetX = e.clientX - myWindow.offsetLeft;
    offsetY = e.clientY - myWindow.offsetTop;
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    myWindow.style.left = (e.clientX - offsetX) + 'px';
    myWindow.style.top = (e.clientY - offsetY) + 'px';
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});




const minBtn = document.getElementById('min-btn');
const maxBtn = document.getElementById('max-btn');
const closeBtn = document.getElementById('close-btn');
const taskbarApp1 = document.getElementById('taskbar-app-1');

closeBtn.addEventListener('click', () => {
    myWindow.style.display = 'none';
    taskbarApp1.style.display = 'none';
    myWindow.classList.toggle('maximized');
});

maxBtn.addEventListener('click', () => {
    myWindow.classList.toggle('maximized');
});

minBtn.addEventListener('click', () => {
    myWindow.style.display = 'none';
    taskbarApp1.classList.remove('active');
});

taskbarApp1.addEventListener('click', () => {
    if (myWindow.style.display === 'none') {
        myWindow.style.display = 'block';
        taskbarApp1.classList.add('active');
    } else {
        myWindow.style.display = 'none';
        taskbarApp1.classList.remove('active');
    }
});




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




const menuNotepad = document.getElementById('menu-notepad');
const notepadWindow = document.getElementById('notepad-window')
const taskbarNotepad = document.getElementById('taskbar-notepad');

menuNotepad.addEventListener('click', () => {
    notepadWindow.style.display = 'block';
    taskbarNotepad.style.display = 'block';
    taskbarNotepad.classList.add('active');


    startMenu.style.display = 'none';
    startButton.classList.remove('active');
});




const menuCalculator = document.getElementById('menu-calculator');
const calculatorWindow = document.getElementById('calculator-window');
const taskbarCalculator = document.getElementById('taskbar-calculator');

menuCalculator.addEventListener('click', () => {
    calculatorWindow.style.display = 'block';
    taskbarCalculator.style.display = 'block';
    taskbarCalculator.classList.add('active');

    startMenu.style.display = 'none';
    startButton.classList.remove('active')
})

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