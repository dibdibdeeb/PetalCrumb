const STORAGE_KEYS = {
  cart: "pc-cart",
  theme: "pc-theme",
  ownerSession: "pc-demo-owner",
  userSession: "pc-demo-customer"
};

let currentUser = document.documentElement.dataset.staticMode === "true"
  ? JSON.parse(sessionStorage.getItem(STORAGE_KEYS.userSession) || "null")
  : null;
let csrfToken = null;

let PRODUCTS = [];
const FEATURED_PRODUCT_IDS = ["chocolate-cloud", "lemon-meringue", "pistachio-croissant"];
const PRODUCT_ORDER = [
  ...FEATURED_PRODUCT_IDS,
  "chocolate-hazelnut",
  "rose-berry-tart",
  "brown-butter-cookie",
  "vanilla-bean-cupcake",
  "peach-shortcake"
];

const money = amount => `RM ${Number(amount).toFixed(2)}`;
const readCart = () => {
  const cart = JSON.parse(localStorage.getItem(STORAGE_KEYS.cart) || "[]");
  return Array.isArray(cart)
    ? cart.filter(item => getProduct(item.id) && Number.isInteger(item.quantity) && item.quantity > 0)
    : [];
};
const readSession = () => currentUser;
const getProduct = id => PRODUCTS.find(product => product.id === id);
const normalizeProduct = product => ({
  id: product.id,
  name: product.name,
  category: product.category,
  categoryLabel: product.category_label,
  description: product.description,
  price: Number(product.price),
  tag: product.tag,
  image: product.image,
  alt: product.image_alt,
  ingredients: product.ingredients,
  allergens: product.allergens,
  active: Boolean(product.active)
});
const sortCatalogProducts = products => products.sort((first, second) => {
  const firstIndex = PRODUCT_ORDER.indexOf(first.id);
  const secondIndex = PRODUCT_ORDER.indexOf(second.id);
  if (firstIndex === -1 && secondIndex === -1) return first.name.localeCompare(second.name);
  if (firstIndex === -1) return 1;
  if (secondIndex === -1) return -1;
  return firstIndex - secondIndex;
});
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
}[character]));

async function apiRequest(url, options = {}) {
  if (document.documentElement.dataset.staticMode === "true") {
    if (typeof window.staticDemoRequest !== "function") {
      throw new Error("The assessment demo is not ready. Please reload the page.");
    }
    return window.staticDemoRequest(url, options);
  }

  const method = options.method || "GET";
  const headers = { Accept: "application/json", ...(options.headers || {}) };
  if (method !== "GET") {
    if (!csrfToken) {
      const tokenResponse = await fetch("/csrf-token", { headers: { Accept: "application/json" }, credentials: "same-origin" });
      if (!tokenResponse.ok) throw new Error("Could not start a secure session. Please reload and try again.");
      csrfToken = (await tokenResponse.json()).token;
    }
    headers["Content-Type"] = "application/json";
    headers["X-CSRF-TOKEN"] = csrfToken;
  }

  const response = await fetch(url, {
    ...options,
    method,
    headers,
    credentials: "same-origin",
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const payload = await response.json();
  if (!response.ok) {
    const validationMessage = payload.errors ? Object.values(payload.errors).flat()[0] : null;
    throw new Error(validationMessage || payload.message || "The request could not be completed.");
  }
  return payload;
}

function showFormError(element, error) {
  if (!element) {
    showToast(error.message);
    return;
  }
  element.textContent = error.message;
  element.classList.remove("d-none");
}

function showToast(message) {
  const toast = document.getElementById("appToast");
  if (!toast || !window.bootstrap) {
    window.alert(message);
    return;
  }
  const text = toast.querySelector("[data-toast-message]");
  text.textContent = message;
  window.bootstrap.Toast.getOrCreateInstance(toast, { delay: 2400 }).show();
}

function updateCartCount() {
  const count = readCart().reduce((total, item) => total + item.quantity, 0);
  document.querySelectorAll("[data-cart-count]").forEach(badge => {
    badge.textContent = count;
    badge.setAttribute("aria-label", `${count} ${count === 1 ? "item" : "items"} in your bag`);
  });
}

function renderProductCard(product) {
  const addButton = `<button class="add-to-bag" type="button" data-add-to-cart="${escapeHtml(product.id)}" aria-label="Add ${escapeHtml(product.name)} to your bag"><i class="bi bi-plus-lg"></i> Add to bag</button>`;

  return `<div class="col-6 col-lg-4">
    <article class="product-card">
      <div class="product-image-wrap">
        <img class="product-image" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.alt)}" loading="lazy">
        <span class="product-tag">${escapeHtml(product.tag)}</span>
      </div>
      <div class="product-info">
        <div class="product-meta"><span>${escapeHtml(product.categoryLabel)}</span></div>
        <h3 class="product-title">${escapeHtml(product.name)}</h3>
        <p class="product-description">${escapeHtml(product.description)}</p>
        <div class="product-footer"><span class="product-price">${money(product.price)}</span>${addButton}</div>
        <button class="ingredients-link" type="button" data-product-details="${escapeHtml(product.id)}"><i class="bi bi-info-circle"></i> Ingredients & allergens</button>
      </div>
    </article>
  </div>`;
}

function addProductDetailsModal() {
  const modal = document.createElement("div");
  modal.innerHTML = `<div class="modal fade" id="productDetailsModal" tabindex="-1" aria-labelledby="productDetailsTitle" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered"><div class="modal-content product-modal-content">
      <div class="modal-header border-0 pb-0"><span class="eyebrow">From our little kitchen</span><button type="button" class="btn-close me-0" data-bs-dismiss="modal" aria-label="Close"></button></div>
      <div class="modal-body pt-2"><h2 class="modal-title" id="productDetailsTitle"></h2><p class="product-modal-description" id="productDetailsDescription"></p>
        <h3>Ingredients</h3><p id="productDetailsIngredients"></p>
        <div class="allergen-note"><i class="bi bi-info-circle"></i><span><strong>Allergen information</strong><br><span id="productDetailsAllergens"></span></span></div>
        <p class="product-modal-disclaimer">Please contact us before ordering if you have an allergy. Our kitchen handles nuts, gluten, dairy, and eggs.</p>
      </div>
      <div class="modal-footer border-0 pt-0"><span class="product-price me-auto" id="productDetailsPrice"></span><button type="button" class="btn btn-cocoa" id="productDetailsAdd">Add to bag <i class="bi bi-plus-lg"></i></button></div>
    </div></div></div>`;
  document.body.append(modal.firstElementChild);
}

function addToCart(productId) {
  const product = getProduct(productId);
  if (!product) return;
  const cart = readCart();
  const existingItem = cart.find(item => item.id === productId);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ id: productId, quantity: 1 });
  }
  localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
  updateCartCount();
  showToast(`${product.name} is in your bag.`);
}

