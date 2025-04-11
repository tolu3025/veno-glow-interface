
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Check, Star, AlertCircle, BookOpen, BookText, GraduationCap, Rocket, Award, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdPlacement from "@/components/ads/AdPlacement";

const MarketplaceInfo = () => {
  const navigate = useNavigate();

  return (
    <div className="container py-4 md:py-8">
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Veno Marketplace: Versions &amp; Features</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Comprehensive details about Veno Marketplace versions, features, and roadmap
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Marketplace
          </Button>
        </div>

        <div className="w-full">
          <AdPlacement location="header" />
        </div>

        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-none">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <h2 className="text-xl md:text-2xl font-bold mb-3">About Veno Marketplace</h2>
                <p className="mb-4 text-sm md:text-base">
                  Veno Marketplace is an educational content platform designed to connect students with high-quality
                  learning resources. Our marketplace hosts a variety of tutorials, courses, and educational materials
                  created by experts across different subjects and academic levels.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary" className="px-2 py-1">
                    <BookText className="mr-1 h-3 w-3" />
                    Educational Resources
                  </Badge>
                  <Badge variant="secondary" className="px-2 py-1">
                    <GraduationCap className="mr-1 h-3 w-3" />
                    Expert-Led Tutorials
                  </Badge>
                  <Badge variant="secondary" className="px-2 py-1">
                    <BookOpen className="mr-1 h-3 w-3" />
                    Curriculum-Aligned
                  </Badge>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-8">
                  <Rocket className="h-16 w-16 md:h-24 md:w-24 text-primary" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Marketplace Versions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0">
                <Badge className="m-2 bg-blue-500">Current</Badge>
              </div>
              <CardHeader>
                <CardTitle>Version 1.0</CardTitle>
                <CardDescription>April 16, 2024</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-1" />
                    <span className="text-sm">Tutorial marketplace with payments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-1" />
                    <span className="text-sm">Video previews and full content access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-1" />
                    <span className="text-sm">Secure payment processing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-1" />
                    <span className="text-sm">User purchase tracking</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">Initial release with core functionality</p>
              </CardFooter>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0">
                <Badge className="m-2 bg-amber-500">Coming Soon</Badge>
              </div>
              <CardHeader>
                <CardTitle>Beta 2.0</CardTitle>
                <CardDescription>Q2 2025</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Star className="h-4 w-4 text-amber-500 mt-1" />
                    <span className="text-sm">Seller accounts for content creators</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="h-4 w-4 text-amber-500 mt-1" />
                    <span className="text-sm">Enhanced content discovery</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="h-4 w-4 text-amber-500 mt-1" />
                    <span className="text-sm">Rating system and reviews</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="h-4 w-4 text-amber-500 mt-1" />
                    <span className="text-sm">Content recommendations</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">Beta phase with expanded features</p>
              </CardFooter>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0">
                <Badge className="m-2 bg-purple-500">Roadmap</Badge>
              </div>
              <CardHeader>
                <CardTitle>Version 3.0</CardTitle>
                <CardDescription>Q4 2025</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Rocket className="h-4 w-4 text-purple-500 mt-1" />
                    <span className="text-sm">Interactive learning experiences</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Rocket className="h-4 w-4 text-purple-500 mt-1" />
                    <span className="text-sm">Learning paths and certification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Rocket className="h-4 w-4 text-purple-500 mt-1" />
                    <span className="text-sm">Subscription model options</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Rocket className="h-4 w-4 text-purple-500 mt-1" />
                    <span className="text-sm">Mobile app integration</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">Full release with advanced capabilities</p>
              </CardFooter>
            </Card>
          </div>
        </div>

        <div className="my-6">
          <AdPlacement location="content" />
        </div>

        <div>
          <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Feature Comparison</h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature</TableHead>
                  <TableHead>Version 1.0</TableHead>
                  <TableHead>Beta 2.0</TableHead>
                  <TableHead>Version 3.0</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Content Purchase</TableCell>
                  <TableCell><Check className="h-4 w-4 text-green-500" /></TableCell>
                  <TableCell><Check className="h-4 w-4 text-green-500" /></TableCell>
                  <TableCell><Check className="h-4 w-4 text-green-500" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Video Previews</TableCell>
                  <TableCell><Check className="h-4 w-4 text-green-500" /></TableCell>
                  <TableCell><Check className="h-4 w-4 text-green-500" /></TableCell>
                  <TableCell><Check className="h-4 w-4 text-green-500" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Seller Accounts</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell><Check className="h-4 w-4 text-green-500" /></TableCell>
                  <TableCell><Check className="h-4 w-4 text-green-500" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Reviews & Ratings</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell><Check className="h-4 w-4 text-green-500" /></TableCell>
                  <TableCell><Check className="h-4 w-4 text-green-500" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Learning Paths</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell><Check className="h-4 w-4 text-green-500" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Subscription Option</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell><Check className="h-4 w-4 text-green-500" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Certifications</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell><Check className="h-4 w-4 text-green-500" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Mobile App Access</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell><Check className="h-4 w-4 text-green-500" /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </div>

        <Card className="p-4 md:p-6 my-6 bg-muted/50 border-dashed">
          <div className="flex gap-3 md:gap-4 items-start">
            <AlertCircle className="h-5 w-5 md:h-6 md:w-6 text-amber-500 mt-1" />
            <div>
              <h3 className="text-base md:text-lg font-medium mb-2">For Content Creators</h3>
              <p className="text-xs md:text-sm text-muted-foreground mb-3">
                Are you an educator, content creator, or subject expert? Veno Marketplace is looking for high-quality educational content creators.
                Starting with our Beta 2.0 release, you'll be able to create a seller account and upload your own educational materials.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs md:text-sm text-muted-foreground">Interested?</p>
                <Button size="sm">Contact Us</Button>
              </div>
            </div>
          </div>
        </Card>

        <Separator />

        <div className="my-3 md:my-4">
          <AdPlacement location="footer" />
        </div>
      </div>
    </div>
  );
};

export default MarketplaceInfo;
