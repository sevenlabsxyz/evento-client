export const WavlakeEmbed = ({ link }: { link: string }) => {
  if (!link) return null;

  const trackId = link.split('/').pop();
  const embedUrl = `https://wavlake-evento-embed.vercel.app/track/${trackId}`;

  return (
    <div className='w-full rounded-lg md:mt-4'>
      <iframe
        src={embedUrl}
        width='100%'
        height='120'
        frameBorder='0'
        allowTransparency={true}
        allow='encrypted-media'
        style={{ maxHeight: '120px', overflow: 'hidden' }}
      ></iframe>
    </div>
  );
};