function initTheme() {
  const root = document.documentElement;
  const buttons = document.querySelectorAll("[data-theme-toggle]");

  function updateThemeButton() {
    const darkMode = root.dataset.bsTheme === "dark";
    buttons.forEach(button => {
      button.innerHTML = `<i class="bi ${darkMode ? "bi-sun" : "bi-moon-stars"}"></i>`;
      button.setAttribute("aria-label", `Switch to ${darkMode ? "light" : "dark"} mode`);
    });
  }

  updateThemeButton();
  buttons.forEach(button => button.addEventListener("click", () => {
    const nextTheme = root.dataset.bsTheme === "dark" ? "light" : "dark";
    root.dataset.bsTheme = nextTheme;
    localStorage.setItem(STORAGE_KEYS.theme, nextTheme);
    updateThemeButton();
  }));
}

function initNavigation() {
  const currentPage = document.body.dataset.page;
  document.querySelectorAll("[data-nav]").forEach(link => {
    if (link.dataset.nav === currentPage) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  });

  const accountLink = document.querySelector(".account-link");
  const session = readSession();
  if (accountLink && session) {
    accountLink.href = "dashboard.html";
    accountLink.setAttribute("aria-label", "View your dashboard");
  }
}

function initCatalog() {
  const featuredGrid = document.getElementById("featuredProducts");
  if (featuredGrid || document.getElementById("menuGrid")) addProductDetailsModal();

  if (featuredGrid) {
    featuredGrid.innerHTML = FEATURED_PRODUCT_IDS
      .map(id => getProduct(id))
      .filter(Boolean)
      .map(renderProductCard)
      .join("");
  }

  const menuGrid = document.getElementById("menuGrid");
  if (!menuGrid) return;

  const searchInput = document.getElementById("menuSearch");
  const sortSelect = document.getElementById("menuSort");
  const countLabel = document.getElementById("productCount");
  const emptyState = document.getElementById("emptyMenu");
  const clearButton = document.getElementById("clearFilters");
  const categoryButtons = [...document.querySelectorAll("[data-category]")];
  let activeCategory = "all";

  function renderMenu() {
    const query = searchInput.value.trim().toLowerCase();
    const visibleProducts = PRODUCTS
      .filter(product => activeCategory === "all" || product.category === activeCategory)
      .filter(product => `${product.name} ${product.description} ${product.categoryLabel} ${product.tag} ${product.ingredients.join(" ")}`.toLowerCase().includes(query));

    if (sortSelect.value === "price-low") visibleProducts.sort((a, b) => a.price - b.price);
    if (sortSelect.value === "price-high") visibleProducts.sort((a, b) => b.price - a.price);
    if (sortSelect.value === "name") visibleProducts.sort((a, b) => a.name.localeCompare(b.name));

    menuGrid.innerHTML = visibleProducts.map(renderProductCard).join("");
    countLabel.textContent = `${visibleProducts.length} ${visibleProducts.length === 1 ? "lovely thing" : "lovely things"} on the counter`;
    emptyState.classList.toggle("d-none", visibleProducts.length > 0);
    menuGrid.classList.toggle("d-none", visibleProducts.length === 0);
  }

  searchInput.addEventListener("input", renderMenu);
  sortSelect.addEventListener("change", renderMenu);
  categoryButtons.forEach(button => button.addEventListener("click", () => {
    activeCategory = button.dataset.category;
    categoryButtons.forEach(categoryButton => {
      const isActive = categoryButton === button;
      categoryButton.classList.toggle("active", isActive);
      categoryButton.setAttribute("aria-pressed", String(isActive));
    });
    renderMenu();
  }));
  clearButton.addEventListener("click", () => {
    searchInput.value = "";
    activeCategory = "all";
    sortSelect.value = "featured";
    categoryButtons.forEach(button => {
      const isActive = button.dataset.category === "all";
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    renderMenu();
    searchInput.focus();
  });
  renderMenu();
}

function renderOrderSummary() {
  const itemsContainer = document.getElementById("orderSummaryItems");
  if (!itemsContainer) return;

  const cart = readCart();
  const items = cart.map(item => ({ ...item, product: getProduct(item.id) })).filter(item => item.product);
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => total + item.product.price * item.quantity, 0);
  const emptyMessage = document.getElementById("emptyBagMessage");
  const form = document.getElementById("pickupForm");
  const placeOrderButton = document.getElementById("placeOrder");

  document.querySelectorAll("[data-summary-count]").forEach(element => {
    element.textContent = `(${itemCount})`;
  });
  document.getElementById("orderSubtotal").textContent = money(subtotal);
  emptyMessage.classList.toggle("d-none", items.length > 0);
  itemsContainer.classList.toggle("d-none", items.length === 0);
  placeOrderButton.disabled = items.length === 0;
  itemsContainer.innerHTML = items.map(({ product, quantity }) => `
    <div class="summary-item">
      <img src="${product.image}" alt="" loading="lazy">
      <div><span class="summary-item-name">${product.name}</span><span class="summary-item-meta">${money(product.price)} each</span>
        <div class="summary-quantity">
          <button type="button" class="quantity-button" data-quantity-change="-1" data-product-id="${product.id}" aria-label="Remove one ${product.name}">−</button>
          <span>${quantity}</span>
          <button type="button" class="quantity-button" data-quantity-change="1" data-product-id="${product.id}" aria-label="Add one ${product.name}">+</button>
          <button type="button" class="summary-remove" data-remove-item="${product.id}">Remove</button>
        </div>
      </div>
      <span class="summary-item-price">${money(product.price * quantity)}</span>
    </div>`).join("");

  if (form && !form.dataset.prefilled) {
    const session = readSession();
    if (session) {
      document.getElementById("customerName").value = session.name || "";
      document.getElementById("customerEmail").value = session.email || "";
      form.dataset.prefilled = "true";
    }
  }
}

function initPickup() {
  const form = document.getElementById("pickupForm");
  if (!form) return;

  const dateInput = document.getElementById("pickupDate");
  const placeOrderButton = document.getElementById("placeOrder");
  const today = new Date();
  const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  dateInput.min = localToday;
  dateInput.value = localToday;
  renderOrderSummary();

  document.addEventListener("click", event => {
    const quantityButton = event.target.closest("[data-quantity-change]");
    const removeButton = event.target.closest("[data-remove-item]");
    if (!quantityButton && !removeButton) return;

    const productId = quantityButton?.dataset.productId || removeButton.dataset.removeItem;
    const cart = readCart();
    const item = cart.find(cartItem => cartItem.id === productId);
    if (!item) return;

    if (removeButton) {
      localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart.filter(cartItem => cartItem.id !== productId)));
    } else {
      item.quantity += Number(quantityButton.dataset.quantityChange);
      const updatedCart = cart.filter(cartItem => cartItem.quantity > 0);
      localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(updatedCart));
    }
    updateCartCount();
    renderOrderSummary();
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    form.classList.add("was-validated");
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const cart = readCart();
    if (cart.length === 0) {
      showToast("Add a little something to your bag first.");
      return;
    }

    const formData = new FormData(form);
    placeOrderButton.disabled = true;
    try {
      const order = await apiRequest("/api/orders", {
        method: "POST",
        body: {
          name: formData.get("name").trim(),
          email: formData.get("email").trim().toLowerCase(),
          date: formData.get("date"),
          time: formData.get("time"),
          note: formData.get("note").trim(),
          items: cart
        }
      });
      localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify([]));
      updateCartCount();
      renderOrderSummary();
      form.reset();
      form.classList.remove("was-validated");
      const confirmation = document.getElementById("orderConfirmation");
      document.getElementById("confirmationDetails").textContent = `Order ${order.id} is confirmed for ${order.pickupDate} at ${order.pickupTime}. We’ll see you at 18 Garden Lane.`;
      confirmation.classList.remove("d-none");
      confirmation.scrollIntoView({ behavior: "smooth", block: "center" });
      showToast("Your pickup order is confirmed. See you soon!");
    } catch (error) {
      showToast(error.message);
    } finally {
      placeOrderButton.disabled = readCart().length === 0;
    }
  });
}

