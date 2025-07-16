"use client";

import { Header } from "@/components/Header";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAudioPlayer } from "@/components/player/AudioPlayerProvider";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { EnhancedAudioPlayer } from "@/components/audio/EnhancedAudioPlayer";
import dynamic from "next/dynamic";
import { getTourCover } from "@/lib/artwork";

const SimpleTourMap = dynamic(
  () => import("@/components/map/SimpleTourMap"),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-gray-100 flex items-center justify-center rounded-xl">
        <div className="text-gray-500">Loading map...</div>
      </div>
    )
  }
);

export default function TourPlayerPage() {
  const { tourId } = useParams<{ tourId: string }>();
  const { loadTrack, isPlaying, togglePlay, currentTime, duration, seek } = useAudioPlayer();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [tour, setTour] = useState<any>(null);

  useEffect(() => {
    const fetchTour = async () => {
      try {
        console.log('Fetching tour with ID:', tourId);
        const t = await api.getTour(tourId);
        console.log('Tour fetched:', t);
        console.log('Tour location data:', t.location);
        console.log('Tour coordinates:', t.location?.latitude, t.location?.longitude);
        setTour(t);
        
        // Try to load audio, with fallback URL construction if audio_url is missing
        let audioUrl = t.audio_url;
        if (!audioUrl) {
          // Construct audio URL from tour ID as fallback using the API base URL
          const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://walkumentary-backend.onrender.com";
          audioUrl = `${baseUrl}/tours/${tourId}/audio`;
          console.log('No audio_url in tour data, trying constructed URL:', audioUrl);
        }
        
        const coverImage = getTourCover(t);
        console.log('Loading audio track:', audioUrl);
        console.log('Audio track details:', { src: audioUrl, title: t.title, cover: coverImage });
        
        // Test if audio URL is accessible (try HEAD first, fallback to GET)
        fetch(audioUrl, { method: 'HEAD' })
          .then(response => {
            if (response.status === 405) {
              // HEAD not supported, try GET with range header for minimal data
              return fetch(audioUrl, { 
                method: 'GET',
                headers: { 'Range': 'bytes=0-1' }
              });
            }
            return response;
          })
          .then(response => {
            // Audio endpoint is accessible
          })
          .catch(error => {
            console.error('Audio URL accessibility test failed:', error);
          });
        
        loadTrack({ src: audioUrl, title: t.title, cover: coverImage });
      } catch (e) {
        console.error('Failed to load tour:', e);
        alert("Failed to load tour");
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchTour();
  }, [tourId, loadTrack, router]);

  if (loading) return <p className="p-8 text-center">Loading…</p>;
  if (!tour) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-8 space-y-4 sm:space-y-6 lg:space-y-10">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold">{tour.title}</h1>
          <p className="text-gray-600 text-sm sm:text-base">
            {tour.description && tour.description !== "Tour content is being generated" 
              ? tour.description 
              : "AI-generated walking tour"}
          </p>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Interactive Map */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden lg:col-span-2 order-1 lg:order-1">
            <div className="h-[400px] sm:h-[450px] md:h-[500px] w-full">
              {tour && tour.location && tour.location.latitude && tour.location.longitude ? (
                <SimpleTourMap tour={tour} className="h-full w-full" />
              ) : (
                <div className="h-full w-full bg-gray-100 flex flex-col items-center justify-center">
                  <div className="text-gray-500 mb-2">Map loading error</div>
                  <div className="text-sm text-gray-400">
                    Tour: {tour ? '✓' : '✗'}, 
                    Location: {tour?.location ? '✓' : '✗'}, 
                    Coords: {tour?.location?.latitude ? '✓' : '✗'}/{tour?.location?.longitude ? '✓' : '✗'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Audio player */}
          <div className="space-y-4 sm:space-y-6 order-2 lg:order-2 flex-shrink-0">
            {process.env.NEXT_PUBLIC_PLAYER_V2 === "true" ? (
              <div className="w-full">
                <EnhancedAudioPlayer tour={tour} />
              </div>
            ) : (
              <div className="bg-orange-500 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
                <div className="relative w-full h-32 sm:h-40 mb-4 sm:mb-6 rounded-xl overflow-hidden"> 
                  <Image src={getTourCover(tour)} alt={tour.location?.name || tour.title} fill className="object-cover" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-center mb-2">{tour.title}</h3>
                <p className="text-orange-100 text-center text-xs sm:text-sm mb-6 sm:mb-8">Generated by Walkumentary AI</p>

                {/* Time labels */}
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)} {isNaN(duration) ? '(NaN)' : ''} {!isFinite(duration) ? '(∞)' : ''}</span>
                </div>

                {/* Progress slider */}
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={1}
                  value={currentTime}
                  onChange={(e) => seek(Number(e.target.value))}
                  className="w-full accent-white h-1 cursor-pointer"
                />

                {/* Controls */}
                <div className="flex items-center justify-center gap-6 mt-6">
                  <Button size="icon" variant="ghost" onClick={() => seek(Math.max(currentTime - 15, 0))}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-9-7 9-7v14zM22 19l-9-7 9-7v14z"/></svg>
                  </Button>
                  <Button size="icon" className="w-16 h-16 rounded-full bg-white text-orange-500" onClick={togglePlay}>
                    {isPlaying ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M5 3v18l15-9L5 3z"/></svg>
                    )}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => seek(Math.min(currentTime + 15, duration))}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 5l9 7-9 7V5z"/></svg>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function formatTime(t?: number) {
  if (!t || isNaN(t) || !isFinite(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
} 