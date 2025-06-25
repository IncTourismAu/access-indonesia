/**
 * render.js
 * ----------
 * Entry point for the renderer process.
 * Wires up UI buttons and delegates logic to modular functions.
 */

import { loadQuestions, renderQuestions, handleInputChange } from "./logic/core.js";
import { handleImageUpload, removeImage } from "./logic/image.js";
import { validateGradientQuestions } from "./logic/validation.js";
// Attach key handlers for global modules to access
window.renderQuestions = renderQuestions;
window.handleInputChange = handleInputChange;
window.handleImageUpload = handleImageUpload;
window.removeImage = removeImage;


// Button bindings
document.getElementById("save-data").addEventListener("click", async () => {
  await window.electronAPI.saveAnswers(window.allQuestions);
  await window.electronAPI.showMessageBox({
    type: "info",
    title: "Saved",
    message: "Your answers have been saved.",
  });
});

document.getElementById("generate-pdf").addEventListener("click", async () => {
  if (!validateGradientQuestions(window.allQuestions)) {
    await window.electronAPI.showMessageBox({
      type: "warning",
      title: "Missing Data",
      message: "Please enter height and length for all ramps marked Yes."
    });
    return;
  }

  const filePath = await window.electronAPI.generatePdf(window.allQuestions);
  if (filePath) {
    await window.electronAPI.showMessageBox({
      type: "info",
      title: "PDF Saved",
      message: `PDF file saved to:\n${filePath}`
    });
  }
});

document.getElementById("generate-widget").addEventListener("click", async () => {
  if (!validateGradientQuestions(window.allQuestions)) {
    await window.electronAPI.showMessageBox({
      type: "warning",
      title: "Missing Data",
      message: "Please enter height and length for all ramps marked Yes."
    });
    return;
  }

  const choice = await window.electronAPI.showMessageBox({
    type: "question",
    buttons: ["Bottom Left", "Bottom Center", "Bottom Right", "I will insert my own button manually"],
    defaultId: 0,
    cancelId: 3,
    title: "Widget Button Placement",
    message: "Where should the widget button appear?",
  });

  const positions = ["bottom-left", "bottom-center", "bottom-right", "manual"];
  const position = positions[choice.response];

  const filePath = await window.electronAPI.generateWidget(position);
  if (filePath) {
    await window.electronAPI.showMessageBox({
      type: "info",
      title: "Widget Saved",
      message: `Widget file saved to:\n${filePath}`
    });
  }
});
document.getElementById("clear-data").addEventListener("click", async () => {
  const confirmed = await window.electronAPI.showMessageBox({
    type: "warning",
    buttons: ["Cancel", "Clear All"],
    defaultId: 0,
    cancelId: 0,
    title: "Clear All Data",
    message: "Are you sure you want to delete all answers and uploaded images?",
  });

  if (confirmed.response === 1) {
    await window.electronAPI.clearAppData();
    await loadQuestions(); // ⬅ reload fresh state
  }
});

// Global access for use in other modules
window.handleInputChange = handleInputChange;
window.handleImageUpload = handleImageUpload;
window.removeImage = removeImage;

// Initial load of questions
loadQuestions();
