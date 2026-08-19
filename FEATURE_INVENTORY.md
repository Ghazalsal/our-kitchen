# Our Kitchen — Delivered Feature Inventory

**Product:** Our Kitchen — Copper & Co.  
**Current implementation:** React storefront with Laravel PHP API, TiDB persistence, managed product-media storage, bilingual customer experience, and role-secured administration.

## 1. Feature status at a glance

| Area | Delivered capability | Status |
|---|---|---|
| Customer storefront | Browsing, product discovery, cart, coupon logic, authenticated checkout, tracking, and messaging | Implemented |
| Customer accounts | Registration, sign-in, signed verification links, password recovery, account page, persistent session | Implemented |
| Administrator access | Dedicated `/admin/login`, Laravel `admin` role enforcement, protected `/admin` workspace | Implemented |
| Commerce operations | Product, inventory, order, coupon, notification, and customer-message administration | Implemented |
| Persistence | TiDB/MySQL commerce, account, session, cache, and password-reset data | Implemented |
| Localization | English/Arabic switching, URL state, Arabic typography, and RTL behavior | Implemented |
| Storage | Managed S3-backed product-image upload and media serving | Implemented |
| Email | Safe local verification/reset mail logging and environment-driven production mail configuration | Development ready; production provider required |
| Payments | Payment collection integration | Not connected yet |

## 2. Brand, visual system, and installability

The storefront uses the **Copperline Atelier** visual direction: espresso ink, copper, brass, and cream, with the Fraunces display typeface and Karla body typeface. Arabic uses Noto Sans Arabic when the Arabic interface is active. The interface is responsive across desktop and mobile, with a customer storefront shell and a focused operational administrator workspace.

Delivered brand and installability work includes the supplied Our Kitchen logo as the browser favicon, shared header/footer mark, and mobile app icon. A web-app manifest supports installation, with dedicated **192 px** and **512 px** icons, standalone display configuration, and correct manifest metadata.

## 3. Customer storefront

| Surface | Delivered functions |
|---|---|
| Home | Announcement ticker, sticky navigation, search, cart access, hero campaign, category/product merchandising, deal presentation, trust/value sections, newsletter area, and site footer |
| Shop | Product browsing with category, price, and brand filters; sorting and search |
| Product detail | Image gallery, product variants/finishes, quantity selection, specifications/features, and related-product discovery |
| Cart | Cart drawer and cart page, line-item quantity controls, removal, coupon entry, and live totals |
| Checkout | Delivery address capture, session-owned name/email, ILS totals, coupon calculations, authenticated/verified-user enforcement, and server-confirmed order placement |
| Deals | Dedicated discounted-product surface |
| Tracking | Customer-owned order history, status tracking, customer/admin message thread, and notifications |
| Navigation | Responsive header/footer and a mobile bottom navigation pattern |

All monetary displays use locale-aware **Israeli shekel (ILS / ₪)** formatting. The cart and checkout calculate subtotal, shipping, coupon discounts, and total in real time.

## 4. Coupon and order capabilities

The coupon engine supports percentage discounts, fixed discounts, and free shipping. It validates active state, expiry, minimum spend, use limits, and category scope. Coupon usage is persisted and updated as part of server-confirmed order creation.

Orders persist customer ownership, delivery address, line items, pricing, shipping, discount, coupon selection, and lifecycle status. Supported order states are **placed**, **confirmed**, **preparing**, **shipped**, **delivered**, and **cancelled**. Customer order access and messaging are restricted to the order owner.

## 5. Customer account system

The customer account area delivers registration, standard customer sign-in at `/login`, registration at `/register`, password recovery at `/forgot-password`, password update at `/reset-password`, and the signed-in account page at `/account`.

Registration requires a name, an RFC-compliant email address, a unique email, and a password of at least 12 characters. Laravel hashes passwords before storage. Successful registration creates a persistent encrypted database-backed session and sends a signed email-verification link. The account page shows verification state and can request a new verification message.

Password recovery uses Laravel’s reset-token broker. Reset links are time-limited, password-reset requests are rate limited, and the browser reset screen keeps both the token and intended email together. Account enumeration is reduced by returning the same reset-request response whether or not the email exists.

