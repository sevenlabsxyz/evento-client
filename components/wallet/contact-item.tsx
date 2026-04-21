'use client';

import { UserAvatar } from '@/components/ui/user-avatar';
import { useEventoCashProfile } from '@/lib/hooks/use-evento-cash-profile';
import { ChevronRight, Pencil, Trash2 } from '@/lib/icons';
import type { Contact } from '@/lib/types/wallet';
import { cn } from '@/lib/utils';
import { type KeyboardEvent, type ReactNode, useState } from 'react';

interface ContactItemProps {
  contact: Contact;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contact: Contact) => void;
  onClick?: (contact: Contact) => void;
  className?: string;
  rightContent?: ReactNode;
}

export function ContactItem({
  contact,
  onEdit,
  onDelete,
  onClick,
  className,
  rightContent,
}: ContactItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Fetch profile for @evento.cash addresses
  const isEventoCashAddress = contact.paymentIdentifier.endsWith('@evento.cash');
  const { data: profile, isLoading: isProfileLoading } = useEventoCashProfile(
    isEventoCashAddress ? contact.paymentIdentifier : undefined
  );

  // Determine avatar source and display name
  const avatarSrc = isEventoCashAddress ? profile?.avatar : undefined;
  const displayName = profile?.displayName || contact.name;

  const handleClick = () => {
    onClick?.(contact);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick(contact);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(contact);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(contact);
  };

  return (
    <div
      className={cn(
        'w-full cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-100',
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className='grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3'>
        {/* Avatar */}
        <UserAvatar
          user={{
            name: displayName,
            image: avatarSrc,
          }}
          height={40}
          width={40}
          className='shrink-0'
        />

        {/* Contact info */}
        <div className='min-w-0 flex-1 overflow-hidden'>
          <p className='block w-full truncate font-medium text-gray-900'>
            {isProfileLoading ? contact.name : displayName}
          </p>
          <p className='block w-full truncate text-sm text-gray-500'>{contact.paymentIdentifier}</p>
        </div>

        {/* Action buttons - visible on hover */}
        {rightContent ? (
          <div className='flex shrink-0 items-center gap-1.5 pl-1'>{rightContent}</div>
        ) : (
          <div className='flex shrink-0 items-center gap-1 pl-1'>
            {(onEdit || onDelete) && isHovered && (
              <div className='flex shrink-0 items-center gap-1'>
                {onEdit && (
                  <button
                    onClick={handleEdit}
                    className='rounded p-1.5 text-gray-500 transition-colors hover:bg-gray-200'
                    aria-label='Edit contact'
                    title='Edit'
                  >
                    <Pencil className='h-4 w-4' />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={handleDelete}
                    className='rounded p-1.5 text-gray-500 transition-colors hover:bg-gray-200 hover:text-red-500'
                    aria-label='Delete contact'
                    title='Delete'
                  >
                    <Trash2 className='h-4 w-4' />
                  </button>
                )}
              </div>
            )}
            <ChevronRight className='h-5 w-5 flex-shrink-0 text-gray-400' />
          </div>
        )}
      </div>
    </div>
  );
}
