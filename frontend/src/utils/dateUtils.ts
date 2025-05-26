// A utility for formatting dates and times
import { format, formatDistance } from 'date-fns';

/**
 * Formats a date as a relative time (e.g., "5 minutes ago", "2 days ago")
 * @param dateString A date string or Date object
 * @returns A formatted string showing the relative time
 */
export const formatTimeAgo = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return formatDistance(date, new Date(), { addSuffix: true });
};

/**
 * Formats a date in a standard format
 * @param dateString A date string or Date object
 * @returns A formatted date string in the format "MMM d, yyyy h:mm a"
 */
export const formatDate = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return format(date, 'MMM d, yyyy h:mm a');
};
