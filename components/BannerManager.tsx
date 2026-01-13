
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
  onViewBusiness?: (id: string) => void; // NEW PROP for redirection
}

// --- INTERFACE FOR HISTORY TRACKING ---
interface UserBannerHistory {
    lastGlobalView: number;      // Timestamp of the LAST banner shown (any type)
    lastPlatformView: number;    // Timestamp of last internal/platform banner
    lastBusinessView: number;    // Timestamp of last business/paid banner
    platformViewsToday: number;  // Counter for daily limit (Max 10)
    dateString: string;          // To reset daily counters
    [bannerId: string]: any;     // Specific banner tracking
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
    PLATFORM_INTERVAL: 7 * 60 * 1000, // 7 Minutes
    BUSINESS_INTERVAL: 5 * 60 * 1000, // 5 Minutes
    GLOBAL_SATURATION_GAP: 2 * 60 * 1000, // Minimum 2 min gap between ANY banner to prevent annoyance
    MAX_PLATFORM_DAILY: 10
};

export const BannerManager: React.FC<BannerManagerProps> = ({ 
  banners, businesses, context, activeSectorId, userLocation, maxBanners = 1, className, onViewBusiness 
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
      const stored = localStorage.getItem('elemede_banner_engine');
      if (stored) {
          const parsed = JSON.parse(stored);
          // Check for day reset
          const today = new Date().toISOString().split('T')[0];
          if (parsed.dateString !== today) {
              parsed.platformViewsToday = 0;
              parsed.dateString = today;
          }
          setUserHistory(parsed);
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

      // Track individual banner to avoid repeating the exact same one immediately
      newHistory[banner.id] = { lastViewed: now };

      setUserHistory(newHistory);
      localStorage.setItem('elemede_banner_engine', JSON.stringify(newHistory));
  };

  const activeBanners = useMemo(() => {
    // If context is simple lists (inline), we bypass the complex timing logic 
    // and just show relevant banners based on simple rotation.
    if (context === 'business_list' || context === 'home') {
        return banners.filter(b => 
            b.status === 'active' && 
            b.position === (context === 'home' ? 'header' : 'inline_list') &&
            (!activeSectorId || !b.relatedSectorId || b.relatedSectorId === activeSectorId)
        ).slice(0, maxBanners);
    }

    // --- POP-UP / STICKY LOGIC (The Intervals) ---
    const now = Date.now();
    
    // 1. GLOBAL SATURATION CHECK (Traffic Cop)
    // If we showed ANY banner less than 2 mins ago, hold off.
    if ((now - userHistory.lastGlobalView) < TIMERS.GLOBAL_SATURATION_GAP) {
        return [];
    }

    // 2. FILTER CANDIDATES
    const validBanners = banners.filter(b => {
        if (b.status !== 'active') return false;
        if (closedBanners.includes(b.id)) return false;
        if (b.start_date && new Date(b.start_date).getTime() > now) return false;
        if (new Date(b.end_date).getTime() < now) return false;
        
        // Context mapping
        const isPopupPosition = b.position === 'popup' || b.position === 'footer';
        if (!isPopupPosition) return false;

        return true;
    });

    const businessCandidates = validBanners.filter(b => b.type === 'business_campaign' || !!b.linkedBusinessId);
    const platformCandidates = validBanners.filter(b => b.type !== 'business_campaign' && !b.linkedBusinessId);

    // 3. CHECK TIMERS & LIMITS
    const canShowBusiness = (now - userHistory.lastBusinessView) > TIMERS.BUSINESS_INTERVAL;
    
    const canShowPlatform = 
        (now - userHistory.lastPlatformView) > TIMERS.PLATFORM_INTERVAL && 
        userHistory.platformViewsToday < TIMERS.MAX_PLATFORM_DAILY;

    // 4. SELECTION LOGIC (Business Priority)
    let selected: Banner | null = null;

    // Priority to Business (Revenue)
    if (canShowBusiness && businessCandidates.length > 0) {
        // Find best business banner (closest or highest paying)
        selected = businessCandidates.sort((a, b) => {
            // Logic: Plan Score > Distance
            // (Simplified for this snippet)
            return 0.5 - Math.random(); 
        })[0];
    } 
    // Fallback to Platform if Business not ready or empty
    else if (canShowPlatform && platformCandidates.length > 0) {
        selected = platformCandidates.sort(() => 0.5 - Math.random())[0];
    }

    return selected ? [selected] : [];

  }, [banners, context, activeSectorId, userHistory, closedBanners, maxBanners]);

  // Effect to trigger recordView when a pop-up appears
  useEffect(() => {
      if (context === 'footer_sticky' && activeBanners.length > 0) {
          const banner = activeBanners[0];
          
          // Only record if we haven't just recorded it (prevent infinite loop in effect)
          // We check roughly if the last view was just now (within 100ms)
          const lastView = userHistory[banner.id]?.lastViewed || 0;
          if (Date.now() - lastView > 1000) {
             recordView(banner);
             // If it's a popup type, trigger the overlay
             if (banner.position === 'popup') {
                 setActiveOverlay(banner);
             }
          }
      }
  }, [activeBanners, context]);

  const handleClose = (id: string) => {
      setClosedBanners(prev => [...prev, id]);
      setActiveOverlay(null);
  };

  const handleOverlayAction = () => {
      if (!activeOverlay) return;
      
      // REDIRECTION LOGIC
      if (activeOverlay.linkedBusinessId && onViewBusiness) {
          onViewBusiness(activeOverlay.linkedBusinessId);
      }
      
      // Close overlay after action
      handleClose(activeOverlay.id);
  };

  if (activeBanners.length === 0 && !activeOverlay) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Full Screen Overlay if triggered */}
      {activeOverlay && (
          <MarketingOverlay 
              banner={activeOverlay} 
              onClose={() => handleClose(activeOverlay.id)} 
              onInterest={handleOverlayAction} // Pass the redirection handler
          />
      )}

      {/* Sticky/Inline Banners */}
      {activeBanners.map(banner => {
          // If it's a popup that is currently showing as overlay, don't double render
          if (activeOverlay && activeOverlay.id === banner.id) return null;

          return (
            <SmartBanner 
                key={banner.id} 
                banner={banner} 
                onClose={() => handleClose(banner.id)}
                onInteract={() => {
                    if (banner.linkedBusinessId && onViewBusiness) {
                        onViewBusiness(banner.linkedBusinessId);
                    }
                }}
            />
          );
      })}
    </div>
  );
};
