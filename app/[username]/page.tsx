import apiClient from '@/lib/api/client';
import { Metadata, ResolvingMetadata } from 'next';
import UserProfilePageClient from './page-client';

// Define the types for props and params
type Props = {
  params: { username: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

// Generate metadata for the user profile page
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Get the username from params
  const username = params.username;

  try {
    // Fetch user data from API
    const userResponse = await apiClient.get(
      `/v1/user/profile?username=${username}`
    );
    const userData = userResponse.data;

    if (!userData?.data || !userData?.data[0]) {
      return {
        title: 'User Not Found | Evento',
        description: 'The user profile you are looking for does not exist.',
      };
    }

    const user = userData.data[0];

    // Profile image (avatar)
    const profileImage = user.image || '/assets/default-avatar.png';
    const displayName = user.name || user.username || 'Evento User';
    const userBio = user.bio || `${displayName} is on Evento`;

    // Generate metadata
    return {
      title: `${displayName} (@${user.username}) | Evento`,
      description: userBio,
      openGraph: {
        title: `${displayName} (@${user.username})`,
        description: userBio,
        images: [
          {
            url: profileImage,
            width: 600,
            height: 600,
            alt: displayName,
          },
        ],
        locale: 'en_US',
        type: 'profile',
      },
      twitter: {
        card: 'summary',
        title: `${displayName} (@${user.username})`,
        description: userBio,
        images: [profileImage],
        creator: `@${user.username}`,
      },
    };
  } catch (error) {
    console.error('Error generating user profile metadata:', error);
    return {
      title: `${username} | Evento`,
      description: 'View this user profile on Evento',
    };
  }
}

export default async function UserProfilePage({ params }: Props) {
  // Server component simply renders the client component
  // All metadata is handled by generateMetadata function
  return <UserProfilePageClient />;
}
