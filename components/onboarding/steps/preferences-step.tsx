'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useOnboardingActions, useOnboardingState } from '@/lib/stores/onboarding-store';
import { ArrowLeft, ArrowRight, MapPin, Clock, X, Plus } from 'lucide-react';

const preferencesSchema = z.object({
  location: z.string().max(100, 'Location must be less than 100 characters').optional(),
  timezone: z.string().optional(),
  interests: z.array(z.string()).optional(),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

const suggestedInterests = [
  'Music', 'Art', 'Technology', 'Sports', 'Food & Drink', 'Business', 'Gaming',
  'Fashion', 'Health & Fitness', 'Travel', 'Photography', 'Books', 'Movies',
  'Outdoors', 'Cryptocurrency', 'Design', 'Entrepreneurship', 'Networking'
];

export function PreferencesStep() {
  const { setCurrentStep, markStepCompleted, updateStepData } = useOnboardingActions();
  const { stepData } = useOnboardingState();
  const [selectedInterests, setSelectedInterests] = useState<string[]>(stepData.interests || []);
  const [customInterest, setCustomInterest] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      location: stepData.location || '',
      timezone: stepData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      interests: stepData.interests || [],
    },
    mode: 'onChange',
  });

  const handleBack = () => {
    setCurrentStep('social');
  };

  const handleNext = (data: PreferencesFormData) => {
    updateStepData({ ...data, interests: selectedInterests });
    markStepCompleted('preferences');
    setCurrentStep('complete');
  };

  const handleSkip = () => {
    markStepCompleted('preferences');
    setCurrentStep('complete');
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const addCustomInterest = () => {
    if (customInterest.trim() && !selectedInterests.includes(customInterest.trim())) {
      setSelectedInterests(prev => [...prev, customInterest.trim()]);
      setCustomInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    setSelectedInterests(prev => prev.filter(i => i !== interest));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Set your preferences</h1>
        <p className="text-muted-foreground">
          Help us personalize your experience by telling us about your interests and location.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Preferences</CardTitle>
          <CardDescription>
            This information helps us show you more relevant events and content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleNext)} className="space-y-6">
            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Location</span>
              </Label>
              <Input
                id="location"
                {...register('location')}
                placeholder="City, Country"
              />
              {errors.location && (
                <p className="text-sm text-destructive">{errors.location.message}</p>
              )}
            </div>

            {/* Timezone */}
            <div className="space-y-2">
              <Label htmlFor="timezone" className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Timezone</span>
              </Label>
              <Input
                id="timezone"
                {...register('timezone')}
                placeholder="Auto-detected"
                readOnly
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                We've auto-detected your timezone. Events will be shown in your local time.
              </p>
            </div>

            {/* Interests */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Interests</Label>
              <p className="text-sm text-muted-foreground">
                Select topics you're interested in to get personalized event recommendations.
              </p>
              
              {/* Selected Interests */}
              {selectedInterests.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedInterests.map((interest) => (
                    <Badge key={interest} variant="secondary" className="px-3 py-1">
                      {interest}
                      <button
                        type="button"
                        onClick={() => removeInterest(interest)}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Suggested Interests */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Suggested interests:</Label>
                <div className="flex flex-wrap gap-2">
                  {suggestedInterests.map((interest) => (
                    <Badge
                      key={interest}
                      variant={selectedInterests.includes(interest) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => toggleInterest(interest)}
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Custom Interest */}
              <div className="flex space-x-2">
                <Input
                  value={customInterest}
                  onChange={(e) => setCustomInterest(e.target.value)}
                  placeholder="Add custom interest"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomInterest())}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addCustomInterest}
                  disabled={!customInterest.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex space-x-2">
                <Button type="button" variant="ghost" onClick={handleSkip}>
                  Skip
                </Button>
                <Button type="submit">
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}