
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, GraduationCap, Users, BarChart3, Clock, Heart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import AdPlacement from "@/components/ads/AdPlacement";

const TutorialLearnMore = () => {
  const navigate = useNavigate();
  
  return (
    <div className="container py-6 max-w-4xl">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">About Veno Tutorials</h1>
          <p className="text-muted-foreground">
            Learn more about our educational platform and how it can help you achieve your learning goals.
          </p>
        </div>
        
        <AdPlacement location="header" />
        
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-8 rounded-xl">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="md:w-3/5">
              <h2 className="text-2xl font-bold mb-4">Transform Your Learning Experience</h2>
              <p className="mb-4">
                Veno Tutorials is a comprehensive educational platform designed to help students, 
                educators, and lifelong learners access high-quality educational content across 
                a wide range of subjects and disciplines.
              </p>
              <p>
                Our mission is to make learning accessible, engaging, and effective for everyone, 
                regardless of their background, location, or prior knowledge.
              </p>
            </div>
            <div className="md:w-2/5 flex justify-center">
              <div className="w-40 h-40 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <GraduationCap className="w-20 h-20 text-primary" />
              </div>
            </div>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold mt-4">Why Choose Veno Tutorials?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <BookOpen className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Comprehensive Content</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Access thousands of tutorials covering academic subjects, professional skills, creative arts, and more.
              </CardDescription>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <Users className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Expert Instructors</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Learn from qualified experts and professionals with years of teaching and industry experience.
              </CardDescription>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <BarChart3 className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Track Your Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Monitor your learning journey with comprehensive analytics and performance insights.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
        
        <Separator />
        
        <div className="bg-muted/50 p-8 rounded-xl">
          <h2 className="text-2xl font-bold mb-4">Our Approach to Learning</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-primary" />
                Self-Paced Learning
              </h3>
              <p className="text-muted-foreground">
                Learn at your own pace with flexible schedules and accessible content available 24/7.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2 flex items-center">
                <Heart className="h-5 w-5 mr-2 text-primary" />
                Personalized Experience
              </h3>
              <p className="text-muted-foreground">
                Receive customized recommendations and learning paths tailored to your unique needs and goals.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-card p-8 rounded-xl border">
          <h2 className="text-2xl font-bold mb-4">Get Started Today</h2>
          <p className="mb-6">
            Join thousands of learners who have already enhanced their knowledge and skills through Veno Tutorials.
          </p>
          <div className="flex gap-4 flex-wrap">
            <Button onClick={() => navigate('/ai-tutorial/chat')}>
              <BookOpen className="mr-2 h-4 w-4" /> Chat with AI Tutor
            </Button>
            <Button variant="outline" onClick={() => navigate('/tutorial/info')}>
              View Tutorials
            </Button>
          </div>
        </div>
        
        <AdPlacement location="footer" />
      </div>
    </div>
  );
};

export default TutorialLearnMore;
