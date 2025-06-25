const fs = require("fs");
const path = require("path");

function toBase64Image(filePath) {
  try {
    const resolved = path.resolve(filePath);
    const ext = path.extname(resolved).substring(1).toLowerCase();
    const base64 = fs.readFileSync(resolved).toString("base64");
    return `data:image/${ext};base64,${base64}`;
  } catch (err) {
    console.warn("❌ Failed to encode image:", filePath, err.message);
    return null;
  }
}

function groupQuestions(questions) {
  const grouped = new Map();

  for (const q of questions) {
    if (q.type === "image") continue;

    const hasResponse = q.response || q.responseDetail || q.height || q.length;
    if (!hasResponse) continue;

    const heading = q.group || "General";
    const group = grouped.get(heading) || { questions: [] };

    let gradientText = "";
    if (
      q.type === "gradient" &&
      q.response === "yes" &&
      q.height &&
      q.length &&
      !isNaN(parseFloat(q.height)) &&
      !isNaN(parseFloat(q.length))
    ) {
      const h = parseFloat(q.height);
      const l = parseFloat(q.length);
      if (h > 0 && l > 0) {
        const ratio = (l / h).toFixed(1);
        gradientText = `1 : ${ratio}`;
      }
    }

    group.questions.push({
      question: q.outputLabel || q.question,
      response: q.response || "",
      detail: gradientText || q.responseDetail || ""
    });

    grouped.set(heading, group);
  }

  return Array.from(grouped.entries()).map(([heading, { questions }]) => ({
    heading,
    questions
  }));
}

function collectGalleryImages(questions) {
  const gallery = [];

  for (const q of questions) {
    if (q.type === "image" && Array.isArray(q.imageList)) {
      q.imageList.forEach((imgPath) => {
        const base64 = toBase64Image(imgPath);
        if (base64) {
          gallery.push({ src: base64, label: q.group || "General" });
        }
      });
    }
  }

  return gallery;
}

function injectTemplate(grouped, imageGallery, position) {
  const template = fs.readFileSync(path.join(__dirname, "widget.template.js"), "utf8");
  return `(function() {
    const data = ${JSON.stringify(grouped, null, 2)};
    const imageGallery = ${JSON.stringify(imageGallery, null, 2)};
    const buttonPosition = "${position}";
    ${template}
  })();`;
}

module.exports = async function generateWidget(answersPath, outputPath, position = "bottom-left") {
  const raw = fs.readFileSync(answersPath, "utf8");
  const answers = JSON.parse(raw);
  const grouped = groupQuestions(answers);
  const gallery = collectGalleryImages(answers);
  const finalOutput = injectTemplate(grouped, gallery, position);
  fs.writeFileSync(outputPath, finalOutput, "utf8");
  console.log("✅ Widget generated at:", outputPath);
};
