CREATE OR REPLACE FUNCTION public.credit_squad_deposit(_customer_identifier text,_account_number text,_transaction_reference text,_amount_kobo bigint) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user uuid; v_event text := 'squad:' || _transaction_reference; v_ref text := 'SQUAD-' || _transaction_reference; v_post jsonb; v_existing jsonb; v_provider text; v_processed boolean;
BEGIN
 IF _amount_kobo IS NULL OR _amount_kobo<=0 OR length(_transaction_reference) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'Invalid deposit'; END IF;
 SELECT user_id INTO v_user FROM public.squad_virtual_accounts WHERE customer_identifier=_customer_identifier AND account_number=_account_number AND status='ready';
 IF v_user IS NULL THEN RAISE EXCEPTION 'Squad account mapping not found'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(v_event,0));
 SELECT payload,provider,processed INTO v_existing,v_provider,v_processed FROM public.webhook_events WHERE event_id=v_event FOR UPDATE;
 IF FOUND THEN
  IF v_provider IS DISTINCT FROM 'squad' OR v_processed IS DISTINCT FROM true OR v_existing->>'customer_identifier' IS DISTINCT FROM _customer_identifier OR v_existing->>'account_number' IS DISTINCT FROM _account_number OR (v_existing->>'amount_kobo')::bigint IS DISTINCT FROM _amount_kobo THEN RAISE EXCEPTION 'Conflicting duplicate deposit'; END IF;
  RETURN jsonb_build_object('status','duplicate');
 END IF;
 IF EXISTS(SELECT 1 FROM public.transactions WHERE reference=v_ref) THEN RAISE EXCEPTION 'Deposit reference conflict'; END IF;
 v_post:=public.post_ledger_entry(NULL,v_user,_amount_kobo,'deposit',v_ref,jsonb_build_object('provider','squad','provider_reference',_transaction_reference));
 IF NOT COALESCE((v_post->>'success')::boolean,false) THEN RAISE EXCEPTION 'Deposit posting failed'; END IF;
 INSERT INTO public.transactions(user_id,type,amount,fee_amount,status,reference,metadata) VALUES(v_user,'deposit',_amount_kobo::numeric/100,0,'completed',v_ref,jsonb_build_object('provider','squad','provider_reference',_transaction_reference,'entry_group_id',v_post->>'entry_group_id'));
 INSERT INTO public.webhook_events(provider,event_id,processed,signature_valid,payload) VALUES('squad',v_event,true,true,jsonb_build_object('user_id',v_user,'transaction_reference',_transaction_reference,'customer_identifier',_customer_identifier,'account_number',_account_number,'amount_kobo',_amount_kobo));
 PERFORM public.publish_event('wallet.credited',v_user,jsonb_build_object('reference',v_ref,'amount',_amount_kobo::numeric/100));
 RETURN jsonb_build_object('status','success');
END $$;
REVOKE ALL ON FUNCTION public.credit_squad_deposit(text,text,text,bigint) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.credit_squad_deposit(text,text,text,bigint) TO service_role;