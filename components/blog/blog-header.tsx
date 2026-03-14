interface BlogHeaderProps {
  title?: string;
  description?: string;
}

export function BlogHeader({
  title = 'Blog',
  description = 'Insights, tutorials, and thoughts on modern software development',
}: BlogHeaderProps) {
  return (
    <div className='mb-8 md:mb-14 lg:mb-16'>
      <div className='flex items-start justify-between gap-8'>
        <div>
          <h2 className='mb-4 w-full text-4xl font-medium md:mb-5 md:text-5xl lg:mb-6 lg:text-6xl'>
            {title}
          </h2>
        </div>
      </div>
      <p className='text-muted-foreground'>{description}</p>
    </div>
  );
}
