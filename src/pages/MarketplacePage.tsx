
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, ShoppingBag, Users, CreditCard, Gift, AlertCircle, BookOpen, GraduationCap, School, Award, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AdPlacement from "@/components/ads/AdPlacement";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Product type definition
interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  inventory_count?: number;
}

const MarketplacePage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  
  // Fetch products from Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.email) {
          setBuyerEmail(userData.user.email);
        }

        const { data, error } = await supabase
          .from('products')
          .select('*')
          .limit(20);
          
        if (error) {
          console.error('Error fetching products:', error);
          toast({
            title: "Failed to load products",
            description: error.message,
            variant: "destructive"
          });
        } else if (data && data.length > 0) {
          setProducts(data);
          setFilteredProducts(data);
          setFeaturedProducts(data.slice(0, 3));
        } else {
          // Use sample data if no products are returned
          const sampleProducts = getSampleProducts();
          setProducts(sampleProducts);
          setFilteredProducts(sampleProducts);
          setFeaturedProducts(sampleProducts.slice(0, 3));
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
        const sampleProducts = getSampleProducts();
        setProducts(sampleProducts);
        setFilteredProducts(sampleProducts);
        setFeaturedProducts(sampleProducts.slice(0, 3));
        toast({
          title: "Connection Error",
          description: "Using sample data while we restore connection",
          variant: "default"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products based on search query and category
  useEffect(() => {
    let filtered = products;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.title.toLowerCase().includes(query) || 
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(product => 
        product.category === selectedCategory
      );
    }
    
    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, products]);

  // Sample products for development/preview
  const getSampleProducts = (): Product[] => [
    {
      id: "1",
      title: "Advanced Mathematics Textbook",
      description: "Comprehensive textbook covering algebra, calculus, and statistics for high school students.",
      price: 4500,
      category: "Books",
      condition: "new",
      inventory_count: 15
    },
    {
      id: "2",
      title: "Science Lab Kit",
      description: "Complete lab kit for conducting basic chemistry and physics experiments at home.",
      price: 12000,
      category: "Equipment",
      condition: "new",
      inventory_count: 8
    },
    {
      id: "3",
      title: "History Notes Collection",
      description: "Detailed notes covering world history from ancient civilizations to modern times.",
      price: 3000,
      category: "Notes",
      condition: "new",
      inventory_count: 20
    },
    {
      id: "4",
      title: "Online Course Access - Programming Fundamentals",
      description: "6-month access to a comprehensive programming course covering Python, Java, and web development.",
      price: 15000,
      category: "Courses",
      condition: "new",
      inventory_count: 50
    },
    {
      id: "5",
      title: "School Supplies Bundle",
      description: "Complete set of notebooks, pens, pencils, and other essential school supplies.",
      price: 7500,
      category: "Supplies",
      condition: "new",
      inventory_count: 25
    },
    {
      id: "6",
      title: "UTME Past Questions - All Subjects",
      description: "Compilation of past UTME questions for all subjects with detailed solutions.",
      price: 2800,
      category: "Study Materials",
      condition: "new",
      inventory_count: 100
    },
    {
      id: "7",
      title: "Scientific Calculator",
      description: "Advanced scientific calculator for mathematics, physics, and engineering students.",
      price: 6500,
      category: "Equipment",
      condition: "new",
      inventory_count: 30
    },
    {
      id: "8",
      title: "Biology Slide Set",
      description: "Professional set of biology slides for microscope observation.",
      price: 8000,
      category: "Equipment",
      condition: "new",
      inventory_count: 12
    }
  ];

  const handleAddToCart = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setCheckoutDialogOpen(true);
  };

  const handleCheckout = async () => {
    if (!selectedProduct) return;
    
    if (!buyerEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessingPayment(true);
    
    try {
      const response = await supabase.functions.invoke('process-payment', {
        body: {
          productId: selectedProduct.id,
          title: selectedProduct.title,
          price: selectedProduct.price,
          buyerEmail,
          buyerName,
          quantity
        }
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      const { data } = response;
      
      if (data.success && data.paymentLink) {
        // Redirect to Flutterwave payment page
        window.location.href = data.paymentLink;
      } else {
        throw new Error('Failed to generate payment link');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to process payment",
        variant: "destructive"
      });
      setIsProcessingPayment(false);
    }
  };

  // Get all unique categories
  const categories = Array.from(new Set(products.map(product => product.category)));

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

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant={selectedCategory === "" ? "default" : "outline"} 
              size="sm"
              onClick={() => setSelectedCategory("")}
            >
              All
            </Button>
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
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
                  <Button variant="outline" onClick={() => handleAddToCart(product)}>Buy Now</Button>
                  <p className="text-lg font-bold">₦{product.price.toLocaleString()}</p>
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
                  <TableHead>Price (₦)</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
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
                    <TableCell>{product.price.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => handleAddToCart(product)}>Buy Now</Button>
                    </TableCell>
                  </TableRow>
                ))}

                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 text-muted-foreground opacity-50" />
                        <p className="font-medium">No products found</p>
                        <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
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
              <h3 className="text-lg font-medium mb-2">Marketplace v1.0</h3>
              <p className="text-muted-foreground mb-4">
                This is the first version of Veno M, our educational marketplace platform. We offer a wide range 
                of educational resources at affordable prices. All products are in Nigerian Naira (₦) and payment 
                is processed securely through Flutterwave.
              </p>
              <p className="text-sm text-muted-foreground">
                Launch: April 2023
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
                  Card Payment
                </Badge>
                <Badge variant="outline" className="py-2 px-4">
                  Bank Transfer
                </Badge>
                <Badge variant="outline" className="py-2 px-4">
                  USSD
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
                <h4 className="font-medium">How do I track my order?</h4>
                <p className="text-sm text-muted-foreground">Visit the Orders page to see all your purchases and their current status.</p>
              </div>
              <div>
                <h4 className="font-medium">What payment methods are accepted?</h4>
                <p className="text-sm text-muted-foreground">We accept card payments, bank transfers, USSD, and mobile money through Flutterwave.</p>
              </div>
              <div>
                <h4 className="font-medium">How are digital products delivered?</h4>
                <p className="text-sm text-muted-foreground">Digital products are delivered to your email immediately after payment confirmation.</p>
              </div>
              <div>
                <h4 className="font-medium">How can I sell my educational materials?</h4>
                <p className="text-sm text-muted-foreground">Contact us to become a verified seller on Veno Marketplace.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={checkoutDialogOpen} onOpenChange={setCheckoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Your Purchase</DialogTitle>
            <DialogDescription>
              Review your order details before proceeding to payment.
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex flex-col space-y-2">
                        <h3 className="font-medium">{selectedProduct.title}</h3>
                        <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
                        <div className="flex justify-between items-center mt-2">
                          <Badge variant="outline">{selectedProduct.category}</Badge>
                          <span className="font-bold">₦{selectedProduct.price.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="col-span-4 space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    placeholder="your@email.com"
                    type="email"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="col-span-4 space-y-2">
                  <Label htmlFor="name">Full Name (Optional)</Label>
                  <Input
                    id="name"
                    placeholder="Your full name"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                  />
                </div>
                
                <div className="col-span-4 space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      -
                    </Button>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                      disabled={selectedProduct.inventory_count ? quantity >= selectedProduct.inventory_count : false}
                    >
                      +
                    </Button>
                  </div>
                </div>
                
                <div className="col-span-4">
                  <Separator />
                </div>
                
                <div className="col-span-4">
                  <div className="flex justify-between">
                    <span className="font-medium">Subtotal:</span>
                    <span>₦{(selectedProduct.price * quantity).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="font-medium">Delivery:</span>
                    <span>₦0.00 (Digital Product)</span>
                  </div>
                  <div className="flex justify-between mt-4 text-lg font-bold">
                    <span>Total:</span>
                    <span>₦{(selectedProduct.price * quantity).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex-col sm:flex-row sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setCheckoutDialogOpen(false)}
              disabled={isProcessingPayment}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCheckout} 
              disabled={isProcessingPayment}
              className="mt-2 sm:mt-0"
            >
              {isProcessingPayment ? (
                <>
                  <span className="animate-spin mr-2">◌</span>
                  Processing...
                </>
              ) : (
                <>Proceed to Payment</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarketplacePage;
