'use client';

import { useState } from 'react';
import { UserPlus, MessageCircle, Settings, MoreHorizontal, Mail, Image, EyeOff, Link, Copy, UserCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ReusableDropdown } from '@/components/reusable-dropdown';

interface OwnerEventButtonsProps {
  eventId: string;
}

export default function OwnerEventButtons({ eventId }: OwnerEventButtonsProps) {
  const router = useRouter();
  const [hideGuestList, setHideGuestList] = useState(false);

  const handleInvite = () => {
    router.push(`/e/${eventId}/invite`);
  };

  const handleChat = () => {
    router.push(`/e/messages/${eventId}`);
  };

  const handleManage = () => {
    router.push(`/e/${eventId}/manage`);
  };

  const handleEmailBlasts = () => {
    router.push(`/e/${eventId}/manage`);
  };

  const handleGallerySettings = () => {
    router.push(`/e/${eventId}/gallery`);
  };

  const handleToggleGuestList = () => {
    setHideGuestList(!hideGuestList);
    router.push(`/e/${eventId}/manage/guests`);
  };

  const handleEventLink = () => {
    const eventUrl = `${window.location.origin}/e/${eventId}`;
    alert(`Event link: ${eventUrl}`);
  };

  const handleCopyEventLink = () => {
    const eventUrl = `${window.location.origin}/e/${eventId}`;
    navigator.clipboard.writeText(eventUrl);
    alert('Event link copied to clipboard!');
  };

  const handleCheckInGuests = () => {
    console.log('Check-in guests functionality');
  };


  return (
    <div className="grid grid-cols-4 gap-2">
      {/* Invite Button */}
      <button
        onClick={handleInvite}
        className="flex flex-col items-center justify-center h-16 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
      >
        <UserPlus className="w-5 h-5 mb-1" />
        <span className="text-xs font-medium">Invite</span>
      </button>

      {/* Chat Button */}
      <button
        onClick={handleChat}
        className="flex flex-col items-center justify-center h-16 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
      >
        <MessageCircle className="w-5 h-5 mb-1" />
        <span className="text-xs font-medium">Chat</span>
      </button>

      {/* Manage Button */}
      <button
        onClick={handleManage}
        className="flex flex-col items-center justify-center h-16 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
      >
        <Settings className="w-5 h-5 mb-1" />
        <span className="text-xs font-medium">Manage</span>
      </button>

      {/* More Button with Dropdown */}
      <ReusableDropdown
        trigger={
          <button className="flex flex-col items-center justify-center h-16 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors w-full">
            <MoreHorizontal className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">More</span>
          </button>
        }
        items={[
          { label: "Email Blasts", icon: <Mail className="w-4 h-4" />, action: handleEmailBlasts },
          { label: "Gallery Settings", icon: <Image className="w-4 h-4" />, action: handleGallerySettings },
          { label: "Hide Guest List", icon: <EyeOff className="w-4 h-4" />, action: handleToggleGuestList },
          { label: "Event Link", icon: <Link className="w-4 h-4" />, action: handleEventLink },
          { label: "Copy Event Link", icon: <Copy className="w-4 h-4" />, action: handleCopyEventLink },
          { label: "Check-in Guests", icon: <UserCheck className="w-4 h-4" />, action: handleCheckInGuests }
        ]}
        align="right"
        width="w-56"
      />
    </div>
  );
}