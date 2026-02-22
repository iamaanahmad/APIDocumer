"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchEndpointsProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchEndpoints({ value, onChange, placeholder = "Search endpoints..." }: SearchEndpointsProps) {
  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 w-full"
      />
    </div>
  );
}
