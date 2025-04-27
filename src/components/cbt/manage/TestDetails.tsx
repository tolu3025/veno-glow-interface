
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface TestDetailsProps {
  title: string;
  description: string | null;
  questionCount: number;
  timeLimit: number | null;
  difficulty: string;
  shareCode: string;
  createdAt: string;
  formatDate: (date: string) => string;
}

export const TestDetails = ({
  title,
  description,
  questionCount,
  timeLimit,
  difficulty,
  shareCode,
  createdAt,
  formatDate
}: TestDetailsProps) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description || 'No description'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-secondary/30 p-3 rounded-md">
            <p className="text-sm font-medium">Questions</p>
            <p className="text-lg">{questionCount}</p>
          </div>
          <div className="bg-secondary/30 p-3 rounded-md">
            <p className="text-sm font-medium">Time Limit</p>
            <p className="text-lg">{timeLimit || 'No'} min</p>
          </div>
          <div className="bg-secondary/30 p-3 rounded-md">
            <p className="text-sm font-medium">Difficulty</p>
            <p className="text-lg capitalize">{difficulty}</p>
          </div>
        </div>
        
        <div className="flex justify-between items-center border-t pt-4 mt-4">
          <p className="text-sm text-muted-foreground">
            Share Code: <span className="font-mono bg-secondary/50 px-1 rounded">{shareCode}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Created: {formatDate(createdAt)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
