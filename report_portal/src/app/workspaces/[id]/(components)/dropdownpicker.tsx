"use client";

import * as React from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, Search, X } from "lucide-react";

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
  const [searchQuery, setSearchQuery] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setTempValue(value || []);
      setSearchQuery("");
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

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.trim().toLowerCase();
    return options.filter((opt) => String(opt).toLowerCase().includes(q));
  }, [options, searchQuery]);

  const handleSelectAllFiltered = () => {
    const stringFiltered = filteredOptions.map((o) => String(o));
    const allSelected = stringFiltered.every((o) => tempValue.includes(o));
    if (allSelected) {
      setTempValue((prev) => prev.filter((item) => !stringFiltered.includes(item)));
    } else {
      setTempValue((prev) => Array.from(new Set([...prev, ...stringFiltered])));
    }
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
      <PopoverContent className="w-56 p-2 space-y-1.5 border border-[#dce6f1] bg-white shadow-md rounded-lg">
        {/* Search Input */}
        <div className="flex items-center px-2 py-1 border border-[#dce6f1] rounded-md bg-[#f8fbfe] focus-within:border-[#2f8fe0] focus-within:ring-1 focus-within:ring-[#2f8fe0]">
          <Search className="h-3.5 w-3.5 text-[#8aa6bf] mr-1.5 shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search options..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-[#0f2b48] placeholder:text-[#8aa6bf] outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                searchInputRef.current?.focus();
              }}
              className="text-[#8aa6bf] hover:text-[#0f2b48] p-0.5 rounded cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Action bar when searching */}
        {filteredOptions.length > 0 && options.length > 0 && (
          <div className="flex justify-between items-center px-1 text-[11px] text-[#5c7f9f]">
            <span>{filteredOptions.length} of {options.length} options</span>
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="text-[#1890ff] hover:underline cursor-pointer font-medium"
            >
              {filteredOptions.every((o) => tempValue.includes(String(o)))
                ? "Deselect all"
                : "Select all"}
            </button>
          </div>
        )}

        <div className="space-y-0.5 max-h-48 overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <div className="text-[11px] text-[#8aa6bf] text-center py-3">
              {options.length === 0 ? "No options available" : "No matching options"}
            </div>
          ) : (
            filteredOptions.map((option, index) => {
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

