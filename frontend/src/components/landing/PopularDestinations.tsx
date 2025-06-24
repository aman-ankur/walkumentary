"use client";

import { Button } from "@/components/ui/button";
import React from "react";
import { LocationResponse } from "@/lib/types";

const popularRows: string[][] = [
  ["Paris", "Rome", "Barcelona", "Amsterdam", "Prague"],
  ["Vienna", "Florence", "Berlin", "London", "Venice"],
  ["Budapest", "Lisbon"],
];

interface PopularProps {
  onSelect: (name: string) => void;
}

export const PopularDestinations: React.FC<PopularProps> = ({ onSelect }) => {
  return (
    <div className="text-center">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Popular Destinations</h3>
      <div className="space-y-4">
        {popularRows.map((row, idx) => (
          <div key={idx} className="flex flex-wrap justify-center gap-3">
            {row.map((city) => (
              <Button
                key={city}
                variant="outline"
                className="px-4 py-2 rounded-full border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                onClick={() => onSelect(city)}
              >
                {city}
              </Button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}; 