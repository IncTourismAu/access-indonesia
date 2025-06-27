/**
 * core.js
 * -------
 * Main logic module for question rendering and input handling.
 * Preserves skip logic, blur events, gradient validation.
 */

let skippedIds = new Set();
let shownDuplicates = new Set();

const questionsContainer = document.getElementById("questions-container");

/**
 * Loads and merges questions with saved answers.
 */
export async function loadQuestions() {
  const [questions, answers] = await window.electronAPI.getQuestionsWithAnswers();
  const HIDDEN_IDS = ["q159", "q160", "q172", "q173", "q174", "q126", "q135", "q185"];

  window.allQuestions = questions
    .filter(q => !HIDDEN_IDS.includes(q.id))
    .map(q => {
      const match = answers.find(a => a.id === q.id);
      return match ? { ...q, ...match } : q;
    });

    safeRenderQuestions();
}

/**
 * Renders all visible questions with their inputs.
 */
export function renderQuestions() {
  questionsContainer.innerHTML = "";
  skippedIds = new Set();

  const responses = buildResponseLookup(window.allQuestions);
  applySkipLogic(window.allQuestions, responses);

  const instance1Groups = new Map();

  window.allQuestions.forEach((q) => {
    if (skippedIds.has(q.id)) return;
    if (q.instance === 2 && !shownDuplicates.has(q.group)) return;

    const block = document.createElement("div");
    block.className = "question-block";
    block.dataset.id = q.id;

    const wrapper = document.createElement("div");
    wrapper.className = "inline-question-wrapper";

    if (q.isHeading) {
      const heading = document.createElement("h2");
      heading.textContent = q.question;
      block.appendChild(heading);
    } else {
      const label = document.createElement("label");
      label.textContent = q.question;
      label.className = "inline-question-label";
      wrapper.appendChild(label);

      renderInputByType(q, wrapper);
      block.appendChild(wrapper);
    }

    questionsContainer.appendChild(block);

    if (q.duplicateGroup && q.instance === 1) {
      instance1Groups.set(q.group, block);
    }
  });

  instance1Groups.forEach((_, groupName) => {
    const groupQs = window.allQuestions.filter(
      q => q.group === groupName && q.instance === 1 && !skippedIds.has(q.id)
    );
    if (groupQs.length === 0) return;
  
    const controllingQ = groupQs.find(q =>
      ["y/n", "y/n/p", "y/n/t"].includes(q.type)
    );
    if (controllingQ?.response === "no") return;
  
    const lastId = groupQs[groupQs.length - 1].id;
    const lastElem = document.querySelector(`[data-id="${lastId}"]`);
    if (!lastElem) return;
  
    const toggle = document.createElement("button");
    toggle.className = "duplicate-button";
    toggle.textContent = shownDuplicates.has(groupName)
      ? `Hide second ${groupName}`
      : `Add another ${groupName}`;
    toggle.addEventListener("click", () => {
      if (shownDuplicates.has(groupName)) shownDuplicates.delete(groupName);
      else shownDuplicates.add(groupName);
      safeRenderQuestions();
    });
  
    lastElem.appendChild(toggle);
  });

  addEventListeners();
}

/**
 * Input handler for all fields. Re-renders only for radio buttons (skip logic).
 */
export function handleInputChange(event) {
  const id = event.target.dataset.id;
  const q = window.allQuestions.find(q => q.id === id);
  if (!q) return;

  const isRadio = event.target.type === "radio";

  if (isRadio) {
    q.response = event.target.value;
    safeRenderQuestions(); // Needed for skip logic
    return;
  }

  if (event.target.dataset.gradient === "height") {
    q.height = event.target.value;
  } else if (event.target.dataset.gradient === "length") {
    q.length = event.target.value;
  } else if (event.target.classList.contains("detail-textarea")) {
    q.responseDetail = event.target.value;
  } else {
    q.response = event.target.value;
  }
}

/**
 * Validates gradient inputs and highlights errors.
 */
export function validateGradientQuestions(questions) {
  let valid = true;

  questions.forEach((q) => {
    if (q.type === "gradient" && q.response === "yes") {
      const hasValues = q.height && q.length && !isNaN(q.height) && !isNaN(q.length);
      const block = document.querySelector(`[data-id="${q.id}"]`);

      if (!hasValues) {
        valid = false;
        block?.classList.add("gradient-error");
      } else {
        block?.classList.remove("gradient-error");
      }
    }
  });

  return valid;
}

function addEventListeners() {
    // Save on blur for text, gradient, and detail inputs
    document.querySelectorAll(".response-input, .gradient-input, .detail-textarea").forEach(el => {
      el.addEventListener("blur", () => {
        window.electronAPI.saveAnswers(window.allQuestions);
      });
    });
  
    // ✅ NEW: Save on radio change
    document.querySelectorAll(".radio-input").forEach(radio => {
        radio.addEventListener("change", async event => {
            await window.handleInputChange(event);         // Updates memory + triggers re-render
            await window.electronAPI.saveAnswers(window.allQuestions); // Commits to disk
          });
    });
  }
  

function buildResponseLookup(questions) {
  const map = {};
  questions.forEach(q => {
    map[q.id] = (q.response || "").toLowerCase().trim();
  });
  return map;
}