function initAuth() {
  const form = document.getElementById("authForm");
  if (!form) return;
  if (currentUser) {
    window.location.replace("dashboard.html");
    return;
  }

  const loginTab = document.getElementById("loginTab");
  const registerTab = document.getElementById("registerTab");
  const nameField = document.getElementById("nameField");
  const heading = document.getElementById("authHeading");
  const intro = document.getElementById("authIntro");
  const submitButton = document.getElementById("authSubmit");
  const message = document.getElementById("authMessage");
  const demoHint = document.getElementById("demoHint");
  let mode = "login";

  function setMode(nextMode) {
    mode = nextMode;
    const registering = mode === "register";
    nameField.classList.toggle("d-none", !registering);
    document.getElementById("accountName").required = registering;
    document.getElementById("accountPassword").setAttribute("autocomplete", registering ? "new-password" : "current-password");
    loginTab.classList.toggle("active", !registering);
    registerTab.classList.toggle("active", registering);
    loginTab.setAttribute("aria-selected", String(!registering));
    registerTab.setAttribute("aria-selected", String(registering));
    heading.innerHTML = registering ? "A little sweetness, <em>starts here.</em>" : "Good to have <em>you back.</em>";
    intro.textContent = registering ? "Create an account to keep your pickup plans in one sweet spot." : "Sign in to see your orders and save a little time next time.";
    submitButton.innerHTML = `${registering ? "Create my account" : "Sign in"} <i class="bi bi-arrow-right"></i>`;
    demoHint.classList.toggle("d-none", registering);
    message.classList.add("d-none");
    form.classList.remove("was-validated");
  }

  loginTab.addEventListener("click", () => setMode("login"));
  registerTab.addEventListener("click", () => setMode("register"));
  document.querySelector("[data-password-toggle]").addEventListener("click", event => {
    const button = event.currentTarget;
    const passwordInput = document.getElementById("accountPassword");
    const showPassword = passwordInput.type === "password";
    passwordInput.type = showPassword ? "text" : "password";
    button.innerHTML = `<i class="bi ${showPassword ? "bi-eye-slash" : "bi-eye"}"></i>`;
    button.setAttribute("aria-label", showPassword ? "Hide password" : "Show password");
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    form.classList.add("was-validated");
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    message.classList.add("d-none");
    try {
      const result = await apiRequest("/api/account", {
        method: "POST",
        body: {
          mode,
          name: document.getElementById("accountName").value.trim(),
          email: document.getElementById("accountEmail").value.trim().toLowerCase(),
          password: document.getElementById("accountPassword").value
        }
      });
      csrfToken = null;
      currentUser = result.user;
      window.location.href = "dashboard.html";
    } catch (error) {
      showFormError(message, error);
    }
  });
}

