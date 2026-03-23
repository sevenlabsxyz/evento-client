'use client';

import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { useContacts } from '@/lib/hooks/use-contacts';
import type { Contact } from '@/lib/types/wallet';
import { UserPlus, Users } from 'lucide-react';
import { type ReactNode, useMemo } from 'react';
import { ContactItem } from './contact-item';

interface ContactsListProps {
  onAddContact?: () => void;
  onEditContact?: (contact: Contact) => void;
  onDeleteContact?: (contact: Contact) => void;
  onContactClick?: (contact: Contact) => void;
  showAddButton?: boolean;
  maxContacts?: number;
  className?: string;
  renderContactRightContent?: (contact: Contact) => ReactNode;
}

export function ContactsList({
  onAddContact,
  onEditContact,
  onDeleteContact,
  onContactClick,
  showAddButton = true,
  maxContacts,
  className,
  renderContactRightContent,
}: ContactsListProps) {
  const { contacts, isLoading } = useContacts();

  // Sort contacts alphabetically by name
  const filteredContacts = useMemo(() => {
    return [...contacts].sort((a, b) => a.name.localeCompare(b.name));
  }, [contacts]);

  // Show loading skeleton during initial load
  if (isLoading) {
    return (
      <div className={className}>
        <div className='space-y-3'>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className='h-16 w-full' />
          ))}
        </div>
      </div>
    );
  }

  // Show empty state when no contacts (after loading)
  if (filteredContacts.length === 0) {
    return (
      <Empty className={className}>
        <EmptyHeader>
          <EmptyMedia variant='soft-circle'>
            <Users className='h-8 w-8' />
          </EmptyMedia>
          <EmptyTitle className='text-lg sm:text-lg'>No contacts yet</EmptyTitle>
          <EmptyDescription>
            Add contacts to quickly send payments to friends and family
          </EmptyDescription>
        </EmptyHeader>
        {showAddButton && onAddContact && (
          <EmptyContent>
            <Button onClick={onAddContact} className='h-11'>
              <UserPlus className='mr-2 h-4 w-4' />
              Add Contact
            </Button>
          </EmptyContent>
        )}
      </Empty>
    );
  }

  // Apply maxContacts limit if specified
  const displayedContacts = maxContacts ? filteredContacts.slice(0, maxContacts) : filteredContacts;

  return (
    <div className={className}>
      <div className='space-y-3'>
        {displayedContacts.map((contact) => (
          <ContactItem
            key={contact.id}
            contact={contact}
            onEdit={onEditContact}
            onDelete={onDeleteContact}
            onClick={onContactClick}
            rightContent={renderContactRightContent?.(contact)}
          />
        ))}
      </div>
    </div>
  );
}
