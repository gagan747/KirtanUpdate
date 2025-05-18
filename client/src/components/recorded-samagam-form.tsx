import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRecordedSamagamSchema, InsertRecordedSamagam, RecordedSamagam } from "@shared/schema";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface RecordedSamagamFormProps {
  samagamToEdit?: RecordedSamagam | null;
  onSuccess?: () => void;
  onSubmit?: (data: InsertRecordedSamagam) => void; // For handling updates externally
}

export default function RecordedSamagamForm({ samagamToEdit, onSuccess, onSubmit }: RecordedSamagamFormProps) {
  const { toast } = useToast();
  const isEditMode = !!samagamToEdit;

  const form = useForm<InsertRecordedSamagam>({
    resolver: zodResolver(insertRecordedSamagamSchema),
    defaultValues: isEditMode
      ? {
          title: samagamToEdit.title,
          description: samagamToEdit.description,
          youtubeUrl: samagamToEdit.youtubeUrl,
          date: new Date(samagamToEdit.date), // Ensure date is a Date object
        }
      : {
          title: "",
          description: "",
          youtubeUrl: "",
          date: new Date(),
        },
  });

  // Reset form if samagamToEdit changes (e.g., opening edit dialog for different items)
  useEffect(() => {
    if (isEditMode) {
      form.reset({
        title: samagamToEdit.title,
        description: samagamToEdit.description,
        youtubeUrl: samagamToEdit.youtubeUrl,
        date: new Date(samagamToEdit.date),
      });
    } else {
      form.reset({
        title: "",
        description: "",
        youtubeUrl: "",
        date: new Date(),
      });
    }
  }, [samagamToEdit, form, isEditMode]);


  // Internal mutation for adding new recordings
  const addMutation = useMutation({
    mutationFn: async (data: InsertRecordedSamagam) => {
      // Only used when not in edit mode
      const res = await apiRequest("POST", "/api/recorded-samagams", data);
      return res; // Assuming API returns the created object or success status
    },
    onSuccess: () => {
      toast({
        title: "Recording Added",
        description: "The recorded samagam has been added successfully.",
      });
      form.reset(); // Reset form after successful add
      
      // Call the parent's success handler after a brief delay to ensure state updates
      setTimeout(() => {
        onSuccess?.(); // Call external success handler (e.g., close dialog)
      }, 100);
    },
    onError: (error: Error) => {
      toast({
        title: "Error Adding Recording",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: InsertRecordedSamagam) => {
    // Ensure YouTube URL is properly formatted
    let youtubeUrl = data.youtubeUrl;
    if (youtubeUrl && !youtubeUrl.startsWith('http')) {
      youtubeUrl = `https://${youtubeUrl}`;
      data.youtubeUrl = youtubeUrl;
    }
    
    if (isEditMode && onSubmit) {
      onSubmit(data); // Call external submit handler for updates
    } else if (!isEditMode) {
      addMutation.mutate(data); // Use internal mutation for adding
    }
  };

  // Determine loading state based on mode
  const isLoading = isEditMode ? false : addMutation.isPending; // External mutation loading state is handled by parent

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter recording title" {...field} />
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
                  placeholder="Enter recording description"
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
          name="youtubeUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>YouTube URL</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter YouTube video URL" 
                  {...field} 
                  type="url"
                />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground">
                Example: https://www.youtube.com/watch?v=XXXXXXXXXXX
              </p>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input 
                  type="date" 
                  // Ensure value is always a string in 'yyyy-MM-dd' format for the input
                  value={field.value instanceof Date ? format(field.value, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    // When the input changes, parse the date string back into a Date object
                    // Handle potential invalid date string
                    const dateValue = e.target.value ? new Date(e.target.value + 'T00:00:00') : null; // Add time to avoid timezone issues
                    if (dateValue && !isNaN(dateValue.getTime())) {
                       field.onChange(dateValue);
                    } else {
                       // Handle invalid date input, maybe clear or set to null depending on requirements
                       // For now, let's keep the previous value or set null if input is cleared
                       field.onChange(e.target.value ? field.value : null); 
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {isEditMode ? "Update Recording" : "Add Recording"}
        </Button>
      </form>
    </Form>
  );
}
