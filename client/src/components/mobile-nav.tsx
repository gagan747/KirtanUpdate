import { Button } from "@/components/ui/button";
import { SheetClose } from "@/components/ui/sheet";
import { LogOut, Music2, User, LogIn, Video, MapPin, Utensils } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { motion, Variants } from "framer-motion";
import { useState } from "react";

interface MobileNavProps {
  onClose?: () => void;
}

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
}

export function MobileNav({ onClose }: MobileNavProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [activeHover, setActiveHover] = useState<string | null>(null);
  
  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  const navItems: NavItem[] = [
    { href: "/", icon: <Music2 className="mr-2 h-4 w-4 flex-shrink-0" />, label: "Upcoming Samagams" },
    { href: "/recorded-samagams", icon: <Video className="mr-2 h-4 w-4 flex-shrink-0" />, label: "Recorded Samagams" },
    { href: "/locations", icon: <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />, label: "Locations" },
    { 
      href: "/langar-sewa", 
      icon: <div className="mr-2 h-4 w-4 flex-shrink-0">
        <img src="/icons/langar-sewa.svg" alt="Langar Sewa" className="w-full h-full" />
      </div>, 
      label: "Langar Sewa" 
    }
  ];

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants: Variants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <div className="p-4 sm:p-6 bg-gradient-to-br from-primary/90 to-primary h-full flex flex-col">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-2 mb-8"
      >
        <div className="p-2 bg-primary-foreground/10 rounded-full">
          <Music2 className="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 className="text-xl font-bold text-primary-foreground">Kirtan Update</h1>
      </motion.div>
      
      <motion.nav 
        className="flex-1 space-y-2"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {navItems.map((navItem) => (
          <SheetClose key={navItem.href} asChild>
            <Link href={navItem.href}>
              <motion.div 
                className={cn(
                  "flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  location === navItem.href 
                    ? "bg-primary-foreground/20 text-primary-foreground shadow-inner" 
                    : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                )}
                onMouseEnter={() => setActiveHover(navItem.href)}
                onMouseLeave={() => setActiveHover(null)}
                variants={itemVariants}
                whileHover={{ 
                  scale: 1.03,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.98 }}
              >
                {navItem.icon}
                <span>{navItem.label}</span>
                {location === navItem.href && (
                  <motion.div 
                    className="ml-auto h-2 w-2 rounded-full bg-primary-foreground"
                    layoutId="navIndicator"
                  />
                )}
              </motion.div>
            </Link>
          </SheetClose>
        ))}
      </motion.nav>
      
      <motion.div 
        className="border-t border-primary-foreground/20 pt-4 mt-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {user ? (
          <>
            <div className="flex items-center gap-2 text-sm text-primary-foreground mb-4 px-2">
              <div className="p-1.5 bg-primary-foreground/10 rounded-full">
                <User className="h-4 w-4 flex-shrink-0" />
              </div>
              <span className="text-sm overflow-hidden text-ellipsis">{user.name}</span>
              {user.isAdmin && (
                <span className="text-xs bg-primary-foreground/20 px-2 py-1 rounded-full ml-auto">Admin</span>
              )}
            </div>
            <SheetClose asChild>
              <Button
                variant="ghost"
                className="w-full justify-start text-primary-foreground hover:text-primary-foreground/80 hover:bg-primary-foreground/10 rounded-lg"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="mr-2 h-4 w-4 flex-shrink-0" />
                Logout
              </Button>
            </SheetClose>
          </>
        ) : (
          <SheetClose asChild>
            <Link href="/auth">
              <motion.div 
                className={cn(
                  "flex items-center px-4 py-3 rounded-lg text-sm font-medium",
                  location === "/auth" 
                    ? "bg-primary-foreground/20 text-primary-foreground" 
                    : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                )}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <LogIn className="mr-2 h-4 w-4 flex-shrink-0" />
                <span>Login</span>
              </motion.div>
            </Link>
          </SheetClose>
        )}
      </motion.div>
    </div>
  );
} 