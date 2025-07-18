'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOnboardingActions, useOnboardingState } from '@/lib/stores/onboarding-store';
import { ArrowLeft, ArrowRight, Twitter, Instagram, Link2, Zap, AtSign } from 'lucide-react';

const socialSchema = z.object({
  bio_link: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  x_handle: z.string().max(15, 'X handle must be less than 15 characters').optional(),
  instagram_handle: z.string().max(30, 'Instagram handle must be less than 30 characters').optional(),
  ln_address: z.string().email('Must be a valid lightning address').optional().or(z.literal('')),
  nip05: z.string().email('Must be a valid NIP-05 identifier').optional().or(z.literal('')),
});

type SocialFormData = z.infer<typeof socialSchema>;

export function SocialStep() {
  const { setCurrentStep, markStepCompleted, updateStepData } = useOnboardingActions();
  const { stepData } = useOnboardingState();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SocialFormData>({
    resolver: zodResolver(socialSchema),
    defaultValues: {
      bio_link: stepData.bio_link || '',
      x_handle: stepData.x_handle || '',
      instagram_handle: stepData.instagram_handle || '',
      ln_address: stepData.ln_address || '',
      nip05: stepData.nip05 || '',
    },
    mode: 'onChange',
  });

  const handleBack = () => {
    setCurrentStep('profile');
  };

  const handleNext = (data: SocialFormData) => {
    updateStepData(data);
    markStepCompleted('social');
    setCurrentStep('preferences');
  };

  const handleSkip = () => {
    markStepCompleted('social');
    setCurrentStep('preferences');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Connect your social profiles</h1>
        <p className="text-muted-foreground">
          Link your social media accounts and web3 identities to help others find you.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Social Links</CardTitle>
          <CardDescription>
            All fields are optional. You can always add these later in your profile settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleNext)} className="space-y-6">
            {/* Website/Bio Link */}
            <div className="space-y-2">
              <Label htmlFor="bio_link" className="flex items-center space-x-2">
                <Link2 className="h-4 w-4" />
                <span>Website or Bio Link</span>
              </Label>
              <Input
                id="bio_link"
                {...register('bio_link')}
                placeholder="https://yourwebsite.com"
              />
              {errors.bio_link && (
                <p className="text-sm text-destructive">{errors.bio_link.message}</p>
              )}
            </div>

            {/* X (Twitter) Handle */}
            <div className="space-y-2">
              <Label htmlFor="x_handle" className="flex items-center space-x-2">
                <Twitter className="h-4 w-4" />
                <span>X (Twitter) Handle</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  @
                </span>
                <Input
                  id="x_handle"
                  {...register('x_handle')}
                  placeholder="username"
                  className="pl-8"
                />
              </div>
              {errors.x_handle && (
                <p className="text-sm text-destructive">{errors.x_handle.message}</p>
              )}
            </div>

            {/* Instagram Handle */}
            <div className="space-y-2">
              <Label htmlFor="instagram_handle" className="flex items-center space-x-2">
                <Instagram className="h-4 w-4" />
                <span>Instagram Handle</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  @
                </span>
                <Input
                  id="instagram_handle"
                  {...register('instagram_handle')}
                  placeholder="username"
                  className="pl-8"
                />
              </div>
              {errors.instagram_handle && (
                <p className="text-sm text-destructive">{errors.instagram_handle.message}</p>
              )}
            </div>

            {/* Lightning Address */}
            <div className="space-y-2">
              <Label htmlFor="ln_address" className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>Lightning Address</span>
              </Label>
              <Input
                id="ln_address"
                {...register('ln_address')}
                placeholder="username@getalby.com"
              />
              {errors.ln_address && (
                <p className="text-sm text-destructive">{errors.ln_address.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Your Bitcoin Lightning address for receiving payments
              </p>
            </div>

            {/* NIP-05 */}
            <div className="space-y-2">
              <Label htmlFor="nip05" className="flex items-center space-x-2">
                <AtSign className="h-4 w-4" />
                <span>NIP-05 Identifier</span>
              </Label>
              <Input
                id="nip05"
                {...register('nip05')}
                placeholder="username@nostr.com"
              />
              {errors.nip05 && (
                <p className="text-sm text-destructive">{errors.nip05.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Your Nostr verification identifier
              </p>
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