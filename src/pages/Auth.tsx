
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, StoreIcon, Mail } from "lucide-react";
import { checkSubscriptionStatus } from "@/utils/subscriptionUtils";
import SubscriptionPlans from "@/components/SubscriptionPlans";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPlans, setShowPlans] = useState(false);
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantType, setRestaurantType] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (isLogin) {
        const { data: { user }, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        // Get user's profile to get restaurant_id
        const { data: profile } = await supabase
          .from("profiles")
          .select("restaurant_id")
          .eq("id", user?.id)
          .single();

        if (profile?.restaurant_id) {
          const hasActiveSubscription = await checkSubscriptionStatus(profile.restaurant_id);
          
          if (!hasActiveSubscription) {
            setShowPlans(true);
            toast({
              title: "Subscription Required",
              description: "Your subscription is not active. Please choose a plan to continue.",
              variant: "destructive",
            });
            return;
          }
        }
        
        toast({
          title: "Success",
          description: "Logged in successfully",
        });
        navigate("/");
      } else {
        // Sign up new user
        const { data: { user }, error } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (error) throw error;
        
        if (user) {
          // Create restaurant
          const { data: restaurant, error: restaurantError } = await supabase
            .from("restaurants")
            .insert([
              { name: restaurantName || email.split('@')[0] + "'s Restaurant" }
            ])
            .select()
            .single();
            
          if (restaurantError) throw restaurantError;
          
          // Update user profile with restaurant_id
          const { error: profileError } = await supabase
            .from("profiles")
            .update({
              restaurant_id: restaurant.id,
              first_name: email.split('@')[0],
            })
            .eq("id", user.id);
            
          if (profileError) throw profileError;
          
          setShowPlans(true);
          toast({
            title: "Account Created",
            description: "Please select a subscription plan to continue.",
          });
        } else {
          toast({
            title: "Success",
            description: "Please check your email to verify your account",
          });
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setGoogleLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      
      if (error) throw error;
      
    } catch (error) {
      console.error('Google auth error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Google authentication failed",
        variant: "destructive",
      });
      setGoogleLoading(false);
    }
  };

  if (showPlans) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-7xl">
          <SubscriptionPlans />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-4">
            <StoreIcon className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">
            {isLogin ? "Login" : "Create Account"}
          </h1>
          {!isLogin && (
            <p className="text-muted-foreground mt-1">
              Set up your restaurant management account
            </p>
          )}
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          {!isLogin && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="restaurantName">Restaurant Name</Label>
                <Input
                  id="restaurantName"
                  placeholder="Restaurant Name"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="restaurantType">Restaurant Type</Label>
                <Select 
                  value={restaurantType} 
                  onValueChange={setRestaurantType}
                >
                  <SelectTrigger id="restaurantType">
                    <SelectValue placeholder="Select restaurant type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cafe">Café / Restaurant</SelectItem>
                    <SelectItem value="hotel">Hotel / Accommodation</SelectItem>
                    <SelectItem value="all-in-one">All-in-One (Restaurant & Hotel)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  This helps us recommend the best subscription plan for your business
                </p>
              </div>
            </div>
          )}
          
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            {isLogin ? "Login" : "Create Account"}
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full mt-4 flex items-center justify-center"
            onClick={handleGoogleAuth}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
                <path d="M1 1h22v22H1z" fill="none" />
              </svg>
            )}
            {isLogin ? "Sign in with Google" : "Sign up with Google"}
          </Button>
        </div>

        <div className="mt-4 text-center">
          <Button
            variant="link"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Login"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Auth;
