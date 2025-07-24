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
import { useProfileFormStore } from '@/lib/stores/profile-form-store';
import { useTopBar } from '@/lib/stores/topbar-store';
import {
  AtSign,
  Camera,
  ChevronRight,
  Hash,
  Instagram,
  Loader2,
  Type,
  User,
  Zap,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EditProfilePage() {
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const router = useRouter();
  const { setTopBarForRoute, applyRouteConfig, clearRoute } = useTopBar();
  const pathname = usePathname();
  const updateProfileMutation = useUpdateUserProfile();

  // Get user data
  const { user, isLoading } = useUserProfile();

  // Form store - use stable selector functions to prevent rerenders
  // Get just the methods from the store
  const { getFormData, hasChanges, isValid, populateFromUser, reset } = useProfileFormStore();

  // Get the form field values
  const username = useProfileFormStore((state) => state.username);
  const name = useProfileFormStore((state) => state.name);
  const bio = useProfileFormStore((state) => state.bio);
  const image = useProfileFormStore((state) => state.image);
  const bio_link = useProfileFormStore((state) => state.bio_link);
  const x_handle = useProfileFormStore((state) => state.x_handle);
  const instagram_handle = useProfileFormStore((state) => state.instagram_handle);
  const ln_address = useProfileFormStore((state) => state.ln_address);
  const nip05 = useProfileFormStore((state) => state.nip05);

  // Get the setter methods directly
  const setUsername = useProfileFormStore((state) => state.setUsername);
  const setName = useProfileFormStore((state) => state.setName);
  const setBio = useProfileFormStore((state) => state.setBio);
  const setImage = useProfileFormStore((state) => state.setImage);
  const setBioLink = useProfileFormStore((state) => state.setBioLink);
  const setXHandle = useProfileFormStore((state) => state.setXHandle);
  const setInstagramHandle = useProfileFormStore((state) => state.setInstagramHandle);
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

  // Set TopBar content
  useEffect(() => {
    // Apply any existing route configuration first
    applyRouteConfig(pathname);

    // Set route-specific configuration
    setTopBarForRoute(pathname, {
      title: 'Edit Profile',
      subtitle: undefined,
      onBackPress: () => router.push('/e/profile'),
      leftMode: 'back',
      buttons: [], // No save button as saving is handled in individual sheets
      showAvatar: false,
    });

    // Cleanup function to clear route config when leaving this page
    return () => {
      clearRoute(pathname);
    };
  }, [pathname, setTopBarForRoute, applyRouteConfig, clearRoute, router]);

  // Initialize form data from user profile
  useEffect(() => {
    if (user) {
      populateFromUser(user);
    }
  }, [user, populateFromUser]);

  if (isLoading || isCheckingAuth || updateProfileMutation.isPending) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='flex items-center gap-2'>
          <Loader2 className='h-6 w-6 animate-spin' />
          <span>
            {updateProfileMutation.isPending ? 'Saving profile...' : 'Loading profile...'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
        {/* Content */}
        <div className='flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4'>
          {/* Profile Image Module */}
          <div className='rounded-2xl bg-white p-4'>
            <button
              onClick={() => setShowProfileImageSheet(true)}
              className='flex w-full items-center gap-4 text-left'
            >
              <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100'>
                <Camera className='h-6 w-6 text-gray-600' />
              </div>
              <div className='flex-1'>
                <h3 className='font-semibold text-gray-900'>Profile Picture</h3>
                <p className='text-sm text-gray-500'>
                  {image ? 'Tap to change photo' : 'Add a profile photo'}
                </p>
              </div>
              <ChevronRight className='h-5 w-5 text-gray-400' />
            </button>
          </div>

          {/* Basic Info Module */}
          <div className='space-y-4 rounded-2xl bg-white p-4'>
            {/* Username */}
            <button
              onClick={() => setShowUsernameSheet(true)}
              className='flex w-full items-center gap-4 text-left'
            >
              <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100'>
                <AtSign className='h-6 w-6 text-blue-600' />
              </div>
              <div className='flex-1'>
                <h3 className='font-semibold text-gray-900'>Username</h3>
                <p className='text-sm text-gray-500'>{username || 'Choose a username'}</p>
              </div>
              <ChevronRight className='h-5 w-5 text-gray-400' />
            </button>

            {/* Name */}
            <button
              onClick={() => setShowNameSheet(true)}
              className='flex w-full items-center gap-4 text-left'
            >
              <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100'>
                <User className='h-6 w-6 text-blue-600' />
              </div>
              <div className='flex-1'>
                <h3 className='font-semibold text-gray-900'>Name</h3>
                <p className='text-sm text-gray-500'>{name || 'Add your name'}</p>
              </div>
              <ChevronRight className='h-5 w-5 text-gray-400' />
            </button>
          </div>

          {/* Social Links Module */}
          <div className='rounded-2xl bg-white p-4'>
            <button
              onClick={() => setShowSocialLinksSheet(true)}
              className='flex w-full items-center gap-4 text-left'
            >
              <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100'>
                <Instagram className='h-6 w-6 text-purple-600' />
              </div>
              <div className='flex-1'>
                <h3 className='font-semibold text-gray-900'>Social Links</h3>
                <p className='text-sm text-gray-500'>
                  {[instagram_handle && 'Instagram', x_handle && 'X', bio_link && 'Website']
                    .filter(Boolean)
                    .join(', ') || 'Add your social profiles'}
                </p>
              </div>
              <ChevronRight className='h-5 w-5 text-gray-400' />
            </button>
          </div>

          {/* Biography Module */}
          <div className='rounded-2xl bg-white p-4'>
            <button
              onClick={() => setShowBiographySheet(true)}
              className='flex w-full items-center gap-4 text-left'
            >
              <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-green-100'>
                <Type className='h-6 w-6 text-green-600' />
              </div>
              <div className='flex-1'>
                <h3 className='font-semibold text-gray-900'>Biography</h3>
                <p className='text-sm text-gray-500'>
                  {bio
                    ? bio.replace(/<[^>]*>/g, '').substring(0, 40) + '...'
                    : 'Tell us about yourself'}
                </p>
              </div>
              <ChevronRight className='h-5 w-5 text-gray-400' />
            </button>
          </div>

          {/* Bitcoin Module */}
          <div className='rounded-2xl bg-white p-4'>
            <button
              onClick={() => setShowLightningSheet(true)}
              className='flex w-full items-center gap-4 text-left'
            >
              <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100'>
                <Zap className='h-6 w-6 text-orange-600' />
              </div>
              <div className='flex-1'>
                <h3 className='font-semibold text-gray-900'>Bitcoin</h3>
                <p className='text-sm text-gray-500'>{ln_address || 'Add Lightning address'}</p>
              </div>
              <ChevronRight className='h-5 w-5 text-gray-400' />
            </button>
          </div>

          {/* Nostr Module */}
          <div className='rounded-2xl bg-white p-4'>
            <button
              onClick={() => setShowNostrSheet(true)}
              className='flex w-full items-center gap-4 text-left'
            >
              <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-pink-100'>
                <Hash className='h-6 w-6 text-pink-600' />
              </div>
              <div className='flex-1'>
                <h3 className='font-semibold text-gray-900'>Nostr</h3>
                <p className='text-sm text-gray-500'>{nip05 || 'Add Nostr identifier'}</p>
              </div>
              <ChevronRight className='h-5 w-5 text-gray-400' />
            </button>
          </div>
        </div>

        {/* Save button removed as saving is now handled in individual sheets */}
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
