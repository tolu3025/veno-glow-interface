
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

const TermsOfService = () => {
  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <Card className="border border-border">
        <CardContent className="p-6 space-y-6">
          <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Agreement to Terms</h2>
            <p>
              By accessing or using Veno Education services, including our website, CBT platform, rewards system,
              and marketplace (collectively, the "Services"), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, do not use our Services.
            </p>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Description of Services</h2>
            <p>Veno Education provides the following services:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>CBT Platform:</strong> Online computer-based testing and assessment tools for educational purposes.
              </li>
              <li>
                <strong>Rewards System:</strong> A points-based reward system for user engagement and achievements.
              </li>
              <li>
                <strong>Digital Marketplace:</strong> A platform for purchasing educational materials and resources.
              </li>
              <li>
                <strong>Certification:</strong> Digital certificates for completed courses and achievements.
              </li>
              <li>
                <strong>Educational Blog:</strong> Articles and resources related to education.
              </li>
            </ul>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">User Accounts</h2>
            <p>
              To access certain features of our Services, you must register for an account. You agree to provide 
              accurate and complete information when creating your account and to update your information to keep 
              it accurate and current. You are responsible for safeguarding your password and for all activities 
              that occur under your account.
            </p>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Rewards System</h2>
            <p>
              Our rewards system allows users to earn points for various activities. Points can be redeemed for 
              rewards as specified on our platform. We reserve the right to modify the points system, including 
              point values, redemption options, and expiration policies at any time.
            </p>
            <p>
              Points have no cash value and cannot be transferred, sold, or exchanged outside of our platform.
            </p>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Intellectual Property</h2>
            <p>
              The Services and their original content, features, and functionality are owned by Veno Education 
              and are protected by international copyright, trademark, patent, trade secret, and other intellectual 
              property laws. You may not copy, modify, distribute, sell, or lease any part of our Services without 
              our explicit permission.
            </p>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">User Content</h2>
            <p>
              When you upload content to our platform, you grant us a worldwide, non-exclusive, royalty-free license 
              to use, reproduce, modify, adapt, publish, translate, and distribute that content in connection with 
              providing our Services. You represent and warrant that you own or have the necessary rights to grant 
              us this license.
            </p>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Prohibited Activities</h2>
            <p>You agree not to engage in any of the following activities:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violating any applicable laws or regulations</li>
              <li>Attempting to interfere with or compromise the system integrity or security</li>
              <li>Using the Services for any illegal purposes</li>
              <li>Posting or transmitting malicious code or viruses</li>
              <li>Attempting to gain unauthorized access to other user accounts</li>
              <li>Engaging in any activity that disrupts the Services</li>
              <li>Impersonating another person or entity</li>
            </ul>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to the Services at any time, without notice, 
              for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, 
              or for any other reason at our discretion.
            </p>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Changes to Terms</h2>
            <p>
              We may modify these Terms at any time. We will provide notice of any material changes through our 
              Services or via email. Your continued use of the Services after such modifications constitutes your 
              acceptance of the updated Terms.
            </p>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
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

export default TermsOfService;
