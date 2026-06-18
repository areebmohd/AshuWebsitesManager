'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';

const API_BASE = 'http://localhost:3001';

const Icons = {
  dashboard: (className = "") => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>
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
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
      <line x1="22" x2="2" y1="2" y2="22" />
    </svg>
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

const DEFAULT_INTRO = `Hey {{business_name}}! 👋

I noticed you have a great {{category}} listing on Google Maps in {{location}}, but you don't have a website to showcase your products and get direct online orders.

Since everyone is shopping online now, having your own website is essential to get direct orders without paying heavy commissions. We can help you to build custom website starting at just ₹999! 🚀

Here are some of our demo previews:
🌐 {{demo_link1}}
🌐 {{demo_link2}}

Call or message anytime if you want to see a website like this built specifically for your business!`;

const DEFAULT_FOLLOWUP = `Hey {{business_name}}! 👋

Just following up on my previous message.

Since everyone is moving online, we can launch your premium custom website—complete with an easy dashboard to track all your orders—in just 2 days for only ₹999! 🚀

Here are the previews again for you to check out:
🌐 {{demo_link1}}
🌐 {{demo_link2}}

Call or message anytime if you want to see a website like this built specifically for your business!`;

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
  const consoleEndRef = useRef(null);

  const adjustHeight = (el) => {
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  // Contacts Tab State (Filters)
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedLeads, setSelectedLeads] = useState([]);

  // Manual Outreach Queue Filters
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [manualCategory, setManualCategory] = useState('all');
  const [manualOutreachType, setManualOutreachType] = useState('all');

  // Campaign Tab State
  const [demoLink1, setDemoLink1] = useState('');
  const [demoLink2, setDemoLink2] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  const [templateText, setTemplateText] = useState(DEFAULT_INTRO);
  const [followupText, setFollowupText] = useState(DEFAULT_FOLLOWUP);
  const [allTemplates, setAllTemplates] = useState({ categories: {} });

  // Guided Campaign Wizard State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardLeads, setWizardLeads] = useState([]);
  const [wizardIndex, setWizardIndex] = useState(0);
  const [wizardCategory, setWizardCategory] = useState('all');
  const [wizardMessageType, setWizardMessageType] = useState('intro');
  const [wizardCustomText, setWizardCustomText] = useState('');

  // WhatsApp Integration & Outreach State
  const [whatsappStatus, setWhatsappStatus] = useState('disconnected');
  const [whatsappQR, setWhatsappQR] = useState('');
  const [outreachOperation, setOutreachOperation] = useState('Idle (Stop automatic messages button not clicked)');
  const [isMessageOpened, setIsMessageOpened] = useState(false);
  const [isAutoRunning, setIsAutoRunning] = useState(false);

  useEffect(() => {
    if (whatsappStatus !== 'ready') {
      setIsAutoRunning(false);
    }
  }, [whatsappStatus]);



  // ----------------------------------------------------------------------------
  // Socket.io Connection & Data Fetching
  // ----------------------------------------------------------------------------
  useEffect(() => {
    // 1. Fetch initial leads
    fetchLeads();
    fetchStats();
    fetchTemplates();

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
    });

    socket.on('whatsapp_qr', (qrCode) => {
      setWhatsappQR(qrCode);
    });

    socket.on('outreach_operation', (operation) => {
      setOutreachOperation(operation);
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

  // Sync wizard message copy when index advances
  useEffect(() => {
    if (isWizardOpen && wizardLeads[wizardIndex]) {
      const lead = wizardLeads[wizardIndex];
      const message = getCompiledMessage(lead);
      setWizardCustomText(message || '');
      setIsMessageOpened(false);
    }
  }, [wizardIndex, wizardLeads, isWizardOpen]);



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



  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/templates`);
      const data = await res.json();
      setAllTemplates(data);
      
      // Keep configuration form input fields clean and empty on initial mount.
      // Saved templates can be dynamically loaded into the form via the 'Edit Template' buttons below.
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
        setTemplateCategory('');
        setDemoLink1('');
        setDemoLink2('');
        setTemplateText(DEFAULT_INTRO);
        setFollowupText(DEFAULT_FOLLOWUP);
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
      setWhatsappStatus('connecting');
      const res = await fetch(`${API_BASE}/api/whatsapp/connect`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to connect WhatsApp');
      }
    } catch (err) {
      console.error('Error connecting WhatsApp:', err);
      alert('Error connecting WhatsApp: ' + err.message);
    }
  };

  const handleDisconnectWhatsApp = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/whatsapp/logout`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to disconnect WhatsApp');
      }
    } catch (err) {
      console.error('Error disconnecting WhatsApp:', err);
    }
  };

  const handleStartAutoOutreach = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/outreach/start`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to start automated campaign');
      } else {
        alert(data.message);
        setIsAutoRunning(true);
      }
    } catch (err) {
      console.error('Error starting automated outreach:', err);
    }
  };

  const handleStopAutoOutreach = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/outreach/stop`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to stop automated campaign');
      } else {
        alert(data.message);
        setIsAutoRunning(false);
      }
    } catch (err) {
      console.error('Error stopping automated outreach:', err);
    }
  };




  const handleUpdateLeadStatus = async (id, status, notes = undefined) => {
    const updates = { status };
    if (notes !== undefined) {
      updates.notes = notes.trim();
    }
    try {
      await fetch(`${API_BASE}/api/leads/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates })
      });
    } catch (err) {
      console.error('Error updating lead status:', err);
    }
  };

  const formatPhoneForWa = (phone) => {
    let cleanNumber = phone.replace(/[^0-9]/g, '');
    if (cleanNumber.length === 10) {
      cleanNumber = '91' + cleanNumber;
    }
    if (cleanNumber.startsWith('0') && cleanNumber.length === 11) {
      cleanNumber = '91' + cleanNumber.substring(1);
    }
    return cleanNumber;
  };

  const getCompiledMessage = (lead) => {
    const catTemplates = allTemplates.categories ? allTemplates.categories[lead.category] : null;
    if (!catTemplates) return null;
    const templateText = lead.status === 'Pending' ? catTemplates.introTemplate : catTemplates.followupTemplate;
    if (!templateText) return null;

    const dLink1 = catTemplates.demoLink1 || '';
    const dLink2 = catTemplates.demoLink2 || '';

    return templateText
      .replace(/{{business_name}}/gi, lead.name)
      .replace(/{{category}}/gi, lead.category)
      .replace(/{{location}}/gi, lead.location)
      .replace(/{{demo_link1}}/gi, dLink1)
      .replace(/{{demo_link2}}/gi, dLink2);
  };

  const handleManualSend = async (lead) => {
    const message = getCompiledMessage(lead);
    if (!message) {
      alert(`No outreach template found for category "${lead.category}"! Please save a template for category "${lead.category}" in the Templates tab first.`);
      return;
    }
    const cleanPhone = formatPhoneForWa(lead.phone);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    
    // Open in a new tab
    window.open(waUrl, '_blank');

    // Update status to 'Sent' and log note
    const outreachType = lead.status === 'Pending' ? 'Intro' : 'Follow-up';
    await handleUpdateLeadStatus(
      lead.id, 
      'Sent', 
      `${outreachType} sent manually via wa.me link`
    );
  };

  // Start Guided campaign wizard
  const handleStartGuidedCampaign = (type = 'intro') => {
    let targetLeads = [];
    let msgType = 'intro';

    if (type === 'intro') {
      // All 'Pending' leads matching filter category
      targetLeads = filteredLeads.filter((l) => l.status === 'Pending');
      msgType = 'intro';
    } else if (type === 'followup') {
      // All 'Sent' leads matching filter category
      targetLeads = filteredLeads.filter((l) => l.status === 'Sent');
      msgType = 'followup';
    } else if (type === 'selected') {
      // Selected checkbox leads
      targetLeads = leads.filter((l) => selectedLeads.includes(l.id) && (l.status === 'Pending' || l.status === 'Sent'));
      msgType = 'intro'; // default to intro
    } else if (type === 'manual') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      targetLeads = leads.filter((l) => {
        if (l.status === 'Pending') return true;
        if (l.status === 'Sent' && l.lastSentDate && new Date(l.lastSentDate) < sevenDaysAgo) return true;
        return false;
      });
      msgType = targetLeads[0]?.status === 'Pending' ? 'intro' : 'followup';
    }

    if (targetLeads.length === 0) {
      alert('No eligible target leads found for this campaign configuration!');
      return;
    }

    // Sort oldest first (or Pending first, then Sent for manual conveyor)
    targetLeads.sort((a, b) => {
      if (type === 'manual') {
        if (a.status === 'Pending' && b.status !== 'Pending') return -1;
        if (a.status !== 'Pending' && b.status === 'Pending') return 1;
      }
      return a.id.localeCompare(b.id);
    });

    setWizardLeads(targetLeads);
    setWizardIndex(0);
    setWizardMessageType(msgType);
    setIsWizardOpen(true);
    setSelectedLeads([]); // Clear CRM selection
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

  const manualOutreachLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Must be eligible for outreach (Pending or Sent status)
      const isEligible = lead.status === 'Pending' || lead.status === 'Sent';
      if (!isEligible) return false;

      // 1. Search Query (matches name, phone, location)
      const matchesSearch =
        lead.name.toLowerCase().includes(manualSearchQuery.toLowerCase()) ||
        lead.phone.includes(manualSearchQuery) ||
        lead.location.toLowerCase().includes(manualSearchQuery.toLowerCase());

      // 2. Category Filter
      const matchesCategory = manualCategory === 'all' || lead.category === manualCategory;

      // 3. Outreach Type Filter
      let matchesType = true;
      if (manualOutreachType === 'intro') {
        matchesType = lead.status === 'Pending';
      } else if (manualOutreachType === 'followup') {
        matchesType = lead.status === 'Sent';
      }

      return matchesSearch && matchesCategory && matchesType;
    }).sort((a, b) => a.id.localeCompare(b.id)); // Sort oldest first
  }, [leads, manualSearchQuery, manualCategory, manualOutreachType]);

  const recentDispatches = useMemo(() => {
    return leads
      .filter((l) => ['Sent', 'Failed'].includes(l.status) && l.lastSentDate)
      .sort((a, b) => new Date(b.lastSentDate) - new Date(a.lastSentDate))
      .slice(0, 15);
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
        <div className="brand" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
          <div className="brand-logo" style={{ lineHeight: '1.1', display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>Ashu Websites</span>
          </div>
          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-display)', marginTop: '4px' }}>Manager</span>
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
            {Icons.phone()} WhatsApp
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
                <li>Go to the <strong>Lead Scraper</strong> tab to extract fresh phone numbers for local business categories.</li>
                <li>Go to the <strong>Templates</strong> tab to customize and save your category outreach copy with direct demo links.</li>
                <li>Go to the <strong>WhatsApp</strong> tab and click <strong>Connect Phone</strong> to start the automated queue.</li>
                <li>Check the <strong>Contacts CRM</strong> table to track client replies, log notes, and flag successful wins!</li>
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
                    {isScraping ? Icons.scraper() : Icons.check("text-success")}
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
                <div className="filter-group" style={{ flex: '1', maxWidth: '480px' }}>
                  <input
                    type="text"
                    placeholder="Search by name or number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ padding: '8px 12px', fontSize: '14px', width: '100%' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginLeft: 'auto', flexWrap: 'wrap' }}>
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
                      onClick={() => handleStartGuidedCampaign('selected')}
                    >
                      {Icons.campaigns()} Message Selected ({selectedLeads.length})
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
                            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                              <a
                                href={lead.url}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: '12px', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}
                              >
                                {Icons.link()} View on Google Maps
                              </a>
                              {lead.notes && lead.notes.trim() && (
                                <>
                                  <span style={{ fontSize: '12px', color: '#475569', margin: '4px 4px 0 4px' }}>•</span>
                                  <button
                                    onClick={() => alert(`Notes for ${lead.name}:\n\n${lead.notes}`)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      padding: 0,
                                      fontSize: '12px',
                                      color: '#64748b',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      marginTop: '4px'
                                    }}
                                  >
                                    {Icons.info()} View Notes
                                  </button>
                                </>
                              )}
                            </div>
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
                                {new Date(lead.lastSentDate).toLocaleDateString()}
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button
                                className="btn-success-outline"
                                onClick={() => {
                                  const notesPrompt = window.prompt(`Are you sure you want to mark "${lead.name}" as WON?\n\nEnter notes for this lead (optional):`, lead.notes || '');
                                  if (notesPrompt !== null) {
                                    handleUpdateLeadStatus(lead.id, 'Won', notesPrompt);
                                  }
                                }}
                              >
                                {Icons.check()} Won
                              </button>
                              <button
                                className="btn-danger-outline"
                                onClick={() => {
                                  const notesPrompt = window.prompt(`Are you sure you want to mark "${lead.name}" as LOST?\n\nEnter notes for this lead (optional):`, lead.notes || '');
                                  if (notesPrompt !== null) {
                                    handleUpdateLeadStatus(lead.id, 'Lost', notesPrompt);
                                  }
                                }}
                              >
                                {Icons.x()} Lost
                              </button>
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

        {/* TAB 4: WHATSAPP */}
        {activeTab === 'whatsapp' && (
          <div>
            <header className="page-header">
              <h1 className="page-title">WhatsApp Outreach Hub</h1>
              <p className="page-subtitle">Manage the automated outreach loop or send messages manually via official deep links</p>
            </header>

            {/* Outreach Analytics Cards */}
            <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
              <div className="stat-card">
                <span className="stat-label">Total Leads</span>
                <span className="stat-value">{leads.length}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Pending Outreach</span>
                <span className="stat-value" style={{ color: 'var(--text-secondary)' }}>
                  {leads.filter(l => l.status === 'Pending').length}
                </span>
              </div>
              <div className="stat-card success">
                <span className="stat-label">Sent Messages</span>
                <span className="stat-value text-success">
                  {leads.filter(l => ['Sent', 'Replied', 'Won', 'Lost'].includes(l.status)).length}
                </span>
              </div>
              <div className="stat-card error">
                <span className="stat-label">Failed Delivery</span>
                <span className="stat-value text-error">
                  {leads.filter(l => l.status === 'Failed').length}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* SECTION 1: AUTOMATED OUTREACH ENGINE */}
              <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                  <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {Icons.phone()} Automated Outreach (via whatsapp-web.js)
                  </h2>
                </div>

                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  {/* Connection Control Block */}
                  <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6' }}>
                      Connect your device by scanning the QR code, then start the automatic cold outreach campaign loops. 
                    </p>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span 
                        className="badge" 
                        style={{ 
                          textTransform: 'uppercase', 
                          padding: '10px 16px', 
                          borderRadius: '8px', 
                          fontSize: '13px', 
                          height: '40px', 
                          display: 'inline-flex', 
                          alignItems: 'center',
                          background: whatsappStatus === 'ready' 
                            ? 'var(--success-glow)' 
                            : whatsappStatus === 'connecting' || whatsappStatus === 'qr' 
                              ? 'var(--warning-glow)' 
                              : 'var(--error-glow)',
                          color: whatsappStatus === 'ready' 
                            ? '#10b981' 
                            : whatsappStatus === 'connecting' || whatsappStatus === 'qr' 
                              ? '#fbbf24' 
                              : '#f87171',
                          border: whatsappStatus === 'ready' 
                            ? '1px solid rgba(16, 185, 129, 0.3)' 
                            : whatsappStatus === 'connecting' || whatsappStatus === 'qr' 
                              ? '1px solid rgba(245, 158, 11, 0.3)' 
                              : '1px solid rgba(239, 68, 68, 0.3)'
                        }}
                      >
                        Status: {whatsappStatus}
                      </span>
                      {whatsappStatus === 'disconnected' ? (
                        <button className="btn" onClick={handleConnectWhatsApp} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {Icons.phone()} Connect Device
                        </button>
                      ) : (
                        <>
                          <button className="btn btn-secondary" onClick={handleDisconnectWhatsApp} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {Icons.disconnect()} Disconnect Device
                          </button>

                          {whatsappStatus === 'ready' && (
                            <>
                              {!isAutoRunning ? (
                                <button 
                                  className="btn" 
                                  onClick={handleStartAutoOutreach} 
                                  style={{ background: 'var(--success)', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                  {Icons.campaigns()} Send automatic messages
                                </button>
                              ) : (
                                <button 
                                  className="btn-danger-outline" 
                                  onClick={handleStopAutoOutreach}
                                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                  {Icons.x()} Stop automatic messages
                                </button>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* QR Code Block */}
                  {whatsappStatus === 'qr' && whatsappQR && (
                    <div style={{ flex: '0 0 200px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--glass-shadow)' }}>
                      <img src={whatsappQR} alt="WhatsApp QR Code" style={{ width: '180px', height: '180px' }} />
                      <span style={{ fontSize: '11px', color: '#1e293b', fontWeight: 'bold' }}>Scan with WhatsApp</span>
                    </div>
                  )}

                  {whatsappStatus === 'connecting' && (
                    <div style={{ flex: '0 0 200px', height: '212px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      {Icons.sync("animate-spin")}
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Initializing WhatsApp...</span>
                    </div>
                  )}
                </div>

                {/* Active Outreach Logger Feed */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                      Operation Monitor logs
                    </span>
                    <span className="pulse-indicator" style={{ display: outreachOperation.toLowerCase().includes('active') || outreachOperation.toLowerCase().includes('sending') || outreachOperation.toLowerCase().includes('waiting') ? 'inline-block' : 'none' }}></span>
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '13px', color: outreachOperation.includes('❌') ? 'var(--error)' : outreachOperation.includes('✅') ? 'var(--success)' : 'var(--text-primary)', wordBreak: 'break-all' }}>
                    {outreachOperation}
                  </div>
                </div>
              </div>

              {/* SECTION 2: MANUAL OUTREACH CAMPAIGNS */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                  <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {Icons.campaigns()} Manual Outreach (via Deep Links)
                  </h2>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6' }}>
                  Launch the Guided Campaign Wizard modal overlay to cycle through pending and sent leads sequentially in a reusable WhatsApp tab.
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
                  <button 
                    className="btn" 
                    onClick={() => handleStartGuidedCampaign('manual')}
                    style={{ padding: '12px 24px', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    {Icons.campaigns()} Send manual messages
                  </button>
                </div>
              </div>

              {/* Outreach Dispatch History */}
              <div className="glass-card">
                <h2 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {Icons.contacts()} Recent Dispatch History & Logs
                </h2>
                
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Business Name</th>
                        <th>Phone Number</th>
                        <th>Status</th>
                        <th>Date & Time</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentDispatches.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                            No outreach history logged yet. Send your first message above to see history here!
                          </td>
                        </tr>
                      ) : (
                        recentDispatches.map((lead) => (
                          <tr key={lead.id}>
                            <td style={{ fontWeight: '600' }}>
                              <a href={lead.url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                {lead.name} {Icons.link()}
                              </a>
                            </td>
                            <td>{lead.phone}</td>
                            <td>
                              <span className={`badge ${lead.status.toLowerCase().replace(' ', '-')}`}>
                                {lead.status}
                              </span>
                            </td>
                            <td>
                              {lead.lastSentDate ? new Date(lead.lastSentDate).toLocaleString() : 'N/A'}
                            </td>
                            <td style={{ fontSize: '13px', color: lead.status === 'Failed' ? 'var(--error)' : 'var(--text-secondary)' }}>
                              {lead.notes || 'No notes available'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 5: TEMPLATES */}
        {activeTab === 'templates' && (
          <div>
            <header className="page-header">
              <h1 className="page-title">Outreach Templates</h1>
              <p className="page-subtitle">Configure outreach message templates per business category</p>
            </header>

            <div>
              {/* Message Templates Configuration */}
              <div className="glass-card" style={{ width: '100%' }}>
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
                    ref={adjustHeight}
                    rows="5"
                    value={templateText}
                    onChange={(e) => setTemplateText(e.target.value)}
                    style={{ resize: 'none', overflowY: 'hidden' }}
                  />
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Available tags: {'{{business_name}}'}, {'{{category}}'}, {'{{location}}'}, {'{{demo_link1}}'}, {'{{demo_link2}}'}
                  </span>
                </div>

                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label htmlFor="followup-template">Follow-up Template (Resends)</label>
                  <textarea
                    id="followup-template"
                    ref={adjustHeight}
                    rows="4"
                    value={followupText}
                    onChange={(e) => setFollowupText(e.target.value)}
                    style={{ resize: 'none', overflowY: 'hidden' }}
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

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Demo Link 1 and 2 in one line */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
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

                        {/* Intro Message Preview */}
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          <strong>Intro Message:</strong>
                          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', marginTop: '4px', whiteSpace: 'pre-line', fontStyle: 'italic', fontSize: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                            {allTemplates.categories[cat].introTemplate || '(None)'}
                          </div>
                        </div>

                        {/* Follow-up Message Preview */}
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          <strong>Follow-up Message:</strong>
                          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', marginTop: '4px', whiteSpace: 'pre-line', fontStyle: 'italic', fontSize: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                            {allTemplates.categories[cat].followupTemplate || '(None)'}
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

      {/* GUIDED CAMPAIGN WIZARD MODAL OVERLAY */}
      {isWizardOpen && wizardLeads.length > 0 && (() => {
        const lead = wizardLeads[wizardIndex];
        const hasNext = wizardIndex < wizardLeads.length - 1;
        const currentCount = wizardIndex + 1;
        const totalCount = wizardLeads.length;

        // Auto-compile message for current lead
        const compiledMsg = getCompiledMessage(lead);

        const handleWizardSend = () => {
          const cleanPhone = formatPhoneForWa(lead.phone);
          const textCopy = wizardCustomText || compiledMsg || '';
          const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(textCopy)}`;
          window.open(waUrl, 'whatsapp_outreach_session');
          setIsMessageOpened(true);
        };

        const handleWizardSkip = () => {
          setIsMessageOpened(false);
          if (hasNext) {
            setWizardIndex((prev) => prev + 1);
          } else {
            setIsWizardOpen(false);
            alert('Campaign completed.');
          }
        };

        const handleWizardSentStatus = async (status) => {
          if (status === 'Sent') {
            await handleUpdateLeadStatus(
              lead.id,
              'Sent',
              `${wizardMessageType === 'intro' ? 'Intro' : 'Follow-up'} sent via Guided Wizard`
            );
          } else {
            await handleUpdateLeadStatus(
              lead.id,
              'Failed',
              'Number unregistered or invalid on WhatsApp'
            );
          }

          setIsMessageOpened(false);
          if (hasNext) {
            setWizardIndex((prev) => prev + 1);
          } else {
            setIsWizardOpen(false);
            alert('Campaign complete!');
          }
        };

        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(5, 8, 16, 0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}>
            <div className="glass-card" style={{
              width: '100%',
              maxWidth: '650px',
              padding: '32px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              
              {/* Wizard Header Progress */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '20px', color: 'var(--text-primary)', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {Icons.campaigns()} Guided Outreach Campaign
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    TYPE: {wizardMessageType.toUpperCase()} | CATEGORY: {lead.category.toUpperCase()}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--accent-primary)' }}>
                    {currentCount} / {totalCount}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Leads Processed</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '999px', overflow: 'hidden', marginTop: '-8px' }}>
                <div style={{
                  width: `${(currentCount / totalCount) * 100}%`,
                  height: '100%',
                  background: 'var(--accent-primary)',
                  transition: 'width 0.3s ease'
                }} />
              </div>

              {/* Active Lead Details */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>Target Business</label>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>{lead.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>📍 {lead.location}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end' }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>Phone Number</label>
                  <div style={{ fontSize: '15px', fontFamily: 'monospace', color: 'var(--text-primary)', marginTop: '2px', fontWeight: '600' }}>{lead.phone}</div>
                </div>
              </div>

              {/* Editable Message Text Box */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="wizard-msg-box" style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Message Copy (Editable):</label>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tweak message specifically for this business if desired</span>
                </div>
                {compiledMsg ? (
                  <textarea
                    id="wizard-msg-box"
                    rows="8"
                    value={wizardCustomText}
                    onChange={(e) => setWizardCustomText(e.target.value)}
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '12px',
                      fontFamily: 'inherit',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      resize: 'vertical'
                    }}
                  />
                ) : (
                  <div style={{ padding: '24px', border: '1px dashed var(--error)', color: 'var(--error)', background: 'rgba(239, 68, 68, 0.02)', borderRadius: '8px', textAlign: 'center', fontSize: '14px' }}>
                    ⚠️ No campaign template configured for this category "{lead.category}". Please configure templates first.
                  </div>
                )}
              </div>

              {/* Action Buttons Row */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setIsWizardOpen(false)}
                  style={{ padding: '12px 20px' }}
                >
                  Cancel
                </button>

                {!isMessageOpened ? (
                  <>
                    <button
                      className="btn btn-secondary"
                      onClick={handleWizardSkip}
                      style={{ padding: '12px 20px', marginLeft: 'auto' }}
                    >
                      Skip Lead
                    </button>

                    <button
                      className="btn"
                      onClick={handleWizardSend}
                      disabled={!compiledMsg}
                      style={{ padding: '12px 24px', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      {Icons.phone()} Send
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn-danger-outline"
                      onClick={() => handleWizardSentStatus('Failed')}
                      style={{ padding: '12px 20px', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      {Icons.x()} Failed
                    </button>

                    <button
                      className="btn"
                      onClick={() => handleWizardSentStatus('Sent')}
                      style={{ padding: '12px 24px', fontSize: '14px', fontWeight: '600', background: 'var(--success)', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      {Icons.check()} Sent
                    </button>
                  </>
                )}
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}
