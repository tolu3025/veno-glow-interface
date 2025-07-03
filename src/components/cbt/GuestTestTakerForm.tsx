
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
import { User, Mail, Building, GraduationCap, Loader2, Sparkles } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-2xl mx-auto shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-30"></div>
              <div className="relative bg-white p-3 rounded-full">
                <VenoLogo className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <Sparkles className="h-6 w-6 text-purple-500 animate-pulse" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to {testTitle}
          </CardTitle>
          <CardDescription className="text-lg text-gray-600 mt-2">
            Please provide your information to begin your test journey
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
                      <FormLabel className="flex items-center gap-2 text-gray-700 font-medium">
                        <User className="h-4 w-4 text-blue-500" />
                        Full Name
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your full name" 
                          {...field} 
                          disabled={loading}
                          className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                        />
                      </FormControl>
                      <FormDescription className="text-sm text-gray-500">
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
                      <FormLabel className="flex items-center gap-2 text-gray-700 font-medium">
                        <Mail className="h-4 w-4 text-green-500" />
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your email address" 
                          type="email" 
                          {...field} 
                          disabled={loading}
                          className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                        />
                      </FormControl>
                      <FormDescription className="text-sm text-gray-500">
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
                      <FormLabel className="flex items-center gap-2 text-gray-700 font-medium">
                        <Building className="h-4 w-4 text-orange-500" />
                        Department
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                        <FormControl>
                          <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-200">
                            <SelectValue placeholder="Select your department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white border-2 shadow-lg">
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept} className="hover:bg-orange-50">
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
                      <FormLabel className="flex items-center gap-2 text-gray-700 font-medium">
                        <GraduationCap className="h-4 w-4 text-purple-500" />
                        Academic Level
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                        <FormControl>
                          <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200">
                            <SelectValue placeholder="Select your level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white border-2 shadow-lg">
                          {levels.map((level) => (
                            <SelectItem key={level} value={level} className="hover:bg-purple-50">
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
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Sparkles className="h-4 w-4" />
                    <span className="font-medium">Test Access Code</span>
                  </div>
                  <p className="text-blue-600 text-sm mt-1">
                    Access code automatically applied from your invitation link
                  </p>
                </div>
              )}

              {shareCodeError && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-red-600 text-sm font-medium">{shareCodeError}</p>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="pt-6">
              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Preparing Your Test...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5" />
                    <span>Start My Test Journey</span>
                  </div>
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
