# Fix: crypto (Breet) deposits being auto-reversed

## What's actually happening

Your crypto-to-naira credits are real, but an automated safety job is undoing them.

The hourly "ghost credit" reconciliation job takes **every** deposit from the last 24 hours and asks Flutterwave to verify it. Breet crypto conversions are also stored as deposits (reference `CRYPTO-…`, source `breet`), and Flutterwave has never heard of them — so the job concludes the money was never received, flags it as a ghost credit, and reverses it.

Confirmed on your account:
- 26 Aug 07:44 — ₦17,819.13 crypto credit → reversed at 08:00 by `reason: ghost_credit`
- 24 Aug 11:16 — ₦15,607.50 → same
- 24 Aug 10:16 — ₦20,420.38 → same

Eleven `CRYPTO-` transactions across 5 users have been reversed this way (the May ones are large test-value rows, not real money).

A second, cosmetic problem is visible in your screenshot: the reversal is written as another deposit row, so the history shows it as a green "+₦17,819.13 Deposit Completed" instead of a clear debit labelled "Reversal".

## The fix

1. **Scope the reconciliation job to Flutterwave deposits only.** Skip any deposit whose reference starts with `CRYPTO-` or whose metadata source is `breet` (and skip anything with no Flutterwave reference instead of guessing). Crypto deposits get their own verification path later if wanted — Breet already confirms them at conversion time.
2. **Refund the wrongly reversed crypto credits.** Re-credit the three recent legitimate reversals through the ledger engine (`post_ledger_entry`) with a clear `reversal_correction` reason, mark the original transactions back to completed, and leave the May test rows alone. Exact rows will be listed before running.
3. **Make reversal rows read as debits.** Record reversal transactions with a debit direction and a "Reversal" label so transaction history and the running balance stop showing them as incoming money.
4. **Guard against a repeat:** add a check so `reverse_ghost_credit` refuses to act on non-Flutterwave references, and log skipped rows in the reconciliation run summary.

## Technical notes

- `supabase/functions/reconcile/index.ts`: filter the deposit query/loop by provider before calling `verifyChargeByReference`; count skipped in the run summary.
- Migration: add a provider guard inside `reverse_ghost_credit`; corrective re-credit posted via `post_ledger_entry` so wallet and ledger stay in agreement.
- `src/components/dashboard/TransactionHistory.tsx` / `RecentActivity.tsx`: treat `metadata.reason = 'ghost_credit'` / `-REV` references as debits with a red amount and "Reversal" title.
- Redeploy `reconcile`; verify with a drift check that wallet vs ledger mismatches remain 0.
