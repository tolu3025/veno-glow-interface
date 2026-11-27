# Kukapay: Ledger-First Fintech Hardening

## What this does and does not include

This project runs on Postgres (Supabase) plus a serverless app runtime. Separate deployable microservices, Kafka/RabbitMQ, Docker and Kubernetes cannot run here, so those are out of scope. Everything that actually protects money is in scope and will be built as clearly separated modules inside the current stack:

| Requested | How it is delivered here |
| --- | --- |
| Wallet / Ledger / Transaction services | Dedicated Postgres modules with one locked posting engine |
| Message queue + async consumers | Durable outbox table drained by a scheduled worker |
| API gateway, per-service APIs | Versioned server-function modules with one validation + error layer |
| Provider adapters (Paystack, Flutterwave, Moniepoint) | Single provider interface, Flutterwave as the first adapter |
| Docker / Kubernetes / Nginx / Redis | Not applicable to this hosting; caching and rate limiting stay in Postgres |

Your three priorities drive the ordering: **balance/ghost-transaction correctness first, then reconciliation and reporting, then security and fraud.**

## Stage 1 — Integer kobo double-entry ledger (the core fix)

Today balances live in `wallets.balance`, `available_balance`, `hold_balance` as decimals, and roughly twenty separate database functions each move money their own way. That is the root of ghost credits and phantom balances: there is no single record of truth to reconcile against.

- Add integer kobo columns (`available_balance_kobo`, `ledger_balance_kobo`, `hold_balance_kobo`) to `wallets` and `merchant_wallets`, populated from current balances in the same migration.
- Create an immutable `wallet_ledger` table: every movement writes exactly one debit and one credit row, sharing an entry group id, with the running balance after each row. No updates or deletes allowed (enforced by trigger).
- Create a single posting engine function `post_ledger_entry(...)` that is the only path allowed to change a balance. It locks the wallet rows with `SELECT ... FOR UPDATE`, checks sufficient funds and limits, writes the paired ledger rows, updates the kobo balances, writes the `transactions` record, and writes an outbox event — all inside one transaction that rolls back completely on any failure.
- Rewrite every existing money function (`safe_credit`, `safe_withdrawal`, `execute_p2p_transfer`, `pay_merchant_from_wallet`, `pay_bill_from_wallet`, `pay_collection_from_wallet`, `purchase_ticket_from_wallet`, `contribute_to_ajo`, `credit_breet_deposit`, escrow accept/release, merchant payouts) to be thin wrappers over the posting engine. Behaviour stays the same for users; the accounting underneath becomes uniform.
- Backfill the ledger from existing `transactions` history so opening balances are explained, and record any unexplained difference as a dated opening-balance entry rather than silently absorbing it.
- Cut over: decimal balance columns become generated read-only views of the kobo values, so existing app code keeps working while nothing can write to them directly.

## Stage 2 — Idempotency and duplicate protection

- `idempotency_keys` table with a unique key per user + operation; the posting engine rejects or replays a repeat instead of double-charging.
- Every webhook and payment call carries a key; `webhook_events` becomes the deduplication source for provider callbacks.
- Duplicate-transaction detection: identical amount + counterparty + purpose within a short window is blocked and flagged.

## Stage 3 — Reconciliation and reporting

- `reconciliation_runs` and per-run line items comparing, for each period: ledger totals vs wallet balances vs provider (Flutterwave) records.
- A scheduled job runs it and raises a flag on any mismatch, replacing the current ad-hoc `reconciliation_flags` usage.
- Admin-facing report queries: daily volume, fees earned, float position, unreconciled items, failed and stuck transactions, settlement due per merchant.
- Stuck-transaction watchdog so withdrawals can no longer sit pending silently.

## Stage 4 — Events and async work

- `event_outbox` table written inside the money transaction (never a separate call, so an event can never disagree with the ledger).
- A scheduled drain worker processes notifications, reconciliation triggers and settlement, with retry counts and a dead-letter state.
- Event types: transfer completed, deposit completed, withdrawal completed, wallet created, payment received, merchant settlement, notification requested.

## Stage 5 — Security and fraud

- Review and tighten role-based access: confirm every privileged path checks `has_role` server-side, never client state.
- Encrypt BVN, NIN and bank account numbers at rest, extending the existing KYC field encryption to all sensitive identifiers.
- Velocity and daily limits enforced inside the posting engine, not in the UI.
- Device fingerprint and IP recorded on every financial action; unusual device or velocity raises a `fraud_events` record.
- Rate limiting on auth, OTP, PIN and payment endpoints; PIN lockout already exists and gets folded into the same limiter.
- Complete audit trail: every financial action and every admin action writes an immutable audit row.

## Stage 6 — Code structure

- Reorganise server code into clear modules — wallet, ledger, payment, transaction, merchant, group payment, virtual account, notification, fraud, settlement, reconciliation, admin, audit — each with a defined interface, shared validation, and one central error handler.
- Provider adapter interface so Paystack or Moniepoint can be added later without touching business logic.
- Structured logging with a correlation id per request, plus health-check and metrics endpoints.

## Risk and rollout

All Kukapay features stay live throughout. Stage 1 is the only stage that touches existing balances; it runs as a single migration that derives kobo values from current balances and is verified by a reconciliation query asserting every wallet's ledger sum equals its balance before the cutover completes. Each later stage is additive and independently reversible.

## Order of work

1. Ledger schema, posting engine, backfill, cutover
2. Idempotency and duplicate detection
3. Reconciliation runs and admin reports
4. Outbox and async workers
5. Security, encryption, fraud limits, audit trail
6. Module restructure, adapters, monitoring