function applySkipLogic(questions, responses) {
  questions.forEach(q => {
    if (q.skipLogic?.value && q.skipLogic.skip) {
      const actual = responses[q.id] || "";
      const expected = q.skipLogic.value.toLowerCase().trim();
      if (actual === expected) {
        q.skipLogic.skip.forEach(id => skippedIds.add(id));
      }
    }
  });
}

function renderInputByType(q, wrapper) {
  if (["y/n", "y/n/t", "y/n/p", "option"].includes(q.type)) {
    renderRadioInputs(q, wrapper);
    if (q.type === "y/n/t") {
      const textarea = document.createElement("textarea");
      textarea.placeholder = "Enter additional detail...";
      textarea.className = "detail-textarea";
      textarea.dataset.id = q.id;
      textarea.value = q.responseDetail || "";
      textarea.addEventListener("input", window.handleInputChange);
      wrapper.appendChild(textarea);
    }
  } else if (q.type === "gradient") {
    renderGradientInputs(q, wrapper);
  } else if (q.type === "image") {
    renderImageInput(q, wrapper);
  } else {
    renderTextInput(q, wrapper);
  }
}

function renderRadioInputs(q, wrapper) {
    let options;
  
    if (q.type === "option") {
      options = q.conditional?.split(",").map(opt => opt.trim()) || [];
    } else {
      options = ["yes", "no"];
      if (q.type === "y/n/p") options.push("partial");
    }
  
    options.forEach(opt => {
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = q.id;
      radio.value = opt;
      radio.checked = q.response === opt;
      radio.className = "radio-input";
      radio.dataset.id = q.id;
      radio.addEventListener("change", window.handleInputChange);
      wrapper.appendChild(radio);
  
      const label = document.createElement("span");
      label.textContent = opt;
      wrapper.appendChild(label);
    });
  }
  

function renderGradientInputs(q, wrapper) {
  ["yes", "no"].forEach(opt => {
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = q.id;
    radio.value = opt;
    radio.checked = q.response === opt;
    radio.className = "radio-input";
    radio.dataset.id = q.id;
    radio.addEventListener("change", async (event) => {
        window.handleInputChange(event);
        await window.electronAPI.saveAnswers(window.allQuestions);
    
      });
    wrapper.appendChild(radio);

    const span = document.createElement("span");
    span.textContent = opt;
    wrapper.appendChild(span);
  });

  const heightInput = document.createElement("input");
  heightInput.type = "number";
  heightInput.placeholder = "Height (mm)";
  heightInput.className = "gradient-input";
  heightInput.dataset.dimension = "height";
  heightInput.dataset.id = q.id;
  heightInput.value = q.height || "";
  heightInput.addEventListener("blur", async (event) => {
    const id = event.target.dataset.id;
    const value = event.target.value;
    window.allQuestions = window.allQuestions.map(q => q.id === id ? { ...q, height: value } : q);
    await window.electronAPI.saveAnswers(window.allQuestions);
  });
  wrapper.appendChild(heightInput);

  const lengthInput = document.createElement("input");
  lengthInput.type = "number";
  lengthInput.placeholder = "Length (mm)";
  lengthInput.className = "gradient-input";
  lengthInput.dataset.dimension = "length";
  lengthInput.dataset.id = q.id;
  lengthInput.value = q.length || "";
  lengthInput.addEventListener("blur", async (event) => {
    const id = event.target.dataset.id;
    const value = event.target.value;
    window.allQuestions = window.allQuestions.map(q => q.id === id ? { ...q, length: value } : q);
    await window.electronAPI.saveAnswers(window.allQuestions);
  });
  wrapper.appendChild(lengthInput);
}

function renderTextInput(q, wrapper) {
  const input = document.createElement("input");
  input.type = q.type === "number" ? "number" : "text";
  input.placeholder = "Your answer...";
  input.value = q.response || "";
  input.className = "response-input";
  input.dataset.id = q.id;
  input.addEventListener("input", window.handleInputChange);
  wrapper.appendChild(input);
}

function renderImageInput(q, wrapper) {
    const hasImage = Array.isArray(q.imageList) && q.imageList.length > 0;
  
    if (hasImage) {
      q.imageList.forEach((imgPath, idx) => {
        const img = document.createElement("img");
        img.src = imgPath;
        img.className = "preview-image";
        wrapper.appendChild(img);
  
        const removeBtn = document.createElement("button");
        removeBtn.textContent = "Remove";
        removeBtn.className = "remove-image";
        removeBtn.dataset.id = q.id;
        removeBtn.dataset.index = idx;
        removeBtn.addEventListener("click", window.removeImage);
        wrapper.appendChild(removeBtn);
      });
    } else {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.className = "image-input";
      input.dataset.id = q.id;
      input.dataset.imgIndex = 0;
      input.addEventListener("change", window.handleImageUpload);
      wrapper.appendChild(input);
    }
  }
  function safeRenderQuestions() {
    const active = document.activeElement;
    const activeId = active?.dataset?.id;
    const activeType = active?.type;
    const activeValue = active?.value;
  
    renderQuestions(); // ⚠ triggers full redraw
  
    if (activeId) {
      let selector = `[data-id="${activeId}"]`;
      if (activeType === "radio" && activeValue) {
        selector += `[value="${activeValue}"]`;
      }
      const toFocus = document.querySelector(selector);
      if (toFocus) toFocus.focus();
    }
  }
  