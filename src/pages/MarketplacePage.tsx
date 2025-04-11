
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, ShoppingBag, Users, CreditCard, Gift, AlertCircle } from "lucide-react";

const MarketplacePage = () => {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate content loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-3">Loading Marketplace</h1>
          <p className="text-muted-foreground">Please wait while we prepare the marketplace for you...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Veno Marketplace</h1>
          <p className="text-muted-foreground">
            Discover educational resources, study materials, and premium content curated for students and educators.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Badge className="bg-veno-primary hover:bg-veno-primary/80">New</Badge>
            <Badge variant="outline">Educational</Badge>
            <Badge variant="outline">Premium</Badge>
          </div>
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Coming Soon
          </Button>
        </div>

        <Separator />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Featured Product 1 */}
          <Card>
            <CardHeader>
              <CardTitle>Premium Test Packages</CardTitle>
              <CardDescription>Comprehensive test preparation materials</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video rounded-md bg-muted flex items-center justify-center mb-4">
                <ShoppingBag className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Our premium test packages include practice questions, answer explanations, and performance tracking.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Learn more</Button>
              <p className="text-lg font-bold">$29.99</p>
            </CardFooter>
          </Card>

          {/* Featured Product 2 */}
          <Card>
            <CardHeader>
              <CardTitle>Study Group Access</CardTitle>
              <CardDescription>Collaborative learning environments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video rounded-md bg-muted flex items-center justify-center mb-4">
                <Users className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Join subject-specific study groups led by experienced educators to enhance your learning experience.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Learn more</Button>
              <p className="text-lg font-bold">$19.99/mo</p>
            </CardFooter>
          </Card>

          {/* Featured Product 3 */}
          <Card>
            <CardHeader>
              <CardTitle>Gift Certificates</CardTitle>
              <CardDescription>The perfect gift for students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video rounded-md bg-muted flex items-center justify-center mb-4">
                <Gift className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Give the gift of education with Veno gift certificates, redeemable for any product in our marketplace.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Purchase</Button>
              <p className="text-lg font-bold">$25-$100</p>
            </CardFooter>
          </Card>
        </div>

        <Card className="p-6 bg-muted/50 border-dashed">
          <div className="flex gap-4 items-start">
            <AlertCircle className="h-6 w-6 text-amber-500 mt-1" />
            <div>
              <h3 className="text-lg font-medium mb-2">Marketplace Coming Soon</h3>
              <p className="text-muted-foreground mb-4">
                We're currently developing our marketplace to provide you with high-quality educational resources. 
                Check back soon for our official launch with a wide range of products and services to enhance your learning experience.
              </p>
              <p className="text-sm text-muted-foreground">
                Expected launch: Q2 2025
              </p>
            </div>
          </div>
        </Card>

        <Separator />

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Secure and convenient payment options</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className="py-2 px-4">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Credit Card
                </Badge>
                <Badge variant="outline" className="py-2 px-4">
                  PayPal
                </Badge>
                <Badge variant="outline" className="py-2 px-4">
                  Bank Transfer
                </Badge>
                <Badge variant="outline" className="py-2 px-4">
                  Mobile Money
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>Common questions about our marketplace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium">When will the marketplace be available?</h4>
                <p className="text-sm text-muted-foreground">Our marketplace is scheduled to launch in Q2 2025.</p>
              </div>
              <div>
                <h4 className="font-medium">What types of products will be available?</h4>
                <p className="text-sm text-muted-foreground">Educational resources, study materials, premium content, and more.</p>
              </div>
              <div>
                <h4 className="font-medium">Can I become a seller?</h4>
                <p className="text-sm text-muted-foreground">Yes, we'll have a partner program for qualified educators and content creators.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MarketplacePage;
