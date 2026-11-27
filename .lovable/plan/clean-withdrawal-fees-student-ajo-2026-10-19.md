# Clean Withdrawal Fees + Student Ajo

Two parts: the withdrawal fee upgrade you already approved, plus a redesign of Ajo for students.

---

## Part A — Withdrawal fees (bank gets the exact amount)

**What students see**
- They type an amount, and their bank receives exactly that amount.
- The fee is taken from their KukaPay balance on top. Example: ₦2,000 to the bank costs ₦2,025 from the wallet.
- Fees:
  - ₦1,000 – ₦5,000: flat ₦25
  - ₦5,001 – ₦9,999: 2.5%
  - ₦10,000 – ₦1,000,000: 2.5% + ₦50 stamp duty, capped at ₦2,000 total
- The minimum withdrawal stays at ₦1,000.
- The withdrawal screen shows "Transfer amount / Fee / Total from wallet".
- The "Max" button leaves enough balance to cover the fee.
- If the balance can't cover the fee, the message reads: "You need ₦2,025 total (₦2,000 + ₦25 fee)".
- Receipts, PDFs and emails show the payout and the fee separately.
- A failed withdrawal refunds the full amount taken (payout + fee).

---

## Part B — Ajo for students

**1. Who can create a group**
- Verified course reps, hostel heads and association executives (an admin-granted "Ajo organiser" role), plus admins.
- Organisers need at least Level 2 KYC. Members need at least Level 1.
- Your account keeps full access.

**2. Group setup made for students**
- Contribution: ₦500 – ₦20,000.
- Frequency: weekly (default), bi-weekly or monthly. Daily is removed.
- Group size: 3 – 12 members.
- Groups are invite-only by default, shared by link or code. Public is optional.
- Goal templates: Exam Fees, Hostel Rent, Christmas, Custom.

**3. Protection against people collecting and disappearing**
- **Security deposit:** joining holds one contribution in escrow. It is returned when the cycle ends, or used to cover a missed payment.
- **Automatic debit:** each member's contribution comes out of their wallet on the due date.
- **Grace period:** if the balance is short, the member gets 24 hours of reminders. After that the payment is marked "missed" and the deposit covers it.
- **Payout order:** members who have finished Ajo cycles before get the early slots. First-timers can't take slot 1. Random ballot stays available as an option.
- **Defaulters:** a member with a missed payment that isn't covered is blocked from joining new Ajo and from withdrawing until they settle up.
- **Automatic payout:** the round's recipient is paid automatically once everyone's contribution for that round is in.

**4. Making it engaging**
- An on-time streak badge on the member list.
- A "Paid / Pending / Missed" board for each round, visible to the whole group.
- A completion bonus: a small KukaPay credit for every member when a group finishes with no misses. The amount is set by admin and starts off.

**5. Admin**
- Grant or revoke the Ajo organiser role on the admin users page.
- See all groups, missed payments and defaulters, and resolve them.

**Rollout:** pilot with 2–3 course reps for one cycle, then open to all verified organisers.

---

## Technical details

**Part A**
- `src/lib/fees.ts`: tiered `withdrawalFee(amount)`; the breakdown returns `{ amount, fee parts, totalCharges, totalDebit = amount + fee, netReceive = amount }`. Remove `withdrawalBreakdownFromNet` usage.
- `supabase/functions/process-withdrawal/index.ts`: mirror `computeFeeBreakdown`; check balance ≥ amount + fee; debit amount + fee via the ledger; send the Flutterwave payout for `amount`; store the fee breakdown in withdrawal/transaction metadata.
- Refund paths (`refund_withdrawal_by_id`, FLW webhook FAILED path) credit `amount + fee` for rows using the new model, flagged with metadata `fee_model: 'on_top'`. Legacy rows keep their current behaviour.
- `WithdrawalPage.tsx`: labels, validation, Max, receipt generator. Update the email template in `process-withdrawal`.

**Part B — database (one migration)**
- New role value `ajo_organiser` in `app_role`.
- `ajo_groups`: add `deposit_required bool default true`, `goal_tag text`, `invite_code text unique`, `next_due_at timestamptz`, `completion_bonus_kobo bigint default 0`.
- `ajo_members`: add `deposit_kobo bigint`, `deposit_status text` (held/applied/released), `on_time_streak int default 0`, `completed_cycles int default 0`.
- `ajo_contributions`: use the existing status enum; add `due_at`, `grace_until`.
- New `ajo_defaults` table (`user_id`, `group_id`, `amount_kobo`, `status`) with RLS: owner select, admin all.
- SECURITY DEFINER RPCs, ledger-backed with idempotency keys and escrow account kind:
  - `ajo_join_with_deposit`
  - `ajo_collect_due` (cron: debit due contributions, mark late or missed, apply deposits)
  - `ajo_disburse_round`
  - `ajo_close_cycle` (release deposits, award bonus, bump `completed_cycles`)
- Withdrawal and new-Ajo-join checks refuse users who have an open `ajo_defaults` row.
- Validation triggers enforce the amount, size and frequency limits. No CHECK constraints.

**Part B — server and app**
- `manage-ajo` edge function: creation gated by `has_role(admin|ajo_organiser)` and organiser KYC ≥ 2 (replaces the hard-coded monitor email); invite-code join; slot rules (no slot 1 for first-timers).
- Cron, hourly: `ajo_collect_due`, plus reminder notifications and emails through the existing Brevo helper.
- UI:
  - `CreateAjoPage`: new limits, goal templates, invite toggle.
  - `AjoDetailPage`: round board, streaks, deposit status, invite share.
  - `AjoPage`: "My groups", plus join-by-code.
  - Admin users page: organiser role toggle and Ajo defaulters panel.

**Order of work:** Part A first (small, self-contained), then the Part B migration, then RPCs and cron, then the edge function, then UI.
