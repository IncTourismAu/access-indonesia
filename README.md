# Access Indonesia – Accessibility Questionnaire App

This Electron app is designed to assist in collecting accessibility data from hotels in Indonesia. It allows users to answer a structured form, save responses, generate a PDF report, and build a JavaScript widget that can be embedded in a webpage by your developer.

---

## 📥 Downloads

- [Download for macOS (.dmg)](https://github.com/IncTourismAu/access-indonesia/releases/download/v1.0.0/Access.Bali.Hotels-1.0.0.dmg)
- [Download for Windows (.exe)](https://github.com/IncTourismAu/access-indonesia/releases/download/v1.0.0/Access.Bali.Hotels.Setup.1.0.0.exe)

---

## ✨ Features

- Electron-based cross-platform desktop app (macOS & Windows)
- Dynamically rendered form based on `questions.js`
- Supports:
  - Text answers
  - Yes/No, Yes/No/Partial, Option-type radio buttons
  - Gradient input with validation (Height & Length)
  - Image upload per question (with preview and delete)
- Skip logic to hide/show relevant follow-ups
- Local save/load of answers (via Electron `userData` path)
- PDF export with:
  - Grouped images at top
  - Tabular report (3-column layout: Question, Answer, Details)
  - Custom layout control: 6 images per row max, scaled to 250px
- Embeddable widget generator with 3 position options or manual button trigger
- Native error popups (e.g. for image size too large)

---

## 🗂 Folder Structure

```
.
├── assets/
├── dist/
├── node_modules/
├── renderer/
│   ├── logic/
│   │   ├── core.js
│   │   ├── image.js
│   │   ├── validation.js
│   ├── questions.js
│   ├── pdf.js
│   ├── render.js
│   ├── widget.js
│   ├── widget.template.js
├── styles/
│   └── style.css
├── Access-Bali-Hotels.png
├── generate-icons.js
├── index.html
├── main.js
├── preload.js
├── package.json
├── package-lock.json
├── README.md
```

---

## 💾 Data Persistence

All user data is stored locally on the user's machine in Electron's `app.getPath('userData')` directory:

- **macOS:** `~/Library/Application Support/access-bali-hotels/answers.json`
- **Windows:** `C:\Users\USERNAME\AppData\Roaming\access-bali-hotels\answers.json`

Uploaded images are stored in a `user_images` subdirectory within the same path.

---

## 🚀 Getting Started

### Clone & Install

```bash
git clone https://github.com/yourusername/access-indonesia.git
cd access-indonesia
npm install
```

### Run the App

```bash
npm start
```

---

## 🧪 Development Notes

- Electron IPC bridges main <-> renderer
- PDF is generated in memory using base64 image data
- Gradient questions must include height/length when "yes" is selected
- Image uploads are restricted to ~130KB for performance on lower-end machines
- Widget and PDF respect grouped question layout and output labels
- The app builds a JavaScript widget that can be embedded in a webpage by your developer

---

## 📦 Building Installers

To build platform-specific installers:

```bash
# macOS DMG
npm run build:mac

# Windows EXE
npm run build:win
```

These scripts will generate `.dmg` and `.exe` installers using electron-builder in the `/dist` directory.

---

## 🛡 Security

- No remote URLs or web access
- All user data remains local to device
- Electron context isolation and preload API used
- Uses Electron’s recommended `contextBridge` API for secure data sharing

---

## 📸 Screenshot

![Screenshot](Access-Bali-Hotels.png)

---


---

## 🔧 Code Structure Overview

This project is divided between Electron’s main and renderer processes, with logic modularized for clarity and testability.

### 📁 Root Files
- `main.js` – Entry point. Manages app lifecycle, window creation, and IPC channels for PDF and widget generation.
- `preload.js` – Secure bridge exposing limited APIs from main to renderer (via contextBridge).
- `index.html` – Basic HTML scaffold loaded into the renderer window.

### 🖼 Renderer Files (`/renderer`)
- `render.js` – Wires up all buttons (save, PDF, widget) and initializes the UI.
- `logic/core.js` – Core logic to render questions, apply skip logic, track answers, and validate gradients.
- `questions.js` – Loads `questions.json` and merges it with saved answers from disk.
- `pdf.js` – Builds HTML structure and exports a grouped-accessibility PDF with images and answers.
- `widget.js` – Processes answers and injects them into a JavaScript-based widget using `widget.template.js`.
- `widget.template.js` – Self-contained popup template that displays questions and image gallery in a page overlay.
- `logic/image.js` – Handles image selection, base64 conversion, save/remove logic.
- `logic/validation.js` – Centralized validation logic (currently gradient-specific).

### 📁 Styles
- `style.css` – Base form layout, image styling, and responsive tweaks.

### 📁 Electron Data Paths
- All answers saved to:
  - **macOS:** `~/Library/Application Support/access-bali-hotels/answers.json`
  - **Windows:** `C:\Users\USERNAME\AppData\Roaming\access-bali-hotels\answers.json`
- Uploaded images saved in:  
  `user_images/` subfolder in the same directory.



## 📄 License

MIT
