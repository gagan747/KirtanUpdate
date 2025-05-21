import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  LogOut,
  Music2,
  User,
  LogIn,
  Video,
  MapPin,
  Utensils,
  ChevronLeft,
  ChevronRight,
  Radio,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { MobileNav } from "./mobile-nav";
import { motion } from "framer-motion";

interface LayoutProps {
  children: React.ReactNode;
}

function NavLink({
  href,
  children,
  isCollapsed,
}: {
  href: string;
  children: React.ReactNode;
  isCollapsed?: boolean;
}) {
  const [location] = useLocation();
  const isActive = location === href;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link href={href}>
      <motion.div
        className={cn(
          "block transition-all duration-200 mb-3 cursor-pointer rounded-lg",
          "text-primary-foreground/80 hover:text-primary-foreground",
          isActive &&
            "text-primary-foreground font-medium bg-primary-foreground/10 shadow-inner",
        )}
        style={{ minWidth: isCollapsed ? "auto" : "180px" }}
        whileHover={{
          scale: 1.02,
          transition: { duration: 0.2 },
        }}
        whileTap={{ scale: 0.98 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="px-3 py-2 flex items-center">
          {children}
          {isActive && !isCollapsed && (
            <motion.div
              className="ml-auto h-2 w-2 rounded-full bg-primary-foreground"
              layoutId="sidebarIndicator"
            />
          )}
        </div>
      </motion.div>
    </Link>
  );
}

function Sidebar({
  className = "",
  isCollapsed = false,
  toggleCollapse,
}: {
  className?: string;
  isCollapsed?: boolean;
  toggleCollapse?: () => void;
}) {
  const { user, logoutMutation } = useAuth();
  const isMobile = useIsMobile();

  return (
    <div
      className={`${className} p-4 sm:p-6 bg-gradient-to-br from-primary/90 to-primary h-full flex flex-col transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-20" : "w-[280px]"
      }`}
    >
      <div className="flex items-center gap-2 sm:gap-3 mb-8 sm:mb-10 relative">
        <div className="p-2 bg-primary-foreground/10 rounded-full">
          <Music2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
        </div>
        {!isCollapsed && (
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xl sm:text-2xl font-bold text-primary-foreground whitespace-nowrap overflow-hidden"
          >
            Kirtan Update
          </motion.h1>
        )}
        {toggleCollapse && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="absolute right-0 top-1/2 -translate-y-1/2 hover:bg-primary-foreground/10 text-primary-foreground h-8 w-8"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
      <motion.nav
        className="flex-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, staggerChildren: 0.1 }}
      >
        <NavLink href="/" isCollapsed={isCollapsed}>
          <div className="flex items-center">
            <Music2 className="mr-2 h-4 w-4 flex-shrink-0" />
            {!isCollapsed && (
              <span className="whitespace-nowrap">Upcoming Samagams</span>
            )}
          </div>
        </NavLink>
        <NavLink href="/recorded-samagams" isCollapsed={isCollapsed}>
          <div className="flex items-center">
            <Video className="mr-2 h-4 w-4 flex-shrink-0" />
            {!isCollapsed && (
              <span className="whitespace-nowrap">Recorded Samagams</span>
            )}
          </div>
        </NavLink>
        <NavLink href="/locations" isCollapsed={isCollapsed}>
          <div className="flex items-center">
            <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
            {!isCollapsed && (
              <span className="whitespace-nowrap">Locations</span>
            )}
          </div>
        </NavLink>
        <NavLink href="/langar-sewa" isCollapsed={isCollapsed}>
          <div className="flex items-center">
            <div className="mr-2 h-4 w-4 flex-shrink-0">
              <img
                src="/icons/langar-sewa.svg"
                alt="Langar Sewa"
                className="w-full h-full"
              />
            </div>
            {!isCollapsed && (
              <span className="whitespace-nowrap">Langar Sewa</span>
            )}
          </div>
        </NavLink>
        <NavLink href="/broadcast" isCollapsed={isCollapsed}>
          <div className="flex items-center">
            <Radio className="mr-2 h-4 w-4 flex-shrink-0" />
            {!isCollapsed && (
              <span className="whitespace-nowrap">Live Broadcast</span>
            )}
          </div>
        </NavLink>
      </motion.nav>
      <motion.div
        className="border-t border-primary-foreground/20 pt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {user ? (
          <>
            <div className="flex items-center gap-2 text-sm text-primary-foreground mb-4">
              {!isCollapsed && (
                <>
                  <div className="p-1.5 bg-primary-foreground/10 rounded-full">
                    <User className="h-3.5 w-3.5 flex-shrink-0" />
                  </div>
                  <span className="text-xs sm:text-sm overflow-hidden text-ellipsis">
                    {user.name}
                  </span>
                  {user.isAdmin && (
                    <span className="text-xs bg-primary-foreground/20 px-2 py-1 rounded-full ml-auto">
                      Admin
                    </span>
                  )}
                </>
              )}
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-primary-foreground hover:text-primary-foreground/80 hover:bg-primary-foreground/10 rounded-lg"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="mr-2 h-4 w-4 flex-shrink-0" />
              {!isCollapsed && "Logout"}
            </Button>
          </>
        ) : (
          <NavLink href="/auth" isCollapsed={isCollapsed}>
            <div className="flex items-center">
              <LogIn className="mr-2 h-4 w-4 flex-shrink-0" />
              {!isCollapsed && "Login"}
            </div>
          </NavLink>
        )}
      </motion.div>
    </div>
  );
}

export default function Layout({ children }: LayoutProps) {
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="min-h-screen">
      {isMobile ? (
        <>
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
            <div className="container flex h-14 items-center px-4">
              <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mr-2 text-primary"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="p-0 w-[240px] sm:w-[280px]"
                >
                  <MobileNav onClose={() => setShowMobileMenu(false)} />
                </SheetContent>
              </Sheet>
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="p-1.5 bg-primary/10 rounded-full">
                  <Music2 className="h-5 w-5 sm:h-5 sm:w-5 text-primary" />
                </div>
                <h1 className="text-lg sm:text-xl font-semibold text-primary">
                  Kirtan Update
                </h1>
              </motion.div>
            </div>
          </header>
          <main className="container py-4 sm:py-6 px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </main>
        </>
      ) : (
        <div className="flex">
          <Sidebar
            className="sticky top-0 h-screen"
            isCollapsed={isCollapsed}
            toggleCollapse={toggleCollapse}
          />
          <div className="flex-1">
            <main className="p-6 sm:p-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {children}
              </motion.div>
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
