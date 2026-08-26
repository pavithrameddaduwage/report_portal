"use client";

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SlidersHorizontal } from "lucide-react";
import * as React from "react";

interface NumberRange {
  min: number | "";
  max: number | "";
}

interface NumberRangePickerProps {
  value: NumberRange | undefined;
  onChange: (range: NumberRange) => void;
}

const NumberRangePicker: React.FC<NumberRangePickerProps> = ({ value, onChange }) => {
  const [open, setOpen] = React.useState(false);
  const [tempValue, setTempValue] = React.useState<NumberRange>({ min: "", max: "" });

  React.useEffect(() => {
    if (open) {
      setTempValue({
        min: value?.min ?? "",
        max: value?.max ?? "",
      });
    }
  }, [open, value]);

  const handleInputChange = (key: keyof NumberRange, val: string) => {
    const num = val === "" ? "" : Number(val);
    setTempValue((prev) => ({ ...prev, [key]: num }));
  };

  const applyValues = () => {
    onChange(tempValue);
    setOpen(false);
  };

  const clearValues = () => {
    setTempValue({ min: "", max: "" });
    onChange({ min: "", max: "" });
    setOpen(false);
  };

  const hasMin = value?.min !== "" && value?.min !== undefined;
  const hasMax = value?.max !== "" && value?.max !== undefined;
  const buttonLabel =
    hasMin && hasMax
      ? `${value?.min} – ${value?.max}`
      : hasMin
      ? `≥ ${value?.min}`
      : hasMax
      ? `≤ ${value?.max}`
      : "Min – Max";

  const isFiltered = hasMin || hasMax;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`h-7 w-full justify-start text-[12px] bg-white border border-[#dce6f1] shadow-2xs px-2.5 rounded-md ${
            isFiltered ? "text-[#1e5f99] font-semibold bg-[#eaf4fd]" : "text-[#8aa6bf] font-normal"
          }`}
        >
          <SlidersHorizontal className="mr-1.5 h-3 w-3 shrink-0 text-[#8aa6bf]" />
          <span className="truncate">{buttonLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3 space-y-3 bg-white border border-[#dce6f1] shadow-md rounded-lg">
        <div className="text-[11px] font-bold text-[#0a1c30]">Filter Number Range</div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={tempValue.min}
            onChange={(e) => handleInputChange("min", e.target.value)}
            className="h-8 text-xs bg-white border border-[#dce6f1]"
          />
          <span className="text-xs text-[#8aa6bf]">to</span>
          <Input
            type="number"
            placeholder="Max"
            value={tempValue.max}
            onChange={(e) => handleInputChange("max", e.target.value)}
            className="h-8 text-xs bg-white border border-[#dce6f1]"
          />
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-[#dce6f1]">
          <button
            type="button"
            className="text-xs text-[#5c7f9f] hover:text-[#d33a3a] font-medium cursor-pointer"
            onClick={clearValues}
          >
            Clear
          </button>
          <Button
            type="button"
            size="sm"
            className="h-6 text-xs px-3 bg-[#0e2947] hover:bg-[#163e6b] text-white font-medium rounded cursor-pointer"
            onClick={applyValues}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NumberRangePicker;
