'use client';

import { Navbar } from '@/components/navbar';
import { MessageSquare } from 'lucide-react';
import { useState } from 'react';

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState('messages');

  return (
    <>
      <div className='hidden h-full flex-col items-center justify-center bg-gray-50 md:flex'>
        <div className='text-center'>
          <div className='mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-200'>
            <MessageSquare className='h-8 w-8 text-gray-400' />
          </div>
          <h2 className='mb-2 text-xl font-semibold text-gray-900'>Select a conversation</h2>
          <p className='text-sm text-gray-500'>
            Choose a chat from the list on the left to start messaging
          </p>
        </div>
      </div>

      <div className='flex h-full flex-col items-center justify-center bg-white md:hidden'>
        <div className='px-4 text-center'>
          <div className='mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100'>
            <MessageSquare className='h-8 w-8 text-gray-400' />
          </div>
          <h2 className='mb-2 text-xl font-semibold text-gray-900'>No conversation selected</h2>
          <p className='text-sm text-gray-500'>Select a chat from your messages list</p>
        </div>
        <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </>
  );
}
