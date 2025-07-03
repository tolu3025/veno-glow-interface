
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Mail, Building, GraduationCap, Loader2 } from 'lucide-react';

export interface GuestTestTakerInfo {
  fullName: string;
  email: string;
  department: string;
  level: string;
  shareCode?: string;
}

interface GuestTestTakerFormProps {
  onSubmit: (data: GuestTestTakerInfo) => void;
  testTitle?: string;
  shareCodeError?: string | null;
  loading?: boolean;
  initialShareCode?: string;
}

const departments = [
  'Computer Science',
  'Engineering',
  'Medicine',
  'Business Administration',
  'Law',
  'Arts & Humanities',
  'Natural Sciences',
  'Social Sciences',
  'Education',
  'Other'
];

const levels = [
  '100 Level',
  '200 Level', 
  '300 Level',
  '400 Level',
  '500 Level',
  'Graduate',
  'Postgraduate',
  'Professional'
];

const GuestTestTakerForm: React.FC<GuestTestTakerFormProps> = ({ 
  onSubmit, 
  testTitle = 'Test',
  shareCodeError = null,
  loading = false,
  initialShareCode = ''
}) => {
  const formSchema = z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    department: z.string().min(1, 'Please select your department'),
    level: z.string().min(1, 'Please select your level'),
    shareCode: initialShareCode ? z.string().optional() : z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      department: '',
      level: '',
      shareCode: initialShareCode,
    },
  });

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    const guestInfo: GuestTestTakerInfo = {
      fullName: data.fullName,
      email: data.email,
      department: data.department,
      level: data.level,
      shareCode: data.shareCode
    };
    onSubmit(guestInfo);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <VenoLogo className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-heading">
            Welcome to {testTitle}
          </CardTitle>
          <CardDescription>
            Please provide your information to begin the test
          </CardDescription>
        </CardHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Full Name
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your full name" 
                          {...field} 
                          disabled={loading}
                        />
                      </FormControl>
                      <FormDescription>
                        This name will appear on the leaderboard
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your email address" 
                          type="email" 
                          {...field} 
                          disabled={loading}
                        />
                      </FormControl>
                      <FormDescription>
                        Your test results will be sent here
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Department
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover">
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Academic Level
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover">
                          {levels.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {initialShareCode && (
                <div className="bg-muted p-4 rounded-lg border">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-medium">Test Access Code</span>
                  </div>
                  <p className="text-sm mt-1">
                    Access code automatically applied from your invitation link
                  </p>
                </div>
              )}

              {shareCodeError && (
                <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
                  <p className="text-destructive text-sm font-medium">{shareCodeError}</p>
                </div>
              )}
            </CardContent>
            
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Preparing Your Test...</span>
                  </div>
                ) : (
                  'Start Test'
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default GuestTestTakerForm;
