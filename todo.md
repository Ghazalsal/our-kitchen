# Localization Update Checklist

- [x] Add persistent English/Arabic language state and a visible switcher.
- [x] Provide Arabic translations for storefront, checkout, tracking, and admin interfaces.
- [x] Apply right-to-left direction, typography, and spacing adjustments when Arabic is selected.
- [x] Verify customer and admin flows in both languages before delivery.

## Full-stack Persistence Checklist

- [ ] Upgrade the project to include database, authenticated backend APIs, and file storage.
- [ ] Create the database schema for products, categories, coupons, carts, orders, messages, and notifications.
- [ ] Migrate customer and admin data flows from local browser storage to persistent server data.
- [ ] Store and retrieve administrator-uploaded product imagery through managed file storage.
- [ ] Verify persistence through a full order and administration workflow.

## Laravel Backend Migration Checklist

- [ ] Confirm Laravel runtime and deployment requirements while preserving the React storefront.
- [ ] Build Laravel API endpoints for products, orders, coupons, messages, notifications, and media uploads.
- [ ] Connect Laravel to the persistent database and managed product-media storage.
- [ ] Replace the browser-only data access paths with Laravel API calls.
- [ ] Verify persistent customer and admin workflows through the Laravel backend.

## Full-stack Upgrade Regression

- [x] Remove the undefined `useAuth` reference that is preventing the storefront home page from rendering.
