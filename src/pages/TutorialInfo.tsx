
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Check, Star, AlertCircle, BookOpen, BookText, GraduationCap, Rocket, Award, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdPlacement from "@/components/ads/AdPlacement";

const TutorialInfo = () => {
  const navigate = useNavigate();

  return (
    <div className="container py-4 md:py-8">
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Veno Tutorials: Features &amp; Resources</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Comprehensive details about Veno Tutorials, features, and educational resources
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tutorials
          </Button>
        </div>

        <div className="w-full">
          <AdPlacement location="header" />
        </div>

        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-none">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <h2 className="text-xl md:text-2xl font-bold mb-3">About Veno Tutorials</h2>
                <p className="mb-4 text-sm md:text-base">
                  Veno Tutorials is an educational content platform designed to connect students with high-quality
                  learning resources. Our library hosts a variety of tutorials, courses, and educational materials
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
          <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Tutorial Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Mathematics</CardTitle>
                <CardDescription>Various mathematics topics</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-1" />
                    <span className="text-sm">Algebra and calculus</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-1" />
                    <span className="text-sm">Statistics and probability</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-1" />
                    <span className="text-sm">Geometry and trigonometry</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-1" />
                    <span className="text-sm">Mathematical proofs</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Science</CardTitle>
                <CardDescription>Physics, Chemistry, and Biology</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-1" />
                    <span className="text-sm">Physics mechanics and electromagnetism</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-1" />
                    <span className="text-sm">Chemistry - organic and inorganic</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-1" />
                    <span className="text-sm">Biology fundamentals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-1" />
                    <span className="text-sm">Scientific methods and experiments</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Computer Science</CardTitle>
                <CardDescription>Programming and technology</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-1" />
                    <span className="text-sm">Programming fundamentals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-1" />
                    <span className="text-sm">Web development</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-1" />
                    <span className="text-sm">Data structures and algorithms</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-1" />
                    <span className="text-sm">Mobile app development</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="my-6">
          <AdPlacement location="content" />
        </div>

        <div>
          <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Tutorial Levels</h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Level</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Target Audience</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Beginner</TableCell>
                  <TableCell>Introductory content with foundational concepts and basics</TableCell>
                  <TableCell>New learners, students starting a subject</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Intermediate</TableCell>
                  <TableCell>More advanced concepts building on foundational knowledge</TableCell>
                  <TableCell>Students with basic understanding of the subject</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Advanced</TableCell>
                  <TableCell>Complex and in-depth exploration of specialized topics</TableCell>
                  <TableCell>Students with strong subject background, exam preparation</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Professional</TableCell>
                  <TableCell>Expert-level content for mastery and specialized skills</TableCell>
                  <TableCell>College students, professionals, researchers</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </div>

        <Card className="p-4 md:p-6 my-6 bg-muted/50 border-dashed">
          <div className="flex gap-3 md:gap-4 items-start">
            <AlertCircle className="h-5 w-5 md:h-6 md:w-6 text-amber-500 mt-1" />
            <div>
              <h3 className="text-base md:text-lg font-medium mb-2">For Educators</h3>
              <p className="text-xs md:text-sm text-muted-foreground mb-3">
                Are you an educator, content creator, or subject expert? We're looking for contributors to help expand our tutorial library.
                If you're interested in sharing your knowledge and expertise, get in touch with us.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={() => navigate('/contact')}>Contact Us</Button>
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

export default TutorialInfo;