async function initDashboard() {
  const dashboard = document.getElementById("dashboardContent");
  if (!dashboard) return;

  const session = readSession();
  const gate = document.getElementById("dashboardGate");
  if (!session) {
    dashboard.classList.add("d-none");
    gate.classList.remove("d-none");
    return;
  }

  gate.classList.add("d-none");
  dashboard.classList.remove("d-none");
  document.getElementById("dashboardGreeting").textContent = `A sweeter day, ${session.name.split(" ")[0]}.`;
  document.getElementById("accountDisplayName").textContent = session.name;
  let customerOrders;
  try {
    customerOrders = await apiRequest("/api/account/orders");
  } catch (error) {
    dashboard.classList.add("d-none");
    showFormError(gate, error);
    gate.classList.remove("d-none");
    return;
  }
  const orderCount = customerOrders.length;
  const totalSpent = customerOrders.reduce((total, order) => total + order.total, 0);
  const points = Math.floor(totalSpent);
  const today = new Date().toISOString().slice(0, 10);
  const upcomingOrders = customerOrders.filter(order => order.pickupDate >= today && order.status === "Confirmed");

  document.getElementById("statOrders").textContent = orderCount;
  document.getElementById("statPoints").textContent = points;
  document.getElementById("rewardPoints").textContent = points % 100;
  document.getElementById("rewardProgress").style.width = `${points % 100}%`;
  document.querySelector(".progress").setAttribute("aria-valuenow", String(points % 100));
  document.getElementById("statPickup").textContent = upcomingOrders.length ? upcomingOrders[0].pickupDate : "Nothing planned";
  document.getElementById("statPickupNote").textContent = upcomingOrders.length ? upcomingOrders[0].pickupTime : "A little something to look forward to";

  const historyList = document.getElementById("orderHistoryList");
  const historyEmpty = document.getElementById("orderHistoryEmpty");
  historyEmpty.classList.toggle("d-none", customerOrders.length > 0);
  historyList.innerHTML = customerOrders.map(order => {
    const itemNames = order.items.map(item => `${item.quantity} × ${item.name}`).join(", ");
    const created = new Date(order.createdAt).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
    return `<article class="history-order">
      <div class="history-order-main"><strong>Order ${order.id}</strong><span>${itemNames}</span><span class="history-order-date">Placed ${created} · Pickup ${order.pickupDate}</span></div>
      <span class="history-order-total">${money(order.total)}</span>
      <span class="history-order-status">${order.status}</span>
    </article>`;
  }).join("");

  if (window.Chart) {
    const monthLabels = [];
    const months = [];
    for (let offset = 5; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - offset);
      monthLabels.push(date.toLocaleDateString("en-MY", { month: "short" }));
      months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
    }
    const monthlyOrderCounts = months.map(month => customerOrders.filter(order => order.createdAt.slice(0, 7) === month).length);
    const hasOrders = orderCount > 0;
    const chartData = hasOrders ? monthlyOrderCounts : [2, 3, 1, 4, 2, 3];
    document.getElementById("chartBadge").textContent = hasOrders ? "Your order history" : "Sample activity";
    document.getElementById("chartDescription").textContent = hasOrders
      ? "Your pickup orders, grouped by the month you placed them."
      : "A sample of monthly orders. Your own activity will appear here after checkout.";
    new Chart(document.getElementById("ordersChart"), {
      type: "bar",
      data: {
        labels: monthLabels,
        datasets: [{
          label: hasOrders ? "Your orders" : "Sample orders",
          data: chartData,
          backgroundColor: "rgba(215, 160, 154, .68)",
          hoverBackgroundColor: "#c7847e",
          borderRadius: 4,
          maxBarThickness: 30
        }]
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { displayColors: false, callbacks: { label: context => `${context.parsed.y} ${context.parsed.y === 1 ? "order" : "orders"}` } }
        },
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: { color: "#8b7972", font: { family: "DM Sans", size: 9 } } },
          y: { beginAtZero: true, suggestedMax: 5, ticks: { stepSize: 1, precision: 0, color: "#8b7972", font: { family: "DM Sans", size: 9 } }, grid: { color: "rgba(139, 121, 114, .14)" }, border: { display: false } }
        }
      }
    });
  }

  document.getElementById("signOutButton").addEventListener("click", () => {
    apiRequest("/api/logout", { method: "POST" })
      .then(() => { currentUser = null; window.location.href = "index.html"; })
      .catch(error => showToast(error.message));
  });
}

function getOwnerCustomerRows() {
  return OWNER_CUSTOMERS.map(customer => {
    const orders = OWNER_ORDERS.filter(order => order.customerId === customer.id);
    const lastOrder = orders.reduce((latest, order) => order.date > latest ? order.date : latest, "");
    return {
      ...customer,
      orderCount: orders.length,
      spend: orders.reduce((total, order) => total + order.total, 0),
      lastOrder
    };
  });
}

function getOwnerProductRows() {
  const products = new Map();
  OWNER_ORDERS.forEach(order => {
    const product = getProduct(order.productId);
    if (!product) return;
    const current = products.get(product.id) || { ...product, quantity: 0, sales: 0 };
    current.quantity += order.quantity;
    current.sales += order.total;
    products.set(product.id, current);
  });
  return [...products.values()].sort((a, b) => b.quantity - a.quantity);
}

function formatOwnerDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
}

function initOwnerLoginLegacy() {
  const form = document.getElementById("ownerLoginForm");
  if (!form) return;

  if (sessionStorage.getItem(STORAGE_KEYS.ownerSession)) {
    window.location.replace("owner-dashboard.html");
    return;
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    form.classList.add("was-validated");
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const email = document.getElementById("ownerEmail").value.trim().toLowerCase();
    const password = document.getElementById("ownerPassword").value;
    const message = document.getElementById("ownerLoginMessage");
    if (email !== "owner@petalandcrumb.example" || password !== "littlecrumbs26") {
      message.textContent = "Those owner details don’t match. Please try the sample credentials below.";
      message.classList.remove("d-none");
      document.getElementById("ownerPassword").focus();
      return;
    }

    sessionStorage.setItem(STORAGE_KEYS.ownerSession, JSON.stringify({
      name: "Petal & Crumb Owner",
      email,
      role: "owner"
    }));
    window.location.href = "owner-dashboard.html";
  });
}

