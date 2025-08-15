import { formatDistance, subDays } from "date-fns";
import Image from "next/image";
import Link from "next/link";

export const BlogCard = ({
  date,
  slug,
  image,
  title,
  category,
  description,
}: any) => {
  // Fallback gradient if no image
  const fallbackGradient = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";

  return (
    <Link
      href={`/blog/${slug}`}
      className="block w-full mb-8 bg-white rounded-2xl overflow-hidden shadow-sm transition-all duration-300 ease-in-out cursor-pointer hover:shadow-lg hover:-translate-y-0.5 group"
    >
      <div className="relative w-full aspect-video overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={title}
            width={600}
            height={400}
            className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 300px"
          />
        ) : (
          <div
            className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
            style={{
              background: fallbackGradient,
              width: "100%",
              height: "100%",
            }}
          />
        )}
      </div>
      <div className="p-6">
        <div className="mb-3 flex items-center justify-between gap-4">
          {category && category.length > 0 && (
            <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider">
              {category[0].name}
            </span>
          )}
          <time className="text-sm text-gray-500">
            {formatDistance(subDays(new Date(date), 0), new Date(), {
              addSuffix: true,
            })}
          </time>
        </div>
        <h2 className="m-0 mb-2 text-xl font-bold leading-7 text-gray-900 transition-colors duration-200 ease-in-out group-hover:text-red-600 line-clamp-3">
          {title}
        </h2>
        <p className="m-0 text-base leading-6 text-gray-600 line-clamp-2">
          {description}
        </p>
      </div>
    </Link>
  );
};
