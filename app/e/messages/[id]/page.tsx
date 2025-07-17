'use client';

import { ReusableDropdown } from '@/components/reusable-dropdown';
import { Button } from '@/components/ui/button';
import { useRequireAuth } from '@/lib/hooks/useAuth';
import { toast } from '@/lib/utils/toast';
import { ArrowLeft, MoreHorizontal, Paperclip, Plus, Send } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SingleChatPage() {
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const router = useRouter();
  const params = useParams();
  const [message, setMessage] = useState('');

  // Mock data - in real app this would come from API based on params.id
  const chatData = {
    '1': {
      type: 'user',
      name: 'Sarah Chen',
      username: '@sarahc',
      avatar: '/placeholder.svg?height=40&width=40',
      isOnline: true,
      lastSeen: null,
    },
    '2': {
      type: 'group',
      name: 'Tokyo Adventure',
      username: '3 members',
      avatar: '/placeholder.svg?height=40&width=40',
      members: ['Sarah Chen', 'Marcus Johnson', 'You'],
      memberCount: 3,
    },
  };

  const messages = [
    {
      id: 1,
      sender: 'Sarah Chen',
      content: 'Hey! Just landed in Tokyo 🛬',
      time: '10:30 AM',
      isMe: false,
      avatar: '/placeholder.svg?height=32&width=32',
    },
    {
      id: 2,
      sender: 'You',
      content: 'Welcome to Tokyo! How was the flight?',
      time: '10:32 AM',
      isMe: true,
    },
    {
      id: 3,
      sender: 'Sarah Chen',
      content: "Long but worth it! The city looks amazing from the plane. Can't wait to explore 🏙️",
      time: '10:33 AM',
      isMe: false,
      avatar: '/placeholder.svg?height=32&width=32',
    },
    {
      id: 4,
      sender: 'You',
      content:
        'The ramen place I mentioned is just 5 minutes from your hotel. Perfect for jet lag recovery! 🍜',
      time: '10:35 AM',
      isMe: true,
    },
    {
      id: 5,
      sender: 'Sarah Chen',
      content: "Perfect timing! I'm starving. Sending you a pic when I get there ✨",
      time: '10:36 AM',
      isMe: false,
      avatar: '/placeholder.svg?height=32&width=32',
    },
  ];

  const currentChat = chatData[params.id as keyof typeof chatData] || chatData['1'];
  const isGroup = currentChat.type === 'group';

  const uploadOptions = [
    {
      label: 'Upload Photo',
      icon: <ImageIcon className='h-4 w-4' />,
      action: () => {
        toast.success('Photo upload coming soon!');
      },
    },
    {
      label: 'Pick from Files',
      icon: <Paperclip className='h-4 w-4' />,
      action: () => {
        toast.success('File picker coming soon!');
      },
    },
    {
      label: 'Upload Document',
      icon: <FileText className='h-4 w-4' />,
      action: () => {
        toast.success('Document upload coming soon!');
      },
    },
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      // Handle sending message
      setMessage('');
    }
  };

  // Create custom header content for the chat
  const chatHeaderContent = (
    <div className='flex flex-1 items-center gap-3'>
      <Button variant='ghost' size='icon' className='h-8 w-8' onClick={() => router.back()}>
        <ArrowLeft className='h-5 w-5' />
      </Button>
      <div className='flex flex-1 items-center gap-3'>
        <div className='relative'>
          <img
            src={currentChat.avatar || '/placeholder.svg'}
            alt={currentChat.name}
            className={`object-cover ${
              isGroup ? 'h-10 w-10 rounded-lg' : 'h-10 w-10 rounded-full'
            }`}
          />
          {!isGroup && currentChat.isOnline && (
            <div className='absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500'></div>
          )}
        </div>
        <div className='min-w-0 flex-1'>
          <h3 className='truncate text-lg font-bold text-black'>{currentChat.name}</h3>
          <p className='text-sm text-gray-500'>{currentChat.username}</p>
        </div>
      </div>
    </div>
  );

  if (isCheckingAuth) {
    return (
      <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
        <div className='flex flex-1 items-center justify-center pb-20'>
          <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-red-500'></div>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
      {/* Header - Using same structure as main chat page */}
      <div className='fixed left-1/2 top-0 z-40 w-full max-w-full -translate-x-1/2 transform border-b border-gray-100 bg-white md:max-w-sm'>
        <div className='px-4 pb-0 pt-6'>
          <div className='mb-2 flex items-start justify-between'>
            {chatHeaderContent}
            <div className='ml-4 flex gap-2'>
              <Button variant='ghost' size='icon' className='rounded-full bg-gray-100'>
                <MoreHorizontal className='h-5 w-5' />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className='flex-1 overflow-y-auto px-4 pb-[80px] pt-[120px]'>
        <div className='space-y-4 py-4'>
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`flex max-w-[80%] gap-2 ${msg.isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {!msg.isMe && (
                  <img
                    src={msg.avatar || '/placeholder.svg'}
                    alt={msg.sender}
                    className='h-8 w-8 flex-shrink-0 rounded-full object-cover'
                  />
                )}
                <div className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                  {!msg.isMe && isGroup && (
                    <span className='mb-1 px-3 text-xs text-gray-500'>{msg.sender}</span>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      msg.isMe
                        ? 'rounded-br-md bg-red-500 text-white'
                        : 'rounded-bl-md bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className='text-sm'>{msg.content}</p>
                  </div>
                  <span className='mt-1 px-1 text-xs text-gray-500'>{msg.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Message Input */}
      <div className='fixed bottom-0 left-1/2 w-full max-w-full -translate-x-1/2 transform border-t border-gray-100 bg-white p-4 md:max-w-sm'>
        <div className='flex items-center gap-3'>
          <ReusableDropdown
            trigger={
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8 flex-shrink-0 rounded-full bg-gray-100'
              >
                <Plus className='h-5 w-5' />
              </Button>
            }
            items={uploadOptions}
            align='left'
            width='w-48'
          />
          <div className='relative flex-1'>
            <input
              type='text'
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder='Message...'
              className='w-full rounded-full bg-gray-100 px-4 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500'
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className='h-8 w-8 flex-shrink-0 rounded-full bg-red-500 p-0 hover:bg-red-600'
          >
            <Send className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </div>
  );
}
