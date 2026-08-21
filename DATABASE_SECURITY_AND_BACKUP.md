# Our Kitchen Database Security and Backup Assessment

**Assessment date:** 21 August 2026  
**Scope:** Laravel backend, managed TiDB/MySQL-compatible application database, customer data, order data, sessions, and product-media metadata.

## Direct answer

The backend implements a **good application-security baseline**, but there is **not yet a verified, standalone, recurring database-backup policy** in the project. The saved project checkpoints preserve source code and configuration history; they should **not** be treated as restorable customer/order database backups.

> A production database is only as recoverable as its most recent tested data backup. Application code checkpoints are valuable, but they do not replace a database recovery plan.

## What is protected today

| Control | Current implementation | Assessment |
|---|---|---|
| Database credentials | Laravel reads `DATABASE_URL` and database settings from server-side environment variables. They are not embedded in the React client. | Implemented. |
| Password storage | Customer and administrator passwords are hashed through Laravel’s `Hash::make`; plaintext passwords are not stored by the application. | Implemented. |
| Authentication | Customer and administrator accounts use Laravel’s server-side session guard and database-backed sessions. | Implemented. |
| Session protection | Sessions are encrypted by default, HTTP-only, and `SameSite=Lax`; the session is regenerated after sign-in and invalidated on sign-out. | Implemented, with a production setting to confirm below. |
| CSRF protection | State-changing browser requests obtain a server-issued CSRF token and retry a single stale-token response without bypassing protection. | Implemented. |
| Administrator access | Administrator actions require both an authenticated session and a server-side `role = admin` check. Customer order/message access is ownership-scoped. | Implemented. |
| Password recovery | Reset tokens expire after 60 minutes and are throttled; account and sign-in attempts are rate-limited. | Implemented. |
| Product media | Uploads are restricted to administrators and stored through managed object storage; the database keeps metadata, not image bytes. | Implemented. |
| Error disclosure | Laravel defaults `APP_DEBUG` to `false`, which avoids detailed stack traces unless production configuration overrides it. | Implemented default; confirm deployment value. |

## What is **not** yet confirmed

| Area | Current status | Why it matters |
|---|---|---|
| Automated database backups | **Not evidenced in this repository.** No SQL dump, restore job, retention policy, or successful restore record was found. | Orders, registrations, notifications, and messages could be unrecoverable after a database incident without an external provider backup. |
| Point-in-time recovery | **Not confirmed.** | A nightly export alone may lose same-day orders; point-in-time recovery reduces that loss window. |
| Database encryption in transit and at rest | **Not verifiable from application source.** | This is controlled by the managed database platform and its connection configuration, not by the React frontend. |
| Production-only cookie transport | The session config honors `SESSION_SECURE_COOKIE`, but its deployed value has not been independently confirmed. | It should be `true` on the public HTTPS site to prevent session cookies being sent over HTTP. |
| Restore drill | **Not yet performed.** | A backup that has not been restored in a safe environment is not fully proven. |

## Backup position and recommendation

The project currently has versioned checkpoints, but those are **not a substitute for a database backup**. For the current Manus data-separation process, a manually created **Task Data Backup** includes website code, uploaded files, database contents, secrets, and integration settings. It is a fixed point-in-time snapshot, so new orders and registrations made after the export are not included. [1] [2]

For a live store, create a fresh website Task Data Backup now and repeat it after any material catalog, account, or order activity. The official guidance states that affected users must complete the export before **23 August 2026, 7:59 a.m. Singapore Time**; account email and in-app notices determine whether this applies. [1] [3]

| Priority | Action | Owner | Completion evidence |
|---|---|---|---|
| Critical | Create and keep a current Task Data Backup through the official backup page. | Store owner | Complete export package retained in the chosen destination. |
| Critical | Confirm whether the managed TiDB service provides automatic backups, retention, and point-in-time restore; obtain the answer from the platform/provider record. | Store owner / platform operator | Written retention and recovery-policy confirmation. |
| High | Confirm public production configuration uses `APP_DEBUG=false` and `SESSION_SECURE_COOKIE=true`. | Store owner / deployment operator | Deployment configuration review. |
| High | Test restoring a copy of the latest backup in a non-production environment before relying on it. | Store owner / technical operator | Documented restore test with expected order/user counts. |
| Medium | Establish an operational export cadence that matches the acceptable data-loss window, and create an additional export before major campaigns such as Black Friday. | Store owner | Dated recovery runbook and export records. |

## Operational constraints

Do not download, expose, or store database credentials in the storefront, GitHub repository, screenshots, or chat. Do not rely on a code-only export: it does not contain the live database, uploaded product files, secrets, or managed services. [1]

If an account is subject to the current platform restoration process, restoration must be done with the correct, complete backup package set and can only be completed once. [1] [4]

## References

[1] [Manus website backup and restoration guidance](https://help.manus.im/en/articles/16147892-service-change-overview-how-to-back-up-your-data)  
[2] [Website-specific backup contents and snapshot limitations](https://help.manus.im/en/articles/16147892-service-change-overview-how-to-back-up-your-data)  
[3] [Official service-change overview and account-impact guidance](https://help.manus.im/en/articles/16147831-service-change-overview-what-s-happening-and-am-i-affected)  
[4] [Official restoration guidance](https://help.manus.im/en/articles/16147895-service-change-overview-how-to-restore-your-data)
