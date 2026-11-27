CREATE TABLE public.squad_virtual_accounts (
 user_id uuid PRIMARY KEY, customer_identifier text NOT NULL UNIQUE,
 account_number text UNIQUE, bank_name text, account_name text,
 status text NOT NULL DEFAULT 'creating', last_attempt_at timestamptz NOT NULL DEFAULT now(),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.squad_virtual_accounts TO authenticated;
GRANT ALL ON public.squad_virtual_accounts TO service_role;
ALTER TABLE public.squad_virtual_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY squad_accounts_owner_read ON public.squad_virtual_accounts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE FUNCTION public.squad_account_timestamp() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END $$;
CREATE TRIGGER squad_account_updated BEFORE UPDATE ON public.squad_virtual_accounts FOR EACH ROW EXECUTE FUNCTION public.squad_account_timestamp();
CREATE FUNCTION public.claim_squad_account(_user_id uuid, _customer_identifier text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v public.squad_virtual_accounts%ROWTYPE; v_new boolean;
BEGIN
 INSERT INTO public.squad_virtual_accounts(user_id,customer_identifier) VALUES (_user_id,_customer_identifier) ON CONFLICT(user_id) DO NOTHING;
 v_new:=FOUND;
 SELECT * INTO v FROM public.squad_virtual_accounts WHERE user_id=_user_id FOR UPDATE;
 IF v.status='ready' THEN RETURN jsonb_build_object('action','ready'); END IF;
 IF NOT v_new AND v.last_attempt_at > now()-interval '60 seconds' THEN RETURN jsonb_build_object('action','wait'); END IF;
 UPDATE public.squad_virtual_accounts SET status='creating',last_attempt_at=now() WHERE user_id=_user_id;
 RETURN jsonb_build_object('action',CASE WHEN v_new OR v.status='rejected' THEN 'create' ELSE 'recover' END,'customer_identifier',v.customer_identifier);
END $$;
REVOKE ALL ON FUNCTION public.claim_squad_account(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_squad_account(uuid,text) TO service_role;
CREATE FUNCTION public.credit_squad_deposit(_customer_identifier text,_account_number text,_transaction_reference text,_amount_kobo bigint) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user uuid; v_event text := 'squad:' || _transaction_reference; v_ref text := 'SQUAD-' || _transaction_reference; v_post jsonb; v_existing jsonb;
BEGIN
 IF _amount_kobo IS NULL OR _amount_kobo<=0 OR length(_transaction_reference) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'Invalid deposit'; END IF;
 SELECT user_id INTO v_user FROM public.squad_virtual_accounts WHERE customer_identifier=_customer_identifier AND account_number=_account_number AND status='ready';
 IF v_user IS NULL THEN RAISE EXCEPTION 'Squad account mapping not found'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(v_event,0));
 SELECT payload INTO v_existing FROM public.webhook_events WHERE event_id=v_event AND provider='squad' AND processed=true;
 IF FOUND THEN
  IF v_existing->>'customer_identifier' IS DISTINCT FROM _customer_identifier OR v_existing->>'account_number' IS DISTINCT FROM _account_number OR (v_existing->>'amount_kobo')::bigint IS DISTINCT FROM _amount_kobo THEN RAISE EXCEPTION 'Conflicting duplicate deposit'; END IF;
  RETURN jsonb_build_object('status','duplicate');
 END IF;
 IF EXISTS(SELECT 1 FROM public.transactions WHERE reference=v_ref) THEN RAISE EXCEPTION 'Deposit reference conflict'; END IF;
 v_post:=public.post_ledger_entry(NULL,v_user,_amount_kobo,'deposit',v_ref,jsonb_build_object('provider','squad','provider_reference',_transaction_reference));
 IF NOT COALESCE((v_post->>'success')::boolean,false) THEN RAISE EXCEPTION 'Deposit posting failed'; END IF;
 INSERT INTO public.transactions(user_id,type,amount,fee_amount,status,reference,metadata) VALUES(v_user,'deposit',_amount_kobo::numeric/100,0,'completed',v_ref,jsonb_build_object('provider','squad','provider_reference',_transaction_reference,'entry_group_id',v_post->>'entry_group_id'));
 INSERT INTO public.webhook_events(provider,event_id,processed,signature_valid,payload) VALUES('squad',v_event,true,true,jsonb_build_object('customer_identifier',_customer_identifier,'account_number',_account_number,'amount_kobo',_amount_kobo)) ON CONFLICT(event_id) DO UPDATE SET processed=true,signature_valid=true,payload=excluded.payload;
 PERFORM public.publish_event('wallet.credited',v_user,jsonb_build_object('reference',v_ref,'amount',_amount_kobo::numeric/100));
 RETURN jsonb_build_object('status','success');
END $$;
REVOKE ALL ON FUNCTION public.credit_squad_deposit(text,text,text,bigint) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.credit_squad_deposit(text,text,text,bigint) TO service_role;