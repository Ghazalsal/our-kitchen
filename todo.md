# Localization Update Checklist

- [x] Add persistent English/Arabic language state and a visible switcher.
- [x] Provide Arabic translations for storefront, checkout, tracking, and admin interfaces.
- [x] Apply right-to-left direction, typography, and spacing adjustments when Arabic is selected.
- [x] Verify customer and admin flows in both languages before delivery.

## Full-stack Persistence Checklist

- [x] Upgrade the project to include database, authenticated backend APIs, and file storage.
- [x] Create the database schema for products, categories, coupons, carts, orders, messages, and notifications.
- [x] Migrate customer and admin data flows from local browser storage to persistent server data.
- [x] Store and retrieve administrator-uploaded product imagery through managed file storage.
- [x] Verify persistence through a full order and administration workflow.

## Laravel Backend Migration Checklist

- [x] Execute the approved Laravel backend migration and retire the Node API runtime.
- [x] Confirm Laravel runtime and deployment requirements while preserving the React storefront.
- [x] Build Laravel API endpoints for products, orders, coupons, messages, notifications, and media uploads.
- [x] Connect Laravel to the persistent database and managed product-media storage.
- [x] Replace the browser-only data access paths with Laravel API calls.
- [x] Verify persistent customer and admin workflows through the Laravel backend.

## Laravel Delivery Validation

- [x] Run and confirm a protected admin product, coupon, order-status, and message workflow against the persistent database.
- [x] Verify the Dockerized Laravel runtime serves the compiled React storefront, API routes, and media routes.
- [x] Remove obsolete Node API startup paths so Laravel is the sole backend runtime.

## Full-stack Upgrade Regression

- [x] Remove the undefined `useAuth` reference that is preventing the storefront home page from rendering.