function initOwnerPortalLegacy() {
  const portal = document.getElementById("ownerPortal");
  if (!portal) return;

  const owner = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.ownerSession) || "null");
  if (!owner || owner.role !== "owner") {
    window.location.replace("owner-login.html");
    return;
  }

  portal.classList.remove("d-none");
  document.querySelectorAll("[data-owner-name]").forEach(name => {
    name.textContent = owner.name;
  });
  document.querySelectorAll("[data-owner-sign-out]").forEach(button => {
    button.addEventListener("click", () => {
      sessionStorage.removeItem(STORAGE_KEYS.ownerSession);
      window.location.href = "owner-login.html";
    });
  });

  const customerRows = getOwnerCustomerRows();
  const totalRevenue = OWNER_ORDERS.reduce((total, order) => total + order.total, 0);
  const repeatCustomerCount = customerRows.filter(customer => customer.orderCount > 1).length;
  const monthlySales = OWNER_MONTHS.map(month => OWNER_ORDERS
    .filter(order => order.date.startsWith(month.key))
    .reduce((total, order) => total + order.total, 0));
  const monthlyOrders = OWNER_MONTHS.map(month => OWNER_ORDERS
    .filter(order => order.date.startsWith(month.key)).length);
  const productRows = getOwnerProductRows();

  if (document.body.dataset.ownerPage === "overview") {
    document.getElementById("ownerCustomerCount").textContent = customerRows.length;
    document.getElementById("ownerOrderCount").textContent = OWNER_ORDERS.length;
    document.getElementById("ownerRevenue").textContent = money(totalRevenue);
    document.getElementById("ownerRepeatCount").textContent = repeatCustomerCount;

    document.getElementById("ownerTopProducts").innerHTML = productRows.slice(0, 4).map((product, index) => `
      <tr><td><span class="rank-pill">${index + 1}</span>${product.name}</td><td>${product.quantity}</td><td>${money(product.sales)}</td></tr>
    `).join("");
    document.getElementById("ownerRecentOrders").innerHTML = [...OWNER_ORDERS].slice(-5).reverse().map(order => {
      const customer = OWNER_CUSTOMERS.find(item => item.id === order.customerId);
      const product = getProduct(order.productId);
      return `<tr><td>${order.id}</td><td>${customer.name}</td><td>${product.name}</td><td>${formatOwnerDate(order.date)}</td><td>${money(order.total)}</td><td><span class="owner-status">${order.status}</span></td></tr>`;
    }).join("");

    if (window.Chart) {
      new Chart(document.getElementById("ownerSalesChart"), {
        type: "bar",
        data: {
          labels: OWNER_MONTHS.map(month => month.label),
          datasets: [{
            label: "Sales",
            data: monthlySales,
            backgroundColor: "rgba(215, 160, 154, .7)",
            hoverBackgroundColor: "#c7847e",
            borderRadius: 4,
            maxBarThickness: 34
          }]
        },
        options: {
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: context => `Sales: ${money(context.parsed.y)}` } }
          },
          scales: {
            x: { grid: { display: false }, border: { display: false }, ticks: { color: "#8b7972" } },
            y: { beginAtZero: true, grid: { color: "rgba(139, 121, 114, .14)" }, ticks: { color: "#8b7972", callback: value => `RM ${value}` } }
          }
        }
      });
    }
  }

  if (document.body.dataset.ownerPage === "customers") {
    const tableBody = document.getElementById("ownerCustomersTableBody");
    const searchInput = document.getElementById("ownerCustomerSearch");
    const segmentFilter = document.getElementById("ownerSegmentFilter");
    const resultCount = document.getElementById("ownerCustomerCountLabel");

    function renderCustomers() {
      const query = searchInput.value.trim().toLowerCase();
      const segment = segmentFilter.value;
      const filtered = customerRows.filter(customer => {
        const matchesSearch = `${customer.name} ${customer.email} ${customer.id} ${customer.favourite}`.toLowerCase().includes(query);
        const matchesSegment = segment === "all" || customer.segment.toLowerCase() === segment;
        return matchesSearch && matchesSegment;
      });
      tableBody.innerHTML = filtered.map(customer => `
        <tr><td><span class="customer-name">${customer.name}</span><small>${customer.id}</small></td>
          <td><a href="mailto:${customer.email}">${customer.email}</a></td><td>${customer.orderCount}</td>
          <td>${money(customer.spend)}</td><td>${customer.favourite}</td><td>${formatOwnerDate(customer.lastOrder)}</td>
          <td><span class="segment-badge segment-${customer.segment.toLowerCase()}">${customer.segment}</span></td></tr>
      `).join("");
      resultCount.textContent = `${filtered.length} ${filtered.length === 1 ? "customer" : "customers"}`;
      document.getElementById("ownerCustomersEmpty").classList.toggle("d-none", filtered.length > 0);
    }

    searchInput.addEventListener("input", renderCustomers);
    segmentFilter.addEventListener("change", renderCustomers);
    renderCustomers();
  }

  if (document.body.dataset.ownerPage === "analytics" && window.Chart) {
    document.getElementById("analyticsRevenue").textContent = money(totalRevenue);
    document.getElementById("analyticsAverage").textContent = money(totalRevenue / OWNER_ORDERS.length);
    document.getElementById("analyticsRepeatRate").textContent = `${Math.round(repeatCustomerCount / customerRows.length * 100)}%`;

    new Chart(document.getElementById("salesTrendChart"), {
      type: "line",
      data: {
        labels: OWNER_MONTHS.map(month => month.label),
        datasets: [{
          label: "Sales",
          data: monthlySales,
          borderColor: "#b87973",
          backgroundColor: "rgba(215, 160, 154, .2)",
          fill: true,
          tension: .35,
          pointRadius: 4,
          pointBackgroundColor: "#b87973"
        }]
      },
      options: {
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => `Sales: ${money(context.parsed.y)}` } } },
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: { color: "#8b7972" } },
          y: { beginAtZero: true, grid: { color: "rgba(139, 121, 114, .14)" }, ticks: { color: "#8b7972", callback: value => `RM ${value}` } }
        }
      }
    });

    new Chart(document.getElementById("orderVolumeChart"), {
      type: "bar",
      data: {
        labels: OWNER_MONTHS.map(month => month.label),
        datasets: [{
          label: "Orders",
          data: monthlyOrders,
          backgroundColor: "rgba(149, 165, 138, .78)",
          borderRadius: 4,
          maxBarThickness: 30
        }]
      },
      options: {
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => `${context.parsed.y} orders` } } },
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: { color: "#8b7972" } },
          y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0, color: "#8b7972" }, grid: { color: "rgba(139, 121, 114, .14)" } }
        }
      }
    });

    const categoryTotals = ["cakes", "tarts", "little-bakes", "seasonal"].map(category => OWNER_ORDERS
      .filter(order => getProduct(order.productId).category === category)
      .reduce((total, order) => total + order.total, 0));
    new Chart(document.getElementById("productMixChart"), {
      type: "doughnut",
      data: {
        labels: ["Cakes", "Tarts & slices", "Little bakes", "Seasonal"],
        datasets: [{
          data: categoryTotals,
          backgroundColor: ["#c8877f", "#d9b795", "#97a68d", "#b89aa7"],
          borderColor: "transparent",
          hoverOffset: 5
        }]
      },
      options: {
        maintainAspectRatio: false,
        cutout: "65%",
        plugins: {
          legend: { position: "bottom", labels: { color: "#8b7972", usePointStyle: true, boxWidth: 7, padding: 16, font: { size: 9 } } },
          tooltip: { callbacks: { label: context => `${context.label}: ${money(context.parsed)}` } }
        }
      }
    });

    document.getElementById("monthlySummaryBody").innerHTML = OWNER_MONTHS.map((month, index) => `
      <tr><td>${month.label} 2026</td><td>${monthlyOrders[index]}</td><td>${money(monthlySales[index])}</td><td>${money(monthlyOrders[index] ? monthlySales[index] / monthlyOrders[index] : 0)}</td></tr>
    `).join("");
  }
}

