"use client";

import * as React from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown } from "lucide-react";

interface DropdownPickerProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: string[];
  placeholder?: string;
}

const DropdownPicker: React.FC<DropdownPickerProps> = ({
  value = [],
  onChange,
  options = [],
  placeholder = "Select options",
}) => {
  const [open, setOpen] = React.useState(false);
  const [tempValue, setTempValue] = React.useState<string[]>(value || []);

  React.useEffect(() => {
    if (open) {
      setTempValue(value || []);
    }
  }, [open, value]);

  const toggleOption = (option: string) => {
    setTempValue((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option]
    );
  };

  const handleApply = () => {
    onChange(tempValue);
    setOpen(false);
  };

  const handleClear = () => {
    setTempValue([]);
    onChange([]);
    setOpen(false);
  };

  const label =
    !value || value.length === 0
      ? placeholder
      : value.length <= 2
      ? value.join(", ")
      : `${value.length} selected`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between text-left text-[12px] h-7 bg-white border border-[#dce6f1] text-[#0f2b48] shadow-2xs hover:bg-[#f6fafc] px-2"
        >
          <span className="truncate">{label}</span>
          <ChevronDown className="ml-1.5 h-3 w-3 shrink-0 text-[#8aa6bf]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-2 space-y-1.5 border border-[#dce6f1] bg-white shadow-md rounded-lg">
        <div className="space-y-0.5 max-h-48 overflow-y-auto">
          {options.length === 0 ? (
            <div className="text-[11px] text-[#8aa6bf] text-center py-2">
              No options available
            </div>
          ) : (
            options.map((option, index) => {
              const optStr = String(option);
              const isSelected = tempValue.includes(optStr);
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => toggleOption(optStr)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-left text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[#eaf4fd] text-[#1e5f99] font-semibold"
                      : "text-[#0f2b48] hover:bg-[#f6fafc]"
                  }`}
                >
                  <span className="truncate">{optStr}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-[#2f8fe0] shrink-0" />}
                </button>
              );
            })
          )}
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-[#dce6f1]">
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-[#5c7f9f] hover:text-[#d33a3a] px-2 py-1 font-medium cursor-pointer"
          >
            Clear
          </button>
          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            className="h-6 text-xs px-3 bg-[#0e2947] hover:bg-[#163e6b] text-white font-medium rounded cursor-pointer"
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DropdownPicker;
