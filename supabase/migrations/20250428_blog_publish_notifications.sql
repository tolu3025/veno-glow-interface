
-- Create a function to notify users when a blog article is published
CREATE OR REPLACE FUNCTION public.notify_new_blog_article()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  notification_record RECORD;
BEGIN
    -- Get all user emails from the profiles table
    INSERT INTO notifications (user_email, title, message, type, link)
    SELECT 
        email,
        'New Blog Article Published',
        'Check out our new article: ' || NEW.title,
        'blog_article',
        '/blog/' || NEW.id
    FROM auth.users
    WHERE email IS NOT NULL;
    
    -- For each inserted notification, invoke the email function
    FOR notification_record IN 
      SELECT n.*
      FROM notifications n 
      INNER JOIN auth.users u ON n.user_email = u.email
      WHERE n.created_at >= NOW() - INTERVAL '5 seconds'
        AND n.type = 'blog_article'
        AND link = '/blog/' || NEW.id
    LOOP
      PERFORM net.http_post(
          url := 'https://oavauprgngpftanumlzs.functions.supabase.co/send-notification-email',
          headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'Authorization', 'Bearer ' || current_setting('request.headers')::json->>'apikey'
          ),
          body := json_build_object(
              'to', notification_record.user_email,
              'title', notification_record.title,
              'message', notification_record.message,
              'link', notification_record.link
          )::text
      );
    END LOOP;
    
    RETURN NEW;
END;
$$;

-- Create a trigger to execute the function when a blog article is published
DROP TRIGGER IF EXISTS blog_article_published_trigger ON blog_articles;
CREATE TRIGGER blog_article_published_trigger
AFTER INSERT ON blog_articles
FOR EACH ROW
WHEN (NEW.published = true)
EXECUTE FUNCTION notify_new_blog_article();
