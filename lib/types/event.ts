export interface EventHost {
  id: string;
  name: string;
  username: string;
  avatar: string;
  title?: string;
  company?: string;
}

export type GuestStatus = 'going' | 'invited' | 'not-going' | 'maybe' | 'checked-in';

export interface Guest {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: GuestStatus;
  checkedInAt?: Date;
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
  computedStartDate: string;
  computedEndDate: string;
  location: EventLocation;
  coverImages: string[];
  galleryImages?: string[];
  hosts: EventHost[];
  guests?: Guest[];
  guestListSettings?: {
    isPublic: boolean;
    allowPublicRSVP: boolean;
  };
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
  owner?: {
    id: string;
    name: string;
    username: string;
  };
}

export interface EventSummary {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  image: string;
}
