const fs = require("fs");
const path = require("path");
const { app } = require("electron");

const questionsPath = path.join(__dirname, "questions.json");
const answersPath = path.join(app.getPath("userData"), "answers.json");

function getQuestions() {
//   console.log("📂 questionsPath:", questionsPath);
// console.log("📂 answersPath:", answersPath);
// console.log("📦 answers file exists?", fs.existsSync(answersPath));
  let questions = [];
  let answers = [];

  try {
    questions = JSON.parse(fs.readFileSync(questionsPath, "utf-8"));
  } catch (err) {
    console.error("❌ Failed to load questions:", err);
  }

  try {
    if (fs.existsSync(answersPath)) {
      answers = JSON.parse(fs.readFileSync(answersPath, "utf-8"));
    }
  } catch (err) {
    console.error("❌ Failed to load answers:", err);
  }

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

module.exports = {
  getQuestions,
  saveQuestions
};
