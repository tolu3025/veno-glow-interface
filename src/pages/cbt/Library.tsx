
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Download, Book, FileText, BookOpen, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Resource {
  id: string;
  title: string;
  author: string;
  category: "novel" | "textbook" | "ebook" | "pastquestion";
  subject?: string;
  description: string;
  fileUrl: string;
  coverImage?: string;
  downloadCount: number;
  fileSize: string;
  dateAdded: string;
}

// Mock data for educational resources
const RESOURCES: Resource[] = [
  {
    id: "1",
    title: "Introduction to Advanced Mathematics",
    author: "Dr. Sarah Johnson",
    category: "textbook",
    subject: "Mathematics",
    description: "A comprehensive introduction to advanced mathematical concepts including calculus, linear algebra, and statistics.",
    fileUrl: "https://docs.google.com/document/d/15e4BK17veIfu0Hrtr6BOSxTK7R3GsND2/edit?usp=drivesdk&ouid=109697640699858255027&rtpof=true&sd=true",
    coverImage: "https://via.placeholder.com/150",
    downloadCount: 1250,
    fileSize: "4.2 MB",
    dateAdded: "2023-05-15"
  },
  {
    id: "2",
    title: "Physics Principles and Problems",
    author: "Prof. Michael Chen",
    category: "textbook",
    subject: "Physics",
    description: "Explore the fundamental principles of physics with practical examples and problem-solving approaches.",
    fileUrl: "https://docs.google.com/document/d/15e4BK17veIfu0Hrtr6BOSxTK7R3GsND2/edit?usp=drivesdk&ouid=109697640699858255027&rtpof=true&sd=true",
    coverImage: "https://via.placeholder.com/150",
    downloadCount: 985,
    fileSize: "5.1 MB",
    dateAdded: "2023-06-22"
  },
  {
    id: "3",
    title: "WAEC Past Questions - Biology (2018-2023)",
    author: "Education Board",
    category: "pastquestion",
    subject: "Biology",
    description: "Compilation of past WAEC examination questions in Biology from 2018 to 2023 with detailed solutions.",
    fileUrl: "https://docs.google.com/document/d/15e4BK17veIfu0Hrtr6BOSxTK7R3GsND2/edit?usp=drivesdk&ouid=109697640699858255027&rtpof=true&sd=true",
    coverImage: "https://via.placeholder.com/150",
    downloadCount: 3560,
    fileSize: "2.8 MB",
    dateAdded: "2023-07-10"
  },
  {
    id: "4",
    title: "Things Fall Apart",
    author: "Chinua Achebe",
    category: "novel",
    description: "A classic Nigerian novel about the tragic consequences of the arrival of European missionaries and colonial government in a traditional Igbo community.",
    fileUrl: "https://docs.google.com/document/d/15e4BK17veIfu0Hrtr6BOSxTK7R3GsND2/edit?usp=drivesdk&ouid=109697640699858255027&rtpof=true&sd=true",
    coverImage: "https://via.placeholder.com/150",
    downloadCount: 4250,
    fileSize: "1.5 MB",
    dateAdded: "2023-02-18"
  },
  {
    id: "5",
    title: "Digital Marketing Fundamentals",
    author: "Lisa Rodriguez",
    category: "ebook",
    subject: "Business",
    description: "A comprehensive guide to the fundamentals of digital marketing including social media, SEO, content marketing, and analytics.",
    fileUrl: "https://docs.google.com/document/d/15e4BK17veIfu0Hrtr6BOSxTK7R3GsND2/edit?usp=drivesdk&ouid=109697640699858255027&rtpof=true&sd=true",
    coverImage: "https://via.placeholder.com/150",
    downloadCount: 2100,
    fileSize: "3.7 MB",
    dateAdded: "2023-08-05"
  },
  {
    id: "6",
    title: "JAMB Past Questions - Chemistry",
    author: "Education Resources Inc.",
    category: "pastquestion",
    subject: "Chemistry",
    description: "Collection of JAMB past questions in Chemistry with detailed explanations and solutions.",
    fileUrl: "https://docs.google.com/document/d/15e4BK17veIfu0Hrtr6BOSxTK7R3GsND2/edit?usp=drivesdk&ouid=109697640699858255027&rtpof=true&sd=true",
    coverImage: "https://via.placeholder.com/150",
    downloadCount: 2890,
    fileSize: "3.2 MB",
    dateAdded: "2023-09-12"
  }
];

