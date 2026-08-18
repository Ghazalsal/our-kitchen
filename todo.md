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

## Application Icon Update

- [x] Retrieve the supplied image and prepare it as a web-safe application icon.
- [x] Apply the icon as the browser favicon and Our Kitchen storefront brand mark.
- [x] Verify the updated icon presentation before delivery.

## Web-app Manifest

- [x] Generate 192 px and 512 px installable icon assets from the supplied Our Kitchen logo.
- [x] Add a web-app manifest with the correct brand metadata and icon declarations.
- [x] Connect and verify the manifest in the storefront document head.

## Manifest Delivery Verification

- [x] Verify the supplied icon in the storefront header and footer brand marks.
- [x] Verify the favicon, app manifest, and multi-size icon URLs resolve from the browser metadata.
- [ ] Save and synchronize the verified web-app manifest update to GitHub.

## Israeli Shekel Currency

- [x] Replace dollar-formatted monetary displays with locale-aware Israeli shekel (ILS) formatting.
- [x] Apply ILS formatting to product, cart, checkout, order-tracking, and admin values.
- [x] Verify pricing and discount calculations display correctly in ILS.
