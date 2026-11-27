import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Eye, EyeOff, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const PasswordInput = ({ value, onChange, onBlur, name, placeholder }: { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onBlur: () => void; name: string; placeholder?: string; }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input type={show ? "text" : "password"} placeholder={placeholder} value={value} onChange={onChange} onBlur={onBlur} name={name} className="pr-10" />
      <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
};

const UNIVERSITIES = [
  "Abia State University",
  "Achievers University",
  "Adekunle Ajasin University",
  "Ahmadu Bello University",
  "Ajayi Crowther University",
  "Akwa Ibom State University",
  "Al-Hikmah University",
  "Ambrose Alli University",
  "Babcock University",
  "Bayero University, Kano",
  "Bells University of Technology",
  "Benson Idahosa University",
  "Bowen University",
  "Caleb University",
  "Chrisland University",
  "Covenant University",
  "Crawford University",
  "Crescent University",
  "Cross River University of Technology",
  "Delta State University",
  "Eastern Palm University",
  "Edo State University",
  "Ekiti State University",
  "Elizade University",
  "Federal Polytechnic, Ede",
  "Federal Polytechnic, Ilaro",
  "Federal Polytechnic, Offa",
  "Federal University of Agriculture, Abeokuta",
  "Federal University of Technology, Akure",
  "Federal University of Technology, Minna",
  "Federal University of Technology, Owerri",
  "Federal University, Dutse",
  "Federal University, Gashua",
  "Federal University, Gusau",
  "Federal University, Lafia",
  "Federal University, Lokoja",
  "Federal University, Otuoke",
  "Federal University, Oye-Ekiti",
  "Federal University, Wukari",
  "Fountain University",
  "Godfrey Okoye University",
  "Gregory University, Uturu",
  "Igbinedion University",
  "Imo State University",
  "Joseph Ayo Babalola University",
  "Kaduna State University",
  "Kogi State University",
  "Kwara State University",
  "Ladoke Akintola University of Technology (LAUTECH)",
  "Lagos State University",
  "Landmark University",
  "Lead City University",
  "Madonna University",
  "Michael Okpara University of Agriculture",
  "Moshood Abiola Polytechnic",
  "Mountain Top University",
  "Nasarawa State University",
  "Niger Delta University",
  "Nigerian Defence Academy",
  "Nnamdi Azikiwe University",
  "Obafemi Awolowo University",
  "Oduduwa University, Ipetumodu",
  "Olabisi Onabanjo University",
  "Osun State College of Technology, Esa-Oke",
  "Osun State University",
  "Pan-Atlantic University",
  "Plateau State University",
  "Redeemer's University",
  "Rivers State University",
  "Salem University",
  "Samuel Adegboyega University",
  "Tai Solarin University of Education",
  "The Polytechnic, Ibadan",
  "Unilorin (University of Ilorin)",
  "University of Abuja",
  "University of Benin",
  "University of Calabar",
  "University of Ibadan",
  "University of Ilorin",
  "University of Jos",
  "University of Lagos",
  "University of Maiduguri",
  "University of Nigeria, Nsukka",
  "University of Port Harcourt",
  "University of Uyo",
  "Wesley University, Ondo",
  "Western Delta University",
  "Yaba College of Technology",
].sort();

