import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, ShoppingBag, Users, CreditCard, Gift, AlertCircle, BookOpen, GraduationCap, School, Award, Search, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AdPlacement from "@/components/ads/AdPlacement";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

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
    <div className="container py-4 md:py-8">
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Veno Marketplace</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Discover educational resources, study materials, and premium content curated for students and educators.
          </p>
        </div>

        <div className="w-full">
          <AdPlacement location="header" />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap mt-2 sm:mt-0">
            <Button 
              variant={selectedCategory === "" ? "default" : "outline"} 
              size={isMobile ? "sm" : "sm"}
              onClick={() => setSelectedCategory("")}
              className="text-xs md:text-sm px-2 py-1"
            >
              All
            </Button>
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size={isMobile ? "sm" : "sm"}
                onClick={() => setSelectedCategory(category)}
                className="text-xs md:text-sm px-2 py-1"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-4 md:p-8 rounded-lg md:rounded-xl mb-4 md:mb-6">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
            <div className="flex-1">
              <h2 className="text-xl md:text-2xl font-bold mb-2 md:mb-4">Welcome to Veno M</h2>
              <p className="text-sm md:text-base mb-4">Your premier marketplace for educational resources, study materials, and academic tools. Find everything you need to excel in your academic journey.</p>
              <div className="flex flex-wrap gap-2 md:gap-3">
                <Button size={isMobile ? "sm" : "default"}>
                  <School className="mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
                  Explore Categories
                </Button>
                <Button variant="outline" size={isMobile ? "sm" : "default"}>
                  <BookOpen className="mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
                  Learn More
                </Button>
              </div>
            </div>
            <div className="flex-1 flex justify-center mt-4 md:mt-0">
              <div className="aspect-square w-32 md:max-w-[250px] rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <GraduationCap className="h-16 w-16 md:h-24 md:w-24 text-primary" />
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Featured Products</h2>
          <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map((product) => (
              <Card key={product.id} className="h-full">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-lg md:text-xl">{product.title}</CardTitle>
                  <CardDescription>{product.category}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                  <div className="aspect-video rounded-md bg-muted flex items-center justify-center mb-3 md:mb-4">
                    <ShoppingBag className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground" />
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground">{product.description}</p>
                </CardContent>
                <CardFooter className="p-4 pt-0 md:p-6 md:pt-0 flex justify-between items-center">
                  <Button variant="outline" size={isMobile ? "sm" : "default"} onClick={() => handleAddToCart(product)}>Buy Now</Button>
                  <p className="text-base md:text-lg font-bold">₦{product.price.toLocaleString()}</p>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        <div className="my-4 md:my-8">
          <AdPlacement location="content" />
        </div>

        <div>
          <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Available Products</h2>
          <Card>
            <div className={isMobile ? "overflow-x-auto" : ""}>
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
                          <p className="font-medium text-sm md:text-base">{product.title}</p>
                          <p className="text-xs md:text-sm text-muted-foreground">{product.description.substring(0, isMobile ? 40 : 60)}...</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{product.category}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{product.price.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => handleAddToCart(product)}>Buy Now</Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 md:py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground opacity-50" />
                          <p className="font-medium">No products found</p>
                          <p className="text-xs md:text-sm text-muted-foreground">Try adjusting your search or filters</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 my-6 md:my-8">
          <div className="md:col-span-2">
            <Card className="p-4 md:p-6">
              <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4">Educational Resources</h3>
              <p className="text-sm md:text-base mb-3 md:mb-4">
                Veno Marketplace offers a wide range of educational resources to help students, teachers, 
                and educational institutions enhance their learning and teaching experiences.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div className="flex items-start gap-2">
                  <Award className="h-4 w-4 md:h-5 md:w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm md:text-base">Quality Materials</h4>
                    <p className="text-xs md:text-sm text-muted-foreground">Curated and verified by educators</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm md:text-base">Latest Content</h4>
                    <p className="text-xs md:text-sm text-muted-foreground">Updated regularly with new materials</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <GraduationCap className="h-4 w-4 md:h-5 md:w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm md:text-base">Academic Success</h4>
                    <p className="text-xs md:text-sm text-muted-foreground">Resources that help students excel</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 md:h-5 md:w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm md:text-base">Community Support</h4>
                    <p className="text-xs md:text-sm text-muted-foreground">Connect with other educators and students</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
          <div className="md:col-span-1 flex flex-col">
            <AdPlacement location="sidebar" />
          </div>
        </div>

        <Card className="p-4 md:p-6 bg-muted/50 border-dashed">
          <div className="flex gap-3 md:gap-4 items-start">
            <AlertCircle className="h-5 w-5 md:h-6 md:w-6 text-amber-500 mt-1" />
            <div>
              <h3 className="text-base md:text-lg font-medium mb-2">Marketplace v1.0 Beta</h3>
              <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
                Veno Marketplace version 1.0 is set to launch on April 16, 2024. 
                The beta version will be available in Q2 of 2025. 
                If you are interested in uploading your products, 
                please contact us through our WhatsApp at +2347065684718.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs md:text-sm text-muted-foreground">
                  Launch Dates:
                </p>
                <Badge variant="outline" className="text-xs">Version 1.0: April 16, 2024</Badge>
                <Badge variant="outline" className="text-xs">Beta: Q2 2025</Badge>
              </div>
              <div className="mt-3 md:mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const phoneNumber = "+2347065684718";
                    const message = encodeURIComponent("Hello! I'm interested in uploading products to the Veno Marketplace.");
                    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
                  }}
                  className="flex items-center text-xs md:text-sm"
                >
                  <MessageCircle className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                  Contact via WhatsApp
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Separator />

        <div className="my-3 md:my-4">
          <AdPlacement location="footer" />
        </div>

        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg md:text-xl">Payment Methods</CardTitle>
              <CardDescription>Secure and convenient payment options</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
              <div className="flex gap-1.5 md:gap-2 flex-wrap">
                <Badge variant="outline" className="py-1 md:py-2 px-2 md:px-4 text-xs">
                  <CreditCard className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  Card Payment
                </Badge>
                <Badge variant="outline" className="py-1 md:py-2 px-2 md:px-4 text-xs">
                  Bank Transfer
                </Badge>
                <Badge variant="outline" className="py-1 md:py-2 px-2 md:px-4 text-xs">
                  USSD
                </Badge>
                <Badge variant="outline" className="py-1 md:py-2 px-2 md:px-4 text-xs">
                  Mobile Money
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg md:text-xl">Frequently Asked Questions</CardTitle>
              <CardDescription>Common questions about our marketplace</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 md:p-6 md:pt-0 space-y-3 md:space-y-4">
              <div>
                <h4 className="font-medium text-sm md:text-base">How do I track my order?</h4>
                <p className="text-xs md:text-sm text-muted-foreground">Visit the Orders page to see all your purchases and their current status.</p>
              </div>
              <div>
                <h4 className="font-medium text-sm md:text-base">What payment methods are accepted?</h4>
                <p className="text-xs md:text-sm text-muted-foreground">We accept card payments, bank transfers, USSD, and mobile money through Flutterwave.</p>
              </div>
              <div>
                <h4 className="font-medium text-sm md:text-base">How are digital products delivered?</h4>
                <p className="text-xs md:text-sm text-muted-foreground">Digital products are delivered to your email immediately after payment confirmation.</p>
              </div>
              <div>
                <h4 className="font-medium text-sm md:text-base">How can I sell my educational materials?</h4>
                <p className="text-xs md:text-sm text-muted-foreground">Contact us to become a verified seller on Veno Marketplace.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={checkoutDialogOpen} onOpenChange={setCheckoutDialogOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-lg">
          <DialogHeader>
            <DialogTitle>Complete Your Purchase</DialogTitle>
            <DialogDescription>
              Review your order details before proceeding to payment.
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-3 md:space-y-4 py-3 md:py-4">
              <div className="grid grid-cols-4 gap-3 md:gap-4">
                <div className="col-span-4">
                  <Card>
                    <CardContent className="p-3 md:p-4">
                      <div className="flex flex-col space-y-2">
                        <h3 className="font-medium text-sm md:text-base">{selectedProduct.title}</h3>
                        <p className="text-xs md:text-sm text-muted-foreground">{selectedProduct.description}</p>
                        <div className="flex justify-between items-center mt-2">
                          <Badge variant="outline" className="text-xs">{selectedProduct.category}</Badge>
                          <span className="font-bold text-sm md:text-base">₦{selectedProduct.price.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="col-span-4 space-y-1 md:space-y-2">
                  <Label htmlFor="email" className="text-xs md:text-sm">Email address</Label>
                  <Input
                    id="email"
                    placeholder="your@email.com"
                    type="email"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    required
                    className="text-xs md:text-sm"
                  />
                </div>
                
                <div className="col-span-4 space-y-1 md:space-y-2">
                  <Label htmlFor="name" className="text-xs md:text-sm">Full Name (Optional)</Label>
                  <Input
                    id="name"
                    placeholder="Your full name"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="text-xs md:text-sm"
                  />
                </div>
                
                <div className="col-span-4 space-y-1 md:space-y-2">
                  <Label htmlFor="quantity" className="text-xs md:text-sm">Quantity</Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="h-8 w-8 p-0"
                    >
                      -
                    </Button>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 md:w-20 text-center text-xs md:text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                      disabled={selectedProduct.inventory_count ? quantity >= selectedProduct.inventory_count : false}
                      className="h-8 w-8 p-0"
                    >
                      +
                    </Button>
                  </div>
                </div>
                
                <div className="col-span-4">
                  <Separator />
                </div>
                
                <div className="col-span-4 text-xs md:text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Subtotal:</span>
                    <span>₦{(selectedProduct.price * quantity).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="font-medium">Delivery:</span>
                    <span>₦0.00 (Digital Product)</span>
                  </div>
                  <div className="flex justify-between mt-3 md:mt-4 text-base md:text-lg font-bold">
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
              size={isMobile ? "sm" : "default"}
              className="text-xs md:text-sm"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCheckout} 
              disabled={isProcessingPayment}
              className="mt-2 sm:mt-0 text-xs md:text-sm"
              size={isMobile ? "sm" : "default"}
            >
              {isProcessingPayment ? (
                <>
                  <span className="animate-spin mr-1.5 md:mr-2">◌</span>
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
