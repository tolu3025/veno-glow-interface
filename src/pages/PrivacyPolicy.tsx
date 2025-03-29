
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

const PrivacyPolicy = () => {
  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <Card className="border border-border">
        <CardContent className="p-6 space-y-6">
          <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Introduction</h2>
            <p>
              This Privacy Policy explains how Veno Education ("we", "us", or "our") collects, uses, shares, 
              and protects your personal information when you use our website and educational services, 
              including our CBT platform, rewards system, and marketplace.
            </p>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Information We Collect</h2>
            <p>We collect the following types of information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Account Information:</strong> When you register, we collect your name, email address, 
                and password.
              </li>
              <li>
                <strong>Profile Information:</strong> Information you provide in your user profile, including 
                educational background and profile picture.
              </li>
              <li>
                <strong>Usage Data:</strong> Information about how you use our platform, including tests taken, 
                questions answered, and rewards earned.
              </li>
              <li>
                <strong>Performance Data:</strong> Your scores, progress, and achievements within our educational 
                platform.
              </li>
              <li>
                <strong>Transaction Data:</strong> If you make purchases, we collect payment and billing information.
              </li>
            </ul>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, maintain, and improve our educational services</li>
              <li>Track your progress and customize your learning experience</li>
              <li>Process transactions and manage your account</li>
              <li>Award points and manage the rewards system</li>
              <li>Generate certificates based on your achievements</li>
              <li>Analyze usage patterns to improve our platform</li>
              <li>Communicate with you about updates, features, and offers</li>
            </ul>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Data Storage and Security</h2>
            <p>
              We use Supabase to store user data securely. All data is encrypted in transit and at rest. 
              We implement appropriate technical and organizational measures to protect your personal information 
              against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Your Rights</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access the personal information we hold about you</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Delete your personal information</li>
              <li>Restrict or object to processing of your information</li>
              <li>Request a copy of your information in a structured, machine-readable format</li>
            </ul>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
              the new Privacy Policy on this page and updating the "Last Updated" date.
            </p>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
              <br />
              Email: support@venoeducation.com
            </p>
          </section>
          
          <p className="text-sm text-muted-foreground mt-8">Last Updated: May 10, 2024</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;
