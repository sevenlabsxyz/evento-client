'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  AtSign,
  Camera,
  Instagram,
  X as XIcon,
  Globe,
  Hash,
  Zap,
  ChevronRight,
  Loader2,
  Type,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTopBar } from '@/lib/stores/topbar-store';
import { useProfileFormStore } from '@/lib/stores/profile-form-store';
import {
  useUserProfile,
  useUpdateUserProfile,
} from '@/lib/hooks/useUserProfile';
import { toast } from '@/lib/utils/toast';
import ProfileImageSheet from '@/components/profile-edit/profile-image-sheet';
import UsernameSheet from '@/components/profile-edit/username-sheet';
import NameSheet from '@/components/profile-edit/name-sheet';
import SocialLinksSheet from '@/components/profile-edit/social-links-sheet';
import BiographySheet from '@/components/profile-edit/biography-sheet';
import LightningAddressSheet from '@/components/profile-edit/lightning-address-sheet';
import NostrSheet from '@/components/profile-edit/nostr-sheet';
import { useRequireAuth } from '@/lib/hooks/useAuth';

export default function EditProfilePage() {
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const router = useRouter();
  const { setTopBar } = useTopBar();
  const updateProfileMutation = useUpdateUserProfile();

  // Get user data
  const { user, isLoading } = useUserProfile();

  // Get form state and actions
  const {
    username,
    name,
    bio,
    image,
    bio_link,
    x_handle,
    instagram_handle,
    ln_address,
    nip05,
    setUsername,
    setName,
    setBio,
    setImage,
    setBioLink,
    setXHandle,
    setInstagramHandle,
    setLnAddress,
    setNip05,
    populateFromUser,
    getFormData,
    isValid,
    hasChanges,
  } = useProfileFormStore();

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
    setTopBar({
      title: 'Edit Profile',
      subtitle: 'Update your information',
    });

    return () => {
      setTopBar({ rightContent: null });
    };
  }, [setTopBar]);

  // Populate form when user data is loaded
  useEffect(() => {
    if (user) {
      populateFromUser(user);
    }
  }, [user, populateFromUser]);

  const handleSaveChanges = async () => {
    try {
      const formData = getFormData();
      await updateProfileMutation.mutateAsync(formData);
      toast.success('Profile updated successfully');
      router.push('/e/profile');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  // Check if form is valid and has changes
  const canSave = isValid() && hasChanges();

  if (isLoading || isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="md:max-w-sm max-w-full mx-auto bg-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold">Edit Profile</h1>
        </div>
        <Button
          onClick={handleSaveChanges}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
          disabled={!canSave || updateProfileMutation.isPending}
        >
          {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">
        {/* Profile Image Module */}
        <div className="bg-white rounded-2xl p-4">
          <button
            onClick={() => setShowProfileImageSheet(true)}
            className="flex items-center gap-4 w-full text-left"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <Camera className="w-6 h-6 text-gray-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Profile Picture</h3>
              <p className="text-sm text-gray-500">
                {image ? 'Tap to change photo' : 'Add a profile photo'}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Basic Info Module */}
        <div className="bg-white rounded-2xl p-4 space-y-4">
          {/* Username */}
          <button
            onClick={() => setShowUsernameSheet(true)}
            className="flex items-center gap-4 w-full text-left"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <AtSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Username</h3>
              <p className="text-sm text-gray-500">
                {username || 'Choose a username'}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          {/* Name */}
          <button
            onClick={() => setShowNameSheet(true)}
            className="flex items-center gap-4 w-full text-left"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Name</h3>
              <p className="text-sm text-gray-500">{name || 'Add your name'}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Social Links Module */}
        <div className="bg-white rounded-2xl p-4">
          <button
            onClick={() => setShowSocialLinksSheet(true)}
            className="flex items-center gap-4 w-full text-left"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Instagram className="w-6 h-6 text-purple-600" />
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
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Biography Module */}
        <div className="bg-white rounded-2xl p-4">
          <button
            onClick={() => setShowBiographySheet(true)}
            className="flex items-center gap-4 w-full text-left"
          >
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Type className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Biography</h3>
              <p className="text-sm text-gray-500">
                {bio
                  ? bio.replace(/<[^>]*>/g, '').substring(0, 40) + '...'
                  : 'Tell us about yourself'}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Bitcoin Module */}
        <div className="bg-white rounded-2xl p-4">
          <button
            onClick={() => setShowLightningSheet(true)}
            className="flex items-center gap-4 w-full text-left"
          >
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Bitcoin</h3>
              <p className="text-sm text-gray-500">
                {ln_address || 'Add Lightning address'}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Nostr Module */}
        <div className="bg-white rounded-2xl p-4">
          <button
            onClick={() => setShowNostrSheet(true)}
            className="flex items-center gap-4 w-full text-left"
          >
            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
              <Hash className="w-6 h-6 text-pink-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Nostr</h3>
              <p className="text-sm text-gray-500">
                {nip05 || 'Add Nostr identifier'}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
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
    </div>
  );
}
