import Link from "next/link";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Header = () => {
  return (
    <header className="w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-gray-900">Walkumentary</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/features" className="text-gray-600 hover:text-gray-900 transition-colors">
            Features
          </Link>
          <Link href="/how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">
            How it Works
          </Link>
        </nav>

        {/* CTA */}
        <div className="hidden md:block">
          <Button variant="primary" size="sm">
            Get Started
          </Button>
        </div>
      </div>
    </header>
  );
}; 