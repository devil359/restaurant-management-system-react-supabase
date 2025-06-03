
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AuthForm from "@/components/Auth/AuthForm";
import BrandingSection from "@/components/Auth/BrandingSection";
import { LoginRegisterAccessGuard } from "@/components/Auth/RouteGuards";

const Auth = () => {
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  return (
    <LoginRegisterAccessGuard>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <BrandingSection />
          
          <div className="w-full max-w-md mx-auto">
            <Card className="shadow-2xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader className="text-center px-8 pt-8 pb-6">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-brand-deep-blue to-brand-success-green bg-clip-text text-transparent">
                  {authMode === "signin" ? "Welcome Back" : "Create Account"}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {authMode === "signin" 
                    ? "Sign in to access your restaurant management dashboard" 
                    : "Get started with your restaurant management system"}
                </CardDescription>
              </CardHeader>
              
              <AuthForm authMode={authMode} setAuthMode={setAuthMode} />
            </Card>
          </div>
        </div>
      </div>
    </LoginRegisterAccessGuard>
  );
};

export default Auth;
