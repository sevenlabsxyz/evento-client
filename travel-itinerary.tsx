"use client";

import {
  MoreHorizontal,
  Plane,
  ArrowUpRight,
  ArrowDownLeft,
  Hotel,
  Settings,
  Bookmark,
  Edit3,
  LogOut,
  MapPin,
  Utensils,
  Camera,
  User,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReusableDropdown } from "@/components/reusable-dropdown";
import { Navbar } from "@/components/navbar";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import { useAuth } from "@/lib/hooks/useAuth";

export default function TravelItinerary() {
  const [activeDate, setActiveDate] = useState(2);
  const [activeTab, setActiveTab] = useState("hub");
  const router = useRouter();
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
        behavior: "smooth",
      });
    }
  };

  const dropdownItems = [
    {
      label: "Settings",
      icon: <Settings className="w-4 h-4" />,
      action: () => router.push("/e/settings"),
    },
    {
      label: "Saved",
      icon: <Bookmark className="w-4 h-4" />,
      action: () => router.push("/e/saved"),
    },
    {
      label: "Edit Profile",
      icon: <Edit3 className="w-4 h-4" />,
      action: () => toast.success("Edit profile coming soon!"),
    },
    {
      label: "Log Out",
      icon: <LogOut className="w-4 h-4" />,
      action: () => logout(),
      destructive: true,
    },
  ];

  // Generate real calendar dates for September 2025
  const generateCalendarDays = () => {
    const startDate = new Date(2025, 8, 2); // September 2, 2025 (month is 0-indexed)
    const days = [];

    for (let i = 0; i < 8; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      const dayName = dayNames[currentDate.getDay()];
      const date = currentDate.getDate();

      days.push({
        day: dayName,
        date: date,
        active: activeDate === date,
        hasEvent: [2, 3, 4, 5, 9].includes(date), // Events on specific dates
        eventColor:
          i === 0
            ? "bg-blue-500"
            : i === 1
            ? "bg-purple-500"
            : i === 2
            ? "bg-green-500"
            : i === 3
            ? "bg-yellow-500"
            : "bg-red-500",
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="md:max-w-sm max-w-full mx-auto bg-white min-h-screen flex flex-col relative">
      <div className="fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm max-w-full bg-white z-40 shadow-sm">
        {/* Header */}
        <PageHeader
          title="My Hub"
          subtitle="September 2025"
          showMenu={true}
          rightContent={
            <>
              <ReusableDropdown
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-gray-100"
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                }
                items={dropdownItems}
              />
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-gray-100"
                onClick={() => router.push("/e/stats")}
              >
                <BarChart3 className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-gray-100 p-0 h-10 w-10"
                onClick={() => router.push("/e/me")}
              >
                {isUserLoading ? (
                  <User className="h-5 w-5" />
                ) : (
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={user?.image || ''} 
                      alt={user?.name || user?.username || 'User'} 
                    />
                    <AvatarFallback>
                      {user?.name ? user.name.charAt(0).toUpperCase() : 
                       user?.username ? user.username.charAt(0).toUpperCase() : 
                       'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
              </Button>
            </>
          }
        />

        {/* Horizontal Scrollable Calendar */}
        <div className="px-4 mb-6">
          <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-2">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className="flex flex-col items-center min-w-[50px]"
              >
                <span className="text-gray-500 text-xs font-medium mb-2">
                  {day.day}
                </span>
                <div className="relative">
                  <button
                    onClick={() => scrollToDate(day.date)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-medium transition-colors ${
                      day.active
                        ? "bg-orange-200 text-orange-800"
                        : "text-black hover:bg-gray-100"
                    }`}
                  >
                    {day.date}
                  </button>
                  {day.hasEvent && (
                    <div
                      className={`w-2 h-2 rounded-full ${day.eventColor} absolute -bottom-1 left-1/2 transform -translate-x-1/2`}
                    ></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vertically Scrollable Content */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 pb-20 pt-[220px]"
      >
        {/* Tuesday, September 2 */}
        <div ref={(el) => (dateRefs.current[2] = el)} className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-gray-500 font-medium">TUE, SEPTEMBER 2</h2>
            <span className="text-gray-400 text-sm">1st</span>
          </div>

          {/* Flight Info */}
          <div className="mb-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Plane className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Los Angeles to Tokyo</h3>
                <p className="text-gray-500">Delta Air Lines</p>
              </div>
              <div className="text-right">
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm font-medium">
                  DL7
                </span>
                <div className="w-4 h-4 bg-orange-500 rounded-sm mt-1 ml-auto"></div>
              </div>
            </div>

            <div className="ml-16 border-l-2 border-blue-200 pl-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight className="h-4 w-4 text-blue-600" />
                <span className="font-medium">LAX</span>
                <span className="ml-auto text-gray-600">10:30 AM</span>
              </div>
              <p className="text-gray-500 text-sm">
                Los Angeles International Airport
              </p>
            </div>
          </div>
        </div>

        {/* Wednesday, September 3 */}
        <div ref={(el) => (dateRefs.current[3] = el)} className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-gray-500 font-medium">WED, SEPTEMBER 3</h2>
            <span className="text-gray-400 text-sm">2nd</span>
          </div>

          <div className="ml-16 border-l-2 border-blue-200 pl-4 pb-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownLeft className="h-4 w-4 text-blue-600" />
              <span className="font-medium">HND</span>
              <span className="ml-auto text-gray-600">2:00 PM</span>
            </div>
            <p className="text-gray-500 text-sm">
              Tokyo Haneda International Airport
            </p>
          </div>

          {/* Hotel Check-in */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Hotel className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">AC Tokyo Hotel Ginza</h3>
              <p className="text-gray-500">Check-in</p>
            </div>
            <span className="text-gray-600 text-sm">3:30 PM</span>
          </div>

          {/* Dinner */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Utensils className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Sushi Jiro</h3>
              <p className="text-gray-500">Dinner reservation</p>
            </div>
            <span className="text-gray-600 text-sm">7:00 PM</span>
          </div>
        </div>

        {/* Thursday, September 4 */}
        <div ref={(el) => (dateRefs.current[4] = el)} className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-gray-500 font-medium">THU, SEPTEMBER 4</h2>
            <span className="text-gray-400 text-sm">3rd</span>
          </div>

          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <Hotel className="h-6 w-6 text-gray-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-600">
                AC Tokyo Hotel Ginza
              </h3>
              <p className="text-gray-500">Staying</p>
            </div>
          </div>

          {/* Senso-ji Temple */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <MapPin className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Senso-ji Temple</h3>
              <p className="text-gray-500">Sightseeing</p>
            </div>
            <span className="text-gray-600 text-sm">9:00 AM</span>
          </div>

          {/* Tokyo Skytree */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Camera className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Tokyo Skytree</h3>
              <p className="text-gray-500">Observation deck</p>
            </div>
            <span className="text-gray-600 text-sm">2:00 PM</span>
          </div>
        </div>

        {/* Friday, September 5 */}
        <div ref={(el) => (dateRefs.current[5] = el)} className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-gray-500 font-medium">FRI, SEPTEMBER 5</h2>
            <span className="text-gray-400 text-sm">4th</span>
          </div>

          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <MapPin className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Shibuya Crossing</h3>
              <p className="text-gray-500">Famous intersection</p>
            </div>
            <span className="text-gray-600 text-sm">10:00 AM</span>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
              <Utensils className="h-6 w-6 text-pink-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Ramen Ichiran</h3>
              <p className="text-gray-500">Lunch</p>
            </div>
            <span className="text-gray-600 text-sm">12:30 PM</span>
          </div>
        </div>
      </div>

      {/* Bottom Navbar */}
      <Navbar activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
