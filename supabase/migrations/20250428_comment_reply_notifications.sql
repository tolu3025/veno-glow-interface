
-- Create a function to notify users when someone replies to their comment
CREATE OR REPLACE FUNCTION public.notify_blog_comment_reply()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only create notification if this is a reply (has parent_id)
    IF NEW.parent_id IS NOT NULL THEN
        -- Get the parent comment's user email
        INSERT INTO notifications (user_email, title, message, type, link)
        SELECT 
            c.user_email,
            'New Reply to Your Comment',
            'Someone replied to your comment on article: ' || b.title,
            'comment_reply',
            '/blog/' || c.article_id
        FROM blog_article_comments c
        JOIN blog_articles b ON c.article_id = b.id
        WHERE c.id = NEW.parent_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create a trigger to execute the function when a comment reply is created
DROP TRIGGER IF EXISTS blog_comment_reply_trigger ON blog_article_comments;
CREATE TRIGGER blog_comment_reply_trigger
AFTER INSERT ON blog_article_comments
FOR EACH ROW
EXECUTE FUNCTION notify_blog_comment_reply();