## 6. Separate administrator experience

Administrators use a visually and functionally distinct sign-in page at **`/admin/login`**. Customer login and registration remain separate at `/login` and `/register`. The footer’s **Atelier Desk** link and protected `/admin` access state direct staff to the dedicated administrator sign-in screen.

An administrator must still use a real account email and password, but Laravel must assign that account the `admin` role. A customer account entered into the administrator sign-in form is not allowed into `/admin`; it is signed out and directed to the customer sign-in journey. There is no shared passcode or client-side admin bypass.

| Administrator surface | Delivered functions |
|---|---|
| Access control | Laravel role check on frontend routes and all protected server mutations |
| Dashboard | Revenue, order, low-stock, and notification indicators; recent-order and inbox views |
| Product library | Create, edit, and delete products; pricing, stock, category, imagery, descriptions, features, finishes, and merchandising flags |
| Product media | Image upload to managed storage and reusable stored image URLs |
| Order desk | Review orders, change status, inspect delivery/order details, and reply to customers |
| Coupon desk | Create, edit, and remove percentage, fixed, and free-shipping offers |
| Inbox | Review order and message notifications and mark them read |

## 7. Laravel backend and persistent data

The project’s commerce backend is Laravel PHP, served with the React build. Its REST API handles account, catalog, cart, order, message, notification, coupon, and product-media operations. The Node API scaffold is no longer the active commerce backend.

Persistent TiDB/MySQL storage covers the following data areas:

| Data area | Stored records |
|---|---|
| Catalog | Products, categories, prices, inventory, galleries, descriptions, features, colors, deals, and featured flags |
| Commerce | Carts, orders, order lines, coupon rules/usage, messages, and notifications |
| Accounts | Users, roles, verification timestamps, login timestamps, password-reset tokens, and encrypted database sessions |
| Security services | Database-backed cache and cache locks used by Laravel rate limiting |
| Media | Managed storage keys, media URLs, filename, content type, and size metadata |

Authenticated carts are bound to `cart-{user.id}`. The backend checks cart ownership, order ownership, and role authorization. Checkout now retains the cart until Laravel confirms the order; an expired session or verification failure is returned to the customer rather than being shown as a successful order.

## 8. Security controls

> Authorization is enforced by Laravel on the server. Hiding or changing a browser screen cannot grant administrator access.

The security implementation includes database-backed Laravel sessions with session encryption, CSRF/XSRF token handling for state-changing browser requests, session regeneration after registration and sign-in, hashed passwords, email uniqueness validation, signed email verification, time-limited password-reset tokens, and rate-limited registration, sign-in, verification resend, and reset-request endpoints.

Administrative mutations no longer rely on the previous passcode/header approach. They require an authenticated account whose database role is `admin`. Order placement requires both a signed-in account and a verified email at the server boundary.

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

Product images are uploaded through the protected Laravel media endpoint to managed Forge S3 storage. The application records file metadata in the database and serves images through a Laravel media proxy route. Product-media mutation is administrator-only.

## 13. Production runtime

The project has a multi-stage production Docker runtime that builds the React storefront and serves it through Laravel PHP. The Laravel routes include API, single-page-app fallback, media proxy, password reset, email verification, and web-app manifest handling.

## 14. Validation completed

The implemented system has been validated with TypeScript checks, PHP syntax checks, Laravel route inspection, browser screenshots, and Vitest regression tests. The latest completed access-flow validation covered **12 passing regression tests**. Manual local validation also exercised registration, CSRF-backed persistent sessions, signed verification links, local password-reset messages, stale-session order rejection, role promotion, and administrator API authorization.

## 15. Items intentionally awaiting a production decision

| Item | What is needed |
|---|---|
| Real email inbox delivery | Choose and configure a transactional email provider or SMTP credentials |
| Live payment collection | Choose Stripe or Shopify and connect the store/payment configuration |
| Public administrator accounts | Register the intended staff email, then promote it through the controlled operator command |
| Publish to a live domain | Save checkpoint is complete; use the workspace Publish control and configure the desired domain |