const Library = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Filter resources based on active tab, search term and selected subject
  const filteredResources = RESOURCES.filter(resource => {
    const matchesTab = activeTab === "all" || resource.category === activeTab;
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         resource.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = !selectedSubject || resource.subject === selectedSubject;
    
    return matchesTab && matchesSearch && matchesSubject;
  });

  const uniqueSubjects = Array.from(
    new Set(RESOURCES.filter(r => r.subject).map(r => r.subject))
  );

  const handleDownload = (resource: Resource) => {
    // In a real app, this would initiate the actual download
    // For now, we'll just open the Google Doc link in a new tab
    window.open(resource.fileUrl, '_blank');
    
    toast({
      title: "Download started",
      description: `${resource.title} is now downloading.`,
    });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Educational Library</h1>
          <p className="text-muted-foreground">
            Download novels, textbooks, e-books, and past questions in PDF format
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or author..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="sm:w-auto w-full flex items-center gap-2"
          >
            <Filter size={16} />
            Filters
          </Button>
        </div>

        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <CollapsibleContent>
            <div className="bg-muted/50 p-4 rounded-md mb-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-1/3">
                  <Select onValueChange={(value) => setSelectedSubject(value === "all" ? null : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Subjects</SelectLabel>
                        <SelectItem value="all">All Subjects</SelectItem>
                        {uniqueSubjects.map((subject) => (
                          <SelectItem key={subject} value={subject!}>{subject}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Tabs for different resource types */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-6">
          <TabsTrigger value="all" className="data-[state=active]:bg-veno-primary/10 data-[state=active]:text-veno-primary">
            All Resources
          </TabsTrigger>
          <TabsTrigger value="textbook" className="data-[state=active]:bg-veno-primary/10 data-[state=active]:text-veno-primary">
            <BookOpen size={16} className="mr-2 hidden md:inline" /> Textbooks
          </TabsTrigger>
          <TabsTrigger value="novel" className="data-[state=active]:bg-veno-primary/10 data-[state=active]:text-veno-primary">
            <Book size={16} className="mr-2 hidden md:inline" /> Novels
          </TabsTrigger>
          <TabsTrigger value="ebook" className="data-[state=active]:bg-veno-primary/10 data-[state=active]:text-veno-primary">
            <FileText size={16} className="mr-2 hidden md:inline" /> E-Books
          </TabsTrigger>
          <TabsTrigger value="pastquestion" className="data-[state=active]:bg-veno-primary/10 data-[state=active]:text-veno-primary">
            Past Questions
          </TabsTrigger>
        </TabsList>
        
        {/* Resource cards */}
        <TabsContent value={activeTab} className="space-y-4">
          {filteredResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((resource) => (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="h-full flex flex-col overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{resource.title}</CardTitle>
                      <CardDescription>By {resource.author}</CardDescription>
                    </CardHeader>
                    <CardContent className="py-2 flex-grow">
                      <p className="text-sm text-muted-foreground mb-2">{resource.description}</p>
                      <div className="text-sm mt-4">
                        {resource.subject && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary mr-2 mb-2">
                            {resource.subject}
                          </span>
                        )}
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground mr-2 mb-2">
                          {resource.fileSize}
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2 flex justify-between items-center border-t bg-muted/30">
                      <div className="text-xs text-muted-foreground">
                        {resource.downloadCount} downloads
                      </div>
                      <Button 
                        variant="default" 
                        className="text-xs h-8" 
                        onClick={() => handleDownload(resource)}
                      >
                        <Download size={14} className="mr-1" /> Download
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-30" />
              <h3 className="mt-4 text-lg font-medium">No resources found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Try adjusting your search or filter criteria.
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setSelectedSubject(null);
                  setActiveTab("all");
                }}
                className="mt-4"
              >
                Reset filters
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Table view for desktop */}
      <div className="hidden md:block mt-10">
        <h2 className="text-xl font-semibold mb-4">Resources List</h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Downloads</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResources.map((resource) => (
                <TableRow key={resource.id}>
                  <TableCell className="font-medium">{resource.title}</TableCell>
                  <TableCell className="capitalize">{resource.category}</TableCell>
                  <TableCell>{resource.subject || "-"}</TableCell>
                  <TableCell>{resource.fileSize}</TableCell>
                  <TableCell>{resource.downloadCount}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDownload(resource)}
                    >
                      <Download size={16} />
                      <span className="sr-only">Download</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default Library;
