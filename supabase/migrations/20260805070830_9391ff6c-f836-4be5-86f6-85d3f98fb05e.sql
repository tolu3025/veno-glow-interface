ALTER TABLE public.wallets
  ADD COLUMN IF NOT EXISTS virtual_account_name text,
  ADD COLUMN IF NOT EXISTS previous_virtual_account_number text;

ALTER TABLE public.collections
  ADD COLUMN IF NOT EXISTS virtual_account_name text,
  ADD COLUMN IF NOT EXISTS previous_virtual_account_number text;

CREATE INDEX IF NOT EXISTS idx_wallets_prev_va ON public.wallets (previous_virtual_account_number);
CREATE INDEX IF NOT EXISTS idx_collections_prev_va ON public.collections (previous_virtual_account_number);