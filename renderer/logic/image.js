/**
 * image.js
 * --------
 * Handles image upload and removal for image-type questions.
 */

/**
 * 📤 Uploads and processes selected image file
 * - Checks file size (must be under 130KB)
 * - Converts to buffer and sends via electronAPI
 * - Saves to user's image path and appends to corresponding question
 * - Triggers UI re-render
 */
export async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
  
    const maxSizeKB = 130;
    if (file.size > maxSizeKB * 1024) {
      await window.electronAPI.showMessageBox({
        type: "warning",
        title: "Image Too Large",
        message: `The selected image is ${Math.round(file.size / 1024)} KB.\nPlease choose an image under ${maxSizeKB} KB.`,
      });
  
      event.target.value = ""; // Clear file input to allow retry
      return;
    }
  
    const buffer = await file.arrayBuffer();
    const qid = event.target.dataset.id;
    const uniqueId = `${qid}-${Date.now()}`; // Ensure unique file name
  
    const filePath = await window.electronAPI.saveImage({
      buffer,
      id: uniqueId,
    });
  
    const q = window.allQuestions.find((x) => x.id === qid);
    if (!q) return;
  
    if (!q.imageList) q.imageList = [];
    q.imageList.push(filePath);
  
    await window.electronAPI.saveAnswers(window.allQuestions);
    window.renderQuestions(); // Refresh UI with new image
  }
  
  /**
   * ❌ Removes an image from a specific question
   * - Triggers backend file deletion
   * - Updates in-memory image list
   * - Re-renders UI
   */
  export async function removeImage(event) {
    event.preventDefault();
    const id = event.target.dataset.id;
    const index = parseInt(event.target.dataset.index, 10);
  
    const success = await window.electronAPI.removeImage({ id, index });
  
    if (success) {
      const q = window.allQuestions.find((x) => x.id === id);
      if (q?.imageList) q.imageList.splice(index, 1);
      await window.electronAPI.saveAnswers(window.allQuestions);
  
      window.renderQuestions();
  
      // ✅ Clear the file input field to allow re-selection of same file
      const fileInput = document.querySelector(`#image-input-${id}`);
      if (fileInput) fileInput.value = "";
    }
  }
  