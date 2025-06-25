/**
 * validation.js
 * -------------
 * Contains validation logic for specific question types.
 * Used before saving or exporting data.
 */

/**
 * Ensures that all gradient questions marked "yes" have both height and length.
 * Adds/removes the "missing" class for visual feedback.
 * 
 * @param {Array} questions - All merged questions
 * @returns {boolean} True if all gradients are valid
 */
export function validateGradientQuestions(questions) {
    let valid = true;
    questions.forEach(q => {
        if (q.type === "gradient" && q.response === "yes"){
        const height = q.height?.toString().trim();
        const length = q.length?.toString().trim();
  
        const heightElem = document.querySelector(`input[data-id="${q.id}"][data-dimension="height"]`);
        const lengthElem = document.querySelector(`input[data-id="${q.id}"][data-dimension="length"]`);
  
        if (!height || !length || isNaN(height) || isNaN(length)) {
          if (heightElem) heightElem.classList.add("gradient-error");
          if (lengthElem) lengthElem.classList.add("gradient-error");
          valid = false;
        } else {
          if (heightElem) heightElem.classList.remove("gradient-error");
          if (lengthElem) lengthElem.classList.remove("gradient-error");
        }
      }
    });
  
    return valid;
  }
  
  