import { Spotify } from 'react-spotify-embed';

export const EventSpotifyEmbed = ({ link, wide = false }: { link: string; wide?: boolean }) => {
	return (
		<div className='w-full'>
			<Spotify width={wide ? '100%' : '100%'} link={link} wide={wide} />
		</div>
	);
};
