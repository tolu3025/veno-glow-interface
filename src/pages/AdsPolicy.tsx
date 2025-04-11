
import React from 'react';
import { Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const AdsPolicy = () => {
  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex items-center mb-8">
        <Button variant="ghost" asChild className="mr-4">
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Advertising Policy</h1>
      </div>
      
      <Separator className="my-6" />
      
      <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
        <h2>Veno Platform Advertising Policy</h2>
        <p>
          Last Updated: April 11, 2024
        </p>
        
        <h3>1. Overview</h3>
        <p>
          This Advertising Policy governs the display of advertisements on the Veno platform, 
          including our website, mobile applications, and other digital properties. By using 
          the Veno platform, you consent to the display of advertisements in accordance with 
          this policy.
        </p>
        
        <h3>2. Types of Advertisements</h3>
        <p>
          Advertisements on the Veno platform may include, but are not limited to:
        </p>
        <ul>
          <li>Display advertisements (banners, tiles, etc.)</li>
          <li>Sponsored content</li>
          <li>Text advertisements</li>
          <li>Video advertisements</li>
          <li>Native advertisements</li>
        </ul>
        
        <h3>3. Ad Placement</h3>
        <p>
          Advertisements may appear in various locations throughout the Veno platform, including:
        </p>
        <ul>
          <li>At the top, bottom, or sides of pages</li>
          <li>Within content feeds</li>
          <li>Between sections of content</li>
          <li>Before, during, or after educational content</li>
          <li>On quiz and test pages</li>
        </ul>
        
        <h3>4. Ad Content Standards</h3>
        <p>
          All advertisements displayed on the Veno platform must adhere to the following standards:
        </p>
        <ul>
          <li>Advertisements must be clearly distinguishable from content</li>
          <li>Advertisements must not be deceptive or misleading</li>
          <li>Advertisements must not contain inappropriate or offensive content</li>
          <li>Advertisements must comply with all applicable laws and regulations</li>
          <li>Advertisements must not interfere with the educational experience</li>
        </ul>
        
        <h3>5. Third-Party Advertising</h3>
        <p>
          Veno uses third-party advertising services, including Google AdSense, to display advertisements.
          These services may use cookies and similar technologies to collect information about your 
          browsing activity for the purpose of delivering relevant advertisements.
        </p>
        
        <h3>6. Ad Blockers</h3>
        <p>
          While we respect your right to use ad blockers, we encourage you to support the Veno platform 
          by allowing advertisements. Advertisements help us provide free access to educational content 
          and maintain the platform.
        </p>
        
        <h3>7. Feedback</h3>
        <p>
          If you encounter an advertisement that you believe violates this policy or is otherwise 
          inappropriate, please report it to us.
        </p>
        
        <h3>8. Changes to This Policy</h3>
        <p>
          We may update this Advertising Policy from time to time. Any changes will be posted on this page, 
          and the "Last Updated" date will be revised accordingly.
        </p>
        
        <h3>9. Contact Us</h3>
        <p>
          If you have any questions or concerns about this Advertising Policy, please contact us at:
        </p>
        <p>
          <Link to="/contact" className="text-primary hover:underline">
            Contact Page
          </Link>
        </p>
      </div>
      
      <Separator className="my-6" />
      
      <div className="flex justify-between items-center">
        <Button variant="outline" asChild>
          <Link to="/privacy-policy">
            Privacy Policy
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/terms-of-service">
            Terms of Service
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default AdsPolicy;
