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
- [x] Align checkout verification prompts with the optional-verification setting so they do not block or mislead customers when verification is disabled.

## Customer Phone Verification Authentication

- [x] Select Twilio Verify as the SMS verification provider and secure credential model for customer one-time codes.
- [x] Confirm Twilio Verify Palestinian mobile delivery guidance, +970 and Palestinian +972 mobile-prefix handling, and required Geo Permissions in the provider research document.
- [x] Defer SMS-provider configuration until credentials are available; no real code is generated or accepted without a provider.
- [x] Defer expiring one-time-code persistence, resend controls, and code-expiry/rate-limit verification until SMS verification is explicitly re-enabled.

## Non-verified Customer Phone Registration

- [x] Add a required normalized and unique Palestinian mobile number to customer identity records without weakening separate administrator authentication.
- [x] Collect the customer phone number during password-protected registration and allow customer sign-in by saved phone number without sending or accepting a verification code.
- [x] Display the saved phone number in the customer account view with clear non-verification status while retaining an email address for account recovery.
- [x] Verify valid Palestinian-format input, duplicate rejection, customer session creation, and administrator access separation.

## Palestinian SMS Gateway Comparison

- [x] Compare reputable SMS verification gateways with documented Palestinian mobile delivery considerations.
- [x] Identify practical trial tests and provider-selection criteria before phone authentication is enabled.

## Dorsha Kitchenware Expansion

- [x] Add Dorsha as a catalog maker with initial spoon/cutlery, cup, plate, and serving categories.
- [x] Add an initial persistent Dorsha kitchenware assortment without user-generated reviews or ratings.
- [x] Feature the expanded kitchenware category discovery on the customer homepage.
- [x] Verify category filtering, persistent catalog data, and responsive homepage presentation.
- [x] Ensure homepage category links preserve their query selection in the shop filter.
- [x] Verify the applied shop query-sync implementation initializes and updates category selection from the current URL.
- [x] Confirm homepage category-link regression coverage and run the full test/type-check suite.

## Timed Discount Campaigns and Customer Countdown

- [x] Confirm time-aware campaign activation for scheduled start and end times without background scheduling.
- [x] Add persistent administrator-managed campaigns with percentage, fixed, and free-shipping promotion options.
- [x] Add configurable campaign targeting for all products, a maker/brand, or one or more categories.
- [x] Add a customer-homepage campaign countdown that changes from launch to expiry timing automatically.
- [x] Validate server-side campaign applicability, time boundaries, discount calculations, and administrator controls.
- [x] Document the administrator workflow for creating, prioritizing, and timing Black Friday or future campaigns.
- [x] Make campaign create, update, and delete wait for Laravel confirmation and roll back the interface when persistence fails.
- [x] Add behavioral Laravel regression coverage for protected campaign CRUD and time-aware server-side order recalculation.
- [x] Capture successful authenticated validation of campaign management and campaign-discount order behavior before release.

## Notification Delivery

- [x] Refresh persisted customer and administrator notifications every 30 seconds while an authenticated session is active, without requiring a manual page reload.
- [x] Add regression coverage for notification polling lifecycle, authenticated role scoping, and persisted-state reconciliation.

## Database Recovery and Security Assessment

- [x] Assess the current backend database recovery posture and distinguish project checkpoints from database backups.
- [x] Review the implemented database access, authentication, authorization, CSRF, storage, and secret-handling controls.
- [x] Document the verified security posture, remaining operational gaps, and a practical backup recommendation.

## Backup Activation and Production Security Verification

- [x] Defer current official Task Data Backup creation at the owner’s request; no export was started.
- [ ] Verify deployed production `APP_DEBUG` and `SESSION_SECURE_COOKIE` values when the owner authorizes production-environment access.
- [ ] Present off-site encrypted backup destination options, obtain owner approval, then implement daily recovery copies with retention and a restore-test procedure.

## MySQL Engine Migration

- [ ] Confirm the target true-MySQL service, secure connection requirements, and maintenance-window approval for a zero-data-loss migration from TiDB.
- [ ] Create and validate a recoverable source-data snapshot before any production connection switch.
- [ ] Provision the target MySQL schema and securely configure its Laravel connection.
- [ ] Migrate customer, commerce, campaign, session, and media-metadata data; reconcile record counts and integrity.
- [ ] Switch the backend to MySQL, validate customer and administrator workflows, and retain a documented rollback path.

## MySQL Migration Package

- [x] Create a target-neutral, MySQL-compatible schema and migration handoff for the current Laravel application.
- [x] Document the secure import, validation, cutover, and rollback process for the user’s local MySQL test run.

## Customer Homepage Discovery Redesign

- [x] Re-sequence the homepage after the hero so customers reach catalog discovery before supporting trust and editorial content.
- [x] Add image-led horizontal scrolling rails for categories, featured products, and Dorsha tableware with responsive card sizing and accessible links.
- [x] Verify the redesigned homepage visually and preserve the responsive Copperline Atelier presentation.

## Repository Synchronization

- [x] Confirm the customer-homepage redesign is synchronized with the connected GitHub `main` branch.

## Order Tracking and Cart Enhancements

- [x] Add a visual delivery-status timeline to the customer order tracking view.
- [x] Implement a persistent "save for later" feature in the shopping cart with move-to-bag and remove-from-saved actions.
- [x] Provide Arabic translations for the tracking timeline and save-for-later cart area.
- [x] Verify the enhanced tracking and cart features visually and with regression coverage.

---

Note: Production-setting verification and automated off-site backup remain intentionally pending until owner-approved production access and storage requirements are provided.
