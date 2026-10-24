import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return <div className={`animate-pulse bg-gray-200 dark:bg-neutral-800 rounded ${className}`} />;
};

export const BookCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col bg-white dark:bg-neutral-800/80 rounded-xl overflow-hidden border border-gray-100 dark:border-neutral-700/60 p-3 shadow-sm">
      <Skeleton className="w-full aspect-[2/3] rounded-lg mb-3" />
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-3" />
      <div className="flex justify-between items-center mt-auto">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  );
};
