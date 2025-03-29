
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Download, Eye, ChevronRight } from "lucide-react";
import Certificate from './Certificate';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { format } from 'date-fns';
import { useAuth } from '@/providers/AuthProvider';

interface CertificateItem {
  id: string;
  name: string;
  date: string;
  score: number;
  unlocked: boolean;
}

const CertificatesSection = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<CertificateItem[]>([
    {
      id: '1',
      name: 'CBT Mastery Level 1',
      date: '2023-09-15',
      score: 85,
      unlocked: true
    },
    {
      id: '2',
      name: 'Subject Matter Expert',
      date: '2023-10-22',
      score: 92,
      unlocked: true
    },
    {
      id: '3',
      name: 'Advanced Test Taker',
      date: '2023-11-30',
      score: 0,
      unlocked: false
    },
    {
      id: '4',
      name: 'Veno Platinum Member',
      date: '2024-01-10',
      score: 0,
      unlocked: false
    }
  ]);

  const downloadCertificate = (id: string) => {
    // In a real app, generate a PDF and download it
    console.log('Downloading certificate:', id);
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
                          <Certificate 
                            userName={user?.email?.split('@')[0] || 'Student'}
                            achievementName={cert.name}
                            date={format(new Date(cert.date), 'MMMM d, yyyy')}
                            score={cert.score}
                          />
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => downloadCertificate(cert.id)}
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
    </div>
  );
};

export default CertificatesSection;
