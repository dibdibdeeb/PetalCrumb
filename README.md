# Petal & Crumb

A responsive Bootstrap dessert-shop website for browsing the menu, creating an account, and ordering ahead for pickup. The owner workspace is served by Laravel and protected by server-side authentication.

## Features

- Customer storefront with searchable menu, ingredients/allergen details, theme toggle, and local shopping bag.
- Customer registration and sign-in backed by Laravel sessions and MySQL.
- Pickup orders, customer records, contact messages, and order items saved in MySQL.
- Separate owner sign-in, menu management (add, edit, remove, search, and category/status filters), customer data view, dashboard, and sales visualisations.
- Fictional seed customers and orders for demonstrating the owner workspace.

The shopping bag and colour-theme preference remain in the browser. Order totals are calculated by the server from the active product prices; no payment is collected online.

## Local setup (Laragon)

Requirements: PHP 8.3+, Composer, and MySQL 8.4+.

1. Start MySQL in Laragon and create a database named `petal_crumb` using `utf8mb4`.
2. In `backend`, copy `.env.example` to `.env` if needed. Set `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD` for your local MySQL account. Keep `.env` private.
3. Install and initialize Laravel:

   ```powershell
   cd backend
   composer install
   php artisan key:generate
   php artisan migrate --seed
   php artisan serve
   ```

4. Open `http://127.0.0.1:8000`.

Seeded demo accounts:

- Customer: `hello@petalandcrumb.example` / `sweet123`
- Owner: `owner@petalandcrumb.example` / `littlecrumbs26`

Local seeded owner analytics include fictional sample records. Orders submitted through the storefront are stored in the same database and appear in the owner workspace. In non-local environments, the seeder installs menu products only; create a unique owner account before exposing the site.

Run focused backend tests with:

```powershell
cd backend
php artisan test
```

## Pages

Customer pages are in `backend/public` (`index.html`, `menu.html`, `preorder.html`, `login.html`, `dashboard.html`, and `story.html`). Owner page templates (including `owner-products.html` for menu management) are outside the public directory in `backend/resources/owner-pages` and are returned only through owner-gated Laravel routes. Shared assets are in `backend/public/assets`.

## Deployment

This application requires PHP/Laravel and MySQL; GitHub Pages cannot host the database-backed version. Configure the production database and HTTPS session settings, set `APP_DEBUG=false`, and create a unique owner account before deployment. Never use the seeded demo credentials for a live shop.

### Separate shop and owner domains

The customer and owner pages can use different hostnames, such as `petalandcrumb.com` and `owner.petalandcrumb.com`, while still using the same Laravel application and MySQL database. Point both DNS records at the hosting account and configure both hostnames to serve the same Laravel `public` directory. The owner sign-in and its API requests then stay on the owner hostname; the shop uses the shop hostname. Keep the session cookie host-only so the two sites have separate sign-in sessions. If the owner site is hosted separately, route its `/api` requests through a secure reverse proxy to Laravel rather than exposing the database.

### Use from another computer

The current Laragon setup stores data in the MySQL server on this computer, so other computers do not automatically share it. For shared access, deploy Laravel and MySQL to an internet-accessible host (or use a managed MySQL service), then configure the deployed app's `.env` to connect to that remote database. The website and its data will then be available from any computer that can reach the hosted site. Use HTTPS and set up automatic database backups before using real customer data.
