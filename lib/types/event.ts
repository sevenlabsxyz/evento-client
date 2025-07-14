export interface EventHost {
  id: string;
  name: string;
  username: string;
  avatar: string;
  title?: string;
  company?: string;
}

export interface EventLocation {
  name: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  zipCode?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface EventPerk {
  id: string;
  title: string;
  description: string;
  value?: string;
  isLimited?: boolean;
}

export interface EventDetails {
  objective?: string;
  participants?: string;
  profileUrl?: string;
  website?: string;
}

export interface Event {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  timezone?: string;
  location: EventLocation;
  coverImages: string[];
  hosts: EventHost[];
  perks?: EventPerk[];
  details?: EventDetails;
  capacity?: {
    current: number;
    max: number;
    isNearCapacity: boolean;
  };
  weather?: {
    temperature: number;
    unit: 'C' | 'F';
    condition: string;
  };
  type: 'conference' | 'networking' | 'workshop' | 'social' | 'business' | 'showcase';
  tags?: string[];
  isActive: boolean;
  registrationUrl?: string;
  contactEnabled: boolean;
}

export interface EventSummary {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  image: string;
  type?: string;
}