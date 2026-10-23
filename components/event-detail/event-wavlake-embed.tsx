export const WavlakeEmbed = ({ link }: { link: string }) => {
  if (!link) return null;

  const trackId = link.split('/').pop();
  // Reject empty/whitespace track IDs so nothing is rendered for malformed links
  if (!trackId || trackId.trim() === '') return null;

  const embedUrl = `https://wavlake.evento.so/track/${encodeURIComponent(trackId)}`;

  return (
    <div className='w-full rounded-lg dark:overflow-hidden dark:border dark:border-neutral-800 dark:bg-white md:mt-4'>
      <iframe
        src={embedUrl}
        width='100%'
        height='120'
        frameBorder={0}
        allowTransparency
        allow='encrypted-media'
        className='dark:bg-white'
        style={{ maxHeight: '120px', overflow: 'hidden' }}
      ></iframe>
    </div>
  );
};
