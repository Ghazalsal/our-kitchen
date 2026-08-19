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
- [x] Save and synchronize the verified web-app manifest update to GitHub.

## Israeli Shekel Currency

- [x] Replace dollar-formatted monetary displays with locale-aware Israeli shekel (ILS) formatting.
- [x] Apply ILS formatting to product, cart, checkout, order-tracking, and admin values.
- [x] Verify pricing and discount calculations display correctly in ILS.

## Secure Customer and Admin Authentication

- [x] Define Laravel customer and administrator roles with secure session-based authentication.
- [x] Add customer registration, login, email verification, and protected account access.
- [x] Add verified password-reset requests and password-update flows with expiry and rate limiting.
- [x] Replace the admin passcode gate with a role-restricted administrator login and protected admin API access.
- [x] Configure environment-backed mail handling with a safe development log transport for verification and password recovery.
- [x] Verify customer registration, email verification, reset-password request, and administrator authorization flows end to end.
- [x] Protect checkout on both client and server with a signed-in, email-verified customer account requirement.
- [x] Add the confirmation-gated `kitchen:promote-admin` operator command and administrator operations documentation.

## Local Mail Validation

- [x] Configure Laravel’s local mail log for safe development validation of verification and password-reset messages.
- [x] Keep production email delivery environment-driven and document the provider handoff required for real inbox delivery.

## Separate Administrator Sign-in Experience

- [x] Add a dedicated `/admin/login` route and administrator-specific sign-in page.
- [x] Keep customer sign-in and registration on customer-only account routes.
- [x] Route authorized administrators to `/admin` and explain role restrictions without exposing a shared credential.
- [x] Verify the distinct customer and administrator sign-in journeys with regression coverage.

## Delivered Feature Inventory

- [x] Compile and deliver a complete organized inventory of the features implemented across the storefront, Laravel backend, security, administration, storage, localization, and operations.

## Password Visibility Controls

- [x] Add accessible show/hide password controls to customer and administrator sign-in fields.
- [x] Add accessible show/hide controls to registration, confirmation, and password-reset fields.
- [x] Verify password controls preserve form behavior and render clearly on desktop and mobile.
- [x] Validate password visibility controls on customer and administrator forms at a mobile viewport.
- [x] Add regression coverage for the toggle button behavior and non-submit semantics.

## Registration CSRF Reliability

- [x] Diagnose the reported CSRF token mismatch during customer registration.
- [x] Correct the browser/Laravel CSRF session flow without weakening request protection.
- [x] Verify a browser-equivalent registration request succeeds with persistent session authentication.

## Administrator Sign-in CSRF Reliability

- [x] Diagnose the reported CSRF token mismatch during administrator sign-in.
- [x] Correct the administrator authentication flow without weakening CSRF protection.
- [x] Verify administrator login succeeds with a fresh CSRF token and administrator role session.

## Arabic-first Experience and Image Optimization Guidance

- [x] Make Arabic the default interface language for new Our Kitchen visitors while keeping English available.
- [x] Verify Arabic-first RTL layout and language switching across storefront and administrator screens.
- [x] Document a scalable external image optimization pipeline for large product catalogs.
- [x] Verify Arabic-to-English and English-to-Arabic resolution preserves the selected language across navigation through unit tests.
- [x] Confirm explicit English selection renders LTR correctly after Arabic-first initialization.
- [x] Verify language preference persistence through storefront and administrator route resolution after a language choice.

## Customer Verification Email Delivery

- [x] Confirm customer registration generates a signed Laravel verification message in the local mail log.
- [x] Verify the configured development mail destination and document the requirement for real inbox delivery.

## Optional Email Verification Rollout

- [x] Make email verification optional for registration and checkout while retaining the underlying signed verification flow.
- [x] Add a documented configuration setting to re-enable mandatory verification when transactional email is connected.
- [x] Verify unverified customers can register and complete protected checkout while administrator role access remains unchanged.

## Customer Phone Verification Authentication

- [x] Select Twilio Verify as the SMS verification provider and secure credential model for customer one-time codes.
- [ ] Confirm the selected provider supports reliable delivery to Palestinian mobile numbers and document any country-code or registration constraints.
- [ ] Securely configure the Twilio Account SID, Auth Token, and Verify Service SID.
- [ ] Add phone-number identity and expiring one-time-code persistence while preserving the separate email/password administrator route.
- [ ] Build phone-number customer registration and sign-in screens with resend cooldown and accessible code entry.
- [ ] Verify rate limits, code expiry, customer session creation, and administrator access separation.

## Palestinian SMS Gateway Comparison

- [x] Compare reputable SMS verification gateways with documented Palestinian mobile delivery considerations.
- [x] Identify practical trial tests and provider-selection criteria before phone authentication is enabled.
