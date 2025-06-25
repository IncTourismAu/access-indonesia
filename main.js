/**
 * Electron Main Process
 * ---------------------
 * This file bootstraps the Electron app, sets up the main browser window,
 * manages IPC handlers for saving/loading data, generating PDFs and widgets,
 * and managing user images.
 */

const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
//const sharp = require("sharp");

// Directory where user-uploaded images are stored
const saveDir = path.join(app.getPath("userData"), "user_images");
if (!fs.existsSync(saveDir)) {
  fs.mkdirSync(saveDir, { recursive: true });
}

const isDev = !app.isPackaged; // Used to conditionally enable dev tools
const userDataPath = app.getPath("userData");

const questionsPath = path.join(__dirname, "renderer/questions.json");
const answersPath = path.join(userDataPath, "answers.json");
const imagesDir = path.join(userDataPath, "user_images");

const { generatePdf } = require("./renderer/pdf");
const generateWidget = require("./renderer/widget");

/**
 * Create the main browser window.
 */
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,      // ⛔ Prevents direct access to Node from renderer
      nodeIntegration: false,      // ⛔ Stops scripts in HTML from accessing Node
      enableRemoteModule: false    // ⛔ Prevent legacy access to main process
    },
  });

  win.loadFile("index.html");

  // Enable dev tools during development
  if (isDev) {
    win.webContents.openDevTools();
  }
}

// When Electron is ready, initialize the window and image folder
app.whenReady().then(() => {
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir);
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit app when all windows are closed (except on macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

/**
 * Merge saved answers into their corresponding question definitions.
 * This is used when building data for PDF or widget generation.
 */
function mergeAnswersIntoQuestions(questions, answers) {
  return questions.map((q) => {
    const id = q.id;
    const base = { ...q };

    if (q.type === "gradient") {
      base.height = answers[id]?.height || "";
      base.length = answers[id]?.length || "";
    } else if (q.type === "image") {
      base.imageList = answers[id] || [];
    } else {
      base.response = answers[id] || "";
      if (q.needsDetail || q.responseDetailRequired) {
        base.responseDetail = answers[`${id}_detail`] || "";
      }
    }

    return base;
  });
}

// Show a native message box
ipcMain.handle("show-message-box", async (_, options) => {
  const win = BrowserWindow.getFocusedWindow();
  return dialog.showMessageBox(win || null, options);
});

// Show a native error dialog
ipcMain.handle("show-error-box", async (_, { title, content }) => {
  dialog.showErrorBox(title || "Error", content || "An unexpected error occurred.");
});

/**
 * Load questions and answers from disk and return them as a tuple.
 * - questions: static file
 * - answers: dynamic file in user data
 */
ipcMain.handle("get-questions-with-answers", async () => {
  const questionsPath = path.join(__dirname, "renderer", "questions.json");
  const answersPath = path.join(app.getPath("userData"), "answers.json");

  const questions = JSON.parse(fs.readFileSync(questionsPath, "utf-8"));
  let answers = [];

  if (fs.existsSync(answersPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(answersPath, "utf-8"));
      if (Array.isArray(parsed)) {
        answers = parsed;
      } else {
        console.warn("⚠️ answers.json is not an array.");
      }
    } catch (err) {
      console.error("❌ Failed to parse answers.json:", err);
    }
  }

  return [questions, answers];
});

// Save the answers JSON to disk
ipcMain.handle("save-answers", async (_, answers) => {
  try {
    fs.writeFileSync(answersPath, JSON.stringify(answers, null, 2));
    return true;
  } catch (err) {
    console.error("Failed to save answers:", err);
    return false;
  }
});

// Save an uploaded image buffer to disk
// Save an uploaded image buffer to disk without resizing (no sharp)
ipcMain.handle("save-image", async (event, { buffer, id }) => {
  const outputDir = path.join(app.getPath("userData"), "user_images");
  const outputPath = path.join(outputDir, `${id}.jpg`);

  fs.mkdirSync(outputDir, { recursive: true });

  // Just write the image directly
  fs.writeFileSync(outputPath, Buffer.from(buffer));

  return outputPath;
});

// Remove an image file and update the answers JSON to reflect that
// Remove an image file and update the answers JSON to reflect that
ipcMain.handle("remove-image", async (_, { id, index }) => {
  try {
    const answers = JSON.parse(fs.readFileSync(answersPath, "utf-8"));
    const imageArray = answers[id];

    if (Array.isArray(imageArray) && imageArray[index]) {
      const filePath = imageArray[index];

      // Remove the actual image file from disk
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Remove from array
      imageArray.splice(index, 1);

      // Clean up the answer entry if no more images
      if (imageArray.length === 0) {
        delete answers[id];
      } else {
        answers[id] = imageArray;
      }

      // Save updated answers
      fs.writeFileSync(answersPath, JSON.stringify(answers, null, 2));
    }

    return true;
  } catch (err) {
    console.error("❌ Failed to remove image:", err);
    return false;
  }
});


// Clear user answers and uploaded images
ipcMain.handle("clear-app-data", async () => {
  try {
    if (fs.existsSync(answersPath)) fs.unlinkSync(answersPath);
    if (fs.existsSync(imagesDir)) fs.rmSync(imagesDir, { recursive: true, force: true });
    return true;
  } catch (err) {
    console.error("❌ Failed to clear app data:", err);
    return false;
  }
});

// Generate a PDF file using current answers and return the file path
ipcMain.handle("generate-pdf", async (_, questions) => {
  try {
    const pdfPath = path.join(app.getPath("desktop"), `AccessibilityForm-${Date.now()}.pdf`);
    await generatePdf(questions, pdfPath);
    return pdfPath;
  } catch (err) {
    console.error("❌ PDF generation failed:", err);
    return null;
  }
});

// Generate a JavaScript widget file using current answers and user-selected button position
ipcMain.handle("generate-widget", async (_, position) => {
  const answersPath = path.join(app.getPath("userData"), "answers.json");
  const outputPath = path.join(app.getPath("desktop"), `AccessibilityWidget-${Date.now()}.js`);
  await generateWidget(answersPath, outputPath, position);
  return outputPath;
});
