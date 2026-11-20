document.documentElement.dataset.staticMode = "true";

window.initStaticShowcase = function () {
  const notice = document.querySelector(".github-pages-note");
  if (!notice) {
    const message = document.createElement("div");
    message.className = "github-pages-note";
    message.setAttribute("role", "status");
    message.textContent = "Public view-only showcase. Online ordering, accounts, and owner tools are not enabled here.";
    const announcement = document.querySelector(".announcement-bar");
    const main = document.querySelector("main");
    if (announcement) announcement.insertAdjacentElement("afterend", message);
    else if (main) main.prepend(message);
  }

  document.querySelectorAll('a[data-nav="pickup"]').forEach(link => link.closest(".nav-item")?.remove());
  document.querySelectorAll('a[href="preorder.html"]').forEach(link => {
    link.href = "menu.html";
    link.innerHTML = 'Browse the menu <i class="bi bi-arrow-up-right" aria-hidden="true"></i>';
  });
  document.querySelectorAll('a[href="login.html"], a[href="dashboard.html"], a[href="owner-login.html"], .bag-button').forEach(link => link.remove());
  document.querySelectorAll("[data-add-to-cart]").forEach(button => {
    button.disabled = true;
    button.classList.add("view-only-button");
    button.textContent = "View only";
    button.removeAttribute("aria-label");
  });

  const modalAddButton = document.getElementById("productDetailsAdd");
  if (modalAddButton) {
    modalAddButton.disabled = true;
    modalAddButton.textContent = "View only";
  }

  const contactForm = document.getElementById("contactUsForm");
  if (contactForm) {
    contactForm.addEventListener("submit", event => event.preventDefault());
    contactForm.querySelectorAll("input, textarea, button").forEach(control => {
      control.disabled = true;
    });
    const note = contactForm.querySelector(".auth-footnote");
    if (note) note.textContent = "This public showcase does not send messages. Please use the bakery's contact details instead.";
  }
};

window.initStaticShowcase();
