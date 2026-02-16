'use client';

import { MIN_SEARCH_LENGTH } from '@/lib/constants/invite';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { useUserSearch } from '@/lib/hooks/use-search';
import { InviteItem, UserDetails } from '@/lib/types/api';
import { isValidEmail } from '@/lib/utils/email-validation';
import { toast } from '@/lib/utils/toast';
import { motion } from 'framer-motion';
import { ChevronRight, MailIcon, Search, Share2, Upload, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Skeleton } from '../ui/skeleton';
import { UserAvatar } from '../ui/user-avatar';

interface Step1SearchUsersProps {
  eventId: string;
  searchText: string;
  setSearchText: (text: string) => void;
  selectedEmails: Set<string>;
  selectedUsers: UserDetails[];
  toggleUser: (user: InviteItem) => void;
  onCSVClick: () => void;
  onNext: () => void;
}

export default function Step1SearchUsers({
  eventId,
  searchText,
  setSearchText,
  selectedEmails,
  selectedUsers,
  toggleUser,
  onCSVClick,
  onNext,
}: Step1SearchUsersProps) {
  // Search - use direct destructuring pattern (same as working search page)
  const { mutate: search, data: searchResults, isPending: isSearching, reset } = useUserSearch();
  const debouncedSearch = useDebounce(searchText, 400);
  const [inviteLink, setInviteLink] = useState('');
  const [canShareLink, setCanShareLink] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setInviteLink(`${window.location.origin}/e/${eventId}`);
    setCanShareLink(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, [eventId]);

  // Trigger search when debounced value changes
  useEffect(() => {
    const q = debouncedSearch.trim();
    if (q.length >= MIN_SEARCH_LENGTH) {
      search(q);
    } else {
      reset();
    }
  }, [debouncedSearch, search, reset]);

  // Check if search query is an email
  const isEmailQuery = (query: string) => {
    return isValidEmail(query);
  };

  const selectedCount = selectedEmails.size + selectedUsers.length;
  const showResults = searchText.trim().length >= MIN_SEARCH_LENGTH;
  const hasResults = searchResults && searchResults.length > 0;

  const handleShareInviteLink = async () => {
    if (!inviteLink) return;
    if (!navigator.share) {
      toast.info('Sharing is not available on this device');
      return;
    }

    try {
      await navigator.share({
        url: inviteLink,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      toast.error('Unable to share event link');
    }
  };

  const listToRender = useMemo(() => {
    const q = debouncedSearch.trim();

    // If no search, show selected users and emails
    if (q.length < MIN_SEARCH_LENGTH) {
      const selectedItems: InviteItem[] = [
        ...Array.from(selectedEmails).map((email) => ({
          id: `email-${email}`,
          username: email,
          name: 'Email invitation',
          email,
          isEmailInvite: true as const,
          bio: '',
          image: '',
          verification_status: null,
          bio_link: undefined,
          x_handle: undefined,
          instagram_handle: undefined,
          ln_address: undefined,
          nip05: undefined,
          verification_date: undefined,
        })),
        ...selectedUsers,
      ];
      return selectedItems;
    }

    // If searching, show search results + email option if applicable
    const users = Array.isArray(searchResults) ? (searchResults as UserDetails[]) : [];

    // Always show email option if query is email (whether selected or not)
    if (isEmailQuery(q)) {
      const emailOption: InviteItem = {
        id: `email-${q}`,
        username: q,
        name: 'Email invitation',
        email: q,
        isEmailInvite: true as const,
        bio: '',
        image: '',
        verification_status: null,
        bio_link: undefined,
        x_handle: undefined,
        instagram_handle: undefined,
        ln_address: undefined,
        nip05: undefined,
        verification_date: undefined,
      };
      return [emailOption, ...users];
    }

    return users;
  }, [searchResults, debouncedSearch, selectedEmails, selectedUsers]);

  return (
    <>
      <div className='px-4 pt-4'>
        <div className='w-full max-w-full overflow-hidden rounded-2xl border border-blue-200 bg-blue-50 p-3'>
          <div className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2'>
            <div className='min-w-0 overflow-hidden'>
              <p className='text-sm font-semibold text-blue-900'>Share event link</p>
              <p className='mt-0.5 text-xs text-blue-700'>Use your share menu to send this URL.</p>
              <p className='mt-2 truncate font-mono text-xs text-blue-900'>
                {inviteLink || `/e/${eventId}`}
              </p>
            </div>
            <motion.button
              type='button'
              onClick={handleShareInviteLink}
              whileTap={{ scale: 0.95 }}
              disabled={!canShareLink}
              aria-label='Share event link'
              className='inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-blue-300 bg-white text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50'
            >
              <Share2 className='h-4 w-4' />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className='mt-3 flex items-center gap-2 px-4'>
        <div className='relative flex-1'>
          <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
          <input
            className='w-full rounded-full bg-gray-100 py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-red-500'
            type='text'
            placeholder='Email or @username'
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <button
          onClick={onCSVClick}
          className='inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm hover:bg-gray-50'
          type='button'
        >
          <Upload className='h-4 w-4' /> CSV
        </button>
      </div>

      {/* Content */}
      <div className='mt-4 flex-1 overflow-y-auto px-4'>
        {!showResults ? (
          // Empty state - before searching (show selected or prompt)
          selectedCount > 0 ? (
            <div className='flex flex-col gap-2'>
              {listToRender.map((u) => {
                const isEmailInvite = 'isEmailInvite' in u && u.isEmailInvite;
                const email = isEmailInvite ? u.email : '';
                const isSelected = isEmailInvite
                  ? selectedEmails.has(email || '')
                  : selectedUsers.some((su) => su.id === u.id);
                return (
                  <button
                    key={u.id}
                    onClick={() => toggleUser(u)}
                    className='flex w-full items-center gap-3 rounded-3xl border border-gray-200 bg-gray-50 p-3 text-left transition-colors hover:bg-gray-100'
                  >
                    {'isEmailInvite' in u && u.isEmailInvite ? (
                      <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gray-100'>
                        <MailIcon size={16} />
                      </div>
                    ) : (
                      <UserAvatar
                        user={{
                          name: u.name,
                          username: u.username,
                          image: u.image,
                          verification_status: u?.verification_status,
                        }}
                        size='sm'
                      />
                    )}
                    <div className='min-w-0 flex-1'>
                      <div className='truncate text-sm font-medium text-gray-900'>
                        {'isEmailInvite' in u && u.isEmailInvite ? u.email : `@${u.username}`}
                      </div>
                      <div className='truncate text-xs text-gray-500'>
                        {'isEmailInvite' in u && u.isEmailInvite ? 'Email invitation' : u.name}
                      </div>
                    </div>
                    <span
                      aria-hidden
                      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                        isSelected ? 'border-black' : 'border-gray-400'
                      }`}
                    >
                      {isSelected ? <span className='h-2.5 w-2.5 rounded-full bg-black' /> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center py-16 text-center'>
              <div className='mb-4 rounded-2xl bg-gray-100 p-4'>
                <Users className='h-8 w-8 text-gray-400' />
              </div>
              <h3 className='mb-2 text-base font-semibold text-gray-900'>Find Evento Users</h3>
              <p className='text-sm text-gray-500'>Search by @username or import a CSV</p>
            </div>
          )
        ) : isSearching ? (
          // Loading state - skeleton cards
          <div className='flex flex-col gap-2'>
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className='flex items-center gap-3 rounded-3xl border border-gray-200 bg-gray-50 p-3'
              >
                <Skeleton className='h-10 w-10 rounded-full' />
                <div className='flex-1 space-y-2'>
                  <Skeleton className='h-4 w-32' />
                  <Skeleton className='h-3 w-24' />
                </div>
              </div>
            ))}
          </div>
        ) : !hasResults && !isEmailQuery(debouncedSearch.trim()) ? (
          // No results state
          <div className='flex flex-col items-center justify-center py-16 text-center'>
            <div className='mb-4 rounded-2xl bg-gray-100 p-4'>
              <Search className='h-8 w-8 text-gray-400' />
            </div>
            <h3 className='mb-2 text-base font-semibold text-gray-900'>No users found</h3>
            <p className='text-sm text-gray-500'>No users matching &quot;{searchText}&quot;</p>
          </div>
        ) : (
          // Results list
          <div className='flex flex-col gap-2'>
            {listToRender.map((u) => {
              const isEmailInvite = 'isEmailInvite' in u && u.isEmailInvite;
              const email = isEmailInvite ? u.email : '';
              const isSelected = isEmailInvite
                ? selectedEmails.has(email || '')
                : selectedUsers.some((su) => su.id === u.id);
              return (
                <button
                  key={u.id}
                  onClick={() => toggleUser(u)}
                  className='flex w-full items-center gap-3 rounded-3xl border border-gray-200 bg-gray-50 p-3 text-left transition-colors hover:bg-gray-100'
                >
                  {'isEmailInvite' in u && u.isEmailInvite ? (
                    <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gray-100'>
                      <MailIcon size={16} />
                    </div>
                  ) : (
                    <UserAvatar
                      user={{
                        name: u.name,
                        username: u.username,
                        image: u.image,
                        verification_status: u?.verification_status,
                      }}
                      size='sm'
                    />
                  )}
                  <div className='min-w-0 flex-1'>
                    <div className='truncate text-sm font-medium text-gray-900'>
                      {'isEmailInvite' in u && u.isEmailInvite ? u.email : `@${u.username}`}
                    </div>
                    <div className='truncate text-xs text-gray-500'>
                      {'isEmailInvite' in u && u.isEmailInvite ? 'Email invitation' : u.name}
                    </div>
                  </div>
                  <span
                    aria-hidden
                    className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                      isSelected ? 'border-black' : 'border-gray-400'
                    }`}
                  >
                    {isSelected ? <span className='h-2.5 w-2.5 rounded-full bg-black' /> : null}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className='mt-4 px-4 pb-8'>
        <button
          disabled={selectedCount === 0}
          onClick={onNext}
          className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white ${
            selectedCount === 0 ? 'bg-gray-300' : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          Next ({selectedCount}) <ChevronRight className='h-4 w-4' />
        </button>
      </div>
    </>
  );
}
