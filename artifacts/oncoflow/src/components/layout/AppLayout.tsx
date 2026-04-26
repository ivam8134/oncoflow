import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  FileText, 
  BrainCircuit, 
  Download,
  Bell,
  Search,
  LogOut,
  Globe,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/context/LanguageContext";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { language, setLanguage, t } = useLanguage();

  const navItems = [
    { nameKey: t.nav.dashboard, href: "/dashboard", icon: LayoutDashboard },
    { nameKey: t.nav.patients, href: "/patients", icon: Users },
    { nameKey: t.nav.addPatient, href: "/add-patient", icon: UserPlus },
    { nameKey: t.nav.notes, href: "/notes", icon: FileText },
    { nameKey: t.nav.aiSummary, href: "/ai-summary", icon: BrainCircuit },
    { nameKey: t.nav.exports, href: "/exports", icon: Download },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[260px] bg-sidebar text-sidebar-foreground flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">
              O
            </div>
            <span className="text-xl font-semibold tracking-tight">OncoFlow</span>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== '/dashboard' && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium' : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}>
                  <item.icon className="w-5 h-5" />
                  <span>{item.nameKey}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">SC</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium leading-none">Dr. Sarah Chen</span>
                <span className="text-xs text-sidebar-foreground/60 mt-1">{t.nav.leadOncologist}</span>
              </div>
            </div>
            <button 
              onClick={() => setLocation('/login')}
              className="text-sidebar-foreground/60 hover:text-sidebar-foreground p-2 rounded-md hover:bg-sidebar-accent transition-colors"
              title={t.nav.logOut}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 flex-shrink-0 z-10">
          <div className="flex items-center w-full max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder={t.topbar.searchPlaceholder}
                className="pl-9 bg-muted/50 border-transparent focus-visible:ring-primary/20 h-10 rounded-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="flex items-center gap-1 border border-blue-200 rounded-lg overflow-hidden bg-white shadow-sm">
              <button
                onClick={() => setLanguage("en")}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  language === "en"
                    ? "bg-blue-600 text-white"
                    : "text-blue-600 hover:bg-blue-50"
                }`}
              >
                🇬🇧 EN
              </button>
              <button
                onClick={() => setLanguage("fr")}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  language === "fr"
                    ? "bg-blue-600 text-white"
                    : "text-blue-600 hover:bg-blue-50"
                }`}
              >
                🇫🇷 FR
              </button>
            </div>

            <button className="relative p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
