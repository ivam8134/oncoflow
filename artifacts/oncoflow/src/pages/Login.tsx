import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export default function Login() {
  const [, setLocation] = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    setLoading(true);
    try {
      await login(email, password);
      setLocation("/dashboard");
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-3xl mx-auto mb-4 shadow-lg shadow-primary/20">
            O
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">OncoFlow</h1>
          <p className="text-gray-500 mt-2">{t.login.subtitle}</p>

          {/* Language switcher on login page */}
          <div className="flex items-center justify-center gap-1 mt-4">
            <div className="flex items-center gap-1 border border-blue-200 rounded-lg overflow-hidden bg-white shadow-sm">
              <button
                onClick={() => setLanguage("en")}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold transition-colors ${
                  language === "en"
                    ? "bg-blue-600 text-white"
                    : "text-blue-600 hover:bg-blue-50"
                }`}
              >
                🇬🇧 EN
              </button>
              <button
                onClick={() => setLanguage("fr")}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold transition-colors ${
                  language === "fr"
                    ? "bg-blue-600 text-white"
                    : "text-blue-600 hover:bg-blue-50"
                }`}
              >
                🇫🇷 FR
              </button>
            </div>
          </div>
        </div>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle>{t.login.signIn}</CardTitle>
            <CardDescription>{t.login.signInDesc}</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t.login.workEmail}</Label>
                <Input id="email" type="email" placeholder="dr.chen@hospital.org" required defaultValue="dr.chen@hospital.org" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t.login.password}</Label>
                  <a href="#" className="text-sm text-primary hover:underline">{t.login.forgotPassword}</a>
                </div>
                <Input id="password" type="password" required defaultValue="password123" />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={loading} className="w-full text-base py-6">
                {loading ? "..." : t.login.signInButton}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <p className="text-center text-xs text-gray-400 mt-8">
          {t.login.disclaimer}
        </p>
      </div>
    </div>
  );
}
