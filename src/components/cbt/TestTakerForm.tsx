
import React from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  shareCode: z.string().optional(),
});

export type TestTakerInfo = z.infer<typeof formSchema>;

interface TestTakerFormProps {
  onSubmit: (data: TestTakerInfo) => void;
  testTitle?: string;
  requireShareCode?: boolean;
}

const TestTakerForm: React.FC<TestTakerFormProps> = ({ onSubmit, testTitle, requireShareCode }) => {
  const form = useForm<TestTakerInfo>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      shareCode: '',
    },
  });

  const handleSubmit = (data: TestTakerInfo) => {
    onSubmit(data);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Please enter your information</h3>
        <p className="text-sm text-muted-foreground">
          Your details are required before you can start the test
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your full name" {...field} />
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
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter your email address" {...field} />
                </FormControl>
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
                    <Input placeholder="Enter test share code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          <Button type="submit" className="w-full">
            Start Test{testTitle ? `: ${testTitle}` : ''}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default TestTakerForm;
