'use client';

import { useState } from 'react';
import { useAuthContext } from './AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api';
import { User, Settings } from 'lucide-react';

export function UserProfile() {
  const { user, refreshProfile } = useAuthContext();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    interests: user?.preferences?.interests?.join(', ') || '',
  });

  console.log('UserProfile render:', { user: !!user, userEmail: user?.email });

  if (!user) {
    console.log('UserProfile: no user, returning null');
    return null;
  }

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const interests = formData.interests
        .split(',')
        .map(interest => interest.trim())
        .filter(interest => interest.length > 0);

      await apiClient.updateUser({
        full_name: formData.full_name,
      });

      await apiClient.updateUserPreferences({
        interests,
      });

      await refreshProfile();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: user?.full_name || '',
      interests: user?.preferences?.interests?.join(', ') || '',
    });
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Manage your account settings</CardDescription>
            </div>
          </div>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Email</label>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>

        <div>
          <label className="text-sm font-medium">Full Name</label>
          {isEditing ? (
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="Enter your full name"
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {user.full_name || 'Not set'}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium">Interests</label>
          {isEditing ? (
            <Input
              value={formData.interests}
              onChange={(e) => setFormData(prev => ({ ...prev, interests: e.target.value }))}
              placeholder="Enter interests separated by commas"
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {user.preferences?.interests?.length > 0 
                ? user.preferences.interests.join(', ') 
                : 'None set'}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium">Language</label>
          <p className="text-sm text-muted-foreground">
            {user.preferences?.language || 'en'}
          </p>
        </div>

        <div>
          <label className="text-sm font-medium">Default Tour Duration</label>
          <p className="text-sm text-muted-foreground">
            {user.preferences?.default_tour_duration || 30} minutes
          </p>
        </div>

        {isEditing && (
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}