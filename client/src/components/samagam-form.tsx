import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSamagamSchema, InsertSamagam, Samagam } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, api } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, XCircle, Image as ImageIcon } from "lucide-react";
import { useState, useRef, useContext } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DialogClose } from "@/components/ui/dialog";

interface SamagamFormProps {
  samagam?: Samagam;
  onSuccess?: (samagam: Samagam) => void;
}

export default function SamagamForm({ samagam, onSuccess }: SamagamFormProps) {
  const { toast } = useToast();
  const isEditing = !!samagam;
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(samagam?.imageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const dialogCloseRef = useRef<HTMLButtonElement>(null);

  // Format the date to YYYY-MM-DD for input type="date"
  const formatDateForInput = (date: Date | string | undefined): string => {
    if (!date) return new Date().toISOString().split('T')[0];
    return new Date(date).toISOString().split('T')[0];
  };

  // Handle the date type correctly for the form
  const getDefaultDate = () => {
    return samagam?.date ? new Date(samagam.date) : new Date();
  };

  const form = useForm<InsertSamagam>({
    resolver: zodResolver(insertSamagamSchema),
    defaultValues: {
      title: samagam?.title ?? "",
      description: samagam?.description ?? "",
      date: getDefaultDate(),
      time: samagam?.time ?? "",
      location: samagam?.location ?? "",
      organizer: samagam?.organizer ?? "",
      contactInfo: samagam?.contactInfo ?? "",
      imageUrl: samagam?.imageUrl ?? "",
    },
  });

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file size
    if (file.size > 5 * 1048576) { // 5MB limit
      toast({
        title: "Error",
        description: "Image size exceeds limit of 5MiB",
        variant: "destructive",
      });
      return;
    }

    // Preview the image
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // Save the file for form submission
    setSelectedFile(file);
  };

  const clearImage = () => {
    setImagePreview(null);
    setSelectedFile(null);
    form.setValue("imageUrl", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: InsertSamagam) => {
      setIsUploading(true);
      
      try {
        // Create FormData to send both image and JSON data
        const formData = new FormData();
        
        // Add the JSON data
        formData.append('data', JSON.stringify(data));
        
        // Add the image file if selected
        if (selectedFile) {
          formData.append('image', selectedFile);
        }
        
        // Send the request using axios directly through api
        const url = isEditing ? `/api/samagams/${samagam.id}` : "/api/samagams";
        const method = isEditing ? "PATCH" : "POST";
        
        const response = await api({
          method,
          url,
          data: formData,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        return response.data;
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: (data: Samagam) => {
      toast({
        title: isEditing ? "Samagam updated" : "Samagam created",
        description: isEditing
          ? "Your changes have been saved."
          : "The new samagam has been created.",
      });
      
      // Call onSuccess callback with the updated data
      // The parent component will handle the data refresh
      onSuccess?.(data);
      
      // Close the dialog using ref
      dialogCloseRef.current?.click();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <ScrollArea className="max-h-[85vh] group">
      <div className="pb-4 px-1">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter samagam title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter samagam description"
                      {...field}
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      value={formatDateForInput(value)}
                      onChange={(e) => onChange(new Date(e.target.value))}
                      {...fieldProps}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 7:00 PM - 9:00 PM" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter location" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="organizer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organizer</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter organizer name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Information</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter contact information" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image</FormLabel>
                  <div className="space-y-2">
                    {imagePreview ? (
                      <div className="relative w-full max-w-md">
                        <img 
                          src={imagePreview} 
                          alt="Samagam Preview" 
                          className="rounded-md object-cover h-48 w-full"
                        />
                        <button
                          type="button"
                          onClick={clearImage}
                          className="absolute top-2 right-2 bg-white/80 rounded-full p-1 hover:bg-white"
                        >
                          <XCircle className="h-5 w-5 text-destructive" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-md">
                        <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Upload an image (max 5MiB)
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Image
                        </Button>
                      </div>
                    )}
                    <Input 
                      type="hidden" 
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={mutation.isPending || isUploading}>
              {(mutation.isPending || isUploading) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditing ? "Update Samagam" : "Create Samagam"}
            </Button>
            
            {/* Hidden DialogClose that will be triggered programmatically */}
            <DialogClose ref={dialogCloseRef} className="hidden" />
          </form>
        </Form>
      </div>
    </ScrollArea>
  );
}