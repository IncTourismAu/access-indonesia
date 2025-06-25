/**
 * preload.js
 * ----------
 * This file uses Electron’s contextBridge to securely expose selected IPC functions
 * to the renderer process (front-end). It bridges the main process functionality
 * (e.g., saving files, generating PDFs/widgets) to the browser context.
 */

const { contextBridge, ipcRenderer } = require("electron");

// Expose limited Electron APIs under window.electronAPI
contextBridge.exposeInMainWorld("electronAPI", {
  /**
   * Save modified questions to disk (not commonly used in production).
   * @param {Array} data - Array of question objects to store
   */
  saveQuestions: (data) => ipcRenderer.invoke("save-questions", data),

  /**
   * Load base questions from JSON file on disk.
   */
  getQuestions: () => ipcRenderer.invoke("get-questions"),

  /**
   * Save current user answers (including details, images, etc.) to answers.json.
   * @param {Object} data - Key-value map of answers
   */
  saveAnswers: (data) => ipcRenderer.invoke("save-answers", data),

  /**
   * Load raw answers from disk.
   */
  getAnswers: () => ipcRenderer.invoke("get-answers"),

  /**
   * Save an image file (from user upload) to the filesystem.
   * @param {Object} fileData - Object with buffer and filename
   */
  saveImage: (fileData) => ipcRenderer.invoke("save-image", fileData),

  /**
   * Generate a PDF from the current set of questions and answers.
   * @param {Array} answers - Merged questions/answers used for PDF layout
   */
  generatePdf: (answers) => ipcRenderer.invoke("generate-pdf", answers),

  /**
   * Generate a JavaScript widget file from answers and a selected position.
   * @param {String} data - One of: "bottom-left", "bottom-center", "bottom-right", "manual"
   */
  generateWidget: (data) => ipcRenderer.invoke("generate-widget", data),

  /**
   * Delete all saved answers and uploaded images.
   */
  clearAppData: () => ipcRenderer.invoke("clear-app-data"),

  /**
   * Remove a specific image from a question by ID and index.
   * @param {Object} info - { id: questionId, index: imageIndex }
   */
  removeImage: (info) => ipcRenderer.invoke("remove-image", info),

  /**
   * Get both the base questions and the user's current answers as a merged array.
   * Useful for rendering, PDFs, and widget export.
   */
  getQuestionsWithAnswers: () => ipcRenderer.invoke("get-questions-with-answers"),

  /**
   * Show a native message dialog (e.g., OK, Cancel).
   * @param {Object} options - Electron dialog config
   */
  showMessageBox: (options) => ipcRenderer.invoke("show-message-box", options),

  /**
   * Show a native error dialog box.
   * @param {String} title - Title of the error box
   * @param {String} content - Message to display
   */
  showErrorBox: (title, content) => ipcRenderer.invoke("show-error-box", { title, content })
});
