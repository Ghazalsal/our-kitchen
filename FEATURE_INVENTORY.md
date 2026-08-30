# Our Kitchen — Delivered Feature Inventory

**Product:** Our Kitchen — Copper & Co.  
**Current implementation:** React storefront with Laravel PHP API, TiDB/MySQL-compatible persistence, Injazat application-owned product/category media, bilingual customer experience, and role-secured administration.

## 1. Feature status at a glance

| Area | Delivered capability | Status |
|---|---|---|
| Customer storefront | Browsing, product discovery, cart, coupon logic, authenticated checkout, tracking, and messaging | Implemented |
| Customer accounts | Phone/password registration and sign-in, email recovery, optional email verification, account page, persistent session | Implemented |
| Administrator access | Dedicated `/admin/login`, Laravel `admin` role enforcement, protected `/admin` workspace | Implemented |
| Commerce operations | Product, inventory, order, coupon, campaign, notification, and customer-message administration | Implemented |
| Persistence | TiDB/MySQL commerce, account, session, cache, and password-reset data | Implemented |
| Localization | English/Arabic switching, URL state, Arabic typography, and RTL behavior | Implemented |
| Storage | Application-owned product/category uploads, MySQL metadata, bundled catalog imagery, and persistent-volume media serving | Implemented; Injazat volume mount required |
| Email | Safe local verification/reset mail logging and environment-driven production mail configuration | Development ready; production provider required |
| Notifications | Persisted customer and administrator activity refreshes every 30 seconds in active browser sessions | Implemented |
| Payments | Payment collection integration | Not connected yet |

## 2. Brand, visual system, and installability

The storefront uses the **Copperline Atelier** visual direction: espresso ink, copper, brass, and cream, with the Fraunces display typeface and Karla body typeface. Arabic uses Noto Sans Arabic when the Arabic interface is active. The interface is responsive across desktop and mobile, with a customer storefront shell and a focused operational administrator workspace.

Delivered brand and installability work includes the supplied Our Kitchen logo as the browser favicon, shared header/footer mark, and mobile app icon. A web-app manifest supports installation, with dedicated **192 px** and **512 px** icons, standalone display configuration, and correct manifest metadata.

## 3. Customer storefront

| Surface | Delivered functions |
|---|---|
| Home | Announcement ticker, sticky navigation, global product search, cart access, timed-campaign countdown, Dorsha kitchenware discovery, category/product merchandising, deal presentation, trust/value sections, newsletter area, and site footer |
| Shop | Product browsing with category, price, and brand filters; sorting and search |
| Product detail | Image gallery, product variants/finishes, quantity selection, specifications/features, and related-product discovery |
| Cart | Cart drawer and cart page, line-item quantity controls, removal, persistent save-for-later area, coupon entry, and live totals |
| Checkout | Delivery address capture, session-owned name/email, ILS totals, coupon and campaign calculations, authenticated-user enforcement, and server-confirmed order placement |
| Deals | Dedicated discounted-product surface |
| Tracking | Customer-owned order history, visual delivery-status timeline, customer/admin message thread, and notifications |
| Navigation | Responsive header/footer and a mobile bottom navigation pattern |

All monetary displays use locale-aware **Israeli shekel (ILS / ₪)** formatting. The cart and checkout calculate subtotal, shipping, coupon discounts, and total in real time.

## 4. Coupon and order capabilities

The coupon engine supports percentage discounts, fixed discounts, and free shipping. It validates active state, expiry, minimum spend, use limits, and category scope. Coupon usage is persisted and updated as part of server-confirmed order creation.

Orders persist customer ownership, delivery address, line items, pricing, shipping, discount, coupon selection, and lifecycle status. Supported order states are **placed**, **confirmed**, **preparing**, **shipped**, **delivered**, and **cancelled**. Customer order access and messaging are restricted to the order owner.

## 5. Customer account system

The customer account area delivers phone/password sign-in at `/login`, registration at `/register`, password recovery at `/forgot-password`, password update at `/reset-password`, and the signed-in account page at `/account`.

