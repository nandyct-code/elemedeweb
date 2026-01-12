
import React, { useMemo, useState, useEffect } from 'react';
import { Banner, Business, SubscriptionPackType } from '../types';
import { SmartBanner } from './SmartBanner';
import { SUBSCRIPTION_PACKS } from '../constants';

interface BannerManagerProps {
  banners: Banner[];
  businesses: Business[]; // Needed to check plan of linked business
  context: 'home' | 'sector_view' | 'business_list' | 'sidebar' | 'footer_sticky';
  activeSectorId?: string;
  userLocation?: { lat: number; lng: number } | null;
  maxBanners?: number;
  className?: string;
}

// User Interaction Tracking Interface
interface UserBannerHistory {
    lastGlobalBannerView: number; // Timestamp of the LAST time ANY banner was shown
    [bannerId: string]: any; // Specific banner history
}

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; 
};

// --- SPAWN RULES CONFIGURATION ---
const SPAWN_RULES = {
    '1_day': { maxDaily: 3, cooldownHours: 0 },
    '7_days': { maxDaily: 1, cooldownHours: 24 },
    '14_days': { maxDaily: 1, cooldownHours: 48 },
    'boost': { maxDaily: 5, cooldownHours: 1 }, // High frequency
};

// --- GLOBAL SATURATION CONTROL ---
// Updated to 7 minutes (420 seconds) cycle
const GLOBAL_COOLDOWN_SECONDS = 420; 

