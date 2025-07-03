
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VenoLogo } from '@/components/ui/logo';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { AlertTriangle, Loader2 } from 'lucide-react';

export interface TestTakerInfo {
  name: string;
  email: string;
  shareCode?: string;
}

interface TestTakerFormProps {
  onSubmit: (data: TestTakerInfo) => void;
  testTitle?: string;
  requireShareCode?: boolean;
  shareCodeError?: string | null;
  loading?: boolean;
}

const TestTakerForm: React.FC<TestTakerFormProps> = ({ 
  onSubmit, 
  testTitle = 'Test',
  requireShareCode = false,
  shareCodeError = null,
  loading = false
}) => {
  // Create form schema based on whether share code is required
  const formSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    shareCode: requireShareCode 
      ? z.string().min(1, 'Share code is required') 
      : z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      shareCode: '',
    },
  });

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    // Ensure the data is properly cast to TestTakerInfo
    const testTakerInfo: TestTakerInfo = {
      name: data.name,
      email: data.email,
      shareCode: data.shareCode
    };
    onSubmit(testTakerInfo);
  };

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <VenoLogo className="h-6 w-6" />
          <CardTitle>Take {testTitle}</CardTitle>
        </div>
        <CardDescription>
          Please enter your information to proceed
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Your email address" type="email" {...field} disabled={loading} />
                  </FormControl>
                  <FormDescription>
                    This is where your test results will be sent
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {requireShareCode && (
              <FormField
                control={form.control}
                name="shareCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Share Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter share code" {...field} disabled={loading} />
                    </FormControl>
                    <FormDescription>
                      Enter the share code provided by the test creator
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {shareCodeError && (
              <div className="bg-destructive/10 p-3 rounded-md flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{shareCodeError}</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Start Test'
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default TestTakerForm;
