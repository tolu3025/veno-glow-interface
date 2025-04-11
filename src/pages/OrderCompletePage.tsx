
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const OrderCompletePage = () => {
  const [status, setStatus] = useState<'success' | 'failure' | 'processing'>('processing');
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const verifyPayment = async () => {
      // Get URL parameters
      const searchParams = new URLSearchParams(location.search);
      const txRef = searchParams.get('tx_ref');
      const transactionId = searchParams.get('transaction_id');
      const status = searchParams.get('status');

      if (!txRef || !transactionId) {
        setStatus('failure');
        toast({
          title: "Invalid Order",
          description: "Missing transaction information",
          variant: "destructive"
        });
        return;
      }

      if (status !== 'successful') {
        setStatus('failure');
        toast({
          title: "Payment Failed",
          description: "Your payment was not successful",
          variant: "destructive"
        });
        return;
      }

      try {
        // Verify the transaction in Supabase database
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('transaction_ref', txRef)
          .single();

        if (error || !data) {
          console.error('Error fetching order:', error);
          setStatus('failure');
          toast({
            title: "Order Verification Failed",
            description: "Unable to verify your order",
            variant: "destructive"
          });
          return;
        }

        // Order found, update status to success
        setOrderDetails(data);
        setStatus('success');
        toast({
          title: "Order Successful!",
          description: "Your purchase has been completed",
          variant: "default"
        });
      } catch (error) {
        console.error('Failed to verify order:', error);
        setStatus('failure');
        toast({
          title: "Verification Error",
          description: "There was an error verifying your payment",
          variant: "destructive"
        });
      }
    };

    verifyPayment();
  }, [location.search, toast]);

  return (
    <div className="container py-12 max-w-md mx-auto">
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto my-6">
            {status === 'processing' && (
              <div className="animate-pulse">
                <div className="w-16 h-16 bg-muted rounded-full mx-auto flex items-center justify-center">
                  <span className="text-2xl">⏳</span>
                </div>
              </div>
            )}
            
            {status === 'success' && (
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mx-auto flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
            )}
            
            {status === 'failure' && (
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
              </div>
            )}
          </div>
          
          <CardTitle className="text-2xl">
            {status === 'processing' && "Processing Your Order"}
            {status === 'success' && "Order Complete!"}
            {status === 'failure' && "Payment Failed"}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {status === 'processing' && (
            <p className="text-muted-foreground">Please wait while we verify your payment...</p>
          )}
          
          {status === 'success' && orderDetails && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Thank you for your purchase! Your order has been successfully processed.
              </p>
              
              <div className="bg-muted/50 p-4 rounded-md text-left">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm font-medium">Order ID:</div>
                  <div className="text-sm">{orderDetails.id.substring(0, 8)}...</div>
                  
                  <div className="text-sm font-medium">Date:</div>
                  <div className="text-sm">{new Date(orderDetails.created_at).toLocaleDateString()}</div>
                  
                  <div className="text-sm font-medium">Amount:</div>
                  <div className="text-sm">₦{orderDetails.total_amount.toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}
          
          {status === 'failure' && (
            <p className="text-muted-foreground">
              We couldn't process your payment. Please try again or contact support if the issue persists.
            </p>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center gap-4">
          <Button onClick={() => navigate('/marketplace')}>
            Back to Marketplace
          </Button>
          
          {status === 'success' && (
            <Button variant="outline" onClick={() => navigate('/orders')}>
              View Orders
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default OrderCompletePage;
