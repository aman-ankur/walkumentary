"use client";

import { Header } from "@/components/Header";
import { InterestCard, InterestItem } from "@/components/customize/InterestCard";
import { NarrativeCard, NarrativeItem } from "@/components/customize/NarrativeCard";
import { VoiceCard, VoiceItem } from "@/components/customize/VoiceCard";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { api } from "@/lib/api";
import { useSearchParams } from "next/navigation";
import { TourStatusTracker } from "@/components/tour/TourStatusTracker";
import { useRouter } from "next/navigation";

const interests: InterestItem[] = [
  { id: "historical", title: "Historical Tales", subtitle: "Ancient stories & heritage", img: "https://images.unsplash.com/photo-1549880338-65ddcdfd017b?w=400&h=400&fit=crop" },
  { id: "architectural", title: "Architectural Marvels", subtitle: "Design & craftsmanship", img: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=400&fit=crop" },
  { id: "cultural", title: "Cultural Immersion", subtitle: "Local traditions & customs", img: "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?auto=format&fit=crop&w=400&h=400&q=80" },
  { id: "culinary", title: "Culinary Journey", subtitle: "Flavors & gastronomy", img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop" },
  { id: "artistic", title: "Artistic Legacy", subtitle: "Museums & galleries", img: "https://images.unsplash.com/photo-1511765224389-37f0e77cf0eb?w=400&h=400&fit=crop" },
  { id: "natural", title: "Natural Wonders", subtitle: "Parks & landscapes", img: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=400&fit=crop" },
  { id: "evening", title: "Evening Tales", subtitle: "After dark stories", img: "https://images.unsplash.com/photo-1499346030926-9a72daac6c63?w=400&h=400&fit=crop" },
  { id: "local", title: "Local Markets", subtitle: "Artisan crafts & goods", img: "https://images.unsplash.com/photo-1534081333815-ae5019106622?auto=format&fit=crop&w=400&h=400&q=80" },
];

const styles: NarrativeItem[] = [
  { id: "scholarly", name: "Scholarly Guide", description: "Educational & detailed insights", subtitle: "Like a knowledgeable professor", img: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop" },
  { id: "friendly", name: "Friendly Companion", description: "Warm & conversational", subtitle: "Like a local friend", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop" },
  { id: "storyteller", name: "Master Storyteller", description: "Narrative & immersive tales", subtitle: "Like an old traveler", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop" },
  { id: "witty", name: "Witty Raconteur", description: "Light-hearted & amusing", subtitle: "Like a charming guide", img: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop" },
];

const voices: VoiceItem[] = [
  { id: "nova", name: "Nova", description: "Clear & refined", personality: "Neutral", personalityBg: "bg-gray-100 text-gray-700", img: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=400&fit=crop" },
  { id: "alloy", name: "Alloy", description: "Warm & inviting", personality: "Friendly", personalityBg: "bg-blue-100 text-blue-700", img: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=400&fit=crop" },
  { id: "echo", name: "Echo", description: "Deep & resonant", personality: "Authoritative", personalityBg: "bg-purple-100 text-purple-700", img: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop" },
  { id: "shimmer", name: "Shimmer", description: "Bright & energetic", personality: "Vibrant", personalityBg: "bg-yellow-100 text-yellow-700", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop" },
];

export default function CustomizePage() {
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(new Set());
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [duration, setDuration] = useState(15);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTourId, setGeneratedTourId] = useState<string | null>(null);

  const searchParams = useSearchParams();

  const locationId = searchParams.get("location_id");

  const router = useRouter();

  const toggleInterest = (id: string) => {
    const next = new Set(selectedInterests);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedInterests(next);
  };

  const startDisabled = selectedInterests.size === 0 || !locationId || isGenerating;

  const handleStart = async () => {
    if (!locationId) {
      alert("Missing location selection. Please go back and pick a place first.");
      return;
    }
    setIsGenerating(true);
    try {
      const response = await api.generateTour({
        location_id: locationId,
        interests: Array.from(selectedInterests),
        duration_minutes: duration,
        language: "en",
      });
      setGeneratedTourId(response.tour_id);
    } catch (err: any) {
      alert(err.message || "Failed to start tour generation");
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50/20">
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-16 space-y-24">
        {/* Interests */}
        <section>
          <div className="flex items-center justify-center gap-3 mb-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21C12 21 4 13.686 4 8.571 4 5.387 6.686 3 10 3c1.657 0 3.217.77 4 2  .783-1.23 2.343-2 4-2 3.314 0 6 2.387 6 5.571C20 13.686 12 21 12 21z" /></svg>
            <h2 className="text-3xl font-bold">What draws your curiosity?</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            {interests.map((i) => (
              <InterestCard key={i.id} {...i} selected={selectedInterests.has(i.id)} onToggle={toggleInterest} />
            ))}
          </div>
        </section>

        {/* Narrative Style */}
        <section>
          <div className="flex items-center justify-center gap-3 mb-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M5 3v12l5-5 5 5V3"/></svg>
            <h2 className="text-3xl font-bold">Choose your narrative style</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            {styles.map((s) => (
              <NarrativeCard key={s.id} {...s} selected={selectedStyle === s.id} onSelect={setSelectedStyle} />
            ))}
          </div>
        </section>

        {/* Pace */}
        <section className="text-center space-y-8">
          <div className="flex items-center justify-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 8v4l3 3"/></svg>
            <h2 className="text-3xl font-bold">Set your pace</h2>
          </div>
          <div className="text-6xl font-bold text-orange-500">{duration}</div>
          <input type="range" min={5} max={60} value={duration} onChange={(e)=>setDuration(Number(e.target.value))} className="w-full max-w-2xl mx-auto h-2 bg-gray-200 rounded-lg" />
          <div className="flex justify-between text-sm text-gray-500 max-w-2xl mx-auto">
            <span>Quick glimpse</span><span>Deep exploration</span>
          </div>
        </section>

        {/* Voice */}
        <section>
          <div className="flex items-center justify-center gap-3 mb-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M15 10l4 2v2l-4 2v4l-12-9 12-9v4z"/></svg>
            <h2 className="text-3xl font-bold">Select your guide's voice</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            {voices.map((v)=>(
              <VoiceCard key={v.id} {...v} selected={selectedVoice===v.id} onSelect={setSelectedVoice} />
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center pt-8">
          <Button
            disabled={startDisabled}
            variant={startDisabled ? "outline" : "primary"}
            className={startDisabled ? "bg-gray-200 text-gray-500 hover:none" : ""}
            onClick={handleStart}
          >
            {isGenerating ? "Starting..." : "Begin Your Journey"}
          </Button>
          {startDisabled && <p className="text-gray-500 mt-4 text-sm">Please select at least one interest to continue your adventure</p>}
        </section>

        {generatedTourId && (
          <section>
            <TourStatusTracker
              tourId={generatedTourId}
              onTourReady={(tour) => {
                setIsGenerating(false);
                if (tour.audio_url) {
                  router.push(`/tour/${tour.id}/play`);
                }
              }}
              onError={(err) => {
                alert(err);
                setIsGenerating(false);
              }}
            />
          </section>
        )}
      </main>
    </div>
  );
} 