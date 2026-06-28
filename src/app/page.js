'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';

const API_BASE = 'http://localhost:3001';

const Icons = {
  dashboard: (className = "") => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  ),
  scraper: (className = "") => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
  ),
  contacts: (className = "") => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  campaigns: (className = "") => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
  ),
  edit: (className = "") => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
  ),
  save: (className = "") => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
  ),
  check: (className = "") => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12"/></svg>
  ),
  x: (className = "") => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  ),
  trash: (className = "") => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
  ),
  phone: (className = "") => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
  ),
  plus: (className = "") => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
  ),
  info: (className = "") => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
  ),
  sync: (className = "") => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.72 2.78L21 8"/><polyline points="21 3 21 8 16 8"/></svg>
  ),
  alertTriangle: (className = "") => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  ),
  link: (className = "") => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
  )
};

const DEFAULT_INTRO = `Hey {{business_name}}! 👋

I noticed your business profile on Google Maps in {{location}}.

Since everyone searches online now, having a website is crucial to establish trust, attract direct clients, and avoid heavy third-party middleman commissions.

We build premium custom websites and can set up yours for just ₹999 in 2 days! 🚀

Would you like me to send over a few demo previews to show you what we can do?`;

const DEFAULT_FOLLOWUP = `Hey {{business_name}}! 👋

Just following up to see if you received my previous message.

Since most customers search online first, having a modern website is crucial to establish your brand, attract direct clients, and increase sales.

Our team designs custom, fast-loading websites, and we can set up your online presence for just ₹999 within 2 days! 🚀

Would you like us to share a few design previews with you to show you what we can do?`;

const SEED_TEMPLATES = {
  "general": {
    "introTemplate": "Hey {{business_name}}! 👋\n\nI noticed your business profile on Google Maps in {{location}}.\n\nSince everyone searches online now, having a website is crucial to establish trust, attract direct clients, and avoid heavy third-party middleman commissions.\n\nWe build premium custom websites and can set up yours for just ₹999 in 2 days! 🚀\n\nWould you like me to send over a few demo previews to show you what we can do?",
    "followupTemplate": "Hey {{business_name}}! 👋\n\nJust following up to see if you received my previous message.\n\nSince most customers search online first, having a modern website is crucial to establish your brand, attract direct clients, and increase sales.\n\nOur team designs custom, fast-loading websites, and we can set up your online presence for just ₹999 within 2 days! 🚀\n\nWould you like us to share a few design previews with you to show you what we can do?"
  },
  "restaurants": {
    "introTemplate": "Hey {{business_name}}! 👋\n\nI noticed you have a great restaurant listing on Google Maps in {{location}}.\n\nSince everyone is ordering online now, having your own website is essential to get direct orders and avoid paying heavy commissions to Swiggy/Zomato.\n\nWe build custom ordering/menu websites and can set up yours for just ₹999 in 2 days! 🚀\n\nWould you like me to send over a few demo previews to show you what we can do?",
    "followupTemplate": "Hey {{business_name}}! 👋\n\nJust following up to see if you received my previous message.\n\nHaving a digital menu and ordering platform is crucial to attract local foodies and capture direct sales with zero middleman commission.\n\nWe can launch your premium custom restaurant website in just 2 days for only ₹999! 🚀\n\nWould you be open to checking out a few demo designs to see how it looks?"
  },
  "clinics": {
    "introTemplate": "Hello {{business_name}}! 👋\n\nI saw your medical clinic profile on Google Maps in {{location}}.\n\nHaving your own professional website is essential to manage appointments smoothly, establish patient trust, and avoid paying booking platform commissions.\n\nWe build custom clinic booking websites and can set up yours for just ₹999 in 2 days! 🚀\n\nWould you like me to send over a few demo previews to show you what we can do?",
    "followupTemplate": "Hello {{business_name}}! 👋\n\nJust following up to see if you received my previous message.\n\nGive your patients a seamless way to book appointments while keeping your clinic reception organized and completely under your own brand.\n\nWe can launch your custom clinic-booking website in just 2 days for only ₹999! 🚀\n\nWould you be open to checking out a few layout previews to see how it works?"
  },
  "salons": {
    "introTemplate": "Hey {{business_name}}! 👋\n\nI saw your salon profile on Google Maps in {{location}}.\n\nHaving a website with direct appointment booking is crucial to fill your calendar, showcase hair/beauty styles, and build client trust without third-party fees.\n\nWe build premium salon booking websites and can set up yours for just ₹999 in 2 days! 🚀\n\nWould you like me to send over a few demo previews to show you what we can do?",
    "followupTemplate": "Hey {{business_name}}! 👋\n\nJust following up to see if you received my previous message.\n\nHaving a professional online booking portal is essential to attract new clients and manage schedules easily with zero platform fees.\n\nWe can build your salon's direct booking portal and services catalog in just 2 days for only ₹999! 🚀\n\nWould you like to take a look at a few demo scheduling pages we designed?"
  },
  "clothing shops": {
    "introTemplate": "Hey {{business_name}}! 👋\n\nI saw your clothing shop listing on Google Maps in {{location}}.\n\nHaving a digital catalog website is essential today to showcase your collections, attract local walk-ins, and secure direct sales without paying online marketplace commissions.\n\nWe build custom fashion catalog websites and can set up yours for just ₹999 in 2 days! 🚀\n\nWould you like me to send over a few demo previews to show you what we can do?",
    "followupTemplate": "Hey {{business_name}}! 👋\n\nJust following up to see if you received my previous message.\n\nHaving a modern digital showroom is crucial for clothing boutiques to display new arrivals and drive foot traffic directly.\n\nWe can launch your digital shop catalog and ordering system in just 2 days for only ₹999! 🚀\n\nWould you like us to share a few design previews to show you how it looks?"
  },
  "electronics shops": {
    "introTemplate": "Hey {{business_name}}! 👋\n\nI saw your electronics shop profile on Google Maps in {{location}}.\n\nHaving a digital showroom website is essential today to display specifications, handle quotation requests, and build client trust without third-party marketplace fees.\n\nWe build custom electronics catalog websites and can set up yours for just ₹999 in 2 days! 🚀\n\nWould you like me to send over a few demo previews to show you what we can do?",
    "followupTemplate": "Hey {{business_name}}! 👋\n\nJust following up to see if you received my previous message.\n\nHaving a web catalog is crucial for electronics shops to showcase Spec Sheets, handle queries, and capture local sales directly.\n\nWe can launch your product catalog inventory system and quote request portal in just 2 days for only ₹999! 🚀\n\nWould you be open to checking out a few demo layouts to see how it works?"
  },
  "gyms & fitness": {
    "introTemplate": "Hey {{business_name}}! 👋\n\nI saw your gym/fitness center profile on Google Maps in {{location}}.\n\nHaving a premium website is highly important nowadays to showcase your gym equipment, training programs, class schedules, and to get direct membership signups without any middleman platforms.\n\nWe build beautiful custom fitness websites and can design a professional site for your gym for just ₹999 in only 2 days! 🚀\n\nWould you like me to send over a few demo previews to show you what we can do?",
    "followupTemplate": "Hey {{business_name}}! 👋\n\nJust following up to see if you received my previous message.\n\nHaving an online schedule and booking portal is crucial for gyms to attract new members, build trust, and showcase client transformations directly.\n\nOur team designs custom, fast-loading fitness websites, and we can set up your online presence for just ₹999 within 2 days! 🚀\n\nWould you be open to checking out a few design previews to see how your gym's site could look?"
  },
  "jewelry shops": {
    "introTemplate": "Hey {{business_name}}! 👋\n\nI noticed your jewelry store profile on Google Maps in {{location}}.\n\nA premium digital catalog website is essential to showcase your beautiful collections, build brand trust, and attract high-end buyers without paying third-party commissions.\n\nWe design premium jewelry catalog websites and can set up yours for just ₹999 in only 2 days! 🚀\n\nWould you like me to send over a few demo previews to show you what we can do?",
    "followupTemplate": "Hey {{business_name}}! 👋\n\nJust following up to see if you received my previous message.\n\nHaving an elegant website is crucial to establish trust, show your latest jewelry designs, and secure direct clients directly.\n\nWe build gorgeous custom product showcase websites and can launch yours for just ₹999 within 2 days! 🚀\n\nWould you like to take a look at a few demo previews we designed for jewelry brands?"
  },
  "opticians & eyewear": {
    "introTemplate": "Hey {{business_name}}! 👋\n\nI saw your optician/eyewear store listing on Google Maps in {{location}}.\n\nSince everyone searches online now, having a website is crucial to display your frames, book eye tests, and build trust in your optical store without relying on third-party aggregators.\n\nWe design custom eyewear catalog websites and can launch yours for just ₹999 in only 2 days! 🚀\n\nWould you like me to send over a few demo previews to show you what we can do?",
    "followupTemplate": "Hey {{business_name}}! 👋\n\nJust following up to see if you received my previous message.\n\nA digital frames showroom and booking system is crucial for modern optical shops to attract local clients and increase sales.\n\nWe can build your premium custom optician website in just 2 days for only ₹999! 🚀\n\nWould you like us to share a few design previews with you to show you how it looks?"
  },
  "bakeries & cafes": {
    "introTemplate": "Hey {{business_name}}! 👋\n\nI noticed your bakery/cafe profile on Google Maps in {{location}}.\n\nHaving your own website is essential to showcase your fresh menu, accept direct cake orders, and avoid heavy third-party commissions from delivery apps.\n\nWe build premium custom cafe/bakery websites and can set up yours for just ₹999 in only 2 days! 🚀\n\nWould you like me to send over a few demo previews to show you what we can do?",
    "followupTemplate": "Hey {{business_name}}! 👋\n\nJust following up to see if you received my previous message.\n\nSince most customers search for menus online first, having a modern website is crucial to build trust and get direct bakery orders with zero middleman fees.\n\nWe can launch your premium cafe menu and catalog website in just 2 days for only ₹999! 🚀\n\nWould you be open to checking out a few design previews to see how it looks?"
  },
  "furniture & decor": {
    "introTemplate": "Hey {{business_name}}! 👋\n\nI saw your furniture/decor showroom listing on Google Maps in {{location}}.\n\nA professional digital showroom website is crucial to showcase your furniture designs, get direct inquiries, and establish trust with local buyers without middleman platforms.\n\nWe design premium catalog websites and can set up yours for just ₹999 in only 2 days! 🚀\n\nWould you like me to send over a few demo previews to show you what we can do?",
    "followupTemplate": "Hey {{business_name}}! 👋\n\nJust following up to see if you received my previous message.\n\nHaving an online catalog is crucial for home decor and furniture stores to showcase collections, attract walk-ins, and build trust directly.\n\nWe can launch your premium custom furniture website in just 2 days for only ₹999! 🚀\n\nWould you like to take a look at a few demo previews we designed?"
  }
};