function initContactForm() {
  const form = document.getElementById("contactUsForm");
  if (!form) return;
  form.addEventListener("submit", async event => {
    event.preventDefault();
    form.classList.add("was-validated");
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    try {
      await apiRequest("/api/contact", {
        method: "POST",
        body: {
          name: form.elements.name.value.trim(),
          email: form.elements.email.value.trim(),
          message: form.elements.message.value.trim()
        }
      });
      form.reset();
      form.classList.remove("was-validated");
      document.getElementById("contactSuccess").classList.remove("d-none");
    } catch (error) {
      showToast(error.message);
    }
  });
}

function initOwnerLogin() {
  const form = document.getElementById("ownerLoginForm");
  if (!form) return;

  apiRequest("/api/owner/status").then(status => {
    if (status.authenticated) window.location.replace("owner-dashboard.html");
  }).catch(error => showFormError(document.getElementById("ownerLoginMessage"), error));

  form.addEventListener("submit", async event => {
    event.preventDefault();
    form.classList.add("was-validated");
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const message = document.getElementById("ownerLoginMessage");
    message.classList.add("d-none");
    try {
      await apiRequest("/api/owner/login", {
        method: "POST",
        body: {
          email: document.getElementById("ownerEmail").value.trim().toLowerCase(),
          password: document.getElementById("ownerPassword").value
        }
      });
      csrfToken = null;
      window.location.href = "owner-dashboard.html";
    } catch (error) {
      showFormError(message, error);
      document.getElementById("ownerPassword").focus();
    }
  });
}

async function initOwnerProducts() {
  const searchInput = document.getElementById("ownerProductSearch");
  const categoryFilter = document.getElementById("ownerProductCategory");
  const statusFilter = document.getElementById("ownerProductStatus");
  const tableBody = document.getElementById("ownerProductsTableBody");
  const countLabel = document.getElementById("ownerProductCountLabel");
  const emptyState = document.getElementById("ownerProductsEmpty");
  const pageError = document.getElementById("ownerProductsError");
  const form = document.getElementById("ownerProductForm");
  const formError = document.getElementById("ownerProductFormError");
  const modalElement = document.getElementById("ownerProductModal");
  const modal = window.bootstrap.Modal.getOrCreateInstance(modalElement);
  let products = [];

  function renderProducts() {
    const query = searchInput.value.trim().toLowerCase();
    const filtered = products.filter(product => {
      const searchable = `${product.name} ${product.categoryLabel} ${product.description} ${product.tag} ${product.ingredients.join(" ")}`.toLowerCase();
      const matchesStatus = statusFilter.value === "all"
        || (statusFilter.value === "active" && product.active)
        || (statusFilter.value === "removed" && !product.active);

      return searchable.includes(query)
        && (categoryFilter.value === "all" || product.category === categoryFilter.value)
        && matchesStatus;
    });

    tableBody.innerHTML = filtered.map(product => `
      <tr>
        <td><span class="owner-product-name">${escapeHtml(product.name)}</span><small>${escapeHtml(product.tag)}</small></td>
        <td>${escapeHtml(product.categoryLabel)}</td>
        <td>${money(product.price)}</td>
        <td>${product.ingredients.length}</td>
        <td><span class="owner-status ${product.active ? "" : "owner-status-inactive"}">${product.active ? "On menu" : "Removed"}</span></td>
        <td class="owner-product-actions">
          <button class="btn btn-sm btn-outline-cocoa" type="button" data-edit-product="${escapeHtml(product.id)}">Edit</button>
          ${product.active ? `<button class="btn btn-sm btn-outline-danger" type="button" data-delete-product="${escapeHtml(product.id)}">Delete</button>` : ""}
        </td>
      </tr>
    `).join("");
    countLabel.textContent = `${filtered.length} ${filtered.length === 1 ? "product" : "products"}`;
    emptyState.classList.toggle("d-none", filtered.length > 0);
    emptyState.textContent = products.length
      ? "No products match your search or filters."
      : "No menu products yet. Add one to get started.";
  }

  async function loadProducts() {
    try {
      products = (await apiRequest("/api/owner/products")).map(normalizeProduct);
      pageError.classList.add("d-none");
      renderProducts();
      return true;
    } catch (error) {
      showFormError(pageError, error);
      return false;
    }
  }

  function openProductForm(product = null) {
    form.reset();
    form.classList.remove("was-validated");
    formError.classList.add("d-none");
    form.dataset.productId = product ? product.id : "";
    document.getElementById("ownerProductModalTitle").textContent = product ? "Edit menu product" : "Add a menu product";
    form.elements.name.value = product?.name || "";
    form.elements.category.value = product?.category || "cakes";
    form.elements.description.value = product?.description || "";
    form.elements.price.value = product?.price ?? "";
    form.elements.tag.value = product?.tag || "";
    form.elements.image.value = product?.image || "";
    form.elements.image_alt.value = product?.alt || "";
    form.elements.ingredients.value = product?.ingredients.join("\n") || "";
    form.elements.allergens.value = product?.allergens || "";
    form.elements.active.checked = product ? product.active : true;
    modal.show();
  }

  searchInput.addEventListener("input", renderProducts);
  categoryFilter.addEventListener("change", renderProducts);
  statusFilter.addEventListener("change", renderProducts);
  document.getElementById("addOwnerProduct").addEventListener("click", () => openProductForm());

  tableBody.addEventListener("click", async event => {
    const editButton = event.target.closest("[data-edit-product]");
    if (editButton) {
      const product = products.find(item => item.id === editButton.dataset.editProduct);
      if (product) openProductForm(product);
      return;
    }

    const deleteButton = event.target.closest("[data-delete-product]");
    if (!deleteButton) return;
    const product = products.find(item => item.id === deleteButton.dataset.deleteProduct);
    if (!product || !window.confirm(`Remove ${product.name} from the customer menu? Previous order records will be preserved.`)) return;

    try {
      await apiRequest(`/api/owner/products/${encodeURIComponent(product.id)}`, { method: "DELETE" });
      await loadProducts();
      showToast(`${product.name} was removed from the menu.`);
    } catch (error) {
      showToast(error.message);
    }
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    form.classList.add("was-validated");
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const ingredients = form.elements.ingredients.value.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
    const productData = {
      name: form.elements.name.value.trim(),
      category: form.elements.category.value,
      description: form.elements.description.value.trim(),
      price: form.elements.price.value,
      tag: form.elements.tag.value.trim(),
      image: form.elements.image.value.trim(),
      image_alt: form.elements.image_alt.value.trim(),
      ingredients,
      allergens: form.elements.allergens.value.trim(),
      active: form.elements.active.checked
    };
    const productId = form.dataset.productId;

    try {
      await apiRequest(productId ? `/api/owner/products/${encodeURIComponent(productId)}` : "/api/owner/products", {
        method: productId ? "PUT" : "POST",
        body: productData
      });
      if (await loadProducts()) {
        modal.hide();
        showToast(productId ? "Menu product updated." : "Menu product added.");
      }
    } catch (error) {
      showFormError(formError, error);
    }
  });

  await loadProducts();
}

