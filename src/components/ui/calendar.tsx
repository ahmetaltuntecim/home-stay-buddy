import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { addMonths, subMonths } from "date-fns";
import { useHolidays, isDateHoliday, getHolidayName } from "@/hooks/useHolidays";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  showHolidays?: boolean;
};

function Calendar({ className, classNames, showOutsideDays = true, showHolidays = true, ...props }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(props.month || props.defaultMonth || new Date());
  const [touchStart, setTouchStart] = React.useState<number | null>(null);

  const { data: holidays = [] } = useHolidays(currentMonth.getFullYear());
  const { data: nextYearHolidays = [] } = useHolidays(currentMonth.getFullYear() + 1);
  const allHolidays = [...holidays, ...nextYearHolidays];

  React.useEffect(() => {
    if (props.month) setCurrentMonth(props.month);
  }, [props.month]);

  const handleMonthChange = (newMonth: Date) => {
    setCurrentMonth(newMonth);
    props.onMonthChange?.(newMonth);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      // Swipe left -> Next month
      handleMonthChange(addMonths(currentMonth, 1));
    } else if (distance < -minSwipeDistance) {
      // Swipe right -> Previous month
      handleMonthChange(subMonths(currentMonth, 1));
    }
    setTouchStart(null);
  };

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("p-3", className)}
        month={currentMonth}
        onMonthChange={handleMonthChange}
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: cn(buttonVariants({ variant: "ghost" }), "h-9 w-9 p-0 font-normal aria-selected:opacity-100"),
          day_range_end: "day-range-end",
          day_selected:
            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_outside:
            "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          ...classNames,
        }}
        components={{
          IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
          IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
          DayContent: ({ date, ...dayProps }) => {
            const isHoliday = showHolidays && isDateHoliday(date, allHolidays);
            const holidayName = showHolidays ? getHolidayName(date, allHolidays) : undefined;
            return (
              <div className="flex flex-col items-center relative w-full h-full justify-center" title={holidayName}>
                <span>{date.getDate()}</span>
                {isHoliday && <div className="day-holiday-dot" />}
              </div>
            );
          },
          ...props.components,
        }}
        {...props}
      />
    </div>
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
