'use client';

import BiographySheet from '@/components/profile-edit/biography-sheet';
import LightningAddressSheet from '@/components/profile-edit/lightning-address-sheet';
import NameSheet from '@/components/profile-edit/name-sheet';
import NostrSheet from '@/components/profile-edit/nostr-sheet';
import ProfileImageSheet from '@/components/profile-edit/profile-image-sheet';
import SocialLinksSheet from '@/components/profile-edit/social-links-sheet';
import UsernameSheet from '@/components/profile-edit/username-sheet';
import { useRequireAuth } from '@/lib/hooks/useAuth';
import { useUpdateUserProfile, useUserProfile } from '@/lib/hooks/useUserProfile';
import { validateUpdateUserProfile } from '@/lib/schemas/user';
import { useProfileFormStore } from '@/lib/stores/profile-form-store';
import { useTopBar } from '@/lib/stores/topbar-store';
import { toast } from '@/lib/utils/toast';
import {
  AtSign,
  Camera,
  Check,
  ChevronRight,
  Hash,
  Instagram,
  Loader2,
  Type,
  User,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

export default function EditProfilePage() {
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const router = useRouter();
  const { setTopBar } = useTopBar();
  const updateProfileMutation = useUpdateUserProfile();

  // Get user data
  const { user, isLoading } = useUserProfile();

  // Form store - use stable selector functions to prevent rerenders
  // Get just the methods from the store
  const { getFormData, hasChanges, isValid, populateFromUser, reset } =
    useProfileFormStore();

  // Get the form field values
  const username = useProfileFormStore((state) => state.username);
  const name = useProfileFormStore((state) => state.name);
  const bio = useProfileFormStore((state) => state.bio);
  const image = useProfileFormStore((state) => state.image);
  const bio_link = useProfileFormStore((state) => state.bio_link);
  const x_handle = useProfileFormStore((state) => state.x_handle);
  const instagram_handle = useProfileFormStore(
    (state) => state.instagram_handle
  );
  const ln_address = useProfileFormStore((state) => state.ln_address);
  const nip05 = useProfileFormStore((state) => state.nip05);

  // Get the setter methods directly
  const setUsername = useProfileFormStore((state) => state.setUsername);
  const setName = useProfileFormStore((state) => state.setName);
  const setBio = useProfileFormStore((state) => state.setBio);
  const setImage = useProfileFormStore((state) => state.setImage);
  const setBioLink = useProfileFormStore((state) => state.setBioLink);
  const setXHandle = useProfileFormStore((state) => state.setXHandle);
  const setInstagramHandle = useProfileFormStore(
    (state) => state.setInstagramHandle
  );
  const setLnAddress = useProfileFormStore((state) => state.setLnAddress);
  const setNip05 = useProfileFormStore((state) => state.setNip05);

  // Sheet states
  const [showUsernameSheet, setShowUsernameSheet] = useState(false);
  const [showNameSheet, setShowNameSheet] = useState(false);
  const [showProfileImageSheet, setShowProfileImageSheet] = useState(false);
  const [showSocialLinksSheet, setShowSocialLinksSheet] = useState(false);
  const [showBiographySheet, setShowBiographySheet] = useState(false);
  const [showLightningSheet, setShowLightningSheet] = useState(false);
  const [showNostrSheet, setShowNostrSheet] = useState(false);

  // Check if form is valid and has changes
  // Include all form fields in dependencies so it updates when any field changes
  const canSave = useMemo(() => {
    return isValid() && hasChanges();
  }, [
    isValid,
    hasChanges,
    // Adding all form fields as dependencies to ensure reactivity
    username,
    name,
    bio,
    image,
    bio_link,
    x_handle,
    instagram_handle,
    ln_address,
    nip05,
  ]);

  // Handle save changes
  const handleSaveChanges = useCallback(async () => {
    try {
      const formData = getFormData();

      // Validate form data
      const validation = validateUpdateUserProfile(formData);
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid profile data');
        return;
      }

      await updateProfileMutation.mutateAsync(formData);
      toast.success('Profile updated successfully');
      reset();

      router.push('/e/profile');
    } catch (error) {
      toast.error('Failed to update profile');
      console.error('Profile update error:', error);
    }
  }, [getFormData, updateProfileMutation, router]);

  // Set TopBar content
  useEffect(() => {
    setTopBar({
      title: 'Edit Profile',
      subtitle: undefined,
      onBackPress: () => router.push('/e/profile'),
      leftMode: 'back',
      buttons: canSave
        ? [
            {
              id: 'save-profile',
              icon: Check,
              onClick: handleSaveChanges,
              label: 'Save',
              disabled: !canSave,
            },
          ]
        : [],
      showAvatar: false,
    });

    // Cleanup function to reset topbar state when leaving this page
    return () => {
      setTopBar({
        title: '',
        subtitle: '',
        onBackPress: null,
        leftMode: 'menu',
        showAvatar: true,
      });
    };
  }, [setTopBar, router]);

  // Initialize form data from user profile
  useEffect(() => {
    if (user) {
      populateFromUser(user);
    }
  }, [user, populateFromUser]);

  if (isLoading || isCheckingAuth || updateProfileMutation.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>
            {updateProfileMutation.isPending
              ? 'Saving profile...'
              : 'Loading profile...'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm">
        {/* Content */}
        <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4">
          {/* Profile Image Module */}
          <div className="rounded-2xl bg-white p-4">
            <button
              onClick={() => setShowProfileImageSheet(true)}
              className="flex w-full items-center gap-4 text-left"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
                <Camera className="h-6 w-6 text-gray-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Profile Picture</h3>
                <p className="text-sm text-gray-500">
                  {image ? 'Tap to change photo' : 'Add a profile photo'}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Basic Info Module */}
          <div className="space-y-4 rounded-2xl bg-white p-4">
            {/* Username */}
            <button
              onClick={() => setShowUsernameSheet(true)}
              className="flex w-full items-center gap-4 text-left"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                <AtSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Username</h3>
                <p className="text-sm text-gray-500">
                  {username || 'Choose a username'}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>

            {/* Name */}
            <button
              onClick={() => setShowNameSheet(true)}
              className="flex w-full items-center gap-4 text-left"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Name</h3>
                <p className="text-sm text-gray-500">
                  {name || 'Add your name'}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Social Links Module */}
          <div className="rounded-2xl bg-white p-4">
            <button
              onClick={() => setShowSocialLinksSheet(true)}
              className="flex w-full items-center gap-4 text-left"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                <Instagram className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Social Links</h3>
                <p className="text-sm text-gray-500">
                  {[
                    instagram_handle && 'Instagram',
                    x_handle && 'X',
                    bio_link && 'Website',
                  ]
                    .filter(Boolean)
                    .join(', ') || 'Add your social profiles'}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Biography Module */}
          <div className="rounded-2xl bg-white p-4">
            <button
              onClick={() => setShowBiographySheet(true)}
              className="flex w-full items-center gap-4 text-left"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                <Type className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Biography</h3>
                <p className="text-sm text-gray-500">
                  {bio
                    ? bio.replace(/<[^>]*>/g, '').substring(0, 40) + '...'
                    : 'Tell us about yourself'}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Bitcoin Module */}
          <div className="rounded-2xl bg-white p-4">
            <button
              onClick={() => setShowLightningSheet(true)}
              className="flex w-full items-center gap-4 text-left"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                <Zap className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Bitcoin</h3>
                <p className="text-sm text-gray-500">
                  {ln_address || 'Add Lightning address'}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Nostr Module */}
          <div className="rounded-2xl bg-white p-4">
            <button
              onClick={() => setShowNostrSheet(true)}
              className="flex w-full items-center gap-4 text-left"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-100">
                <Hash className="h-6 w-6 text-pink-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Nostr</h3>
                <p className="text-sm text-gray-500">
                  {nip05 || 'Add Nostr identifier'}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Save button for mobile */}
        <div className="sticky bottom-0 border-t border-gray-100 bg-white p-4 md:hidden">
          <button
            onClick={handleSaveChanges}
            disabled={!canSave || updateProfileMutation.isPending}
            className={`w-full rounded-xl py-3 text-center font-medium ${
              canSave && !updateProfileMutation.isPending
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            {updateProfileMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>

      {/* Sheet Components */}
      <ProfileImageSheet
        isOpen={showProfileImageSheet}
        onClose={() => setShowProfileImageSheet(false)}
        currentImage={image}
        userName={name}
        onImageUpdate={setImage}
      />

      <UsernameSheet
        isOpen={showUsernameSheet}
        onClose={() => setShowUsernameSheet(false)}
        onSave={setUsername}
        currentUsername={username}
      />

      <NameSheet
        isOpen={showNameSheet}
        onClose={() => setShowNameSheet(false)}
        onSave={setName}
        currentName={name}
      />

      <SocialLinksSheet
        isOpen={showSocialLinksSheet}
        onClose={() => setShowSocialLinksSheet(false)}
        onSave={(links) => {
          setInstagramHandle(links.instagram_handle);
          setXHandle(links.x_handle);
          setBioLink(links.bio_link);
        }}
        currentLinks={{
          instagram_handle,
          x_handle,
          bio_link,
        }}
      />

      <BiographySheet
        isOpen={showBiographySheet}
        onClose={() => setShowBiographySheet(false)}
        onSave={setBio}
        currentBio={bio}
      />

      <LightningAddressSheet
        isOpen={showLightningSheet}
        onClose={() => setShowLightningSheet(false)}
        onSave={setLnAddress}
        currentAddress={ln_address}
      />

      <NostrSheet
        isOpen={showNostrSheet}
        onClose={() => setShowNostrSheet(false)}
        onSave={setNip05}
        currentNip05={nip05}
      />
    </>
  );
}
