import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';

interface BlogCardProps {
  date: string | null;
  slug: string;
  image: string;
  title: string;
  category?: Array<{ name: string }>;
  description: string;
}

export const BlogCard = ({ date, slug, image, title, description }: BlogCardProps) => {
  // Fallback gradient if no image
  const fallbackGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  const parsedDate = date ? new Date(date) : null;
  const formattedDate = parsedDate && !Number.isNaN(parsedDate.getTime())
    ? format(parsedDate, 'EEE, do MMMM yyyy')
    : 'Date unavailable';

  return (
    <Link
      href={`/e/blog/${slug}`}
      className='group block w-full cursor-pointer overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-lg'
    >
      <div className='relative aspect-video w-full overflow-hidden'>
        {image ? (
          <Image
            src={image}
            alt={title}
            width={600}
            height={400}
            className='h-full w-full object-cover'
            sizes='(max-width: 768px) 100vw, 300px'
          />
        ) : (
          <div
            className='h-full w-full object-cover'
            style={{
              background: fallbackGradient,
              width: '100%',
              height: '100%',
            }}
          />
        )}
      </div>
      <div className='p-6'>
        <div className='mb-3 flex items-center justify-between gap-4'>
          {/*{category && category.length > 0 && (
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium uppercase tracking-wider text-red-600">
              {category[0].name}
            </span>
          )}*/}
          <time className='text-sm text-gray-500'>
            {formattedDate}
          </time>
        </div>
        <h2 className='m-0 mb-2 line-clamp-3 text-xl font-bold leading-7 text-gray-900 transition-colors duration-200 ease-in-out group-hover:text-red-600'>
          {title}
        </h2>
        <p className='m-0 line-clamp-3 text-sm leading-6 text-gray-600'>{description}</p>
      </div>
    </Link>
  );
};
