
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  SectorInfo, Business, UserAccount, SubscriptionFormData, 
  Invoice, Banner, DiscountCode, ForumQuestion, SupportTicket, 
  SystemFinancialConfig, SocialConfig, CountryCode, SectorDetails,
  ForumAnswer, Rating, Lead, PushCampaign, SubscriptionPack
} from './types';
import { 
  SECTORS, MOCK_BUSINESSES, MOCK_USERS, MOCK_BANNERS, 
  MOCK_DISCOUNT_CODES, MOCK_FORUM, MOCK_INVOICES, 
  DEFAULT_SOCIAL_LINKS, INITIAL_SYSTEM_FINANCIALS, COUNTRIES_DB,
  LEGAL_TEXTS, ALL_LEGAL_DOCS, SUBSCRIPTION_PACKS, MAX_SYSTEM_RADIUS, MOCK_LEADS
} from './constants';
import { getUserProvince, getSectorDetails, getSectorImage } from './services/geminiService';
import { fetchInitialData } from './services/supabase';

// Components
import { SectorCard } from './components/SectorCard';
import { BusinessShowcase } from './components/BusinessShowcase';
import { BusinessMap } from './components/BusinessMap';
import { AboutUs } from './components/AboutUs';
import { TopBusinesses } from './components/TopBusinesses';
import { NewSubscribersBanner } from './components/NewSubscribersBanner';
import { SectorDetailView } from './components/SectorDetailView';
import { SectorForum } from './components/SectorForum';
import { SocialSidebar } from './components/SocialSidebar';
import { MarketingOverlay } from './components/MarketingOverlay';
import { GeoLocationModal } from './components/GeoLocationModal';
import { MaintenanceScreen } from './components/MaintenanceScreen';
import { WelcomeSuccessBanner } from './components/WelcomeSuccessBanner';
import { InfoModal } from './components/InfoModal';
import { ContactModal } from './components/ContactModal';
import { BannerManager } from './components/BannerManager';
import { StoryRail } from './components/StoryRail'; 
import { EventRequestModal } from './components/EventRequestModal';
import { NotificationCenter } from './components/NotificationCenter'; 
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { SweetBattle } from './components/SweetBattle';

// Modals
import { AuthModal } from './components/AuthModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { BusinessProfileModal } from './components/BusinessProfileModal';
import { ProfileModal } from './components/ProfileModal';
import { AdminDashboard } from './components/AdminDashboard';

