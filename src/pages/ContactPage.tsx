
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send, AtSign, MessageCircle, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useIsMobile } from '@/hooks/use-mobile';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  subject: z.string().min(3, { message: 'Subject must be at least 3 characters' }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters' }),
});

type FormValues = z.infer<typeof formSchema>;

const faqs = [
  {
    question: "How do I create a test?",
    answer: "To create a test, log in to your account, navigate to the CBT section, and click on 'Create Test'. Follow the on-screen instructions to add questions, set time limits, and customize other test settings."
  },
  {
    question: "How can students take my tests?",
    answer: "After creating a test, you'll receive a share code. Distribute this code to your students, who can then enter it on the 'Take Test' page to access and complete the assessment."
  },
  {
    question: "Is there a limit to how many tests I can create?",
    answer: "Free accounts can create up to 5 tests with 30 questions each. Premium accounts have unlimited test creation capability with up to 500 questions per test."
  },
  {
    question: "Can I export test results?",
    answer: "Yes, test results can be exported in PDF or CSV format from the test management dashboard."
  },
  {
    question: "How secure are the tests?",
    answer: "Our platform includes various security measures such as question randomization, time limits, and browser focus monitoring to ensure the integrity of your assessments."
  },
  {
    question: "Do you offer certificates for test takers?",
    answer: "Yes, certificates can be automatically generated for test takers who achieve passing scores. This feature can be enabled in test settings."
  }
];

const ContactPage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Here you would send the data to your backend or email service
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Message sent successfully! We will get back to you soon.');
      form.reset();
    } catch (error) {
      toast.error('Failed to send message. Please try again later.');
      console.error('Contact form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openWhatsApp = () => {
    const phoneNumber = "+2347065684718";
    const message = encodeURIComponent("Hello! I have a question about Veno CBT.");
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    
    // Open in new tab
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="container py-4 md:py-8 px-3 md:px-6 max-w-7xl mx-auto">
      <div className="flex items-center mb-4 md:mb-6">
        <Button 
          variant="ghost" 
          size={isMobile ? "sm" : "icon"}
          onClick={() => navigate(-1)}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">Contact Us</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-xl md:text-2xl">Get In Touch</CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input placeholder="john@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input placeholder="How can we help you?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Please describe your inquiry in detail..." 
                            className="min-h-[100px] md:min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full md:w-auto bg-veno-primary hover:bg-veno-primary/90"
                    disabled={isSubmitting}
                    size={isMobile ? "sm" : "default"}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <Card className="mt-4 md:mt-8">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                <HelpCircle className="h-5 w-5" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription>
                Find quick answers to common questions about our platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-sm md:text-base">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-sm">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
            <CardFooter className="flex justify-center border-t pt-4 md:pt-6 p-4 md:p-6">
              <p className="text-xs md:text-sm text-muted-foreground">
                Don't see what you're looking for? Contact our support team for assistance.
              </p>
            </CardFooter>
          </Card>
        </div>
        
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start space-x-3">
                <div className="bg-veno-primary/10 p-2 rounded-full text-veno-primary">
                  <AtSign size={20} />
                </div>
                <div>
                  <h3 className="font-medium mb-1 text-sm md:text-base">Email Us</h3>
                  <p className="text-muted-foreground text-xs md:text-sm mb-2">For general inquiries</p>
                  <a href="mailto:cbtveno@gmail.com" className="text-veno-primary hover:underline block text-sm">
                    cbtveno@gmail.com
                  </a>
                  <a href="mailto:support@venobot.online" className="text-veno-primary hover:underline block mt-1 text-sm">
                    support@venobot.online
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start space-x-3">
                <div className="bg-green-100 dark:bg-green-800 p-2 rounded-full text-green-600 dark:text-green-400">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <h3 className="font-medium mb-1 text-sm md:text-base">Chat with Us</h3>
                  <p className="text-muted-foreground text-xs md:text-sm mb-3">
                    Need immediate help? Chat with our customer care team on WhatsApp.
                  </p>
                  
                  <Button 
                    className="w-full text-sm bg-green-600 hover:bg-green-700 text-white" 
                    size={isMobile ? "sm" : "default"}
                    onClick={openWhatsApp}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Chat on WhatsApp: +234 706 568 4718
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-veno-primary text-white">
            <CardContent className="p-4 md:p-6">
              <h3 className="font-medium mb-2 text-sm md:text-base">Connect With Us</h3>
              <p className="text-xs md:text-sm opacity-90 mb-4">
                Follow us on social media to stay updated with the latest educational content and announcements.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="hover:opacity-80">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 2H15C13.6739 2 12.4021 2.52678 11.4645 3.46447C10.5268 4.40215 10 5.67392 10 7V10H7V14H10V22H14V14H17L18 10H14V7C14 6.73478 14.1054 6.48043 14.2929 6.29289C14.4804 6.10536 14.7348 6 15 6H18V2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
                <a href="#" className="hover:opacity-80">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M23 3.01006C22.0424 3.68553 20.9821 4.20217 19.86 4.54006C19.2577 3.84757 18.4573 3.35675 17.567 3.13398C16.6767 2.91122 15.7395 2.96725 14.8821 3.29451C14.0247 3.62177 13.2884 4.20446 12.773 4.96377C12.2575 5.72309 11.9877 6.62239 12 7.54006V8.54006C10.2426 8.58562 8.50127 8.19587 6.93101 7.4055C5.36074 6.61513 4.01032 5.44869 3 4.01006C3 4.01006 -1 13.0101 8 17.0101C5.94053 18.408 3.48716 19.109 1 19.0101C10 24.0101 21 19.0101 21 7.51006C20.9991 7.23151 20.9723 6.95365 20.92 6.68006C21.9406 5.67355 22.6608 4.40277 23 3.01006V3.01006Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
                <a href="#" className="hover:opacity-80">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 8C17.5913 8 19.1174 8.63214 20.2426 9.75736C21.3679 10.8826 22 12.4087 22 14V21H18V14C18 13.4696 17.7893 12.9609 17.4142 12.5858C17.0391 12.2107 16.5304 12 16 12C15.4696 12 14.9609 12.2107 14.5858 12.5858C14.2107 12.9609 14 13.4696 14 14V21H10V14C10 12.4087 10.6321 10.8826 11.7574 9.75736C12.8826 8.63214 14.4087 8 16 8V8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6 9H2V21H6V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4 6C5.10457 6 6 5.10457 6 4C6 2.89543 5.10457 2 4 2C2.89543 2 2 2.89543 2 4C2 5.10457 2.89543 6 4 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
                <a href="#" className="hover:opacity-80">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 2H7C4.23858 2 2 4.23858 2 7V17C2 19.7614 4.23858 22 7 22H17C19.7614 22 22 19.7614 22 17V7C22 4.23858 19.7614 2 17 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 11.37C16.1234 12.2022 15.9813 13.0522 15.5938 13.799C15.2063 14.5458 14.5932 15.1514 13.8416 15.5297C13.0901 15.9079 12.2385 16.0396 11.4078 15.9059C10.5771 15.7723 9.80977 15.3801 9.21485 14.7852C8.61993 14.1902 8.22774 13.4229 8.09408 12.5922C7.96042 11.7615 8.09208 10.9099 8.47034 10.1584C8.8486 9.40685 9.45419 8.79374 10.201 8.40624C10.9478 8.01874 11.7978 7.87658 12.63 8C13.4789 8.12588 14.2649 8.52146 14.8717 9.1283C15.4785 9.73515 15.8741 10.5211 16 11.37Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17.5 6.5H17.51" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
