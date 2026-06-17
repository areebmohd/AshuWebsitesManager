'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';

const API_BASE = 'http://localhost:3001';

const Icons = {
  dashboard: (className = "") => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="10" rx="1"/><rect width="7" height="5" x="3" y="14" rx="1"/></svg>
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
  phone: (className = "") => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
  ),
  disconnect: (className = "") => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18.8 4A10 10 0 0 1 20 12c0 2.2-.7 4.3-2 6"/><path d="M14 10V5c0-1.1-.9-2-2-2H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8c1.1 0 2-.9 2-2v-5"/><path d="M18 10h4"/><path d="M12 10h-2"/><path d="M6 10H4"/></svg>
  ),
  sync: (className = "") => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.72 2.78L21 8"/><polyline points="21 3 21 8 16 8"/></svg>
  ),
  link: (className = "") => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
  ),
  logo: (className = "") => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="url(#logo-grad)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
      </defs>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  ),
  info: (className = "") => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
  ),
  trophy: (className = "") => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"/><path d="M12 2a8 8 0 0 0-8 8h16a8 8 0 0 0-8-8z"/></svg>
  ),
  thumbsDown: (className = "") => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 14V2a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4l3 3L17 14z"/><path d="M22 14a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2z"/></svg>
  ),
  alertTriangle: (className = "") => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  ),
  terminal: (className = "") => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
  )
};

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({
    totalLeads: 0,
    sentLeads: 0,
    repliedLeads: 0,
    wonLeads: 0,
    lostLeads: 0,
    conversionRate: '0.0'
  });

  // Scraper Tab State
  const [scrapeCategory, setScrapeCategory] = useState('restaurants');
  const [scrapeLocation, setScrapeLocation] = useState('Gurugram');
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
  const consoleEndRef = useRef(null);

  // Contacts Tab State (Filters)
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedLeads, setSelectedLeads] = useState([]);

  // Campaign Tab State
  const [whatsappStatus, setWhatsappStatus] = useState('disconnected');
  const [whatsappQR, setWhatsappQR] = useState(null);
  const [demoLink1, setDemoLink1] = useState('');
  const [demoLink2, setDemoLink2] = useState('');
  const [templateCategory, setTemplateCategory] = useState('restaurants');
  const [templateText, setTemplateText] = useState('');
  const [followupText, setFollowupText] = useState('');
  const [allTemplates, setAllTemplates] = useState({ categories: {} });
  const [outreachOperation, setOutreachOperation] = useState('Idle (Disconnected)');
  const [campaignProgress, setCampaignProgress] = useState(null);

  // ----------------------------------------------------------------------------
  // Socket.io Connection & Data Fetching
  // ----------------------------------------------------------------------------
  useEffect(() => {
    // 1. Fetch initial leads
    fetchLeads();
    fetchStats();
    fetchTemplates();
    fetchOutreachStatus();

    // 2. Setup socket
    const socket = io(API_BASE);

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
      } else if (message.includes('Lead Saved:') || message.includes('savedCount') || message.includes('Lead Saved')) {
        setScraperStats((prev) => ({ ...prev, saved: prev.saved + 1 }));
      }

      if (message.includes('Scraping session completed') || message.includes('Fatal error') || message.includes('Scraping process idle.')) {
        setIsScraping(false);
      }
    });

    socket.on('lead_scraped', (newLead) => {
      setLeads((prev) => {
        // Prevent local double rendering if list already has it
        if (prev.some((l) => l.id === newLead.id)) return prev;
        return [newLead, ...prev];
      });
      // Recalculate stats dynamically
      updateLocalStats();
    });

    socket.on('lead_updated', (updatedLead) => {
      setLeads((prev) => prev.map((l) => (l.id === updatedLead.id ? updatedLead : l)));
      updateLocalStats();
    });

    socket.on('whatsapp_status', (status) => {
      setWhatsappStatus(status);
      if (status === 'ready' || status === 'authenticated') {
        setWhatsappQR(null); // Clear QR if authenticated
      }
    });

    socket.on('whatsapp_qr', (qrDataUri) => {
      setWhatsappQR(qrDataUri);
    });

    socket.on('outreach_operation', (status) => {
      setOutreachOperation(status);
    });

    socket.on('campaign_progress', (progress) => {
      setCampaignProgress(progress);
      if (progress.current === progress.total) {
        setTimeout(() => setCampaignProgress(null), 5000); // Clear progress indicator after 5s
      }
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

  // Recalculate stats whenever leads state updates
  useEffect(() => {
    updateLocalStats();
  }, [leads]);

  const fetchLeads = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/leads`);
      const data = await res.json();
      setLeads(data);
    } catch (err) {
      console.error('Error fetching leads:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/stats`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchOutreachStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/outreach/status`);
      const data = await res.json();
      if (data.status) {
        setOutreachOperation(data.status);
      }
    } catch (err) {
      console.error('Error fetching outreach status:', err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/templates`);
      const data = await res.json();
      setAllTemplates(data);
      
      const categories = Object.keys(data.categories || {});
      if (categories.length > 0) {
        const firstCat = categories[0];
        setTemplateCategory(firstCat);
        setDemoLink1(data.categories[firstCat].demoLink1 || '');
        setDemoLink2(data.categories[firstCat].demoLink2 || '');
        setTemplateText(data.categories[firstCat].introTemplate || '');
        setFollowupText(data.categories[firstCat].followupTemplate || '');
      } else {
        setTemplateCategory('restaurants');
        setDemoLink1('');
        setDemoLink2('');
        setTemplateText(`Hey {{business_name}}!\n\nI noticed you have a great restaurant listing on Google Maps in {{location}} but don't have a website for direct online ordering.\n\nWe build custom ordering websites that let you take direct orders on WhatsApp without paying Zomato/Swiggy commissions.\n\nHere are some of our previews:\n- Preview 1: {{demo_link1}}\n- Preview 2: {{demo_link2}}\n\nReply back if you want to see a free mockup built for your restaurant!`);
        setFollowupText(`Hey {{business_name}}!\n\nJust following up on my previous message. We can build your direct-ordering menu website in just 2 days.\n\nHere are the previews again:\n- Preview 1: {{demo_link1}}\n- Preview 2: {{demo_link2}}\n\nWould you be open to a quick call to check out a mockup?`);
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  };

  const handleSaveTemplates = async () => {
    const cleanCategory = templateCategory.toLowerCase().trim();
    if (!cleanCategory) {
      alert('Please enter a Category first.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/templates/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: cleanCategory,
          introTemplate: templateText,
          followupTemplate: followupText,
          demoLink1,
          demoLink2
        })
      });
      if (res.ok) {
        alert(`Templates for category "${cleanCategory}" saved successfully on the server!`);
        fetchTemplates(); // Refresh template list
      } else {
        alert('Failed to save templates.');
      }
    } catch (err) {
      console.error('Error saving templates:', err);
    }
  };

  const handleEditTemplate = (cat) => {
    setTemplateCategory(cat);
    if (allTemplates.categories && allTemplates.categories[cat]) {
      setDemoLink1(allTemplates.categories[cat].demoLink1 || '');
      setDemoLink2(allTemplates.categories[cat].demoLink2 || '');
      setTemplateText(allTemplates.categories[cat].introTemplate || '');
      setFollowupText(allTemplates.categories[cat].followupTemplate || '');
    }
  };

  const updateLocalStats = () => {
    if (leads.length === 0) return;
    const totalLeads = leads.length;
    const sentLeads = leads.filter((l) => ['Sent', 'Replied', 'Won', 'Lost'].includes(l.status)).length;
    const repliedLeads = leads.filter((l) => ['Replied', 'Won', 'Lost'].includes(l.status)).length;
    const wonLeads = leads.filter((l) => l.status === 'Won').length;
    const lostLeads = leads.filter((l) => l.status === 'Lost').length;

    setStats({
      totalLeads,
      sentLeads,
      repliedLeads,
      wonLeads,
      lostLeads,
      conversionRate: ((wonLeads / totalLeads) * 100).toFixed(1)
    });
  };

  // ----------------------------------------------------------------------------
  // Action Handlers
  // ----------------------------------------------------------------------------
  const handleStartScrape = async () => {
    if (!scrapeCategory || !scrapeLocation) {
      alert('Please fill in both Category and Location before starting.');
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
          scrollDepth: Number(scrollDepth)
        })
      });
      if (!res.ok) {
        const err = await res.json();
        setLogs((prev) => [...prev, `[Error] ${err.error}`]);
        setIsScraping(false);
      }
    } catch (err) {
      setLogs((prev) => [...prev, `[Error] Failed to communicate with backend: ${err.message}`]);
      setIsScraping(false);
    }
  };

  // Scraper finishes automatically, we listen to log feeds. When the browser finishes, it logs.
  // We can let the user stop the scraper by closing browser via activeScraper flag backend.
  // For simplicity, we let the backend handle termination.

  const handleConnectWhatsApp = async () => {
    try {
      await fetch(`${API_BASE}/api/whatsapp/connect`, { method: 'POST' });
    } catch (err) {
      console.error('Error starting WhatsApp connection:', err);
    }
  };

  const handleLogoutWhatsApp = async () => {
    try {
      await fetch(`${API_BASE}/api/whatsapp/logout`, { method: 'POST' });
      setWhatsappQR(null);
    } catch (err) {
      console.error('Error logging out WhatsApp:', err);
    }
  };

  const handleUpdateLeadStatus = async (id, status) => {
    try {
      await fetch(`${API_BASE}/api/leads/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates: { status } })
      });
    } catch (err) {
      console.error('Error updating lead status:', err);
    }
  };

  const handleSaveNotes = async (id, notesText) => {
    try {
      await fetch(`${API_BASE}/api/leads/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates: { notes: notesText } })
      });
    } catch (err) {
      console.error('Error saving notes:', err);
    }
  };

  // Run Campaign
  const handleLaunchCampaign = async (type = 'intro') => {
    let targetIds = [];
    let template = '';
    let isFollowup = false;

    if (type === 'intro') {
      // Send to all 'Pending' leads in filtered category/list
      targetIds = filteredLeads.filter((l) => l.status === 'Pending').map((l) => l.id);
      template = templateText;
      isFollowup = false;
    } else if (type === 'followup') {
      // Send followups to all leads who are 'Sent'
      targetIds = filteredLeads.filter((l) => l.status === 'Sent').map((l) => l.id);
      template = followupText;
      isFollowup = true;
    } else if (type === 'selected') {
      // Send template to selected checkbox items
      targetIds = selectedLeads;
      template = templateText;
      isFollowup = false;
    }

    if (targetIds.length === 0) {
      alert('No target leads found for this campaign configuration!');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/campaign/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: targetIds, template, demoLink, isFollowup })
      });
      
      if (!res.ok) {
        const err = await res.json();
        alert(`Failed to launch campaign: ${err.error}`);
      } else {
        setSelectedLeads([]); // Clear selection
      }
    } catch (err) {
      console.error('Error launching campaign:', err);
    }
  };

  // ----------------------------------------------------------------------------
  // Filter & Search Logics
  // ----------------------------------------------------------------------------
  const uniqueCategories = useMemo(() => {
    const cats = new Set(leads.map((l) => l.category));
    return ['all', ...Array.from(cats)];
  }, [leads]);

  const scraperCategories = useMemo(() => {
    const predefined = ['restaurants', 'salons', 'clinics', 'clothing shops', 'electronics shops'];
    const customCats = allTemplates.categories ? Object.keys(allTemplates.categories) : [];
    const union = new Set([...predefined, ...customCats]);
    return Array.from(union);
  }, [allTemplates]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // 1. Search Query (matches name, phone, location)
      const matchesSearch =
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.includes(searchQuery) ||
        lead.location.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Category Filter
      const matchesCategory = filterCategory === 'all' || lead.category === filterCategory;

      // 3. Status Filter
      const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [leads, searchQuery, filterCategory, filterStatus]);

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
          <span className="brand-logo">Ashu Websites</span>
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
            className={`nav-item ${activeTab === 'campaigns' ? 'active' : ''}`}
            onClick={() => setActiveTab('campaigns')}
          >
            {Icons.campaigns()} Campaigns
          </li>
        </ul>
      </aside>

      {/* Main Content Pane */}
      <main className="main-content">
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>
            <header className="page-header">
              <h1 className="page-title">Outreach Dashboard</h1>
              <p className="page-subtitle">Real-time status overview of your cold outreach pipelines</p>
            </header>

            {/* Metrics Row */}
            <div className="grid-stats">
              <div className="stat-card">
                <span className="stat-label">Total Leads Scraped</span>
                <span className="stat-value">{stats.totalLeads}</span>
              </div>
              <div className="stat-card success">
                <span className="stat-label">Messages Sent</span>
                <span className="stat-value">{stats.sentLeads}</span>
              </div>
              <div className="stat-card warning">
                <span className="stat-label">Total Replies</span>
                <span className="stat-value">{stats.repliedLeads}</span>
              </div>
              <div className="stat-card success">
                <span className="stat-label">Leads Won</span>
                <span className="stat-value">{stats.wonLeads}</span>
              </div>
              <div className="stat-card error">
                <span className="stat-label">Leads Lost</span>
                <span className="stat-value">{stats.lostLeads}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Conversion Rate</span>
                <span className="stat-value">{stats.conversionRate}%</span>
              </div>
            </div>

            {/* Quick Actions / Tips */}
            <div className="glass-card">
              <h2 style={{ marginBottom: '16px', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {Icons.info()} Quick Instructions
              </h2>
              <ul style={{ paddingLeft: '20px', lineHeight: '1.8', color: '#94a3b8' }}>
                <li>Go to the <strong>Lead Scraper</strong> tab to extract fresh restaurant or salon phone numbers in Gurugram.</li>
                <li>Go to the <strong>Campaigns</strong> tab, launch your WhatsApp session, and scan the QR code to pair your device.</li>
                <li>Write your template with custom message hooks and fire the campaign.</li>
                <li>Check the <strong>Contacts CRM</strong> table to track who has replied and flag wins!</li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 2: SCRAPER */}
        {activeTab === 'scraper' && (
          <div>
            <header className="page-header">
              <h1 className="page-title">Lead Scraper</h1>
              <p className="page-subtitle">Extract local businesses from Google Maps automatically</p>
            </header>

            <div className="glass-card">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category">Business Category</label>
                  <select
                    id="category"
                    value={scrapeCategory}
                    onChange={(e) => setScrapeCategory(e.target.value)}
                    disabled={isScraping}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {scraperCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="location">Target Location</label>
                  <input
                    type="text"
                    id="location"
                    value={scrapeLocation}
                    onChange={(e) => setScrapeLocation(e.target.value)}
                    disabled={isScraping}
                  />
                </div>
              </div>

              <div className="form-row" style={{ marginTop: '16px' }}>
                <div className="form-group">
                  <label htmlFor="scroll-depth">Scroll Depth</label>
                  <select
                    id="scroll-depth"
                    value={scrollDepth}
                    onChange={(e) => setScrollDepth(e.target.value)}
                    disabled={isScraping}
                  >
                    <option value="5">Fast Scan (approx. 10-20 leads)</option>
                    <option value="15">Medium Scan (approx. 30-50 leads)</option>
                    <option value="35">Deep Scan (approx. 70-100 leads)</option>
                  </select>
                </div>
                {/* Spacer empty form-group to ensure Scroll Depth matches the 50% width of row elements */}
                <div className="form-group" style={{ visibility: 'hidden', pointerEvents: 'none' }} />
              </div>

              <div style={{ marginTop: '24px' }}>
                <button
                  className="btn"
                  onClick={handleStartScrape}
                  disabled={isScraping}
                >
                  {isScraping ? (
                    <>
                      {Icons.sync("animate-spin")} Scraper Running...
                    </>
                  ) : (
                    <>
                      {Icons.scraper()} Start Scraper
                    </>
                  )}
                </button>
              </div>

              {/* Scraper Live Analytics */}
              {(isScraping || scraperStats.total > 0) && (
                <div style={{ marginTop: '32px', padding: '20px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isScraping ? Icons.sync("animate-spin") : Icons.check("text-success")}
                    <span>{isScraping ? 'Active Scraper Progress' : 'Scraper Summary'}</span>
                    {isScraping && <span className="pulse-indicator"></span>}
                  </h3>
                  
                  {/* Progress bar */}
                  {scraperStats.total > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        <span>Inspecting Google Maps business details...</span>
                        <span>{scraperStats.scanned} / {scraperStats.total} checked ({Math.round((scraperStats.scanned / scraperStats.total) * 100)}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            height: '100%', 
                            background: 'linear-gradient(90deg, var(--accent-primary), var(--success))', 
                            width: `${(scraperStats.scanned / scraperStats.total) * 100}%`,
                            transition: 'width 0.4s ease' 
                          }} 
                        />
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Leads Saved</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--success)' }}>{scraperStats.saved}</div>
                    </div>
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Has Website</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{scraperStats.skippedWebsite}</div>
                    </div>
                    <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Landline Skipped</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--error)' }}>{scraperStats.skippedLandline}</div>
                    </div>
                    <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Duplicate Leads</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#818cf8' }}>{scraperStats.skippedDuplicate}</div>
                    </div>
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>No Phone</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-muted)' }}>{scraperStats.noPhone}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Console logs */}
              {logs.length > 0 && (
                <div>
                  <h3 style={{ marginTop: '24px', fontSize: '16px' }}>Activity Logs</h3>
                  <div className="console-box">
                    {logs.map((log, index) => (
                      <div key={index}>{log}</div>
                    ))}
                    <div ref={consoleEndRef} />
                  </div>
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
              <p className="page-subtitle">Manage, filter, and track leads outcome details</p>
            </header>

            {/* Filter controls */}
            <div className="glass-card" style={{ padding: '16px' }}>
              <div className="filter-bar">
                <div className="filter-group">
                  <input
                    type="text"
                    placeholder="Search by name or number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ padding: '8px 12px', fontSize: '14px', width: '220px' }}
                  />
                </div>

                <div className="filter-group">
                  <label style={{ fontSize: '12px' }}>Category:</label>
                  <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                    {uniqueCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label style={{ fontSize: '12px' }}>Status:</label>
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="all">All</option>
                    <option value="Pending">Pending</option>
                    <option value="Sent">Sent</option>
                    <option value="Replied">Replied</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>

                {selectedLeads.length > 0 && (
                  <button 
                    className="btn-selected-outreach" 
                    onClick={() => handleLaunchCampaign('selected')}
                  >
                    {Icons.campaigns()} Message Selected ({selectedLeads.length})
                  </button>
                )}
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
                      <th>Shop Name</th>
                      <th>Phone Number</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                          No leads matched the current filters. Start scraping to acquire contacts!
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
                            <div style={{ fontWeight: '600' }}>{lead.name}</div>
                            <a
                              href={lead.url}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontSize: '12px', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}
                            >
                              {Icons.link()} View on Google Maps
                            </a>
                          </td>
                          <td>{lead.phone}</td>
                          <td>
                            <span style={{ fontSize: '12px', textTransform: 'capitalize' }}>
                              {lead.category}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${lead.status.toLowerCase().replace(' ', '-')}`}>
                              {lead.status}
                            </span>
                            {lead.lastSentDate && (
                              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                                Sent: {new Date(lead.lastSentDate).toLocaleDateString()}
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button
                                className="btn-success-outline"
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to mark "${lead.name}" as WON?`)) {
                                    handleUpdateLeadStatus(lead.id, 'Won');
                                  }
                                }}
                              >
                                {Icons.check()} Won
                              </button>
                              <button
                                className="btn-danger-outline"
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to mark "${lead.name}" as LOST?`)) {
                                    handleUpdateLeadStatus(lead.id, 'Lost');
                                  }
                                }}
                              >
                                {Icons.x()} Lost
                              </button>
                            </div>
                            <div style={{ marginTop: '8px' }}>
                              <input
                                type="text"
                                placeholder="Add notes..."
                                defaultValue={lead.notes || ''}
                                onBlur={(e) => handleSaveNotes(lead.id, e.target.value)}
                                style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px' }}
                              />
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

        {/* TAB 4: CAMPAIGNS */}
        {activeTab === 'campaigns' && (
          <div>
            <header className="page-header">
              <h1 className="page-title">WhatsApp Campaigns & Outreach</h1>
              <p className="page-subtitle">Configure message templates and manage outreach actions</p>
            </header>

            <div>
              {/* WhatsApp connection */}
              <div className="glass-card" style={{ width: '100%' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {Icons.phone()} WhatsApp Connection
                </h2>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <span 
                    className="badge" 
                    style={{ 
                      background: whatsappStatus === 'ready' ? 'var(--success)' : whatsappStatus === 'qr' ? 'var(--warning)' : 'var(--error)',
                      color: '#fff',
                      padding: '8px 16px',
                      fontSize: '14px'
                    }}
                  >
                    Status: {whatsappStatus.toUpperCase()}
                  </span>
                  
                  {whatsappStatus === 'disconnected' && (
                    <button className="btn" onClick={handleConnectWhatsApp}>
                      {Icons.phone()} Connect Phone
                    </button>
                  )}
                  
                  {whatsappStatus !== 'disconnected' && (
                    <button className="btn btn-danger" onClick={handleLogoutWhatsApp}>
                      {Icons.disconnect()} Disconnect
                    </button>
                  )}
                </div>

                {/* QR Display */}
                {whatsappStatus === 'qr' && whatsappQR && (
                  <div className="qr-container">
                    <p style={{ fontSize: '13px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      Scan this QR code with WhatsApp on your phone (Linked Devices):
                    </p>
                    <img className="qr-code-img" src={whatsappQR} alt="WhatsApp QR Code" />
                  </div>
                )}

                {whatsappStatus === 'connecting' && (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {Icons.sync("animate-spin")} Starting browser instance. Please wait...
                  </div>
                )}

                {whatsappStatus === 'ready' && (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--success)', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {Icons.check()} Phone Connected! Automatic campaign loop is active.
                  </div>
                )}

                {/* Live Campaign Queue Monitor */}
                <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                  <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {Icons.terminal()}
                    <span>Live Campaign Queue Monitor</span>
                    {whatsappStatus === 'ready' && outreachOperation.includes('Sending') && <span className="pulse-indicator"></span>}
                  </h3>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', color: outreachOperation.includes('❌') ? 'var(--error)' : outreachOperation.includes('✅') ? 'var(--success)' : 'var(--text-primary)', wordBreak: 'break-word', minHeight: '40px', display: 'flex', alignItems: 'center' }}>
                    {outreachOperation}
                  </div>
                </div>
              </div>

              {/* Message Templates Configuration */}
              <div className="glass-card" style={{ width: '100%', marginTop: '24px' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {Icons.edit()} Campaign Configuration
                </h2>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="template-category-input">Category</label>
                    <input 
                      type="text" 
                      id="template-category-input" 
                      value={templateCategory} 
                      onChange={(e) => setTemplateCategory(e.target.value)} 
                      placeholder="e.g. restaurants, salons, clinics, gyms"
                      style={{ textTransform: 'lowercase' }}
                    />
                  </div>
                  <div className="form-group" style={{ visibility: 'hidden', pointerEvents: 'none' }} />
                </div>

                <div className="form-row" style={{ marginTop: '16px' }}>
                  <div className="form-group">
                    <label htmlFor="demo-link-1">Demo Site Preview Link 1</label>
                    <input 
                      type="text" 
                      id="demo-link-1" 
                      value={demoLink1} 
                      onChange={(e) => setDemoLink1(e.target.value)} 
                      placeholder="https://..."
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="demo-link-2">Demo Site Preview Link 2</label>
                    <input 
                      type="text" 
                      id="demo-link-2" 
                      value={demoLink2} 
                      onChange={(e) => setDemoLink2(e.target.value)} 
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label htmlFor="intro-template">Intro Template (First Message)</label>
                  <textarea
                    id="intro-template"
                    rows="5"
                    value={templateText}
                    onChange={(e) => setTemplateText(e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Available tags: {'{{business_name}}'}, {'{{category}}'}, {'{{location}}'}, {'{{demo_link1}}'}, {'{{demo_link2}}'}
                  </span>
                </div>

                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label htmlFor="followup-template">Follow-up Template (Resends)</label>
                  <textarea
                    id="followup-template"
                    rows="4"
                    value={followupText}
                    onChange={(e) => setFollowupText(e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ marginTop: '24px' }}>
                  <button
                    className="btn"
                    onClick={handleSaveTemplates}
                    style={{ background: 'var(--accent-primary)', color: '#fff' }}
                  >
                    {Icons.save()} Save Category Template
                  </button>
                </div>
              </div>
            </div>

            {/* SAVED TEMPLATES ROW */}
            <div className="glass-card" style={{ marginTop: '24px' }}>
              <h2 style={{ fontSize: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {Icons.contacts()} Configured Campaign Categories
              </h2>
              {(!allTemplates.categories || Object.keys(allTemplates.categories).length === 0) ? (
                <div style={{ padding: '16px', color: 'var(--text-muted)', textAlign: 'center' }}>
                  No categories configured. Create your first campaign template using the form above!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
                  {Object.keys(allTemplates.categories).map((cat) => (
                    <div key={cat} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                        <span style={{ fontWeight: '700', fontSize: '18px', textTransform: 'capitalize', color: 'var(--accent-primary)' }}>
                          {cat}
                        </span>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '6px 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          onClick={() => handleEditTemplate(cat)}
                        >
                          {Icons.edit()} Edit Template
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                        {/* Left Column: Demo links */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            <strong>Demo Link 1:</strong>
                            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '8px 12px', borderRadius: '6px', marginTop: '4px', fontFamily: 'monospace', color: allTemplates.categories[cat].demoLink1 ? 'var(--text-primary)' : 'var(--text-muted)', wordBreak: 'break-all' }}>
                              {allTemplates.categories[cat].demoLink1 || 'No link provided'}
                            </div>
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            <strong>Demo Link 2:</strong>
                            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '8px 12px', borderRadius: '6px', marginTop: '4px', fontFamily: 'monospace', color: allTemplates.categories[cat].demoLink2 ? 'var(--text-primary)' : 'var(--text-muted)', wordBreak: 'break-all' }}>
                              {allTemplates.categories[cat].demoLink2 || 'No link provided'}
                            </div>
                          </div>
                        </div>

                        {/* Right Column: Previews */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            <strong>Intro Message:</strong>
                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', marginTop: '4px', whiteSpace: 'pre-line', maxHeight: '100px', overflowY: 'auto', fontStyle: 'italic', fontSize: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                              {allTemplates.categories[cat].introTemplate || '(None)'}
                            </div>
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            <strong>Follow-up Message:</strong>
                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', marginTop: '4px', whiteSpace: 'pre-line', maxHeight: '100px', overflowY: 'auto', fontStyle: 'italic', fontSize: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                              {allTemplates.categories[cat].followupTemplate || '(None)'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
