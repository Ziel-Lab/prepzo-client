"use client";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider 
} from "@/components/ui/sidebar";
import { BarChart, FileText, Wrench, TrendingUp, Settings, MessageSquare, Home, LogOut, Menu, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect, useCallback, memo } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { createClient } from "@/utils/supabase/client";

const staticSidebarItems = [
  { icon: Home, label: "Overview", href: "/dashboard" },
  { icon: MessageSquare, label: "Conversations", href: "/dashboard/conversations" },
  { icon: FileText, label: "Applications", href: "/dashboard/applications" },
  { icon: TrendingUp, label: "Skills", href: "/dashboard/skills" },
  { icon: BarChart, label: "Goals", href: "/dashboard/goals" },
  { icon: AlertTriangle, label: "Challenges", href: "/dashboard/challenges" },
  { icon: FileText, label: "Documents", href: "/dashboard/documents" },
  { icon: Wrench, label: "Career Tools", href: "/dashboard/tools" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

interface InternalSidebarLayoutProps {
  pathname: string;
  onLogoutClick: () => void;
  onNavigateToDashboard: () => void;
  items: typeof staticSidebarItems;
}

// Memoized internal layout for the sidebar content
const InternalSidebarLayout: React.FC<InternalSidebarLayoutProps> = memo((
  { pathname, onLogoutClick, onNavigateToDashboard, items }
) => {
  return (
    <>
      <SidebarHeader className="p-4 flex flex-col items-center">
      <div
        className="flex items-center mb-4 cursor-pointer"
        onClick={onNavigateToDashboard}
      >
        <span className="text-white text-2xl font-bold">Prepzo</span>
        <span className="ml-2 bg-white text-[#12231B] px-2 py-1 rounded-md text-sm font-semibold">Pro</span>
      </div>
        <Button 
          className="w-full bg-[#1e3529] text-white hover:bg-[#2a4a3a] transition-colors"
          size="lg"
        >
          Talk to Prepzo
        </Button>
      </SidebarHeader>
      <SidebarContent>
        {/* Adjusted height: consider header and footer heights if they are substantial */}
        {/* Assuming header ~4rem, footer ~3rem. 100vh - 7rem should be safe for scroll area if header/footer fixed height */}
        <ScrollArea className="h-[calc(100%-8rem)]"> {/* Use 100% of parent, parent will be sized by Sidebar/SheetContent */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-white/70">Dashboard</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={item.href}
                        className="flex items-center gap-2 text-white/80 hover:text-white data-[active=true]:bg-[#1e3529] data-[active=true]:text-white"
                        data-active={pathname === item.href}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter className="absolute bottom-4 left-0 right-0 px-4 flex flex-col gap-2">
        <Button 
          onClick={onLogoutClick}
          className="w-full bg-[#2a4a3a] text-white hover:bg-[#3c6a50] transition-colors"
          size="lg"
          variant="outline"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </SidebarFooter>
    </>
  );
});
InternalSidebarLayout.displayName = 'InternalSidebarLayout'; // For better debugging

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const supabase = createClient();

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    router.push('/');
  }, [supabase, router]);

  const handleNavigateToDashboard = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  // Close mobile menu when navigating to a new page
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);
  
  return (
    <SidebarProvider>
      <div className="h-screen flex w-full overflow-hidden">
        {/* Desktop sidebar - hidden on small screens */}
        <Sidebar className="bg-[#12231B] border-r border-[#1e3529] fixed top-0 bottom-0 left-0 z-40 hidden md:block">
          <InternalSidebarLayout 
            pathname={pathname} 
            onLogoutClick={handleLogout} 
            onNavigateToDashboard={handleNavigateToDashboard}
            items={staticSidebarItems}
          />
        </Sidebar>

        {/* Mobile burger menu */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#12231B] p-4 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-white text-xl font-bold">Prepzo</span>
            <span className="ml-2 bg-white text-[#12231B] px-2 py-0.5 rounded-md text-xs font-semibold">Pro</span>
          </div>
          
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[80%] bg-[#12231B] border-r border-[#1e3529] p-0">
              <InternalSidebarLayout 
                pathname={pathname} 
                onLogoutClick={handleLogout} 
                onNavigateToDashboard={handleNavigateToDashboard}
                items={staticSidebarItems}
              />
            </SheetContent>
          </Sheet>
        </div>

        {/* Main content area with padding for mobile header */}
        <main className="md:ml-[16rem] flex-1 bg-[#f8faf8] overflow-y-auto h-screen w-full md:w-[calc(100%-16rem)] md:absolute md:right-0 pt-20 md:pt-6 px-4 md:px-8">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
