"use client";

import { useState } from 'react';
import { api } from '@/lib/api';

export default function DebugPage() {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const envVars = {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_PLAYER_V2: process.env.NEXT_PUBLIC_PLAYER_V2,
    NEXT_PUBLIC_UI_V2: process.env.NEXT_PUBLIC_UI_V2,
  };

  const testApiConnection = async () => {
    setIsLoading(true);
    setTestResult('Testing API connection...');
    
    try {
      // Test health endpoint first
      if (process.env.NODE_ENV === 'development') {
        console.log('🧪 Testing health endpoint...');
      }
      const healthResult = await api.healthCheck();
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Health check result:', healthResult);
      }
      
      // Test location search
      if (process.env.NODE_ENV === 'development') {
        console.log('🧪 Testing location search...');
      }
      const searchUrl = '/locations/search?query=paris&limit=5';
      if (process.env.NODE_ENV === 'development') {
        console.log('🧪 Search URL:', searchUrl);
      }
      
      const searchResult = await api.get(searchUrl);
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Search result:', searchResult);
      }
      
      setTestResult(`✅ SUCCESS!\n\nHealth: ${JSON.stringify(healthResult, null, 2)}\n\nSearch: ${JSON.stringify(searchResult, null, 2)}`);
    } catch (error) {
      console.error('❌ API Test Error:', error);
      setTestResult(`❌ ERROR: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Environment Variables & API</h1>
      
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-4">Environment Variables</h2>
        <pre className="text-sm bg-white p-4 rounded border overflow-auto">
          {JSON.stringify(envVars, null, 2)}
        </pre>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-4">API Connection Test</h2>
        <button 
          onClick={testApiConnection}
          disabled={isLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Test API Connection'}
        </button>
        
        {testResult && (
          <pre className="text-sm bg-white p-4 rounded border mt-4 overflow-auto whitespace-pre-wrap">
            {testResult}
          </pre>
        )}
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-4">Runtime Information</h2>
        <p className="text-sm"><strong>Current Origin:</strong> {typeof window !== 'undefined' ? window.location.origin : 'SSR'}</p>
        <p className="text-sm"><strong>User Agent:</strong> {typeof window !== 'undefined' ? navigator.userAgent : 'SSR'}</p>
        <p className="text-sm"><strong>Build Time:</strong> {new Date().toISOString()}</p>
      </div>

      <div className="bg-green-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Console Instructions</h2>
        <p className="text-sm">
          1. Open browser DevTools (F12)<br/>
          2. Go to Console tab<br/>
          3. Click "Test API Connection" button above<br/>
          4. Look for console logs starting with 🧪, ✅, or ❌<br/>
          5. Check Network tab for actual HTTP requests
        </p>
      </div>
    </div>
  );
}