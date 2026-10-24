import { Spotify } from 'react-spotify-embed';

export const EventSpotifyEmbed = ({ link, wide = false }: { link: string; wide?: boolean }) => {
  return (
    <div className='w-full overflow-hidden rounded-xl'>
      <Spotify width='100%' link={link} wide={wide} />
    </div>
  );
};
