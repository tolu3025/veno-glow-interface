import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Rocket, Code, GraduationCap, BookOpenCheck, MessageSquare, Sparkles, ShieldCheck, LayoutDashboard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/providers/AuthProvider";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { VenoLogo } from "@/components/ui/logo";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Trophy } from "lucide-react";

const Index: React.FC = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-12 md:py-24 text-center">
        <div className="container mx-auto px-4">
          <VenoLogo className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Welcome to Veno Education
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto mb-8">
            Your all-in-one platform for learning, practicing, and achieving your educational goals.
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg">
              <Link to="/tutorial">
                <GraduationCap className="w-5 h-5 mr-2" />
                Start Learning
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/cbt/library">
                <BookOpenCheck className="w-5 h-5 mr-2" />
                Practice Tests
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold text-center text-foreground mb-8">
            Explore Our Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature Cards */}
            <Card className="bg-card-gradient border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-primary" />
                  Interactive Tutorials
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Engage with dynamic tutorials covering a wide range of subjects.
                </CardDescription>
                <Button asChild variant="link" className="mt-4">
                  <Link to="/tutorial">Learn More</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card-gradient border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-primary" />
                  CBT Practice Tests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Prepare for exams with our comprehensive Computer-Based Test platform.
                </CardDescription>
                <Button asChild variant="link" className="mt-4">
                  <Link to="/cbt/library">Start Practicing</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card-gradient border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  AI-Powered Assistant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Get instant help and guidance from our intelligent AI assistant.
                </CardDescription>
                <Button asChild variant="link" className="mt-4">
                  <Link to="/bot">Chat Now</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* User Dashboard Preview (Conditional Rendering) */}
      {user && (
        <section className="py-12 md:py-24">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-semibold text-foreground">
                Your Dashboard
              </h2>
              <Button asChild variant="secondary">
                <Link to="/dashboard">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Link>
              </Button>
            </div>
            <Card className="border-2 border-primary/20 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-medium">
                  Welcome Back, {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}!
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Here's a quick overview of your account.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    {user.user_metadata?.avatar_url ? (
                      <AvatarImage src={user.user_metadata.avatar_url} alt={user.email || ""} />
                    ) : (
                      <AvatarFallback>{user.email?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium leading-none">{user.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Account created on {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                    <CardContent className="flex items-center justify-between p-3">
                      <div>
                        <p className="text-sm font-medium">Tutorial Progress</p>
                        <p className="text-2xl font-bold text-primary">85%</p>
                      </div>
                      <GraduationCap className="w-8 h-8 text-muted-foreground opacity-70" />
                    </CardContent>
                  </Card>
                  <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                    <CardContent className="flex items-center justify-between p-3">
                      <div>
                        <p className="text-sm font-medium">Tests Completed</p>
                        <p className="text-2xl font-bold text-primary">12</p>
                      </div>
                      <ShieldCheck className="w-8 h-8 text-muted-foreground opacity-70" />
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Call to Action Section */}
      <section className="py-12 md:py-24 bg-secondary/30 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold text-foreground mb-6">
            Ready to Elevate Your Learning Experience?
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto mb-8">
            Join our community of learners and start your journey towards academic success today!
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg">
              <Link to="/signup">Get Started Now</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-1">
              <Link to="/streaks">
                <Trophy className="w-4 h-4" />
                View Streaks
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
