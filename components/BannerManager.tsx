
import React, { useMemo, useState, useEffect } from 'react';
import { Banner, Business } from '../types';
import { SmartBanner } from './SmartBanner';
import { MarketingOverlay } from './MarketingOverlay';
import { SUBSCRIPTION_PACKS } from '../constants';

interface BannerManagerProps {
  banners: Banner[];
  businesses: Business[];
  context: 'home' | 'sector_view' | 'business_list' | 'sidebar' | 'footer_sticky';
  activeSectorId?: string;
  userLocation?: { lat: number; lng: number } | null;
  maxBanners?: number;
  className?: string;
  onViewBusiness?: (id: string) => void;
  onSelectSector?: (sectorId: string) => void; // NEW PROP for sector redirection
}

// --- INTERFACE FOR HISTORY TRACKING ---
interface UserBannerHistory {
    lastGlobalView: number;      
    lastPlatformView: number;    
    lastBusinessView: number;    
    platformViewsToday: number;  
    dateString: string;          
    [bannerId: string]: any;     
}

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; 
};

// --- CONFIGURATION RULES ---
const TIMERS = {
    PLATFORM_INTERVAL: 7 * 60 * 1000, 
    BUSINESS_INTERVAL: 5 * 60 * 1000, 
    GLOBAL_SATURATION_GAP: 2 * 60 * 1000,
    MAX_PLATFORM_DAILY: 10
};

