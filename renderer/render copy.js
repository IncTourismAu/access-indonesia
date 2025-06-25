/**
 * render.js
 * ---------
 * This script runs in the renderer process of the Electron app.
 * It dynamically renders questions, handles user input,
 * saves answers, applies skip logic, and enables PDF/widget generation.
 */

const questionsContainer = document.getElementById("questions-container");
const saveButton = document.getElementById("save-data");
const generatePdfButton = document.getElementById("generate-pdf");
const generateWidgetButton = document.getElementById("generate-widget");

let allQuestions = [];
let skippedIds = new Set();
let shownDuplicates = new Set();

/**
 * Renders all questions to the DOM, applying skip logic and dynamic inputs.
 */
function renderQuestions() {
  const container = document.getElementById("questions-container");
  container.innerHTML = "";
  skippedIds = new Set();

  const responses = {};
  allQuestions.forEach(q => {
    responses[q.id] = (q.response || "").toLowerCase().trim();
  });

  allQuestions.forEach(q => {
    if (q.skipLogic?.value && q.skipLogic.skip) {
      const actual = responses[q.id] || "";
      const expected = q.skipLogic.value.toLowerCase().trim();
      if (actual === expected) {
        q.skipLogic.skip.forEach(id => skippedIds.add(id));
      }
    }
  });

  const instance1Groups = new Map();

  allQuestions.forEach((q) => {
    if (skippedIds.has(q.id)) return;
    if (q.instance === 2 && !shownDuplicates.has(q.group)) return;

    const div = document.createElement("div");
    div.className = "question-block";
    div.dataset.id = q.id;

    const inputWrapper = document.createElement("div");
    inputWrapper.className = "inline-question-wrapper";

    if (q.isHeading) {
      const heading = document.createElement("h2");
      heading.textContent = q.question;
      div.appendChild(heading);
    } else {
      const label = document.createElement("label");
      label.textContent = q.question;
      label.className = "inline-question-label";
      inputWrapper.appendChild(label);

      // Full radio button logic preserved
      if (["y/n", "y/n/t", "y/n/p", "option"].includes(q.type)) {
        let options;
        if (q.type === "option") {
          options = q.choices || [];
        } else {
          options = ["yes", "no"];
          if (q.type === "y/n/p") options.push("partial");
        }

        options.forEach((opt) => {
          const radio = document.createElement("input");
          radio.type = "radio";
          radio.name = q.id;
          radio.value = opt;
          radio.checked = q.response === opt;
          radio.className = "radio-input";
          radio.addEventListener("change", handleInputChange);
          inputWrapper.appendChild(radio);

          const radioLabel = document.createElement("span");
          radioLabel.textContent = opt;
          inputWrapper.appendChild(radioLabel);
        });

        if (q.type === "y/n/t") {
          const detail = document.createElement("textarea");
          detail.placeholder = "Enter additional detail...";
          detail.className = "detail-textarea";
          detail.dataset.id = q.id;
          detail.value = q.responseDetail || "";
          detail.addEventListener("input", handleInputChange);
          inputWrapper.appendChild(detail);
        }

      } else if (q.type === "gradient") {
        ["yes", "no"].forEach(opt => {
          const radio = document.createElement("input");
          radio.type = "radio";
          radio.name = q.id;
          radio.value = opt;
          radio.checked = q.response === opt;
          radio.className = "radio-input";
          radio.addEventListener("change", handleInputChange);
          inputWrapper.appendChild(radio);

          const span = document.createElement("span");
          span.textContent = opt;
          inputWrapper.appendChild(span);
        });

        const heightInput = document.createElement("input");
        heightInput.type = "number";
        heightInput.placeholder = "Height (mm)";
        heightInput.dataset.gradient = "height";
        heightInput.dataset.id = q.id;
        heightInput.value = q.height || "";
        heightInput.className = "gradient-input";
        heightInput.addEventListener("input", handleInputChange);
        inputWrapper.appendChild(heightInput);

        const lengthInput = document.createElement("input");
        lengthInput.type = "number";
        lengthInput.placeholder = "Length (mm)";
        lengthInput.dataset.gradient = "length";
        lengthInput.dataset.id = q.id;
        lengthInput.value = q.length || "";
        lengthInput.className = "gradient-input";
        lengthInput.addEventListener("input", handleInputChange);
        inputWrapper.appendChild(lengthInput);

      } else if (q.type === "image") {
        if (Array.isArray(q.imageList)) {
          q.imageList.forEach((imgPath, idx) => {
            const img = document.createElement("img");
            img.src = imgPath;
            img.className = "preview-image";
            inputWrapper.appendChild(img);

            const removeBtn = document.createElement("button");
            removeBtn.textContent = "Remove";
            removeBtn.className = "remove-image";
            removeBtn.dataset.id = q.id;
            removeBtn.dataset.index = idx;
            removeBtn.addEventListener("click", removeImage);
            inputWrapper.appendChild(removeBtn);
          });
        }

        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.dataset.id = q.id;
        input.dataset.imgIndex = 0;
        input.className = "image-input";
        input.addEventListener("change", handleImageUpload);
        inputWrapper.appendChild(input);

      } else {
        const input = document.createElement("input");
        input.type = q.type === "number" ? "number" : "text";
        input.placeholder = "Your answer...";
        input.value = q.response || "";
        input.dataset.id = q.id;
        input.className = "response-input";
        input.addEventListener("input", handleInputChange);
        inputWrapper.appendChild(input);
      }

      div.appendChild(inputWrapper);
    }

    container.appendChild(div);

    if (q.duplicateGroup && q.instance === 1) {
      instance1Groups.set(q.group, div);
    }
  });

  // Restore original group toggle button logic
  instance1Groups.forEach((firstElem, groupName) => {
    const groupQuestions = allQuestions.filter(q => q.group === groupName && q.instance === 1 && !skippedIds.has(q.id));
    if (groupQuestions.length > 0) {
      const lastId = groupQuestions[groupQuestions.length - 1].id;
      const lastQuestionElem = document.querySelector(`[data-id="${lastId}"]`);
      if (!lastQuestionElem) return;

      const toggle = document.createElement("button");
      toggle.className = "duplicate-button";
      toggle.textContent = shownDuplicates.has(groupName)
        ? `Hide second ${groupName}`
        : `Add another ${groupName}`;

      toggle.addEventListener("click", () => {
        if (shownDuplicates.has(groupName)) shownDuplicates.delete(groupName);
        else shownDuplicates.add(groupName);
        renderQuestions();
      });

      lastQuestionElem.appendChild(toggle);
    }
  });

  addEventListeners();
}

