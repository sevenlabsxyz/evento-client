'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { useContacts } from '@/lib/hooks/use-contacts';
import { useEventoCashProfile } from '@/lib/hooks/use-evento-cash-profile';
import type { Contact } from '@/lib/types/wallet';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
import { useMemo, useState } from 'react';

interface ContactAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (lightningAddress: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Individual contact item in the autocomplete dropdown
 * Fetches profile data for @evento.cash addresses
 */
function ContactAutocompleteItem({
  contact,
  onSelect,
}: {
  contact: Contact;
  onSelect: () => void;
}) {
  // Fetch profile for @evento.cash addresses
  const isEventoCashAddress = contact.paymentIdentifier.endsWith('@evento.cash');
  const { data: profile } = useEventoCashProfile(
    isEventoCashAddress ? contact.paymentIdentifier : undefined
  );

  const avatarSrc = profile?.avatar || undefined;
  const displayName = profile?.displayName || contact.name;
  const initials = getInitials(contact.name);

  return (
    <CommandItem
      value={`${contact.name} ${contact.paymentIdentifier}`}
      onSelect={onSelect}
      className='flex items-center gap-3 px-3 py-2'
    >
      <Avatar className='h-8 w-8 shrink-0'>
        <AvatarImage src={avatarSrc} alt={displayName} />
        <AvatarFallback className='bg-primary/10 text-xs font-medium text-primary'>
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className='min-w-0 flex-1'>
        <p className='truncate text-sm font-medium'>{displayName}</p>
        <p className='truncate text-xs text-muted-foreground'>{contact.paymentIdentifier}</p>
      </div>
    </CommandItem>
  );
}

/**
 * Contact autocomplete component for selecting contacts by name or Lightning address
 * Shows a dropdown with matching contacts as the user types
 */
export function ContactAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Search contacts...',
  className,
  disabled = false,
}: ContactAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { contacts, isLoading } = useContacts();

  // Filter contacts by name or paymentIdentifier (case-insensitive)
  const filteredContacts = useMemo(() => {
    if (!value.trim()) {
      return [];
    }

    const searchTerm = value.toLowerCase().trim();
    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(searchTerm) ||
        contact.paymentIdentifier.toLowerCase().includes(searchTerm)
    );
  }, [contacts, value]);

  // Show dropdown only when input has 1+ characters and matches exist
  const shouldShowDropdown = value.trim().length > 0 && filteredContacts.length > 0 && isOpen;

  const handleSelect = (lightningAddress: string) => {
    onChange(lightningAddress);
    onSelect(lightningAddress);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    // Open dropdown when typing
    if (newValue.trim().length > 0) {
      setIsOpen(true);
    }
  };

  const handleFocus = () => {
    // Open dropdown on focus if there's already text and matches
    if (value.trim().length > 0 && filteredContacts.length > 0) {
      setIsOpen(true);
    }
  };

  const handleBlur = () => {
    // Delay closing to allow click events on dropdown items
    setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <Popover open={shouldShowDropdown} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Input
          type='text'
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className={cn(className)}
          autoComplete='off'
          autoCorrect='off'
          autoCapitalize='off'
          spellCheck='false'
        />
      </PopoverTrigger>
      {shouldShowDropdown && (
        <PopoverContent
          className='z-50 w-[var(--radix-popover-trigger-width)] rounded-lg border bg-popover p-0 shadow-lg'
          align='start'
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command shouldFilter={false} className='rounded-lg'>
            <CommandList className='max-h-[200px]'>
              <CommandEmpty className='py-2 text-center text-sm text-muted-foreground'>
                No contacts found
              </CommandEmpty>
              <CommandGroup heading='Contacts' className='overflow-hidden p-1'>
                {filteredContacts.map((contact) => (
                  <ContactAutocompleteItem
                    key={contact.id}
                    contact={contact}
                    onSelect={() => handleSelect(contact.paymentIdentifier)}
                  />
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      )}
    </Popover>
  );
}
