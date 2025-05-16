
import React from 'react';
import { BackgroundPaths } from '@/components/ui/background-paths';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const BackgroundPathsPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 relative">
        <BackgroundPaths title="Interactive Paths" />
      </div>
      
      <div className="bg-card shadow-md p-6 rounded-t-lg -mt-24 relative z-10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">About This Component</h2>
          <p className="mb-4">
            The BackgroundPaths component provides an engaging animated background with dynamic paths
            and animated typography. It's perfect for creating visually appealing hero sections,
            landing pages, or special announcements.
          </p>
          
          <h3 className="text-xl font-semibold mb-2">Key Features:</h3>
          <ul className="list-disc pl-5 space-y-2 mb-6">
            <li>Animated SVG paths with dynamic movement</li>
            <li>Letter-by-letter animated text reveal</li>
            <li>Customizable title text</li>
            <li>Responsive design that works on all screen sizes</li>
            <li>Dark mode support</li>
            <li>Interactive call-to-action button</li>
          </ul>
          
          <h3 className="text-xl font-semibold mb-2">Usage Example:</h3>
          <pre className="bg-muted p-4 rounded-md overflow-x-auto mb-6">
            <code>{`import { BackgroundPaths } from '@/components/ui/background-paths';\n\nexport function MyComponent() {\n  return <BackgroundPaths title="Your Custom Title" />;\n}`}</code>
          </pre>
          
          <div className="flex justify-center">
            <Link to="/">
              <Button variant="default">
                Return to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackgroundPathsPage;
