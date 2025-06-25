# Accessible Indonesia – Electron App

This Electron app is designed to assist with auditing accessible accommodations in Indonesia. It features a form-based interface with grouped questions, image upload, and the ability to generate:

- A complete PDF report
- An embeddable widget for websites
- Persistent saved progress via answers.json

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- NPM

### Install Dependencies

```bash
npm install
```

### Run the App

```bash
npm start
```

---

## 📦 Packaging for Production

### macOS

```bash
npm run make
```

This creates a `.dmg` installer in the `out/make/` directory.

### Windows

```bash
npm run make
```

Creates a signed `.exe` installer for Windows users.

---

## 📝 Features

- Form questions grouped by section
- Conditional logic (skip certain questions based on answers)
- Image uploads (one per image-type question)
- PDF export with grouped layout
- Widget generator to embed answers in other sites

---

## 🧩 Widget Embedding

When generating a widget, users can choose:

- Button position (bottom left, center, or right)
- Or manually insert their own trigger button using:

```html
<button id="open-widget">Open Accessibility Info</button>
```

> Note: Uploaded images are embedded in the widget, so total file size increases with each image.
To keep widget size reasonable, limit uploads to compressed images (130 KB or less).

---

## 📄 PDF Export

Exports a structured accessibility report:

- Image gallery at the top (max 24 images)
- 6 images per page (2 per row × 3 rows)
- Questions, answers, and details grouped below

> Electron auto-compresses images during rendering.
Final PDFs are compact and optimized for emailing.

---

## 🖼 Image Upload Guidelines

- You may upload **one image per image-type question**
- Image size must be **under 130 KB**
- Larger images are rejected with a native popup
- Images are previewed with a remove option

---

## 🧹 Image Storage and Cleanup

Images are stored in the app’s private data folder.

When an image is removed or replaced:
- The old image file is deleted
- The answers.json file is updated
- Disk usage is kept minimal

---

## 🛡 Security Notes

- Images and answers are stored locally (not uploaded to cloud)
- The app uses Electron IPC securely
- No remote APIs or network access is required

---

## 📁 File Structure

```plaintext
.
├── main.js                # Electron main process
├── preload.js             # Secure bridge between renderer and main
├── render.js              # Form logic and UI rendering
├── logic/
│   ├── core.js            # Form rendering helpers and state updates
│   ├── image.js           # Image upload, preview, and removal
│   ├── validation.js      # Gradient and input validators
│   └── pdf.js             # PDF generation
├── data/
│   ├── questions.js       # Question definitions
│   └── answers.json       # User responses
├── widget.js              # Widget generator and output
├── widget.template.js     # Widget HTML layout
├── index.html             # Renderer HTML entry point
└── style.css              # App styling
```

---

## 📬 Contact / Support

This app is currently under pilot testing in select Indonesian hotels.  
For questions or deployment help, contact the developer.

---

MIT License  
Dylan Prior, 2025
