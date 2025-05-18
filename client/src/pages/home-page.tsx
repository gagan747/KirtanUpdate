import { useQuery } from "@tanstack/react-query";
import { Samagam } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar, Clock, MapPin, Loader2, Music2, Bell, BellOff } from "lucide-react";
import { format } from "date-fns";
import { Link, useLocation } from "wouter";
import Layout from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import SamagamForm from "@/components/samagam-form";
import { motion } from "framer-motion";
import { useEffect, useState, useRef, useCallback } from "react";
import { deleteFcmToken, requestNotificationPermission, getFcmTokenFromStorage } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Spinner from "@/components/ui/spinner";

function SamagamCard({ samagam }: { samagam: Samagam }) {
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/samagam/${samagam.id}`}>
        <Card className="samagam-card h-full flex flex-col">
          <div className="relative h-auto md:h-[220px] w-full overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
            <img 
              src={samagam.imageUrl || "/images/default-samagam.jpg"} 
              alt={samagam.title} 
              className={`samagam-image ${isHovered ? 'scale-105' : ''}`}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/images/default-samagam.jpg";
              }}
            />
            <div className="absolute top-2 right-2 z-10">
              <span className="bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded-full">
                {format(new Date(samagam.date), "MMM d")}
              </span>
            </div>
          </div>
          <CardHeader className="pb-2 flex-shrink-0">
            <CardTitle className="text-base sm:text-lg line-clamp-1 text-ellipsis overflow-hidden group-hover:text-primary transition-colors">
              {samagam.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow overflow-hidden pt-0">
            <div className="space-y-2 text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="samagam-details-icon h-4 w-4" />
                <span className="samagam-details-text">
                  {format(new Date(samagam.date), "EEEE, MMMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center">
                <Clock className="samagam-details-icon h-4 w-4" />
                <span className="samagam-details-text">{samagam.time}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="samagam-details-icon h-4 w-4" />
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(samagam.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="samagam-details-text hover:underline hover:text-primary transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {samagam.location}
                </a>
              </div>
            </div>
            <div className={`absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card to-transparent ${isHovered ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}></div>
          </CardContent>
          <div className={`flex justify-center pb-4 mt-2 ${isHovered ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
            <Button variant="secondary" size="sm" className="text-xs rounded-full">
              View Details
            </Button>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12 px-4 border border-dashed border-border rounded-lg bg-muted/30">
      <div className="inline-block p-6 bg-primary/5 rounded-full mb-4">
        <Music2 className="h-12 w-12 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No Upcoming Samagams</h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
        There are currently no upcoming Kirtan Samagams scheduled. Check back later or contact the organizers.
      </p>
    </div>
  );
}

// Define interface for pagination response
interface SamagamsResponse {
  samagams: Samagam[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [allSamagams, setAllSamagams] = useState<Samagam[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoadingMore) return;
    
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        setPage((prevPage) => prevPage + 1);
      }
    });
    
    if (node) {
      observerRef.current.observe(node);
    }
  }, [isLoadingMore, hasMore]);

  // Fetch samagams with pagination
  const fetchSamagams = async (pageNum: number): Promise<SamagamsResponse> => {
    return await apiRequest("GET", `/api/samagams?page=${pageNum}&limit=12`);
  };

  const { isLoading: isQueryLoading, refetch } = useQuery<SamagamsResponse>({
    queryKey: ["/api/samagams", page],
    queryFn: () => fetchSamagams(page),
  });

  // Function to manually refresh data
  const refreshData = async () => {
    setPage(1); // Reset to first page
    setIsInitialLoading(true);
    try {
      const result = await refetch();
      if (result.data) {
        setAllSamagams(result.data.samagams);
        setHasMore(1 < result.data.pagination.totalPages);
      }
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Regular data loading effect
  useEffect(() => {
    if (isQueryLoading) return;
    
    const fetchData = async () => {
      try {
        const data = await fetchSamagams(page);
        if (page === 1) {
          setAllSamagams(data.samagams);
        } else {
          setAllSamagams((prev) => [...prev, ...data.samagams]);
        }
        setHasMore(page < data.pagination.totalPages);
      } catch (error) {
        console.error("Error fetching samagams:", error);
      } finally {
        setIsInitialLoading(false);
        setIsLoadingMore(false);
      }
    };
    
    fetchData();
  }, [page, isQueryLoading]);

  // Load more when page changes
  useEffect(() => {
    if (page > 1) {
      setIsLoadingMore(true);
    }
  }, [page]);

  // Handle notification subscription and token
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState<boolean>(false);

  const [notificationStatus, setNotificationStatus] = useState<"pending" | "granted" | "denied">("pending");
  const [isNotificationToggleLoading, setIsNotificationToggleLoading] = useState(false);

  useEffect(() => {
    const checkNotificationStatus = async () => {
      if (!("Notification" in window)) {
        setNotificationStatus("denied");
        return;
      }

      const currentPermission = Notification.permission;
      if (currentPermission === "denied") {
        setNotificationStatus("denied");
        return;
      }

      if (currentPermission === "granted") {
        try {
          const storedToken = getFcmTokenFromStorage();
          if (storedToken) {
            const { exists } = await apiRequest('GET', `/api/fcm-tokens/check/${storedToken}`);
            setNotificationStatus(exists ? "granted" : "pending");
          } else {
            setNotificationStatus("pending");
          }
        } catch (error) {
          console.error("Error checking token:", error);
          setNotificationStatus("pending");
        }
      } else {
        setNotificationStatus("pending");
        handleRequestNotifications();
      }
    };

    checkNotificationStatus();
  }, []);

  const handleRequestNotifications = async () => {
    try {
      const token = await requestNotificationPermission();
      
      if (token) {
        setNotificationStatus("granted");
        toast({
          title: "Notifications enabled",
          description: "You will now receive push notifications",
        });
      } else {
        setNotificationStatus("denied");
        toast({
          title: "Notifications disabled",
          description: "You will not receive push notifications",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast({
        title: "Error",
        description: "Failed to enable notifications",
        variant: "destructive",
      });
    }
  };

  const handleNotificationToggle = async () => {
    setIsNotificationToggleLoading(true);
    try {
      if (notificationStatus === "granted") {
        await deleteFcmToken();
        setNotificationStatus("pending");
        toast({
          title: "Notifications Disabled",
          description: "You will no longer receive push notifications.",
        });
      } else {
        const token = await requestNotificationPermission();
        if (token) {
          setNotificationStatus("granted");
          toast({
            title: "Notifications Enabled",
            description: "You will now receive push notifications.",
          });
        } else {
          setNotificationStatus("denied");
          // Toast for denial is already handled in handleRequestNotifications
        }
      }
    } catch (error) {
      console.error("Error toggling notifications:", error);
      toast({
        title: "Error",
        description: "Failed to update notification settings.",
        variant: "destructive",
      });
    } finally {
      setIsNotificationToggleLoading(false);
    }
  };

  if (isQueryLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 page-transition">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex gap-2 justify-between w-full">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight relative">
              Upcoming Samagams
              <span className="absolute -bottom-2 left-0 w-20 h-1 bg-primary rounded-full"></span>
            </h2>
            {!user?.isAdmin && <button
                onClick={handleNotificationToggle}
                disabled={notificationStatus === "denied"}
                className={`
                  p-2 rounded-full transition-all duration-200
                  ${notificationStatus === "granted" ? "text-primary bg-primary/10" : ""}
                  ${notificationStatus === "denied" ? "opacity-50 cursor-not-allowed" : "hover:bg-primary/10"}
                  sm:h-10 sm:w-10 h-8 w-8
                `}
                style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                aria-label={notificationStatus === "granted" ? "Disable notifications" : "Enable notifications"}
              >
                {isNotificationToggleLoading ? (
                  <Spinner />
                ) : notificationStatus === "denied" ? (
                  <BellOff className="h-5 w-5 sm:h-6 sm:w-6" />
                ) : (
                  <Bell
                    className={`h-5 w-5 sm:h-6 sm:w-6 ${notificationStatus === "granted" ? "fill-primary" : ""}`}
                  />
                )}
              </button>}
          </div>
          <div className="flex gap-2 items-center justify-end">  
            {user?.isAdmin && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="text-xs sm:text-sm h-8 sm:h-10 px-3 sm:px-4">
                    <Plus className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Add Samagam
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <SamagamForm 
                    onSuccess={() => {
                      // Use direct refetch instead of invalidation
                      refreshData();
                    }}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {isInitialLoading ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !allSamagams?.length ? (
          <EmptyState />
        ) : (
          <>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {allSamagams.map((samagam, index) => (
                <motion.div
                  key={samagam.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <SamagamCard samagam={samagam} />
                </motion.div>
              ))}
            </div>
            
            {hasMore && (
              <div 
                ref={loadMoreRef} 
                className="flex justify-center mt-8"
              >
                {isLoadingMore && (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
