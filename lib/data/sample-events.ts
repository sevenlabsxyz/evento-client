import { Event } from '../types/event';

export const sampleEvents: Event[] = [
  {
    id: 'cosmoprof-2025',
    title: 'COSMOPROF 2025 - K-Beauty Networking',
    subtitle: 'North America Las Vegas',
    description: 'Join us for a free pass & Meet 28 top Korean beauty brands! Step into the K-Beauty Networking at COSMOPROF North America 2025 this July in Las Vegas — where global partners meet the next wave of K-beauty innovation.',
    date: 'July 15-16, 2025',
    startTime: '9:00 AM',
    endTime: '5:00 PM',
    timezone: 'PDT',
    location: {
      name: 'Mandalay Bay Convention Center',
      address: '3950 S Las Vegas Blvd',
      city: 'Las Vegas',
      state: 'Nevada',
      country: 'USA',
      zipCode: '89119',
      coordinates: {
        lat: 36.0925,
        lng: -115.1761
      }
    },
    coverImages: [
      '/api/placeholder/400/300',
      '/api/placeholder/400/301',
      '/api/placeholder/400/302'
    ],
    hosts: [
      {
        id: 'yuhelen',
        name: 'Yu Helen Kim',
        username: 'yuhelen',
        avatar: '/api/placeholder/40/40',
        title: 'Manager',
        company: 'Bridging Group Korea'
      }
    ],
    perks: [
      {
        id: 'free-pass',
        title: 'FREE 1-day Pass',
        description: 'Full access to the event',
        value: '$130',
        isLimited: true
      },
      {
        id: 'travel-allowance',
        title: 'Travel allowance',
        description: 'Travel support for attendees',
        value: 'USD 250'
      },
      {
        id: 'interpretation',
        title: 'Korean-English interpretation',
        description: 'Professional translation services'
      },
      {
        id: 'business-matching',
        title: 'Tailored business matching',
        description: 'Connect with top Korean beauty brands'
      }
    ],
    details: {
      objective: 'To support leading Korean beauty brands explore opportunities and expand their network in the U.S. through global partner matchmaking.',
      participants: '28 Korean beauty brands',
      profileUrl: 'https://drive.google.com/file/d/1QJ3DUm5h9psNyMAOvGNxd8iOEwEdAqpF/view'
    },
    capacity: {
      current: 245,
      max: 250,
      isNearCapacity: true
    },
    weather: {
      temperature: 34,
      unit: 'C',
      condition: 'Sunny'
    },
    type: 'networking',
    tags: ['K-Beauty', 'Networking', 'B2B', 'COSMOPROF'],
    isActive: true,
    registrationUrl: 'https://cosmoprofnorthamerica.com',
    contactEnabled: true
  },
  {
    id: 'innovation-launchpad-2025',
    title: 'Innovation Launchpad: AI Showcase Event',
    subtitle: 'Hosted by AWS and PREDICTif',
    description: 'Join us for an exclusive AI showcase featuring the latest innovations and breakthrough technologies. Connect with industry leaders and discover the future of artificial intelligence.',
    date: 'July 15, 2025',
    startTime: '5:00 PM',
    endTime: '10:00 PM',
    timezone: 'CDT',
    location: {
      name: 'International Innovation Center',
      address: '300 S 4th St ste 180',
      city: 'Las Vegas',
      state: 'NV',
      country: 'USA',
      zipCode: '89101',
      coordinates: {
        lat: 36.1699,
        lng: -115.1398
      }
    },
    coverImages: [
      '/api/placeholder/400/300',
      '/api/placeholder/400/301'
    ],
    hosts: [
      {
        id: 'haleigh-smoot',
        name: 'Haleigh Smoot',
        username: 'haleighsmoot',
        avatar: '/api/placeholder/40/40',
        title: 'Marketing Manager',
        company: 'PREDICTif Solutions'
      },
      {
        id: 'annie-coufal',
        name: 'Annie Coufal',
        username: 'anniecoufal',
        avatar: '/api/placeholder/40/40'
      },
      {
        id: 'james',
        name: 'James Chen',
        username: 'jameschen',
        avatar: '/api/placeholder/40/40'
      },
      {
        id: 'somvong-dill',
        name: 'Somvong Dill',
        username: 'somvongdill',
        avatar: '/api/placeholder/40/40',
        company: 'AWS'
      }
    ],
    perks: [
      {
        id: 'exclusive-access',
        title: 'Exclusive Access',
        description: 'Early access to AI demonstrations'
      },
      {
        id: 'networking-dinner',
        title: 'Networking Dinner',
        description: 'Premium dining experience with industry leaders'
      },
      {
        id: 'ai-showcase',
        title: 'AI Technology Showcase',
        description: 'Hands-on experience with cutting-edge AI tools'
      }
    ],
    details: {
      objective: 'Showcase the latest AI innovations and foster connections between technology leaders and potential partners.',
      participants: 'AI researchers, tech entrepreneurs, venture capitalists',
      website: 'https://predictif.ai'
    },
    capacity: {
      current: 85,
      max: 100,
      isNearCapacity: false
    },
    weather: {
      temperature: 43,
      unit: 'C',
      condition: 'Clear'
    },
    type: 'showcase',
    tags: ['AI', 'Innovation', 'Technology', 'Networking'],
    isActive: true,
    contactEnabled: true
  }
];

export const getEventById = (id: string): Event | undefined => {
  return sampleEvents.find(event => event.id === id);
};