# GoldMart deployment readiness

## Safe rollout order

1. Review the backend pull request (GoldMart-backend #1); its tests use simulated Paystack, not real money.
2. Back up your PostgreSQL database and confirm you can restore it.
3. Confirm the backend's Node 22+ runtime and environment variables against `.env.example`. Never commit private keys.
4. Merge the backend changes, then deploy the backend on Render yourself.
5. Verify `/api/health` returns an actual database-backed healthy response.
6. Verify seller registration, listings, checkout with **Paystack test keys**, signed test webhook, buyer orders, per-seller fulfillment, cancellation/refund **test mode**, messaging and notifications.
7. Review and merge the frontend pull request, then deploy the frontend on Render yourself.
8. Test on your phone (buyer and seller accounts, sold-out products, mixed currency prevention, mobile navigation and account login).
9. Only launch to paying customers after payment-provider settlement terms, operational support, logistics, refunds, rate settings, stock-race handling and security are confirmed.

## Limitations deliberately retained

- Live payments, live refunds and automated seller settlements/transfers are **not enabled**.
- Marketplace seller funds recorded in the database are accounting records, not verified withdrawable balances or actual escrow.
- Paystack USD-labelled catalog pricing converts to NGN at the configured rate; this is not a real-time FX feed and does not charge customers in USD.
- Courier GPS tracking and ETA require an actual logistics-provider integration. Existing status updates are seller-driven.
- Visual search currently previews uploaded photos; image-similarity search requires an image-matching service.
- PWA manifest/icons exist; actual installability needs device/browser checks.
- GitHub checks do not validate Render secrets, payment provider settings, real concurrency or live email sending.

## Smoke-test checklist

- [ ] Back up and migrate the actual database without errors.
- [ ] Register and verify buyer and seller accounts; test login and logout.
- [ ] Upload a seller product and confirm it appears in home, shop and seller dashboard.
- [ ] Change product stock; test adding multiple quantities and cart sync.
- [ ] Add and remove an item from wishlist; verify reload.
- [ ] Use buyer/seller messages and notifications.
- [ ] Execute Paystack **test** checkout; confirm transaction in Paystack dashboard.
- [ ] Check webhook and browser verification create only one order.
- [ ] Verify order details display the authenticated buyer's own products and totals.
- [ ] Test multi-seller order fulfillment and refund/cancellation holds.
- [ ] Confirm admin permissions and ban behavior.
- [ ] Test mobile web experience and installability.
- [ ] Confirm email settings, customer-support contacts and operational policies.

Do not confuse a successful build with a live marketplace launch.
