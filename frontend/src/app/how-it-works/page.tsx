import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MapPin, Headphones, Route, Sparkles } from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            How It Works
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform any location into an immersive audio journey in just a few simple steps
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-16">
          {/* Step 1 */}
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">1</span>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">Choose Your Destination</h2>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">
                Search for any location worldwide or let us detect your current position. 
                From famous landmarks to hidden local gems, Walkumentary can create tours anywhere.
              </p>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">2</span>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">Customize Your Experience</h2>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">
                Select your interests, set your preferred tour duration, and choose your pace. 
                Our AI will craft a personalized journey that matches your preferences perfectly.
              </p>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">3</span>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">AI Generates Your Route</h2>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">
                Our advanced AI analyzes your preferences and creates an optimal walking route 
                with fascinating stories, historical facts, and local insights along the way.
              </p>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Route className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">4</span>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">Start Your Audio Journey</h2>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">
                Put on your headphones and begin exploring. The audio guide will automatically 
                sync with your location, revealing stories and insights as you walk.
              </p>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <Headphones className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16 pt-16 border-t border-gray-200">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Explore?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Start your first audio walking tour today and discover the world around you
          </p>
          <Link href="/customize">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600">
              Begin Your Journey
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}