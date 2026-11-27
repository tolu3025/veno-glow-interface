# Architecture rules

- Keep new Squad integration in server-only helpers called by authenticated TanStack server functions; do not extend legacy Edge Functions, so credentials remain server-side and published runtime compatibility is preserved.
- Keep target provider fees separate from active legacy pricing until server-side cutover; this prevents frontend quotes diverging from actual wallet debits.
- Monnify payouts use authenticated server functions, an atomic ledger debit, a conditional single-attempt claim, and provider-requeried matching before completion/refund; this prevents duplicate payment and unsafe timeout refunds.
- Gate Monnify payout submission on server-side enablement and a configured source account before debiting; this prevents student balances being trapped during provider setup.
- Test pure payment contracts with Bun's built-in test runner; this project has no configured Vitest test suite.
- Never activate a collection withdrawal waiver based on client-supplied flags; require server-verified collection ownership and earmarked available funds.
- Read new deposit details from the owner-scoped Squad account mapping, never overwrite or fall back to legacy wallet account fields; this preserves migration recovery and prevents displaying old numbers on Add Money.- Monnify is the deposit provider: issue reserved accounts only via the authenticated `activateMonnifyAccount` server function and credit deposits only after webhook signature check plus a Monnify transaction requery; this keeps crediting idempotent and provider-verified.
