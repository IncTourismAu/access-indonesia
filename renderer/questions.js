const fs = require("fs");
const path = require("path");
const { app } = require("electron");

// 📁 Path to the source of original questions
const questionsPath = path.join(__dirname, "questions.json");

// 💾 Path to user-specific saved answers (stored in Electron's userData folder)
const answersPath = path.join(app.getPath("userData"), "answers.json");

/**
 * 🔄 Load and merge questions with saved answers
 * - Reads questions from `questions.json`
 * - Reads saved answers from user's local `answers.json`
 * - Merges each answer back into its corresponding question object by `id`
 */
function getQuestions() {
  let questions = [];
  let answers = [];

  // Try loading static questions
  try {
    questions = JSON.parse(fs.readFileSync(questionsPath, "utf-8"));
  } catch (err) {
    console.error("❌ Failed to load questions:", err);
  }

  // Try loading previously saved answers
  try {
    if (fs.existsSync(answersPath)) {
      answers = JSON.parse(fs.readFileSync(answersPath, "utf-8"));
    }
  } catch (err) {
    console.error("❌ Failed to load answers:", err);
  }

  // 🔁 Merge saved data back into original question structure
  const merged = questions.map((q) => {
    const saved = answers.find((a) => a.id === q.id);
    return {
      ...q,
      response: saved?.response ?? q.response ?? "",
      responseDetail: saved?.responseDetail ?? q.responseDetail ?? "",
      image: saved?.image ?? q.image ?? "",
      rise: saved?.rise ?? q.rise ?? "",
      run: saved?.run ?? q.run ?? ""
    };
  });

  return merged;
}

/**
 * 💾 Save only answer-specific fields (not full question structure)
 * - Extracts relevant fields from `updatedQuestions`
 * - Writes clean answer-only objects to `answers.json`
 */
function saveQuestions(updatedQuestions) {
  const answers = updatedQuestions.map((q) => ({
    id: q.id,
    response: q.response ?? "",
    responseDetail: q.responseDetail ?? "",
    image: q.image ?? "",
    rise: q.rise ?? "",
    run: q.run ?? ""
  }));

  try {
    fs.writeFileSync(answersPath, JSON.stringify(answers, null, 2));
    console.log("✅ Saved answers to answers.json");
  } catch (err) {
    console.error("❌ Failed to save answers:", err);
  }
}

// Exported functions for use in preload/main/renderer
module.exports = {
  getQuestions,
  saveQuestions
};
