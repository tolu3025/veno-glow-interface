
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

const AdsPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate(-1)}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Advertising Policy</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ad Policy and Cookie Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="text-lg font-semibold mb-2">About Our Advertisements</h2>
            <p>
              Veno displays third-party advertisements to support our free educational services. 
              These advertisements are delivered by Google AdSense and other trusted advertising partners.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Ad Personalization</h2>
            <p>
              The advertisements displayed may be personalized based on your interests and browsing behavior.
              This personalization improves the relevance of advertisements shown to you.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Cookie Usage</h2>
            <p>
              Our advertising partners, including Google, use cookies to serve ads based on your prior visits to our website
              or other websites. Google's use of advertising cookies enables it and its partners to serve ads based on your 
              visit to our site and/or other sites on the Internet.
            </p>
            <p className="mt-2">
              You can opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" 
              className="text-veno-primary underline" target="_blank" rel="noopener noreferrer">Google's Ads Settings</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Ad Content</h2>
            <p>
              While we work with reputable advertising partners, we do not have complete control over the content of advertisements displayed.
              If you encounter an inappropriate advertisement, please report it directly to Google AdSense.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Your Privacy</h2>
            <p>
              For more information about how we protect your privacy while displaying advertisements, please read our 
              <a href="/privacy-policy" className="text-veno-primary underline ml-1">Privacy Policy</a>.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdsPolicy;