const registerSchema = z.object({
  full_name: z.string().trim().min(2, "Full name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  phone_number: z.string().trim().regex(/^(\+234|0)[0-9]{10}$/, "Enter a valid Nigerian phone number"),
  university: z.string().min(1, "Select your university"),
  matric_number: z.string().trim().min(2, "Matric number is required").max(30),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const RegisterPage = () => {
  const { user, signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [openUni, setOpenUni] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const consentsGiven = location.state?.consentsGiven === true;

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone_number: "",
      university: "",
      matric_number: "",
      password: "",
      confirm_password: "",
    },
  });

  if (user) return <Navigate to="/" replace />;
  if (!consentsGiven) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm space-y-6 text-center">
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-sm text-muted-foreground">Before registering, please review and accept our Terms & Conditions and Privacy Policy.</p>
          <Button className="w-full" onClick={() => navigate("/terms", { state: { fromRegister: true } })}>
            Review Terms & Conditions
          </Button>
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);
    try {
      // Pre-check for duplicate phone / matric and campus matric format
      const { data: verdict } = await supabase.rpc("check_registration_identity", {
        p_phone: values.phone_number.trim(),
        p_matric: values.matric_number.trim(),
        p_university: values.university.trim(),
      });

      const result = String(verdict ?? "ok");

      if (result === "phone_taken") {
        toast.error("You already have an account with this phone number. Please log in to your existing account, or message us on WhatsApp at 08148698365 for help.");
        setIsLoading(false);
        return;
      }

      if (result === "matric_taken") {
        toast.error("You already have an account with this matric number. Please log in to your existing account, or message us on WhatsApp at 08148698365 for help.");
        setIsLoading(false);
        return;
      }

      if (result.startsWith("matric_format")) {
        const example = result.split(":")[1];
        toast.error(
          example
            ? `That matric number doesn't match your school's format. Example: ${example}`
            : "That matric number doesn't match your school's format. Please double-check it.",
        );
        setIsLoading(false);
        return;
      }
    } catch (e) {
      console.warn("[Register] Pre-check failed, continuing to signup", e);
    }

    const { error } = await signUp(values.email, values.password, {
      full_name: values.full_name,
      phone_number: values.phone_number,
      university: values.university,
      matric_number: values.matric_number,
    });
    setIsLoading(false);

    if (error) {
      if (/invalid_matric_format/i.test(error.message)) {
        toast.error("That matric number doesn't match your campus format. Please double-check and try again.");
      } else if (/DUPLICATE_MATRIC/i.test(error.message)) {
        toast.error("You already have an account with this matric number. Please log in to your existing account, or message us on WhatsApp at 08148698365 for help.");
      } else if (/DUPLICATE_PHONE/i.test(error.message)) {
        toast.error("You already have an account with this phone number. Please log in to your existing account, or message us on WhatsApp at 08148698365 for help.");
      } else if (/unique constraint|already registered/i.test(error.message)) {
        toast.error("You already have an account. Please log in to your existing account, or message us on WhatsApp at 08148698365 for help.");
      } else if (/database error saving new user/i.test(error.message)) {
        toast.error("We couldn't create your account with these details — your phone or matric number may already be in use. Please check them, log in if you already have an account, or message us on WhatsApp at 08148698365.");
      } else {
        toast.error(error.message);
      }
    } else {
      navigate("/confirm-email", { replace: true, state: { email: values.email.trim() } });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-sm text-muted-foreground">Join Kuka Pay — campus finance made simple</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="full_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl><Input placeholder="Adeola Okafor" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input type="email" placeholder="you@uni.edu.ng" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="phone_number" render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl><Input placeholder="08012345678" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="university" render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Institution Name</FormLabel>
                <Popover open={openUni} onOpenChange={setOpenUni}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        <span className="truncate">
                          {field.value || "Search your institution…"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Type to search…" />
                      <CommandList>
                        <CommandEmpty>No university found.</CommandEmpty>
                        <CommandGroup>
                          {UNIVERSITIES.map((uni) => (
                            <CommandItem
                              key={uni}
                              value={uni}
                              onSelect={() => {
                                field.onChange(uni);
                                setOpenUni(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value === uni ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {uni}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="matric_number" render={({ field }) => (
              <FormItem>
                <FormLabel>Matric / Reg Number</FormLabel>
                <FormControl><Input placeholder="Your matric or reg number" {...field} /></FormControl>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Enter it exactly as it appears on your school ID — formats vary by school.
                </p>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl><PasswordInput placeholder="••••••••" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="confirm_password" render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl><PasswordInput placeholder="••••••••" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
        </Form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
