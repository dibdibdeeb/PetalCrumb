// Fictional starter records for the GitHub Pages assessment demo.
window.PETAL_CRUMB_DEMO_DATA = {
  owner: {
    name: "Petal & Crumb Owner",
    email: "owner@petalandcrumb.example",
    password: "littlecrumbs26"
  },
  customerAccount: {
    name: "Maya Chen",
    email: "hello@petalandcrumb.example",
    password: "sweet123"
  },
  products: [
    {
      id: "brown-butter-cookie",
      name: "Brown butter cookie",
      category: "little-bakes",
      category_label: "Little bakes",
      description: "Crisp around the edges, soft in the middle, gone in a minute.",
      price: 8,
      tag: "A pocket-sized joy",
      image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80",
      image_alt: "Freshly baked chocolate chip cookies",
      ingredients: ["Wheat flour", "brown butter", "brown sugar", "eggs", "dark chocolate", "vanilla"],
      allergens: "Wheat, eggs, and dairy",
      active: true
    },
    {
      id: "chocolate-cloud",
      name: "Chocolate cloud cake",
      category: "cakes",
      category_label: "Celebration cakes",
      description: "Dark cocoa sponge, velvet cream, and a tender chocolate ganache.",
      price: 98,
      tag: "A little favourite",
      image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80",
      image_alt: "Rich chocolate celebration cake with swirls of frosting",
      ingredients: ["Dark cocoa", "wheat flour", "eggs", "butter", "cream", "dark chocolate", "sugar"],
      allergens: "Wheat, eggs, and dairy",
      active: true
    },
    {
      id: "chocolate-hazelnut",
      name: "Chocolate hazelnut slice",
      category: "tarts",
      category_label: "Tarts & slices",
      description: "Deep cocoa, a little crunch, and silky roasted hazelnut.",
      price: 19,
      tag: "For chocolate people",
      image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80",
      image_alt: "Chocolate dessert squares with a rich cocoa finish",
      ingredients: ["Dark chocolate", "wheat flour", "eggs", "butter", "cream", "roasted hazelnut"],
      allergens: "Wheat, eggs, dairy, and hazelnut",
      active: true
    },
    {
      id: "lemon-meringue",
      name: "Lemon meringue tart",
      category: "tarts",
      category_label: "Tarts & slices",
      description: "Bright lemon curd tucked beneath a cloud of toasted meringue.",
      price: 18,
      tag: "Bright & lovely",
      image: "https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=800&q=80",
      image_alt: "Golden lemon tart finished with a soft meringue topping",
      ingredients: ["Lemon", "eggs", "butter", "sugar", "wheat flour", "almond flour"],
      allergens: "Wheat, eggs, dairy, and almonds",
      active: true
    },
    {
      id: "peach-shortcake",
      name: "Peach garden shortcake",
      category: "seasonal",
      category_label: "Seasonal",
      description: "Tender shortcake, ripe peaches, and softly whipped cream.",
      price: 22,
      tag: "Seasonal sunshine",
      image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=800&q=80",
      image_alt: "A fruit-topped shortcake with layers of cream",
      ingredients: ["Peaches", "wheat flour", "cream", "eggs", "butter", "sugar"],
      allergens: "Wheat, eggs, and dairy",
      active: true
    },
    {
      id: "pistachio-croissant",
      name: "Pistachio cream croissant",
      category: "little-bakes",
      category_label: "Little bakes",
      description: "Flaky, buttery layers with a generous pistachio heart.",
      price: 14,
      tag: "Morning magic",
      image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80",
      image_alt: "Freshly baked golden croissants",
      ingredients: ["Wheat flour", "butter", "milk", "eggs", "pistachio", "yeast", "sugar"],
      allergens: "Wheat, dairy, eggs, and pistachio",
      active: true
    },
    {
      id: "rose-berry-tart",
      name: "Rose & berry tart",
      category: "seasonal",
      category_label: "Seasonal",
      description: "A crisp almond shell with berries and the gentlest rose cream.",
      price: 21,
      tag: "Here for a little while",
      image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80",
      image_alt: "A colourful fruit tart topped with fresh berries",
      ingredients: ["Almond flour", "wheat flour", "butter", "raspberries", "strawberries", "cream", "rose water"],
      allergens: "Wheat, dairy, and almonds",
      active: true
    },
    {
      id: "vanilla-bean-cupcake",
      name: "Vanilla bean cupcake",
      category: "little-bakes",
      category_label: "Little bakes",
      description: "Fluffy vanilla sponge with a swirl of real vanilla buttercream.",
      price: 11,
      tag: "A classic for a reason",
      image: "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=800&q=80",
      image_alt: "Vanilla cupcakes topped with swirled frosting",
      ingredients: ["Wheat flour", "eggs", "milk", "butter", "vanilla bean", "sugar"],
      allergens: "Wheat, eggs, and dairy",
      active: true
    }
  ],
  customers: [
    { id: "C-1001", name: "Maya Chen", email: "hello@petalandcrumb.example", favourite: "Chocolate cloud cake" },
    { id: "C-1002", name: "Aisha Rahman", email: "aisha@example.com", favourite: "Lemon meringue tart" },
    { id: "C-1003", name: "Noah Lim", email: "noah@example.com", favourite: "Pistachio cream croissant" },
    { id: "C-1004", name: "Sofia Tan", email: "sofia@example.com", favourite: "Rose & berry tart" },
    { id: "C-1005", name: "Ethan Lee", email: "ethan@example.com", favourite: "Brown butter cookie" }
  ],
  orders: [
    { id: "PC-260601", customerId: "C-1001", productId: "chocolate-cloud", quantity: 1, total: 98, date: "2026-06-05", pickupDate: "2026-06-07", pickupTime: "10:00–11:00 am", status: "Completed" },
    { id: "PC-260602", customerId: "C-1002", productId: "lemon-meringue", quantity: 2, total: 36, date: "2026-06-12", pickupDate: "2026-06-14", pickupTime: "11:00 am–12:00 pm", status: "Completed" },
    { id: "PC-260701", customerId: "C-1003", productId: "pistachio-croissant", quantity: 3, total: 42, date: "2026-07-08", pickupDate: "2026-07-09", pickupTime: "9:00–10:00 am", status: "Completed" },
    { id: "PC-260702", customerId: "C-1001", productId: "brown-butter-cookie", quantity: 4, total: 32, date: "2026-07-19", pickupDate: "2026-07-20", pickupTime: "2:00–3:00 pm", status: "Completed" },
    { id: "PC-260801", customerId: "C-1004", productId: "rose-berry-tart", quantity: 2, total: 42, date: "2026-08-03", pickupDate: "2026-08-04", pickupTime: "1:00–2:00 pm", status: "Completed" },
    { id: "PC-260802", customerId: "C-1005", productId: "chocolate-hazelnut", quantity: 3, total: 57, date: "2026-08-24", pickupDate: "2026-08-25", pickupTime: "3:00–4:00 pm", status: "Completed" },
    { id: "PC-260901", customerId: "C-1002", productId: "peach-shortcake", quantity: 2, total: 44, date: "2026-09-10", pickupDate: "2026-09-12", pickupTime: "12:00–1:00 pm", status: "Completed" },
    { id: "PC-260902", customerId: "C-1003", productId: "vanilla-bean-cupcake", quantity: 6, total: 66, date: "2026-09-21", pickupDate: "2026-09-22", pickupTime: "4:00–5:00 pm", status: "Completed" },
    { id: "PC-261001", customerId: "C-1001", productId: "chocolate-cloud", quantity: 1, total: 98, date: "2026-10-04", pickupDate: "2026-10-05", pickupTime: "10:00–11:00 am", status: "Completed" },
    { id: "PC-261002", customerId: "C-1004", productId: "lemon-meringue", quantity: 3, total: 54, date: "2026-10-18", pickupDate: "2026-10-19", pickupTime: "11:00 am–12:00 pm", status: "Completed" },
    { id: "PC-261101", customerId: "C-1005", productId: "brown-butter-cookie", quantity: 5, total: 40, date: "2026-11-02", pickupDate: "2026-11-03", pickupTime: "2:00–3:00 pm", status: "Confirmed" },
    { id: "PC-261102", customerId: "C-1002", productId: "chocolate-hazelnut", quantity: 2, total: 38, date: "2026-11-11", pickupDate: "2026-11-12", pickupTime: "3:00–4:00 pm", status: "Confirmed" }
  ]
};
