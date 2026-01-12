
import React from 'react';
import { Business } from '../types';

interface StoryRailProps {
  businesses: Business[];
  onViewBusiness: (id: string) => void;
  sectorFilter?: string | null;
}

export const StoryRail: React.FC<StoryRailProps> = ({ businesses, onViewBusiness, sectorFilter }) => {
  // Filter businesses that have active stories (within last 24h)
  const activeStories = businesses.filter(b => {
      if (!b.stories || b.stories.length === 0) return false;
      const latestStory = b.stories[0]; // Assuming sorted by new
      const now = new Date();
      return new Date(latestStory.expiresAt) > now;
  }).filter(b => sectorFilter ? b.sectorId === sectorFilter : true);

  if (activeStories.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto scrollbar-hide py-6 px-4 bg-white border-b border-orange-50 sticky top-[72px] z-40">
        <div className="flex gap-6 max-w-7xl mx-auto">
            {activeStories.map(biz => {
                const story = biz.stories![0];
                return (
                    <div 
                        key={biz.id} 
                        className="flex flex-col items-center gap-2 cursor-pointer group flex-shrink-0"
                        onClick={() => onViewBusiness(biz.id)}
                    >
                        <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full p-[3px] bg-gradient-to-tr from-yellow-400 via-orange-500 to-pink-600 shadow-md group-hover:scale-105 transition-transform">
                            <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-gray-100">
                                <img src={biz.mainImage} alt={biz.name} className="w-full h-full object-cover" />
                            </div>
                            {story.type === 'fresh_batch' && (
                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm text-xs">
                                    🔥
                                </div>
                            )}
                        </div>
                        <span className="text-[9px] font-black text-gray-600 uppercase tracking-tight truncate w-20 text-center">
                            {biz.name}
                        </span>
                    </div>
                );
            })}
        </div>
    </div>
  );
};
