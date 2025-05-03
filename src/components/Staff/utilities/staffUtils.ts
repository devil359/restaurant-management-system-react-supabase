
import { format, parseISO, differenceInDays } from "date-fns";

export const formatDateTime = (dateTimeString: string) => {
  if (!dateTimeString) return "";
  try {
    return format(parseISO(dateTimeString), "MMM dd, yyyy h:mm a");
  } catch (error) {
    return dateTimeString;
  }
};

export const formatDate = (dateString: string) => {
  if (!dateString) return "";
  try {
    if (dateString.includes('T')) {
      return format(parseISO(dateString), "MMM dd, yyyy");
    }
    return format(new Date(dateString), "MMM dd, yyyy");
  } catch (error) {
    return dateString;
  }
};

export const calculateDuration = (startDateStr: string, endDateStr: string) => {
  try {
    // Handle both date-only and datetime strings
    const startDate = startDateStr.includes('T') ? parseISO(startDateStr) : new Date(startDateStr);
    const endDate = endDateStr.includes('T') ? parseISO(endDateStr) : new Date(endDateStr);
    
    return differenceInDays(endDate, startDate) + 1; // +1 to include both start and end days
  } catch (error) {
    return 0;
  }
};

export const calculateHourMinuteDuration = (startTimeStr: string, endTimeStr: string): string => {
  try {
    if (!startTimeStr || !endTimeStr) return "—";

    const startTime = parseISO(startTimeStr);
    const endTime = parseISO(endTimeStr);
    
    const durationMs = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  } catch (error) {
    return "—";
  }
};