const SEED_SCRAPER_HISTORY = [
  {
    id: "hist_1781755067286",
    category: "clinics",
    location: "Sector 52 Gurugram",
    timestamp: Date.now() - 172800000,
    saved: 44,
    total: 85,
    skippedWebsite: 22,
    skippedLandline: 10,
    skippedDuplicate: 4,
    noPhone: 5
  },
  {
    id: "hist_1781755067287",
    category: "restaurants",
    location: "Sector 52 Gurugram",
    timestamp: Date.now() - 259200000,
    saved: 35,
    total: 70,
    skippedWebsite: 15,
    skippedLandline: 12,
    skippedDuplicate: 3,
    noPhone: 5
  },
  {
    id: "hist_1781755067288",
    category: "clinics",
    location: "Sector 51 Gurugram",
    timestamp: Date.now() - 345600000,
    saved: 19,
    total: 45,
    skippedWebsite: 12,
    skippedLandline: 8,
    skippedDuplicate: 3,
    noPhone: 3
  },
  {
    id: "hist_1781755067289",
    category: "restaurants",
    location: "Sector 14 Gurugram",
    timestamp: Date.now() - 432000000,
    saved: 16,
    total: 40,
    skippedWebsite: 10,
    skippedLandline: 9,
    skippedDuplicate: 2,
    noPhone: 3
  },
  {
    id: "hist_1781755067290",
    category: "restaurants",
    location: "Sector 51 Gurugram",
    timestamp: Date.now() - 518400000,
    saved: 12,
    total: 30,
    skippedWebsite: 8,
    skippedLandline: 6,
    skippedDuplicate: 2,
    noPhone: 2
  }
];

