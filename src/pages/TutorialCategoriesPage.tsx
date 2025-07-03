
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Construction, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TutorialCategoriesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardHeader className="pb-8">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100">
                <Construction className="h-10 w-10 text-orange-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Tutorials Under Maintenance
              </CardTitle>
              <CardDescription className="text-lg text-gray-600 mt-4">
                We're currently working on improving our tutorial content to provide you with the best learning experience possible.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <p className="text-gray-500">
                  Our team is updating and enhancing the tutorial section. Please check back soon for new and improved content!
                </p>
                <div className="pt-6">
                  <Button 
                    onClick={() => navigate('/')}
                    className="inline-flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TutorialCategoriesPage;
