
import { useEffect } from "react";

const BlogPage = () => {
  useEffect(() => {
    // Redirect to external blog
    window.location.href = "https://blog.veno.co";
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-3">Redirecting to Blog</h1>
        <p className="text-muted-foreground">Please wait while we redirect you to the Veno Blog...</p>
      </div>
    </div>
  );
};

export default BlogPage;