const cleanLocationName = (loc) => {
  if (!loc) return '';
  return loc.split(',')[0].trim();
};

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  const [allTemplates, setAllTemplates] = useState({ categories: {} });

  // Scraper Tab State
  const [scrapeCategory, setScrapeCategory] = useState('restaurants');
  const [scrapeLocation, setScrapeLocation] = useState('Sector 51 Gurugram');
  const [scrollDepth, setScrollDepth] = useState('15');
  const [isScraping, setIsScraping] = useState(false);
  const [logs, setLogs] = useState([]);
  const [scraperStats, setScraperStats] = useState({
    scanned: 0,
    total: 0,
    saved: 0,
    skippedWebsite: 0,
    skippedLandline: 0,
    skippedDuplicate: 0,
    noPhone: 0
  });

  const scraperStatsRef = useRef({
    scanned: 0,
    total: 0,
    saved: 0,
    skippedWebsite: 0,
    skippedLandline: 0,
    skippedDuplicate: 0,
    noPhone: 0,
    savedCategories: []
  });

  const sessionLeadsRef = useRef([]);

  const [scraperHistory, setScraperHistory] = useState([]);

  // Premium Malls Discovery States
  const [searchCity, setSearchCity] = useState('Gurugram');
  const [discoveredMalls, setDiscoveredMalls] = useState([]);
  const [loadedPremiumCity, setLoadedPremiumCity] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [premiumHistory, setPremiumHistory] = useState([]);
  const [lastScanResult, setLastScanResult] = useState(null);

  const consoleBoxRef = useRef(null);

  // Contacts Tab State (Filters & Modal)
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedLeads, setSelectedLeads] = useState([]);
  
  // Templates Tab State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [inlineIntroText, setInlineIntroText] = useState('');
  const [inlineFollowupText, setInlineFollowupText] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  const [templateText, setTemplateText] = useState(DEFAULT_INTRO);
  const [followupText, setFollowupText] = useState(DEFAULT_FOLLOWUP);

  // WhatsApp Tab Campaign Queue Filter
  const [campaignCategory, setCampaignCategory] = useState('all');
  const [campaignType, setCampaignType] = useState('intro'); // intro (Pending) vs followup (Sent)

  // Guided Campaign Wizard State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardLeads, setWizardLeads] = useState([]);
  const [wizardIndex, setWizardIndex] = useState(0);
  const [wizardMessageType, setWizardMessageType] = useState('intro');
  const [wizardCustomText, setWizardCustomText] = useState('');

  // Server Socket Status
  const [isBackendOnline, setIsBackendOnline] = useState(false);

  // Cloud Database Sync Status State
  const [cloudSyncStatus, setCloudSyncStatus] = useState('connected'); // 'connected', 'syncing', 'error'
  const isMigratingRef = useRef(false);

  // Keep state refs updated to prevent stale closures in socket and lifecycle callbacks
  const leadsRef = useRef([]);
  useEffect(() => {
    leadsRef.current = leads;
  }, [leads]);

  const scraperHistoryRef = useRef([]);
  useEffect(() => {
    scraperHistoryRef.current = scraperHistory;
  }, [scraperHistory]);

  const allTemplatesRef = useRef({ categories: {} });
  useEffect(() => {
    allTemplatesRef.current = allTemplates;
  }, [allTemplates]);

  const syncToServer = async (action, data) => {
    setCloudSyncStatus('syncing');
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data })
      });
      if (!res.ok) {
        throw new Error(`Sync failed: ${res.statusText}`);
      }
      setCloudSyncStatus('connected');
      return true;
    } catch (err) {
      console.error('Cloud sync error:', err);
      setCloudSyncStatus('error');
      return false;
    }
  };

  const mergeAndSyncPremiumHistory = async (cloudPremium) => {
    let localPremium = [];
    try {
      const localPH = localStorage.getItem('ashu_premium_history');
      if (localPH) localPremium = JSON.parse(localPH);
    } catch (e) {
      console.error('Error loading local premium history for merging:', e);
    }

    const mergedPremium = [...cloudPremium];
    const cloudIds = new Set(cloudPremium.map(item => item.id));
    const newLocalItems = localPremium.filter(item => !cloudIds.has(item.id));

    if (newLocalItems.length > 0) {
      mergedPremium.push(...newLocalItems);
      mergedPremium.sort((a, b) => b.timestamp - a.timestamp);
      setPremiumHistory(mergedPremium);
      localStorage.setItem('ashu_premium_history', JSON.stringify(mergedPremium));
      await syncToServer('bulk_add_premium_history', { history: newLocalItems });
    } else {
      setPremiumHistory(cloudPremium);
      localStorage.setItem('ashu_premium_history', JSON.stringify(cloudPremium));
    }
  };

  const performMigration = async () => {
    if (isMigratingRef.current) return;
    isMigratingRef.current = true;
    setCloudSyncStatus('syncing');

    let currentLeads = [];
    try {
      const local = localStorage.getItem('ashu_leads');
      if (local) {
        currentLeads = JSON.parse(local);
      } else {
        const res = await fetch('/leads.json');
        if (res.ok) {
          currentLeads = await res.json();
        }
      }
    } catch (e) {
      console.error('Error reading local leads for migration:', e);
    }

    let currentTemplates = { categories: SEED_TEMPLATES };
    try {
      const local = localStorage.getItem('ashu_templates');
      if (local) {
        const parsed = JSON.parse(local);
        if (!parsed.categories) parsed.categories = {};
        parsed.categories = { ...SEED_TEMPLATES, ...parsed.categories };
        currentTemplates = parsed;
      }
    } catch (e) {
      console.error('Error reading local templates for migration:', e);
    }

    let currentHistory = SEED_SCRAPER_HISTORY;
    try {
      const local = localStorage.getItem('ashu_scraper_history');
      if (local) currentHistory = JSON.parse(local);
    } catch (e) {
      console.error('Error reading local history for migration:', e);
    }

    let currentPremiumHistory = [];
    try {
      const local = localStorage.getItem('ashu_premium_history');
      if (local) currentPremiumHistory = JSON.parse(local);
    } catch (e) {
      console.error('Error reading local premium history for migration:', e);
    }

    setLeads(currentLeads);
    setAllTemplates(currentTemplates);
    setScraperHistory(currentHistory);
    setPremiumHistory(currentPremiumHistory);

    localStorage.setItem('ashu_leads', JSON.stringify(currentLeads));
    localStorage.setItem('ashu_templates', JSON.stringify(currentTemplates));
    localStorage.setItem('ashu_scraper_history', JSON.stringify(currentHistory));
    localStorage.setItem('ashu_premium_history', JSON.stringify(currentPremiumHistory));

    try {
      const successLeads = await syncToServer('bulk_add_leads', { leads: currentLeads });
      const successTemplates = await syncToServer('update_templates', { templates: currentTemplates });
      const successHistory = await syncToServer('bulk_add_history', { history: currentHistory });
      const successPremium = await syncToServer('bulk_add_premium_history', { history: currentPremiumHistory });

      if (successLeads && successTemplates && successHistory && successPremium) {
        setCloudSyncStatus('connected');
      } else {
        setCloudSyncStatus('error');
      }
    } catch (err) {
      console.error('Migration failed:', err);
      setCloudSyncStatus('error');
    } finally {
      isMigratingRef.current = false;
    }
  };

  const handleRetrySync = async () => {
    setCloudSyncStatus('syncing');
    try {
      const res = await fetch('/api/sync');
      if (!res.ok) throw new Error('Failed to fetch from cloud');
      const data = await res.json();
      if (data.isInitialized) {
        setLeads(data.leads || []);
        localStorage.setItem('ashu_leads', JSON.stringify(data.leads || []));

        const templatesData = data.templates || { categories: SEED_TEMPLATES };
        if (!templatesData.categories) templatesData.categories = {};
        templatesData.categories = { ...SEED_TEMPLATES, ...templatesData.categories };
        setAllTemplates(templatesData);
        localStorage.setItem('ashu_templates', JSON.stringify(templatesData));

        setScraperHistory(data.history || SEED_SCRAPER_HISTORY);
        localStorage.setItem('ashu_scraper_history', JSON.stringify(data.history || SEED_SCRAPER_HISTORY));

        await mergeAndSyncPremiumHistory(data.premiumHistory || []);

        setCloudSyncStatus('connected');
      } else {
        await performMigration();
      }
    } catch (err) {
      console.error('Retry sync failed:', err);
      setCloudSyncStatus('error');
    }
  };

  // ----------------------------------------------------------------------------
  // Data Lifecycle (Synchronization & Migration)
  // ----------------------------------------------------------------------------
  useEffect(() => {
    // Load local storage fallbacks immediately for fast initial load
    let initialLeads = [];
    let initialTemplates = { categories: SEED_TEMPLATES };
    let initialHistory = SEED_SCRAPER_HISTORY;

    try {
      const localL = localStorage.getItem('ashu_leads');
      if (localL) initialLeads = JSON.parse(localL);

      const localT = localStorage.getItem('ashu_templates');
      if (localT) {
        const parsed = JSON.parse(localT);
        if (!parsed.categories) parsed.categories = {};
        parsed.categories = { ...SEED_TEMPLATES, ...parsed.categories };
        initialTemplates = parsed;
      }

      const localH = localStorage.getItem('ashu_scraper_history');
      if (localH) initialHistory = JSON.parse(localH);
    } catch (e) {
      console.error('Error reading offline storage keys on mount:', e);
    }

    setLeads(initialLeads);
    setAllTemplates(initialTemplates);
    setScraperHistory(initialHistory);

    let initialPremiumHistory = [];
    try {
      const localPH = localStorage.getItem('ashu_premium_history');
      if (localPH) initialPremiumHistory = JSON.parse(localPH);
    } catch(e) {
      console.error('Error loading premium history from localStorage:', e);
    }
    setPremiumHistory(initialPremiumHistory);

    // Pull from cloud MongoDB Atlas
    const syncFromCloud = async () => {
      setCloudSyncStatus('syncing');
      try {
        const res = await fetch('/api/sync');
        if (!res.ok) throw new Error('Failed to pull cloud database');
        const data = await res.json();

        if (data.isInitialized) {
          setLeads(data.leads || []);
          localStorage.setItem('ashu_leads', JSON.stringify(data.leads || []));

          const templatesData = data.templates || { categories: SEED_TEMPLATES };
          if (!templatesData.categories) templatesData.categories = {};
          templatesData.categories = { ...SEED_TEMPLATES, ...templatesData.categories };
          setAllTemplates(templatesData);
          localStorage.setItem('ashu_templates', JSON.stringify(templatesData));

          setScraperHistory(data.history || SEED_SCRAPER_HISTORY);
          localStorage.setItem('ashu_scraper_history', JSON.stringify(data.history || SEED_SCRAPER_HISTORY));

          await mergeAndSyncPremiumHistory(data.premiumHistory || []);

          setCloudSyncStatus('connected');
        } else {
          // Empty cloud database, initialize migration
          await performMigration();
        }
      } catch (err) {
        console.error('Initial cloud sync hydration error:', err);
        setCloudSyncStatus('error');
      }
    };

    syncFromCloud();

    // 3. Connect to backend websocket scraper
    const socket = io(API_BASE);

    socket.on('connect', () => {
      setIsBackendOnline(true);
    });

    socket.on('disconnect', () => {
      setIsBackendOnline(false);
    });

    socket.on('status_log', (message) => {
      setLogs((prev) => [...prev, message]);
      
      // Parse real-time scraper stats from log text
      if (message.includes('Inspecting [')) {
        const match = message.match(/Inspecting \[(\d+)\/(\d+)\]/);
        if (match) {
          const scanned = Number(match[1]);
          const total = Number(match[2]);
          scraperStatsRef.current.scanned = scanned;
          scraperStatsRef.current.total = total;
          setScraperStats((prev) => ({
            ...prev,
            scanned,
            total
          }));
        }
      } else if (message.includes('already has a website')) {
        scraperStatsRef.current.skippedWebsite += 1;
        setScraperStats((prev) => ({ ...prev, skippedWebsite: prev.skippedWebsite + 1 }));
      } else if (message.includes('is not a mobile number')) {
        scraperStatsRef.current.skippedLandline += 1;
        setScraperStats((prev) => ({ ...prev, skippedLandline: prev.skippedLandline + 1 }));
      } else if (message.includes('already exists in contacts database') || message.includes('Duplicate:')) {
        scraperStatsRef.current.skippedDuplicate += 1;
        setScraperStats((prev) => ({ ...prev, skippedDuplicate: prev.skippedDuplicate + 1 }));
      } else if (message.includes('has no phone number listed')) {
        scraperStatsRef.current.noPhone += 1;
        setScraperStats((prev) => ({ ...prev, noPhone: prev.noPhone + 1 }));
      } else if (message.includes('Lead Saved:') || message.includes('Lead Found:') || message.includes('savedCount')) {
        scraperStatsRef.current.saved += 1;
        setScraperStats((prev) => ({ ...prev, saved: prev.saved + 1 }));
      }

      if (message.includes('Scraping session completed') || message.includes('Fatal error') || message.includes('Scraping process idle.')) {
        setIsScraping(false);
      }
    });

    socket.on('lead_scraped', (newLead) => {
      // Prevent duplicates in real time using the updated leadsRef
      const cleanNewPhone = newLead.phone.replace(/[^0-9]/g, '');
      if (leadsRef.current.some((l) => l.phone.replace(/[^0-9]/g, '') === cleanNewPhone)) return;

      // Accumulate unique categories saved during this session
      if (!scraperStatsRef.current.savedCategories) {
        scraperStatsRef.current.savedCategories = [];
      }
      if (!scraperStatsRef.current.savedCategories.includes(newLead.category)) {
        scraperStatsRef.current.savedCategories.push(newLead.category);
      }

      // Accumulate leads for this session to group by location and category on completion
      sessionLeadsRef.current.push(newLead);

      const updated = [newLead, ...leadsRef.current];
      setLeads(updated);
      localStorage.setItem('ashu_leads', JSON.stringify(updated));
      
      // Push new lead to cloud Atlas DB
      syncToServer('update_lead', { lead: newLead });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Sync logs scroll
  useEffect(() => {
    if (consoleBoxRef.current) {
      consoleBoxRef.current.scrollTop = consoleBoxRef.current.scrollHeight;
    }
  }, [logs]);

  // Handle mobile width activeTab protection (cannot use Scraper on mobile)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      if (window.innerWidth <= 768 && (activeTab === 'scraper' || activeTab === 'templates')) {
        setActiveTab('contacts');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTab]);

  // Sync wizard message copy when index advances
  useEffect(() => {
    if (isWizardOpen && wizardLeads[wizardIndex]) {
      const lead = wizardLeads[wizardIndex];
      const message = getCompiledMessage(lead, wizardMessageType);
      setWizardCustomText(message || '');
    }
  }, [wizardIndex, wizardLeads, isWizardOpen]);

  // Save search query parameters to scraper history when run completes
  const wasScrapingRef = useRef(false);
  useEffect(() => {
    if (isScraping) {
      wasScrapingRef.current = true;
    } else if (wasScrapingRef.current) {
      wasScrapingRef.current = false;
      
      const finalStats = scraperStatsRef.current;
      const sessionLeads = sessionLeadsRef.current || [];
      
      // Prevent adding empty runs or runs where nothing was even scanned if it's aborted immediately
      if (finalStats.total === 0 && finalStats.scanned === 0) return;

      const newRecords = [];
      const now = Date.now();

      if (sessionLeads.length > 0) {
        // Group leads by clean location and category
        const groups = {};
        sessionLeads.forEach((lead) => {
          const loc = cleanLocationName(lead.location);
          const cat = lead.category || 'general';
          const key = `${loc}||${cat}`;
          if (!groups[key]) {
            groups[key] = {
              location: loc,
              category: cat,
              saved: 0
            };
          }
          groups[key].saved++;
        });

        const keys = Object.keys(groups);
        const isSingleGroup = keys.length === 1;

        keys.forEach((key, index) => {
          const group = groups[key];
          newRecords.push({
            id: `${now}_${index}`,
            category: group.category,
            location: group.location,
            timestamp: now,
            saved: group.saved,
            total: isSingleGroup ? finalStats.total : group.saved,
            skippedWebsite: isSingleGroup ? finalStats.skippedWebsite : 0,
            skippedLandline: isSingleGroup ? finalStats.skippedLandline : 0,
            skippedDuplicate: isSingleGroup ? finalStats.skippedDuplicate : 0,
            noPhone: isSingleGroup ? finalStats.noPhone : 0
          });
        });
      } else {
        // Fallback run if no leads were saved but listings were scanned
        const finalCategoryText = scrapeCategory === 'all shops' ? 'general' : scrapeCategory;
        
        let finalLocationText;
        if (discoveredMalls.length > 0 && scrapeLocation === 'all_malls') {
          finalLocationText = cleanLocationName(discoveredMalls[0].name);
        } else {
          finalLocationText = cleanLocationName(scrapeLocation);
        }

        newRecords.push({
          id: now.toString(),
          category: finalCategoryText,
          location: finalLocationText,
          timestamp: now,
          saved: finalStats.saved,
          total: finalStats.total,
          skippedWebsite: finalStats.skippedWebsite,
          skippedLandline: finalStats.skippedLandline,
          skippedDuplicate: finalStats.skippedDuplicate,
          noPhone: finalStats.noPhone
        });
      }

      // Check if history already contains a run with exact same category and location within past 1 minute to prevent double recording
      const nonDuplicateRecords = newRecords.filter(run => {
        return !scraperHistoryRef.current.some(
          (existing) => 
            existing.category.toLowerCase().trim() === run.category.toLowerCase().trim() &&
            existing.location.toLowerCase().trim() === run.location.toLowerCase().trim() &&
            (Date.now() - existing.timestamp) < 60000
        );
      });

      if (nonDuplicateRecords.length === 0) return;

      const updated = [...nonDuplicateRecords, ...scraperHistoryRef.current];
      setScraperHistory(updated);
      localStorage.setItem('ashu_scraper_history', JSON.stringify(updated));
      
      // Sync history records to MongoDB
      nonDuplicateRecords.forEach(run => {
        syncToServer('add_history', { run });
      });
    }
  }, [isScraping, scrapeCategory, scrapeLocation, discoveredMalls]);

  const alreadyScrapedRun = useMemo(() => {
    if (discoveredMalls.length > 0 && scrapeLocation === 'all_malls') return null;
    if (!scrapeCategory || !scrapeLocation) return null;
    const catSearch = scrapeCategory.toLowerCase().trim();
    const locSearch = scrapeLocation.toLowerCase().trim();
    return scraperHistory.find(
      (run) => 
        run.category.toLowerCase().trim() === catSearch &&
        run.location.toLowerCase().trim() === locSearch
    );
  }, [scrapeCategory, scrapeLocation, scraperHistory, discoveredMalls]);

  const sortedHistory = useMemo(() => {
    return [...scraperHistory].sort((a, b) => {
      const locA = (a.location || '').toLowerCase().trim();
      const locB = (b.location || '').toLowerCase().trim();
      if (locA !== locB) {
        return locA.localeCompare(locB);
      }
      
      const catA = (a.category || '').toLowerCase().trim();
      const catB = (b.category || '').toLowerCase().trim();
      if (catA !== catB) {
        return catA.localeCompare(catB);
      }
      
      return b.timestamp - a.timestamp;
    });
  }, [scraperHistory]);

  // ----------------------------------------------------------------------------
  // Local CRM Database Handlers (State + LocalStorage)
  // ----------------------------------------------------------------------------
  const handleUpdateLeadStatus = (id, status, notes = undefined) => {
    let updatedLead = null;
    const updated = leads.map((lead) => {
      if (lead.id === id) {
        const copy = { ...lead, status, updatedAt: new Date().toISOString() };
        if (status === 'Sent') {
          copy.lastSentDate = new Date().toISOString();
        }
        if (notes !== undefined) {
          copy.notes = notes.trim();
        }
        updatedLead = copy;
        return copy;
      }
      return lead;
    });
    setLeads(updated);
    localStorage.setItem('ashu_leads', JSON.stringify(updated));
    
    // Sync single changed lead to MongoDB Atlas
    if (updatedLead) {
      syncToServer('update_lead', { lead: updatedLead });
    }
  };



  // ----------------------------------------------------------------------------
  // Scraper Actions
  // ----------------------------------------------------------------------------
  const handleDiscoverMalls = async () => {
    if (!isBackendOnline) {
      alert('Backend scraping engine is offline. Please launch the backend server first.');
      return;
    }
    if (!searchCity.trim()) {
      alert('Please enter a city name to search for malls.');
      return;
    }

    const cleanCity = searchCity.toLowerCase().trim();
    const isAlreadySearched = premiumHistory.some(h => h.city.toLowerCase().trim() === cleanCity);
    if (isAlreadySearched) {
      if (!confirm(`"${searchCity}" is already in your Premium Locations history. Do you want to scan it again?`)) {
        return;
      }
    }

    setIsDiscovering(true);
    setLogs([]);
    setLastScanResult(null);
    setLogs((prev) => [...prev, `[System] Initiating discovery of premium locations in "${searchCity}"...`]);

    try {
      const res = await fetch(`${API_BASE}/api/scrape/malls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: searchCity })
      });
      
      if (!res.ok) {
        const err = await res.json();
        setLogs((prev) => [...prev, `[Error] ${err.error || 'Failed to discover malls.'}`]);
        setIsDiscovering(false);
        return;
      }

      const data = await res.json();
      if (data.success && data.locations) {
        const newHistoryItem = {
          id: 'prem_' + Date.now(),
          city: searchCity.trim(),
          timestamp: Date.now(),
          locations: data.locations
        };
        
        setPremiumHistory((prev) => {
          const filtered = prev.filter(h => h.city.toLowerCase() !== searchCity.trim().toLowerCase());
          const updated = [newHistoryItem, ...filtered];
          localStorage.setItem('ashu_premium_history', JSON.stringify(updated));
          return updated;
        });

        // Sync to cloud database
        syncToServer('add_premium_history', { run: newHistoryItem });

        setLastScanResult({ 
          city: searchCity.trim(), 
          count: data.locations.length
        });

        setLogs((prev) => [
          ...prev, 
          `[System] Discovery complete. Found and saved ${data.locations.length} premium malls & markets in "${searchCity}".`
        ]);
      } else {
        setLogs((prev) => [...prev, `[System] No locations returned.`]);
      }
    } catch (err) {
      setLogs((prev) => [...prev, `[Error] Failed to connect: ${err.message}`]);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleStartScrape = async () => {
    if (!isBackendOnline) {
      alert('Backend scraping engine is offline. Please launch the backend server first.');
      return;
    }

    let targetLocation;
    if (discoveredMalls.length > 0 && scrapeLocation === 'all_malls') {
      targetLocation = discoveredMalls.map(m => {
        const cleanAddress = m.address && m.address !== 'N/A' 
          ? m.address.split('·')[0].trim() 
          : '';
        return cleanAddress ? `${m.name}, ${cleanAddress}` : m.name;
      });
    } else {
      if (!scrapeLocation) {
        alert('Please enter or select a Target Region Location.');
        return;
      }
      // Check if a specific discovered mall is selected to append its sector/address
      const matchedMall = discoveredMalls.find(m => m.name === scrapeLocation);
      if (matchedMall) {
        const cleanAddress = matchedMall.address && matchedMall.address !== 'N/A'
          ? matchedMall.address.split('·')[0].trim()
          : '';
        targetLocation = cleanAddress ? `${matchedMall.name}, ${cleanAddress}` : matchedMall.name;
      } else {
        targetLocation = scrapeLocation;
      }
    }

    if (!scrapeCategory) {
      alert('Please enter a Business Keyword Category.');
      return;
    }

    setIsScraping(true);
    setLogs([]);
    scraperStatsRef.current = {
      scanned: 0,
      total: 0,
      saved: 0,
      skippedWebsite: 0,
      skippedLandline: 0,
      skippedDuplicate: 0,
      noPhone: 0,
      savedCategories: []
    };
    setScraperStats(scraperStatsRef.current);
    sessionLeadsRef.current = [];

    const displayLocation = Array.isArray(targetLocation)
      ? `${targetLocation.length} malls/markets`
      : targetLocation;

    setLogs((prev) => [...prev, `[System] Search query requested: "${scrapeCategory} in ${displayLocation}"`]);

    try {
      const res = await fetch(`${API_BASE}/api/scrape/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          category: scrapeCategory, 
          location: targetLocation,
          scrollDepth: Number(scrollDepth),
          existingPhones: leads.map(l => l.phone)
        })
      });
      if (!res.ok) {
        const err = await res.json();
        setLogs((prev) => [...prev, `[Error] ${err.error}`]);
        setIsScraping(false);
      }
    } catch (err) {
      setLogs((prev) => [...prev, `[Error] Failed to connect: ${err.message}`]);
      setIsScraping(false);
    }
  };

  const handleStopScrape = async () => {
    if (!isScraping) return;
    try {
      setLogs((prev) => [...prev, `[System] Requesting cancel signal...`]);
      await fetch(`${API_BASE}/api/scrape/stop`, { method: 'POST' });
    } catch (err) {
      setLogs((prev) => [...prev, `[Error] Failed to stop scraper: ${err.message}`]);
    }
  };

  // ----------------------------------------------------------------------------
  // Local Templates Handlers
  // ----------------------------------------------------------------------------
  const handleSaveNewTemplate = () => {
    const cleanCat = templateCategory.toLowerCase().trim();
    if (!cleanCat) {
      alert('Category name is required.');
      return;
    }

    const updated = {
      ...allTemplates,
      categories: {
        ...allTemplates.categories,
        [cleanCat]: {
          introTemplate: templateText,
          followupTemplate: followupText
        }
      }
    };

    setAllTemplates(updated);
    localStorage.setItem('ashu_templates', JSON.stringify(updated));
    syncToServer('update_templates', { templates: updated });
    
    // Reset Form
    setTemplateCategory('');
    setTemplateText(DEFAULT_INTRO);
    setFollowupText(DEFAULT_FOLLOWUP);
    setIsCreateOpen(false);
  };

  const handleEditTemplate = (cat) => {
    setEditingCategory(cat);
    if (allTemplates.categories && allTemplates.categories[cat]) {
      setInlineIntroText(allTemplates.categories[cat].introTemplate || '');
      setInlineFollowupText(allTemplates.categories[cat].followupTemplate || '');
    }
  };

  const handleSaveInlineTemplate = (cat) => {
    const updated = {
      ...allTemplates,
      categories: {
        ...allTemplates.categories,
        [cat]: {
          introTemplate: inlineIntroText,
          followupTemplate: inlineFollowupText
        }
      }
    };
    setAllTemplates(updated);
    localStorage.setItem('ashu_templates', JSON.stringify(updated));
    syncToServer('update_templates', { templates: updated });
    setEditingCategory(null);
  };

  const handleDeleteTemplate = (cat) => {
    if (!confirm(`Are you sure you want to delete the outreach template for "${cat}"?`)) return;
    const categoriesCopy = { ...allTemplates.categories };
    delete categoriesCopy[cat];

    const updated = { ...allTemplates, categories: categoriesCopy };
    setAllTemplates(updated);
    localStorage.setItem('ashu_templates', JSON.stringify(updated));
    syncToServer('update_templates', { templates: updated });
    if (editingCategory === cat) setEditingCategory(null);
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear all scraper runs from the history log? This cannot be undone.')) return;
    setScraperHistory([]);
    localStorage.setItem('ashu_scraper_history', JSON.stringify([]));
    await syncToServer('clear_history', {});
  };

  // ----------------------------------------------------------------------------
  // Guided Campaign Outreach Wizard
  // ----------------------------------------------------------------------------
  const formatPhoneForWa = (phone) => {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.length === 10) clean = '91' + clean;
    if (clean.startsWith('0') && clean.length === 11) clean = '91' + clean.substring(1);
    return clean;
  };

  const getCompiledMessage = (lead, type) => {
    const cat = lead.category.toLowerCase().trim();
    const catTemplate = allTemplates.categories ? allTemplates.categories[cat] : null;
    
    // Fallback to defaults if no category-specific template exists
    const templateText = catTemplate 
      ? (type === 'intro' ? catTemplate.introTemplate : catTemplate.followupTemplate)
      : (type === 'intro' ? DEFAULT_INTRO : DEFAULT_FOLLOWUP);

    if (!templateText) return '';

    return templateText
      .replace(/{{business_name}}/gi, lead.name)
      .replace(/{{category}}/gi, lead.category)
      .replace(/{{location}}/gi, lead.location || 'your area');
  };

  const handleStartCampaign = (mode = 'filtered') => {
    let targetList = [];
    if (mode === 'selected') {
      targetList = leads.filter(l => selectedLeads.includes(l.id));
    } else {
      // Gather active outreach queue from contacts matching the campaign type
      targetList = leads.filter(lead => {
        const catMatch = campaignCategory === 'all' || lead.category === campaignCategory;
        if (!catMatch) return false;

        if (campaignType === 'intro') {
          return lead.status === 'Pending';
        } else {
          // Followup needs to be Sent, and not updated/sent in the last 7 days
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return lead.status === 'Sent' && lead.lastSentDate && new Date(lead.lastSentDate) < sevenDaysAgo;
        }
      });
    }

    if (targetList.length === 0) {
      alert('No contacts match the campaign filters or outreach criteria.');
      return;
    }

    // Sort oldest first
    targetList.sort((a, b) => a.id.localeCompare(b.id));

    setWizardLeads(targetList);
    setWizardIndex(0);
    setWizardMessageType(mode === 'selected' ? 'intro' : campaignType);
    setIsWizardOpen(true);
  };

  const handleTriggerWhatsApp = () => {
    const lead = wizardLeads[wizardIndex];
    if (!lead) return;

    const cleanPhone = formatPhoneForWa(lead.phone);
    const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(wizardCustomText)}`;

    // Copy as backup to clipboard
    try {
      navigator.clipboard.writeText(wizardCustomText);
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }

    window.open(waUrl, '_blank');
    
    // Automatically mark as Sent and advance
    handleWizardSubmitResult('Sent');
  };

  const handleWizardSubmitResult = (status) => {
    const lead = wizardLeads[wizardIndex];
    if (!lead) return;

    const notesMsg = `${wizardMessageType === 'intro' ? 'Intro' : 'Followup'} sent manually via Guided Campaign`;

    handleUpdateLeadStatus(lead.id, status, notesMsg);

    // Advance
    if (wizardIndex < wizardLeads.length - 1) {
      setWizardIndex(prev => prev + 1);
    } else {
      setIsWizardOpen(false);
      alert('Cold outreach campaign conveyor complete!');
    }
  };

  const handleWizardSkip = () => {
    if (wizardIndex < wizardLeads.length - 1) {
      setWizardIndex(prev => prev + 1);
    } else {
      setIsWizardOpen(false);
      alert('Campaign queue processing finished.');
    }
  };

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
      appContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ----------------------------------------------------------------------------
  // Dashboard & Metrics State (Derived Computations)
  // ----------------------------------------------------------------------------
  const stats = useMemo(() => {
    const total = leads.length;
    const sent = leads.filter((l) => l.status === 'Sent').length;
    const won = leads.filter((l) => l.status === 'Won').length;
    const lost = leads.filter((l) => l.status === 'Lost').length;
    
    return {
      total,
      sent,
      won,
      lost,
      pending: leads.filter(l => l.status === 'Pending').length,
      conversionRate: total > 0 ? ((won / total) * 100).toFixed(1) : '0'
    };
  }, [leads]);

  const uniqueCategories = useMemo(() => {
    const cats = new Set(leads.map((l) => l.category));
    return ['all', ...Array.from(cats)];
  }, [leads]);

  const configCategories = useMemo(() => {
    const predefined = [
      'restaurants', 
      'salons', 
      'clinics', 
      'clothing shops', 
      'electronics shops',
      'gyms & fitness',
      'jewelry shops',
      'opticians & eyewear',
      'bakeries & cafes',
      'furniture & decor',
      'general'
    ];
    const custom = allTemplates.categories ? Object.keys(allTemplates.categories) : [];
    return Array.from(new Set([...predefined, ...custom]));
  }, [allTemplates]);

  const filteredLeads = useMemo(() => {
    const cleanSearch = searchQuery.toLowerCase().trim();
    if (!cleanSearch && filterCategory === 'all' && filterStatus === 'all') {
      return leads;
    }
    return leads.filter((lead) => {
      const matchesSearch = !cleanSearch ||
        lead.name.toLowerCase().includes(cleanSearch) ||
        lead.phone.includes(cleanSearch) ||
        (lead.location && lead.location.toLowerCase().includes(cleanSearch));

      const matchesCat = filterCategory === 'all' || lead.category === filterCategory;
      const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [leads, searchQuery, filterCategory, filterStatus]);

  const recentDispatches = useMemo(() => {
    return leads
      .filter((l) => ['Sent'].includes(l.status) && l.lastSentDate)
      .sort((a, b) => new Date(b.lastSentDate) - new Date(a.lastSentDate))
      .slice(0, 4);
  }, [leads]);

  const handleSelectLead = (id) => {
    setSelectedLeads((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedLeads(filteredLeads.map((l) => l.id));
    } else {
      setSelectedLeads([]);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo-container">
            <span className="logo-main">Ashu Websites</span>
            <span className="logo-sub">Manager Pro</span>
          </div>
        </div>
        <ul className="nav-links">
          <li
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            {Icons.dashboard()} Dashboard
          </li>
          <li
            className={`nav-item ${activeTab === 'scraper' ? 'active' : ''}`}
            onClick={() => setActiveTab('scraper')}
          >
            {Icons.scraper()} Lead Scraper
          </li>
          <li
            className={`nav-item ${activeTab === 'contacts' ? 'active' : ''}`}
            onClick={() => setActiveTab('contacts')}
          >
            {Icons.contacts()} Contacts CRM
          </li>
          <li
            className={`nav-item ${activeTab === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveTab('templates')}
          >
            {Icons.edit()} Templates
          </li>
          <li
            className={`nav-item ${activeTab === 'whatsapp' ? 'active' : ''}`}
            onClick={() => setActiveTab('whatsapp')}
          >
            {Icons.campaigns()} Outreach Hub
          </li>
        </ul>

        {/* Server Connection status */}
        <div className="server-status-widget">
          <div className="status-indicator-row">
            <span className={`status-dot ${isBackendOnline ? 'online' : 'offline'}`} />
            <span className="status-label">Scraper: {isBackendOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
          <span className="status-desc">
            {isBackendOnline ? 'Scraper active.' : 'Start backend server.'}
          </span>
        </div>

        {/* Cloud Database Sync Status */}
        <div className="server-status-widget" style={{ marginTop: '12px' }}>
          <div className="status-indicator-row">
            <span className={`status-dot ${
              cloudSyncStatus === 'connected' ? 'online' : 
              cloudSyncStatus === 'syncing' ? 'syncing' : 'offline'
            }`} />
            <span className="status-label">
              Database: {
                cloudSyncStatus === 'connected' ? 'CONNECTED' : 
                cloudSyncStatus === 'syncing' ? 'SYNCING...' : 'SYNC ERROR'
              }
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span className="status-desc">
              {
                cloudSyncStatus === 'connected' ? 'Cloud sync active.' : 
                cloudSyncStatus === 'syncing' ? 'Updating Atlas...' : 'Database offline.'
              }
            </span>
            {cloudSyncStatus === 'error' && (
              <button 
                onClick={handleRetrySync}
                style={{ 
                  background: 'rgba(239, 68, 68, 0.2)', 
                  border: '1px solid #ef4444', 
                  color: '#ef4444', 
                  padding: '2px 8px', 
                  borderRadius: '4px', 
                  fontSize: '10px', 
                  cursor: 'pointer',
                  fontWeight: '600',
                  lineHeight: '1.2'
                }}
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="main-content">
        
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>
            <header className="page-header">
              <h1 className="page-title">Analytics Dashboard</h1>
              <p className="page-subtitle">Outreach statistics and conversions</p>
            </header>

            {/* Metrics Row */}
            <div className="grid-stats">
              <div className="stat-card">
                <span className="stat-label">Total Leads</span>
                <span className="stat-value">{stats.total}</span>
              </div>
              <div className="stat-card warning">
                <span className="stat-label">Pending Contacts</span>
                <span className="stat-value text-warning">{stats.pending}</span>
              </div>
              <div className="stat-card success">
                <span className="stat-label">Outreach Sent</span>
                <span className="stat-value">{stats.sent}</span>
              </div>
              <div className="stat-card success">
                <span className="stat-label">Leads Won</span>
                <span className="stat-value text-success">{stats.won}</span>
              </div>
              <div className="stat-card error">
                <span className="stat-label">Leads Lost</span>
                <span className="stat-value text-error">{stats.lost}</span>
              </div>
              <div className="stat-card primary">
                <span className="stat-label">Win Rate</span>
                <span className="stat-value text-accent">{stats.conversionRate}%</span>
              </div>
            </div>

            {/* Sub-distribution row */}
            <div className="responsive-grid">
              <div className="glass-card">
                <h2 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Campaign Progress Chart
                </h2>
                <div className="bar-chart-container">
                  <div className="chart-bar-row">
                    <span className="chart-bar-label">Pending ({stats.pending})</span>
                    <div className="chart-bar-wrapper">
                      <div className="chart-bar-fill pending" style={{ width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <div className="chart-bar-row">
                    <span className="chart-bar-label">Sent ({stats.sent})</span>
                    <div className="chart-bar-wrapper">
                      <div className="chart-bar-fill sent" style={{ width: `${stats.total > 0 ? (stats.sent / stats.total) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <div className="chart-bar-row">
                    <span className="chart-bar-label">Won ({stats.won})</span>
                    <div className="chart-bar-wrapper">
                      <div className="chart-bar-fill won" style={{ width: `${stats.total > 0 ? (stats.won / stats.total) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <div className="chart-bar-row">
                    <span className="chart-bar-label">Lost ({stats.lost})</span>
                    <div className="chart-bar-wrapper">
                      <div className="chart-bar-fill lost" style={{ width: `${stats.total > 0 ? (stats.lost / stats.total) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card instruction-card">
                <h2 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Quick Start Guide
                </h2>
                <ul className="guide-list">
                  <li>
                    <span className="num">1</span>
                    <div><strong>Google Maps Scraper:</strong> Pull active local listings without websites into your browser database.</div>
                  </li>
                  <li>
                    <span className="num">2</span>
                    <div><strong>Outreach Templates:</strong> Configure customized sales copy using dynamic placeholders.</div>
                  </li>
                  <li>
                    <span className="num">3</span>
                    <div><strong>WhatsApp campaigns:</strong> Launch the interactive deep link conveyor belt wizard.</div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SCRAPER */}
        {activeTab === 'scraper' && (
          <div>
            <header className="page-header">
              <h1 className="page-title">Lead Scraper Engine</h1>
              <p className="page-subtitle">Search listings on Google Maps and import leads</p>
            </header>

            {/* Premium Mall & Market Locator Card */}
            <div className="glass-card" style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Premium Location Scraper</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
                Discover shopping malls, plazas, and high-street markets in a city or sector to target high-intent clients.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  disabled={isScraping || isDiscovering}
                  placeholder="Enter City or Sector Name (e.g. Gurugram, Sector 15)"
                  style={{ width: '320px' }}
                />
                <button
                  type="button"
                  className="btn"
                  onClick={handleDiscoverMalls}
                  disabled={isScraping || isDiscovering}
                  style={{ flexShrink: 0, padding: '10px 16px' }}
                >
                  {isDiscovering ? (
                    <>
                      {Icons.sync("animate-spin")} Scanning...
                    </>
                  ) : (
                    'Find Malls & Markets'
                  )}
                </button>

                {searchCity && premiumHistory.some(h => h.city.toLowerCase().trim() === searchCity.toLowerCase().trim()) && (
                  <span style={{
                    color: '#fbbf24',
                    fontSize: '12px',
                    marginLeft: '8px'
                  }}>
                    Note that &quot;{searchCity}&quot; has already been searched. You can load it directly from the history section below.
                  </span>
                )}

                {lastScanResult && (
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.04)',
                    border: '1px solid rgba(16, 185, 129, 0.15)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: 'var(--success)',
                    fontSize: '12px',
                    width: 'fit-content',
                    marginTop: '8px'
                  }}>
                    Scanned <strong>{lastScanResult.city}</strong> and saved <strong>{lastScanResult.count} premium malls/markets</strong> to the list below.
                  </div>
                )}
              </div>
            </div>

            {/* Premium Locations History Card */}
            <div className="glass-card" style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Premium Locations</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
                History of all premium locations searched. Select and load a location&apos;s malls and markets into the Business Scraper below.
              </p>

              {premiumHistory.length === 0 ? (
                <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.015)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                  No locations searched yet. Enter a city name above to discover local premium markets and malls!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
                  {premiumHistory.map(item => (
                    <div key={item.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(255, 255, 255, 0.015)',
                      border: loadedPremiumCity === item.city ? '1px solid var(--success)' : '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '12px 16px'
                    }}>
                      <div style={{ flex: 1, marginRight: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{item.city}</strong>
                          {loadedPremiumCity === item.city && (
                            <span style={{
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: 'var(--success)',
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: '600'
                            }}>
                              Loaded
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {item.locations.length} malls & markets · Scanned on {new Date(item.timestamp).toLocaleDateString()}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: 'var(--text-secondary)',
                          marginTop: '4px',
                          maxWidth: '450px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {item.locations.map(m => m.name).join(', ')}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <button
                          type="button"
                          className="btn"
                          onClick={() => {
                            setDiscoveredMalls(item.locations);
                            setScrapeLocation(item.locations.length > 0 ? item.locations[0].name : '');
                            setLoadedPremiumCity(item.city);
                          }}
                          style={{
                            padding: '6px 12px',
                            fontSize: '11px',
                            borderRadius: '6px',
                            background: loadedPremiumCity === item.city ? 'rgba(16, 185, 129, 0.2)' : undefined,
                            borderColor: loadedPremiumCity === item.city ? 'var(--success)' : undefined,
                            color: loadedPremiumCity === item.city ? 'var(--success)' : undefined
                          }}
                        >
                          {loadedPremiumCity === item.city ? 'Selected' : 'Select & Load'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Business Scraper Card */}
            <div className="glass-card">
              <h2 style={{ fontSize: '18px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Business Scraper</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
                Configure parameters and extract business details to build your contact list.
              </p>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category">Business Keyword Category</label>
                  <select
                    id="category"
                    value={scrapeCategory}
                    onChange={(e) => setScrapeCategory(e.target.value)}
                    disabled={isScraping}
                    style={{ textTransform: 'capitalize' }}
                  >
                    <option value="all shops">All Shops (Auto-Categorize)</option>
                    {configCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ flex: 2 }}>
                  <label htmlFor="location">Target Region Location</label>
                  {discoveredMalls.length > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <select
                        id="location"
                        value={scrapeLocation}
                        onChange={(e) => {
                          if (e.target.value === 'custom_location') {
                            setDiscoveredMalls([]);
                            setScrapeLocation('');
                            setLoadedPremiumCity('');
                          } else {
                            setScrapeLocation(e.target.value);
                          }
                        }}
                        disabled={isScraping}
                        style={{ width: '100%' }}
                      >
                        {discoveredMalls.map((mall) => (
                          <option key={mall.name} value={mall.name}>
                            {mall.name} ({mall.address.split('·')[0].trim()})
                          </option>
                        ))}
                        <option value="custom_location">-- Switch to Custom Input Location --</option>
                      </select>
                    </div>
                  ) : (
                    <input
                      type="text"
                      id="location"
                      value={scrapeLocation}
                      onChange={(e) => setScrapeLocation(e.target.value)}
                      disabled={isScraping}
                      placeholder="e.g. Sector 51 Gurugram"
                    />
                  )}
                </div>
              </div>

              <div className="form-row" style={{ marginTop: '16px' }}>
                <div className="form-group">
                  <label htmlFor="scroll-depth">Scan Depth (Google Maps scrolling cycles)</label>
                  <select
                    id="scroll-depth"
                    value={scrollDepth}
                    onChange={(e) => setScrollDepth(e.target.value)}
                    disabled={isScraping}
                  >
                    <option value="5">Fast Scan (~10-20 leads)</option>
                    <option value="15">Normal Scan (~30-50 leads)</option>
                    <option value="35">Deep Scan (~70-100 leads)</option>
                  </select>
                </div>
                <div className="form-group" style={{ visibility: 'hidden', pointerEvents: 'none' }} />
              </div>

              {alreadyScrapedRun && (
                <div style={{
                  background: 'rgba(245, 158, 11, 0.06)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  color: '#fbbf24',
                  fontSize: '13px',
                  marginTop: '16px'
                }}>
                  <div>
                    <strong>Already scraped before:</strong> You scraped {alreadyScrapedRun.saved} contacts of &quot;{alreadyScrapedRun.category}&quot; in &quot;{alreadyScrapedRun.location}&quot; on {new Date(alreadyScrapedRun.timestamp).toLocaleDateString()}.
                  </div>
                </div>
              )}

              <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                <button
                  className="btn"
                  onClick={handleStartScrape}
                  disabled={isScraping}
                >
                  {isScraping ? (
                    <>
                      {Icons.sync("animate-spin")} Extracting Leads...
                    </>
                  ) : (
                    <>
                      {Icons.scraper()} Start Crawl Search
                    </>
                  )}
                </button>
                {isScraping && (
                  <button className="btn btn-secondary" onClick={handleStopScrape} style={{ color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                    Stop Scraper
                  </button>
                )}
              </div>

              {/* Scraper Live Analytics */}
              {(isScraping || scraperStats.total > 0) && (
                <div className="scraper-progress-hud">
                  <h3 style={{ fontSize: '15px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isScraping ? null : Icons.check("text-success")}
                    <span>{isScraping ? 'Active Maps Progress Monitor' : 'Scrape Run Summary'}</span>
                    {isScraping && <span className="pulse-indicator"></span>}
                  </h3>
                  
                  {/* Progress bar */}
                  {scraperStats.total > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        <span>Analyzing search listings...</span>
                        <span>{scraperStats.scanned} / {scraperStats.total} checked ({Math.round((scraperStats.scanned / scraperStats.total) * 100)}%)</span>
                      </div>
                      <div className="progress-track">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${(scraperStats.scanned / scraperStats.total) * 100}%` }} 
                        />
                      </div>
                    </div>
                  )}

                  <div className="stats-hud-grid">
                    <div className="hud-card success">
                      <div className="hud-label">Leads Saved</div>
                      <div className="hud-value">{scraperStats.saved}</div>
                    </div>
                    <div className="hud-card">
                      <div className="hud-label">Has Website</div>
                      <div className="hud-value">{scraperStats.skippedWebsite}</div>
                    </div>
                    <div className="hud-card error">
                      <div className="hud-label">Landline (Skipped)</div>
                      <div className="hud-value">{scraperStats.skippedLandline}</div>
                    </div>
                    <div className="hud-card primary">
                      <div className="hud-label">Duplicate Leads</div>
                      <div className="hud-value">{scraperStats.skippedDuplicate}</div>
                    </div>
                    <div className="hud-card">
                      <div className="hud-label">No Phone</div>
                      <div className="hud-value">{scraperStats.noPhone}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Console logs */}
              {logs.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                  <h3 style={{ fontSize: '15px' }}>Live Crawler Socket Stream Logs</h3>
                  <div className="console-box" ref={consoleBoxRef}>
                    {logs.map((log, index) => (
                      <div key={index}>{log}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Scraper History Section */}
            <div className="glass-card" style={{ marginTop: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  Past Scraper Runs ({scraperHistory.length})
                </h2>
              </div>

              {scraperHistory.length === 0 ? (
                <div style={{ padding: '24px', color: 'var(--text-muted)', textAlign: 'center', fontSize: '14px' }}>
                  No past search queries recorded. Run a scraper search to start tracking!
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', border: '1px solid var(--border-color)' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255, 255, 255, 0.01)' }}>
                        <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', width: '20%', border: '1px solid var(--border-color)' }}>Category</th>
                        <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', width: '35%', border: '1px solid var(--border-color)' }}>Location</th>
                        <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', width: '20%', border: '1px solid var(--border-color)' }}>Date Scraped</th>
                        <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', textAlign: 'center', width: '15%', border: '1px solid var(--border-color)' }}>Saved Contacts</th>
                        <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', textAlign: 'center', width: '10%', border: '1px solid var(--border-color)' }}>Searched</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedHistory.map((run) => (
                        <tr key={run.id}>
                          <td style={{ padding: '12px 16px', textTransform: 'capitalize', fontSize: '13px', border: '1px solid var(--border-color)' }}>
                            <span className="badge category-badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                              {run.category}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>{run.location}</td>
                          <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                            {new Date(run.timestamp).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '13px', textAlign: 'center', color: 'var(--success)', fontWeight: '700', border: '1px solid var(--border-color)' }}>{run.saved}</td>
                          <td style={{ padding: '12px 16px', fontSize: '12px', textAlign: 'center', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>{run.total || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CONTACTS CRM */}
        {activeTab === 'contacts' && (
          <div>
            <header className="page-header">
              <h1 className="page-title">Contacts CRM</h1>
              <p className="page-subtitle">Inspect client listings, organize outreach status, and launch campaigns</p>
            </header>

            {/* Filter controls */}
            <div className="glass-card crm-container-card">
              <div className="filter-bar">
                <div className="filter-group flex-1">
                  <input
                    type="text"
                    placeholder="Search by name, phone or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                </div>

                <div className="filter-actions-row">
                  <div className="filter-group">
                    <label>Category: </label>
                    <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                      {uniqueCategories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-group">
                    <label>Status: </label>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                      <option value="all">All</option>
                      <option value="Pending">Pending</option>
                      <option value="Sent">Sent</option>
                      <option value="Won">Won</option>
                      <option value="Lost">Lost</option>
                    </select>
                  </div>

                  {selectedLeads.length > 0 && (
                    <button 
                      className="btn btn-primary" 
                      onClick={() => handleStartCampaign('selected')}
                    >
                      {Icons.campaigns()} Outreach Selected ({selectedLeads.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Table list */}
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          onChange={handleSelectAll}
                          checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                        />
                      </th>
                      <th>Business Profile</th>
                      <th style={{ width: '150px' }}>Phone Call</th>
                      <th style={{ width: '130px' }}>Category</th>
                      <th style={{ width: '160px', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                          No contacts matches the active filters. Run scraper to pull maps listing records!
                        </td>
                      </tr>
                    ) : (
                      filteredLeads.map((lead) => (
                        <tr key={lead.id}>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={selectedLeads.includes(lead.id)}
                              onChange={() => handleSelectLead(lead.id)}
                            />
                          </td>
                          <td>
                            {lead.url ? (
                              <a href={lead.url} target="_blank" rel="noreferrer" className="business-profile-link" style={{ textDecoration: 'none', display: 'block' }}>
                                <div className="business-name-row">
                                  <strong>{lead.name}</strong>
                                </div>
                                <span className="location-txt-link" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                  {lead.location || 'Gurugram'}
                                </span>
                              </a>
                            ) : (
                              <>
                                <div className="business-name-row">
                                  <strong>{lead.name}</strong>
                                </div>
                                <span className="location-txt">{lead.location || 'Gurugram'}</span>
                              </>
                            )}
                          </td>
                          <td>
                            <a href={`tel:${lead.phone}`} className="phone-link-btn">
                              {lead.phone}
                            </a>
                          </td>
                          <td>
                            <span className="category-tag">{lead.category}</span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div className="status-select-container">
                              <select 
                                value={lead.status} 
                                onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value)}
                                className={`badge-select ${lead.status.toLowerCase().replace(' ', '-')}`}
                                disabled={lead.status === 'Won' || lead.status === 'Lost'}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Sent">Sent</option>
                                <option value="Won">Won</option>
                                <option value="Lost">Lost</option>
                              </select>
                              {lead.lastSentDate && (
                                <span className="status-date">
                                  {new Date(lead.lastSentDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TEMPLATES */}
        {activeTab === 'templates' && (
          <div>
            <header className="page-header">
              <h1 className="page-title">Message Templates</h1>
              <p className="page-subtitle">Manage outreach templates by category</p>
            </header>

            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Campaign Configuration
                </h2>
                {!isCreateOpen && (
                  <button className="btn" onClick={() => setIsCreateOpen(true)}>
                    {Icons.plus()} Create New Template
                  </button>
                )}
              </div>

              {isCreateOpen && (
                <div className="template-form-container">
                  <div className="form-group">
                    <label htmlFor="new-cat">Business Category Name</label>
                    <input 
                      type="text" 
                      id="new-cat" 
                      value={templateCategory} 
                      onChange={(e) => setTemplateCategory(e.target.value)} 
                      placeholder="e.g. dentists, gyms, bakeries"
                      style={{ textTransform: 'lowercase' }}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="intro-msg">Intro Template (First message to unsent leads)</label>
                    <textarea
                      id="intro-msg"
                      value={templateText}
                      onChange={(e) => setTemplateText(e.target.value)}
                      placeholder="Enter intro cold copy..."
                      className="auto-resize-textarea"
                      ref={(el) => {
                        if (el) {
                          el.style.height = 'auto';
                          el.style.height = el.scrollHeight + 'px';
                        }
                      }}
                    />
                    <span className="field-hint">Dynamic placeholders allowed: {'{{business_name}}'}, {'{{category}}'}, {'{{location}}'}</span>
                  </div>

                  <div className="form-group">
                    <label htmlFor="followup-msg">Followup Template (Message sent after 7 days delay)</label>
                    <textarea
                      id="followup-msg"
                      value={followupText}
                      onChange={(e) => setFollowupText(e.target.value)}
                      placeholder="Enter weekly follow-up copy..."
                      className="auto-resize-textarea"
                      ref={(el) => {
                        if (el) {
                          el.style.height = 'auto';
                          el.style.height = el.scrollHeight + 'px';
                        }
                      }}
                    />
                  </div>

                  <div className="form-actions-row">
                    <button className="btn" onClick={handleSaveNewTemplate}>
                      {Icons.save()} Save Template
                    </button>
                    <button className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* SAVED TEMPLATES ROW */}
              <div className="saved-templates-section">
                <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Configured Categories</h3>
                
                {Object.keys(allTemplates.categories).length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No template categories defined. Create one above!
                  </div>
                ) : (
                  <div className="templates-list-wrapper">
                    {Object.keys(allTemplates.categories).map((cat) => {
                      const isEditing = editingCategory === cat;
                      const config = allTemplates.categories[cat];

                      return (
                        <div className="template-row-item" key={cat}>
                          <div className="template-row-header">
                            <span className="cat-name">{cat}</span>
                            <div className="row-actions">
                              {isEditing ? (
                                <>
                                  <button className="btn btn-success-outline" onClick={() => handleSaveInlineTemplate(cat)}>
                                    {Icons.check()} Save
                                  </button>
                                  <button className="btn btn-danger-outline" onClick={() => setEditingCategory(null)}>
                                    {Icons.x()} Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button className="btn btn-secondary btn-sm" onClick={() => handleEditTemplate(cat)}>
                                    {Icons.edit()} Edit
                                  </button>
                                  <button className="btn btn-secondary btn-sm text-error" onClick={() => handleDeleteTemplate(cat)}>
                                    {Icons.trash()} Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {isEditing ? (
                            <div className="template-inline-editor">
                              <div className="form-group">
                                <label>Intro Copy:</label>
                                <textarea
                                  value={inlineIntroText}
                                  onChange={(e) => setInlineIntroText(e.target.value)}
                                  className="auto-resize-textarea"
                                  ref={(el) => {
                                    if (el) {
                                      el.style.height = 'auto';
                                      el.style.height = el.scrollHeight + 'px';
                                    }
                                  }}
                                />
                              </div>
                              <div className="form-group">
                                <label>Followup Copy:</label>
                                <textarea
                                  value={inlineFollowupText}
                                  onChange={(e) => setInlineFollowupText(e.target.value)}
                                  className="auto-resize-textarea"
                                  ref={(el) => {
                                    if (el) {
                                      el.style.height = 'auto';
                                      el.style.height = el.scrollHeight + 'px';
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="template-views-grid">
                              <div className="template-view-col">
                                <strong>Intro Message Preview:</strong>
                                <div className="preview-bubble">
                                  {config.introTemplate || '(Empty Template)'}
                                </div>
                              </div>
                              <div className="template-view-col">
                                <strong>Followup Message Preview:</strong>
                                <div className="preview-bubble">
                                  {config.followupTemplate || '(Empty Template)'}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: OUTREACH HUB */}
        {activeTab === 'whatsapp' && (
          <div>
            <header className="page-header">
              <h1 className="page-title">WhatsApp Outreach Hub</h1>
              <p className="page-subtitle">Manage campaigns and launch guided outreach</p>
            </header>

            {/* Campaign analytics */}
            <div className="grid-stats" style={{ marginBottom: '24px' }}>
              <div className="stat-card">
                <span className="stat-label">Queue Total</span>
                <span className="stat-value">{leads.filter(l => l.status === 'Pending' || l.status === 'Sent').length}</span>
              </div>
              <div className="stat-card success">
                <span className="stat-label">Pending Intros</span>
                <span className="stat-value text-accent">{leads.filter(l => l.status === 'Pending').length}</span>
              </div>
              <div className="stat-card warning">
                <span className="stat-label">Awaiting Followup</span>
                <span className="stat-value text-warning">
                  {leads.filter(l => {
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    return l.status === 'Sent' && l.lastSentDate && new Date(l.lastSentDate) < sevenDaysAgo;
                  }).length}
                </span>
              </div>
              <div className="stat-card success">
                <span className="stat-label">Outreach Complete</span>
                <span className="stat-value text-success">{leads.filter(l => l.status === 'Won' || l.status === 'Lost').length}</span>
              </div>
            </div>

            <div className="responsive-grid">
              
              {/* Left Column: Start Campaign */}
              <div className="glass-card">
                <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>
                  Guided Manual Campaigns
                </h2>
                
                <p className="outreach-desc-para">
                  Wizard compiles templates, copies messages to clipboard, and opens WhatsApp chat.
                </p>

                <div className="campaign-setup-form">
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label>Filter Target Category</label>
                    <select value={campaignCategory} onChange={(e) => setCampaignCategory(e.target.value)}>
                      {uniqueCategories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label>Filter Campaign Message Type</label>
                    <select value={campaignType} onChange={(e) => setCampaignType(e.target.value)}>
                      <option value="intro">Introductory Pitch</option>
                      <option value="followup">Weekly Follow-up</option>
                    </select>
                  </div>

                  <div style={{ marginTop: '4px' }}>
                    <button className="btn" onClick={() => handleStartCampaign('filtered')} style={{ width: '100%', padding: '12px' }}>
                      {Icons.campaigns()} Start Outreach Queue Conveyor
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Dispatch logs */}
              <div className="glass-card">
                <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>
                  Recent Dispatch Activity
                </h2>

                <div className="recent-dispatches-list">
                  {recentDispatches.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
                      No recent dispatches. Start outreach above to log sends.
                    </div>
                  ) : (
                    recentDispatches.map(lead => (
                      <div className="dispatch-log-row" key={lead.id}>
                        <div className="dispatch-row-title">
                          <strong>{lead.name}</strong>
                          <span className={`badge-pill ${lead.status.toLowerCase()}`}>{lead.status}</span>
                        </div>
                        <div className="dispatch-row-sub">
                          <span>{lead.phone}</span>
                          <span>{lead.lastSentDate ? new Date(lead.lastSentDate).toLocaleTimeString() : ''}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* (Modal 1: Add Contact Manually removed) */}

      {/* MODAL 2: GUIDED CAMPAIGN WIZARD */}
      {isWizardOpen && wizardLeads.length > 0 && (() => {
        const lead = wizardLeads[wizardIndex];
        const isLast = wizardIndex === wizardLeads.length - 1;
        const currentCount = wizardIndex + 1;
        const totalCount = wizardLeads.length;

        return (
          <div className="modal-overlay wizard-overlay">
            <div className="modal-content glass-card wizard-card">
              
              {/* Wizard Header Progress */}
              <div className="wizard-header">
                <div>
                  <h3>Outreach Conveyor</h3>
                  <span className="wizard-meta">
                    TYPE: {wizardMessageType.toUpperCase()} | CATEGORY: {lead.category.toUpperCase()}
                  </span>
                </div>
                <div className="wizard-progress-counter">
                  <div className="counter-val">{currentCount} / {totalCount}</div>
                  <span className="counter-lbl">Processed</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="wizard-progress-bar-container">
                <div 
                  className="wizard-progress-bar-fill" 
                  style={{ width: `${(currentCount / totalCount) * 100}%` }} 
                />
              </div>

              {/* Active Lead Details */}
              <div className="wizard-lead-detail-box">
                <div>
                  <span className="lbl">Target Client</span>
                  <div className="name-row">
                    <strong>{lead.name}</strong>
                  </div>
                  {lead.url ? (
                    <a href={lead.url} target="_blank" rel="noreferrer" className="location-row" style={{ display: 'block', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                      {lead.location || 'Gurugram'}
                    </a>
                  ) : (
                    <div className="location-row">{lead.location || 'Gurugram'}</div>
                  )}
                </div>
              </div>

              {/* Editable Message Text Box */}
              <div className="form-group" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label htmlFor="wizard-msg-box">Personalized Copy</label>
                </div>
                <textarea
                  id="wizard-msg-box"
                  value={wizardCustomText}
                  onChange={(e) => setWizardCustomText(e.target.value)}
                  placeholder="Sales pitch will compile here..."
                  className="wizard-textarea auto-resize-textarea"
                  ref={(el) => {
                    if (el) {
                      el.style.height = 'auto';
                      el.style.height = el.scrollHeight + 'px';
                    }
                  }}
                />
              </div>

              {/* Action Buttons Row */}
              <div className="wizard-footer-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setIsWizardOpen(false)}
                >
                  Terminate Run
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={handleWizardSkip}
                  style={{ marginLeft: 'auto' }}
                >
                  Skip Contact
                </button>

                <button
                  className="btn"
                  onClick={handleTriggerWhatsApp}
                >
                  {Icons.phone()} Send Message
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Bottom Navigation for Mobile View */}
      <nav className="bottom-nav">
        <div 
          className={`bottom-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleTabClick('dashboard')}
        >
          {Icons.dashboard()}
          <span>Dashboard</span>
        </div>
        <div 
          className={`bottom-nav-item ${activeTab === 'contacts' ? 'active' : ''}`}
          onClick={() => handleTabClick('contacts')}
        >
          {Icons.contacts()}
          <span>CRM</span>
        </div>
        <div 
          className={`bottom-nav-item ${activeTab === 'whatsapp' ? 'active' : ''}`}
          onClick={() => handleTabClick('whatsapp')}
        >
          {Icons.campaigns()}
          <span>Outreach</span>
        </div>
      </nav>

    </div>
  );
}
