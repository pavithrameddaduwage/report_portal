"use client";

import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import * as React from "react";
import { DateRange } from "react-day-picker";

interface DateRangePickerProps {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange }) => {
  const [open, setOpen] = React.useState(false);
  const [tempValue, setTempValue] = React.useState<DateRange | undefined>(undefined);

  React.useEffect(() => {
    if (open) {
      setTempValue(value ?? { from: undefined, to: undefined });
    }
  }, [open, value]);

  const handleApply = () => {
    if (tempValue?.from || tempValue?.to) {
      const normalizedRange = {
        from: tempValue?.from
          ? new Date(tempValue.from.getFullYear(), tempValue.from.getMonth(), tempValue.from.getDate())
          : undefined,
        to: tempValue?.to
          ? new Date(tempValue.to.getFullYear(), tempValue.to.getMonth(), tempValue.to.getDate())
          : undefined,
      };
      onChange(normalizedRange);
    } else {
      onChange(undefined);
    }
    setOpen(false);
  };

  const handleClear = () => {
    setTempValue({ from: undefined, to: undefined });
    onChange({ from: undefined, to: undefined });
    setOpen(false);
  };

  const parseNumberToDate = (num: number): Date => {
    const str = num.toString();
    const year = parseInt(str.slice(0, 4));
    const month = parseInt(str.slice(4, 6)) - 1;
    const day = parseInt(str.slice(6, 8));
    return new Date(year, month, day);
  };

  const getFormattedDate = (input?: Date | number): string | undefined => {
    if (!input) return;
    const date = typeof input === "number" ? parseNumberToDate(input) : input;
    return format(date, "MM/dd/yyyy");
  };

  const isFiltered = value?.from || value?.to;
  const formatted =
    value?.from && value?.to
      ? `${getFormattedDate(value.from)} – ${getFormattedDate(value.to)}`
      : value?.from
      ? `From ${getFormattedDate(value.from)}`
      : "Pick date range";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-full justify-start text-left text-[12px] h-7 bg-white border border-[#dce6f1] shadow-2xs px-2.5 rounded-md ${
            isFiltered ? "text-[#1e5f99] font-semibold bg-[#eaf4fd]" : "text-[#8aa6bf] font-normal"
          }`}
        >
          <CalendarIcon className="mr-1.5 h-3 w-3 shrink-0 text-[#8aa6bf]" />
          <span className="truncate">{formatted}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3 space-y-2 bg-white border border-[#dce6f1] shadow-md rounded-lg" align="start">
        <Calendar
          mode="range"
          selected={tempValue}
          onSelect={setTempValue}
          numberOfMonths={1}
        />
        <div className="flex justify-between items-center pt-2 border-t border-[#dce6f1]">
          <button
            type="button"
            className="text-xs text-[#5c7f9f] hover:text-[#d33a3a] font-medium cursor-pointer"
            onClick={handleClear}
          >
            Clear
          </button>
          <Button
            type="button"
            size="sm"
            className="h-6 text-xs px-3 bg-[#0e2947] hover:bg-[#163e6b] text-white font-medium rounded cursor-pointer"
            onClick={handleApply}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DateRangePicker;
