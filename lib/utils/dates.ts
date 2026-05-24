import { format, subDays, parseISO } from "date-fns";

export function formatDate(d: Date | string) {
  return format(typeof d === "string" ? parseISO(d) : d, "MMM d, yyyy");
}

export function last30Days(): { from: string; to: string } {
  const to = new Date();
  const from = subDays(to, 30);
  return {
    from: format(from, "yyyy-MM-dd"),
    to: format(to, "yyyy-MM-dd"),
  };
}

export function dateRange(days: number): { from: string; to: string } {
  const to = new Date();
  const from = subDays(to, days);
  return {
    from: format(from, "yyyy-MM-dd"),
    to: format(to, "yyyy-MM-dd"),
  };
}
