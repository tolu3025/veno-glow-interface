ALTER TABLE public.collections REPLICA IDENTITY FULL;
ALTER TABLE public.collection_payments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.collections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.collection_payments;