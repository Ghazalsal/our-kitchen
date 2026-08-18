# Our Kitchen — secure account operations

## Administrator promotion

Customer registration **never** grants administrative access. A deployment operator must promote a real, registered account using the Laravel command below from the project root:

```bash
php laravel/artisan kitchen:promote-admin admin@example.com
```

The command asks for confirmation, fails safely if no account exists, and only changes the selected user’s `role` from `customer` to `admin`. After promotion, the person must sign in normally before accessing `/admin`; there is no shared passcode or public elevation route.

For an audited emergency database operation, use the managed database console and substitute the verified registered email:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

## Email delivery

Development uses Laravel’s **log** mail transport, so verification and recovery messages are written to `laravel/storage/logs/laravel.log` rather than sent to a real inbox. This permits safe validation without an SMTP account.

Before production use, configure a transactional mail provider through environment variables. At minimum, set `APP_URL` to the public storefront URL and provide `MAIL_MAILER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_ENCRYPTION`, `MAIL_FROM_ADDRESS`, and `MAIL_FROM_NAME`. The app does not include any mail-provider credentials in source control.

> The verification and reset links are time-limited, and the login, verification-resend, and reset-request endpoints are rate limited through Laravel’s database-backed cache.
