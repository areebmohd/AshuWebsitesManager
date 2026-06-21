'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';

const API_BASE = typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:3001`
  : 'http://localhost:3001';

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

const DEFAULT_INTRO = `Hey {{business_name}}! 🍔

I noticed you have a great business listing on Google Maps in {{location}}, but you don't have a website to showcase your services and get direct orders/bookings.

Having your own website is essential to get direct clients without paying heavy middleman commissions. We can help you build a custom website starting at just ₹999! 🚀

If you are interested, we can send you some of our demo previews. Let us know if you'd like to check them out.`;

const DEFAULT_FOLLOWUP = `Hey {{business_name}}! 🍔

Just following up on my previous message.

We can launch your premium custom website—complete with an easy dashboard to track all your clients—in just 2 days for only ₹999! 🚀

If you'd be interested to see how it looks, we can share some demo previews with you. Let us know if you want to take a look!`;

const SEED_TEMPLATES = {
  "restaurants": {
    "introTemplate": "Hey {{business_name}}! 🍔\n\nI noticed you have a great restaurant listing on Google Maps in {{location}}, but you don't have a website to showcase your menu and get direct online orders.\n\nSince everyone is ordering online now, having your own website is essential to get direct orders without paying heavy commissions to Swiggy/Zomato. We can help you build a custom website starting at just ₹999! 🚀\n\nIf you are interested, we can send you some of our demo previews. If you like them, we can create your very own site! Let us know if you'd like to check them out.",
    "followupTemplate": "Hey {{business_name}}! 🍔\n\nJust following up on my previous message.\n\nSince everyone is moving online, we can launch your premium custom website—complete with an easy dashboard to track all your orders—in just 2 days for only ₹999! 🚀\n\nIf you'd be interested to see how it looks, we can share some demo previews with you. If you like what you see, we can create a custom site specifically for your business!"
  },
  "clinics": {
    "introTemplate": "Hello {{business_name}}! 🩺\n\nI saw your medical clinic profile on Google Maps in {{location}}, but you don't have a website for patients to book appointments directly.\n\nHaving your own professional website is essential to manage appointments smoothly and build trust. We can help you build a custom booking website starting at just ₹999! 🚀\n\nIf you are interested, we can send you some of our clinic website demo previews. If you like them, we can create your very own booking site! Let us know if you'd like to check them out.",
    "followupTemplate": "Hello {{business_name}}! 🩺\n\nJust following up on my previous message.\n\nGive your patients a seamless way to book appointments while keeping your reception organized. We can launch your custom clinic-booking website in just 2 days for only ₹999! 🚀\n\nIf you'd be interested, we can send you some demo booking layouts. If you like them, we can set up your own clinic booking site!"
  },
  "salons": {
    "introTemplate": "Hey {{business_name}}! ✂️\n\nI saw your salon profile on Google Maps in {{location}}, but you don't have a website for direct client appointment booking.\n\nWe build custom booking websites for salons that let clients schedule appointments directly. We can set up a premium booking website starting at just ₹999! 🚀\n\nIf you are interested, we can send you some salon website demo previews. If you like them, we can create your very own site! Let us know if you'd like to check them out.",
    "followupTemplate": "Hey {{business_name}}! ✂️\n\nJust following up on my previous message.\n\nWe can build your salon's direct booking portal and services catalog in just 2 days for only ₹999! 🚀\n\nIf you'd be interested, we can share some demo scheduling pages. If you like what you see, we can build one specifically for your salon!"
  },
  "clothing shops": {
    "introTemplate": "Hey {{business_name}}! 👗\n\nI saw your clothing shop listing on Google Maps in {{location}}, but you don't have a website to showcase your catalog and collection.\n\nWe build custom digital catalog websites for apparel shops that let customers browse your styles. We can help you build your custom catalog website starting at just ₹999! 🚀\n\nIf you are interested, we can send you some boutique catalog demo previews. If you like them, we can create your very own site! Let us know if you'd like to check them out.",
    "followupTemplate": "Hey {{business_name}}! 👗\n\nJust following up on my previous message.\n\nWe can launch your digital shop catalog and ordering system in just 2 days for only ₹999! 🚀\n\nIf you'd be interested, we can send you some demo catalogs to browse. If you like them, we can create a custom site for your clothing shop!"
  },
  "electronics shops": {
    "introTemplate": "Hey {{business_name}}! ⚡\n\nI saw your electronics shop profile on Google Maps in {{location}}, but you don't have a website to showcase your inventory.\n\nWe build custom product catalog websites for electronics shops that let clients browse spec sheets and request quotes. We can build your premium catalog website starting at just ₹999! 🚀\n\nIf you are interested, we can send you some electronics shop demo previews. If you like them, we can create your very own site! Let us know if you'd like to check them out.",
    "followupTemplate": "Hey {{business_name}}! ⚡\n\nJust following up on my previous message.\n\nWe can launch your digital catalog inventory system and quote request portal in just 2 days for only ₹999! 🚀\n\nIf you'd be interested to see, we can share some demo shop layouts. If you like them, we can build a custom site for your business!"
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

  const [scraperHistory, setScraperHistory] = useState([]);

  const consoleEndRef = useRef(null);

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
  const [isMessageOpened, setIsMessageOpened] = useState(false);

  // Server Socket Status
  const [isBackendOnline, setIsBackendOnline] = useState(false);

  // ----------------------------------------------------------------------------
  // Data Lifecycle (Synchronization & Migration)
  // ----------------------------------------------------------------------------
  useEffect(() => {
    // 1. Load leads from localStorage, fallback to public/leads.json
    const loadLeads = async () => {
      try {
        const localLeads = localStorage.getItem('ashu_leads');
        if (localLeads) {
          setLeads(JSON.parse(localLeads));
        } else {
          const res = await fetch('/leads.json');
          if (res.ok) {
            const data = await res.json();
            setLeads(data);
            localStorage.setItem('ashu_leads', JSON.stringify(data));
          } else {
            setLeads([]);
            localStorage.setItem('ashu_leads', JSON.stringify([]));
          }
        }
      } catch (err) {
        console.error('Error loading leads database:', err);
        setLeads([]);
      }
    };

    // 2. Load templates from localStorage, fallback to seeding defaults
    const loadTemplates = () => {
      try {
        const localTemplates = localStorage.getItem('ashu_templates');
        if (localTemplates) {
          setAllTemplates(JSON.parse(localTemplates));
        } else {
          const seeded = { categories: SEED_TEMPLATES };
          setAllTemplates(seeded);
          localStorage.setItem('ashu_templates', JSON.stringify(seeded));
        }
      } catch (err) {
        console.error('Error loading templates:', err);
      }
    };

    // 3. Load scraper history from localStorage
    const loadScraperHistory = () => {
      try {
        const localHistory = localStorage.getItem('ashu_scraper_history');
        const parsedHistory = localHistory ? JSON.parse(localHistory) : [];
        if (parsedHistory && parsedHistory.length > 0) {
          setScraperHistory(parsedHistory);
        } else {
          setScraperHistory(SEED_SCRAPER_HISTORY);
          localStorage.setItem('ashu_scraper_history', JSON.stringify(SEED_SCRAPER_HISTORY));
        }
      } catch (err) {
        console.error('Error loading scraper history:', err);
      }
    };

    loadLeads();
    loadTemplates();
    loadScraperHistory();

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
          setScraperStats((prev) => ({
            ...prev,
            scanned: Number(match[1]),
            total: Number(match[2])
          }));
        }
      } else if (message.includes('already has a website')) {
        setScraperStats((prev) => ({ ...prev, skippedWebsite: prev.skippedWebsite + 1 }));
      } else if (message.includes('is not a mobile number')) {
        setScraperStats((prev) => ({ ...prev, skippedLandline: prev.skippedLandline + 1 }));
      } else if (message.includes('already exists in contacts database') || message.includes('Duplicate:')) {
        setScraperStats((prev) => ({ ...prev, skippedDuplicate: prev.skippedDuplicate + 1 }));
      } else if (message.includes('has no phone number listed')) {
        setScraperStats((prev) => ({ ...prev, noPhone: prev.noPhone + 1 }));
      } else if (message.includes('Lead Saved:') || message.includes('Lead Found:') || message.includes('savedCount')) {
        setScraperStats((prev) => ({ ...prev, saved: prev.saved + 1 }));
      }

      if (message.includes('Scraping session completed') || message.includes('Fatal error') || message.includes('Scraping process idle.')) {
        setIsScraping(false);
      }
    });

    socket.on('lead_scraped', (newLead) => {
      setLeads((prev) => {
        // Prevent duplicates in real time
        const cleanNewPhone = newLead.phone.replace(/[^0-9]/g, '');
        if (prev.some((l) => l.phone.replace(/[^0-9]/g, '') === cleanNewPhone)) return prev;
        const updated = [newLead, ...prev];
        localStorage.setItem('ashu_leads', JSON.stringify(updated));
        return updated;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Sync logs scroll
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
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
      setIsMessageOpened(false);
    }
  }, [wizardIndex, wizardLeads, isWizardOpen]);

  // Save search query parameters to scraper history when run completes
  const wasScrapingRef = useRef(false);
  useEffect(() => {
    if (isScraping) {
      wasScrapingRef.current = true;
    } else if (wasScrapingRef.current) {
      wasScrapingRef.current = false;
      
      // Save history record
      setScraperHistory((prevHistory) => {
        // Prevent adding empty runs or runs where nothing was even scanned if it's aborted immediately
        if (scraperStats.total === 0 && scraperStats.scanned === 0) return prevHistory;

        // Check if history already contains a run with exact same category and location within past 1 minute to prevent double recording
        const isDuplicateRun = prevHistory.some(
          (run) => 
            run.category.toLowerCase().trim() === scrapeCategory.toLowerCase().trim() &&
            run.location.toLowerCase().trim() === scrapeLocation.toLowerCase().trim() &&
            (Date.now() - run.timestamp) < 60000
        );
        if (isDuplicateRun) return prevHistory;

        const newRecord = {
          id: Date.now().toString(),
          category: scrapeCategory,
          location: scrapeLocation,
          timestamp: Date.now(),
          saved: scraperStats.saved,
          total: scraperStats.total,
          skippedWebsite: scraperStats.skippedWebsite,
          skippedLandline: scraperStats.skippedLandline,
          skippedDuplicate: scraperStats.skippedDuplicate,
          noPhone: scraperStats.noPhone
        };
        const updated = [newRecord, ...prevHistory];
        localStorage.setItem('ashu_scraper_history', JSON.stringify(updated));
        return updated;
      });
    }
  }, [isScraping, scrapeCategory, scrapeLocation, scraperStats]);

  const alreadyScrapedRun = useMemo(() => {
    if (!scrapeCategory || !scrapeLocation) return null;
    const catSearch = scrapeCategory.toLowerCase().trim();
    const locSearch = scrapeLocation.toLowerCase().trim();
    return scraperHistory.find(
      (run) => 
        run.category.toLowerCase().trim() === catSearch &&
        run.location.toLowerCase().trim() === locSearch
    );
  }, [scrapeCategory, scrapeLocation, scraperHistory]);

  // ----------------------------------------------------------------------------
  // Local CRM Database Handlers (State + LocalStorage)
  // ----------------------------------------------------------------------------
  const handleUpdateLeadStatus = (id, status, notes = undefined) => {
    const updated = leads.map((lead) => {
      if (lead.id === id) {
        const copy = { ...lead, status, updatedAt: new Date().toISOString() };
        if (status === 'Sent' || status === 'Failed') {
          copy.lastSentDate = new Date().toISOString();
        }
        if (notes !== undefined) {
          copy.notes = notes.trim();
        }
        return copy;
      }
      return lead;
    });
    setLeads(updated);
    localStorage.setItem('ashu_leads', JSON.stringify(updated));
  };



  // ----------------------------------------------------------------------------
  // Scraper Actions
  // ----------------------------------------------------------------------------
  const handleStartScrape = async () => {
    if (!isBackendOnline) {
      alert('Backend scraping engine is offline. Please launch the backend server first.');
      return;
    }
    if (!scrapeCategory || !scrapeLocation) {
      alert('Please enter both a Category and Location to scrape.');
      return;
    }

    setIsScraping(true);
    setLogs([]);
    setScraperStats({
      scanned: 0,
      total: 0,
      saved: 0,
      skippedWebsite: 0,
      skippedLandline: 0,
      skippedDuplicate: 0,
      noPhone: 0
    });
    setLogs((prev) => [...prev, `[System] Search query requested: "${scrapeCategory} in ${scrapeLocation}"`]);

    try {
      const res = await fetch(`${API_BASE}/api/scrape/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          category: scrapeCategory, 
          location: scrapeLocation,
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
    setEditingCategory(null);
  };

  const handleDeleteTemplate = (cat) => {
    if (!confirm(`Are you sure you want to delete the outreach template for "${cat}"?`)) return;
    const categoriesCopy = { ...allTemplates.categories };
    delete categoriesCopy[cat];

    const updated = { ...allTemplates, categories: categoriesCopy };
    setAllTemplates(updated);
    localStorage.setItem('ashu_templates', JSON.stringify(updated));
    if (editingCategory === cat) setEditingCategory(null);
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
    setIsMessageOpened(true);
  };

  const handleWizardSubmitResult = (status) => {
    const lead = wizardLeads[wizardIndex];
    if (!lead) return;

    const notesMsg = status === 'Sent' 
      ? `${wizardMessageType === 'intro' ? 'Intro' : 'Followup'} sent manually via Guided Campaign`
      : 'WhatsApp number lookup failed or invalid JID';

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

  // ----------------------------------------------------------------------------
  // Dashboard & Metrics State (Derived Computations)
  // ----------------------------------------------------------------------------
  const stats = useMemo(() => {
    const total = leads.length;
    const sent = leads.filter((l) => ['Sent', 'Won', 'Lost'].includes(l.status)).length;
    const won = leads.filter((l) => l.status === 'Won').length;
    const lost = leads.filter((l) => l.status === 'Lost').length;
    
    return {
      total,
      sent,
      won,
      lost,
      pending: leads.filter(l => l.status === 'Pending').length,
      failed: leads.filter(l => l.status === 'Failed').length,
      conversionRate: total > 0 ? ((won / total) * 100).toFixed(1) : '0'
    };
  }, [leads]);

  const uniqueCategories = useMemo(() => {
    const cats = new Set(leads.map((l) => l.category));
    return ['all', ...Array.from(cats)];
  }, [leads]);

  const configCategories = useMemo(() => {
    const predefined = ['restaurants', 'salons', 'clinics', 'clothing shops', 'electronics shops'];
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
      .filter((l) => ['Sent', 'Failed'].includes(l.status) && l.lastSentDate)
      .sort((a, b) => new Date(b.lastSentDate) - new Date(a.lastSentDate))
      .slice(0, 8);
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
                  {Icons.info()} Campaign Progress Chart
                </h2>
                <div className="bar-chart-container">
                  <div className="chart-bar-row">
                    <span className="chart-bar-label">Pending ({stats.pending})</span>
                    <div className="chart-bar-wrapper">
                      <div className="chart-bar-fill pending" style={{ width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <div className="chart-bar-row">
                    <span className="chart-bar-label">Sent ({stats.sent - stats.won - stats.lost})</span>
                    <div className="chart-bar-wrapper">
                      <div className="chart-bar-fill sent" style={{ width: `${stats.total > 0 ? ((stats.sent - stats.won - stats.lost) / stats.total) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <div className="chart-bar-row">
                    <span className="chart-bar-label">Failed ({stats.failed})</span>
                    <div className="chart-bar-wrapper">
                      <div className="chart-bar-fill failed" style={{ width: `${stats.total > 0 ? (stats.failed / stats.total) * 100 : 0}%` }} />
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

            <div className="glass-card">
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
                    {configCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="location">Target Region Location</label>
                  <input
                    type="text"
                    id="location"
                    value={scrapeLocation}
                    onChange={(e) => setScrapeLocation(e.target.value)}
                    disabled={isScraping}
                    placeholder="e.g. Sector 51 Gurugram"
                  />
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
                    <strong>Already scraped before:</strong> You scraped {alreadyScrapedRun.saved} contacts of "{alreadyScrapedRun.category}" in "{alreadyScrapedRun.location}" on {new Date(alreadyScrapedRun.timestamp).toLocaleDateString()}.
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
                    {isScraping ? Icons.sync("animate-spin") : Icons.check("text-success")}
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
                  <div className="console-box">
                    {logs.map((log, index) => (
                      <div key={index}>{log}</div>
                    ))}
                    <div ref={consoleEndRef} />
                  </div>
                </div>
              )}
            </div>

            {/* Scraper History Section */}
            <div className="glass-card" style={{ marginTop: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>
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
                        <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', width: '40%', border: '1px solid var(--border-color)' }}>Location</th>
                        <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', textAlign: 'center', width: '20%', border: '1px solid var(--border-color)' }}>Saved Contacts</th>
                        <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', textAlign: 'center', width: '20%', border: '1px solid var(--border-color)' }}>Searched Contacts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scraperHistory.map((run) => (
                        <tr key={run.id}>
                          <td style={{ padding: '12px 16px', textTransform: 'capitalize', fontSize: '13px', border: '1px solid var(--border-color)' }}>
                            <span className="badge category-badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                              {run.category}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>{run.location}</td>
                          <td style={{ padding: '12px 16px', fontSize: '13px', textAlign: 'center', color: 'var(--success)', fontWeight: '700', border: '1px solid var(--border-color)' }}>{run.saved}</td>
                          <td style={{ padding: '12px 16px', fontSize: '13px', textAlign: 'center', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>{run.total || 0}</td>
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
            <div className="glass-card">
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
                      <option value="Failed">Failed</option>
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
                            <div className="business-name-row">
                              <strong>{lead.name}</strong>
                            </div>
                            {lead.url ? (
                              <a href={lead.url} target="_blank" rel="noreferrer" className="location-txt-link" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', textDecoration: 'none' }}>
                                {lead.location || 'Gurugram'}
                              </a>
                            ) : (
                              <span className="location-txt">{lead.location || 'Gurugram'}</span>
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
                                <option value="Failed">Failed</option>
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
                <span className="stat-label">Pending (Intros)</span>
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
                <h2 style={{ fontSize: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
                  Guided Manual Campaigns
                </h2>
                
                <p className="outreach-desc-para">
                  Wizard compiles templates, copies messages to clipboard, and opens WhatsApp chat.
                </p>

                <div className="campaign-setup-form">
                  <div className="form-group">
                    <label>Filter Target Category</label>
                    <select value={campaignCategory} onChange={(e) => setCampaignCategory(e.target.value)}>
                      {uniqueCategories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Filter Campaign Message Type</label>
                    <select value={campaignType} onChange={(e) => setCampaignType(e.target.value)}>
                      <option value="intro">Introductory Pitch (Unsent leads)</option>
                      <option value="followup">Weekly Follow-up (Sent leads &gt; 7 days old)</option>
                    </select>
                  </div>

                  <div style={{ marginTop: '24px' }}>
                    <button className="btn" onClick={() => handleStartCampaign('filtered')} style={{ width: '100%', padding: '12px' }}>
                      {Icons.campaigns()} Start Outreach Queue Conveyor
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Dispatch logs */}
              <div className="glass-card">
                <h2 style={{ fontSize: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
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
                  <h3>Guided Campaign Conveyor Belt</h3>
                  <span className="wizard-meta">
                    QUEUE TYPE: {wizardMessageType.toUpperCase()} | CATEGORY: {lead.category.toUpperCase()}
                  </span>
                </div>
                <div className="wizard-progress-counter">
                  <div className="counter-val">{currentCount} / {totalCount}</div>
                  <span className="counter-lbl">Leads Processed</span>
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
                <div className="phone-col">
                  <span className="lbl">WhatsApp Contact</span>
                  <a href={`tel:${lead.phone}`} className="phone-tag">{lead.phone}</a>
                </div>
              </div>

              {/* Editable Message Text Box */}
              <div className="form-group" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label htmlFor="wizard-msg-box">Personalized Copy (Edit on the fly):</label>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Changes won't affect base template</span>
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

                {!isMessageOpened ? (
                  <>
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
                      {Icons.phone()} Copy & Launch WhatsApp Chat
                    </button>
                  </>
                ) : (
                  <>
                    <span className="dispatch-verify-prompt" style={{ marginLeft: 'auto' }}>
                      Did the message send successfully?
                    </span>
                    <button
                      className="btn btn-danger-outline"
                      onClick={() => handleWizardSubmitResult('Failed')}
                    >
                      {Icons.x()} Failed
                    </button>

                    <button
                      className="btn"
                      onClick={() => handleWizardSubmitResult('Sent')}
                      style={{ background: 'var(--success)', color: '#fff' }}
                    >
                      {Icons.check()} Marked Sent
                    </button>
                  </>
                )}
              </div>

            </div>
          </div>
        );
      })()}

      {/* Bottom Navigation for Mobile View */}
      <nav className="bottom-nav">
        <div 
          className={`bottom-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          {Icons.dashboard()}
          <span>Dashboard</span>
        </div>
        <div 
          className={`bottom-nav-item ${activeTab === 'contacts' ? 'active' : ''}`}
          onClick={() => setActiveTab('contacts')}
        >
          {Icons.contacts()}
          <span>CRM</span>
        </div>
        <div 
          className={`bottom-nav-item ${activeTab === 'whatsapp' ? 'active' : ''}`}
          onClick={() => setActiveTab('whatsapp')}
        >
          {Icons.campaigns()}
          <span>Outreach</span>
        </div>
      </nav>

    </div>
  );
}
