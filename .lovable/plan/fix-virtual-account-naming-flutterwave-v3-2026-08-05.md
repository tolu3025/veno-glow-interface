# Fix virtual account naming (Flutterwave v3)

Right now every KukaPay virtual account shows the Flutterwave merchant name in the sender's bank app. On v3 the account label is controlled by what we send when the account is created, so the fix is on our side — and existing accounts have to be re-issued because v3 has no rename.

## Target naming

- Personal deposit accounts: `Kukapay`
- Collection accounts: `Kukapay/<Collection name>`

Names are sanitised (letters, digits, spaces, `/`, `-` only) and trimmed to the length banks display, so long collection titles get shortened rather than rejected.

## What changes

1. **Shared Flutterwave client** (`_shared/flutterwave-v3.ts`)
   - Send the account label in the field v3 uses for the displayed name on permanent accounts, and stop letting the user's first/last name drive it.
   - Add a sanitise + truncate helper for the label.
   - Return whatever account name Flutterwave echoes back, so we can store and verify it instead of guessing.

2. **Callers**
   - `create-virtual-account`, `verify-kyc`, `admin-operations` (KYC approval path): label `Kukapay`.
   - `manage-collection`: label `Kukapay/<title>`.

3. **Store and show the real name**
   - New nullable columns `virtual_account_name` on `wallets` and `collections`, written from Flutterwave's response.
   - Add Money screen and the collection detail/share sheet show the account name alongside number and bank, so what the user copies matches what the sender sees.

4. **Re-issue existing accounts (everyone)**
   - A one-off admin-triggered job that walks every wallet and active collection with a virtual account, requests a fresh account with the correct label, and swaps in the new number, bank and name.
   - The old number is kept in a `previous_virtual_account_number` column so any late inbound payment to the old account can still be matched by the webhook.
   - Users and collection owners get a notification that their deposit account number changed.
   - Run in batches with per-account error logging; failures are retried on the next run and never wipe an existing account number.

## Technical notes

- Webhook matching stays on our `tx_ref`, plus a fallback lookup against `previous_virtual_account_number`.
- Accounts are only re-issued where an approved NIN/BVN exists; the rest are logged and skipped (they have no working account to break).
- The re-issue job is an admin action, not a cron, so you control when the switch happens.

## Verification

- Create a fresh test wallet account and a test collection, confirm the returned account name reads `Kukapay` and `Kukapay/<title>`.
- Log the raw Flutterwave response for both, so if v3 still overrides the label we can see it immediately rather than after a live transfer.
