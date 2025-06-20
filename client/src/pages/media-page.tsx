import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Image, Video as VideoIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout";
import { MediaForm } from "@/components/media-form";

// Types for Media
interface Media {
  id: number;
  title: string;
  description: string;
  driveUrl: string;
  mediaType: 'image' | 'video';
  date: string;
  addedBy: number | null;
  createdAt: string;
}

// Function to convert Google Drive share links to embed links
function convertDriveUrl(url: string, mediaType: 'image' | 'video'): string {
  try {
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
      const fileId = match[1];
      if (mediaType === 'image') {
        return `https://drive.google.com/file/d/${fileId}/preview`;
      } else {
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }
    return url; // Return original if no match
  } catch {
    return url;
  }
}

// Media Card Component
function MediaCard({ media, onEdit, onDelete, isAdmin }: {
  media: Media;
  onEdit: (media: Media) => void;
  onDelete: (id: number) => void;
  isAdmin: boolean;
}) {
  const embedUrl = convertDriveUrl(media.driveUrl, media.mediaType);

  return (
    <Card className="overflow-hidden">
      <div className="aspect-video bg-gray-100 relative">
        <iframe
          src={embedUrl}
          className="w-full h-full rounded-t-lg"
          allowFullScreen
          title={media.title}
          sandbox="allow-same-origin allow-scripts"
        />
        <Badge 
          variant="secondary" 
          className="absolute top-2 right-2 flex items-center gap-1"
        >
          {media.mediaType === 'image' ? <Image size={12} /> : <VideoIcon size={12} />}
          {media.mediaType}
        </Badge>
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-2">{media.title}</CardTitle>
          {isAdmin && (
            <div className="flex gap-1 ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(media)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(media.id)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
          {media.description}
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date(media.date).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}

export default function MediaPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingMedia, setEditingMedia] = useState<Media | null>(null);

  const isAdmin = user?.isAdmin || false;

  // Fetch media with pagination
  const { data, isLoading, error } = useQuery({
    queryKey: ["media", currentPage],
    queryFn: async () => {
      const response = await fetch(`/api/media?page=${currentPage}&limit=12`);
      if (!response.ok) {
        throw new Error("Failed to fetch media");
      }
      return response.json();
    },
  });

  // Delete media mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/media/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete media");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
      toast({
        title: "Success",
        description: "Media deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete media",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (media: Media) => {
    setEditingMedia(media);
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this media item?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingMedia(null);
  };

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">Error</h1>
            <p className="text-muted-foreground">Failed to load media. Please try again later.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Media Gallery</h1>
            <p className="text-muted-foreground">
              Browse images and videos from our community
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Media
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-video bg-gray-200 animate-pulse" />
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : data?.media?.length === 0 ? (
          <div className="text-center py-12">
            <VideoIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No media yet</h2>
            <p className="text-muted-foreground mb-4">
              {isAdmin 
                ? "Start by adding some images or videos to the gallery"
                : "Check back later for new media content"
              }
            </p>
            {isAdmin && (
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add First Media
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {data?.media?.map((media: Media) => (
                <MediaCard
                  key={media.id}
                  media={media}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isAdmin={isAdmin}
                />
              ))}
            </div>

            {/* Pagination */}
            {data?.pagination && data.pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1)
                    .filter(page => 
                      page === 1 || 
                      page === data.pagination.totalPages || 
                      Math.abs(page - currentPage) <= 1
                    )
                    .map((page, index, array) => (
                      <div key={page} className="flex items-center">
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="px-2">...</span>
                        )}
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-10"
                        >
                          {page}
                        </Button>
                      </div>
                    ))}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(data.pagination.totalPages, currentPage + 1))}
                  disabled={currentPage === data.pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}

        {/* Media Form Modal */}
        {showForm && (
          <MediaForm
            media={editingMedia}
            onClose={handleFormClose}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["media"] });
              handleFormClose();
            }}
          />
        )}
      </div>
    </Layout>
  );
} 