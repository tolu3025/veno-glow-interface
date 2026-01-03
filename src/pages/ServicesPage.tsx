import React, { useState, useEffect } from 'react';
import { ArrowLeft, Book, ShoppingCart, Bot, FileText, Landmark, BarChart, BookOpen, CheckCircle, ArrowRight, GraduationCap, Video, Briefcase, Code, Laptop } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ServiceCard from '@/components/ServiceCard';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ServicesPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('all');
  
  // Scroll to section if hash in URL
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);
  
  const services = [
    {
      id: "cbt",
      title: "Veno CBT",
      description: "Interactive educational platform for effective learning and assessment. Create, share and manage computer-based tests easily.",
      icon: Book,
      href: "/cbt",
      features: [
        "Create custom tests and quizzes",
        "Track learning progress",
        "Share assessments with students",
        "Detailed analytics and insights"
      ],
      details: "Our comprehensive Computer-Based Testing platform allows educators and students to create, manage, and participate in online assessments. With features like question banks, timed tests, and instant feedback, Veno CBT provides a seamless experience for educational evaluation.",
      benefits: [
        "Instant grading and feedback",
        "Multiple question types supported",
        "Customizable test settings",
        "Export results for analysis"
      ],
      category: "education"
    },
    {
      id: "org-exam",
      title: "Organization Exams",
      description: "Conduct secure digital exams for schools and institutions with AI-powered question generation and anti-cheat features.",
      icon: GraduationCap,
      href: "/org-exam",
      features: [
        "AI-powered question generation",
        "Nigerian curriculum alignment (WAEC, NECO, JAMB)",
        "Anti-cheat monitoring system",
        "Automated marking and results"
      ],
      details: "Enable schools, universities, and exam centers to conduct secure digital examinations. Our platform generates curriculum-aligned questions using AI and includes robust anti-cheat features for exam integrity.",
      benefits: [
        "Eliminates manual question typing",
        "Secure exam environment",
        "Real-time participant monitoring",
        "Instant result compilation"
      ],
      category: "education"
    },
    {
      id: "tutorial",
      title: "Veno Tutorials",
      description: "Comprehensive tutorial library covering business, freelancing, education, and a wide range of learning topics with high-quality video content.",
      icon: Video,
      href: "/tutorial",
      features: [
        "High-quality educational videos",
        "Business and freelancing guides",
        "Professional development courses",
        "Beginner to advanced content"
      ],
      details: "Our tutorial platform provides access to a vast collection of educational videos and learning resources across multiple disciplines. From business development to technical skills, our content is designed to help learners of all levels advance their knowledge and capabilities.",
      benefits: [
        "Free access to all content",
        "Regularly updated materials",
        "Diverse learning paths",
        "Expert-created tutorials"
      ],
      category: "education"
    },
    {
      id: "bot",
      title: "Veno Bot",
      description: "AI-powered assistant to help with your questions and tasks. Get instant answers and support for your learning journey.",
      icon: Bot,
      href: "/bot",
      features: [
        "24/7 learning assistance",
        "Subject-specific guidance",
        "Personalized responses",
        "Exam preparation help"
      ],
      details: "Powered by cutting-edge AI technology, Veno Bot provides round-the-clock assistance for your educational queries. From explaining complex concepts to helping with exam preparation, our intelligent assistant makes learning more accessible.",
      benefits: [
        "Contextual understanding of questions",
        "Multilingual support",
        "Citation of reliable sources",
        "Adaptive learning suggestions"
      ],
      category: "technology"
    },
    {
      id: "blog",
      title: "Veno Blog",
      description: "Latest news, updates and insights from our team. Learn about educational trends and best practices.",
      icon: FileText,
      href: "/blog",
      features: [
        "Expert articles and guides",
        "Education industry news",
        "Learning strategies",
        "Success stories"
      ],
      details: "Stay informed with the latest educational trends, teaching methodologies, and Veno platform updates through our regularly updated blog. Our content is written by education experts and thought leaders in the field.",
      benefits: [
        "Subscribe for weekly newsletters",
        "Comment and engage with authors",
        "Share articles on social media",
        "Request topics for future posts"
      ],
      category: "content"
    },
    {
      id: "analytics",
      title: "Veno Analytics",
      description: "Comprehensive data analysis tools to track and improve student performance and engagement.",
      icon: BarChart,
      href: "/cbt/analytics",
      features: [
        "Performance tracking",
        "Custom reports",
        "Learning pattern analysis",
        "Actionable insights"
      ],
      details: "Turn educational data into meaningful insights with Veno Analytics. Our powerful tools help identify trends, track progress, and measure learning outcomes through intuitive dashboards and customizable reports.",
      benefits: [
        "Visualize student progress over time",
        "Compare results across groups",
        "Identify knowledge gaps",
        "Export reports in multiple formats"
      ],
      category: "technology"
    },
    {
      id: "library",
      title: "Veno Library",
      description: "Digital library with a vast collection of educational resources, books, and study materials.",
      icon: BookOpen,
      href: "/cbt/library",
      features: [
        "Categorized study materials",
        "Easy search functionality",
        "Downloadable resources",
        "Regular content updates"
      ],
      details: "Access a growing collection of educational resources, study guides, and reference materials in our digital library. With organized categories and powerful search features, finding the right content has never been easier.",
      benefits: [
        "Bookmarking favorite resources",
        "Offline access to downloaded items",
        "Community-contributed content",
        "Reading progress tracking"
      ],
      category: "education"
    },
    {
      id: "consulting",
      title: "Veno Consulting",
      description: "Expert educational consulting services for institutions and organizations.",
      icon: Landmark,
      href: "/contact",
      features: [
        "Curriculum development",
        "Educational technology integration",
        "Teacher training",
        "Assessment strategy"
      ],
      details: "Our team of education experts provides consulting services to help educational institutions optimize their teaching and assessment approaches. From curriculum design to technology integration, we offer tailored solutions.",
      benefits: [
        "Customized implementation plans",
        "Follow-up support and training",
        "Research-backed methodologies",
        "Measurable outcome targets"
      ],
      category: "professional"
    }
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
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
  
  // Filter services by category
  const filteredServices = 
    activeTab === 'all' 
      ? services 
      : services.filter(service => service.category === activeTab);

  return (
    <div className="container max-w-6xl py-8">
      <div className="flex items-center mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-secondary/70 hover:bg-secondary mr-4"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-3xl font-bold">Our Services</h1>
      </div>
      
      <div className="mb-10">
        <p className="text-muted-foreground max-w-3xl mb-6">
          Explore the full range of services offered by Veno to enhance your educational journey. 
          From interactive assessments to AI-powered learning, we've got you covered.
        </p>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList>
            <TabsTrigger value="all">All Services</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="technology">Technology</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="professional">Professional</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-8 grid-cols-1 md:grid-cols-2"
      >
        {filteredServices.map((service) => (
          <motion.div key={service.id} variants={itemVariants} id={service.id} className="relative">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mr-4">
                      <service.icon className="w-6 h-6 text-veno-primary" />
                    </div>
                    <div>
                      <CardTitle>{service.title}</CardTitle>
                      <CardDescription className="mt-1">{service.description}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm mb-6">{service.details}</p>
                
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3">Key Features</h3>
                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature, idx) => (
                      <li key={`feature-${idx}`} className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-veno-primary mr-2 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                
                  <h3 className="text-sm font-semibold mb-3">Benefits</h3>
                  <ul className="space-y-2">
                    {service.benefits.map((benefit, idx) => (
                      <li key={`benefit-${idx}`} className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-veno-secondary mr-2 mt-0.5" />
                        <span className="text-sm">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Button 
                  onClick={() => navigate(service.href)} 
                  className="w-full flex justify-between items-center mt-auto"
                >
                  Go to {service.title}
                  <ArrowRight size={16} />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="mt-16 bg-primary/5 rounded-lg p-6 sm:p-10 border">
        <h2 className="text-2xl font-bold mb-4">Need a custom solution?</h2>
        <p className="text-muted-foreground mb-6">
          Contact our team to discuss how we can tailor our services to meet your specific educational needs.
        </p>
        <Button onClick={() => navigate("/contact")}>
          Contact Us
        </Button>
      </div>
    </div>
  );
};

export default ServicesPage;
