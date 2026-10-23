import { Spotify } from 'react-spotify-embed';

export const EventSpotifyEmbed = ({ link, wide = false }: { link: string; wide?: boolean }) => {
  return (
    <div className='w-full dark:overflow-hidden dark:rounded-xl dark:border dark:border-neutral-800 dark:bg-neutral-900'>
      <Spotify width={wide ? '100%' : '100%'} link={link} wide={wide} />
    </div>
  );
};
