// 🧱 Create the full-screen overlay that displays the widget content
const overlay = document.createElement("div");
overlay.id = "widget-overlay";
overlay.style.cssText = `
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.8);
  z-index: 10000;
  overflow-y: auto;
`;

// 📦 Inner content container (holds gallery + form data)
const inner = document.createElement("div");
inner.style.cssText = `
  background: white;
  margin: 5% auto;
  padding: 20px;
  width: 90%;
  max-width: 1000px;
  position: relative;
  font-family: Arial, sans-serif;
  color: #000;
`;

// ❌ Close button
const closeButton = document.createElement("button");
closeButton.textContent = "Close";
closeButton.style.cssText = `
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 6px 12px;
  font-size: 14px;
  cursor: pointer;
`;
closeButton.addEventListener("click", () => {
  overlay.style.display = "none";
});
inner.appendChild(closeButton);

// 🖼️ Render image gallery (if any)
if (imageGallery.length > 0) {
  const galleryTitle = document.createElement("h2");
  galleryTitle.textContent = "Image Gallery";
  inner.appendChild(galleryTitle);

  const galleryWrapper = document.createElement("div");
  galleryWrapper.style.cssText = `
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 20px;
  `;

  imageGallery.forEach(({ src, label }) => {
    const wrapper = document.createElement("div");
    wrapper.className = "gallery-item";
    wrapper.style.cssText = "width: 48%; text-align: center;";

    const img = document.createElement("img");
    img.src = src;
    img.style.cssText = "max-width: 300px; max-height: 300px; border: 1px solid #ccc;";

    const caption = document.createElement("div");
    caption.textContent = label;
    caption.style.cssText = "font-size: 0.9em; margin-top: 4px;";

    wrapper.appendChild(img);
    wrapper.appendChild(caption);
    galleryWrapper.appendChild(wrapper);
  });

  inner.appendChild(galleryWrapper);
}

// 📋 Render grouped question/answer/detail table for each section
data.forEach(group => {
  // Headings were removed intentionally to avoid duplicate label rows

  const table = document.createElement("table");
  table.style.cssText = `
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
    font-size: 14px;
  `;

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr style="background:#f0f0f0;">
      <th style="width: 30%; text-align:left; border:1px solid #ccc; padding:5px;">Question</th>
      <th style="width: 20%; text-align:left; border:1px solid #ccc; padding:5px;">Answer</th>
      <th style="width: 50%; text-align:left; border:1px solid #ccc; padding:5px;">Detail</th>
    </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  group.questions.forEach(q => {
    if (q.subheading) {
      // Render subheading row (e.g. Bathroom, Kitchen, etc.)
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 3;
      cell.innerHTML = `<strong>${q.label}</strong>`;
      cell.style.cssText = "border:1px solid #ccc; padding:5px; background:#eef;";
      row.appendChild(cell);
      tbody.appendChild(row);
      return;
    }

    // Render standard Q&A row
    const row = document.createElement("tr");

    const tdLabel = document.createElement("td");
    tdLabel.style.cssText = "border:1px solid #ccc; padding:5px;";
    tdLabel.textContent = q.question;

    const tdAnswer = document.createElement("td");
    tdAnswer.style.cssText = "border:1px solid #ccc; padding:5px;";
    tdAnswer.textContent = q.response;

    const tdDetail = document.createElement("td");
    tdDetail.style.cssText = "border:1px solid #ccc; padding:5px;";
    tdDetail.textContent = q.detail || "";

    row.appendChild(tdLabel);
    row.appendChild(tdAnswer);
    row.appendChild(tdDetail);

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  inner.appendChild(table);
});

overlay.appendChild(inner);

// 📱 Add responsive CSS for mobile (gallery stack layout)
const style = document.createElement("style");
style.textContent = `
  @media (max-width: 600px) {
    #widget-overlay .gallery-item {
      width: 100% !important;
    }
    #widget-overlay .gallery-item img {
      max-width: 100% !important;
      height: auto !important;
    }
  }
`;
document.head.appendChild(style);

// 🧩 Add the full widget to the page
document.body.appendChild(overlay);

// 🔘 Automatically add widget button unless "manual" mode
if (buttonPosition !== "manual") {
  const btn = document.createElement("button");
  btn.id = "open-widget";
  btn.textContent = "Open Accessibility Info";
  btn.style.cssText = `
    position: fixed;
    z-index: 9999;
    padding: 10px 16px;
    font-size: 14px;
    background: #333;
    color: #fff;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    ${buttonPosition === "bottom-left" ? "bottom: 20px; left: 20px;" :
       buttonPosition === "bottom-center" ? "bottom: 20px; left: 50%; transform: translateX(-50%);" :
       "bottom: 20px; right: 20px;"}
  `;
  btn.addEventListener("click", () => {
    overlay.style.display = "block";
  });
  document.body.appendChild(btn);
}

// 🧷 Manual button hook — attach to element with ID 'open-widget' if present
if (buttonPosition === "manual") {
  const btn = document.getElementById("open-widget");
  if (btn) {
    btn.addEventListener("click", () => {
      overlay.style.display = "block";
    });
  }
}
