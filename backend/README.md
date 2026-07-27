# Backend Support Pack

This folder keeps the support notes and pricing seed data for the Money Tree billing feature.

## What lives here
- `pricing.sql`: plan seeds and subscription-friendly pricing rows for Supabase/Postgres.
- `README.md`: implementation notes for the payment and entitlement flow.

## Billing rules
- Free members can browse the public archive and past coins only.
- Premium members see the next launch teaser, countdown, and join count.
- Admins can inspect pricing, active subscriptions, MRR, and ARR.
- Launch visibility should stay separate from subscription status checks.

## Backend server
- Run `npm run server` to start the local billing server.
- Health check: `GET /health`
- Checkout stub: `POST /api/create-checkout-session`
- Stripe webhook: `POST /api/webhooks/stripe`

## Suggested flow
1. Create or update plans in `pricing.sql`.
2. Sync the app with the `plans` and `subscriptions` tables.
3. Keep launch gating driven by profile access tier and admin role.
4. Use subscription rows only for billing and Money Tree reporting.

## Data contract
- `plans.slug`, `plans.name`, `plans.monthly_price_cents`, `plans.currency`
- `subscriptions.profile_id`, `subscriptions.plan_id`, `subscriptions.status`
- `platform_metrics.premium_users`, `platform_metrics.monthly_mrr`, `platform_metrics.total_volume`

## Notes
- The app already handles the premium launch lock separately from billing.
- Update this folder whenever pricing tiers or billing copy changes.
