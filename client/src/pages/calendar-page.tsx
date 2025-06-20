import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import Layout from "@/components/layout";
import { motion } from "framer-motion";

interface CalendarSamagam {
  id: number;
  title: string;
  date: string;
  color: string;
}

export default function CalendarPage() {
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
      } else {
        // Multiple samagams or no samagams, show them in the selection area
        setSelectedDate(date);
      }
    }
  };

  const handleSamagamClick = (samagamId: number) => {
    console.log("Clicked samagam:", samagamId);
    setLocation(`/samagam/${samagamId}`);
  };

  return (
    <Layout>
      <div className="container mx-auto py-4 px-2 sm:py-8 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center justify-center gap-2">
              <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              Samagams Calendar
            </h1>
            <p className="text-muted-foreground">
              View all Upcoming Samagams 
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar Section */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">Calendar View</CardTitle>
                  </CardHeader>
                  <CardContent>
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
                        caption_label: "text-sm sm:text-base font-medium",
                        nav: "flex items-center gap-1",
                        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                        nav_button_previous: "absolute left-1",
                        nav_button_next: "absolute right-1",
                        table: "w-full border-collapse",
                        head_row: "flex",
                        head_cell: "w-9 sm:w-12 font-normal text-[0.8rem] sm:text-sm text-muted-foreground",
                        row: "flex w-full mt-2",
                        cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
                        day: "h-9 w-9 sm:h-12 sm:w-12 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-full",
                        day_range_end: "day-range-end",
                        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                        day_today: "bg-accent text-accent-foreground",
                        day_outside: "opacity-50",
                        day_disabled: "text-muted-foreground opacity-50",
                        day_hidden: "invisible",
                      }}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Selected Date Details */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">
                      {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a Date"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedDate && selectedDateSamagams.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground mb-3">
                          {selectedDateSamagams.length} samagam{selectedDateSamagams.length > 1 ? 's' : ''} on this date:
                        </p>
                        <div className="space-y-2">
                          {selectedDateSamagams.map((samagam: CalendarSamagam) => (
                            <Button
                              key={samagam.id}
                              variant="outline"
                              className="w-full justify-start h-auto p-3 text-sm"
                              onClick={() => handleSamagamClick(samagam.id)}
                              style={{
                                borderColor: samagam.color,
                                borderWidth: '2px'
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: samagam.color }}
                                />
                                <span className="text-left line-clamp-2">{samagam.title}</span>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>
                    ) : selectedDate ? (
                      <div className="text-center text-muted-foreground py-8">
                        <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No samagams on this date</p>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Click on a date to view samagams</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Legend */}
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Legend</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-4 h-4 rounded-full bg-primary"></div>
                      <span>Selected date</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-4 h-4 rounded-full bg-accent"></div>
                      <span>Today</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-4 h-4 rounded-full " style={{backgroundColor:'#FF0000'}}></div>
                      <span>Has samagams</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
} 