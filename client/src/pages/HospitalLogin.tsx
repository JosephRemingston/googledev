import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const HospitalLogin = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { setUser } = useAuth();
  const [notApprovedError, setNotApprovedError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setNotApprovedError(null);
      const response = await apiRequest("POST", "/api/auth/hospital/login", data);
      const hospitalData = await response.json();
      
      setUser(hospitalData);
      
      toast({
        title: "Login successful",
        description: "Welcome to your hospital dashboard!",
      });
      
      navigate("/hospital/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Check for "not approved yet" error
      if (error.message?.includes("Hospital not approved")) {
        setNotApprovedError("Your hospital registration is pending approval. Please check back later.");
      } else {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: error.message || "Invalid username or password",
        });
      }
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-900">Hospital Sign In</CardTitle>
            <CardDescription className="text-gray-600">
              Access your hospital dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notApprovedError && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{notApprovedError}</AlertDescription>
              </Alert>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="hospital-username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-700 text-white"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Signing in...
                    </div>
                  ) : (
                    "Sign in"
                  )}
                </Button>

                <div className="text-center text-sm">
                  <p className="text-gray-600">
                    Don't have a hospital account?{" "}
                    <Link href="/hospital/register">
                      <a className="font-medium text-primary hover:text-primary-700">
                        Register your hospital
                      </a>
                    </Link>
                  </p>
                </div>

                <div className="mt-4 border-t border-gray-200 pt-4">
                  <p className="text-sm text-center text-gray-600">
                    Are you a patient?{" "}
                    <Link href="/login">
                      <a className="font-medium text-primary hover:text-primary-700">
                        Sign in as a patient
                      </a>
                    </Link>
                  </p>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HospitalLogin;
