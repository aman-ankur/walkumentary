"use client";
import Image from "next/image";
import clsx from "clsx";

export interface VoiceItem {
  id: string;
  name: string;
  description: string;
  personality: string;
  personalityBg: string; // Tailwind classes for badge
  img: string;
}

interface Props extends VoiceItem {
  selected: boolean;
  onSelect: (id: string) => void;
}

export const VoiceCard: React.FC<Props> = ({ id, name, description, personality, personalityBg, img, selected, onSelect }) => (
  <div className="group cursor-pointer text-center transition-transform hover:scale-105" onClick={() => onSelect(id)}>
    <div className="relative w-24 h-24 mx-auto mb-4">
      <Image src={img} alt={name} fill className="rounded-full object-cover shadow-lg" />
      {selected && (
        <div className="absolute -top-1 -right-1 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
    <h3 className="font-bold text-gray-900 mb-1">{name}</h3>
    <p className="text-sm text-gray-600 mb-1">{description}</p>
    <span className={clsx("inline-block px-3 py-1 rounded-full text-xs font-medium", personalityBg)}>{personality}</span>
  </div>
); 