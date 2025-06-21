'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthButton } from '@/components/auth/AuthButton';
import { UserProfile } from '@/components/auth/UserProfile';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { Map, Mic, Navigation, Users } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">Walkumentary</h1>
          </div>
          <AuthButton />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {user ? (
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold mb-2">
                  Welcome back, {user.full_name || 'Explorer'}!
                </h2>
                <p className="text-muted-foreground">
                  Ready to discover amazing places with personalized audio tours?
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <Map className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg">Explore Locations</CardTitle>
                    <CardDescription>
                      Search for places or use GPS to find nearby attractions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Coming soon in Phase 1B
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <Mic className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg">AI Audio Tours</CardTitle>
                    <CardDescription>
                      Generate personalized tours with AI narration
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Coming soon in Phase 1D
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div>
              <UserProfile />
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Walkumentary
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Discover the world with personalized AI-powered audio tours
              </p>
              <AuthButton size="lg" />
            </div>

            <div className="grid gap-8 md:grid-cols-3 mt-16">
              <Card>
                <CardHeader>
                  <Map className="h-12 w-12 text-primary mx-auto mb-4" />
                  <CardTitle>Smart Location Discovery</CardTitle>
                  <CardDescription>
                    Search by text, use GPS, or snap a photo to identify landmarks instantly
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Mic className="h-12 w-12 text-primary mx-auto mb-4" />
                  <CardTitle>AI-Generated Tours</CardTitle>
                  <CardDescription>
                    Get personalized audio tours tailored to your interests and schedule
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                  <CardTitle>Personalized Experience</CardTitle>
                  <CardDescription>
                    Tours adapt to your preferences, language, and travel style
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}