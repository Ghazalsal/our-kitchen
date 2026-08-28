# Our Kitchen — True MySQL Migration Handoff

**Prepared:** 25 August 2026  
**Current source:** Managed TiDB (MySQL-compatible)  
**Target:** A user-supplied, reachable MySQL 8.0+ database  
**Status:** **Prepared for migration; not yet switched.** The live application remains connected to the current source database until the target is configured and the import has passed validation.

## What is ready now

The Laravel application is already structurally compatible with MySQL: its active connection driver is `mysql`, its data types use MySQL-compatible Laravel migrations, and the production PHP runtime includes the `pdo_mysql` extension. No frontend changes are required for the engine cutover.

The full target schema is represented by the version-controlled Laravel migrations in `laravel/database/migrations/`. On an empty MySQL target, Laravel will create the following application tables:

| Data group | Tables |
|---|---|
| Accounts and security | `users`, `password_reset_tokens`, `sessions`, `cache`, `cache_locks` |
| Catalog | `kitchen_categories`, `kitchen_products`, `kitchen_coupons`, `kitchen_media_files` |
| Commerce | `kitchen_carts`, `kitchen_orders`, `kitchen_order_lines` |
| Customer communication | `kitchen_messages`, `kitchen_notifications` |
| Promotions | `kitchen_campaigns` |
| Laravel queue infrastructure | `jobs`, `job_batches`, `failed_jobs` |

> **Important:** This package does not export, copy, or expose customer data. A production data transfer must occur only after a MySQL target is available, a current source snapshot is secured, and a cutover window is approved.

## Source preflight baseline

The following non-sensitive counts were recorded from the current source on 25 August 2026. Re-run the count query immediately before the actual cutover, since customer activity can change these values.

| Table | Recorded rows |
|---|---:|
| `users` | 2 |
| `sessions` | 504 |
| `cache` | 12 |
| `cache_locks` | 0 |
| `password_reset_tokens` | 0 |
| `kitchen_categories` | 8 |
| `kitchen_products` | 12 |
| `kitchen_coupons` | 3 |
| `kitchen_carts` | 11 |
| `kitchen_orders` | 0 |
| `kitchen_order_lines` | 0 |
| `kitchen_messages` | 0 |
| `kitchen_notifications` | 1 |
| `kitchen_media_files` | 1 |
| `kitchen_campaigns` | 0 |

The source does not currently contain `jobs`, `job_batches`, or `failed_jobs`. Laravel will create them on the target. They can remain empty unless queue processing is deliberately enabled later.

## What must move—and what must not

| Category | Handling at cutover | Reason |
|---|---|---|
| Customer accounts (`users`) | **Migrate.** | Preserves customer, administrator, password-hash, role, verification, and mobile-number records. |
| Catalog and media metadata | **Migrate.** | Preserves products, categories, coupons, stock, image keys, and managed-storage URLs. Image bytes remain in managed object storage. |
| Carts, orders, order lines, messages, notifications, campaigns | **Migrate.** | Preserves commerce history, support context, discounts, and campaign configuration. |
| `sessions` | **Do not migrate. Invalidate.** | Avoids copying active session material to a new database and forces safe re-authentication after cutover. |
| `cache`, `cache_locks` | **Do not migrate. Rebuild.** | Cache and rate-limit state are ephemeral. |
| `password_reset_tokens` | **Do not migrate. Invalidate.** | Ensures old reset links cannot survive an engine migration. |
| Queue tables | **Create empty.** | They are not present on the source and should not introduce stale jobs. |

## Local environment setup (.env)

To run Our Kitchen on your local device with MySQL, you will need a `.env` file in the `laravel/` directory. **Never commit this file to Git.** You can use the following template:

```env
APP_NAME="Our Kitchen"
APP_ENV=local
APP_KEY=base64:YOUR_GENERATED_APP_KEY
APP_DEBUG=true
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_local_db_name
DB_USERNAME=your_local_username
DB_PASSWORD=your_local_password
SESSION_DRIVER=database
CACHE_STORE=database
```

## Required destination details

The target must be **MySQL 8.0 or newer**, reachable from the deployed Laravel service over TLS. Create a database and a least-privilege application user with permissions to create and operate the listed application tables. Do not send the password in chat or commit it to Git.

| Required value | Example format | Notes |
|---|---|---|
| Hostname | `mysql.example.com` | Publicly or privately reachable from the deployed application—not only from a laptop. |
| Port | `3306` | Use the provider’s documented port if different. |
| Database | `our_kitchen` | An empty database is preferred. |
| Username and password | Provider-issued values | Store only in encrypted project environment settings. |
| TLS requirement | CA certificate / TLS URL options | Required whenever the provider requires it; do not disable certificate verification. |
| Maintenance window | Approved date/time | Needed to prevent new writes during final sync and switch. |

## Safe execution sequence

1. **Prepare the target without changing the live application.** Configure the target connection only in secure project environment settings. Run Laravel migrations against the empty MySQL database:

   ```bash
   cd laravel
   php artisan migrate --force
   ```

2. **Create a fresh source snapshot.** Capture an encrypted, access-controlled export from the existing managed database using a trusted administrative path. Retain it until the MySQL target has passed both data and application validation.

3. **Begin the approved maintenance window.** Temporarily prevent checkout and administrator mutations. Re-run source record counts immediately before final export.

4. **Import only the persistent application data.** Move the tables marked “Migrate” above in dependency-aware order: customers/catalog first, then carts/orders, then messages/notifications/campaigns/media metadata. Do not import sessions, cache, or reset tokens.

5. **Reconcile data.** Compare row counts on both systems and spot-check: administrator role, a customer login after re-authentication, product/category relations, image URLs, coupon rules, campaign timing, and order ownership.

6. **Switch Laravel only after validation succeeds.** Set the production `DATABASE_URL` to the MySQL connection using secure environment settings; retain the old TiDB connection outside the codebase for the rollback window.

7. **Post-cutover verification.** Confirm sign-in, password recovery, product browsing, cart handling, customer checkout, campaign saving, administrator product uploads, order-status updates, message visibility, and notification polling. Monitor Laravel logs for connection or schema errors.

## Rollback rule

Do **not** delete or overwrite the current TiDB source during migration. If the target fails record reconciliation or application validation, restore the previous production database connection before reopening writes. Any writes made only on the new MySQL target must be assessed before rollback to avoid losing new orders.

## Security requirements for the final switch

- Use TLS for the MySQL connection and the provider’s CA certificate where required.
- Store the connection string and CA material only in encrypted project environment settings.
- Set `APP_DEBUG=false` and `SESSION_SECURE_COOKIE=true` in production.
- Regenerate/invalidate sessions after cutover, as described above.
- Restrict the MySQL network allowlist to the deployment environment; never expose port 3306 broadly to the internet.
- Use a unique, least-privilege database user rather than a provider root account.
- Keep the source snapshot encrypted and restrict access to authorized operators.

## Cutover acceptance checklist

- [ ] Target MySQL 8.0+ endpoint is reachable over TLS.
- [ ] Source snapshot is complete, encrypted, and retained.
- [ ] Target migrations completed successfully.
- [ ] Persistent-table counts and relationships reconcile.
- [ ] Sessions, cache, and reset tokens were deliberately invalidated rather than copied.
- [ ] Customer and administrator journeys work against MySQL.
- [ ] Application logs show no database, authentication, media, campaign, or order errors.
- [ ] A documented rollback window remains open before the old source is retired.
