import { useQuery, useMutation } from "@tanstack/react-query";
import { RecordedSamagam, InsertRecordedSamagam } from "@shared/schema";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import Layout from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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
import { useState, useEffect, useRef, useCallback } from "react";
import RecordedSamagamForm from "@/components/recorded-samagam-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

function YouTubeEmbed({ url }: { url: string }) {
  // Extract video ID from YouTube URL
  const getYouTubeVideoId = (url: string) => {
    // Handle various YouTube URL formats
    const regexPatterns = [
      // Standard watch URLs
      /(?:youtube\.com\/watch\?v=)([^"&?\/\s]{11})(?:[&?].*)?$/i,
      // Short URLs
      /(?:youtu\.be\/)([^"&?\/\s]{11})(?:[&?].*)?$/i,
      // Embed URLs
      /(?:youtube\.com\/embed\/)([^"&?\/\s]{11})(?:[&?].*)?$/i,
      // Direct video ID (11 characters)
      /^([a-zA-Z0-9_-]{11})$/i,
    ];

    // Clean the URL first (trim whitespace)
    const cleanUrl = url.trim();

    // Try each pattern
    for (const regex of regexPatterns) {
      const match = cleanUrl.match(regex);
      if (match && match[1]) {
        return match[1];
      }
    }

    // If no pattern matched, try a more generic approach for YouTube URLs
    try {
      const urlObj = new URL(cleanUrl);
      if (
        urlObj.hostname.includes("youtube.com") &&
        urlObj.searchParams.has("v")
      ) {
        return urlObj.searchParams.get("v");
      }
    } catch (e) {
      // Not a valid URL, ignore
    }

    return null;
  };

  const videoId = getYouTubeVideoId(url);

  if (!videoId) {
    return (
      <div className="aspect-video w-full rounded-lg bg-muted flex items-center justify-center flex-col p-4">
        <p className="text-sm text-center mb-2">Invalid YouTube URL</p>
        <p className="text-xs text-muted-foreground text-center">{url}</p>
      </div>
    );
  }

  // Use iframe directly for embedded playback
  return (
    <div className="aspect-video w-full rounded-lg overflow-hidden shadow-md">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  );
}

// Define interface for pagination response
interface RecordedSamagamsResponse {
  recordedSamagams: RecordedSamagam[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function RecordedSamagamsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [selectedSamagam, setSelectedSamagam] =
    useState<RecordedSamagam | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [samagamToDelete, setSamagamToDelete] =
    useState<RecordedSamagam | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<number | null>(null);

  const [page, setPage] = useState(1);
  const [allRecordedSamagams, setAllRecordedSamagams] = useState<
    RecordedSamagam[]
  >([]);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
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
    },
    [isLoadingMore, hasMore],
  );

  // Fetch recorded samagams with pagination
  const fetchRecordedSamagams = async (
    pageNum: number,
  ): Promise<RecordedSamagamsResponse> => {
    return await apiRequest(
      "GET",
      `/api/recorded-samagams?page=${pageNum}&limit=12`,
    );
  };

  const { isLoading: isQueryLoading, refetch } =
    useQuery<RecordedSamagamsResponse>({
      queryKey: ["/api/recorded-samagams", page],
      queryFn: () => fetchRecordedSamagams(page),
    });

  const fetchData = async () => {
    try {
      const data = await fetchRecordedSamagams(page);
      if (page === 1) {
        setAllRecordedSamagams(data.recordedSamagams);
      } else {
        setAllRecordedSamagams((prev) => [...prev, ...data.recordedSamagams]);
      }
      setHasMore(page < data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching recorded samagams:", error);
    } finally {
      setIsInitialLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (isQueryLoading && page === 1) {
      setIsInitialLoading(true);
    }

    if (!isQueryLoading) {
      fetchData();
    }
  }, [page, isQueryLoading]);

  // Load more when page changes
  useEffect(() => {
    if (page > 1) {
      setIsLoadingMore(true);
    }
  }, [page]);

  const updateMutation = useMutation({
    mutationFn: async (data: {
      id: number;
      samagam: InsertRecordedSamagam;
    }) => {
      return apiRequest(
        "PATCH",
        `/api/recorded-samagams/${data.id}`,
        data.samagam,
      );
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Recorded samagam updated." });
      setIsEditFormOpen(false);
      setSelectedSamagam(null);
      // Reset pagination to first page to refresh data
      setPage(1);
      setAllRecordedSamagams([]);
      setIsInitialLoading(true);
      // Force a refetch after a short delay to ensure state updates have propagated
      setTimeout(() => fetchData(), 100);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/recorded-samagams/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Recorded samagam deleted." });
      setIsDeleteDialogOpen(false);
      setSamagamToDelete(null);
      // Reset pagination to first page to refresh data
      setPage(1);
      setAllRecordedSamagams([]);
      setIsInitialLoading(true);
      // Force a refetch after a short delay to ensure state updates have propagated
      setTimeout(() => fetchData(), 100);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (samagam: RecordedSamagam) => {
    setSelectedSamagam(samagam);
    setIsEditFormOpen(true);
  };

  const handleAddFormSubmit = () => {
    setIsAddFormOpen(false);
    // Reset pagination to first page to refresh data
    setPage(1);
    setAllRecordedSamagams([]);
    setIsInitialLoading(true);
    // Force a refetch after a short delay to ensure state updates have propagated
    setTimeout(() => fetchData(), 100);
  };

  const handleUpdate = (data: InsertRecordedSamagam) => {
    if (selectedSamagam) {
      updateMutation.mutate({ id: selectedSamagam.id, samagam: data });
    }
  };

  const handleDeleteConfirmation = (samagam: RecordedSamagam) => {
    setSamagamToDelete(samagam);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (samagamToDelete) {
      deleteMutation.mutate(samagamToDelete.id);
    }
  };

  return (
    <Layout>
      <div className="space-y-8 page-transition">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight relative">
            Recorded Kirtan
            <span className="absolute -bottom-2 left-0 w-20 h-1 bg-primary rounded-full"></span>
          </h2>
          {user?.isAdmin && (
            <Button
              size="sm"
              className="text-xs sm:text-sm h-8 sm:h-10 px-3 sm:px-4"
              onClick={() => setIsAddFormOpen(true)}
            >
              <Plus className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Add Recording
            </Button>
          )}
        </div>

        {isInitialLoading ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !allRecordedSamagams?.length ? (
          <div className="text-center py-12 px-4 border border-dashed border-border rounded-lg bg-muted/30">
            <div className="inline-block p-6 bg-primary/5 rounded-full mb-4">
              <Loader2 className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No recordings yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
              Recorded kirtans will appear here once added.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {allRecordedSamagams.map((samagam, index) => (
                <motion.div
                  key={samagam.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onMouseEnter={() => setHoveredCardId(samagam.id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                >
                  <Card className="samagam-card h-full flex flex-col overflow-hidden">
                    <CardHeader className="pb-2 flex-shrink-0">
                      <CardTitle className="text-base sm:text-lg line-clamp-2 text-ellipsis overflow-hidden group-hover:text-primary transition-colors">
                        {samagam.title}
                      </CardTitle>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {format(new Date(samagam.date), "EEEE, MMMM d, yyyy")}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4 flex-grow overflow-hidden pt-0 relative">
                      <div className="flex-shrink-0 w-full relative">
                        <YouTubeEmbed url={samagam.youtubeUrl} />
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 overflow-hidden text-ellipsis">
                        {samagam.description}
                      </p>
                    </CardContent>
                    {user?.isAdmin && (
                      <CardFooter className="flex justify-end space-x-2 pt-2 sm:pt-3 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(samagam)}
                          className="h-7 w-7 sm:h-8 sm:w-8 rounded-full"
                        >
                          <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDeleteConfirmation(samagam)}
                          className="h-7 w-7 sm:h-8 sm:w-8 rounded-full"
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>

            {hasMore && (
              <div ref={loadMoreRef} className="flex justify-center mt-8">
                {isLoadingMore && (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                )}
              </div>
            )}
          </>
        )}

        {/* Add Dialog */}
        <Dialog open={isAddFormOpen} onOpenChange={setIsAddFormOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add Recorded Kirtan</DialogTitle>
              <DialogDescription>
                Add a new recorded kirtan. Fill in the details below.
              </DialogDescription>
            </DialogHeader>
            <RecordedSamagamForm onSuccess={handleAddFormSubmit} />
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Recorded Kirtan</DialogTitle>
              <DialogDescription>
                Update the recorded kirtan details below.
              </DialogDescription>
            </DialogHeader>
            {selectedSamagam && (
              <RecordedSamagamForm
                samagamToEdit={selectedSamagam}
                onSubmit={handleUpdate}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                recorded kirtan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
