'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useOnboardingActions } from '@/lib/stores/onboarding-store';
import { Calendar, Users, MapPin, Bell } from 'lucide-react';

export function WelcomeStep() {
  const { setCurrentStep, markStepCompleted } = useOnboardingActions();

  const handleNext = () => {
    markStepCompleted('welcome');
    setCurrentStep('profile');
  };

  const features = [
    {
      icon: Calendar,
      title: 'Create Events',
      description: 'Organize and manage your events with ease',
    },
    {
      icon: Users,
      title: 'Connect with People',
      description: 'Find and connect with like-minded individuals',
    },
    {
      icon: MapPin,
      title: 'Discover Local Events',
      description: 'Explore events happening in your area',
    },
    {
      icon: Bell,
      title: 'Stay Updated',
      description: 'Get notified about events and activities',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Welcome to Evento!</h1>
        <p className="text-muted-foreground text-lg">
          Let's set up your profile and get you started with the best event experience.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature) => (
          <Card key={feature.title} className="border-muted">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{feature.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center pt-6">
        <Button onClick={handleNext} size="lg" className="w-full max-w-md">
          Get Started
        </Button>
      </div>
    </div>
  );
}