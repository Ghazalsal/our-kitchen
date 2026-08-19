# Email Verification Rollout

Email verification is **temporarily optional** in Our Kitchen. Customers can register, sign in, and place orders without receiving or completing a verification email. Password-reset messages remain available when a mail provider is configured.

The existing Laravel signed verification routes, user model support, resend endpoint, and verified-order guard remain in the codebase. They are controlled by `KITCHEN_REQUIRE_EMAIL_VERIFICATION`.

| Setting | Current result |
|---|---|
| Unset or `false` | No verification message is generated at registration; unverified customers may check out. |
| `true` | Laravel sends a signed verification message at registration and requires a verified email for checkout. |

## Future activation

After connecting a transactional mail provider and verifying the sender domain, set `KITCHEN_REQUIRE_EMAIL_VERIFICATION=true` through the application’s environment configuration, then restart the service. Customers created before activation can use the existing account-page resend action to request a signed verification link.

> Do not enable mandatory verification until real inbox delivery has been tested with the production sender address.
