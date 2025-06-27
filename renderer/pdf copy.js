const fs = require("fs");
const path = require("path");
const os = require("os");
const { BrowserWindow } = require("electron");

function collectAllImages(questions) {
  const images = [];
  let imageCount = 0;
  const maxImages = 24;

  for (const q of questions) {
    if (q.type === "image" && q.imageList?.length > 0) {
      const section = q.group || "General";
      for (const imgPath of q.imageList) {
        if (imageCount >= maxImages) break;
        try {
          const resolvedPath = path.resolve(imgPath);
          const base64 = fs.readFileSync(resolvedPath).toString("base64");
          images.push({
            dataUri: `data:image/jpeg;base64,${base64}`,
            label: section
          });
          imageCount++;
        } catch (err) {
          console.warn("❌ Failed to embed image:", imgPath, err.message);
        }
      }
    }
  }

  return images;
}


function hasContentAfter(index, questions) {
  for (let i = index + 1; i < questions.length; i++) {
    const q = questions[i];
    if (q.isHeading) break;
    if (q.response || q.responseDetail || q.height || q.length) return true;
  }
  return false;
}

function buildAnswerTable(questions) {
  const rows = [];
  let lastGroup = "";

  const filtered = questions.filter(q =>
    q.type !== "image" &&
    (q.response || q.responseDetail || q.height || q.length || q.isHeading)
  );

  for (const q of filtered) {
    if (q.isHeading) {
      const heading = (q.outputLabel || q.question || q.group || "Section").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      rows.push(`<tr><th colspan="3" style="background:#eef; text-align:left;font-weight: bold;">${heading}</th></tr>`);
      continue; // skip normal row rendering
    }

    const label = (q.outputLabel || q.question).replace(/</g, "&lt;").replace(/>/g, "&gt;");
    let answer = "";
    let detail = q.responseDetail || "";

    if (["y/n", "y/n/p", "y/n/t"].includes(q.type)) {
      answer = q.response ? q.response.charAt(0).toUpperCase() + q.response.slice(1) : "";
    } else if (["measure", "number", "option"].includes(q.type)) {
      detail = q.response || "";
    } else {
      answer = q.response || "";
    }

   if (q.type === "gradient") {
  if (q.response === "yes") answer = "Yes";

  if (
    q.height &&
    q.length &&
    !isNaN(parseFloat(q.height)) &&
    !isNaN(parseFloat(q.length))
  ) {
    const ratio = Math.round(parseFloat(q.length) / parseFloat(q.height));
    detail = `1 : ${ratio}`;
  }
}


    rows.push(`
      <tr>
        <td style="width: 30%;">${label}</td>
        <td style="width: 20%;">${answer}</td>
        <td style="width: 50%;">${detail}</td>
      </tr>`);
  }

  return `
    <table border="1" cellspacing="0" cellpadding="5" style="width: 100%; font-size: 10pt;">
      <thead>
        <tr style="background-color: #f0f0f0;">
          <th style="width: 30%;">Question</th>
          <th style="width: 20%;">Answer</th>
          <th style="width: 50%;">Detail</th>
        </tr>
      </thead>
      <tbody>${rows.join("")}</tbody>
    </table>
  `;
}


function buildPaginatedImageGallery(images) {
  let galleryHtml = "";
  let rowCount = 0;

  for (let i = 0; i < images.length; i += 2) {
    if (rowCount > 0 && rowCount % 3 === 0) {
      galleryHtml += `<div style="page-break-before: always;"></div>`;
    }

    const left = images[i]
      ? `<td style="padding:10px; text-align:center;">
          <img src="${images[i].dataUri}" style="max-width:250px; max-height:250px; border:1px solid #ccc;" />
           <div style="font-size:0.9em; margin-top:4px;">${images[i].label}</div>
         </td>`
      : "<td></td>";

    const right = images[i + 1]
      ? `<td style="padding:10px; text-align:center;">
           <img src="${images[i + 1].dataUri}" style="max-width:250px; max-height:250px; border:1px solid #ccc;" />
           <div style="font-size:0.9em; margin-top:4px;">${images[i + 1].label}</div>
         </td>`
      : "<td></td>";

    galleryHtml += `<table style="width:100%; margin-bottom: 10px;"><tr>${left}${right}</tr></table>`;
    rowCount++;
  }

  return galleryHtml;
}

async function generatePdf(questions, outputPath) {
  const images = collectAllImages(questions);
  const imageGalleryHtml = buildPaginatedImageGallery(images);
  const answerTableHtml = buildAnswerTable(questions);

  const fullHtml = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          img { max-width: 100%; height: auto; }
          table { border-collapse: collapse; margin-bottom: 20px; }
          td, th { border: 1px solid #ccc; padding: 6px; }
        </style>
      </head>
      <body>
        <h1>Accessibility Report</h1>
        <h2>Image Gallery (max 24 images shown)</h2>
        ${imageGalleryHtml}
        <h2>Form Responses</h2>
        ${answerTableHtml}
      </body>
    </html>
  `;

  const tempPath = path.join(os.tmpdir(), `accessibility-report-${Date.now()}.html`);
  fs.writeFileSync(tempPath, fullHtml, "utf-8");

  const win = new BrowserWindow({ show: false });
  await win.loadFile(tempPath);
  const pdfBuffer = await win.webContents.printToPDF({});
  fs.writeFileSync(outputPath, pdfBuffer);
  win.destroy();
}

module.exports = { generatePdf };