
-- Create a function to notify users when someone replies to their comment
CREATE OR REPLACE FUNCTION public.notify_blog_comment_reply()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only create notification if this is a reply (has parent_id)
    IF NEW.parent_id IS NOT NULL THEN
        -- Get the parent comment and article information
        SELECT c.*, b.title as article_title
        INTO parent_comment
        FROM blog_article_comments c
        JOIN blog_articles b ON c.article_id = b.id
        WHERE c.id = NEW.parent_id;
        
        IF parent_comment IS NOT NULL THEN
            -- Create the notification
            INSERT INTO notifications (user_email, title, message, type, link)
            VALUES (
                parent_comment.user_email,
                'New Reply to Your Comment',
                'Someone replied to your comment on article: ' || parent_comment.article_title,
                'comment_reply',
                '/blog/' || parent_comment.article_id
            )
            RETURNING id INTO notification_id;
            
            -- Send an email notification
            PERFORM net.http_post(
                url := 'https://oavauprgngpftanumlzs.functions.supabase.co/send-notification-email',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || current_setting('request.headers')::json->>'apikey'
                ),
                body := json_build_object(
                    'to', parent_comment.user_email,
                    'title', 'New Reply to Your Comment',
                    'message', 'Someone replied to your comment on article: ' || parent_comment.article_title,
                    'link', '/blog/' || parent_comment.article_id
                )::text
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

