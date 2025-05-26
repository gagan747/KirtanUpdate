import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface CalendarSamagam {
  id: number;
  title: string;
  date: string;
  color: string;
}

interface CalendarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CalendarModal({ open, onOpenChange }: CalendarModalProps) {
  const [, setLocation] = useLocation();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  // Fetch upcoming samagams for calendar
  const { data: samagams = [], isLoading } = useQuery({
    queryKey: ["calendar-samagams"],
    queryFn: async () => {
      console.log("Fetching calendar samagams...");
      const response = await apiRequest("GET", "/api/samagams/calendar");
      console.log("Calendar API response:", response);
      // Ensure we always return an array
      const data = Array.isArray(response) ? response : [];
      console.log("Processed calendar data:", data);
      return data;
    },
    enabled: open,
  });

  // Create a map of dates to samagams for quick lookup
  const samagamsByDate = samagams.reduce((acc: Record<string, CalendarSamagam[]>, samagam: CalendarSamagam) => {
    // Parse the ISO date string correctly - extract just the date part
    const dateOnly = samagam.date.split('T')[0];
    console.log(`Processing samagam for date ${dateOnly}:`, samagam);
    if (!acc[dateOnly]) {
      acc[dateOnly] = [];
    }
    acc[dateOnly].push(samagam);
    return acc;
  }, {});

  // Log the mapped dates for debugging
  console.log("Samagams by date:", samagamsByDate);
  console.log("Available dates:", Object.keys(samagamsByDate));

  // Get samagams for selected date
  const selectedDateSamagams = selectedDate 
    ? samagamsByDate[format(selectedDate, "yyyy-MM-dd")] || []
    : [];

  // Custom day renderer to show samagam colors
  const DayContent = ({ date }: { date: Date }) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const dateSamagams = samagamsByDate[dateKey] || [];
    
    // Log when we find a date with samagams
    if (dateSamagams.length > 0) {
      console.log(`Found ${dateSamagams.length} samagams for date ${dateKey}:`, dateSamagams);
    }
    
    return (
      <div 
        className={`relative w-full h-full flex items-center justify-center rounded-full
          ${dateSamagams.length > 0 ? 'text-white font-semibold' : ''}
        `}
        style={dateSamagams.length > 0 ? {
          backgroundColor: dateSamagams[0].color,
          // Make the background slightly transparent
          opacity: 0.9,
          // Add a subtle transition
          transition: 'all 0.2s ease-in-out',
        } : undefined}
      >
        <span>{date.getDate()}</span>
        {dateSamagams.length > 1 && (
          <div 
            className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground border-2 border-background"
            title={`${dateSamagams.length} samagams`}
          >
            {dateSamagams.length}
          </div>
        )}
      </div>
    );
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const dateKey = format(date, "yyyy-MM-dd");
      const dateSamagams = samagamsByDate[dateKey] || [];
      
      console.log("Selected date:", dateKey);
      console.log("Samagams for selected date:", dateSamagams);
      
      if (dateSamagams.length === 1) {
        // If only one samagam, navigate directly
        console.log("Navigating to samagam:", dateSamagams[0].id);
        setLocation(`/samagam/${dateSamagams[0].id}`);
        onOpenChange(false);
      } else {
        // Multiple samagams or no samagams, show them in the selection area
        setSelectedDate(date);
      }
    }
  };

  const handleSamagamClick = (samagamId: number) => {
    console.log("Clicked samagam:", samagamId);
    setLocation(`/samagam/${samagamId}`);
    onOpenChange(false);
  };

  // Log when the modal opens/closes
  console.log("Calendar modal open:", open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            Future Samagams Calendar
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => {
                // Only disable past dates
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date < today;
              }}
              className="rounded-md border mx-auto w-full"
              components={{
                DayContent: DayContent,
              }}
              classNames={{
                months: "space-y-4 sm:space-y-5",
                month: "space-y-4 sm:space-y-5",
                caption: "flex justify-center pt-1 relative items-center gap-1",
                caption_label: "text-sm font-medium",
                nav: "flex items-center gap-1",
                nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse",
                head_row: "flex",
                head_cell: "w-9 sm:w-10 font-normal text-[0.8rem] sm:text-sm text-muted-foreground",
                row: "flex w-full mt-2",
                cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
                day: "h-9 w-9 sm:h-10 sm:w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-full",
                day_range_end: "day-range-end",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_hidden: "invisible",
              }}
            />
            
            {selectedDate && selectedDateSamagams.length > 0 && (
              <div className="space-y-2 px-2 sm:px-4">
                <h3 className="font-semibold text-sm sm:text-base">
                  Samagams on {format(selectedDate, "MMMM d, yyyy")}:
                </h3>
                <div className="space-y-2">
                  {selectedDateSamagams.map((samagam: CalendarSamagam) => (
                    <Button
                      key={samagam.id}
                      variant="outline"
                      className="w-full justify-start h-auto p-2 sm:p-3 text-sm sm:text-base"
                      onClick={() => handleSamagamClick(samagam.id)}
                      style={{
                        borderColor: samagam.color,
                        borderWidth: '2px'
                      }}
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div
                          className="w-2 sm:w-3 h-2 sm:h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: samagam.color }}
                        />
                        <span className="text-left line-clamp-1">{samagam.title}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {selectedDate && selectedDateSamagams.length === 0 && (
              <div className="text-center text-muted-foreground py-4 text-sm sm:text-base">
                No samagams on {format(selectedDate, "MMMM d, yyyy")}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