function validateGradientQuestions() {
  let valid = true;
  allQuestions.forEach((q) => {
    if (q.type === "gradient" && q.response === "yes") {
      if (!q.height || !q.length || isNaN(q.height) || isNaN(q.length)) {
        valid = false;
        document.querySelector(`[data-id="${q.id}"]`)?.classList.add("missing");
      } else {
        document.querySelector(`[data-id="${q.id}"]`)?.classList.remove("missing");
      }
    }
  });
  return valid;
}

function handleInputChange(event) {
  const id = event.target.dataset.id;
  const q = allQuestions.find((x) => x.id === id);
  if (!q) return;

  if (event.target.type === "radio") {
    q.response = event.target.value;
  } else if (event.target.dataset.gradient === "height") {
    q.height = event.target.value;
  } else if (event.target.dataset.gradient === "length") {
    q.length = event.target.value;
  } else if (event.target.classList.contains("detail-textarea")) {
    q.responseDetail = event.target.value;
  } else {
    q.response = event.target.value;
  }

  renderQuestions();
}

async function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const buffer = await file.arrayBuffer();
  const id = event.target.dataset.id;

  const filePath = await window.electronAPI.saveImage({
    buffer,
    name: file.name,
  });

  const q = allQuestions.find((x) => x.id === id);
  if (!q.imageList) q.imageList = [];
  q.imageList.push(filePath);

  renderQuestions();
}

async function removeImage(event) {
  event.preventDefault();
  const id = event.target.dataset.id;
  const index = parseInt(event.target.dataset.index, 10);
  const success = await window.electronAPI.removeImage({ id, index });
  if (success) {
    const q = allQuestions.find((x) => x.id === id);
    if (q?.imageList) q.imageList.splice(index, 1);
    renderQuestions();
  }
}

saveButton.addEventListener("click", async () => {
  await window.electronAPI.saveAnswers(allQuestions);
  await window.electronAPI.showMessageBox({
    type: "info",
    title: "Saved",
    message: "Your answers have been saved.",
  });
});

generatePdfButton.addEventListener("click", async () => {
  if (!validateGradientQuestions()) {
    await window.electronAPI.showMessageBox({
      type: "warning",
      title: "Missing Data",
      message: "Please enter height and length for all ramps marked Yes."
    });
    return;
  }

  const filePath = await window.electronAPI.generatePdf(allQuestions);
  if (filePath) {
    await window.electronAPI.showMessageBox({
      type: "info",
      title: "PDF Saved",
      message: `PDF file saved to:\n${filePath}`
    });
  }
});

generateWidgetButton.addEventListener("click", async () => {
  if (!validateGradientQuestions()) {
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

async function loadQuestions() {
  const [questions, answers] = await window.electronAPI.getQuestionsWithAnswers();
  const HIDDEN_QUESTION_IDS = ["q159", "q160", "q172", "q173", "q174"];

  allQuestions = questions
    .filter(q => !HIDDEN_QUESTION_IDS.includes(q.id))
    .map(q => {
      const match = answers.find(a => a.id === q.id);
      return match ? { ...q, ...match } : q;
    });

  renderQuestions();
}

loadQuestions();
