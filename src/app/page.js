'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';

const API_BASE = 'http://localhost:3001';

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
  const [isScraping, setIsScraping] = useState(false);
  const [logs, setLogs] = useState([]);
  const consoleEndRef = useRef(null);

  // Contacts Tab State (Filters)
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterOutreach, setFilterOutreach] = useState('all');
  const [filterReply, setFilterReply] = useState('all');
  const [filterOutcome, setFilterOutcome] = useState('all');
  const [selectedLeads, setSelectedLeads] = useState([]);

  // Campaign Tab State
  const [whatsappStatus, setWhatsappStatus] = useState('disconnected');
  const [whatsappQR, setWhatsappQR] = useState(null);
  const [demoLink, setDemoLink] = useState('https://render.previews.site/demo-restaurant');
  const [templateText, setTemplateText] = useState(
    `Hey {{business_name}}!\n\nI saw your listing on Google Maps in {{location}} and noticed you don't have a website.\n\nWe build custom online-ordering and catalog websites for {{category}} shops that let you take direct orders on WhatsApp without paying Zomato/Swiggy commissions.\n\nCheck out our live preview demo here: {{demo_link}}\n\nReply back if you want to see a mockup built for your shop!`
  );
  const [followupText, setFollowupText] = useState(
    `Hey {{business_name}}!\n\nJust following up on my previous message. We can build your direct-ordering website with a custom digital menu in just 2 days.\n\nHere is the demo link again: {{demo_link}}\n\nWould you be open to a quick call today or tomorrow?`
  );
  const [campaignProgress, setCampaignProgress] = useState(null);

  // ----------------------------------------------------------------------------
  // Socket.io Connection & Data Fetching
  // ----------------------------------------------------------------------------
  useEffect(() => {
    // 1. Fetch initial leads
    fetchLeads();
    fetchStats();

    // 2. Setup socket
    const socket = io(API_BASE);

    socket.on('status_log', (message) => {
      setLogs((prev) => [...prev, message]);
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

  const updateLocalStats = () => {
    if (leads.length === 0) return;
    const totalLeads = leads.length;
    const sentLeads = leads.filter((l) => l.outreachStatus === 'Sent' || l.outreachStatus === 'Follow-up Sent').length;
    const repliedLeads = leads.filter((l) => l.replyStatus === 'Replied').length;
    const wonLeads = leads.filter((l) => l.leadOutcome === 'Won').length;
    const lostLeads = leads.filter((l) => l.leadOutcome === 'Lost').length;

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
    if (!scrapeCategory || !scrapeLocation) return;
    setIsScraping(true);
    setLogs([]);
    setLogs((prev) => [...prev, `[System] Search query requested: "${scrapeCategory} in ${scrapeLocation}"`]);

    try {
      const res = await fetch(`${API_BASE}/api/scrape/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: scrapeCategory, location: scrapeLocation })
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

  const handleUpdateLeadOutcome = async (id, outcome) => {
    try {
      await fetch(`${API_BASE}/api/leads/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates: { leadOutcome: outcome } })
      });
    } catch (err) {
      console.error('Error updating lead outcome:', err);
    }
  };

  const handleToggleReplyStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Replied' ? 'No Reply' : 'Replied';
    try {
      await fetch(`${API_BASE}/api/leads/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates: { replyStatus: newStatus } })
      });
    } catch (err) {
      console.error('Error updating reply status:', err);
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
      // Send to all 'Not Sent' leads in filtered category/list
      targetIds = filteredLeads.filter((l) => l.outreachStatus === 'Not Sent').map((l) => l.id);
      template = templateText;
      isFollowup = false;
    } else if (type === 'followup') {
      // Send followups to all leads who are 'Sent' but have 'No Reply'
      targetIds = filteredLeads.filter((l) => l.outreachStatus === 'Sent' && l.replyStatus === 'No Reply').map((l) => l.id);
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

  const handleSingleResend = async (lead) => {
    // Manually trigger single follow-up message to one contact
    try {
      const res = await fetch(`${API_BASE}/api/campaign/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          leadIds: [lead.id], 
          template: followupText, 
          demoLink, 
          isFollowup: true 
        })
      });
      if (!res.ok) {
        const err = await res.json();
        alert(`Failed to resend: ${err.error}`);
      }
    } catch (err) {
      console.error('Error launching single resend:', err);
    }
  };

  // ----------------------------------------------------------------------------
  // Filter & Search Logics
  // ----------------------------------------------------------------------------
  const uniqueCategories = useMemo(() => {
    const cats = new Set(leads.map((l) => l.category));
    return ['all', ...Array.from(cats)];
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // 1. Search Query (matches name, phone, location)
      const matchesSearch =
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.includes(searchQuery) ||
        lead.location.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Category Filter
      const matchesCategory = filterCategory === 'all' || lead.category === filterCategory;

      // 3. Outreach Status Filter
      const matchesOutreach = filterOutreach === 'all' || lead.outreachStatus === filterOutreach;

      // 4. Reply Status Filter
      const matchesReply = filterReply === 'all' || lead.replyStatus === filterReply;

      // 5. Outcome Filter
      const matchesOutcome = filterOutcome === 'all' || lead.leadOutcome === filterOutcome;

      return matchesSearch && matchesCategory && matchesOutreach && matchesReply && matchesOutcome;
    });
  }, [leads, searchQuery, filterCategory, filterOutreach, filterReply, filterOutcome]);

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
            <span className="nav-icon">📊</span> Dashboard
          </li>
          <li
            className={`nav-item ${activeTab === 'scraper' ? 'active' : ''}`}
            onClick={() => setActiveTab('scraper')}
          >
            <span className="nav-icon">🔍</span> Lead Scraper
          </li>
          <li
            className={`nav-item ${activeTab === 'contacts' ? 'active' : ''}`}
            onClick={() => setActiveTab('contacts')}
          >
            <span className="nav-icon">🗂️</span> Contacts CRM
          </li>
          <li
            className={`nav-item ${activeTab === 'campaigns' ? 'active' : ''}`}
            onClick={() => setActiveTab('campaigns')}
          >
            <span className="nav-icon">🚀</span> Campaigns
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
                <span className="stat-label">Leads Won 🎉</span>
                <span className="stat-value">{stats.wonLeads}</span>
              </div>
              <div className="stat-card error">
                <span className="stat-label">Leads Lost 🚫</span>
                <span className="stat-value">{stats.lostLeads}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Conversion Rate</span>
                <span className="stat-value">{stats.conversionRate}%</span>
              </div>
            </div>

            {/* Quick Actions / Tips */}
            <div className="glass-card">
              <h2 style={{ marginBottom: '16px', fontSize: '20px' }}>⚡ Quick Instructions</h2>
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
                  >
                    <option value="restaurants">Restaurants</option>
                    <option value="salons">Salons / Parlors</option>
                    <option value="clinics">Clinics / Doctors</option>
                    <option value="clothing shops">Clothing & Apparel Shops</option>
                    <option value="electronics shops">Electronics Shops</option>
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

              <div style={{ marginTop: '16px' }}>
                <button
                  className="btn"
                  onClick={handleStartScrape}
                  disabled={isScraping}
                >
                  {isScraping ? '🤖 Scraper Running...' : '🚀 Start Scraper'}
                </button>
              </div>

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
                  <label style={{ fontSize: '12px' }}>Outreach:</label>
                  <select value={filterOutreach} onChange={(e) => setFilterOutreach(e.target.value)}>
                    <option value="all">All</option>
                    <option value="Not Sent">Not Sent</option>
                    <option value="Sent">Sent</option>
                    <option value="Follow-up Sent">Follow-up Sent</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label style={{ fontSize: '12px' }}>Reply:</label>
                  <select value={filterReply} onChange={(e) => setFilterReply(e.target.value)}>
                    <option value="all">All</option>
                    <option value="No Reply">No Reply</option>
                    <option value="Replied">Replied</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label style={{ fontSize: '12px' }}>Outcome:</label>
                  <select value={filterOutcome} onChange={(e) => setFilterOutcome(e.target.value)}>
                    <option value="all">All</option>
                    <option value="Undecided">Undecided</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>

                {selectedLeads.length > 0 && (
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => handleLaunchCampaign('selected')}
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                  >
                    💬 Message Selected ({selectedLeads.length})
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
                      <th>Outreach Status</th>
                      <th>Reply Status</th>
                      <th>Lead Outcome</th>
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
                              style={{ fontSize: '12px', color: '#64748b' }}
                            >
                              📍 View on Google Maps
                            </a>
                          </td>
                          <td>{lead.phone}</td>
                          <td>
                            <span style={{ fontSize: '12px', textTransform: 'capitalize' }}>
                              {lead.category}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${lead.outreachStatus === 'Not Sent' ? 'not-sent' : lead.outreachStatus === 'Sent' ? 'sent' : 'follow-up'}`}>
                              {lead.outreachStatus}
                            </span>
                            {lead.lastSentDate && (
                              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                                Sent: {new Date(lead.lastSentDate).toLocaleDateString()}
                              </div>
                            )}
                          </td>
                          <td>
                            <span
                              className={`badge ${lead.replyStatus === 'No Reply' ? 'no-reply' : 'replied'}`}
                              onClick={() => handleToggleReplyStatus(lead.id, lead.replyStatus)}
                              style={{ cursor: 'pointer' }}
                              title="Click to toggle reply status"
                            >
                              {lead.replyStatus}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${lead.leadOutcome.toLowerCase()}`}>
                              {lead.leadOutcome}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                onClick={() => handleUpdateLeadOutcome(lead.id, 'Won')}
                              >
                                Won
                              </button>
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                onClick={() => handleUpdateLeadOutcome(lead.id, 'Lost')}
                              >
                                Lost
                              </button>
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                onClick={() => handleSingleResend(lead)}
                                title="Resend outreach / follow-up message"
                              >
                                🔄 Resend
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

            {/* Campaign progress indicator */}
            {campaignProgress && (
              <div className="glass-card" style={{ background: 'var(--success-glow)', borderColor: 'var(--success)' }}>
                <h3 style={{ color: 'var(--success)', marginBottom: '8px' }}>🚀 Campaign Running</h3>
                <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                  Progress: {campaignProgress.current} / {campaignProgress.total} messages processed.
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      background: 'var(--success)', 
                      width: `${(campaignProgress.current / campaignProgress.total) * 100}%`,
                      transition: 'width 0.3s ease' 
                    }} 
                  />
                </div>
              </div>
            )}

            <div className="form-row">
              {/* WhatsApp setup */}
              <div className="glass-card" style={{ flex: '1', minWidth: '320px' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>💬 WhatsApp Connection</h2>
                
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
                      Connect Phone
                    </button>
                  )}
                  
                  {whatsappStatus !== 'disconnected' && (
                    <button className="btn btn-danger" onClick={handleLogoutWhatsApp}>
                      Disconnect
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
                  <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                    🔄 Starting browser instance. Please wait a moment...
                  </div>
                )}

                {whatsappStatus === 'ready' && (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--success)', fontWeight: '600' }}>
                    ✅ Phone Connected! Ready to send automated campaigns.
                  </div>
                )}
              </div>

              {/* Message Templates & Campaign runner */}
              <div className="glass-card" style={{ flex: '2', minWidth: '400px' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>📝 Campaign Configuration</h2>

                <div className="form-group">
                  <label htmlFor="demo-link">Demo Site Preview Link</label>
                  <input 
                    type="text" 
                    id="demo-link" 
                    value={demoLink} 
                    onChange={(e) => setDemoLink(e.target.value)} 
                    placeholder="https://..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="intro-template">Intro Template (First Message)</label>
                  <textarea
                    id="intro-template"
                    rows="5"
                    value={templateText}
                    onChange={(e) => setTemplateText(e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Available tags: {'{{business_name}}'}, {'{{category}}'}, {'{{location}}'}, {'{{demo_link}}'}
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

                <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    className="btn"
                    onClick={() => handleLaunchCampaign('intro')}
                    disabled={whatsappStatus !== 'ready' || campaignProgress !== null}
                  >
                    💬 Launch Intro Campaign
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleLaunchCampaign('followup')}
                    disabled={whatsappStatus !== 'ready' || campaignProgress !== null}
                    style={{ border: '1px solid var(--warning)', color: '#fbbf24' }}
                  >
                    🔄 Launch Follow-up Campaign
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
