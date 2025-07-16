"use client";

import clsx from "clsx";
import Image from "next/image";

export interface InterestItem {
  id: string;
  title: string;
  subtitle: string;
  img: string;
}

interface Props extends InterestItem {
  selected: boolean;
  onToggle: (id: string) => void;
}

export const InterestCard: React.FC<Props> = ({ id, title, subtitle, img, selected, onToggle }) => {
  return (
    <div
      onClick={() => onToggle(id)}
      className="group cursor-pointer text-center transition-transform hover:scale-105"
    >
      <div
        className={clsx(
          "relative w-28 h-28 sm:w-24 sm:h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 shadow-md transition-all",
          selected ? "border-orange-500 shadow-orange-200" : "border-white group-hover:border-orange-300"
        )}
      >
        <Image src={img} alt={title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
        {selected && (
          <div className="absolute inset-0 bg-orange-500/30 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={3}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
      <h3 className="font-medium mb-1 text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600">{subtitle}</p>
    </div>
  );
}; 