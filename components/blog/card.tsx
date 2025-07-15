import { formatDistance, subDays } from "date-fns";
import { Badge } from "../ui/badge";
import Image from "next/image";
import Link from "next/link";

export const BlogCard = ({
  date,
  slug,
  image,
  title,
  category,
  description,
}: any) => (
  <Link
    key={slug}
    href={`/blog/${slug}`}
    className="group mb-8 flex flex-col hover:cursor-pointer md:flex-row"
  >
    <Image
      src={image}
      alt={title}
      width={450}
      height={280}
      className="w-full md:w-[450px] md:h-[280px] md:min-h-[280px] md:min-w-[450px] object-cover md:rounded-2xl md:border md:shadow-md"
    />
    <div className="flex flex-col justify-center px-6 pt-4 md:pb-2 md:pl-8 md:pr-4 md:pt-2">
      <h2 className="mb-3 line-clamp-3 text-3xl font-medium group-hover:text-red-600">
        {title}
      </h2>
      <p className="line-clamp-3 text-lg text-gray-500 leading-6">
        {description}
      </p>
      <div className="mt-4 flex flex-row items-center justify-between">
        <p className="text-xs text-gray-400">
          {formatDistance(subDays(new Date(date), 0), new Date(), {
            addSuffix: true,
          })}
        </p>
        {category &&
          category.map((tag: any) => (
            <Badge
              key={tag.id}
              className={`mr-2 whitespace-nowrap px-3 py-1 text-sm group-hover:bg-red-600`}
            >
              {tag.name}
            </Badge>
          ))}
      </div>
    </div>
  </Link>
);
