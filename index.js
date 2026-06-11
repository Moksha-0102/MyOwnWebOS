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