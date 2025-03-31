
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Download } from "lucide-react";
import { VenoLogo } from "@/components/ui/logo";

interface CertificateProps {
  userName: string;
  achievementName: string;
  date: string;
  score?: number;
  position?: string;
  testDescription?: string;
}

const Certificate: React.FC<CertificateProps> = ({ 
  userName, 
  achievementName, 
  date, 
  score, 
  position,
  testDescription
}) => {
  return (
    <Card className="border-2 border-veno-primary/30 p-1 print:border-2 print:p-1 print:max-w-4xl print:mx-auto">
      <div className="border border-dashed border-veno-primary/50 p-6 print:border print:border-dashed print:p-6">
        <CardContent className="p-8 text-center space-y-6 print:p-8">
          <div className="flex justify-center mb-4">
            <VenoLogo className="h-16 w-16 print:h-16 print:w-16" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-serif font-bold text-veno-primary print:text-3xl">Certificate of Achievement</h2>
            <p className="text-muted-foreground">This certifies that</p>
            <p className="text-2xl font-medium my-4">{userName}</p>
            <p className="text-muted-foreground">has successfully completed</p>
            <p className="text-xl font-medium my-2">{achievementName}</p>
            {testDescription && (
              <p className="text-sm text-muted-foreground mt-1 mb-3">{testDescription}</p>
            )}
            {score !== undefined && (
              <p className="font-medium">
                with a score of <span className="text-veno-primary font-bold">{score}%</span>
              </p>
            )}
            {position && (
              <p className="font-medium mt-2">
                Position: <span className="text-veno-primary font-bold">{position}</span>
              </p>
            )}
            <p className="text-muted-foreground mt-6">Awarded on {date}</p>
          </div>
          
          <div className="mt-8 pt-8 border-t border-muted">
            <div className="flex justify-between items-center">
              <div className="text-left">
                <p className="font-medium">Veno Education</p>
                <p className="text-xs text-muted-foreground">Certificate ID: VEN-{Date.now().toString().slice(-8)}</p>
              </div>
              <div>
                <p className="font-handwriting text-2xl text-veno-primary">Veno Signature</p>
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export default Certificate;
