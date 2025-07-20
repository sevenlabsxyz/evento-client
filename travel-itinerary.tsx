'use client';

import { Navbar } from '@/components/navbar';
import { useAuth } from '@/lib/hooks/useAuth';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { useTopBar } from '@/lib/stores/topbar-store';
import { ArrowDownLeft, ArrowUpRight, Camera, Hotel, MapPin, Plane, Utensils } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function TravelItinerary() {
  const { setTopBar } = useTopBar();

  // Set TopBar content
  useEffect(() => {
    setTopBar({
      title: 'Hub',
      subtitle: undefined,
      leftMode: 'menu',
      showAvatar: true,
      centerMode: 'title',
    });

    return () => {
      setTopBar({ 
        title: '',
        subtitle: '',
      });
    };
  }, [setTopBar]);

  const [activeDate, setActiveDate] = useState(2);
  const [activeTab, setActiveTab] = useState('hub');
  const router = useRouter();
  const pathname = usePathname();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dateRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Get user profile data
  const { user, isLoading: isUserLoading } = useUserProfile();
  const { logout } = useAuth();

  const scrollToDate = (date: number) => {
    setActiveDate(date);
    const targetElement = dateRefs.current[date];
    if (targetElement && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const containerHeight = container.clientHeight;
      const targetTop = targetElement.offsetTop;
      const targetHeight = targetElement.clientHeight;

      // Center the target element in the viewport
      const scrollTop = targetTop - containerHeight / 2 + targetHeight / 2;

      container.scrollTo({
        top: Math.max(0, scrollTop),
        behavior: 'smooth',
      });
    }
  };

  // Generate real calendar dates for September 2025
  const generateCalendarDays = () => {
    const startDate = new Date(2025, 8, 2); // September 2, 2025 (month is 0-indexed)
    const days = [];

    for (let i = 0; i < 8; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const dayName = dayNames[currentDate.getDay()];
      const date = currentDate.getDate();

      days.push({
        day: dayName,
        date: date,
        active: activeDate === date,
        hasEvent: [2, 3, 4, 5, 9].includes(date), // Events on specific dates
        eventColor:
          i === 0
            ? 'bg-blue-500'
            : i === 1
              ? 'bg-purple-500'
              : i === 2
                ? 'bg-green-500'
                : i === 3
                  ? 'bg-yellow-500'
                  : 'bg-red-500',
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className='relative mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
      {/* Horizontal Scrollable Calendar */}
      <div className='mb-6 px-4'>
        <div className='scrollbar-hide flex gap-6 overflow-x-auto pb-2'>
          {calendarDays.map((day, index) => (
            <div key={index} className='flex min-w-[50px] flex-col items-center'>
              <span className='mb-2 text-xs font-medium text-gray-500'>{day.day}</span>
              <div className='relative'>
                <button
                  onClick={() => scrollToDate(day.date)}
                  className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl font-medium transition-colors ${
                    day.active ? 'bg-red-200 text-red-800' : 'text-black hover:bg-gray-100'
                  }`}
                >
                  {day.date}
                </button>
                {day.hasEvent && (
                  <div
                    className={`h-2 w-2 rounded-full ${day.eventColor} absolute -bottom-1 left-1/2 -translate-x-1/2 transform`}
                  ></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vertically Scrollable Content */}
      <div ref={scrollContainerRef} className='flex-1 overflow-y-auto px-4 pb-20'>
        {/* Tuesday, September 2 */}
        <div ref={(el) => (dateRefs.current[2] = el)} className='mb-8'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='font-medium text-gray-500'>TUE, SEPTEMBER 2</h2>
            <span className='text-sm text-gray-400'>1st</span>
          </div>

          {/* Flight Info */}
          <div className='mb-6'>
            <div className='mb-4 flex items-start gap-4'>
              <div className='flex h-12 w-12 items-center justify-center rounded-full bg-blue-100'>
                <Plane className='h-6 w-6 text-blue-600' />
              </div>
              <div className='flex-1'>
                <h3 className='text-lg font-semibold'>Los Angeles to Tokyo</h3>
                <p className='text-gray-500'>Delta Air Lines</p>
              </div>
              <div className='text-right'>
                <span className='rounded bg-red-100 px-2 py-1 text-sm font-medium text-red-800'>
                  DL7
                </span>
                <div className='ml-auto mt-1 h-4 w-4 rounded-sm bg-red-500'></div>
              </div>
            </div>

            <div className='ml-16 border-l-2 border-blue-200 pb-4 pl-4'>
              <div className='mb-2 flex items-center gap-2'>
                <ArrowUpRight className='h-4 w-4 text-blue-600' />
                <span className='font-medium'>LAX</span>
                <span className='ml-auto text-gray-600'>10:30 AM</span>
              </div>
              <p className='text-sm text-gray-500'>Los Angeles International Airport</p>
            </div>
          </div>
        </div>

        {/* Wednesday, September 3 */}
        <div ref={(el) => (dateRefs.current[3] = el)} className='mb-8'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='font-medium text-gray-500'>WED, SEPTEMBER 3</h2>
            <span className='text-sm text-gray-400'>2nd</span>
          </div>

          <div className='mb-6 ml-16 border-l-2 border-blue-200 pb-4 pl-4'>
            <div className='mb-2 flex items-center gap-2'>
              <ArrowDownLeft className='h-4 w-4 text-blue-600' />
              <span className='font-medium'>HND</span>
              <span className='ml-auto text-gray-600'>2:00 PM</span>
            </div>
            <p className='text-sm text-gray-500'>Tokyo Haneda International Airport</p>
          </div>

          {/* Hotel Check-in */}
          <div className='mb-6 flex items-start gap-4'>
            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-purple-100'>
              <Hotel className='h-6 w-6 text-purple-600' />
            </div>
            <div className='flex-1'>
              <h3 className='text-lg font-semibold'>AC Tokyo Hotel Ginza</h3>
              <p className='text-gray-500'>Check-in</p>
            </div>
            <span className='text-sm text-gray-600'>3:30 PM</span>
          </div>

          {/* Dinner */}
          <div className='flex items-start gap-4'>
            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-green-100'>
              <Utensils className='h-6 w-6 text-green-600' />
            </div>
            <div className='flex-1'>
              <h3 className='text-lg font-semibold'>Sushi Jiro</h3>
              <p className='text-gray-500'>Dinner reservation</p>
            </div>
            <span className='text-sm text-gray-600'>7:00 PM</span>
          </div>
        </div>

        {/* Thursday, September 4 */}
        <div ref={(el) => (dateRefs.current[4] = el)} className='mb-8'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='font-medium text-gray-500'>THU, SEPTEMBER 4</h2>
            <span className='text-sm text-gray-400'>3rd</span>
          </div>

          <div className='mb-6 flex items-start gap-4'>
            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-gray-100'>
              <Hotel className='h-6 w-6 text-gray-600' />
            </div>
            <div className='flex-1'>
              <h3 className='font-medium text-gray-600'>AC Tokyo Hotel Ginza</h3>
              <p className='text-gray-500'>Staying</p>
            </div>
          </div>

          {/* Senso-ji Temple */}
          <div className='mb-6 flex items-start gap-4'>
            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-red-100'>
              <MapPin className='h-6 w-6 text-red-600' />
            </div>
            <div className='flex-1'>
              <h3 className='text-lg font-semibold'>Senso-ji Temple</h3>
              <p className='text-gray-500'>Sightseeing</p>
            </div>
            <span className='text-sm text-gray-600'>9:00 AM</span>
          </div>

          {/* Tokyo Skytree */}
          <div className='flex items-start gap-4'>
            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-blue-100'>
              <Camera className='h-6 w-6 text-blue-600' />
            </div>
            <div className='flex-1'>
              <h3 className='text-lg font-semibold'>Tokyo Skytree</h3>
              <p className='text-gray-500'>Observation deck</p>
            </div>
            <span className='text-sm text-gray-600'>2:00 PM</span>
          </div>
        </div>

        {/* Friday, September 5 */}
        <div ref={(el) => (dateRefs.current[5] = el)} className='mb-8'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='font-medium text-gray-500'>FRI, SEPTEMBER 5</h2>
            <span className='text-sm text-gray-400'>4th</span>
          </div>

          <div className='mb-6 flex items-start gap-4'>
            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100'>
              <MapPin className='h-6 w-6 text-yellow-600' />
            </div>
            <div className='flex-1'>
              <h3 className='text-lg font-semibold'>Shibuya Crossing</h3>
              <p className='text-gray-500'>Famous intersection</p>
            </div>
            <span className='text-sm text-gray-600'>10:00 AM</span>
          </div>

          <div className='flex items-start gap-4'>
            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-pink-100'>
              <Utensils className='h-6 w-6 text-pink-600' />
            </div>
            <div className='flex-1'>
              <h3 className='text-lg font-semibold'>Ramen Ichiran</h3>
              <p className='text-gray-500'>Lunch</p>
            </div>
            <span className='text-sm text-gray-600'>12:30 PM</span>
          </div>
        </div>
      </div>

      {/* Bottom Navbar */}
      <Navbar activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
