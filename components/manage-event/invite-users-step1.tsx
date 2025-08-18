'use client';

import { useDebounce } from '@/lib/hooks/use-debounce';
import { useUserSearch } from '@/lib/hooks/use-search';
import { InviteItem, UserDetails } from '@/lib/types/api';
import { ChevronRight, Loader2, MailIcon, Search, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { UserAvatar } from '../ui/user-avatar';

interface Step1SearchUsersProps {
  searchText: string;
  setSearchText: (text: string) => void;
  selectedEmails: Set<string>;
  selectedUsers: UserDetails[];
  toggleUser: (user: InviteItem) => void;
  onCSVClick: () => void;
  onNext: () => void;
}

export default function Step1SearchUsers({
  searchText,
  setSearchText,
  selectedEmails,
  selectedUsers,
  toggleUser,
  onCSVClick,
  onNext,
}: Step1SearchUsersProps) {
  const router = useRouter();

  // Search
  const searchMutation = useUserSearch();
  const resetSearch = () => searchMutation.reset();
  const { mutate: searchUsers, data: searchResults, isPending: isSearching } = searchMutation;
  const debouncedSearch = useDebounce(searchText, 400);

  useEffect(() => {
    const q = debouncedSearch.trim();
    if (q.length >= 2) searchUsers(q);
    else resetSearch();
  }, [debouncedSearch, searchUsers]);

  // Check if search query is an email
  const isEmailQuery = (query: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query.trim());
  };

  const selectedCount = selectedEmails.size + selectedUsers.length;

  const listToRender = useMemo(() => {
    const q = debouncedSearch.trim();

    // If no search, show selected users and emails
    if (q.length < 2) {
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
      {/* Header */}
      <div className='px-4'>
        <div className='text-center'>
          <h2 className='text-xl font-semibold'>Invite Guests</h2>
          <p className='mt-1 text-sm text-gray-500'>Evento users and email addresses</p>
        </div>
        <div className='mt-4 flex items-center gap-2'>
          <div className='relative flex-1'>
            <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
            <input
              className='w-full rounded-full bg-gray-100 py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-red-500'
              type='text'
              placeholder='Search users by name or @username'
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
      </div>

      {/* Content */}
      <div className='mt-4 flex-1 overflow-y-auto px-4'>
        {isSearching ? (
          <div className='px-4 py-8 text-center text-sm text-gray-500'>
            <Loader2 className='mx-auto mb-2 h-5 w-5 animate-spin' /> Searching users...
          </div>
        ) : listToRender.length === 0 ? (
          <div className='rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center'>
            <p className='text-sm text-gray-500'>
              {debouncedSearch.trim()
                ? `No users found for "${debouncedSearch}"`
                : selectedCount > 0
                  ? `${selectedCount} user${selectedCount === 1 ? '' : 's'} selected`
                  : 'Search for users or import a CSV'}
            </p>
          </div>
        ) : (
          <div className='divide-y overflow-y-auto'>
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
                  className='flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50'
                >
                  <div className='flex min-w-0 items-center gap-3'>
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
                        onAvatarClick={() => {
                          if (u.username) router.push(`/${u.username}`);
                        }}
                        height={40}
                        width={40}
                      />
                    )}
                    <div className='min-w-0'>
                      <div className='flex items-center gap-1 truncate'>
                        <span className='truncate font-semibold text-gray-900'>
                          {'isEmailInvite' in u && u.isEmailInvite ? u.email : `@${u.username}`}
                        </span>
                      </div>
                      <div className='truncate text-sm text-gray-500'>
                        {'isEmailInvite' in u && u.isEmailInvite ? 'Email invitation' : u.name}
                      </div>
                    </div>
                  </div>
                  <div className='flex items-center justify-center'>
                    <span
                      aria-hidden
                      className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                        isSelected ? 'border-black' : 'border-gray-400'
                      }`}
                    >
                      {isSelected ? <span className='h-2.5 w-2.5 rounded-full bg-black' /> : null}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className='min-h-[8.5rem] border-t bg-white p-4'>
        <button
          disabled={selectedCount === 0}
          onClick={onNext}
          className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white ${
            selectedCount === 0 ? 'bg-gray-300' : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          <ChevronRight className='h-4 w-4' /> Next ({selectedCount})
        </button>
      </div>
    </>
  );
}
