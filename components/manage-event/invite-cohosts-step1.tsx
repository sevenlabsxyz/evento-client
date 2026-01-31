'use client';

import { MIN_SEARCH_LENGTH } from '@/lib/constants/invite';
import { useCancelCohostInvite, useEventCohostInvites } from '@/lib/hooks/use-cohost-invites';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { useUserSearch } from '@/lib/hooks/use-search';
import { UserDetails } from '@/lib/types/api';
import { isValidEmail } from '@/lib/utils/email-validation';
import { ChevronRight, Clock, MailIcon, Search, Users, X } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { Skeleton } from '../ui/skeleton';
import { UserAvatar } from '../ui/user-avatar';

type InviteItem = UserDetails | { id: string; email: string; isEmailInvite: true };

interface InviteCohostsStep1Props {
  eventId: string;
  searchText: string;
  setSearchText: (text: string) => void;
  selectedEmails: Set<string>;
  selectedUsers: UserDetails[];
  toggleUser: (user: InviteItem) => void;
  onNext: () => void;
}

export default function InviteCohostsStep1({
  eventId,
  searchText,
  setSearchText,
  selectedEmails,
  selectedUsers,
  toggleUser,
  onNext,
}: InviteCohostsStep1Props) {
  const { mutate: search, data: searchResults, isPending: isSearching, reset } = useUserSearch();
  const debouncedSearch = useDebounce(searchText, 400);

  const { data: pendingInvites = [] } = useEventCohostInvites(eventId, 'pending');
  const cancelInviteMutation = useCancelCohostInvite(eventId);

  useEffect(() => {
    const q = debouncedSearch.trim();
    if (q.length >= MIN_SEARCH_LENGTH) {
      search(q);
    } else {
      reset();
    }
  }, [debouncedSearch, search, reset]);

  const selectedCount = selectedEmails.size + selectedUsers.length;
  const showResults = searchText.trim().length >= MIN_SEARCH_LENGTH;
  const hasResults = searchResults && searchResults.length > 0;

  const listToRender = useMemo(() => {
    const q = debouncedSearch.trim();

    if (q.length < MIN_SEARCH_LENGTH) {
      const selectedItems: InviteItem[] = [
        ...Array.from(selectedEmails).map((email) => ({
          id: `email-${email}`,
          email,
          isEmailInvite: true as const,
        })),
        ...selectedUsers,
      ];
      return selectedItems;
    }

    const users = Array.isArray(searchResults) ? (searchResults as UserDetails[]) : [];

    if (isValidEmail(q)) {
      const emailOption: InviteItem = {
        id: `email-${q}`,
        email: q,
        isEmailInvite: true as const,
      };
      return [emailOption, ...users];
    }

    return users;
  }, [searchResults, debouncedSearch, selectedEmails, selectedUsers]);

  const renderUserRow = (u: InviteItem, isSelected: boolean) => {
    const isEmailInvite = 'isEmailInvite' in u && u.isEmailInvite;
    const displayEmail = isEmailInvite ? u.email : '';
    const displayName = isEmailInvite ? 'Email invitation' : (u as UserDetails).name;
    const displayIdentifier = isEmailInvite ? displayEmail : `@${(u as UserDetails).username}`;

    return (
      <button
        key={u.id}
        onClick={() => toggleUser(u)}
        className='flex w-full items-center gap-3 rounded-3xl border border-gray-200 bg-gray-50 p-3 text-left transition-colors hover:bg-gray-100'
      >
        {isEmailInvite ? (
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gray-100'>
            <MailIcon size={16} />
          </div>
        ) : (
          <UserAvatar
            user={{
              name: (u as UserDetails).name,
              username: (u as UserDetails).username,
              image: (u as UserDetails).image,
              verification_status: (u as UserDetails).verification_status,
            }}
            size='sm'
          />
        )}
        <div className='min-w-0 flex-1'>
          <div className='truncate text-sm font-medium text-gray-900'>{displayIdentifier}</div>
          <div className='truncate text-xs text-gray-500'>{displayName}</div>
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
  };

  return (
    <>
      <div className='flex items-center gap-2 px-4'>
        <div className='relative flex-1'>
          <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
          <input
            className='w-full rounded-full bg-gray-100 py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-red-500'
            type='text'
            placeholder='Search by @username or email'
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>

      {pendingInvites.length > 0 && !showResults && (
        <div className='mt-4 px-4'>
          <h3 className='mb-2 text-sm font-medium text-gray-500'>Pending Invites</h3>
          <div className='flex flex-col gap-2'>
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className='flex items-center gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-3'
              >
                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-amber-100'>
                  <Clock size={16} className='text-amber-600' />
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='truncate text-sm font-medium text-gray-900'>
                    {invite.invitee?.username
                      ? `@${invite.invitee.username}`
                      : invite.invitee_email}
                  </div>
                  <div className='truncate text-xs text-gray-500'>Pending cohost invite</div>
                </div>
                <button
                  onClick={() => cancelInviteMutation.mutate(invite.id)}
                  className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full hover:bg-amber-200'
                  disabled={cancelInviteMutation.isPending}
                >
                  <X className='h-4 w-4 text-gray-500' />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className='mt-4 flex-1 overflow-y-auto px-4'>
        {!showResults ? (
          selectedCount > 0 ? (
            <div className='flex flex-col gap-2'>
              {listToRender.map((u) => {
                const isEmailInvite = 'isEmailInvite' in u && u.isEmailInvite;
                const email = isEmailInvite ? u.email : '';
                const isSelected = isEmailInvite
                  ? selectedEmails.has(email)
                  : selectedUsers.some((su) => su.id === u.id);
                return renderUserRow(u, isSelected);
              })}
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center py-16 text-center'>
              <div className='mb-4 rounded-2xl bg-gray-100 p-4'>
                <Users className='h-8 w-8 text-gray-400' />
              </div>
              <h3 className='mb-2 text-base font-semibold text-gray-900'>Invite Cohosts</h3>
              <p className='text-sm text-gray-500'>Search by @username or enter an email</p>
            </div>
          )
        ) : isSearching ? (
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
        ) : !hasResults && !isValidEmail(debouncedSearch.trim()) ? (
          <div className='flex flex-col items-center justify-center py-16 text-center'>
            <div className='mb-4 rounded-2xl bg-gray-100 p-4'>
              <Search className='h-8 w-8 text-gray-400' />
            </div>
            <h3 className='mb-2 text-base font-semibold text-gray-900'>No users found</h3>
            <p className='text-sm text-gray-500'>No users matching &quot;{searchText}&quot;</p>
          </div>
        ) : (
          <div className='flex flex-col gap-2'>
            {listToRender.map((u) => {
              const isEmailInvite = 'isEmailInvite' in u && u.isEmailInvite;
              const email = isEmailInvite ? u.email : '';
              const isSelected = isEmailInvite
                ? selectedEmails.has(email)
                : selectedUsers.some((su) => su.id === u.id);
              return renderUserRow(u, isSelected);
            })}
          </div>
        )}
      </div>

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
