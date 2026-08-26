// components/FilterRow.tsx
"use client";

import { useEffect, useState } from "react";
import { TableRow, TableHead } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import DateRangePicker from "./datepickerwithrange";
import NumberRangePicker from "./numberrangepicker";
import DropdownPicker from "./dropdownpicker";
import { getItemsforDropdown } from "@/services/datawarehouse-service";

const FilterComponent = ({ filterType, filterValue, filterColumn, view, schema, onChange }: any) => {
  const [columns, setColumns] = useState<string[]>([]);

  useEffect(() => {
    if (filterType === "dropdown") {
      const fetchColumns = async () => {
        const response = await getItemsforDropdown({ view, schema, column: filterColumn });
        if (response.status === 201) {
          setColumns(response.data);
        }
      };
      fetchColumns();
    }
  }, [filterType, view, schema, filterColumn]);

  switch (filterType) {
    case "date_range":
      return <DateRangePicker value={filterValue ? filterValue.value : null} onChange={onChange} />;
    case "numeric_date_range":
      return <DateRangePicker value={filterValue ? filterValue.value : null} onChange={onChange} />;
    case "number_range":
      return <NumberRangePicker value={filterValue ? filterValue.value : null} onChange={onChange} />;
    case "dropdown":
      return (
        <DropdownPicker
          options={Array.isArray(columns) ? [...columns] : []}
          value={filterValue ? filterValue.value : []}
          onChange={onChange}
        />
      );
    default:
      return (
        <Input
          type="text"
          value={filterValue?.value !== undefined ? filterValue.value : ""}
          placeholder="Filter..."
          onChange={(e) => onChange(e.target.value)}
          className="text-[12px] h-7 w-full rounded-md border border-[#dce6f1] bg-white px-2 text-[#0f2b48] placeholder:text-[#8aa6bf] shadow-2xs focus-visible:ring-1 focus-visible:ring-[#2f8fe0]"
        />
      );
  }
};

const FilterRow = ({ schema, view, filters, onFilterChange, reset }: any) => {
  const [filterValues, setFilterValues] = useState<any>({});

  useEffect(() => {
    if (typeof onFilterChange === "function") {
      onFilterChange(filterValues);
    }
  }, [filterValues]);

  useEffect(() => {
    setFilterValues({});
  }, [reset]);

  const convertDateToNumber = (date: Date): number | undefined => {
    if (!date) return undefined;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return parseInt(`${year}${month}${day}`);
  };

  const handleChange = (key: string, value: any, filter_type: string) => {
    setFilterValues((prev: any) => {
      const updated = { ...prev };
      const isEmpty =
        value === "" ||
        value === undefined ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === "object" &&
          value !== null &&
          !Array.isArray(value) &&
          Object.values(value).every((v) => v === "" || v === undefined));

      if (isEmpty) {
        delete updated[key];
      } else {
        if (filter_type === "numeric_date_range") {
          let from = value.from ? convertDateToNumber(value.from) : null;
          let to = value.to ? convertDateToNumber(value.to) : null;
          updated[key] = { value: { from, to }, filter_type };
        } else {
          updated[key] = { value, filter_type };
        }
      }
      return updated;
    });
  };

  return (
    <TableRow className="border-b border-[#dce6f1] bg-[#f2f7fc]">
      {filters.map((filter: any, index: number) => (
        <TableHead key={filter.column + index} className="p-1.5 px-3.5 align-middle">
          <FilterComponent
            filterType={filter.filter_type}
            filterValue={filterValues[filter.column]}
            schema={schema}
            view={view}
            filterColumn={filter.column}
            onChange={(value: any) =>
              handleChange(filter.column, value, filter.filter_type)
            }
          />
        </TableHead>
      ))}
    </TableRow>
  );
};

export default FilterRow;
