"use client";

export default function DebugPage() {
  const envVars = {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_PLAYER_V2: process.env.NEXT_PUBLIC_PLAYER_V2,
    NEXT_PUBLIC_UI_V2: process.env.NEXT_PUBLIC_UI_V2,
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Environment Variables</h1>
      
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-4">Environment Variables</h2>
        <pre className="text-sm bg-white p-4 rounded border overflow-auto">
          {JSON.stringify(envVars, null, 2)}
        </pre>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-4">Expected Values</h2>
        <ul className="text-sm space-y-2">
          <li><strong>NEXT_PUBLIC_API_BASE_URL:</strong> https://walkumentary-backend.onrender.com</li>
          <li><strong>NODE_ENV:</strong> production</li>
          <li><strong>NEXT_PUBLIC_SUPABASE_URL:</strong> Should be your Supabase URL</li>
        </ul>
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Runtime Information</h2>
        <p className="text-sm"><strong>Current Origin:</strong> {typeof window !== 'undefined' ? window.location.origin : 'SSR'}</p>
        <p className="text-sm"><strong>User Agent:</strong> {typeof window !== 'undefined' ? navigator.userAgent : 'SSR'}</p>
        <p className="text-sm"><strong>Build Time:</strong> {new Date().toISOString()}</p>
      </div>
    </div>
  );
}