import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, ShoppingBag, Users, CreditCard, Gift, AlertCircle, BookOpen, GraduationCap, School, Award, Search, MessageCircle, Play, Pause, Video, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AdPlacement from "@/components/ads/AdPlacement";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  subject: string;
  level: string;
  duration: string;
  inventory_count?: number;
  thumbnail_url?: string;
  preview_url?: string;
  video_url?: string;
  duration_seconds?: number;
}

type TutorialResponse = Database['public']['Tables']['tutorials']['Row'];

const MarketplacePage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [tutorials, setTutorials] = useState<Product[]>([]);
  const [featuredTutorials, setFeaturedTutorials] = useState<Product[]>([]);
  const [selectedTutorial, setSelectedTutorial] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTutorials, setFilteredTutorials] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewTimerId, setPreviewTimerId] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMobile = useIsMobile();
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTutorials = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.email) {
          setBuyerEmail(userData.user.email);
        }

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
          const formattedData: Product[] = data.map((item: TutorialResponse) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            price: item.price,
            subject: item.subject,
            level: item.level,
            duration: item.duration,
            inventory_count: item.inventory_count || undefined,
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

  const getSampleTutorials = (): Product[] => [
    {
      id: "1",
      title: "Advanced Mathematics Tutorial Series",
      description: "Comprehensive online tutorial covering algebra, calculus, and advanced mathematical concepts for high school and pre-university students.",
      price: 4500,
      subject: "Mathematics",
      level: "Advanced",
      duration: "6 months",
      inventory_count: 50,
      thumbnail_url: "https://placehold.co/600x400/3b82f6/ffffff?text=Mathematics+Tutorial",
      preview_url: "https://assets.mixkit.co/videos/preview/mixkit-teacher-pointing-on-board-during-white-board-session-42342-large.mp4",
      duration_seconds: 3600
    },
    {
      id: "2",
      title: "Physics Fundamentals Video Course",
      description: "In-depth video tutorials exploring mechanics, electricity, magnetism, and modern physics with detailed explanations and practice problems.",
      price: 12000,
      subject: "Physics",
      level: "Intermediate",
      duration: "4 months",
      inventory_count: 30,
      thumbnail_url: "https://placehold.co/600x400/22c55e/ffffff?text=Physics+Course",
      preview_url: "https://assets.mixkit.co/videos/preview/mixkit-scientist-in-a-laboratory-5214-large.mp4",
      duration_seconds: 2700
    },
    {
      id: "3",
      title: "World History Comprehensive Tutorial",
      description: "Engaging online tutorial series covering world history from ancient civilizations to modern geopolitics, perfect for secondary school students.",
      price: 3000,
      subject: "History",
      level: "Intermediate",
      duration: "3 months",
      inventory_count: 75,
      thumbnail_url: "https://placehold.co/600x400/ef4444/ffffff?text=History+Tutorial",
      preview_url: "https://assets.mixkit.co/videos/preview/mixkit-hands-holding-an-ancient-book-34901-large.mp4",
      duration_seconds: 1800
    },
    {
      id: "4",
      title: "Computer Science Programming Bootcamp",
      description: "Hands-on tutorial series covering programming fundamentals, web development, and coding best practices using Python and JavaScript.",
      price: 15000,
      subject: "Computer Science",
      level: "Beginner to Advanced",
      duration: "6 months",
      inventory_count: 60,
      thumbnail_url: "https://placehold.co/600x400/8b5cf6/ffffff?text=Computer+Science",
      preview_url: "https://assets.mixkit.co/videos/preview/mixkit-programming-a-computer-close-up-of-the-screen-9736-large.mp4",
      duration_seconds: 4500
    },
    {
      id: "5",
      title: "Chemistry Lab and Theory Tutorial",
      description: "Comprehensive online tutorial combining theoretical lessons with virtual lab experiments covering organic, inorganic, and physical chemistry.",
      price: 8000,
      subject: "Chemistry",
      level: "Advanced",
      duration: "5 months",
      inventory_count: 40,
      thumbnail_url: "https://placehold.co/600x400/ec4899/ffffff?text=Chemistry+Tutorial",
      preview_url: "https://assets.mixkit.co/videos/preview/mixkit-women-scientists-test-the-green-liquid-in-flasks-4736-large.mp4",
      duration_seconds: 3000
    }
  ];

  const checkPurchaseStatus = async (tutorialId: string) => {
    if (!auth.user) return false;
    
    try {
      const { data, error } = await supabase
        .from('user_purchases')
        .select('*')
        .eq('tutorial_id', tutorialId)
        .eq('user_id', auth.user.id)
        .eq('status', 'completed')
        .maybeSingle();

      if (error) {
        console.error('Error checking purchase status:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Failed to check purchase status:', error);
      return false;
    }
  };

  const handleAddToCart = (tutorial: Product) => {
    setSelectedTutorial(tutorial);
    setQuantity(1);
    setCheckoutDialogOpen(true);
  };

  const handleWatchPreview = (tutorial: Product) => {
    setSelectedTutorial(tutorial);
    setPreviewDialogOpen(true);
    
    // Reset video state
    setIsPlaying(false);
  };
  
  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
      
      // Start 10-second preview timer for non-purchased tutorials
      checkPurchaseStatus(selectedTutorial?.id || '').then(isPurchased => {
        if (!isPurchased && selectedTutorial?.preview_url) {
          // Clear any existing timer
          if (previewTimerId) {
            clearTimeout(previewTimerId);
          }
          
          // Set new timer for 10 seconds
          const timerId = setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.pause();
              setIsPlaying(false);
              toast({
                title: "Preview Ended",
                description: "Purchase this tutorial to access the full video content.",
                variant: "default"
              });
            }
          }, 10000) as unknown as number;
          
          setPreviewTimerId(timerId);
        }
      });
    }
    
    setIsPlaying(!isPlaying);
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  const handleWatchFullVideo = async (tutorial: Product) => {
    const isPurchased = await checkPurchaseStatus(tutorial.id);
    
    if (isPurchased) {
      // Allow full video view
      setSelectedTutorial(tutorial);
      setPreviewDialogOpen(true);
    } else {
      // Prompt to purchase
      toast({
        title: "Purchase Required",
        description: "You need to purchase this tutorial to access the full video.",
        variant: "default"
      });
      handleAddToCart(tutorial);
    }
  };

  const handleCheckout = async () => {
    if (!selectedTutorial) return;
    
    if (!buyerEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessingPayment(true);
    
    try {
      const response = await supabase.functions.invoke('process-payment', {
        body: {
          tutorialId: selectedTutorial.id,
          title: selectedTutorial.title,
          price: selectedTutorial.price,
          buyerEmail,
          buyerName,
          quantity
        }
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      const { data } = response;
      
      if (data.success && data.paymentLink) {
        window.location.href = data.paymentLink;
      } else {
        throw new Error('Failed to generate payment link');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to process payment",
        variant: "destructive"
      });
      setIsProcessingPayment(false);
    }
  };

  const categories = Array.from(new Set(tutorials.map(tutorial => tutorial.subject)));

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
    <div className="container py-4 md:py-8">
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Veno Tutorial Marketplace</h1>
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
              <h2 className="text-xl md:text-2xl font-bold mb-2 md:mb-4">Welcome to Veno Tutorials Marketplace</h2>
              <p className="text-sm md:text-base mb-4">Your premier marketplace for educational resources, study materials, and academic tools. Find everything you need to excel in your academic journey.</p>
              <div className="flex flex-wrap gap-2 md:gap-3">
                <Button size={isMobile ? "sm" : "default"}>
                  <School className="mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
                  Explore Categories
                </Button>
                <Button 
                  variant="outline" 
                  size={isMobile ? "sm" : "default"}
                  onClick={() => navigate('/marketplace/info')}
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
                            handleWatchPreview(tutorial);
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
                      onClick={() => handleAddToCart(tutorial)}
                    >
                      Buy Now
                    </Button>
                    {tutorial.preview_url && (
                      <Button 
                        variant="ghost" 
                        size={isMobile ? "sm" : "default"}
                        onClick={() => handleWatchPreview(tutorial)}
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        Preview
                      </Button>
                    )}
                  </div>
                  <p className="text-base md:text-lg font-bold">₦{tutorial.price.toLocaleString()}</p>
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
                    <TableHead>Price (₦)</TableHead>
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
                      <TableCell className="text-sm">{tutorial.price.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" onClick={() => handleAddToCart(tutorial)}>Buy Now</Button>
                          {tutorial.preview_url && (
                            <Button size="sm" variant="outline" onClick={() => handleWatchPreview(tutorial)}>
                              <Eye className="h-3 w-3 mr-1" />
                              Preview
                            </Button>
                          )}
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
                Veno Marketplace offers a wide range of educational resources to help students, teachers, 
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
              <h3 className="text-base md:text-lg font-medium mb-2">Veno Tutorials Marketplace v1.0 Beta</h3>
              <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
                Veno Tutorials Marketplace version 1.0 is set to launch on April 16, 2024. 
                The beta version will be available in Q2 of 2025. 
                If you are interested in uploading your tutorial sessions, 
                please contact us for more information.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs md:text-sm text-muted-foreground">
                  Launch Dates:
                </p>
                <Badge variant="outline" className="text-xs">Version 1.0: April 16, 2024</Badge>
                <Badge variant="outline" className="text-xs">Beta: Q2 2025</Badge>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/marketplace/info')}
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

        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg md:text-xl">Payment Methods</CardTitle>
              <CardDescription>Secure and convenient payment options</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
              <div className="flex gap-1.5 md:gap-2 flex-wrap">
                <Badge variant="outline" className="py-1 md:py-2 px-2 md:px-4 text-xs">
                  <CreditCard className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  Card Payment
                </Badge>
                <Badge variant="outline" className="py-1 md:py-2 px-2 md:px-4 text-xs">
                  Bank Transfer
                </Badge>
                <Badge variant="outline" className="py-1 md:py-2 px-2 md:px-4 text-xs">
                  USSD
                </Badge>
                <Badge variant="outline" className="py-1 md:py-2 px-2 md:px-4 text-xs">
                  Mobile Money
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg md:text-xl">Frequently Asked Questions</CardTitle>
              <CardDescription>Common questions about our marketplace</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 md:p-6 md:pt-0 space-y-3 md:space-y-4">
              <div>
                <h4 className="font-medium text-sm md:text-base">How do I track my order?</h4>
                <p className="text-xs md:text-sm text-muted-foreground">Visit the Orders page to see all your purchases and their current status.</p>
              </div>
              <div>
                <h4 className="font-medium text-sm md:text-base">What payment methods are accepted?</h4>
                <p className="text-xs md:text-sm text-muted-foreground">We accept card payments, bank transfers, USSD, and mobile money through Flutterwave.</p>
              </div>
              <div>
                <h4 className="font-medium text-sm md:text-base">How are digital products delivered?</h4>
                <p className="text-xs md:text-sm text-muted-foreground">Digital products are delivered to your email immediately after payment confirmation.</p>
              </div>
              <div>
                <h4 className="font-medium text-sm md:text-base">How can I sell my educational materials?</h4>
                <p className="text-xs md:text-sm text-muted-foreground">Contact us to become a verified seller on Veno Marketplace.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={checkoutDialogOpen} onOpenChange={setCheckoutDialogOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-lg">
          <DialogHeader>
            <DialogTitle>Complete Your Purchase</DialogTitle>
            <DialogDescription>
              Review your order details before proceeding to payment.
            </DialogDescription>
          </DialogHeader>
          
          {selectedTutorial && (
            <div className="space-y-3 md:space-y-4 py-3 md:py-4">
              <div className="grid grid-cols-4 gap-3 md:gap-4">
                <div className="col-span-4">
                  <Card>
                    <CardContent className="p-3 md:p-4">
                      <div className="flex flex-col space-y-2">
                        <h3 className="font-medium text-sm md:text-base">{selectedTutorial.title}</h3>
                        <p className="text-xs md:text-sm text-muted-foreground">{selectedTutorial.description}</p>
                        <div className="flex justify-between items-center mt-2">
                          <Badge variant="outline" className="text-xs">{selectedTutorial.subject}</Badge>
                          <span className="font-bold text-sm md:text-base">₦{selectedTutorial.price.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="col-span-4 space-y-1 md:space-y-2">
                  <Label htmlFor="email" className="text-xs md:text-sm">Email address</Label>
                  <Input
                    id="email"
                    placeholder="your@email.com"
                    type="email"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    required
                    className="text-xs md:text-sm"
                  />
                </div>
                
                <div className="col-span-4 space-y-1 md:space-y-2">
                  <Label htmlFor="name" className="text-xs md:text-sm">Full Name (Optional)</Label>
                  <Input
                    id="name"
                    placeholder="Your full name"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="text-xs md:text-sm"
                  />
                </div>
                
                <div className="col-span-4">
                  <Button 
                    className="w-full" 
                    onClick={handleCheckout}
                    disabled={isProcessingPayment}
                  >
                    {isProcessingPayment ? "Processing..." : `Pay ₦${selectedTutorial.price.toLocaleString()}`}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
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
              />
              <div className="absolute inset-0 flex items-center justify-center">
                {!isPlaying && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full bg-white/20 hover:bg-white/40"
                    onClick={togglePlayPause}
                  >
                    <Play className="h-6 w-6 md:h-8 md:w-8 text-white" />
                  </Button>
                )}
              </div>
              
              <div className="absolute bottom-4 left-4 right-4 flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-black/40 text-white border-white/40 hover:bg-black/60"
                  onClick={togglePlayPause}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Play
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-primary/80 text-white border-primary/40 hover:bg-primary"
                  onClick={() => handleAddToCart(selectedTutorial)}
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Buy Now
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarketplacePage;
