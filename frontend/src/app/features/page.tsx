"use client";

import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Search, Sparkles, Volume2, Headphones } from "lucide-react";
import Link from "next/link";

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-b from-orange-50 to-white py-20 text-center">
        <div className="max-w-6xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-orange-200 mb-8">
            <span className="text-orange-700 font-medium text-sm">WHERE STORIES COME ALIVE</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Discover the Soul<br />of <span className="text-orange-500">Every Place</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Transform your travels into immersive journeys of discovery. Let our AI-powered audio guides unveil the hidden stories, forgotten tales, and timeless charm of every destination.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/" className="flex-1 sm:flex-none">
              <Button variant="primary" className="px-8 py-4 rounded-xl font-medium text-lg w-full">
                Begin Your Journey
              </Button>
            </Link>
            <Button variant="outline" className="border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-medium text-lg">
              Watch Preview
            </Button>
          </div>
          {/* Audio Preview */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-amber-900 rounded-3xl p-12 text-white shadow-2xl">
              <div className="text-center">
                <Headphones className="w-16 h-16 mx-auto mb-6 text-white/90" />
                <h3 className="text-2xl font-bold mb-3">Immersive Audio Experience</h3>
                <p className="text-white/80 text-lg">Where every street tells a story</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-full border border-orange-200 mb-6">
              <span className="text-orange-700 font-medium text-sm">POWERED BY INNOVATION</span>
            </div>
            <h2 className="text-4xl font-bold mb-4">The Future of Travel<br />Storytelling</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Experience destinations through the lens of cutting-edge AI technology, designed to make every journey unforgettable.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Search className="w-8 h-8 text-orange-500" />}
              title="Intelligent Discovery"
              description="Find hidden gems through smart search, GPS detection, or AI-powered visual recognition"
            />
            <FeatureCard
              icon={<Sparkles className="w-8 h-8 text-orange-500" />}
              title="Personalized Narratives"
              description="Bespoke audio stories crafted by advanced AI, tailored to your interests and curiosity"
            />
            <FeatureCard
              icon={<Volume2 className="w-8 h-8 text-orange-500" />}
              title="Premium Audio Experience"
              description="Natural, expressive narration that brings every location to life with cinematic quality"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
} 