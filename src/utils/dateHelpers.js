import { format, parseISO, isToday, isYesterday } from "date-fns";

export const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = parseISO(dateString);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "dd MMM yyyy");
};

export const getCurrentDate = () => {
  return format(new Date(), "yyyy-MM-dd");
};

export const getCurrentTime = () => {
  return format(new Date(), "HH:mm");
};