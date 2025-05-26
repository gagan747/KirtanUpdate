// Time formatting utility for samagams
export function formatSamagamTime(samagam: any): string {
  // Handle new timeFrom/timeTo structure
  if (samagam.timeFrom && samagam.timeTo) {
    return `${samagam.timeFrom} - ${samagam.timeTo}`;
  }
  
  // Handle legacy time field for backward compatibility
  if (samagam.time) {
    return samagam.time;
  }
  
  // Default fallback
  return "Time TBD";
}

// Convert 24-hour time format to 12-hour with AM/PM
export function formatTimeDisplay(time: string): string {
  if (!time) return time;
  
  try {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  } catch (error) {
    return time; // Return original if parsing fails
  }
}

// Get a display-friendly time range
export function formatSamagamTimeDisplay(samagam: any): string {
  if (samagam.timeFrom && samagam.timeTo) {
    return `${formatTimeDisplay(samagam.timeFrom)} - ${formatTimeDisplay(samagam.timeTo)}`;
  }
  
  return formatSamagamTime(samagam);
}

// Check if a samagam is upcoming (within the next 7 days)
export function isSamagamUpcoming(samagamDate: string | Date): boolean {
  const samagamDateObj = new Date(samagamDate);
  const today = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(today.getDate() + 7);
  
  // Set time to start of day for accurate comparison
  today.setHours(0, 0, 0, 0);
  samagamDateObj.setHours(0, 0, 0, 0);
  sevenDaysFromNow.setHours(23, 59, 59, 999);
  
  return samagamDateObj >= today && samagamDateObj <= sevenDaysFromNow;
}
