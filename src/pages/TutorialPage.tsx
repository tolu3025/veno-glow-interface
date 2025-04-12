
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Users, Gift, AlertCircle, BookOpen, GraduationCap, School, Award, Search, MessageCircle, Play, Pause, Video, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import AdPlacement from "@/components/ads/AdPlacement";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

interface Tutorial {
  id: string;
  title: string;
  description: string;
  subject: string;
  level: string;
  duration: string;
  thumbnail_url?: string;
  preview_url?: string;
  video_url?: string;
  duration_seconds?: number;
}

const TutorialPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [featuredTutorials, setFeaturedTutorials] = useState<Tutorial[]>([]);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewTimerId, setPreviewTimerId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTutorials, setFilteredTutorials] = useState<Tutorial[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTutorials = async () => {
      try {
        const { data, error } = await supabase
          .from('tutorials')
          .select('*')
          .limit(20);
          
        if (error) {
          console.error('Error fetching tutorials:', error);
          toast({
            title: "Failed to load tutorials",
            description: error.message,
            variant: "destructive"
          });
          const sampleTutorials = getSampleTutorials();
          setTutorials(sampleTutorials);
          setFilteredTutorials(sampleTutorials);
          setFeaturedTutorials(sampleTutorials.slice(0, 3));
        } else if (data && data.length > 0) {
          const formattedData: Tutorial[] = data.map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            subject: item.subject,
            level: item.level,
            duration: item.duration,
            thumbnail_url: item.thumbnail_url || undefined,
            preview_url: item.preview_url || undefined,
            video_url: item.video_url || undefined,
            duration_seconds: item.duration_seconds || undefined
          }));
          setTutorials(formattedData);
          setFilteredTutorials(formattedData);
          setFeaturedTutorials(formattedData.slice(0, 3));
        } else {
          const sampleTutorials = getSampleTutorials();
          setTutorials(sampleTutorials);
          setFilteredTutorials(sampleTutorials);
          setFeaturedTutorials(sampleTutorials.slice(0, 3));
        }
      } catch (error) {
        console.error('Failed to fetch tutorials:', error);
        const sampleTutorials = getSampleTutorials();
        setTutorials(sampleTutorials);
        setFilteredTutorials(sampleTutorials);
        setFeaturedTutorials(sampleTutorials.slice(0, 3));
        toast({
          title: "Connection Error",
          description: "Using sample data while we restore connection",
          variant: "default"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTutorials();
  }, []);

  useEffect(() => {
    let filtered = tutorials;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tutorial => 
        tutorial.title.toLowerCase().includes(query) || 
        tutorial.description.toLowerCase().includes(query) ||
        tutorial.subject.toLowerCase().includes(query) ||
        tutorial.level.toLowerCase().includes(query) ||
        tutorial.duration.toLowerCase().includes(query)
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(tutorial => 
        tutorial.subject === selectedCategory
      );
    }
    
    setFilteredTutorials(filtered);
  }, [searchQuery, selectedCategory, tutorials]);

  useEffect(() => {
    return () => {
      if (previewTimerId) {
        clearTimeout(previewTimerId);
      }
    };
  }, [previewTimerId]);

  const getSampleTutorials = (): Tutorial[] => [
    {
      id: "1",
      title: "Advanced Mathematics Tutorial Series",
      description: "Comprehensive online tutorial covering algebra, calculus, and advanced mathematical concepts for high school and pre-university students.",
      subject: "Mathematics",
      level: "Advanced",
      duration: "6 months",
      thumbnail_url: "https://placehold.co/600x400/3b82f6/ffffff?text=Mathematics+Tutorial",
      preview_url: "https://assets.mixkit.co/videos/preview/mixkit-teacher-pointing-on-board-during-white-board-session-42342-large.mp4",
      duration_seconds: 3600
    },
    {
      id: "2",
      title: "Physics Fundamentals Video Course",
      description: "In-depth video tutorials exploring mechanics, electricity, magnetism, and modern physics with detailed explanations and practice problems.",
      subject: "Physics",
      level: "Intermediate",
      duration: "4 months",
      thumbnail_url: "https://placehold.co/600x400/22c55e/ffffff?text=Physics+Course",
      preview_url: "https://assets.mixkit.co/videos/preview/mixkit-scientist-in-a-laboratory-5214-large.mp4",
      duration_seconds: 2700
    },
    {
      id: "3",
      title: "World History Comprehensive Tutorial",
      description: "Engaging online tutorial series covering world history from ancient civilizations to modern geopolitics, perfect for secondary school students.",
      subject: "History",
      level: "Intermediate",
      duration: "3 months",
      thumbnail_url: "https://placehold.co/600x400/ef4444/ffffff?text=History+Tutorial",
      preview_url: "https://assets.mixkit.co/videos/preview/mixkit-hands-holding-an-ancient-book-34901-large.mp4",
      duration_seconds: 1800
    },
    {
      id: "4",
      title: "Computer Science Programming Bootcamp",
      description: "Hands-on tutorial series covering programming fundamentals, web development, and coding best practices using Python and JavaScript.",
      subject: "Computer Science",
      level: "Beginner to Advanced",
      duration: "6 months",
      thumbnail_url: "https://placehold.co/600x400/8b5cf6/ffffff?text=Computer+Science",
      preview_url: "https://assets.mixkit.co/videos/preview/mixkit-programming-a-computer-close-up-of-the-screen-9736-large.mp4",
      duration_seconds: 4500
    },
    {
      id: "5",
      title: "Chemistry Lab and Theory Tutorial",
      description: "Comprehensive online tutorial combining theoretical lessons with virtual lab experiments covering organic, inorganic, and physical chemistry.",
      subject: "Chemistry",
      level: "Advanced",
      duration: "5 months",
      thumbnail_url: "https://placehold.co/600x400/ec4899/ffffff?text=Chemistry+Tutorial",
      preview_url: "https://assets.mixkit.co/videos/preview/mixkit-women-scientists-test-the-green-liquid-in-flasks-4736-large.mp4",
      duration_seconds: 3000
    }
  ];

  const handleWatchVideo = (tutorial: Tutorial) => {
    setSelectedTutorial(tutorial);
    setPreviewDialogOpen(true);
    setIsPlaying(false);
  };
  
  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  const categories = Array.from(new Set(tutorials.map(tutorial => tutorial.subject)));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-3">Loading Tutorials</h1>
          <p className="text-muted-foreground">Please wait while we prepare the tutorials for you...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4 md:py-8">
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Veno Tutorial Library</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Discover comprehensive subject tutorials, expert-led online courses, and educational resources designed to enhance your learning experience.
          </p>
        </div>

        <div className="w-full">
          <AdPlacement location="header" />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tutorials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap mt-2 sm:mt-0">
            <Button 
              variant={selectedCategory === "" ? "default" : "outline"} 
              size={isMobile ? "sm" : "sm"}
              onClick={() => setSelectedCategory("")}
              className="text-xs md:text-sm px-2 py-1"
            >
              All
            </Button>
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size={isMobile ? "sm" : "sm"}
                onClick={() => setSelectedCategory(category)}
                className="text-xs md:text-sm px-2 py-1"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-4 md:p-8 rounded-lg md:rounded-xl mb-4 md:mb-6">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
            <div className="flex-1">
              <h2 className="text-xl md:text-2xl font-bold mb-2 md:mb-4">Welcome to Veno Tutorials Library</h2>
              <p className="text-sm md:text-base mb-4">Your premier resource for educational materials, study guides, and academic tools. Find everything you need to excel in your academic journey.</p>
              <div className="flex flex-wrap gap-2 md:gap-3">
                <Button size={isMobile ? "sm" : "default"}>
                  <School className="mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
                  Explore Categories
                </Button>
                <Button 
                  variant="outline" 
                  size={isMobile ? "sm" : "default"}
                  onClick={() => navigate('/tutorial/info')}
                >
                  <BookOpen className="mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
                  Learn More
                </Button>
              </div>
            </div>
            <div className="flex-1 flex justify-center mt-4 md:mt-0">
              <div className="aspect-square w-32 md:max-w-[250px] rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <GraduationCap className="h-16 w-16 md:h-24 md:w-24 text-primary" />
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Featured Tutorials</h2>
          <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {featuredTutorials.map((tutorial) => (
              <Card key={tutorial.id} className="h-full">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-lg md:text-xl">{tutorial.title}</CardTitle>
                  <CardDescription>{tutorial.subject}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                  <div className="aspect-video rounded-md bg-muted flex items-center justify-center mb-3 md:mb-4 relative overflow-hidden group">
                    {tutorial.thumbnail_url ? (
                      <img 
                        src={tutorial.thumbnail_url} 
                        alt={tutorial.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Video className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground" />
                    )}
                    
                    {tutorial.preview_url && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="rounded-full bg-white/20 hover:bg-white/40"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWatchVideo(tutorial);
                          }}
                        >
                          <Play className="h-4 w-4 md:h-5 md:w-5 text-white" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground">{tutorial.description}</p>
                </CardContent>
                <CardFooter className="p-4 pt-0 md:p-6 md:pt-0 flex justify-between items-center">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size={isMobile ? "sm" : "default"}
                      onClick={() => handleWatchVideo(tutorial)}
                    >
                      Watch Now
                    </Button>
                  </div>
                  <Badge variant="outline">{tutorial.level}</Badge>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        <div className="my-4 md:my-8">
          <AdPlacement location="content" />
        </div>

        <div>
          <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Available Tutorials</h2>
          <Card>
            <div className={isMobile ? "overflow-x-auto" : ""}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tutorial</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTutorials.map((tutorial) => (
                    <TableRow key={tutorial.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm md:text-base">{tutorial.title}</p>
                          <p className="text-xs md:text-sm text-muted-foreground">{tutorial.description.substring(0, isMobile ? 40 : 60)}...</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{tutorial.subject}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{tutorial.level}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" onClick={() => handleWatchVideo(tutorial)}>Watch Now</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredTutorials.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 md:py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground opacity-50" />
                          <p className="font-medium">No tutorials found</p>
                          <p className="text-xs md:text-sm text-muted-foreground">Try adjusting your search or filters</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 my-6 md:my-8">
          <div className="md:col-span-2">
            <Card className="p-4 md:p-6">
              <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4">Educational Resources</h3>
              <p className="text-sm md:text-base mb-3 md:mb-4">
                Veno Tutorials offers a wide range of educational resources to help students, teachers, 
                and educational institutions enhance their learning and teaching experiences.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div className="flex items-start gap-2">
                  <Award className="h-4 w-4 md:h-5 md:w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm md:text-base">Quality Materials</h4>
                    <p className="text-xs md:text-sm text-muted-foreground">Curated and verified by educators</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm md:text-base">Latest Content</h4>
                    <p className="text-xs md:text-sm text-muted-foreground">Updated regularly with new materials</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <GraduationCap className="h-4 w-4 md:h-5 md:w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm md:text-base">Academic Success</h4>
                    <p className="text-xs md:text-sm text-muted-foreground">Resources that help students excel</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 md:h-5 md:w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm md:text-base">Community Support</h4>
                    <p className="text-xs md:text-sm text-muted-foreground">Connect with other educators and students</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
          <div className="md:col-span-1 flex flex-col">
            <AdPlacement location="sidebar" />
          </div>
        </div>

        <Card className="p-4 md:p-6 bg-muted/50 border-dashed">
          <div className="flex gap-3 md:gap-4 items-start">
            <AlertCircle className="h-5 w-5 md:h-6 md:w-6 text-amber-500 mt-1" />
            <div>
              <h3 className="text-base md:text-lg font-medium mb-2">Veno Tutorials v1.0</h3>
              <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
                Our tutorial library is growing! More tutorials are being added regularly to cover a wider range of subjects and 
                academic levels. If you have suggestions for tutorials you'd like to see, please contact us.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/tutorial/info')}
                  className="ml-2"
                >
                  <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Separator />

        <div className="my-3 md:my-4">
          <AdPlacement location="footer" />
        </div>
      </div>
      
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTutorial?.title}</DialogTitle>
            <DialogDescription>
              {selectedTutorial?.description}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTutorial?.preview_url && (
            <div className="aspect-video relative bg-black rounded-md overflow-hidden">
              <video
                ref={videoRef}
                src={selectedTutorial.preview_url}
                className="w-full h-full"
                poster={selectedTutorial.thumbnail_url}
                onEnded={handleVideoEnded}
                controls
              />
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full bg-white/20 hover:bg-white/40"
                    onClick={togglePlayPause}
                  >
                    <Play className="h-6 w-6 md:h-8 md:w-8 text-white" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TutorialPage;
