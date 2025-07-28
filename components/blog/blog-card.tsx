import { formatDistance, subDays } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import './blog-card.css';

export const BlogCard = ({
  date,
  slug,
  image,
  title,
  category,
  description,
}: any) => {
  // Fallback gradient if no image
  const fallbackGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

  return (
    <Link href={`/blog/${slug}`} className='BlogCard'>
      <div className='BlogCard-imageContainer'>
        {image ? (
          <Image
            src={image}
            alt={title}
            width={600}
            height={400}
            className='BlogCard-image'
            sizes='(max-width: 768px) 100vw, 300px'
          />
        ) : (
          <div
            className='BlogCard-image'
            style={{
              background: fallbackGradient,
              width: '100%',
              height: '100%',
            }}
          />
        )}
      </div>
      <div className='BlogCard-content'>
        <div className='BlogCard-header'>
          {category && category.length > 0 && (
            <span className='BlogCard-category'>{category[0].name}</span>
          )}
          <time className='BlogCard-date'>
            {formatDistance(subDays(new Date(date), 0), new Date(), {
              addSuffix: true,
            })}
          </time>
        </div>
        <h2 className='BlogCard-title'>{title}</h2>
        <p className='BlogCard-description'>{description}</p>
      </div>
    </Link>
  );
};
