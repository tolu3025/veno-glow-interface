
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Search, Laptop, Code, GraduationCap, Briefcase, PenTool, LineChart, Heart, Camera, Music, Palette, Wrench } from "lucide-react";
import AdPlacement from "@/components/ads/AdPlacement";

interface Category {
  name: string;
  icon: React.ElementType;
  description: string;
  tutorialCount: number;
  color: string;
}

const TutorialCategoriesPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Maintenance mode flag - set to true to enable maintenance mode
  const isMaintenanceMode = true;
  
  const categories: Category[] = [
    {
      name: "Academic",
      icon: GraduationCap,
      description: "Mathematics, Science, History, Literature and other academic subjects",
      tutorialCount: 45,
      color: "bg-blue-500"
    },
    {
      name: "Technology",
      icon: Laptop,
      description: "Programming, Web Development, Mobile Apps, and Technical Skills",
      tutorialCount: 38,
      color: "bg-indigo-500"
    },
    {
      name: "Business",
      icon: Briefcase,
      description: "Marketing, Management, Finance, Entrepreneurship",
      tutorialCount: 29,
      color: "bg-green-500"
    },
    {
      name: "Design",
      icon: PenTool,
      description: "UI/UX Design, Graphic Design, Typography, and Visual Arts",
      tutorialCount: 24,
      color: "bg-orange-500"
    },
    {
      name: "Programming",
      icon: Code,
      description: "Languages, Frameworks, Best Practices, and Software Development",
      tutorialCount: 31,
      color: "bg-purple-500"
    },
    {
      name: "Data Science",
      icon: LineChart,
      description: "Analytics, Visualization, Machine Learning, and AI",
      tutorialCount: 18,
      color: "bg-red-500"
    },
    {
      name: "Health & Wellness",
      icon: Heart,
      description: "Fitness, Nutrition, Mental Health, and Medical Knowledge",
      tutorialCount: 15,
      color: "bg-pink-500"
    },
    {
      name: "Photography",
      icon: Camera,
      description: "Digital Photography, Editing, Composition, and Visual Storytelling",
      tutorialCount: 12,
      color: "bg-cyan-500"
    },
    {
      name: "Music",
      icon: Music,
      description: "Instruments, Music Theory, Production, and Audio Engineering",
      tutorialCount: 14,
      color: "bg-amber-500"
    },
    {
      name: "Art & Creativity",
      icon: Palette,
      description: "Drawing, Painting, Crafts, and Creative Expression",
      tutorialCount: 20,
      color: "bg-teal-500"
    }
  ];
  
  const filteredCategories = searchQuery 
    ? categories.filter(category => 
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : categories;

  // Show maintenance mode if enabled
  if (isMaintenanceMode) {
    return (
      <div className="container py-6">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Tutorial Categories</h1>
            <p className="text-muted-foreground">
              Browse our comprehensive collection of educational content organized by subject area.
            </p>
          </div>
          
          <AdPlacement location="header" />
          
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-orange-100 dark:bg-orange-900/20 rounded-full p-6">
                  <Wrench className="h-12 w-12 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <CardTitle className="text-2xl">Under Maintenance</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                We're currently updating our tutorial categories to bring you better content and improved organization. 
                This section will be back online soon!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate('/tutorial')}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Browse All Tutorials
                </Button>
                <Button variant="outline" onClick={() => navigate('/')}>
                  Return to Home
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Thank you for your patience while we improve your learning experience.
              </p>
            </CardContent>
          </Card>
          
          <AdPlacement location="footer" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Tutorial Categories</h1>
          <p className="text-muted-foreground">
            Browse our comprehensive collection of educational content organized by subject area.
          </p>
        </div>
        
        <AdPlacement location="header" />
        
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search categories..."
            className="pl-10 w-full rounded-md border border-input px-4 py-2 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Separator />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <Card 
              key={category.name} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/tutorial?category=${encodeURIComponent(category.name)}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className={`rounded-lg w-10 h-10 flex items-center justify-center text-white ${category.color}`}>
                    <category.icon size={20} />
                  </div>
                  <Badge variant="outline">{category.tutorialCount} Tutorials</Badge>
                </div>
                <CardTitle className="mt-4">{category.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/tutorial?category=${encodeURIComponent(category.name)}`)
                  }}
                >
                  <BookOpen size={16} className="mr-2" />
                  Browse Tutorials
                </Button>
              </CardContent>
            </Card>
          ))}
          
          {filteredCategories.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center p-8">
              <Search size={48} className="text-muted-foreground opacity-20 mb-4" />
              <h3 className="text-xl font-medium mb-2">No categories found</h3>
              <p className="text-muted-foreground text-center">
                Try adjusting your search query or browse all our available tutorials.
              </p>
            </div>
          )}
        </div>
        
        <AdPlacement location="footer" />
      </div>
    </div>
  );
};

export default TutorialCategoriesPage;
