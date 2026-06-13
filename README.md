# WebOS 1.0

A fully interactive Vanilla JavaScript Operating System environment built directly in the browser.

### 🌐 Live Demo
**[Click here to boot WebOS](https://my-web-os-inky.vercel.app/)**

### 📸 Preview
![WebOS Desktop](./screenshot.png)

### 🚀 How to Run Locally
Because this project uses pure HTML, CSS, and JS with zero dependencies, running it locally is instant:
1. Clone or download this repository to your machine.
2. Open the folder.
3. Double-click `index.html` to open it in any modern web browser. No terminal commands required.

### 🛠 Technical Highlights
* **Custom Window Manager:** Engineered an absolute-positioned drag-and-drop system with dynamic Z-Index rendering and screen-edge collision constraints.
* **State Persistence:** Uses the browser's `localStorage` API to permanently save the X/Y coordinates of desktop icons across hard refreshes aswell as some settings.
* **Native Override:** Hijacked the browser's native context menu to inject a custom OS-level right-click menu, and implemented DOM-level shields to defeat the browser's native "ghost drag" text-highlighting behaviors.
* **FOUC Elimination:** Inverted the DOM rendering logic to strictly prevent Flash of Unwanted Content during the local storage boot sequence.
