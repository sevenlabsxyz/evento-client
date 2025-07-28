'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationFilterParams } from '@/lib/types/notifications';
import { Filter } from 'lucide-react';

interface NotificationFiltersProps {
  currentFilters: NotificationFilterParams;
  onFilterChange: (filters: NotificationFilterParams) => void;
  showArchived: boolean;
  onShowArchivedChange: (showArchived: boolean) => void;
  currentTab: string;
  onTabChange: (tab: string) => void;
  selectedCount?: number;
  onClearSelection?: () => void;
  onMarkSelectedAsRead?: () => void;
  onArchiveSelected?: () => void;
}

export function NotificationFilters({
  currentFilters,
  onFilterChange,
  showArchived,
  onShowArchivedChange,
  currentTab,
  onTabChange,
  selectedCount = 0,
  onClearSelection,
  onMarkSelectedAsRead,
  onArchiveSelected,
}: NotificationFiltersProps) {
  // Filter tabs
  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'archived', label: 'Archived' },
  ];

  return (
    <div className='sticky top-0 z-10 bg-white px-4 py-3 shadow-sm'>
      {/* Bulk actions when items are selected */}
      {selectedCount > 0 ? (
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium text-gray-700'>{selectedCount} selected</span>
          <div className='flex gap-2'>
            <Button variant='ghost' size='sm' onClick={onClearSelection} className='text-xs'>
              Cancel
            </Button>
            <Button variant='outline' size='sm' onClick={onMarkSelectedAsRead} className='text-xs'>
              Mark as read
            </Button>
            <Button variant='outline' size='sm' onClick={onArchiveSelected} className='text-xs'>
              Archive
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Filter tabs */}
          <div className='mb-2 flex items-center justify-between'>
            <div className='flex gap-1'>
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={currentTab === tab.id ? 'default' : 'ghost'}
                  size='sm'
                  onClick={() => onTabChange(tab.id)}
                  className={`rounded-full px-4 py-1 text-xs ${
                    currentTab === tab.id
                      ? 'bg-red-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* Advanced filter dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  className='flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600'
                >
                  <Filter className='h-3 w-3' />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-48'>
                <DropdownMenuLabel>Filter By</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className='text-xs font-normal text-gray-500'>
                  Status
                </DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={currentFilters.status === 'read'}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onFilterChange({ ...currentFilters, status: 'read' });
                    } else {
                      const { status, ...rest } = currentFilters;
                      onFilterChange(rest);
                    }
                  }}
                >
                  Read
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={currentFilters.status === 'unread'}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onFilterChange({ ...currentFilters, status: 'unread' });
                    } else {
                      const { status, ...rest } = currentFilters;
                      onFilterChange(rest);
                    }
                  }}
                >
                  Unread
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className='text-xs font-normal text-gray-500'>
                  Type
                </DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={currentFilters.source === 'event_invite'}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onFilterChange({ ...currentFilters, source: 'event_invite' });
                    } else {
                      const { source, ...rest } = currentFilters;
                      onFilterChange(rest);
                    }
                  }}
                >
                  Event Invites
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={currentFilters.source === 'event_comment'}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onFilterChange({ ...currentFilters, source: 'event_comment' });
                    } else {
                      const { source, ...rest } = currentFilters;
                      onFilterChange(rest);
                    }
                  }}
                >
                  Comments
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={currentFilters.source === 'event_rsvp'}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onFilterChange({ ...currentFilters, source: 'event_rsvp' });
                    } else {
                      const { source, ...rest } = currentFilters;
                      onFilterChange(rest);
                    }
                  }}
                >
                  RSVPs
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={currentFilters.source === 'user_follow'}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onFilterChange({ ...currentFilters, source: 'user_follow' });
                    } else {
                      const { source, ...rest } = currentFilters;
                      onFilterChange(rest);
                    }
                  }}
                >
                  Follows
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={currentFilters.source === 'system_update'}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onFilterChange({ ...currentFilters, source: 'system_update' });
                    } else {
                      const { source, ...rest } = currentFilters;
                      onFilterChange(rest);
                    }
                  }}
                >
                  System Updates
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <Button
                  variant='ghost'
                  size='sm'
                  className='w-full justify-center'
                  onClick={() => onFilterChange({})}
                >
                  Clear Filters
                </Button>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      )}
    </div>
  );
}