Registration requires a name, a unique Palestinian mobile number, a unique email address, and a password of at least 12 characters. Mobile numbers are normalized to E.164-compatible `+970` form and customers sign in with their saved mobile number and password. No SMS code is sent or accepted at this stage. Laravel hashes passwords before storage, and successful registration creates a persistent encrypted database-backed session. Email remains available for receipts and password recovery; signed email verification is retained but optional by default.

Password recovery uses Laravel’s reset-token broker. Reset links are time-limited, password-reset requests are rate limited, and the browser reset screen keeps both the token and intended email together. Account enumeration is reduced by returning the same reset-request response whether or not the email exists.

## 6. Separate administrator experience

Administrators use a visually and functionally distinct sign-in page at **`/admin/login`**. Customer login and registration remain separate at `/login` and `/register`. The footer’s **Atelier Desk** link and protected `/admin` access state direct staff to the dedicated administrator sign-in screen.

An administrator must still use a real account email and password, but Laravel must assign that account the `admin` role. A customer account entered into the administrator sign-in form is not allowed into `/admin`; it is signed out and directed to the customer sign-in journey. There is no shared passcode or client-side admin bypass.

| Administrator surface | Delivered functions |
|---|---|
| Access control | Laravel role check on frontend routes and all protected server mutations |
| Dashboard | Revenue, order, low-stock, and notification indicators; recent-order and inbox views |
| Product library | Create, edit, and delete products; pricing, stock, category, imagery, descriptions, features, finishes, and merchandising flags |
| Product and category media | Administrator-only image uploads to application-owned persistent storage with reusable `/media/...` URLs |
| Order desk | Review orders, change status, inspect delivery/order details, and reply to customers |
| Coupon desk | Create, edit, and remove percentage, fixed, and free-shipping offers |
| Campaign desk | Create, edit, and remove time-aware percentage, fixed, and free-shipping campaigns with all-store, maker/brand, or category targeting and priority |
| Inbox | Review order and message notifications and mark them read |

## 7. Laravel backend and persistent data

The project’s commerce backend is Laravel PHP, served with the React build. Its REST API handles account, catalog, cart, order, message, notification, coupon, campaign, and product/category media operations. The Node API scaffold is no longer the active commerce backend.

Persistent TiDB/MySQL storage covers the following data areas:

| Data area | Stored records |
|---|---|
| Catalog | Products, categories, prices, inventory, galleries, descriptions, features, colors, deals, and featured flags |
| Commerce | Carts, orders, order lines, coupon rules/usage, messages, and notifications |
| Accounts | Users, roles, verification timestamps, login timestamps, password-reset tokens, and encrypted database sessions |
| Security services | Database-backed cache and cache locks used by Laravel rate limiting |
| Media | Product/category ownership, application-storage keys, media URLs, filename, verified content type, and size metadata |

Authenticated carts are bound to `cart-{user.id}`. The backend checks cart ownership, order ownership, and role authorization. Checkout retains the cart until Laravel confirms the order; an expired session is returned to the customer rather than being shown as a successful order. Campaign discounts are recalculated on the server according to campaign timing and eligibility.

## 8. Security controls

> Authorization is enforced by Laravel on the server. Hiding or changing a browser screen cannot grant administrator access.

The security implementation includes database-backed Laravel sessions with session encryption, CSRF/XSRF token handling for state-changing browser requests, session regeneration after registration and sign-in, hashed passwords, unique normalized customer mobile numbers and emails, optional signed email verification, time-limited password-reset tokens, and rate-limited registration, sign-in, verification resend, and reset-request endpoints.

Administrative mutations no longer rely on the previous passcode/header approach. They require an authenticated account whose database role is `admin`. Order placement requires a signed-in customer account at the server boundary. Persisted order, message, and notification activity reconciles automatically every 30 seconds while an authenticated browser tab is active.

## 9. Administrator provisioning and operations

There are intentionally **no default administrator credentials**. A real registered account is promoted by an authorized operator using the confirmation-gated Laravel command:

