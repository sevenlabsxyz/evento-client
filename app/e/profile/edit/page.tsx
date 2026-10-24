'use client';

import { BadgesManagementSheet } from '@/components/badges/badges-management-sheet';
import BiographySheet from '@/components/profile-edit/biography-sheet';
import InterestsSheet from '@/components/profile-edit/interests-sheet';
import NameSheet from '@/components/profile-edit/name-sheet';
import NostrSheet from '@/components/profile-edit/nostr-sheet';
import ProfileImageSheet from '@/components/profile-edit/profile-image-sheet';
import PromptsSheet from '@/components/profile-edit/prompts-sheet';
import SocialLinksSheet from '@/components/profile-edit/social-links-sheet';
import UsernameSheet from '@/components/profile-edit/username-sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useRequireAuth } from '@/lib/hooks/use-auth';
import { useUserBadges } from '@/lib/hooks/use-badges';
import { useUpdateUserProfile, useUserProfile } from '@/lib/hooks/use-user-profile';
import { useProfileFormStore } from '@/lib/stores/profile-form-store';
import { useTopBar } from '@/lib/stores/topbar-store';
import {
  AtSign,
  Award,
  Camera,
  ChevronRight,
  Hash,
  Heart,
  Instagram,
  MessageSquare,
  Type,
  User,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EditProfilePage() {
  const t = useTranslations('profile');
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const router = useRouter();
  const { setTopBarForRoute, applyRouteConfig, clearRoute } = useTopBar();
  const pathname = usePathname();
  const updateProfileMutation = useUpdateUserProfile();

  // Get user data
  const { user, isLoading } = useUserProfile();

  // Get user badges
  const { data: userBadges = [] } = useUserBadges();
  const displayedBadgesCount = userBadges.filter((b) => b.display_order !== null).length;

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

  const nip05 = useProfileFormStore((state) => state.nip05);

  // Get the setter methods directly
  const setUsername = useProfileFormStore((state) => state.setUsername);
  const setName = useProfileFormStore((state) => state.setName);
  const setBio = useProfileFormStore((state) => state.setBio);
  const setImage = useProfileFormStore((state) => state.setImage);
  const setBioLink = useProfileFormStore((state) => state.setBioLink);
  const setXHandle = useProfileFormStore((state) => state.setXHandle);
  const setInstagramHandle = useProfileFormStore((state) => state.setInstagramHandle);

  const setNip05 = useProfileFormStore((state) => state.setNip05);

  // Sheet states
  const [showUsernameSheet, setShowUsernameSheet] = useState(false);
  const [showNameSheet, setShowNameSheet] = useState(false);
  const [showProfileImageSheet, setShowProfileImageSheet] = useState(false);
  const [showSocialLinksSheet, setShowSocialLinksSheet] = useState(false);
  const [showBiographySheet, setShowBiographySheet] = useState(false);

  const [showNostrSheet, setShowNostrSheet] = useState(false);
  const [showInterestsSheet, setShowInterestsSheet] = useState(false);
  const [showPromptsSheet, setShowPromptsSheet] = useState(false);
  const [showBadgesSheet, setShowBadgesSheet] = useState(false);

  // Set TopBar content
  useEffect(() => {
    // Apply any existing route configuration first
    applyRouteConfig(pathname);

    // Set route-specific configuration
    setTopBarForRoute(pathname, {
      title: t('own.editProfile'),
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
  }, [pathname, setTopBarForRoute, applyRouteConfig, clearRoute, router, t]);

  // Initialize form data from user profile
  useEffect(() => {
    if (user) {
      populateFromUser(user);
    }
  }, [user, populateFromUser]);

  if (isLoading || isCheckingAuth || updateProfileMutation.isPending || !user) {
    return (
      <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white dark:bg-neutral-900 md:max-w-sm'>
        <div className='flex-1 space-y-4 overflow-y-auto p-4'>
          {/* Profile Info Group: Profile Picture, Username, Name, Bio */}
          <div className='space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-800 dark:bg-neutral-950'>
            {/* Profile Picture */}
            <div className='flex w-full items-center gap-4'>
              <Skeleton className='h-12 w-12 rounded-xl' />
              <div className='flex-1'>
                <Skeleton className='mb-2 h-4 w-32' />
                <Skeleton className='h-3 w-40' />
              </div>
              <Skeleton className='h-5 w-5 rounded-md' />
            </div>

            {/* Username */}
            <div className='flex w-full items-center gap-4'>
              <Skeleton className='h-12 w-12 rounded-xl' />
              <div className='flex-1'>
                <Skeleton className='mb-2 h-4 w-28' />
                <Skeleton className='h-3 w-36' />
              </div>
              <Skeleton className='h-5 w-5 rounded-md' />
            </div>

            {/* Name */}
            <div className='flex w-full items-center gap-4'>
              <Skeleton className='h-12 w-12 rounded-xl' />
              <div className='flex-1'>
                <Skeleton className='mb-2 h-4 w-20' />
                <Skeleton className='h-3 w-32' />
              </div>
              <Skeleton className='h-5 w-5 rounded-md' />
            </div>

            {/* Biography */}
            <div className='flex w-full items-center gap-4'>
              <Skeleton className='h-12 w-12 rounded-xl' />
              <div className='flex-1'>
                <Skeleton className='mb-2 h-4 w-24' />
                <Skeleton className='h-3 w-56' />
              </div>
              <Skeleton className='h-5 w-5 rounded-md' />
            </div>
          </div>

          {/* Social Links Group: Social Links + Nostr */}
          <div className='space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-800 dark:bg-neutral-950'>
            {/* Social Links */}
            <div className='flex w-full items-center gap-4'>
              <Skeleton className='h-12 w-12 rounded-xl' />
              <div className='flex-1'>
                <Skeleton className='mb-2 h-4 w-28' />
                <Skeleton className='h-3 w-48' />
              </div>
              <Skeleton className='h-5 w-5 rounded-md' />
            </div>

            {/* Nostr */}
            <div className='flex w-full items-center gap-4'>
              <Skeleton className='h-12 w-12 rounded-xl' />
              <div className='flex-1'>
                <Skeleton className='mb-2 h-4 w-16' />
                <Skeleton className='h-3 w-36' />
              </div>
              <Skeleton className='h-5 w-5 rounded-md' />
            </div>
          </div>

          {/* Personality Group: Interests, Prompts, Badges */}
          <div className='space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-800 dark:bg-neutral-950'>
            {/* Interests */}
            <div className='flex w-full items-center gap-4'>
              <Skeleton className='h-12 w-12 rounded-xl' />
              <div className='flex-1'>
                <Skeleton className='mb-2 h-4 w-20' />
                <Skeleton className='h-3 w-32' />
              </div>
              <Skeleton className='h-5 w-5 rounded-md' />
            </div>

            {/* Prompts */}
            <div className='flex w-full items-center gap-4'>
              <Skeleton className='h-12 w-12 rounded-xl' />
              <div className='flex-1'>
                <Skeleton className='mb-2 h-4 w-16' />
                <Skeleton className='h-3 w-40' />
              </div>
              <Skeleton className='h-5 w-5 rounded-md' />
            </div>

            {/* Badges */}
            <div className='flex w-full items-center gap-4'>
              <Skeleton className='h-12 w-12 rounded-xl' />
              <div className='flex-1'>
                <Skeleton className='mb-2 h-4 w-16' />
                <Skeleton className='h-3 w-36' />
              </div>
              <Skeleton className='h-5 w-5 rounded-md' />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white dark:bg-neutral-900 md:max-w-sm'>
        {/* Content */}
        <div className='flex-1 space-y-4 overflow-y-auto p-4'>
          {/* Profile Info Group: Profile Picture, Username, Name, Bio */}
          <div className='space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-800 dark:bg-neutral-950'>
            {/* Profile Picture */}
            <button
              onClick={() => setShowProfileImageSheet(true)}
              className='flex w-full items-center gap-4 text-left'
            >
              <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-neutral-800'>
                <Camera className='h-6 w-6 text-gray-600 dark:text-neutral-400' />
              </div>
              <div className='flex-1'>
                <h3 className='font-semibold text-gray-900 dark:text-neutral-100'>
                  {t('editPage.picture')}
                </h3>
                <p className='text-sm text-gray-500 dark:text-neutral-400'>
                  {image ? t('editPage.changePhoto') : t('editPage.addPhoto')}
                </p>
              </div>
              <ChevronRight className='h-5 w-5 text-gray-400 dark:text-neutral-500' />
            </button>

            {/* Username */}
            <button
              onClick={() => setShowUsernameSheet(true)}
              className='flex w-full items-center gap-4 text-left'
            >
              <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/60'>
                <AtSign className='h-6 w-6 text-blue-600 dark:text-blue-400' />
              </div>
              <div className='flex-1'>
                <h3 className='font-semibold text-gray-900 dark:text-neutral-100'>
                  {t('edit.username.title')}
                </h3>
                <p className='text-sm text-gray-500 dark:text-neutral-400'>
                  {username || t('editPage.chooseUsername')}
                </p>
              </div>
              <ChevronRight className='h-5 w-5 text-gray-400 dark:text-neutral-500' />
            </button>

            {/* Name */}
            <button
              onClick={() => setShowNameSheet(true)}
              className='flex w-full items-center gap-4 text-left'
            >
              <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/60'>
                <User className='h-6 w-6 text-blue-600 dark:text-blue-400' />
              </div>
              <div className='flex-1'>
                <h3 className='font-semibold text-gray-900 dark:text-neutral-100'>
                  {t('edit.name.title')}
                </h3>
                <p className='text-sm text-gray-500 dark:text-neutral-400'>
                  {name || t('editPage.addName')}
                </p>
              </div>
              <ChevronRight className='h-5 w-5 text-gray-400 dark:text-neutral-500' />
            </button>

            {/* Biography */}
            <button
              onClick={() => setShowBiographySheet(true)}
              className='flex w-full items-center gap-4 text-left'
            >
              <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-950/60'>
                <Type className='h-6 w-6 text-green-600 dark:text-green-400' />
              </div>
              <div className='flex-1'>
                <h3 className='font-semibold text-gray-900 dark:text-neutral-100'>
                  {t('edit.bio.title')}
                </h3>
                <p className='text-sm text-gray-500 dark:text-neutral-400'>
                  {bio
                    ? bio.replace(/<[^>]*>/g, '').substring(0, 40) + '...'
                    : t('editPage.bioEmpty')}
                </p>
              </div>
              <ChevronRight className='h-5 w-5 text-gray-400 dark:text-neutral-500' />
            </button>
          </div>

          {/* Social Links Group: Social Links + Nostr */}
          <div className='space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-800 dark:bg-neutral-950'>
            {/* Social Links */}
            <button
              onClick={() => setShowSocialLinksSheet(true)}
              className='flex w-full items-center gap-4 text-left'
            >
              <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950/60'>
                <Instagram className='h-6 w-6 text-purple-600 dark:text-purple-400' />
              </div>
              <div className='flex-1'>
                <h3 className='font-semibold text-gray-900 dark:text-neutral-100'>
                  {t('edit.social.title')}
                </h3>
                <p className='text-sm text-gray-500 dark:text-neutral-400'>
                  {[
                    instagram_handle && 'Instagram',
                    x_handle && 'X',
                    bio_link && t('sheets.website.title'),
                  ]
                    .filter(Boolean)
                    .join(', ') || t('editPage.addSocial')}
                </p>
              </div>
              <ChevronRight className='h-5 w-5 text-gray-400 dark:text-neutral-500' />
            </button>

            {/* Nostr */}
            <button
              onClick={() => setShowNostrSheet(true)}
              className='flex w-full items-center gap-4 text-left'
            >
              <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-pink-100 dark:bg-pink-950/60'>
                <Hash className='h-6 w-6 text-pink-600 dark:text-pink-400' />
              </div>
              <div className='flex-1'>
                <h3 className='font-semibold text-gray-900 dark:text-neutral-100'>Nostr</h3>
                <p className='text-sm text-gray-500 dark:text-neutral-400'>
                  {nip05 || t('editPage.addNostr')}
                </p>
              </div>
              <ChevronRight className='h-5 w-5 text-gray-400 dark:text-neutral-500' />
            </button>
          </div>

          {/* Personality Group: Interests, Prompts, Badges */}
          <div className='space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-800 dark:bg-neutral-950'>
            {/* Interests */}
            <button
              onClick={() => setShowInterestsSheet(true)}
              className='flex w-full items-center gap-4 text-left'
            >
              <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-950/60'>
                <Heart className='h-6 w-6 text-teal-600 dark:text-teal-400' />
              </div>
              <div className='flex-1'>
                <h3 className='font-semibold text-gray-900 dark:text-neutral-100'>
                  {t('interests')}
                </h3>
                <p className='text-sm text-gray-500 dark:text-neutral-400'>
                  {t('editPage.interestsHint')}
                </p>
              </div>
              <ChevronRight className='h-5 w-5 text-gray-400 dark:text-neutral-500' />
            </button>

            {/* Prompts */}
            <button
              onClick={() => setShowPromptsSheet(true)}
              className='flex w-full items-center gap-4 text-left'
            >
              <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950/60'>
                <MessageSquare className='h-6 w-6 text-indigo-600 dark:text-indigo-400' />
              </div>
              <div className='flex-1'>
                <h3 className='font-semibold text-gray-900 dark:text-neutral-100'>
                  {t('edit.prompts.title')}
                </h3>
                <p className='text-sm text-gray-500 dark:text-neutral-400'>
                  {t('editPage.promptsHint')}
                </p>
              </div>
              <ChevronRight className='h-5 w-5 text-gray-400 dark:text-neutral-500' />
            </button>

            {/* Badges */}
            <button
              onClick={() => setShowBadgesSheet(true)}
              className='flex w-full items-center gap-4 text-left'
            >
              <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/60'>
                <Award className='h-6 w-6 text-amber-600 dark:text-amber-400' />
              </div>
              <div className='flex-1'>
                <h3 className='font-semibold text-gray-900 dark:text-neutral-100'>
                  {t('badges.title')}
                </h3>
                <p className='text-sm text-gray-500 dark:text-neutral-400'>
                  {displayedBadgesCount > 0
                    ? t('editPage.badgesOnDisplay', { count: displayedBadgesCount })
                    : t('editPage.badgesHint')}
                </p>
              </div>
              <ChevronRight className='h-5 w-5 text-gray-400 dark:text-neutral-500' />
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

      <InterestsSheet isOpen={showInterestsSheet} onClose={() => setShowInterestsSheet(false)} />

      <PromptsSheet isOpen={showPromptsSheet} onClose={() => setShowPromptsSheet(false)} />

      <NostrSheet
        isOpen={showNostrSheet}
        onClose={() => setShowNostrSheet(false)}
        onSave={setNip05}
        currentNip05={nip05}
      />

      <BadgesManagementSheet isOpen={showBadgesSheet} onClose={() => setShowBadgesSheet(false)} />
    </>
  );
}