async function initOwnerPortal() {
  const portal = document.getElementById("ownerPortal");
  if (!portal) return;

  let data;
  try {
    data = await apiRequest("/api/owner/data");
  } catch (error) {
    if (error.message.includes("Owner access")) {
      window.location.replace("owner-login.html");
      return;
    }
    const intro = document.querySelector(".owner-heading p");
    if (intro) intro.textContent = error.message;
    portal.classList.remove("d-none");
    return;
  }

  portal.classList.remove("d-none");
  document.querySelectorAll("[data-owner-name]").forEach(name => {
    name.textContent = data.owner.name;
  });
  document.querySelectorAll("[data-owner-sign-out]").forEach(button => {
    button.addEventListener("click", async () => {
      try {
        await apiRequest("/api/owner/logout", { method: "POST" });
        window.location.href = "owner-login.html";
      } catch (error) {
        showToast(error.message);
      }
    });
  });

  if (document.body.dataset.ownerPage === "products") {
    await initOwnerProducts();
    return;
  }

  const customers = data.customers;
  const orders = data.orders;
  const products = [...data.products].sort((a, b) => b.quantity - a.quantity);
  const months = data.months;
  const totalRevenue = orders.reduce((total, order) => total + Number(order.total), 0);
  const repeatCount = customers.filter(customer => customer.orderCount > 1).length;
  const monthlySales = months.map(month => Number(month.sales));
  const monthlyOrders = months.map(month => Number(month.orders));
  const chartMonths = months.map(month => month.label);

  if (document.body.dataset.ownerPage === "overview") {
    document.getElementById("ownerCustomerCount").textContent = customers.length;
    document.getElementById("ownerOrderCount").textContent = orders.length;
    document.getElementById("ownerRevenue").textContent = money(totalRevenue);
    document.getElementById("ownerRepeatCount").textContent = repeatCount;
    document.getElementById("ownerTopProducts").innerHTML = products.slice(0, 4).map((product, index) => `
      <tr><td><span class="rank-pill">${index + 1}</span>${escapeHtml(product.name)}</td><td>${product.quantity}</td><td>${money(product.sales)}</td></tr>
    `).join("");
    document.getElementById("ownerRecentOrders").innerHTML = [...orders].slice(-5).reverse().map(order => `
      <tr><td>${escapeHtml(order.id)}</td><td>${escapeHtml(order.customer)}</td><td>${escapeHtml(order.product)}</td><td>${formatOwnerDate(order.date)}</td><td>${money(order.total)}</td><td><span class="owner-status">${escapeHtml(order.status)}</span></td></tr>
    `).join("");
    if (window.Chart) {
      new Chart(document.getElementById("ownerSalesChart"), {
        type: "bar",
        data: { labels: chartMonths, datasets: [{ label: "Sales", data: monthlySales, backgroundColor: "rgba(215, 160, 154, .7)", hoverBackgroundColor: "#c7847e", borderRadius: 4, maxBarThickness: 34 }] },
        options: {
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => `Sales: ${money(context.parsed.y)}` } } },
          scales: {
            x: { grid: { display: false }, border: { display: false }, ticks: { color: "#8b7972" } },
            y: { beginAtZero: true, grid: { color: "rgba(139, 121, 114, .14)" }, ticks: { color: "#8b7972", callback: value => `RM ${value}` } }
          }
        }
      });
    }
  }

  if (document.body.dataset.ownerPage === "customers") {
    const tableBody = document.getElementById("ownerCustomersTableBody");
    const searchInput = document.getElementById("ownerCustomerSearch");
    const segmentFilter = document.getElementById("ownerSegmentFilter");
    const resultCount = document.getElementById("ownerCustomerCountLabel");
    const renderCustomers = () => {
      const query = searchInput.value.trim().toLowerCase();
      const segment = segmentFilter.value;
      const filtered = customers.filter(customer => {
        const content = `${customer.name} ${customer.email} ${customer.id} ${customer.favourite}`.toLowerCase();
        return content.includes(query) && (segment === "all" || customer.segment.toLowerCase() === segment);
      });
      tableBody.innerHTML = filtered.map(customer => `
        <tr><td><span class="customer-name">${escapeHtml(customer.name)}</span><small>${escapeHtml(customer.id)}</small></td>
          <td><a href="mailto:${encodeURIComponent(customer.email)}">${escapeHtml(customer.email)}</a></td><td>${customer.orderCount}</td>
          <td>${money(customer.spend)}</td><td>${escapeHtml(customer.favourite)}</td><td>${customer.lastOrder ? formatOwnerDate(customer.lastOrder) : "—"}</td>
          <td><span class="segment-badge segment-${escapeHtml(customer.segment.toLowerCase())}">${escapeHtml(customer.segment)}</span></td></tr>
      `).join("");
      resultCount.textContent = `${filtered.length} ${filtered.length === 1 ? "customer" : "customers"}`;
      document.getElementById("ownerCustomersEmpty").classList.toggle("d-none", filtered.length > 0);
    };
    searchInput.addEventListener("input", renderCustomers);
    segmentFilter.addEventListener("change", renderCustomers);
    renderCustomers();
  }

  if (document.body.dataset.ownerPage === "analytics" && window.Chart) {
    document.getElementById("analyticsRevenue").textContent = money(totalRevenue);
    document.getElementById("analyticsAverage").textContent = money(orders.length ? totalRevenue / orders.length : 0);
    document.getElementById("analyticsRepeatRate").textContent = `${customers.length ? Math.round(repeatCount / customers.length * 100) : 0}%`;
    const chartOptions = {
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => `Sales: ${money(context.parsed.y)}` } } },
      scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { color: "#8b7972" } },
        y: { beginAtZero: true, grid: { color: "rgba(139, 121, 114, .14)" }, ticks: { color: "#8b7972", callback: value => `RM ${value}` } }
      }
    };
    new Chart(document.getElementById("salesTrendChart"), {
      type: "line",
      data: { labels: chartMonths, datasets: [{ label: "Sales", data: monthlySales, borderColor: "#b87973", backgroundColor: "rgba(215, 160, 154, .2)", fill: true, tension: .35, pointRadius: 4, pointBackgroundColor: "#b87973" }] },
      options: chartOptions
    });
    new Chart(document.getElementById("orderVolumeChart"), {
      type: "bar",
      data: { labels: chartMonths, datasets: [{ label: "Orders", data: monthlyOrders, backgroundColor: "rgba(149, 165, 138, .78)", borderRadius: 4, maxBarThickness: 30 }] },
      options: {
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => `${context.parsed.y} orders` } } },
        scales: { x: { ...chartOptions.scales.x, offset: true }, y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0, color: "#8b7972" }, grid: { color: "rgba(139, 121, 114, .14)" } } }
      }
    });
    const categories = ["cakes", "tarts", "little-bakes", "seasonal"];
    const categoryLabels = ["Cakes", "Tarts & slices", "Little bakes", "Seasonal"];
    const categoryTotals = categories.map(category => products
      .filter(product => product.category === category)
      .reduce((total, product) => total + Number(product.sales), 0));
    new Chart(document.getElementById("productMixChart"), {
      type: "doughnut",
      data: { labels: categoryLabels, datasets: [{ data: categoryTotals, backgroundColor: ["#c8877f", "#d9b795", "#97a68d", "#b89aa7"], borderColor: "transparent", hoverOffset: 5 }] },
      options: {
        maintainAspectRatio: false, cutout: "65%",
        plugins: {
          legend: { position: "bottom", labels: { color: "#8b7972", usePointStyle: true, boxWidth: 7, padding: 16, font: { size: 9 } } },
          tooltip: { callbacks: { label: context => `${context.label}: ${money(context.parsed)}` } }
        }
      }
    });
    document.getElementById("monthlySummaryBody").innerHTML = months.map(month => `
      <tr><td>${escapeHtml(month.label)} ${escapeHtml(month.key.slice(0, 4))}</td><td>${month.orders}</td><td>${money(month.sales)}</td><td>${money(month.orders ? month.sales / month.orders : 0)}</td></tr>
    `).join("");
  }
}

