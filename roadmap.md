# Squad migration

- [x] Verify official API contracts and prepare tested server-side Squad integration (19 bun tests passing).
- [x] Merchant ID saved; auto-settlement confirmed off; account names show KUKA Technology / KukaPay + student name.
- [x] Build Add Money BVN + DOB activation and verified, idempotent Squad inbound wallet credits; contract tests cover freeze state, amounts, identity, and signature versions.
- [x] Rewrite KYC Level 1 to BVN + DOB + gender + address via Squad activation (instant approval on bank match, rejection recorded with reason); NIN flow removed from the page.
- [ ] Configure Squad webhook URL after publishing: https://app.kukapay.com.ng/api/public/squad-webhook (requires merchant dashboard access).
- [ ] Switch withdrawals to Squad with atomic debits, idempotency, reconciliation, and complete refunds.
- [x] Activate agreed student withdrawal fees (₦15 / ₦35 / 2% + ₦50 capped ₦1,500).
- [ ] Protected collection payout exemption and ₦50 external contributor fee.
- [ ] Verify a real account activation, deposit, withdrawal, and receipt before rollout (requires live provider setup and an authorized test).
- [ ] Review existing security warnings separately (83 pre-existing findings; none introduced by the deposit migration).

Student Ajo redesign remains paused until the banking migration is complete.- [x] Monnify reserved accounts + verified deposit webhook (/api/public/monnify-webhook)
- [ ] Confirm Monnify database update applied, set webhook URL in Monnify dashboard, live ₦100 deposit test
- [ ] Connect withdrawal bank list, name enquiry, submission, and receipt reconciliation to authenticated Monnify functions; keep live submission gated until provider approval.
- [x] User confirmed Monnify third-party disbursement approval and sending-address whitelisting.
- [x] Monnify source wallet account securely saved; user confirmed retained deposit funding.
- [ ] Confirm unattended payout authorization before enabling live payouts.
- [x] Dashboard balance card: show Monnify account instead of old Flutterwave number
- [ ] Verify NIN activation, deposit credit, and withdrawal receipt with authorized real input (external authentication and live provider setup required).
