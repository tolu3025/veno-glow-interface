
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Download, Book, FileText, BookOpen, Search, Filter, ExternalLink } from "lucide-react";
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
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { appendToUserActivities } from "@/utils/activityHelpers";

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

// Updated resources with the provided Google Drive links
const RESOURCES: Resource[] = [
  {
    id: "1",
    title: "The 2-0-2-4",
    author: "Toluwanimi Oyetade",
    category: "ebook",
    subject: "Personal Development",
    description: "A comprehensive guide to personal growth and achievement in 2024.",
    fileUrl: "https://drive.google.com/file/d/1Xo17gRDAmCUSGssGO1EWVRdMwR9PclSQ/view?usp=drivesdk",
    coverImage: "https://via.placeholder.com/150",
    downloadCount: 845,
    fileSize: "1.8 MB",
    dateAdded: "2024-06-01"
  },
  {
    id: "2",
    title: "Essential Mathematics",
    author: "Dr. Samuel Adegoke",
    category: "textbook",
    subject: "Mathematics",
    description: "A fundamental textbook covering all essential mathematics concepts for science and engineering students.",
    fileUrl: "https://drive.google.com/file/d/1ENgMGn_PWP-uunlUkx9O4zqL85OjxNck/view?usp=drivesdk",
    coverImage: "https://via.placeholder.com/150",
    downloadCount: 1328,
    fileSize: "3.2 MB",
    dateAdded: "2024-05-15"
  },
  {
    id: "3",
    title: "JAMB Past Questions",
    author: "Nigerian Educational Board",
    category: "pastquestion",
    subject: "English",
    description: "Compilation of JAMB English Language past questions with answers and explanations.",
    fileUrl: "https://drive.google.com/file/d/1hG_q5aCmeVcJjrseljZTTVBiq-SWHPb3/view?usp=drivesdk",
    coverImage: "https://via.placeholder.com/150",
    downloadCount: 2750,
    fileSize: "2.1 MB",
    dateAdded: "2024-04-20"
  },
  {
    id: "4",
    title: "Chemistry Guide",
    author: "Prof. Adeola Johnson",
    category: "textbook",
    subject: "Chemistry",
    description: "Comprehensive chemistry guide for students.",
    fileUrl: "https://drive.google.com/file/d/1Jcw2ja2gff1ANgaVNeIoAu-PM2IaetSL/view?usp=drivesdk",
    coverImage: "https://via.placeholder.com/150",
    downloadCount: 1967,
    fileSize: "1.4 MB",
    dateAdded: "2024-03-12"
  }
];

const Library = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const { user } = useAuth();

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

  const handleDownload = async (resource: Resource) => {
    // Actually open the resource URL
    window.open(resource.fileUrl, '_blank');
    
    toast({
      title: "Download started",
      description: `${resource.title} is now downloading.`,
    });
    
    // Record download activity if user is logged in
    if (user) {
      try {
        await appendToUserActivities(user.id, {
          type: "resource_download",
          resource_id: resource.id,
          resource_title: resource.title,
          timestamp: new Date().toISOString()
        });
        
        // If this is The 2-0-2-4 book, update task progress
        if (resource.id === "1") {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('activities')
            .eq('user_id', user.id)
            .single();
          
          if (!error && data) {
            const activities = Array.isArray(data.activities) ? data.activities : [];
            
            // Fix: Properly type check and ensure activities is an array before using 'some'
            const hasDownloadedBook = Array.isArray(activities) && activities.some(
              (activity: any) => activity.type === "resource_download" && activity.resource_id === "1"
            );
            
            if (hasDownloadedBook) {
              toast({
                title: "Task Progress Updated",
                description: "This download counts toward your reading task completion.",
              });
            }
          }
        }
      } catch (error) {
        console.error("Error recording download activity:", error);
      }
    }
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
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="text-xs h-8" 
                          onClick={() => window.open(resource.fileUrl, '_blank')}
                        >
                          <ExternalLink size={14} className="mr-1" /> View
                        </Button>
                        <Button 
                          variant="default" 
                          className="text-xs h-8" 
                          onClick={() => handleDownload(resource)}
                        >
                          <Download size={14} className="mr-1" /> Download
                        </Button>
                      </div>
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
                <TableHead className="text-right">Actions</TableHead>
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
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => window.open(resource.fileUrl, '_blank')}
                      >
                        <ExternalLink size={16} />
                        <span className="sr-only">View</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDownload(resource)}
                      >
                        <Download size={16} />
                        <span className="sr-only">Download</span>
                      </Button>
                    </div>
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
