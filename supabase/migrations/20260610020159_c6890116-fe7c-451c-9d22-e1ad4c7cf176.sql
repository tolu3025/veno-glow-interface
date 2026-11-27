
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='print_uploads_user_insert' AND schemaname='storage') THEN
    CREATE POLICY print_uploads_user_insert ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'print-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='print_uploads_user_select' AND schemaname='storage') THEN
    CREATE POLICY print_uploads_user_select ON storage.objects
      FOR SELECT TO authenticated
      USING (bucket_id = 'print-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='print_uploads_user_delete' AND schemaname='storage') THEN
    CREATE POLICY print_uploads_user_delete ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'print-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='print_uploads_merchant_select' AND schemaname='storage') THEN
    CREATE POLICY print_uploads_merchant_select ON storage.objects
      FOR SELECT TO authenticated
      USING (
        bucket_id = 'print-uploads'
        AND EXISTS (
          SELECT 1 FROM public.merchant_orders mo
          JOIN public.merchants m ON m.id = mo.merchant_id
          WHERE m.user_id = auth.uid() AND mo.print_file_url = storage.objects.name
        )
      );
  END IF;
END $$;
