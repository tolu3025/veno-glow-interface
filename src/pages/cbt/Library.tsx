
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { FileText } from "lucide-react";

// Empty resources array - removed all books
const RESOURCES: any[] = [];

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
    const matchesSearch = resource.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         resource.author?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = !selectedSubject || resource.subject === selectedSubject;
    
    return matchesTab && matchesSearch && matchesSubject;
  });

  const uniqueSubjects: (string | undefined)[] = [];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Educational Library</h1>
          <p className="text-muted-foreground">
            Download resources in PDF format
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
                          subject && <SelectItem key={subject} value={subject}>{subject}</SelectItem>
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
        <TabsList className="grid grid-cols-1 md:grid-cols-3 mb-6">
          <TabsTrigger value="all" className="data-[state=active]:bg-veno-primary/10 data-[state=active]:text-veno-primary">
            All Resources
          </TabsTrigger>
          <TabsTrigger value="textbook" className="data-[state=active]:bg-veno-primary/10 data-[state=active]:text-veno-primary">
            Textbooks
          </TabsTrigger>
          <TabsTrigger value="pastquestion" className="data-[state=active]:bg-veno-primary/10 data-[state=active]:text-veno-primary">
            Past Questions
          </TabsTrigger>
        </TabsList>
        
        {/* Resource cards */}
        <TabsContent value={activeTab} className="space-y-4">
          <div className="text-center py-10">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-30" />
            <h3 className="mt-4 text-lg font-medium">No resources found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              There are currently no resources available in the library.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Library;
