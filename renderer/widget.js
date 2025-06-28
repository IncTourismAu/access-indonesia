const fs = require("fs");
const path = require("path");

/**
 * 🖼 Convert a local image file to base64 for embedding
 */
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

/**
 * 📋 Group questions by their section (`group` field) for widget output
 * - Skips image-type questions
 * - Filters out questions with no answer unless they're headings
 * - Detects and skips duplicate group headings
 * - Adds subheadings where relevant, only if followed by meaningful data
 */
function groupQuestions(questions) {
  const grouped = new Map();

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (q.type === "image") continue;

    const hasResponse = q.response || q.responseDetail || q.height || q.length;
    if (!hasResponse && !q.isHeading) continue;

    const heading = q.group || "General";
    const group = grouped.get(heading) || { questions: [] };

    if (q.isHeading) {
      // 🔍 Look ahead for actual content under this subheading
      let hasDataBelow = false;
      for (let j = i + 1; j < questions.length; j++) {
        const nextQ = questions[j];
        if (nextQ.isHeading || nextQ.group !== q.group) break;
        if (nextQ.response || nextQ.responseDetail || nextQ.height || nextQ.length) {
          hasDataBelow = true;
          break;
        }
      }
      if (!hasDataBelow) continue;

      group.questions.push({
        subheading: true,
        label: q.outputLabel || q.question
      });
    } else {
      // ❌ Skip questions where the label matches the group title (redundant)
      if ((q.outputLabel || q.question)?.trim().toLowerCase() === heading.trim().toLowerCase()) continue;

      let answer = "";
      let detail = q.responseDetail || "";

      // 🧠 Format simple Y/N answers with capital
      if (["y/n", "y/n/p", "y/n/t"].includes(q.type)) {
        answer = q.response ? q.response.charAt(0).toUpperCase() + q.response.slice(1) : "";
      }

      // 📐 Place numerical/measured inputs into detail field
      if (["measure", "number", "option"].includes(q.type)) {
        detail = q.response || "";
        answer = "";
      }

      // ➗ Handle ramp gradient calculation (Height + Length)
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
          const ratio = Math.round(l / h);
          detail = `1 : ${ratio}`;
        }
      }

      group.questions.push({
        question: q.outputLabel || q.question,
        response: answer,
        detail: detail
      });
    }

    grouped.set(heading, group);
  }

  // 🧼 Filter out any groups with only subheadings and no content
  return Array.from(grouped.entries())
    .filter(([, { questions }]) => questions.some(q => !q.subheading || (q.subheading && q.label)))
    .map(([heading, { questions }]) => ({
      heading,
      questions
    }));
}

/**
 * 🖼 Build image gallery array (base64 + section label)
 */
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

/**
 * 🧩 Inject grouped data and image gallery into widget.template.js
 */
function injectTemplate(grouped, imageGallery, position) {
  const template = fs.readFileSync(path.join(__dirname, "widget.template.js"), "utf8");
  return `(function() {
    const data = ${JSON.stringify(grouped, null, 2)};
    const imageGallery = ${JSON.stringify(imageGallery, null, 2)};
    const buttonPosition = "${position}";
    ${template}
  })();`;
}

/**
 * 🛠 Main function to generate widget.js for embedding
 * - Reads saved answers
 * - Groups questions and prepares images
 * - Injects into template and writes to output path
 */
module.exports = async function generateWidget(answersPath, outputPath, position = "bottom-left") {
  const raw = fs.readFileSync(answersPath, "utf8");
  const answers = JSON.parse(raw);
  const grouped = groupQuestions(answers);
  const gallery = collectGalleryImages(answers);
  const finalOutput = injectTemplate(grouped, gallery, position);
  fs.writeFileSync(outputPath, finalOutput, "utf8");
  console.log("✅ Widget generated at:", outputPath);
};
