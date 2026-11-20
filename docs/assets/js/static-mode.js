document.documentElement.dataset.staticMode = "true";

window.initStaticShowcase = function () {
  if (!document.querySelector(".github-pages-note")) {
    const notice = document.createElement("div");
    notice.className = "github-pages-note";
    notice.setAttribute("role", "status");
    notice.textContent = "Sample menu data is in the code; your orders and edits stay in this browser visit only.";
    const announcement = document.querySelector(".announcement-bar, .owner-topline");
    const main = document.querySelector("main");
    if (announcement) announcement.insertAdjacentElement("afterend", notice);
    else if (main) main.before(notice);
  }

  document.querySelectorAll(".owner-topline .container span:last-child").forEach(label => {
    label.textContent = "Sample data · changes last for this browser visit only";
  });

  const accountNote = document.querySelector("#authForm")?.parentElement?.querySelector(".auth-footnote");
  if (accountNote) {
    accountNote.innerHTML = '<i class="bi bi-info-circle"></i> This site does not provide secure accounts. Use only the sample credentials shown here.';
  }

  const ownerNote = document.querySelector("#ownerLoginForm")?.parentElement?.querySelector(".auth-footnote");
  if (ownerNote) {
    ownerNote.innerHTML = '<i class="bi bi-info-circle"></i> This client-side owner login is not secure and does not protect customer data.';
  }

  const contactNote = document.querySelector("#contactUsForm .auth-footnote");
  if (contactNote) contactNote.textContent = "Your note is stored only in this browser and will not reach the shop.";
  const contactSuccess = document.getElementById("contactSuccess");
  if (contactSuccess) contactSuccess.textContent = "Your note has been saved only in this browser.";
};

window.initStaticShowcase();
