
-- service-attachments: only participants of the related request may read/write.
CREATE POLICY "service_attachments read by participants"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'service-attachments'
    AND EXISTS (
      SELECT 1 FROM public.service_requests r
      WHERE r.id::text = split_part(name, '/', 1)
        AND (r.student_id = auth.uid()
             OR EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = r.merchant_id AND m.user_id = auth.uid()))
    )
  );

CREATE POLICY "service_attachments write by participants"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'service-attachments'
    AND EXISTS (
      SELECT 1 FROM public.service_requests r
      WHERE r.id::text = split_part(name, '/', 1)
        AND (r.student_id = auth.uid()
             OR EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = r.merchant_id AND m.user_id = auth.uid()))
    )
  );

-- Print files: customer uploads under {user_id}/...; merchant can read files referenced by their orders.
CREATE POLICY "print_files owner read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'print-files' AND auth.uid()::text = split_part(name, '/', 1));

CREATE POLICY "print_files owner write"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'print-files' AND auth.uid()::text = split_part(name, '/', 1));

CREATE POLICY "print_files merchant read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'print-files'
    AND EXISTS (
      SELECT 1 FROM public.merchant_orders o
      JOIN public.merchants m ON m.id = o.merchant_id
      WHERE m.user_id = auth.uid()
        AND o.print_file_url LIKE '%' || name
    )
  );
