
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, ShoppingBag, Users, CreditCard, Gift, AlertCircle, BookOpen, GraduationCap, School, Award } from "lucide-react";
import AdPlacement from "@/components/ads/AdPlacement";
import { supabase } from "@/integrations/supabase/client";

// Product type definition
interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
}

const MarketplacePage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  
  // Fetch products from Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .limit(10);
          
        if (error) {
          console.error('Error fetching products:', error);
        } else if (data) {
          // For now, use sample data if no products are returned
          setProducts(data.length > 0 ? data : getSampleProducts());
          setFeaturedProducts(data.length > 0 ? data.slice(0, 3) : getSampleProducts().slice(0, 3));
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setProducts(getSampleProducts());
        setFeaturedProducts(getSampleProducts().slice(0, 3));
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Sample products for development/preview
  const getSampleProducts = (): Product[] => [
    {
      id: "1",
      title: "Advanced Mathematics Textbook",
      description: "Comprehensive textbook covering algebra, calculus, and statistics for high school students.",
      price: 29.99,
      category: "Books",
      condition: "new"
    },
    {
      id: "2",
      title: "Science Lab Kit",
      description: "Complete lab kit for conducting basic chemistry and physics experiments at home.",
      price: 49.99,
      category: "Equipment",
      condition: "new"
    },
    {
      id: "3",
      title: "History Notes Collection",
      description: "Detailed notes covering world history from ancient civilizations to modern times.",
      price: 19.99,
      category: "Notes",
      condition: "new"
    },
    {
      id: "4",
      title: "Online Course Access - Programming Fundamentals",
      description: "6-month access to a comprehensive programming course covering Python, Java, and web development.",
      price: 79.99,
      category: "Courses",
      condition: "new"
    },
    {
      id: "5",
      title: "School Supplies Bundle",
      description: "Complete set of notebooks, pens, pencils, and other essential school supplies.",
      price: 34.99,
      category: "Supplies",
      condition: "new"
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-3">Loading Marketplace</h1>
          <p className="text-muted-foreground">Please wait while we prepare the marketplace for you...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Veno Marketplace</h1>
          <p className="text-muted-foreground">
            Discover educational resources, study materials, and premium content curated for students and educators.
          </p>
        </div>

        {/* Top Ad Placement */}
        <div className="w-full">
          <AdPlacement location="header" />
        </div>

        {/* Categories and Filters */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            <Badge className="bg-veno-primary hover:bg-veno-primary/80">New</Badge>
            <Badge variant="outline">Educational</Badge>
            <Badge variant="outline">Premium</Badge>
            <Badge variant="outline">Textbooks</Badge>
            <Badge variant="outline">Study Materials</Badge>
            <Badge variant="outline">Technology</Badge>
          </div>
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Latest Products
          </Button>
        </div>

        <Separator />

        {/* Hero Section with Educational Theme */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-8 rounded-xl mb-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-4">Welcome to Veno M</h2>
              <p className="mb-4">Your premier marketplace for educational resources, study materials, and academic tools. Find everything you need to excel in your academic journey.</p>
              <div className="flex gap-3">
                <Button>
                  <School className="mr-2 h-4 w-4" />
                  Explore Categories
                </Button>
                <Button variant="outline">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Learn More
                </Button>
              </div>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="aspect-square max-w-[250px] rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <GraduationCap className="h-24 w-24 text-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* Featured Products Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Featured Products</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map((product) => (
              <Card key={product.id}>
                <CardHeader>
                  <CardTitle>{product.title}</CardTitle>
                  <CardDescription>{product.category}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video rounded-md bg-muted flex items-center justify-center mb-4">
                    <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline">View Details</Button>
                  <p className="text-lg font-bold">${product.price.toFixed(2)}</p>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Middle Ad Placement */}
        <div className="my-8">
          <AdPlacement location="content" />
        </div>

        {/* Product Listings Table */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Available Products</h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.title}</p>
                        <p className="text-sm text-muted-foreground">{product.description.substring(0, 60)}...</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.category}</Badge>
                    </TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm">Add to Cart</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Sidebar Ad Placement */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
          <div className="md:col-span-2">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Educational Resources</h3>
              <p className="mb-4">
                Veno Marketplace offers a wide range of educational resources to help students, teachers, 
                and educational institutions enhance their learning and teaching experiences.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <Award className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Quality Materials</h4>
                    <p className="text-sm text-muted-foreground">Curated and verified by educators</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <BookOpen className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Latest Content</h4>
                    <p className="text-sm text-muted-foreground">Updated regularly with new materials</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <GraduationCap className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Academic Success</h4>
                    <p className="text-sm text-muted-foreground">Resources that help students excel</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Users className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Community Support</h4>
                    <p className="text-sm text-muted-foreground">Connect with other educators and students</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
          <div className="md:col-span-1 flex flex-col">
            <AdPlacement location="sidebar" />
          </div>
        </div>

        <Card className="p-6 bg-muted/50 border-dashed">
          <div className="flex gap-4 items-start">
            <AlertCircle className="h-6 w-6 text-amber-500 mt-1" />
            <div>
              <h3 className="text-lg font-medium mb-2">Marketplace Beta</h3>
              <p className="text-muted-foreground mb-4">
                We're currently developing our marketplace to provide you with high-quality educational resources. 
                This is a beta version of Veno M, our educational marketplace platform. Soon we'll have a wider range 
                of products and services to enhance your learning experience.
              </p>
              <p className="text-sm text-muted-foreground">
                Full launch: Q3 2023
              </p>
            </div>
          </div>
        </Card>

        <Separator />

        {/* Footer Ad Placement */}
        <div className="my-4">
          <AdPlacement location="footer" />
        </div>

        {/* Additional Information Section */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Secure and convenient payment options</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className="py-2 px-4">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Credit Card
                </Badge>
                <Badge variant="outline" className="py-2 px-4">
                  PayPal
                </Badge>
                <Badge variant="outline" className="py-2 px-4">
                  Bank Transfer
                </Badge>
                <Badge variant="outline" className="py-2 px-4">
                  Mobile Money
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>Common questions about our marketplace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium">How do I sell my educational materials?</h4>
                <p className="text-sm text-muted-foreground">Create an account, verify your credentials, and list your products through our seller portal.</p>
              </div>
              <div>
                <h4 className="font-medium">What types of products are accepted?</h4>
                <p className="text-sm text-muted-foreground">Educational resources, study materials, textbooks, digital courses, and academic tools.</p>
              </div>
              <div>
                <h4 className="font-medium">How are products vetted for quality?</h4>
                <p className="text-sm text-muted-foreground">Our team of educators reviews all submitted materials to ensure they meet our quality standards.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MarketplacePage;
