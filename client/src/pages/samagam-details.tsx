import { useQuery, useMutation } from "@tanstack/react-query";
import { Samagam } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Clock, MapPin, User, Phone, Pencil, Trash2, Loader2, Share2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import Layout from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import SamagamForm from "@/components/samagam-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function SamagamDetails() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  
  // Fix the issue with invalid samagam ID during navigation
  const pathSegments = location.split("/");
  const idFromPath = pathSegments.length > 1 ? pathSegments.pop() || "" : "";
  const id = parseInt(idFromPath);
  
  // Only fetch if we have a valid ID
  const { data: samagam, isLoading, refetch } = useQuery<Samagam>({
    queryKey: [`/api/samagams/${id}`],
    enabled: !isNaN(id) && id > 0,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/samagams/${id}`);
    },
    onSuccess: () => {
      // We don't need to invalidate queries here since we're redirecting away from this page
      toast({
        title: "Samagam deleted",
        description: "The samagam has been successfully deleted.",
      });
      setLocation("/");
    },
  });

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: samagam?.title || 'Kirtan Update',
          text: `Join us for ${samagam?.title} on ${format(new Date(samagam?.date || new Date()), "MMMM d, yyyy")}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        setIsShareMenuOpen(true);
      }
    } else {
      setIsShareMenuOpen(true);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied",
      description: "Samagam link copied to clipboard",
    });
    setIsShareMenuOpen(false);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!samagam) {
    return (
      <Layout>
        <div className="text-center">
          <h2 className="text-2xl font-bold">Samagam not found</h2>
          <p className="text-muted-foreground mt-2">
            The samagam you're looking for doesn't exist.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto page-transition"
      >
        <div className="mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-4 hover:bg-background"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Samagams
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-3 mb-6 sm:mb-8">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-3xl font-bold tracking-tight text-center sm:text-left w-full relative"
          >
            {samagam.title}
            <span className="absolute -bottom-2 left-0 w-20 h-1 bg-primary rounded-full hidden sm:block"></span>
          </motion.h1>
          
          <div className="flex gap-2 justify-center sm:justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs sm:text-sm h-8 sm:h-10"
              onClick={handleShare}
            >
              <Share2 className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Share
            </Button>
            
            {isShareMenuOpen && (
              <div className="absolute mt-10 right-0 bg-card border shadow-lg rounded-md p-2 z-50">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start text-sm"
                  onClick={copyToClipboard}
                >
                  Copy link
                </Button>
              </div>
            )}
            
            {user?.isAdmin && (
              <>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-10">
                      <Pencil className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <SamagamForm
                      samagam={samagam}
                      onSuccess={(updatedSamagam) => {
                        queryClient.setQueryData(
                          [`/api/samagams/${id}`],
                          updatedSamagam
                        );
                        refetch();
                        toast(
                          { title: "Success", description: "Samagam updated successfully" },
                        );
                      }}
                    />
                  </DialogContent>
                </Dialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="text-xs sm:text-sm h-8 sm:h-10">
                      <Trash2 className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-[350px] sm:max-w-[450px]">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-base sm:text-lg">Delete Samagam</AlertDialogTitle>
                      <AlertDialogDescription className="text-xs sm:text-sm">
                        Are you sure you want to delete this samagam? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4 flex gap-2 sm:gap-3">
                      <AlertDialogCancel className="text-xs sm:text-sm h-8 sm:h-9">Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        className="text-xs sm:text-sm h-8 sm:h-9 bg-destructive hover:bg-destructive/90"
                        onClick={() => deleteMutation.mutate()}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="overflow-hidden border-none shadow-lg">
            {samagam.imageUrl ? (
              <div className="w-full h-auto md:h-80 lg:h-96 overflow-hidden relative">
                <img
                  src={samagam.imageUrl}
                  alt={samagam.title}
                  className="w-full h-full object-contain md:object-cover transition-transform duration-1000 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            ) : (
              <div className="w-full h-auto md:h-80 lg:h-96 overflow-hidden relative">
                <img
                  src="/images/default-samagam.jpg"
                  alt={samagam.title}
                  className="w-full h-full object-contain md:object-cover transition-transform duration-1000 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            )}
            <CardContent className="pt-6 pb-8 px-6 sm:px-8">
              <div className="space-y-6 flex flex-col items-center">
                {samagam.description && (
                  <p className="text-sm sm:text-base text-muted-foreground text-center max-w-2xl border-l-4 border-primary/20 pl-4 py-2 italic bg-muted/20 rounded-r-md">
                    {samagam.description}
                  </p>
                )}

                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 w-full mt-4 bg-card rounded-xl p-6 shadow-sm border">
                  <motion.div 
                    className="flex items-center"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="p-3 rounded-full bg-primary/10 mr-4">
                      <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-medium">Date</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {format(new Date(samagam.date), "EEEE, MMMM d, yyyy")}
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="flex items-center"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="p-3 rounded-full bg-primary/10 mr-4">
                      <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-medium">Time</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {samagam.time}
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="flex items-center"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="p-3 rounded-full bg-primary/10 mr-4">
                      <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-medium">Location</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        <a 
                          href={`https://maps.google.com/?q=${encodeURIComponent(samagam.location)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline hover:text-primary transition-colors"
                        >
                          {samagam.location}
                        </a>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="flex items-center"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <div className="p-3 rounded-full bg-primary/10 mr-4">
                      <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-medium">Organizer</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {samagam.organizer}
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="flex items-center sm:col-span-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <div className="p-3 rounded-full bg-primary/10 mr-4">
                      <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-medium">Contact</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {samagam.contactInfo}
                      </div>
                    </div>
                  </motion.div>
                </div>
                
                <div className="w-full flex justify-center mt-6">
                  <Button
                    className="rounded-full px-8"
                    onClick={handleShare}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share This Samagam
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </Layout>
  );
}
