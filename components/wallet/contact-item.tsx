'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEventoCashProfile } from '@/lib/hooks/use-evento-cash-profile';
import type { Contact } from '@/lib/types/wallet';
import { cn } from '@/lib/utils';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface ContactItemProps {
  contact: Contact;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contact: Contact) => void;
  onClick?: (contact: Contact) => void;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function ContactItem({ contact, onEdit, onDelete, onClick, className }: ContactItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Fetch profile for @evento.cash addresses
  const isEventoCashAddress = contact.paymentIdentifier.endsWith('@evento.cash');
  const { data: profile, isLoading: isProfileLoading } = useEventoCashProfile(
    isEventoCashAddress ? contact.paymentIdentifier : undefined
  );

  // Determine avatar source and display name
  const avatarSrc = profile?.avatar || undefined;
  const displayName = profile?.displayName || contact.name;
  const initials = getInitials(contact.name);

  const handleClick = () => {
    onClick?.(contact);
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
    <button
      className={cn(
        'w-full cursor-pointer rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-100',
        className
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className='flex items-center gap-3'>
        {/* Avatar */}
        <Avatar className='h-10 w-10 shrink-0'>
          <AvatarImage src={avatarSrc} alt={displayName} />
          <AvatarFallback className='bg-primary/10 text-sm font-medium text-primary'>
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Contact info */}
        <div className='min-w-0 flex-1'>
          <div className='flex items-start justify-between gap-2'>
            <div className='min-w-0 flex-1'>
              <p className='truncate font-medium text-gray-900'>
                {isProfileLoading ? contact.name : displayName}
              </p>
              <p className='truncate text-sm text-gray-500'>{contact.paymentIdentifier}</p>
            </div>

            {/* Action buttons - visible on hover */}
            {(onEdit || onDelete) && isHovered && (
              <div className='flex items-center gap-1'>
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
          </div>
        </div>
      </div>
    </button>
  );
}
