/**
 * render.js
 * ----------
 * Entry point for the renderer process.
 * Wires up UI buttons and delegates logic to modular functions.
 */

import { loadQuestions, renderQuestions, handleInputChange } from "./logic/core.js";
import { handleImageUpload, removeImage } from "./logic/image.js";
import { validateGradientQuestions } from "./logic/validation.js";

// 🌐 Make key functions globally accessible for use in inline HTML or other modules
window.renderQuestions = renderQuestions;
window.handleInputChange = handleInputChange;
window.handleImageUpload = handleImageUpload;
window.removeImage = removeImage;

// 💾 SAVE DATA button
document.getElementById("save-data").addEventListener("click", async () => {
  await window.electronAPI.saveAnswers(window.allQuestions);
  await window.electronAPI.showMessageBox({
    type: "info",
    title: "Saved",
    message: "Your answers have been saved.",
  });
});

// 🧾 GENERATE PDF button
document.getElementById("generate-pdf").addEventListener("click", async () => {
  // Validate ramp gradients before generating PDF
  if (!validateGradientQuestions(window.allQuestions)) {
    await window.electronAPI.showMessageBox({
      type: "warning",
      title: "Missing Data",
      message: "Please enter height and length for all ramps marked Yes."
    });
    return;
  }

  // Generate PDF and notify user of saved file path
  const filePath = await window.electronAPI.generatePdf(window.allQuestions);
  if (filePath) {
    await window.electronAPI.showMessageBox({
      type: "info",
      title: "PDF Saved",
      message: `PDF file saved to:\n${filePath}`
    });
  }
});

// 📦 GENERATE WIDGET button
document.getElementById("generate-widget").addEventListener("click", async () => {
  // Validate gradient logic again
  if (!validateGradientQuestions(window.allQuestions)) {
    await window.electronAPI.showMessageBox({
      type: "warning",
      title: "Missing Data",
      message: "Please enter height and length for all ramps marked Yes."
    });
    return;
  }

  // Ask user where the widget button should appear
  const choice = await window.electronAPI.showMessageBox({
    type: "question",
    buttons: ["Bottom Left", "Bottom Center", "Bottom Right", "I will insert my own button manually"],
    defaultId: 0,
    cancelId: 3,
    title: "Widget Button Placement",
    message: "Where should the widget button appear?",
  });

  // Map button selection to internal widget position setting
  const positions = ["bottom-left", "bottom-center", "bottom-right", "manual"];
  const position = positions[choice.response];

  // Generate widget and confirm saved location
  const filePath = await window.electronAPI.generateWidget(position);
  if (filePath) {
    await window.electronAPI.showMessageBox({
      type: "info",
      title: "Widget Saved",
      message: `Widget file saved to:\n${filePath}`
    });
  }
});

// 🧹 CLEAR DATA button
document.getElementById("clear-data").addEventListener("click", async () => {
  const confirmed = await window.electronAPI.showMessageBox({
    type: "warning",
    buttons: ["Cancel", "Clear All"],
    defaultId: 0,
    cancelId: 0,
    title: "Clear All Data",
    message: "Are you sure you want to delete all answers and uploaded images?",
  });

  // If user confirms, clear local data and reload form fresh
  if (confirmed.response === 1) {
    await window.electronAPI.clearAppData();
    await loadQuestions(); // ⬅ Reloads initial questions without answers
  }
});

// 🧠 Redundant: ensures global access (can be removed if already set above)
window.handleInputChange = handleInputChange;
window.handleImageUpload = handleImageUpload;
window.removeImage = removeImage;

// 🚀 Initial load of questions into the form
loadQuestions();