document.addEventListener("click", event => {
  const addButton = event.target.closest("[data-add-to-cart]");
  if (addButton) {
    addToCart(addButton.dataset.addToCart);
    return;
  }

  const detailsButton = event.target.closest("[data-product-details]");
  if (detailsButton) {
    const product = getProduct(detailsButton.dataset.productDetails);
    if (!product) return;
    document.getElementById("productDetailsTitle").textContent = product.name;
    document.getElementById("productDetailsDescription").textContent = product.description;
    document.getElementById("productDetailsIngredients").textContent = product.ingredients.join(", ");
    document.getElementById("productDetailsAllergens").textContent = product.allergens;
    document.getElementById("productDetailsPrice").textContent = money(product.price);
    document.getElementById("productDetailsAdd").dataset.addToCart = product.id;
    window.bootstrap.Modal.getOrCreateInstance(document.getElementById("productDetailsModal")).show();
  }
});

document.querySelectorAll("[data-year]").forEach(year => {
  year.textContent = new Date().getFullYear();
});

function initSessionApp() {
  initNavigation();
  initAuth();
  initDashboard();
  initOwnerLogin();
  initOwnerPortal();
}

async function startApp() {
  initTheme();

  if (document.documentElement.dataset.staticMode === "true") {
    PRODUCTS = sortCatalogProducts(window.staticDemoProducts().map(normalizeProduct));
    updateCartCount();
    initCatalog();
    initPickup();
    initContactForm();
    initSessionApp();
    if (window.initStaticShowcase) window.initStaticShowcase();
    return;
  }

  initPickup();
  initContactForm();

  try {
    const products = await apiRequest("/api/products");
    PRODUCTS = sortCatalogProducts(products.map(normalizeProduct));
    updateCartCount();
  } catch (error) {
    showToast(`The menu could not be loaded: ${error.message}`);
  }
  initCatalog();

  try {
    const account = await apiRequest("/api/account");
    currentUser = account.user;
    initSessionApp();
    if (document.getElementById("pickupForm")) renderOrderSummary();
  } catch (error) {
    showToast(error.message);
    initSessionApp();
  }
}

startApp();
updateCartCount();
