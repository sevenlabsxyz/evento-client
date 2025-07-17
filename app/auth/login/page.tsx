"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  useGoogleLogin,
  useLogin,
  useRedirectIfAuthenticated,
} from "@/lib/hooks/useAuth";
import { loginSchema, type LoginFormData } from "@/lib/schemas/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Chrome, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

export default function LoginPage() {
  const { isLoading: isCheckingAuth } = useRedirectIfAuthenticated();
  const { sendLoginCode, isLoading, error, reset } = useLogin();
  const { loginWithGoogle } = useGoogleLogin();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    reset(); // Clear any previous errors
    sendLoginCode(data.email);
  };

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    loginWithGoogle();
  };

  // Show loading while checking auth status
  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-2xl font-bold">
            Welcome to Evento
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to manage your events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error.message || "An error occurred. Please try again."}
              </AlertDescription>
            </Alert>
          )}

          {/* Email Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  {...register("email")}
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  disabled={isLoading || isGoogleLoading}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending code...
                </>
              ) : (
                "Continue with Email"
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Login Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={isLoading || isGoogleLoading}
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting to Google...
              </>
            ) : (
              <>
                <Chrome className="mr-2 h-4 w-4" />
                Continue with Google
              </>
            )}
          </Button>
        </CardContent>
        <CardFooter className="text-center text-sm text-gray-600">
          <p className="w-full">
            By continuing, you agree to Evento's Terms of Service and Privacy
            Policy
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
