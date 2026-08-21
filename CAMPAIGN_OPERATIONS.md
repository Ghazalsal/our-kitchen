# Timed Campaign Operations

## Purpose

The **Campaigns** workspace lets an administrator schedule automatic customer promotions without operating a separate background job. A campaign becomes available when its saved start time is reached and stops when its saved end time passes. The same dates control the customer homepage countdown.

## Creating a campaign

Sign in at `/admin/login`, open **Campaigns**, and select **Create campaign**. Give the promotion a clear operational name, such as `Black Friday — Dorsha Tableware`.

| Setting | How it is used |
|---|---|
| Discount type | Choose a percentage, fixed Israeli-shekel amount, or free delivery. |
| Minimum eligible spend | Require the eligible campaign items in the cart to meet a minimum value. |
| Maximum discount | Cap a percentage campaign at a fixed maximum amount when required. |
| Start and end | Set the exact opening and closing date/time for the offer. Confirm the displayed local time before a public launch. |
| Scope | Apply to all products, one or more makers, or one or more product collections. |
| Priority | When campaigns overlap, the highest-priority matching live campaign is selected. |
| Enabled | Pause a campaign without deleting its setup, then enable it when ready. |

## Customer experience

Before an enabled campaign begins, the homepage shows **starts in**. Once it begins, the same section changes to **ends in**. The eligible campaign saving appears in checkout, and Laravel recalculates the campaign from the saved database settings when the order is placed.

The customer storefront gives a currently live campaign precedence over a future campaign. If no campaign is live, the next eligible scheduled campaign is shown.

## Discount rules

The system automatically applies one matching campaign per order, based on priority and targeting. An existing coupon code can still be used in addition to the automatic campaign discount. Keep this in mind when setting a Black Friday percentage, coupon code, or maximum discount.

> Use a short internal test order before a public promotion. Confirm the countdown, targeted products, cart total, delivery amount, and expiry behavior before sharing the campaign publicly.

## Example: Black Friday Dorsha offer

Create a campaign called **Black Friday — Dorsha**, select **Percent**, set the chosen percentage, select **Maker / brand**, choose **Dorsha**, and enter the start and end time. Save it as enabled. The campaign will appear as scheduled until its start time, then apply automatically only to Dorsha items until it ends.
