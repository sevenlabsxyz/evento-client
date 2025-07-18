'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useOnboardingActions, useOnboardingState } from '@/lib/stores/onboarding-store';
import { useAuth } from '@/lib/hooks/useAuth';
import { useUpdateUserProfile } from '@/lib/hooks/useUserProfile';
import { CheckCircle, Home, User, Settings, LoaderCircle } from 'lucide-react';

export function CompleteStep() {
  const router = useRouter();
  const { user } = useAuth();
  const { completeOnboarding } = useOnboardingActions();
  const { stepData } = useOnboardingState();
  const [isSaving, setIsSaving] = useState(false);
  const updateProfile = useUpdateUserProfile();

  const handleComplete = async () => {
    setIsSaving(true);
    
    try {
      // Update user profile with onboarding data
      await updateProfile.mutateAsync({
        name: stepData.name || user?.name,
        username: stepData.username || user?.username,
        bio: stepData.bio || user?.bio,
        bio_link: stepData.bio_link || user?.bio_link,
        x_handle: stepData.x_handle || user?.x_handle,
        instagram_handle: stepData.instagram_handle || user?.instagram_handle,
        ln_address: stepData.ln_address || user?.ln_address,
        nip05: stepData.nip05 || user?.nip05,
        image: stepData.image || user?.image,
      });

      // Complete onboarding
      completeOnboarding();
      
      // Redirect to home
      router.push('/');
    } catch (error) {
      console.error('Error saving profile:', error);
      // Still complete onboarding even if save fails
      completeOnboarding();
      router.push('/');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoToProfile = () => {
    completeOnboarding();
    router.push('/e/profile');
  };

  const handleGoToSettings = () => {
    completeOnboarding();
    router.push('/e/settings');
  };

  const initials = stepData.name ? stepData.name.split(' ').map(n => n[0]).join('').toUpperCase() : user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold">Welcome to Evento!</h1>
        <p className="text-muted-foreground text-lg">
          Your profile is all set up and ready to go. Let's explore what you can do.
        </p>
      </div>

      {/* Profile Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
          <CardDescription>
            Here's how your profile looks to others
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={stepData.image || user?.image} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div>
                <h3 className="font-semibold text-lg">{stepData.name || user?.name}</h3>
                <p className="text-muted-foreground">@{stepData.username || user?.username}</p>
              </div>
              {(stepData.bio || user?.bio) && (
                <p className="text-sm">{stepData.bio || user?.bio}</p>
              )}
              {stepData.interests && stepData.interests.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {stepData.interests.map((interest) => (
                    <Badge key={interest} variant="secondary" className="text-xs">
                      {interest}
                    </Badge>
                  ))}
                </div>
              )}
              {stepData.location && (
                <p className="text-sm text-muted-foreground">📍 {stepData.location}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>What's Next?</CardTitle>
          <CardDescription>
            Here are some things you can do to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={handleComplete}
            >
              <Home className="h-8 w-8" />
              <span className="font-medium">Explore Events</span>
              <span className="text-xs text-muted-foreground text-center">
                Discover events in your area
              </span>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={handleGoToProfile}
            >
              <User className="h-8 w-8" />
              <span className="font-medium">View Profile</span>
              <span className="text-xs text-muted-foreground text-center">
                See your complete profile
              </span>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={handleGoToSettings}
            >
              <Settings className="h-8 w-8" />
              <span className="font-medium">Settings</span>
              <span className="text-xs text-muted-foreground text-center">
                Customize your experience
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Action Button */}
      <div className="flex justify-center pt-6">
        <Button
          onClick={handleComplete}
          size="lg"
          className="w-full max-w-md"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
              Saving Profile...
            </>
          ) : (
            'Start Using Evento'
          )}
        </Button>
      </div>
    </div>
  );
}