```bash
php laravel/artisan kitchen:promote-admin admin@example.com
```

The command confirms the operation, requires the user to exist, and changes only the selected account’s role. The operational guide is available in [`ADMIN_OPERATIONS.md`](./ADMIN_OPERATIONS.md). It also documents the controlled database alternative for emergency use.

## 10. Email behavior

During development, Laravel uses the **log mailer**. Verification and password-reset messages are written to `laravel/storage/logs/laravel.log`, allowing the complete account flow to be validated without exposing credentials or sending test emails externally.

For real inbox delivery in production, configure `APP_URL` and the mail-provider environment values: `MAIL_MAILER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_ENCRYPTION`, `MAIL_FROM_ADDRESS`, and `MAIL_FROM_NAME`. No email-provider password is stored in the source code.

## 11. Localization and language behavior

The application supports English and Arabic. The visible language switcher persists selection, supports direct Arabic entry with `?lang=ar`, applies Arabic translations across storefront and administrative surfaces, and switches document direction and layout to RTL when Arabic is selected. Arabic type uses Noto Sans Arabic alongside the established Copperline visual system.

## 12. File storage and media delivery

Product and category images are uploaded through the protected Laravel media endpoint to the application-owned `kitchen_media` disk. The image bytes live in the Injazat persistent media volume, while MySQL stores ownership, path, filename, content type, and size metadata. Customer-facing files are served through constrained `/media/...` routes with explicit content types, immutable caching, and content-sniffing protection. Uploads are administrator-only.

The application logo is a bundled PNG in `client/public/images`, and the seed catalog imagery is bundled in `client/public/catalog`. Header, footer, browser icon, install manifest, hero, categories, and products no longer depend on Manus media URLs. Injazat must retain a writable persistent volume at `/var/www/html/storage/app/kitchen-media` for runtime uploads.

## 13. Production runtime

The project has a multi-stage production Docker runtime that builds the React storefront and serves it through Laravel PHP. The Laravel routes include API, single-page-app fallback, application-owned media delivery, password reset, email verification, and web-app manifest handling.

## 14. Validation completed

The implemented system has been validated with TypeScript checks, PHP syntax checks, Laravel behavior tests, browser screenshots, and **28 passing Vitest regression tests**. Validation covers campaign timing and server-side discount rules, scoped activity polling, phone normalization and duplicate rejection, customer sessions, separate administrator access, CSRF-backed authentication, local branding, and application-owned media flows. The media behavior test adds 10 assertions for administrator upload authorization, filesystem persistence, MySQL metadata, and safe serving.

## 16. Campaigns, notifications, and recovery guidance

Administrators can create scheduled campaigns without a background scheduler. A campaign supports percentage, fixed-amount, or free-shipping discounts; all-store, maker/brand, or category targeting; start/end time; and priority. The homepage chooses the relevant live or upcoming campaign and renders its countdown, while checkout trusts the server-calculated eligibility and savings.

Customer and administrator activity is persisted in Laravel and automatically refreshed every 30 seconds while the authenticated browser tab is active. Polling pauses while a tab is hidden and refreshes on return, reducing unnecessary requests without requiring a manual reload.

`DATABASE_SECURITY_AND_BACKUP.md` records the current recovery posture. The application has a sound security baseline, but a standalone automatic database backup and tested restore policy still require an owner-approved storage destination and operational configuration.

## 15. Items intentionally awaiting a production decision

| Item | What is needed |
|---|---|
| Real email inbox delivery | Choose and configure a transactional email provider or SMTP credentials |
| Live payment collection | Choose Stripe or Shopify and connect the store/payment configuration |
| SMS one-time-code verification | Select and configure an SMS provider when real code delivery is required; the current customer flow uses phone plus password without SMS verification |
| Automated database recovery copies | Choose an encrypted off-site backup destination, retention policy, and restore-test process |
| Public administrator accounts | Register the intended staff email, then promote it through the controlled operator command |
| Publish to a live domain | Save checkpoint is complete; use the workspace Publish control and configure the desired domain |