export const App = () => {
  // --- STATE ---
  const [users, setUsers] = useState<UserAccount[]>(MOCK_USERS);
  const [businesses, setBusinesses] = useState<Business[]>(MOCK_BUSINESSES);
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [banners, setBanners] = useState<Banner[]>(MOCK_BANNERS);
  const [coupons, setCoupons] = useState<DiscountCode[]>(MOCK_DISCOUNT_CODES);
  const [forumQuestions, setForumQuestions] = useState<ForumQuestion[]>(MOCK_FORUM);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [pushCampaigns, setPushCampaigns] = useState<PushCampaign[]>([]);
  
  // System Config (Lifted State)
  const [systemFinancials, setSystemFinancials] = useState<Record<CountryCode, SystemFinancialConfig>>(INITIAL_SYSTEM_FINANCIALS);
  const [socialLinks, setSocialLinks] = useState<SocialConfig>(DEFAULT_SOCIAL_LINKS);
  const [bannedWords, setBannedWords] = useState<string[]>([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [subscriptionPacks, setSubscriptionPacks] = useState<SubscriptionPack[]>(SUBSCRIPTION_PACKS);

  // User Session
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userProvince, setUserProvince] = useState<string>('Madrid');
  const [currentCountryCode, setCurrentCountryCode] = useState<CountryCode>('ES');

  // UI State
  const [activeSector, setActiveSector] = useState<string | null>(null);
  const [sectorDetails, setSectorDetails] = useState<SectorDetails | null>(null);
  const [isSectorLoading, setIsSectorLoading] = useState(false);
  const [sectorImageUrl, setSectorImageUrl] = useState<string | null>(null);
  const [isNotifCenterOpen, setIsNotifCenterOpen] = useState(false); 
  
  // PWA Install State
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  
  // Tag Filtering State
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const [mapCenterOverride, setMapCenterOverride] = useState<{ lat: number; lng: number } | null>(null);
  const [showGeoPrompt, setShowGeoPrompt] = useState(false);
  const [marketingBanner, setMarketingBanner] = useState<Banner | null>(null);
  const [welcomeData, setWelcomeData] = useState<{ name: string; plan: string } | null>(null);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [viewedBusiness, setViewedBusiness] = useState<Business | null>(null);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Footer/Info Modals State
  const [infoModalState, setInfoModalState] = useState<{ open: boolean; title: string; content: string }>({ open: false, title: '', content: '' });
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // --- SUPABASE INIT ---
  useEffect(() => {
    const loadData = async () => {
      const data = await fetchInitialData();
      if (data) {
        if (data.businesses.length > 0) setBusinesses(data.businesses);
        if (data.users.length > 0) {
            // Merge existing mock users (like admins) with real users
            const combinedUsers = [...MOCK_USERS.filter(u => u.role.startsWith('admin')), ...data.users];
            setUsers(combinedUsers);
        }
      }
    };
    loadData();
  }, []);

  // --- PWA INSTALLATION EVENT ---
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    
    // Show the install prompt
    installPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await installPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, throw it away
    setInstallPrompt(null);
  };

  // --- HELPERS ---
  const detectLocation = async (lat: number, lng: number) => {
    const province = await getUserProvince(lat, lng);
    setUserProvince(province);
    setCurrentCountryCode('ES'); 
  };

  const requestLocation = useCallback(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setMapCenterOverride(null);
          detectLocation(latitude, longitude);
        },
        () => console.warn("Geo blocked or denied"),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  // --- COMPUTED VALUES (CORE LOGIC) ---

  // STRICT FILTERING with AD SPEND PRIORITY
  const filteredSectorBusinesses = useMemo(() => {
    const refLat = userLocation?.lat || 40.4168;
    const refLng = userLocation?.lng || -3.7038;

    let pool = businesses.filter(b => b.status === 'active');

    // 1. Sector Filter
    if (activeSector) {
        pool = pool.filter(b => b.sectorId === activeSector);
    }

    // 2. Strict Radius Check
    pool = pool.filter(b => {
        const pack = subscriptionPacks.find(p => p.id === b.packId);
        if (!pack) return false;
        const dist = calculateDistance(refLat, refLng, b.lat, b.lng);
        return dist <= pack.visibilityRadius;
    });

    // 3. Tag Filtering
    if (selectedTags.length > 0) {
        pool = pool.filter(b => selectedTags.every(tag => b.tags?.includes(tag)));
    }

    // 4. Scoring & Sorting (AD SPEND -> PLAN -> DISTANCE)
    return pool.sort((a, b) => {
        // Priority 0: Total Ad Spend (Pay-to-Win Meritocracy)
        const spendA = a.totalAdSpend || 0;
        const spendB = b.totalAdSpend || 0;
        if (spendA !== spendB) return spendB - spendA;

        // Priority 1: Plan Tier
        const packA = subscriptionPacks.find(p => p.id === a.packId);
        const packB = subscriptionPacks.find(p => p.id === b.packId);
        const scoreA = packA?.sortingScore || 0;
        const scoreB = packB?.sortingScore || 0;
        if (scoreA !== scoreB) return scoreB - scoreA; 

        // Priority 2: Distance
        const distA = calculateDistance(refLat, refLng, a.lat, a.lng);
        const distB = calculateDistance(refLat, refLng, b.lat, b.lng);
        return distA - distB; 
    });

  }, [businesses, activeSector, userLocation, selectedTags, subscriptionPacks]);

  // ... (Effects for Geo, Sector Details, Banners preserved) ...
  useEffect(() => {
    const seen = localStorage.getItem('elemede_geo_prompt_seen');
    if (!seen) {
      setShowGeoPrompt(true);
    } else {
      if ("geolocation" in navigator && "permissions" in navigator) {
        navigator.permissions.query({ name: 'geolocation' as PermissionName })
          .then((result) => {
            if (result.state === 'granted') {
              requestLocation();
            }
          })
          .catch(() => {});
      }
    }
  }, [requestLocation]);

  useEffect(() => {
    if (activeSector) {
      setIsSectorLoading(true);
      setSectorImageUrl(null);
      setSelectedTags([]);
      
      const sectorLabel = SECTORS.find(s => s.id === activeSector)?.label || activeSector;
      
      const loadSectorData = async () => {
        try {
            const details = await getSectorDetails(sectorLabel);
            setSectorDetails(details);
            if (details.imagePrompt) {
                const img = await getSectorImage(details.imagePrompt);
                setSectorImageUrl(img);
            }
        } catch (error) {
            console.error("Error loading sector data", error);
        } finally {
            setIsSectorLoading(false);
        }
      };

      loadSectorData();
    } else {
      setSectorDetails(null);
      setSectorImageUrl(null);
      setSelectedTags([]);
    }
  }, [activeSector]);

  const handleGeoEnable = () => {
    setShowGeoPrompt(false);
    localStorage.setItem('elemede_geo_prompt_seen', 'true');
    setTimeout(() => {
        requestLocation();
    }, 100);
  };

  const handleLogin = (user: UserAccount) => {
    const existing = users.find(u => u.email === user.email);
    if (existing) {
        setCurrentUser(existing);
    } else {
        setUsers(prev => [...prev, user]);
        setCurrentUser(user);
    }
    
    // Check for any type of admin role to open dashboard
    if (user.role.startsWith('admin_') || user.role.includes('master')) {
        setIsAdminDashboardOpen(true);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsProfileModalOpen(false);
    setIsAdminDashboardOpen(false);
  };

  const handleSubscriptionSuccess = (data: SubscriptionFormData, generatedId: string) => {
    const mainLat = userLocation?.lat || 40.4168; 
    const mainLng = userLocation?.lng || -3.7038;

    const enrichedSedes = data.sedes.map(sede => ({
        ...sede,
        lat: mainLat + (Math.random() - 0.5) * 0.02,
        lng: mainLng + (Math.random() - 0.5) * 0.02
    }));

    const newBusiness: Business = {
        id: generatedId,
        name: data.nombreNegocio,
        sectorId: data.sectorId,
        packId: data.packId,
        billingCycle: data.billingCycle,
        nif: data.nif,
        phone: data.telefono,
        address: data.direccionPrincipal.calle,
        city: data.direccionPrincipal.ciudad,
        province: data.direccionPrincipal.provincia,
        cp: data.direccionPrincipal.cp,
        lat: mainLat,
        lng: mainLng,
        status: 'active',
        createdAt: new Date().toISOString(),
        direccionesAdicionales: enrichedSedes,
        images: [],
        tags: [],
        ratings: [],
        reliabilityScore: 50, 
        stats: { views: 0, clicks: 0, ctr: 0, saturationIndex: 0 },
        totalAdSpend: 0 // New metric init
    };

    const newUser: UserAccount = {
        id: `owner_${generatedId}`,
        name: data.nombre,
        email: data.email,
        password_hash: data.password || 'hashed',
        role: 'business_owner',
        status: 'active',
        date_registered: new Date().toISOString(),
        linkedBusinessId: generatedId,
        is_first_login: true
    };

    setBusinesses(prev => [...prev, newBusiness]);
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    setIsSubscriptionModalOpen(false);
    setWelcomeData({ name: newBusiness.name, plan: data.packId });
  };

  const handleUpdateBusiness = (id: string, updates: Partial<Business>) => {
    setBusinesses(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const handleUpdateUser = (updatedUser: UserAccount) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser?.id === updatedUser.id) setCurrentUser(updatedUser);
  };

  const handleAddQuestion = (q: ForumQuestion) => setForumQuestions(prev => [q, ...prev]);
  const handleDeleteQuestion = (id: string) => setForumQuestions(prev => prev.filter(q => q.id !== id));
  const handleReplyQuestion = (qId: string, answer: ForumAnswer) => {
      setForumQuestions(prev => prev.map(q => q.id === qId ? { ...q, answers: [...q.answers, answer] } : q));
  };

  const handleAddRating = (bizId: string, rating: Rating) => {
      setBusinesses(prev => prev.map(b => {
          if (b.id === bizId) {
              return { ...b, ratings: [...(b.ratings || []), rating] };
          }
          return b;
      }));
  };

  const handleNewLead = (lead: Lead) => {
      setLeads(prev => [lead, ...prev]);
      alert("¡Solicitud enviada! Los mejores profesionales de la zona han sido notificados.");
  };

  // --- NEW: HANDLE FLASH PUSH ---
  const handleNewPushCampaign = (campaign: PushCampaign) => {
      setPushCampaigns(prev => [campaign, ...prev]);
      // Also notify visually
      setIsNotifCenterOpen(true);
      setTimeout(() => setIsNotifCenterOpen(false), 5000);
  };

  // --- NEW: HANDLE BATTLE VOTE ---
  const handleBattleVote = (winnerId: string) => {
      // Simulate backend update for gamification
      setBusinesses(prev => prev.map(b => {
          if (b.id === winnerId) {
              return { ...b, battleWins: (b.battleWins || 0) + 1 };
          }
          return b;
      }));
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  const handleMaintenanceUnlock = () => {
      setIsAuthModalOpen(true); 
  };

  const openInfoModal = (title: string, content: string) => {
      setInfoModalState({ open: true, title, content });
  };

  return (
    <div className="min-h-screen bg-white font-brand text-gray-900 relative selection:bg-pink-200 selection:text-pink-900">
      
      {/* Background Icons Pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-[0.03] select-none">
          {/* ... Icons ... */}
          <div className="absolute top-[5%] left-[5%] text-9xl transform -rotate-12">🧁</div>
          <div className="absolute top-[60%] right-[20%] text-9xl transform rotate-12">🥨</div>
      </div>

      {/* --- COOKIE CONSENT BANNER (GDPR) --- */}
      <CookieConsentBanner />

      {/* GLOBAL MODALS */}
      {showGeoPrompt && <GeoLocationModal onEnable={handleGeoEnable} onSkip={() => { setShowGeoPrompt(false); localStorage.setItem('elemede_geo_prompt_seen', 'true'); }} />}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLogin={handleLogin} onOpenSubscription={() => { setIsAuthModalOpen(false); setIsSubscriptionModalOpen(true); }} />
      
      {/* Subscription Modal Now Receives Dynamic Pricing */}
      <SubscriptionModal isOpen={isSubscriptionModalOpen} onClose={() => setIsSubscriptionModalOpen(false)} onSuccess={handleSubscriptionSuccess} onInvoiceGenerated={(inv) => setInvoices(prev => [inv, ...prev])} existingBusinesses={businesses} existingUsers={users} currentCountry={COUNTRIES_DB.find(c => c.code === currentCountryCode)!} countryFinancials={systemFinancials[currentCountryCode]} subscriptionPacks={subscriptionPacks} />
      
      {isAdminDashboardOpen && currentUser && <AdminDashboard isOpen={isAdminDashboardOpen} onClose={() => setIsAdminDashboardOpen(false)} currentUser={currentUser} businesses={businesses} onUpdateBusiness={handleUpdateBusiness} users={users} onUpdateUser={handleUpdateUser} onUpdateUserStatus={(id, status) => setUsers(prev => prev.map(u => u.id === id ? { ...u, status } : u))} onDeleteUser={(id) => setUsers(prev => prev.filter(u => u.id !== id))} onDeleteBusiness={(id) => setBusinesses(prev => prev.filter(b => b.id !== id))} invoices={invoices} setInvoices={setInvoices} banners={banners} onUpdateBanners={setBanners} maintenanceMode={maintenanceMode} setMaintenanceMode={setMaintenanceMode} onLogout={handleLogout} onSwitchSession={setCurrentUser} tickets={tickets} onUpdateTicket={(id, updates) => setTickets(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))} bannedWords={bannedWords} setBannedWords={setBannedWords} coupons={coupons} setCoupons={setCoupons} forumQuestions={forumQuestions} onDeleteForumQuestion={handleDeleteQuestion} socialLinks={socialLinks} setSocialLinks={setSocialLinks} systemFinancials={systemFinancials} setSystemFinancials={setSystemFinancials} subscriptionPacks={subscriptionPacks} setSubscriptionPacks={setSubscriptionPacks} />}
      {currentUser && isProfileModalOpen && <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} user={currentUser} businesses={businesses} onUpdateUser={handleUpdateUser} onUpdateBusiness={handleUpdateBusiness} onLogout={handleLogout} invoices={invoices} onGenerateInvoice={(inv) => setInvoices(prev => [inv, ...prev])} coupons={coupons} tickets={tickets} onCreateTicket={(t) => setTickets(prev => [...prev, t])} systemConfig={systemFinancials[currentCountryCode]} leads={leads} onSendPush={handleNewPushCampaign} />}
      {viewedBusiness && <BusinessProfileModal isOpen={!!viewedBusiness} onClose={() => setViewedBusiness(null)} business={viewedBusiness} currentUser={currentUser} onAddRating={handleAddRating} onLoginRequest={() => { setViewedBusiness(null); setIsAuthModalOpen(true); }} />}
      {welcomeData && <WelcomeSuccessBanner businessName={welcomeData.name} planId={welcomeData.plan} onContinue={() => { setWelcomeData(null); setIsProfileModalOpen(true); }} />}
      {marketingBanner && <MarketingOverlay banner={marketingBanner} onClose={() => { sessionStorage.setItem(`seen_banner_${marketingBanner.id}`, 'true'); setMarketingBanner(null); }} onInterest={() => { if (marketingBanner.linkedBusinessId) { const biz = businesses.find(b => b.id === marketingBanner.linkedBusinessId); if (biz) setViewedBusiness(biz); } setMarketingBanner(null); }} />}
      <InfoModal isOpen={infoModalState.open} onClose={() => setInfoModalState({ ...infoModalState, open: false })} title={infoModalState.title} content={infoModalState.content} />
      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
      <EventRequestModal isOpen={isEventModalOpen} onClose={() => setIsEventModalOpen(false)} currentUser={currentUser} onSubmit={handleNewLead} onRequestLogin={() => { setIsEventModalOpen(false); setIsAuthModalOpen(true); }} />
      {maintenanceMode && !currentUser?.role.includes('admin') && !currentUser?.role.includes('master') && <MaintenanceScreen onUnlockAttempt={handleMaintenanceUnlock} />}
      
      {/* Social Sidebar with PWA Install Logic */}
      <SocialSidebar 
        showInstall={!!installPrompt} 
        onInstall={handleInstallApp} 
        socialLinks={socialLinks} 
      />
      
      {/* BANNER MANAGER POP-UPS */}
      <BannerManager 
        banners={banners} 
        businesses={businesses} 
        context="footer_sticky" 
        userLocation={userLocation} 
        onViewBusiness={(id) => setViewedBusiness(businesses.find(b => b.id === id) || null)} 
      />
      
      {/* UPDATED: Pass location and business data to NotificationCenter for geofencing */}
      <NotificationCenter 
        isOpen={isNotifCenterOpen} 
        onClose={() => setIsNotifCenterOpen(false)} 
        campaigns={pushCampaigns} 
        userLocation={userLocation}
        businesses={businesses}
      />

      {/* --- FLOATING EVENT BUTTON --- */}
      <button 
          onClick={() => setIsEventModalOpen(true)}
          className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[60] bg-gray-900 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform group flex items-center gap-0 hover:gap-3 overflow-hidden border-4 border-white"
      >
          <span className="text-2xl">🎉</span>
          <span className="max-w-0 group-hover:max-w-xs transition-all duration-500 overflow-hidden font-black text-xs uppercase tracking-widest whitespace-nowrap">
              Organizar Evento
          </span>
      </button>

      {/* --- HEADER --- */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-orange-50 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveSector(null)}>
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">E</div>
                <h1 className="text-2xl font-brand font-black text-gray-900 tracking-tighter hidden sm:block">ELEMEDE</h1>
            </div>

            <div className="flex items-center gap-4">
                {/* NOTIFICATION BELL */}
                <button 
                    onClick={() => setIsNotifCenterOpen(!isNotifCenterOpen)}
                    className="relative p-2 text-gray-500 hover:text-orange-600 transition-colors"
                >
                    <span className="text-xl">🔔</span>
                    {pushCampaigns.length > 0 && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                    )}
                </button>

                {currentUser ? (
                    <div className="flex items-center gap-3">
                        {currentUser.role.includes('admin') || currentUser.role.includes('master') ? (
                            <button onClick={() => setIsAdminDashboardOpen(true)} className="bg-gray-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all">Admin Core</button>
                        ) : (
                            <button onClick={() => setIsProfileModalOpen(true)} className="flex items-center gap-2 bg-gray-100 hover:bg-orange-50 px-4 py-2 rounded-xl transition-all">
                                <div className="w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center text-[10px] font-black text-orange-700">{currentUser.name[0]}</div>
                                <span className="text-xs font-bold text-gray-700 hidden md:block">{currentUser.name}</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <button onClick={() => setIsAuthModalOpen(true)} className="text-gray-500 font-bold text-xs hover:text-gray-900 transition-colors">Entrar</button>
                        <button onClick={() => setIsSubscriptionModalOpen(true)} className="bg-orange-600 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-700 transition-all shadow-lg active:scale-95">Únete</button>
                    </>
                )}
            </div>
        </div>
      </header>

      {/* --- STORY RAIL (INSTAGRAM STYLE) --- */}
      <StoryRail 
          businesses={businesses} 
          onViewBusiness={(id) => setViewedBusiness(businesses.find(b => b.id === id) || null)} 
          sectorFilter={activeSector}
      />

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-16">
        
        {/* 1. PRESENTATION (HERO) */}
        {!activeSector && (
            <section className="text-center space-y-6 py-20 md:py-28 relative bg-gradient-to-b from-orange-100/50 via-pink-100/30 to-white/0 rounded-[4rem] mx-2 sm:mx-8 shadow-sm border border-orange-50/50 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-orange-200/30 to-pink-200/30 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>
                
                {/* Floating Sector Icons */}
                <div className="absolute top-10 left-10 text-6xl opacity-20 animate-bounce delay-100 hidden md:block">🧁</div>
                <div className="absolute bottom-10 right-10 text-6xl opacity-20 animate-bounce delay-300 hidden md:block">🍰</div>

                <h2 className="text-4xl md:text-6xl lg:text-7xl font-brand font-black text-gray-900 tracking-tighter leading-tight relative z-10">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">Elemede</span>
                </h2>
                <p className="text-lg md:text-xl text-gray-600 font-medium max-w-2xl mx-auto relative z-10">
                    Un mundo dulce a un solo click.
                </p>

                {/* HOME BANNERS */}
                <div className="max-w-4xl mx-auto mt-8 px-4">
                    <BannerManager 
                        banners={banners} 
                        businesses={businesses} 
                        context="home" 
                        userLocation={userLocation}
                        maxBanners={1}
                        onViewBusiness={(id) => setViewedBusiness(businesses.find(b => b.id === id) || null)} 
                    />
                </div>
            </section>
        )}

        {/* 2. SECTOR NAVIGATION */}
        <section>
            {!activeSector && <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest mb-8 text-center">Explora por Categoría</h3>}
            <div className={`grid gap-4 transition-all duration-500 ${activeSector ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'}`}>
                {activeSector ? (
                    <div className="flex items-center gap-4 mb-8">
                        <button onClick={() => setActiveSector(null)} className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">←</button>
                        <h2 className="text-3xl font-black text-gray-900 uppercase italic">{SECTORS.find(s => s.id === activeSector)?.label}</h2>
                    </div>
                ) : (
                    SECTORS.map(sector => (
                        <SectorCard 
                            key={sector.id} 
                            sector={sector} 
                            isActive={activeSector === sector.id} 
                            onClick={() => setActiveSector(sector.id)} 
                        />
                    ))
                )}
            </div>
        </section>

        {/* ACTIVE SECTOR CONTENT */}
        {activeSector && (
            <div className="space-y-16 animate-fade-in">
                {sectorDetails && <SectorDetailView sector={SECTORS.find(s => s.id === activeSector)!} details={sectorDetails} imageUrl={sectorImageUrl} isLoading={isSectorLoading} />}

                {/* TAGS FILTER */}
                <div className="py-6 border-y border-orange-50">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Refinar Búsqueda</h4>
                        <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">{filteredSectorBusinesses.length} Resultados</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {SECTORS.find(s => s.id === activeSector)?.tags?.map((tag, idx) => (
                            <button key={idx} onClick={() => toggleTag(tag)} className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${selectedTags.includes(tag) ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200'}`}>{selectedTags.includes(tag) ? '✓ ' : ''}{tag}</button>
                        ))}
                    </div>
                </div>

                <div className="h-[400px] w-full rounded-[2.5rem] overflow-hidden shadow-xl border-4 border-white relative z-10">
                    <BusinessMap businesses={filteredSectorBusinesses} center={userLocation || { lat: 40.4168, lng: -3.7038 }} radius={MAX_SYSTEM_RADIUS} onViewBusiness={(id) => setViewedBusiness(businesses.find(b => b.id === id) || null)} userLocation={userLocation || undefined} />
                </div>

                <div className="space-y-8">
                    <h3 className="text-3xl font-brand font-black text-gray-900 text-center uppercase italic">Los Mejores en tu Radio</h3>
                    <BusinessShowcase businesses={filteredSectorBusinesses} userLocation={userLocation} currentRadius={MAX_SYSTEM_RADIUS} onViewBusiness={(id) => setViewedBusiness(businesses.find(b => b.id === id) || null)} currentUser={currentUser} onToggleFavorite={(id) => { if (!currentUser) return setIsAuthModalOpen(true); const newFavs = currentUser.favorites?.includes(id) ? currentUser.favorites.filter(f => f !== id) : [...(currentUser.favorites || []), id]; handleUpdateUser({ ...currentUser, favorites: newFavs }); }} />
                    <div className="max-w-4xl mx-auto">
                        <BannerManager 
                            businesses={businesses} 
                            banners={banners} 
                            context="business_list" 
                            userLocation={userLocation} 
                            activeSectorId={activeSector} 
                            onViewBusiness={(id) => setViewedBusiness(businesses.find(b => b.id === id) || null)}
                        />
                    </div>
                </div>

                <NewSubscribersBanner businesses={businesses.filter(b => b.sectorId === activeSector)} sectorLabel={SECTORS.find(s => s.id === activeSector)?.label || ''} onViewBusiness={(id) => setViewedBusiness(businesses.find(b => b.id === id) || null)} />
                {/* UPDATED: Pass bannedWords to Forum */}
                <SectorForum 
                    sector={SECTORS.find(s => s.id === activeSector)!} 
                    currentUser={currentUser} 
                    userProvince={userProvince} 
                    businesses={businesses} 
                    questions={forumQuestions} 
                    onAddQuestion={handleAddQuestion} 
                    onDeleteQuestion={handleDeleteQuestion} 
                    onReply={handleReplyQuestion}
                    bannedWords={bannedWords}
                />
            </div>
        )}

        {/* HOME CONTENT */}
        {!activeSector && (
            <div className="space-y-20">
                <TopBusinesses businesses={filteredSectorBusinesses} isNational={false} userProvince={userProvince} onViewBusiness={(id) => setViewedBusiness(businesses.find(b => b.id === id) || null)} currentUser={currentUser} onToggleFavorite={(id) => { if (!currentUser) return setIsAuthModalOpen(true); const newFavs = currentUser.favorites?.includes(id) ? currentUser.favorites.filter(f => f !== id) : [...(currentUser.favorites || []), id]; handleUpdateUser({ ...currentUser, favorites: newFavs }); }} />
                
                {/* NEW: SWEET BATTLE COMPONENT */}
                <SweetBattle businesses={businesses} onVote={handleBattleVote} />

                <AboutUs />
                <section className="space-y-8 pb-10">
                    <div className="text-center space-y-4">
                        <h3 className="text-3xl font-brand font-black text-gray-900 uppercase italic">Mapa de Antojos</h3>
                        <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Encuentra todo lo que buscas en {(MAX_SYSTEM_RADIUS/1000).toFixed(2)}km</p>
                    </div>
                    <div className="space-y-6 pt-6 max-w-5xl mx-auto">
                        <div className="h-[450px] md:h-[600px] w-full rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white relative z-10 animate-fade-in">
                            <BusinessMap businesses={filteredSectorBusinesses} center={userLocation || { lat: 40.4168, lng: -3.7038 }} radius={MAX_SYSTEM_RADIUS} onViewBusiness={(id) => setViewedBusiness(businesses.find(b => b.id === id) || null)} userLocation={userLocation || undefined} />
                        </div>
                    </div>
                </section>
            </div>
        )}
      </main>

      <footer className="bg-gray-950 text-white py-12 md:py-20 mt-20 rounded-t-[3rem] relative z-10">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-8">
            <div className="flex justify-center items-center gap-4 opacity-50 hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-xl font-black">E</div>
                <h4 className="text-2xl font-black uppercase tracking-widest">ELEMEDE</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                <button onClick={() => openInfoModal("Sobre Nosotros", "ELEMEDE es la plataforma definitiva que conecta el arte de la repostería con los amantes del dulce.")} className="hover:text-white transition-colors">Sobre Nosotros</button>
                <button onClick={() => setIsContactModalOpen(true)} className="hover:text-white transition-colors">Contacto</button>
                <button onClick={() => openInfoModal("Términos", ALL_LEGAL_DOCS)} className="hover:text-white transition-colors">Términos</button>
                <button onClick={() => openInfoModal("Privacidad", LEGAL_TEXTS.PRIVACY_POLICY)} className="hover:text-white transition-colors">Privacidad</button>
            </div>
            <div className="pt-8 border-t border-white/10">
                <p className="text-[10px] text-gray-600">© 2025 ELEMEDE (Lemesedelce). Todos los derechos reservados. Madrid, España.</p>
            </div>
        </div>
      </footer>
    </div>
  );
};