export const BannerManager: React.FC<BannerManagerProps> = ({ 
  banners, businesses, context, activeSectorId, userLocation, maxBanners = 1, className 
}) => {
  const [closedBanners, setClosedBanners] = useState<string[]>([]);
  const [userHistory, setUserHistory] = useState<UserBannerHistory>({ lastGlobalBannerView: 0 });

  // Load User History on Mount (PERSISTENT VISIBILITY)
  useEffect(() => {
      const stored = localStorage.getItem('elemede_banner_history');
      if (stored) {
          setUserHistory(JSON.parse(stored));
      }
  }, []);

  // Update History Helper
  const recordView = (bannerId: string) => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentData = userHistory[bannerId] || { lastViewed: 0, dailyViews: 0, dateString: todayStr };

      // Reset if new day
      if (currentData.dateString !== todayStr) {
          currentData.dailyViews = 0;
          currentData.dateString = todayStr;
      }

      const newData = {
          ...currentData,
          lastViewed: now.getTime(),
          dailyViews: currentData.dailyViews + 1
      };

      const updatedHistory = { 
          ...userHistory, 
          [bannerId]: newData,
          lastGlobalBannerView: now.getTime() // Update global timestamp
      };
      
      setUserHistory(updatedHistory);
      localStorage.setItem('elemede_banner_history', JSON.stringify(updatedHistory));
  };

  const activeBanners = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const isPeakHour = (currentHour >= 10 && currentHour <= 12) || (currentHour >= 18 && currentHour <= 21);
    const todayStr = now.toISOString().split('T')[0];

    // --- GLOBAL SATURATION CHECK ---
    // If ANY banner was shown recently, don't show another one yet.
    // This prevents multiple banners stacking up if user navigates quickly.
    const secondsSinceLastGlobal = (now.getTime() - (userHistory.lastGlobalBannerView || 0)) / 1000;
    if (secondsSinceLastGlobal < GLOBAL_COOLDOWN_SECONDS && context !== 'business_list') {
        // Exception: 'business_list' context usually allows inline banners as they are less intrusive
        // For footer/popups, we strictly enforce the delay.
        return []; 
    }

    // 1. FILTERING ELIGIBLE BANNERS
    let eligible = banners.filter(b => {
        // Date Check
        if (b.start_date && new Date(b.start_date) > now) return false;
        if (new Date(b.end_date) < now) return false;
        if (b.status !== 'active') return false;
        if (closedBanners.includes(b.id)) return false;

        // Position/Format Context Check
        if (context === 'home' && b.position !== 'header') return false;
        if (context === 'sidebar' && b.position !== 'sidebar') return false;
        // Map 'popup' position to footer_sticky context for rendering purposes in this demo architecture
        if (context === 'footer_sticky' && (b.position !== 'footer' && b.position !== 'popup')) return false;
        if (context === 'business_list' && b.position !== 'inline_list') return false;

        // Sector Check (if applicable)
        if (activeSectorId && b.relatedSectorId && b.relatedSectorId !== activeSectorId) return false;

        // Location Check (Strict for business campaigns)
        if (b.type === 'business_campaign' && b.linkedBusinessId && b.targetingRadius && userLocation) {
            const biz = businesses.find(bz => bz.id === b.linkedBusinessId);
            if (biz) {
                const dist = calculateDistance(userLocation.lat, userLocation.lng, biz.lat, biz.lng);
                if (dist > b.targetingRadius) return false;
            }
        }

        // --- ALGORITHMIC SPAWN CONTROL CHECK ---
        const history = userHistory[b.id];
        
        // Find Plan for overrides
        let planId = 'basic';
        if (b.linkedBusinessId) {
            const biz = businesses.find(bz => bz.id === b.linkedBusinessId);
            if (biz) planId = biz.packId;
        }

        // DOMINIO (Super Top) Bypass Logic: Always show if constraints met (Subject to Global Cooldown)
        if (planId === 'super_top') return true; 

        if (history) {
            // Determine Rules based on Spawn Type (default to 7 days logic if undefined)
            const type = b.spawnType || '7_days';
            const rules = SPAWN_RULES[type] || SPAWN_RULES['7_days'];

            // 1. Cooldown Check
            const hoursSinceLastView = (now.getTime() - history.lastViewed) / (1000 * 60 * 60);
            if (hoursSinceLastView < rules.cooldownHours) return false;

            // 2. Frequency Cap Check
            // Reset daily views logic if date changed (handled in recordView but double checked here for read)
            const viewsToday = history.dateString === todayStr ? history.dailyViews : 0;
            if (viewsToday >= rules.maxDaily) return false;
        }

        return true;
    });

    // 2. SCORING & SORTING (The Priority System)
    // Formula: (PlanScore * 100) + (TypeScore * 10) + ProximityBonus + PeakHourBonus
    eligible = eligible.map(b => {
        let score = 0;
        
        // Plan Score
        if (b.linkedBusinessId) {
            const biz = businesses.find(bz => bz.id === b.linkedBusinessId);
            if (biz) {
                const pack = SUBSCRIPTION_PACKS.find(p => p.id === biz.packId);
                score += (pack?.sortingScore || 0) * 100;
                
                // Peak Hour Bonus for Local/Crecimiento to ensure rotation
                if (isPeakHour && (biz.packId === 'basic' || biz.packId === 'medium')) {
                    score += 25; 
                }
            }
        } else {
            // Sector campaigns have high base score to ensure they appear
            score += 250; 
        }

        // Subtype Score
        switch(b.subtype) {
            case 'exclusive': score += 50; break; // Plan Dominio feature
            case 'featured': score += 40; break;
            case 'offer': score += 30; break;
            case 'seasonality': score += 25; break;
            default: score += 10;
        }

        // Proximity Bonus (Inverse distance)
        if (b.linkedBusinessId && userLocation) {
            const biz = businesses.find(bz => bz.id === b.linkedBusinessId);
            if (biz) {
                const dist = calculateDistance(userLocation.lat, userLocation.lng, biz.lat, biz.lng);
                if (dist < 2) score += 60; // Hyper local < 2km
                else if (dist < 5) score += 30; // Local < 5km
            }
        }

        return { ...b, calculatedScore: score };
    }).sort((a: any, b: any) => b.calculatedScore - a.calculatedScore); // Descending

    // 3. SELECTION (Apply Max Limit)
    return eligible.slice(0, maxBanners);

  }, [banners, businesses, context, activeSectorId, userLocation, closedBanners, userHistory]);

  // Record views for the selected banners once they are rendered
  useEffect(() => {
      if (activeBanners.length > 0) {
          activeBanners.forEach(b => recordView(b.id));
      }
  }, [activeBanners.map(b => b.id).join(',')]); // Depend only on IDs changing

  if (activeBanners.length === 0) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      {activeBanners.map(banner => (
        <SmartBanner 
            key={banner.id} 
            banner={banner} 
            onClose={() => setClosedBanners(prev => [...prev, banner.id])}
        />
      ))}
    </div>
  );
};
