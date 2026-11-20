# Petal & Crumb

Petal & Crumb is a responsive dessert-shop website for exploring a bakery menu, planning a pickup, and viewing a shop-owner dashboard. The GitHub Pages assessment version is a static HTML, CSS, and JavaScript prototype. It does not need Laravel, PHP, MySQL, or a backend while visitors use it.

## Features

- Responsive customer pages with light and dark cream-and-cocoa themes.
- Searchable, sortable menu with category filters, product descriptions, ingredients, and allergen details.
- Demo shopping bag and pickup-order flow.
- Demo customer sign-in and order-history dashboard.
- Separate demo owner sign-in, customer data view, shop analytics, and charts.
- Owner menu management with add, edit, remove, search, and category/status filters.
- Sample products, customers, and orders are defined in the JavaScript source.

## Demo logins

Open `login.html` to test the customer account or `owner-login.html` to test the owner workspace.

| Account | Email | Password |
| --- | --- | --- |
| Customer | `hello@petalandcrumb.example` | `sweet123` |
| Owner | `owner@petalandcrumb.example` | `littlecrumbs26` |

These are public, client-side demo credentials, not secure accounts. The sign-in screen only simulates access; it does not protect data from someone who can inspect the website source. Use fictional information only.

## Data behavior

Starter menu, customer, order, and demo-login data are stored in `backend/public/assets/js/demo-data.js`. Pickup orders, contact messages, and owner menu edits are saved in the current browser's `localStorage` so the prototype can demonstrate interactions. Those changes do not update the source code, sync to other devices, or reach a real shop. Clearing the browser's site data resets the demo to its starter records.

Do not use this static prototype to collect real customer information, passwords, or orders. Real shared accounts and persistent cross-device data require a server and database.

## Code organization

| Location | Purpose |
| --- | --- |
| `backend/public/*.html` | Customer-facing page source |
| `backend/resources/owner-pages/*.html` | Owner workspace page source |
| `backend/public/assets/css/style.css` | Shared responsive styling and themes |
| `backend/public/assets/js/app.js` | Page interactions, catalog, forms, and charts |
| `backend/public/assets/js/demo-data.js` | Hard-coded fictional starter data and test credentials |
| `backend/public/assets/js/static-demo.js` | Browser-only demo data operations |
| `backend/scripts/build-github-pages.php` | Copies the static sources into `docs/`; does not access Laravel or MySQL |
| `docs/` | Complete GitHub Pages site output |

The static website uses semantic HTML page titles, descriptions, headings, navigation, and named content sections. HTML, CSS, and JavaScript are kept in separate files.

## Frameworks and libraries

- HTML5, CSS3, and vanilla JavaScript
- Bootstrap 5.3.3 and Bootstrap Icons 1.11.3 via CDN
- Chart.js 4.4.1 via CDN for owner analytics
- Google Fonts and Unsplash-hosted sample imagery

An internet connection is needed to load the CDN libraries, fonts, and sample images.

## Test locally

From the project root, build the Pages directory and serve it as static files. No database setup is required:

```powershell
php backend\scripts\build-github-pages.php
php -S 127.0.0.1:8080 -t docs
```

Then open `http://127.0.0.1:8080/`. The same demo login credentials above work on the local preview. The PHP command only serves static files; the website itself runs in the browser.

## GitHub repository and Pages deployment

- Repository: <https://github.com/dibdibdeeb/individual-adibah>
- GitHub Pages URL: <https://dibdibdeeb.github.io/individual-adibah/>

To publish or update the site:

1. Run the build command above and commit/push the source files and generated `docs/` directory to the repository's `main` branch.
2. In GitHub, open **Settings → Pages** and choose **Deploy from a branch**, branch `main`, folder `/docs`.
3. Visit the Pages URL above after GitHub finishes deployment.

The Laravel/MySQL version remains in `backend/` as a separate server-based prototype; it is not used by GitHub Pages. The public static Pages demo and its test credentials must not be used as a production shop or a real owner-security boundary.
