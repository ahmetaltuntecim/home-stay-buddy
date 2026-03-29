import { useQuery } from "@tanstack/react-query";
import { parseISO } from "date-fns";

export interface Holiday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  types: string[];
}

export const useHolidays = (year: number = new Date().getFullYear()) => {
  return useQuery({
    queryKey: ["holidays", year],
    queryFn: async (): Promise<Holiday[]> => {
      const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/TR`);
      if (!response.ok) {
        throw new Error("Tatiller yüklenemedi");
      }
      return response.json();
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};

export const isDateHoliday = (date: Date, holidays: Holiday[] = []) => {
  return holidays.some(h => {
    const holidayDate = parseISO(h.date);
    return (
      holidayDate.getFullYear() === date.getFullYear() &&
      holidayDate.getMonth() === date.getMonth() &&
      holidayDate.getDate() === date.getDate()
    );
  });
};

export const getHolidayName = (date: Date, holidays: Holiday[] = []) => {
  return holidays.find(h => {
    const holidayDate = parseISO(h.date);
    return (
      holidayDate.getFullYear() === date.getFullYear() &&
      holidayDate.getMonth() === date.getMonth() &&
      holidayDate.getDate() === date.getDate()
    );
  })?.localName;
};
