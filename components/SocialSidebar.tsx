
import React from 'react';
import { SocialConfig } from '../types';

const APP_ICON = "https://cdn-icons-png.flaticon.com/512/3199/3199895.png";

type SocialPlatform = keyof SocialConfig;

interface SocialLinkItem {
  id: SocialPlatform;
  icon: React.ReactNode;
  label: string;
  color: string;
}

const SOCIAL_LINKS_BASE: SocialLinkItem[] = [
  { 
    id: 'instagram', 
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ), 
    label: 'Instagram', 
    color: 'hover:bg-gradient-to-tr hover:from-yellow-400 hover:to-purple-600', 
  },
  { 
    id: 'facebook', 
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ), 
    label: 'Facebook', 
    color: 'hover:bg-[#1877F2]', 
  },
  { 
    id: 'tiktok', 
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.536 0H9.592v16.142a2.259 2.259 0 0 1-2.259 2.259c-1.246 0-2.259-1.013-2.259-2.259s1.013-2.259 2.259-2.259c.218 0 .426.031.622.089V11.02a7.352 7.352 0 0 0-2.88-.588c-4.053 0-7.352 3.3-7.352 7.352S4.814 24 8.867 24c3.958 0 7.186-3.13 7.345-7.059V7.087c2.133 1.527 4.744 2.438 7.561 2.438V6.582a9.553 9.553 0 0 1-6.237-6.582z"/>
      </svg>
    ), 
    label: 'TikTok', 
    color: 'hover:bg-black', 
  },
  { 
    id: 'twitter', 
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
      </svg>
    ), 
    label: 'X', 
    color: 'hover:bg-gray-900', 
  },
  {
    id: 'youtube',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    label: 'YouTube',
    color: 'hover:bg-[#FF0000]',
  }
];

interface SocialSidebarProps {
  onInstall?: () => void;
  showInstall?: boolean;
  socialLinks?: SocialConfig;
}

export const SocialSidebar: React.FC<SocialSidebarProps> = ({ onInstall, showInstall, socialLinks }) => {
  
  const getUrl = (id: SocialPlatform) => {
    if (!socialLinks) return '#';
    // If the link exists but is just '#' or empty, don't show the icon at all
    const url = socialLinks[id];
    if (!url || url === '#' || url.trim() === '') return null;
    return url;
  };

  return (
    <>
      {/* Desktop Sidebar (Left) */}
      <div className="fixed left-6 top-1/2 -translate-y-1/2 z-[45] hidden lg:flex flex-col gap-4">
        {SOCIAL_LINKS_BASE.map((link, index) => {
          const url = getUrl(link.id);
          if (!url) return null;

          return (
            <a
              key={link.id}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
              className={`w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl border border-white/50 transition-all duration-300 hover:scale-110 hover:-translate-x-1 group ${link.color} hover:text-white animate-fade-in`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="transition-transform group-hover:rotate-12">
                {link.icon}
              </div>
              
              {/* Tooltip */}
              <div className="absolute left-14 bg-gray-900 text-white text-[10px] font-black px-3 py-1.5 rounded-xl opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all pointer-events-none uppercase tracking-widest whitespace-nowrap shadow-lg z-50 flex items-center">
                {link.label}
                <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-gray-900 transform rotate-45"></div>
              </div>
            </a>
          );
        })}
        
        {showInstall && (
          <button
            onClick={onInstall}
            className="w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl border-2 border-orange-400/50 hover:border-orange-500 transition-all duration-300 hover:scale-110 hover:-translate-x-1 group relative overflow-hidden animate-fade-in"
            style={{ animationDelay: `${SOCIAL_LINKS_BASE.length * 100}ms` }}
            aria-label="Instalar App"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-100 to-pink-100 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <img src={APP_ICON} alt="ELEMEDE" className="w-8 h-8 object-contain relative z-10 drop-shadow-sm animate-pulse" />
            
            <div className="absolute left-14 bg-gray-900 text-white text-[10px] font-black px-3 py-1.5 rounded-xl opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all pointer-events-none uppercase tracking-widest whitespace-nowrap shadow-xl z-50 flex items-center">
              Instalar App
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-gray-900 transform rotate-45"></div>
            </div>
          </button>
        )}
      </div>

      {/* Mobile Bar (Bottom Floating) */}
      <div className="fixed bottom-6 left-4 right-4 z-[45] flex lg:hidden flex-wrap items-center justify-center gap-3 bg-white/95 backdrop-blur-xl p-3 sm:p-4 rounded-[2rem] shadow-2xl border-2 border-orange-100/50 animate-fade-in mx-auto max-w-[420px]">
        {SOCIAL_LINKS_BASE.map((link) => {
          const url = getUrl(link.id);
          if (!url) return null;
          
          return (
            <a
              key={link.id}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex-shrink-0 flex items-center justify-center text-xl active:scale-90 transition-transform bg-gray-50 border border-gray-100 text-gray-700 shadow-sm hover:bg-gray-100"
            >
              {link.icon}
            </a>
          );
        })}
        
        {showInstall && (
          <button
              onClick={onInstall}
              className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gray-900 text-white shadow-lg active:scale-95 transition-all border border-gray-800"
              title="Crear Acceso Directo"
          >
              <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center border border-gray-200 shadow-sm p-0.5">
                  <img src={APP_ICON} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                  APP
              </span>
          </button>
        )}
      </div>
    </>
  );
};
