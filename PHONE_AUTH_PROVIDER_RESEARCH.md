# Palestinian Phone Authentication Provider Shortlist

## Decision context

Our Kitchen needs customer registration and sign-in through a phone number and an expiring one-time code. The selected provider must deliver reliably to Palestinian mobile numbers, including the `+970` country code and Palestinian operator ranges that may be represented with `+972` prefixes. Administrator access remains a separate email/password and role-based Laravel flow.

No provider can guarantee delivery without an account-specific test on live Jawwal and Ooredoo numbers. The shortlist below distinguishes **provider-hosted verification**—where the provider issues and checks the code—from **local delivery gateways**—where Our Kitchen would need to create, hash, expire, and rate-limit the code itself.

## Shortlist

| Provider | Palestine evidence | OTP model | Best use | Key consideration |
|---|---|---|---|---|
| **Twilio Verify** | Twilio lists Palestine (`+970`) SMS guidance and a Verify geo-permissions control. Twilio also classifies `+97256` and `+97259` as Palestinian mobile prefixes. [1] [2] [3] | Provider-hosted send/check verification | Best initial global provider for the current Laravel implementation | Enable Palestine in Verify geo permissions, use E.164 input, and pilot on both operators. |
| **Ooredoo Palestine Camara OTP** | Ooredoo Palestine’s developer portal explicitly lists a Camara OTP API that sends short-lived SMS OTPs and validates them. [4] | Provider-hosted send/check verification | Strong direct option for Ooredoo subscriber coverage | Confirm commercial access, supported recipient networks, and whether Jawwal numbers are included. |
| **HotSMS / World Links** | The provider identifies itself as certified for Jawwal and Ooredoo SMS in Palestine and offers a secure API. [5] | Delivery API; request OTP/verification API details | Strong locally oriented delivery pilot across Palestinian operators | Confirm API documentation, sender approval, delivery receipts, and whether it validates codes or only sends SMS. |
| **Vonage Verify** | Vonage has specific Palestinian messaging rules. Alphanumeric sender IDs can be overwritten; generic IDs such as `INFO`, `SMS`, and `NOTICE` are prohibited. [6] | Provider-hosted send/check verification with SMS/voice workflow | Credible global fallback, particularly if voice fallback is valuable | Sender presentation requires careful testing in Palestine. |
| **Infobip** | Infobip’s coverage table includes Palestine (`+970`), with international alphanumeric senders supported and no sender registration requirement listed. [7] | Confirm the selected Infobip verification product during sales/trial | Enterprise alternative with detailed country routing controls | Obtain a Palestine OTP trial and verify costs/support before choosing it. |
| **Telesign** | Telesign documents a provider-generated, limited-duration SMS verification API. [8] | Provider-hosted send/check verification | Enterprise-scale alternative | Obtain written confirmation of Palestinian delivery/cost before trialing. |

## Recommended order of evaluation

Start with **Twilio Verify** because it fits the Laravel backend directly: Laravel sends the phone number to the provider, then submits the code back to the provider for approval. No OTP is stored by Our Kitchen. This is simpler and safer than building code generation and storage around a generic SMS API.

In parallel, request a local commercial trial from **HotSMS / World Links** or **Ooredoo Palestine**. A local provider may be a compelling production alternative when the primary customer base is Palestinian, especially if the trial demonstrates stronger Jawwal/Ooredoo delivery or local support. Do not select a local delivery-only gateway for authentication until it confirms that it supports secure code validation, or until a reviewed Laravel code store, expiry policy, and fraud controls are implemented.

## Pilot acceptance test

Before switching the storefront to phone-only customer access, run a small paid or trial pilot with at least five real numbers per supported operator/range. The test should record delivery success, median delivery time, sender appearance, code acceptance, resend behavior, and failure responses. Test Arabic copy, `+970` formatting, and applicable Palestinian `+97256`/`+97259` ranges.

The production flow must have a consent notice before SMS is sent, E.164 normalization, provider-side or server-side rate limiting, short code expiry, a resend cooldown, and a safe fallback support path. OTP messages must remain transactional only; they must not be reused for marketing.

## References

[1] [Twilio: Palestine SMS guidelines](https://www.twilio.com/en-us/guidelines/ps/sms)  
[2] [Twilio: Verify country and region deliverability](https://www.twilio.com/docs/verify/verify-countries-and-regions-deliverability)  
[3] [Twilio: Israel and Palestine prefix update](https://www.twilio.com/en-us/changelog/programmable-sms-geo-permissions-israel-and-palestine-prefix-update)  
[4] [Ooredoo Palestine Developer Portal](https://developer.ooredoo.com/palestine-developer-portal)  
[5] [HotSMS / World Links](https://www.hotsms.ps/portal/hotsms/en)  
[6] [Vonage: Palestinian SMS features and restrictions](https://api.support.vonage.com/hc/en-us/articles/204017433-Palestinian-SMS-Features-and-Restrictions)  
[7] [Infobip: SMS coverage and connectivity](https://www.infobip.com/docs/sms/sms-coverage-and-connectivity)  
[8] [Telesign: SMS Verify API](https://developer.telesign.com/enterprise/docs/sms-verify-api-get-started)
