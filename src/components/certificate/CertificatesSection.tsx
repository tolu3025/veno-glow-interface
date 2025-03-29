
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Download, Eye, ChevronRight } from "lucide-react";
import Certificate from './Certificate';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { format } from 'date-fns';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface CertificateItem {
  id: string;
  name: string;
  date: string;
  score: number;
  unlocked: boolean;
}

const CertificatesSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Fetch user's certificates from Supabase
    const fetchCertificates = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      try {
        // Get user's completed tests with high scores
        const { data: testData, error: testError } = await supabase
          .from('test_attempts')
          .select('id, test_id, score, completed_at, total_questions')
          .eq('user_id', user.id)
          .gte('score', 80) // Only high-scoring tests qualify for certificates
          .order('completed_at', { ascending: false });
        
        if (testError) throw testError;
        
        // Get test names for these attempts
        const testIds = testData?.map(test => test.test_id) || [];
        
        if (testIds.length > 0) {
          const { data: testsInfo, error: testsError } = await supabase
            .from('user_tests')
            .select('id, title')
            .in('id', testIds);
          
          if (testsError) throw testsError;
          
          // Map them together to create certificates
          const userCertificates = testData?.map(test => {
            const testInfo = testsInfo?.find(t => t.id === test.test_id);
            return {
              id: test.id,
              name: testInfo?.title || 'CBT Achievement',
              date: test.completed_at || new Date().toISOString(),
              score: Math.round((test.score / test.total_questions) * 100),
              unlocked: true
            };
          }) || [];
          
          // Add reward-based certificates (from user_profiles)
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('activities')
            .eq('user_id', user.id)
            .single();
          
          if (profileError) throw profileError;
          
          const activities = profileData?.activities || [];
          
          // Fix: Check if activities is an array before calling filter
          let rewardCertificates: CertificateItem[] = [];
          if (Array.isArray(activities)) {
            rewardCertificates = activities
              .filter((activity: any) => activity.type === 'reward_redeemed' && activity.reward_name?.includes('Certificate'))
              .map((activity: any) => ({
                id: activity.reward_id || `reward-${Date.now()}`,
                name: activity.reward_name || 'Achievement Certificate',
                date: activity.timestamp || new Date().toISOString(),
                score: 100,
                unlocked: true
              }));
          }
          
          setCertificates([...userCertificates, ...rewardCertificates]);
        } else {
          setCertificates([]);
        }
      } catch (error) {
        console.error('Error fetching certificates:', error);
        toast({
          title: "Error",
          description: "Failed to fetch certificates. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCertificates();
  }, [user, toast]);

  const downloadCertificate = async (id: string, name: string) => {
    try {
      toast({
        title: "Preparing download...",
        description: "Generating your certificate PDF.",
      });
      
      // Find the certificate element with the ID
      const certificateElement = document.getElementById(`certificate-${id}`);
      
      if (!certificateElement) {
        throw new Error("Certificate element not found");
      }
      
      // Use html2canvas to create an image of the certificate
      const canvas = await html2canvas(certificateElement, {
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      // Create PDF from the image
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 297; // A4 landscape width in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${name.replace(/\s+/g, '-').toLowerCase()}-certificate.pdf`);
      
      toast({
        title: "Success!",
        description: "Certificate downloaded successfully.",
      });
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast({
        title: "Download Failed",
        description: "Could not generate the certificate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center">
          <Award className="mr-2 h-5 w-5 text-veno-primary" /> Certificates
        </h2>
      </div>
      
      <p className="text-muted-foreground">
        Earn certificates by completing tests and achieving milestones.
      </p>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-veno-primary"></div>
        </div>
      ) : certificates.length === 0 ? (
        <Card className="border border-muted bg-muted/10">
          <CardContent className="p-8 text-center">
            <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Certificates Yet</h3>
            <p className="text-muted-foreground mb-4">
              Complete tests with high scores or redeem rewards to earn certificates.
            </p>
            <Button 
              onClick={() => window.location.href="/cbt"}
              variant="outline"
            >
              Take Tests
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certificates.map((cert) => (
            <Card key={cert.id} className={cert.unlocked ? 'border-veno-primary/30' : 'border-muted/50'}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center">
                      <Award className={`h-5 w-5 mr-2 ${cert.unlocked ? 'text-veno-primary' : 'text-muted-foreground'}`} />
                      <h3 className="font-medium">{cert.name}</h3>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mt-1">
                      {cert.unlocked 
                        ? `Earned on ${format(new Date(cert.date), 'MMM d, yyyy')}`
                        : 'Complete requirements to unlock'}
                    </p>
                    
                    {cert.unlocked && cert.score > 0 && (
                      <p className="text-sm mt-1">
                        Score: <span className="font-medium">{cert.score}%</span>
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {cert.unlocked ? (
                      <>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex items-center"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl p-0">
                            <div id={`certificate-${cert.id}`}>
                              <Certificate 
                                userName={user?.email?.split('@')[0] || 'Student'}
                                achievementName={cert.name}
                                date={format(new Date(cert.date), 'MMMM d, yyyy')}
                                score={cert.score}
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => downloadCertificate(cert.id, cert.name)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled
                      >
                        Locked
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CertificatesSection;
