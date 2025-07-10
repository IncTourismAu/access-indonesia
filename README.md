# Access Indonesia – Accessibility Questionnaire App

This Electron app is designed to assist in collecting accessibility data from hotels in Indonesia. It allows users to answer a structured form, save responses, generate a PDF report, and build a JavaScript widget that can be embedded in a webpage by your developer.

---

## 📥 Downloads

- [Download for macOS (.dmg)](https://github.com/IncTourismAu/access-indonesia/releases/download/v1.0.0/Access.Bali.Hotels-1.0.0.dmg)
- [Download for Windows (.exe)](https://github.com/IncTourismAu/access-indonesia/releases/download/v1.0.0/Access.Bali.Hotels.Setup.1.0.0.exe)
- [Download Installation Guide PDF](https://github.com/IncTourismAu/access-indonesia/blob/main/Installation%20Guide.pdf)
- [Download Accessibility Widget Shortcode Guide PDF](https://github.com/IncTourismAu/access-indonesia/blob/main/Accessibility_Widget_Shortcode_Guide.pdf)
- [Download How to Guide ENG PDF](https://github.com/IncTourismAu/access-indonesia/blob/main/How%20to%20Guide-EN.pdf)
- [Download How to Guide INDO PDF](https://github.com/IncTourismAu/access-indonesia/blob/main/How%20to%20Guide-INDO.pdf)
- [Download Assessment Checklist ENG PDF](https://github.com/IncTourismAu/access-indonesia/blob/main/Assessment%20Checklist%20EN.pdf)
- [Download Assessment Checklist INDO PDF](https://github.com/IncTourismAu/access-indonesia/blob/main/Assessment%20Checklist%20INDO.pdf)

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
- Image uploads are restricted to ~130KB for performance 
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




---

## 🚨 Running the App on macOS and Windows (Unsigned Build)

This application is self-signed (or unsigned), so both macOS and Windows may display a warning when you first try to open it. This is expected behavior for desktop apps not distributed via the App Store or Microsoft Store.

### 🖥 macOS

macOS Gatekeeper may block the app with a message like:

> “Access Bali Hotels can’t be opened because Apple cannot check it for malicious software.”

#### ✅ To allow it:
1. Attempt to open the app by double-clicking it — then click **Cancel** when the warning appears.
2. Open **System Settings** → **Privacy & Security**.
3. Scroll down to the **Security** section.
4. You’ll see a message about the blocked app — click **Open Anyway**.
5. Confirm again by clicking **Open** in the dialog.

### 🪟 Windows

Windows Defender SmartScreen may show:

> “Windows protected your PC. Microsoft Defender SmartScreen prevented an unrecognized app from starting.”

#### ✅ To allow it:
1. Click **More info** in the warning popup.
2. Then click **Run anyway**.

---

Both platforms will remember your choice and allow the app to open normally in the future.


## 📄 License

MIT
