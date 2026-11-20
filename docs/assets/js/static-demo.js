// Emulate the small set of shop APIs used by the static assessment prototype.
(() => {
  const data = window.PETAL_CRUMB_DEMO_DATA;
  const keys = {
    owner: "pc-demo-owner",
    customer: "pc-demo-customer",
    products: "pc-demo-products",
    customers: "pc-demo-customers",
    orders: "pc-demo-orders",
    messages: "pc-demo-messages"
  };
  const categoryLabels = {
    cakes: "Celebration cakes",
    tarts: "Tarts & slices",
    "little-bakes": "Little bakes",
    seasonal: "Seasonal"
  };

  if (!data) throw new Error("The assessment website data could not be loaded.");

  function readList(key, seed) {
    const stored = sessionStorage.getItem(key);
    if (stored === null) return JSON.parse(JSON.stringify(seed));
    const value = JSON.parse(stored);
    if (!Array.isArray(value)) throw new Error(`Saved demo data for ${key} is invalid.`);
    return value;
  }

  function writeList(key, value) {
    sessionStorage.setItem(key, JSON.stringify(value));
  }

  function products() {
    return readList(keys.products, data.products);
  }

  function customers() {
    return readList(keys.customers, data.customers);
  }

  function orders() {
    return readList(keys.orders, data.orders);
  }

  function ownerSession() {
    const value = sessionStorage.getItem(keys.owner);
    return value ? JSON.parse(value) : null;
  }

  function customerSession() {
    const value = sessionStorage.getItem(keys.customer);
    return value ? JSON.parse(value) : null;
  }

  function requireOwner() {
    if (!ownerSession()) throw new Error("Owner access is required. Please sign in.");
  }

  function productFor(id, collection = products()) {
    return collection.find(product => product.id === id);
  }

  function orderItems(order) {
    if (Array.isArray(order.items)) return order.items;
    return [{ productId: order.productId, quantity: order.quantity || 1 }];
  }

  function accountOrder(order, catalog) {
    return {
      id: order.id,
      total: Number(order.total),
      pickupDate: order.pickupDate || order.date,
      pickupTime: order.pickupTime || "Pickup time not listed",
      status: order.status,
      createdAt: `${order.date}T12:00:00`,
      items: orderItems(order).map(item => ({
        quantity: Number(item.quantity),
        name: productFor(item.productId, catalog)?.name || "Bakery treat"
      }))
    };
  }

  function ownerData() {
    requireOwner();
    const catalog = products();
    const customerRows = customers().map(customer => {
      const customerOrders = orders().filter(order => order.customerId === customer.id);
      const lastOrder = customerOrders.reduce((latest, order) => order.date > latest ? order.date : latest, "");
      const spend = customerOrders.reduce((total, order) => total + Number(order.total), 0);
      return {
        ...customer,
        orderCount: customerOrders.length,
        spend,
        lastOrder,
        segment: customerOrders.length > 3 ? "VIP" : customerOrders.length > 1 ? "Regular" : "New"
      };
    });
    const orderRows = orders().map(order => {
      const customer = customerRows.find(item => item.id === order.customerId);
      const names = orderItems(order)
        .map(item => productFor(item.productId, catalog)?.name)
        .filter(Boolean);
      return {
        id: order.id,
        customer: customer?.name || order.name || "Shop customer",
        product: names.join(", ") || "Bakery treat",
        date: order.date,
        total: Number(order.total),
        status: order.status
      };
    });
    const productTotals = new Map();
    orders().forEach(order => {
      orderItems(order).forEach(item => {
        const product = productFor(item.productId, catalog);
        if (!product) return;
        const row = productTotals.get(product.id) || { ...product, quantity: 0, sales: 0 };
        const quantity = Number(item.quantity);
        row.quantity += quantity;
        row.sales += Number(product.price) * quantity;
        productTotals.set(product.id, row);
      });
    });
    const months = [];
    for (let offset = 5; offset >= 0; offset -= 1) {
      const monthDate = new Date();
      monthDate.setDate(1);
      monthDate.setMonth(monthDate.getMonth() - offset);
      const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
      const monthlyOrders = orders().filter(order => order.date.startsWith(key));
      months.push({
        key,
        label: monthDate.toLocaleDateString("en-MY", { month: "short" }),
        orders: monthlyOrders.length,
        sales: monthlyOrders.reduce((total, order) => total + Number(order.total), 0)
      });
    }

    return {
      owner: { name: data.owner.name },
      customers: customerRows,
      orders: orderRows,
      products: [...productTotals.values()].sort((first, second) => second.quantity - first.quantity),
      months
    };
  }

  function saveOrder(body) {
    const catalog = products().filter(product => product.active);
    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) throw new Error("Add a treat to your bag before placing an order.");

    const orderItemsValue = items.map(item => {
      const product = productFor(item.id, catalog);
      const quantity = Number(item.quantity);
      if (!product || !Number.isInteger(quantity) || quantity < 1) {
        throw new Error("One of the selected menu items is no longer available.");
      }
      return { productId: product.id, quantity };
    });
    const email = String(body.email || "").trim().toLowerCase();
    const name = String(body.name || "").trim();
    let customer = customers().find(item => item.email.toLowerCase() === email);
    if (!customer) {
      customer = { id: `C-${Date.now()}`, name, email, favourite: "New shop favourite" };
      writeList(keys.customers, [...customers(), customer]);
    }

    const total = orderItemsValue.reduce((sum, item) => {
      return sum + Number(productFor(item.productId, catalog).price) * item.quantity;
    }, 0);
    const now = new Date();
    const id = `PC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(Date.now()).slice(-5)}`;
    const order = {
      id,
      customerId: customer.id,
      name,
      email,
      items: orderItemsValue,
      total,
      date: now.toISOString().slice(0, 10),
      pickupDate: body.date,
      pickupTime: body.time,
      status: "Confirmed",
      note: String(body.note || "")
    };
    writeList(keys.orders, [...orders(), order]);
    return { id: order.id, pickupDate: order.pickupDate, pickupTime: order.pickupTime };
  }

  function normalizeSavedProduct(value, id) {
    const product = {
      ...value,
      id,
      category_label: categoryLabels[value.category],
      image_alt: value.image_alt || value.alt || value.name,
      ingredients: Array.isArray(value.ingredients) ? value.ingredients : [],
      active: Boolean(value.active)
    };
    if (!product.category_label) throw new Error("Choose a valid product category.");
    return product;
  }

  function createProductId(name, catalog) {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "new-bake";
    let id = base;
    let suffix = 2;
    while (catalog.some(product => product.id === id)) id = `${base}-${suffix++}`;
    return id;
  }

  window.staticDemoProducts = () => products().filter(product => product.active);
  window.staticDemoRequest = async (url, options = {}) => {
    const method = options.method || "GET";
    const body = options.body || {};
    const path = url.split("?")[0];

    if (path === "/api/products" && method === "GET") return window.staticDemoProducts();
    if (path === "/api/account" && method === "POST") {
      if (body.mode === "register") {
        const user = { name: String(body.name || "").trim(), email: String(body.email || "").trim().toLowerCase() };
        sessionStorage.setItem(keys.customer, JSON.stringify(user));
        return { user };
      }
      const email = String(body.email || "").trim().toLowerCase();
      if (email !== data.customerAccount.email || body.password !== data.customerAccount.password) {
        throw new Error("Those customer details do not match. Use the sample credentials shown on this page.");
      }
      const user = { name: data.customerAccount.name, email };
      sessionStorage.setItem(keys.customer, JSON.stringify(user));
      return { user };
    }
    if (path === "/api/account/orders" && method === "GET") {
      const user = customerSession();
      if (!user) throw new Error("Sign in to view your orders.");
      const catalog = products();
      return orders()
        .filter(order => order.email === user.email
          || customers().some(customer => customer.id === order.customerId && customer.email === user.email))
        .map(order => accountOrder(order, catalog));
    }
    if (path === "/api/orders" && method === "POST") return saveOrder(body);
    if (path === "/api/logout" && method === "POST") {
      sessionStorage.removeItem(keys.customer);
      return { message: "Signed out." };
    }
    if (path === "/api/contact" && method === "POST") {
      const messages = readList(keys.messages, []);
      writeList(keys.messages, [...messages, {
        name: String(body.name || ""),
        email: String(body.email || ""),
        message: String(body.message || ""),
        createdAt: new Date().toISOString()
      }]);
      return { message: "Message saved in this browser." };
    }
    if (path === "/api/owner/status" && method === "GET") {
      return { authenticated: Boolean(ownerSession()) };
    }
    if (path === "/api/owner/login" && method === "POST") {
      const email = String(body.email || "").trim().toLowerCase();
      if (email !== data.owner.email || body.password !== data.owner.password) {
        throw new Error("Those owner details do not match. Please check the credentials below.");
      }
      sessionStorage.setItem(keys.owner, JSON.stringify({
        name: data.owner.name,
        email,
        role: "owner"
      }));
      return { message: "Owner sign-in complete." };
    }
    if (path === "/api/owner/logout" && method === "POST") {
      sessionStorage.removeItem(keys.owner);
      return { message: "Signed out." };
    }
    if (path === "/api/owner/data" && method === "GET") return ownerData();
    if (path === "/api/owner/products" && method === "GET") {
      requireOwner();
      return products();
    }
    if (path === "/api/owner/products" && method === "POST") {
      requireOwner();
      const catalog = products();
      const id = createProductId(body.name, catalog);
      const product = normalizeSavedProduct(body, id);
      writeList(keys.products, [...catalog, product]);
      return product;
    }

    const productMatch = path.match(/^\/api\/owner\/products\/([^/]+)$/);
    if (productMatch) {
      requireOwner();
      const id = decodeURIComponent(productMatch[1]);
      const catalog = products();
      const index = catalog.findIndex(product => product.id === id);
      if (index < 0) throw new Error("That menu product could not be found.");
      if (method === "DELETE") {
        catalog[index] = { ...catalog[index], active: false };
        writeList(keys.products, catalog);
        return { message: "Product removed from the menu." };
      }
      if (method === "PUT") {
        catalog[index] = normalizeSavedProduct(body, id);
        writeList(keys.products, catalog);
        return catalog[index];
      }
    }

    throw new Error(`This action is unavailable on the website (${method} ${path}).`);
  };
})();
