document.documentElement.dataset.staticMode = "true";

window.initStaticShowcase = function () {
  if (!document.querySelector(".github-pages-note")) {
    const notice = document.createElement("div");
    notice.className = "github-pages-note";
    notice.setAttribute("role", "status");
    notice.textContent = "Assessment demo · sample data is in the code; orders and edits stay in this browser only.";
    const announcement = document.querySelector(".announcement-bar, .owner-topline");
    const main = document.querySelector("main");
    if (announcement) announcement.insertAdjacentElement("afterend", notice);
    else if (main) main.before(notice);
  }

  document.querySelectorAll(".owner-topline .container span:last-child").forEach(label => {
    label.textContent = "Static demo · fictional data · browser-local changes";
  });

  const accountNote = document.querySelector("#authForm")?.parentElement?.querySelector(".auth-footnote");
  if (accountNote) {
    accountNote.innerHTML = '<i class="bi bi-info-circle"></i> This public demo has no secure accounts. Use only the sample login shown here.';
  }

  const ownerNote = document.querySelector("#ownerLoginForm")?.parentElement?.querySelector(".auth-footnote");
  if (ownerNote) {
    ownerNote.innerHTML = '<i class="bi bi-info-circle"></i> This client-side demo login is not secure and must not protect real customer data.';
  }

  const contactNote = document.querySelector("#contactUsForm .auth-footnote");
  if (contactNote) contactNote.textContent = "This demo saves your note in this browser only; the shop will not receive it.";
  const contactSuccess = document.getElementById("contactSuccess");
  if (contactSuccess) contactSuccess.textContent = "Your demo note is saved in this browser only.";
};

window.initStaticShowcase();
