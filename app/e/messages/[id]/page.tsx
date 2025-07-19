'use client';

import { ReusableDropdown } from '@/components/reusable-dropdown';
import { Button } from '@/components/ui/button';
import { useRequireAuth } from '@/lib/hooks/useAuth';
import { toast } from '@/lib/utils/toast';
import {
  ArrowLeft,
  FileText,
  ImageIcon,
  MoreHorizontal,
  Paperclip,
  Plus,
  Send,
} from 'lucide-react';
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
      content:
        "Long but worth it! The city looks amazing from the plane. Can't wait to explore 🏙️",
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
      content:
        "Perfect timing! I'm starving. Sending you a pic when I get there ✨",
      time: '10:36 AM',
      isMe: false,
      avatar: '/placeholder.svg?height=32&width=32',
    },
  ];

  const currentChat =
    chatData[params.id as keyof typeof chatData] || chatData['1'];
  const isGroup = currentChat.type === 'group';

  const uploadOptions = [
    {
      label: 'Upload Photo',
      icon: <ImageIcon className="w-4 h-4" />,
      action: () => {
        toast.success('Photo upload coming soon!');
      },
    },
    {
      label: 'Pick from Files',
      icon: <Paperclip className="w-4 h-4" />,
      action: () => {
        toast.success('File picker coming soon!');
      },
    },
    {
      label: 'Upload Document',
      icon: <FileText className="w-4 h-4" />,
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
    <div className="flex items-center gap-3 flex-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <div className="flex items-center gap-3 flex-1">
        <div className="relative">
          <img
            src={currentChat.avatar || '/placeholder.svg'}
            alt={currentChat.name}
            className={`object-cover ${
              isGroup ? 'w-10 h-10 rounded-lg' : 'w-10 h-10 rounded-full'
            }`}
          />
          {!isGroup && currentChat.isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-black text-lg truncate">
            {currentChat.name}
          </h3>
          <p className="text-gray-500 text-sm">{currentChat.username}</p>
        </div>
      </div>
    </div>
  );

  if (isCheckingAuth) {
    return (
      <div className="md:max-w-sm max-w-full mx-auto bg-white min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center pb-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="md:max-w-sm max-w-full mx-auto bg-white min-h-screen flex flex-col">
      {/* Header - Using same structure as main chat page */}
      <div className="fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm max-w-full bg-white z-40 border-b border-gray-100">
        <div className="px-4 pt-6 pb-0">
          <div className="flex justify-between items-start mb-2">
            {chatHeaderContent}
            <div className="flex gap-2 ml-4">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-gray-100"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pt-[120px] pb-[80px] px-4">
        <div className="space-y-4 py-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex gap-2 max-w-[80%] ${
                  msg.isMe ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {!msg.isMe && (
                  <img
                    src={msg.avatar || '/placeholder.svg'}
                    alt={msg.sender}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                )}
                <div
                  className={`flex flex-col ${
                    msg.isMe ? 'items-end' : 'items-start'
                  }`}
                >
                  {!msg.isMe && isGroup && (
                    <span className="text-xs text-gray-500 mb-1 px-3">
                      {msg.sender}
                    </span>
                  )}
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      msg.isMe
                        ? 'bg-red-500 text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-900 rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                  <span className="text-xs text-gray-500 mt-1 px-1">
                    {msg.time}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Message Input */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm max-w-full bg-white border-t border-gray-100 p-4">
        <div className="flex items-center gap-3">
          <ReusableDropdown
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0 rounded-full bg-gray-100"
              >
                <Plus className="h-5 w-5" />
              </Button>
            }
            items={uploadOptions}
            align="left"
            width="w-48"
          />
          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message..."
              className="w-full px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="bg-red-500 hover:bg-red-600 rounded-full h-8 w-8 p-0 flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
