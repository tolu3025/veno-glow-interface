import { useNavigate } from "react-router-dom";
import { Book, ShoppingCart, Bot, FileText, CheckCircle, ArrowRight } from "lucide-react";
import TutorialCard from "@/components/ServiceCard";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const bannerSlides = [
    {
      title: "Learn Anywhere, Anytime",
      subtitle: "Access your courses on any device with our responsive platform that adapts to your schedule and learning style.",
      background: "bg-gradient-to-r from-veno-secondary to-purple-600",
      primaryButton: { text: "Start Learning", link: "/cbt" },
      secondaryButton: { text: "View Courses", link: "/cbt" }
    },
    {
      title: "Interactive Assessment Tools",
      subtitle: "Test your knowledge and track your progress with our comprehensive suite of CBT tools and analytics.",
      background: "bg-gradient-to-r from-purple-600 to-veno-primary",
      primaryButton: { text: "Take a Test", link: "/cbt" },
      secondaryButton: { text: "View Analytics", link: "/cbt/analytics" }
    },
    {
      title: "Digital Marketplace",
      subtitle: "Discover and purchase high-quality educational resources created by experts in their fields.",
      background: "bg-gradient-to-r from-veno-primary to-blue-600",
      primaryButton: { text: "Shop Now", link: "/marketplace" },
      secondaryButton: { text: "Browse Categories", link: "/marketplace" }
    },
    {
      title: "Insightful Blog Content",
      subtitle: "Stay updated with the latest educational trends and insights through our regularly updated blog.",
      background: "bg-gradient-to-r from-blue-600 to-veno-secondary",
      primaryButton: { text: "Read Articles", link: "/blog" },
      secondaryButton: { text: "Latest Posts", link: "/blog" }
    },
    {
      title: "AI-Powered Learning",
      subtitle: "Leverage our intelligent AI assistant to enhance your learning experience with personalized guidance.",
      background: "bg-gradient-to-r from-veno-secondary to-veno-primary",
      primaryButton: { text: "Chat with AI", link: "/bot" },
      secondaryButton: { text: "Learn More", link: "/bot" }
    }
  ];
  
  const tutorials = [
    {
      title: "Veno CBT",
      description: "Interactive educational platform for effective learning and assessment.",
      icon: Book,
      href: "/cbt",
    },
    {
      title: "Veno Tutorials",
      description: "Free tutorial videos on various subjects and topics.",
      icon: ShoppingCart,
      href: "/tutorial",
    },
    {
      title: "Veno Bot",
      description: "AI-powered assistant to help with your questions and tasks.",
      icon: Bot,
      href: "/bot",
    },
    {
      title: "Veno Blog",
      description: "Latest news, updates and insights from our team.",
      icon: FileText,
      href: "/blog",
    },
  ];

  const features = [
    {
      title: "Interactive Learning",
      description: "Engage with dynamic content and interactive assessments for better knowledge retention.",
      icon: Book,
    },
    {
      title: "Personalized Experience",
      description: "Tailored learning paths and recommendations based on your performance and preferences.",
      icon: CheckCircle,
    },
    {
      title: "AI-Powered Insights",
      description: "Get intelligent feedback and analysis to improve your learning outcomes.",
      icon: Bot,
    },
    {
      title: "Cross-Device Compatibility",
      description: "Access your learning materials anytime, anywhere, on any device.",
      icon: ShoppingCart,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  const handleGetStarted = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/cbt");
    }
  };

  return (
    <div className="pb-6 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="bubble w-48 h-48 rounded-full absolute -top-12 left-1/4 opacity-60"
          style={{ 
            background: "radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.1))",
            boxShadow: "inset 0 0 20px rgba(255, 255, 255, 0.5)",
            border: "1px solid rgba(255, 255, 255, 0.2)"
          }}
          animate={{ 
            y: [0, -40, -10, 0],
            x: [0, 30, -20, 0],
            rotate: [0, 10, -5, 0],
            scale: [1, 1.05, 0.98, 1]
          }}
          transition={{ 
            duration: 15, 
            ease: "easeInOut", 
            repeat: Infinity,
            repeatType: "reverse" 
          }}
        />
        
        <motion.div
          className="bubble w-32 h-32 rounded-full absolute top-1/3 -right-10 opacity-50"
          style={{ 
            background: "radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.1))",
            boxShadow: "inset 0 0 15px rgba(255, 255, 255, 0.3)",
            border: "1px solid rgba(255, 255, 255, 0.2)"
          }}
          animate={{
            y: [0, 30, -20, 0],
            x: [0, -20, 10, 0],
            rotate: [0, -5, 10, 0],
            scale: [1, 0.95, 1.02, 1]
          }}
          transition={{
            duration: 18,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse",
            delay: 2
          }}
        />
        
        <motion.div
          className="bubble w-40 h-40 rounded-full absolute bottom-20 left-10 opacity-40"
          style={{ 
            background: "radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1))",
            boxShadow: "inset 0 0 18px rgba(255, 255, 255, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.2)"
          }}
          animate={{
            y: [0, -30, 20, 0],
            x: [0, 20, -30, 0],
            rotate: [0, -10, 5, 0],
            scale: [1, 1.04, 0.97, 1]
          }}
          transition={{
            duration: 20,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse",
            delay: 1
          }}
        />
        
        <motion.div
          className="bubble w-24 h-24 rounded-full absolute top-1/2 left-1/4 opacity-30"
          style={{ 
            background: "radial-gradient(circle at 60% 60%, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.05))",
            boxShadow: "inset 0 0 10px rgba(255, 255, 255, 0.3)",
            border: "1px solid rgba(255, 255, 255, 0.15)"
          }}
          animate={{
            y: [0, 20, -15, 0],
            x: [0, -15, 25, 0],
            rotate: [0, 8, -12, 0],
            scale: [1, 0.98, 1.03, 1]
          }}
          transition={{
            duration: 17,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse",
            delay: 3
          }}
        />
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative rounded-2xl overflow-hidden mb-10"
      >
        <Carousel autoplay={true} autoplayInterval={5000} showControls={false} className="h-[400px] md:h-[500px]">
          <CarouselContent>
            {bannerSlides.map((slide, index) => (
              <CarouselItem key={index}>
                <div className={`${slide.background} h-[400px] md:h-[500px] flex items-center`}>
                  <div className="container relative z-20">
                    <div className="max-w-xl text-white">
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <h1 className="text-4xl md:text-6xl font-bold mb-4 font-heading">
                          {slide.title.split(' ').map((word, i) => (
                            <span key={i} className={i % 2 === 1 ? "text-veno-accent" : ""}>
                              {word}{' '}
                            </span>
                          ))}
                        </h1>
                        <p className="text-lg md:text-xl opacity-90 mb-8 leading-relaxed">
                          {slide.subtitle}
                        </p>
                        <div className="flex flex-wrap gap-4">
                          <Button 
                            size="lg" 
                            onClick={() => navigate(slide.primaryButton.link)}
                            className="bg-white text-veno-primary hover:bg-white/90"
                          >
                            {slide.primaryButton.text}
                          </Button>
                          <Button 
                            size="lg"
                            variant="outline"
                            onClick={() => navigate(slide.secondaryButton.link)}
                            className="bg-transparent border-white text-white hover:bg-white/20"
                          >
                            {slide.secondaryButton.text}
                          </Button>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="mb-16"
      >
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-3xl font-bold tracking-tight font-heading mb-4">Transform Your Learning Experience</h2>
          <p className="text-muted-foreground text-lg">Discover how Veno's innovative approach to education can help you achieve your goals.</p>
        </div>
        
        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="veno-card p-6 h-full flex flex-col">
                <div className="rounded-full bg-veno-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <feature.icon className="text-veno-primary h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground flex-grow">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="mb-16"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-heading">Our Tutorials</h2>
            <p className="text-muted-foreground mt-2">Discover what Veno has to offer.</p>
          </div>
          <Button 
            variant="outline" 
            className="mt-4 md:mt-0"
            onClick={() => navigate("/tutorial")}
          >
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-4 grid-cols-1 md:grid-cols-2"
        >
          {tutorials.map((tutorial) => (
            <motion.div key={tutorial.title} variants={itemVariants}>
              <TutorialCard
                title={tutorial.title}
                description={tutorial.description}
                icon={tutorial.icon}
                href={tutorial.href}
                onClick={() => navigate(tutorial.href)}
                showShareButton={true}
                onShare={() => {
                  navigator.clipboard.writeText(`Check out this tutorial: ${window.location.origin}${tutorial.href}`);
                  // You would typically add a toast notification here
                }}
              />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="mb-16"
      >
        <div className="veno-card bg-gradient-to-br from-veno-primary/5 to-veno-secondary/5">
          <div className="p-8 md:p-12">
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-lg font-handwriting text-veno-secondary mb-6">What Our Users Say</p>
              <blockquote className="text-xl md:text-2xl italic mb-6">
                "Veno has transformed how I approach learning and assessment. The interactive tools and personalized feedback have significantly improved my study efficiency and outcomes."
              </blockquote>
              <div className="flex items-center justify-center">
                <Avatar className="w-12 h-12 rounded-full border-2 border-veno-primary mr-4">
                  <AvatarImage src="/lovable-uploads/cb8d05cb-602f-45e9-a069-f187aee51c74.png" alt="Toluwanimi Oyetade" />
                  <AvatarFallback>TO</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="font-semibold">Toluwanimi Oyetade</p>
                  <p className="text-sm text-muted-foreground">University Student</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="text-center"
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 font-heading">Ready to Transform Your Learning Experience?</h2>
          <p className="text-muted-foreground text-lg mb-8">Join thousands of students who are already using Veno to achieve their educational goals.</p>
          <Button 
            size="lg" 
            className="bg-veno-primary hover:bg-veno-primary/90"
            onClick={handleGetStarted}
          >
            {user ? "Go to Dashboard" : "Get Started for Free"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Index;