export const BannerManager: React.FC<BannerManagerProps> = ({ 
  banners, businesses, context, activeSectorId, userLocation, maxBanners = 1, className, onViewBusiness, onSelectSector 
}) => {
  const [closedBanners, setClosedBanners] = useState<string[]>([]);
  const [activeOverlay, setActiveOverlay] = useState<Banner | null>(null);
  
  const [userHistory, setUserHistory] = useState<UserBannerHistory>({ 
      lastGlobalView: 0,
      lastPlatformView: 0,
      lastBusinessView: 0,
      platformViewsToday: 0,
      dateString: new Date().toISOString().split('T')[0]
  });

  // 1. Load History on Mount
  useEffect(() => {
      try {
          const stored = localStorage.getItem('elemede_banner_engine');
          if (stored) {
              const parsed = JSON.parse(stored);
              const today = new Date().toISOString().split('T')[0];
              if (parsed.dateString !== today) {
                  parsed.platformViewsToday = 0;
                  parsed.dateString = today;
              }
              setUserHistory(parsed);
          }
      } catch (e) {
          console.error("Banner history corrupted, resetting.");
          localStorage.removeItem('elemede_banner_engine');
      }
  }, []);

  // 2. Persist History Helper
  const recordView = (banner: Banner) => {
      const now = Date.now();
      const isBusiness = banner.type === 'business_campaign' || !!banner.linkedBusinessId;
      
      const newHistory = { ...userHistory };
      newHistory.lastGlobalView = now;
      
      if (isBusiness) {
          newHistory.lastBusinessView = now;
      } else {
          newHistory.lastPlatformView = now;
          newHistory.platformViewsToday += 1;
      }

      newHistory[banner.id] = { lastViewed: now };

      setUserHistory(newHistory);
      localStorage.setItem('elemede_banner_engine', JSON.stringify(newHistory));
  };

  const activeBanners = useMemo(() => {
    const now = Date.now();

    // 1. FILTER CANDIDATES (Global Rules)
    const validBanners = banners.filter(b => {
        if (b.status !== 'active') return false;
        if (closedBanners.includes(b.id)) return false;
        if (b.start_date && new Date(b.start_date).getTime() > now) return false;
        if (new Date(b.end_date).getTime() < now) return false;
        
        // --- LOCATION LOGIC (CRITICAL UPDATE) ---
        
        // A. Business Campaigns: STRICT LOCAL VISIBILITY
        if (b.type === 'business_campaign' || b.linkedBusinessId) {
            // Must have user location to show local business ads
            if (!userLocation) return false; 

            // Find the business to get coordinates
            const biz = businesses.find(business => business.id === b.linkedBusinessId);
            if (!biz) return false;

            // Check Radius (Targeting Radius or Default 10km for ads)
            const dist = calculateDistance(userLocation.lat, userLocation.lng, biz.lat, biz.lng);
            const maxRadius = b.targetingRadius || 10; // km

            if (dist > maxRadius) return false; // Out of zone
        }

        // B. Platform/Sector Campaigns: NATIONAL VISIBILITY (Default)
        // No distance check required, they show everywhere in the header context.

        // Context mapping
        if (context === 'home') {
             // Home Header accepts: 
             // 1. Platform Banners (National)
             // 2. Business Banners (Local Popups)
             return b.position === 'header' || b.position === 'popup';
        }
        
        if (context === 'footer_sticky') {
            return b.position === 'popup' || b.position === 'footer';
        }

        // List/Inline Context
        return b.position === 'inline_list';
    });

    // If context is simple lists, just return valid ones
    if (context === 'business_list') {
        return validBanners.filter(b => 
            (!activeSectorId || !b.relatedSectorId || b.relatedSectorId === activeSectorId)
        ).slice(0, maxBanners);
    }

    // --- POP-UP LOGIC FOR HOME/FOOTER ---
    
    // Global Traffic Cop
    if ((now - userHistory.lastGlobalView) < TIMERS.GLOBAL_SATURATION_GAP) {
        return []; 
    }

    const businessCandidates = validBanners.filter(b => b.type === 'business_campaign' || !!b.linkedBusinessId);
    const platformCandidates = validBanners.filter(b => b.type !== 'business_campaign' && !b.linkedBusinessId);

    const canShowBusiness = (now - userHistory.lastBusinessView) > TIMERS.BUSINESS_INTERVAL;
    const canShowPlatform = (now - userHistory.lastPlatformView) > TIMERS.PLATFORM_INTERVAL;

    let selected: Banner | null = null;

    // Priority Logic:
    // 1. Business Popup (Revenue) - Only if in zone (already filtered)
    if (canShowBusiness && businessCandidates.length > 0) {
        selected = businessCandidates[Math.floor(Math.random() * businessCandidates.length)];
    } 
    // 2. Platform Campaign (National)
    else if (canShowPlatform && platformCandidates.length > 0) {
        selected = platformCandidates[Math.floor(Math.random() * platformCandidates.length)];
    }

    // If context is HOME HEADER, we might want to show a platform banner statically
    // while the popup logic runs separately. 
    // For this implementation, 'home' context returns the static header banner,
    // while 'footer_sticky' manages the aggressive popups.
    
    if (context === 'home') {
        // Just return the best static header banner (Platform National)
        // If there is a local business banner that fits 'header' position, show it too.
        return validBanners.filter(b => b.position === 'header').slice(0, maxBanners);
    }

    return selected ? [selected] : [];

  }, [banners, context, activeSectorId, userHistory, closedBanners, maxBanners, userLocation, businesses]);

  // Effect to trigger recordView when a pop-up appears via footer_sticky context
  useEffect(() => {
      if (context === 'footer_sticky' && activeBanners.length > 0) {
          const banner = activeBanners[0];
          const lastView = userHistory[banner.id]?.lastViewed || 0;
          
          if (Date.now() - lastView > 1000) {
             recordView(banner);
             // Trigger Overlay if it's a popup or a business campaign in home/footer
             if (banner.position === 'popup' || (banner.type === 'business_campaign')) {
                 setActiveOverlay(banner);
             }
          }
      }
  }, [activeBanners, context]);

  const handleClose = (id: string) => {
      setClosedBanners(prev => [...prev, id]);
      setActiveOverlay(null);
  };

  const handleInteraction = (banner: Banner) => {
      // 1. Business Redirection
      if (banner.linkedBusinessId && onViewBusiness) {
          onViewBusiness(banner.linkedBusinessId);
      }
      // 2. Sector Redirection
      else if (banner.relatedSectorId && onSelectSector) {
          onSelectSector(banner.relatedSectorId);
      }
      
      // Close overlay if it was open
      if (activeOverlay && activeOverlay.id === banner.id) {
          handleClose(banner.id);
      }
  };

  if (activeBanners.length === 0 && !activeOverlay) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Full Screen Overlay */}
      {activeOverlay && (
          <MarketingOverlay 
              banner={activeOverlay} 
              onClose={() => handleClose(activeOverlay.id)} 
              onInterest={() => handleInteraction(activeOverlay)} 
          />
      )}

      {/* Sticky/Inline Banners */}
      {activeBanners.map(banner => {
          if (activeOverlay && activeOverlay.id === banner.id) return null;

          return (
            <SmartBanner 
                key={banner.id} 
                banner={banner} 
                onClose={() => handleClose(banner.id)}
                onInteract={() => handleInteraction(banner)}
            />
          );
      })}
    </div>
  );
};
