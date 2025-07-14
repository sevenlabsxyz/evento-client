export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header skeleton */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      <div className="md:max-w-sm max-w-full mx-auto bg-white">
        {/* Cover image skeleton */}
        <div className="w-full h-64 bg-gray-200 animate-pulse" />
        
        <div className="px-4 pb-20 space-y-6">
          {/* Title skeleton */}
          <div className="pt-4 space-y-2">
            <div className="h-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse" />
          </div>

          {/* Date and location skeleton */}
          <div className="space-y-3">
            <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
            <div className="h-6 bg-gray-200 rounded w-2/3 animate-pulse" />
            <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
          </div>

          {/* Action buttons skeleton */}
          <div className="grid grid-cols-4 gap-2">
            <div className="h-16 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-16 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-16 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-16 bg-gray-200 rounded-xl animate-pulse" />
          </div>

          {/* Location section skeleton */}
          <div className="space-y-3">
            <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse" />
            <div className="h-32 bg-gray-200 rounded-xl animate-pulse" />
          </div>

          {/* Host section skeleton */}
          <div className="space-y-3">
            <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse" />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1 space-y-1">
                <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Content skeleton */}
          <div className="space-y-3">
            <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-4/5 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}