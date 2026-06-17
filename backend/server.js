import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { getLeads, updateLead, getStats, getTemplates, saveTemplates } from './db.js';
import { runScraper } from './scraper.js';
import { initWhatsApp, getWhatsAppStatus, sendMessage, logoutWhatsApp } from './whatsapp.js';

const app = express();
const httpServer = createServer(app);

// Configure CORS for Express and Socket.io
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST']
}));
app.use(express.json());

const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

const PORT = 3001;
let activeScraper = false;
let activeCampaign = false;
let activeOutreachLoop = false;
let currentOutreachStatus = "Idle (Disconnected)";

// Socket.io Connection
io.on('connection', (socket) => {
  console.log('Client connected to socket');
  
  // Send current WhatsApp status and outreach status immediately on connect
  socket.emit('whatsapp_status', getWhatsAppStatus());
  socket.emit('outreach_operation', currentOutreachStatus);

  socket.on('disconnect', () => {
    console.log('Client disconnected from socket');
  });
});

// Endpoint to query current outreach status
app.get('/api/outreach/status', (req, res) => {
  res.json({ status: currentOutreachStatus });
});

// Helper to log message to both server console and stream to frontend
function logProgress(message) {
  console.log(message);
  io.emit('status_log', `${new Date().toLocaleTimeString()} - ${message}`);
}

// ----------------------------------------------------------------------------
// API ENDPOINTS
// ----------------------------------------------------------------------------

// 1. Get all leads
app.get('/api/leads', (req, res) => {
  try {
    const leads = getLeads();
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Update a lead's outcome, reply status, or notes
app.post('/api/leads/update', (req, res) => {
  const { id, updates } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Missing lead ID' });
  }
  try {
    const updated = updateLead(id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    // Broadcast update to all clients to keep dashboard sync'd
    io.emit('lead_updated', updated);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Get metrics stats
app.get('/api/stats', (req, res) => {
  try {
    const stats = getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3b. Get templates configuration
app.get('/api/templates', (req, res) => {
  try {
    const templates = getTemplates();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3c. Save templates configuration
app.post('/api/templates/save', (req, res) => {
  const { category, introTemplate, followupTemplate, demoLink1, demoLink2 } = req.body;
  if (!category) {
    return res.status(400).json({ error: 'Category is required' });
  }

  try {
    const templates = getTemplates();
    if (!templates.categories) {
      templates.categories = {};
    }

    const cleanCategory = category.toLowerCase().trim();
    templates.categories[cleanCategory] = {
      introTemplate: introTemplate || '',
      followupTemplate: followupTemplate || '',
      demoLink1: demoLink1 || '',
      demoLink2: demoLink2 || ''
    };

    const saved = saveTemplates(templates);
    if (saved) {
      res.json({ message: `Templates for category "${cleanCategory}" saved successfully` });
    } else {
      res.status(500).json({ error: 'Failed to save templates' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Start Google Maps Scraping
app.post('/api/scrape/start', async (req, res) => {
  const { category, location, mobileOnly, scrollDepth } = req.body;
  if (!category || !location) {
    return res.status(400).json({ error: 'Category and Location are required' });
  }

  if (activeScraper) {
    return res.status(400).json({ error: 'Another scraper is already running' });
  }

  activeScraper = true;
  res.json({ message: 'Scraping started' });

  // Run in background
  try {
    await runScraper(
      category, 
      location, 
      { mobileOnly, scrollDepth },
      (logMsg) => logProgress(logMsg),
      (newLead) => {
        io.emit('lead_scraped', newLead);
      }
    );
  } catch (error) {
    logProgress(`[Scraper Error] ${error.message}`);
  } finally {
    activeScraper = false;
    logProgress('[System] Scraping process idle.');
  }
});

// 5. Connect WhatsApp Client
app.post('/api/whatsapp/connect', (req, res) => {
  try {
    initWhatsApp(
      (status) => {
        io.emit('whatsapp_status', status);
        if (status === 'ready') {
          logProgress('[WhatsApp] Status is READY. Starting automatic campaign engine...');
          runAutomaticOutreachLoop();
        }
      },
      (qrCode) => {
        io.emit('whatsapp_qr', qrCode);
      },
      (logMsg) => {
        logProgress(logMsg);
      },
      async (fromPhone, messageBody) => {
        logProgress(`[WhatsApp] Inbound message from ${fromPhone}: "${messageBody.substring(0, 60)}"`);
        
        const leads = getLeads();
        const cleanFrom = fromPhone.slice(-10); // Check last 10 digits
        
        const matchingLead = leads.find(l => {
          const cleanLeadPhone = l.phone.slice(-10);
          return cleanLeadPhone === cleanFrom && l.status === 'Sent';
        });
        
        if (matchingLead) {
          logProgress(`[System] Lead "${matchingLead.name}" replied! Auto-updating status to 'Replied'.`);
          const updated = updateLead(matchingLead.id, {
            status: 'Replied'
          });
          io.emit('lead_updated', updated);
        }
      }
    );
    res.json({ message: 'WhatsApp client initialization started' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Get WhatsApp Status
app.get('/api/whatsapp/status', (req, res) => {
  res.json({ status: getWhatsAppStatus() });
});

// 7. Disconnect WhatsApp
app.post('/api/whatsapp/logout', async (req, res) => {
  try {
    await logoutWhatsApp(
      (status) => io.emit('whatsapp_status', status),
      (logMsg) => logProgress(logMsg)
    );
    res.json({ message: 'WhatsApp client destroyed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Start WhatsApp Message Campaign
app.post('/api/campaign/start', async (req, res) => {
  const { leadIds, template, demoLink, isFollowup } = req.body;
  if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
    return res.status(400).json({ error: 'No lead IDs provided for campaign' });
  }

  // If template is empty or falsy, we resolve templates dynamically per-lead from the database
  const useDynamicTemplates = !template;

  if (getWhatsAppStatus() !== 'ready') {
    return res.status(400).json({ error: 'WhatsApp client must be connected first' });
  }

  if (activeCampaign) {
    return res.status(400).json({ error: 'Another campaign is already in progress' });
  }

  activeCampaign = true;
  res.json({ message: `Campaign launched targeting ${leadIds.length} leads.` });
  logProgress(`[Campaign] Launched campaign targeting ${leadIds.length} leads.`);

  // Process in background
  try {
    const leads = getLeads();
    const targets = leads.filter(l => leadIds.includes(l.id));
    const templates = getTemplates();

    for (let i = 0; i < targets.length; i++) {
      const lead = targets[i];
      logProgress(`[Campaign] [${i+1}/${targets.length}] Processing message to: ${lead.name} (${lead.phone})`);

      const catTemplates = templates.categories ? templates.categories[lead.category] : null;
      let activeTemplateText = template;
      let targetStatus = lead.status;
      let nextStatus = 'Sent';

      if (useDynamicTemplates) {
        if (!catTemplates) {
          logProgress(`[Campaign] ❌ No saved templates available for category "${lead.category}"`);
          io.emit('campaign_progress', { current: i + 1, total: targets.length, success: false, leadId: lead.id, error: `No templates for category: ${lead.category}` });
          continue;
        }

        if (targetStatus === 'Pending') {
          activeTemplateText = catTemplates.introTemplate;
          if (!activeTemplateText) {
            logProgress(`[Campaign] ❌ No saved intro template available for category "${lead.category}"`);
            io.emit('campaign_progress', { current: i + 1, total: targets.length, success: false, leadId: lead.id, error: `No intro template for category: ${lead.category}` });
            continue;
          }
          nextStatus = 'Sent';
        } else if (targetStatus === 'Sent') {
          activeTemplateText = catTemplates.followupTemplate;
          if (!activeTemplateText) {
            logProgress(`[Campaign] ❌ No saved follow-up template available for category "${lead.category}"`);
            io.emit('campaign_progress', { current: i + 1, total: targets.length, success: false, leadId: lead.id, error: `No follow-up template for category: ${lead.category}` });
            continue;
          }
          nextStatus = 'Sent';
        } else {
          logProgress(`[Campaign] ⚠️ Lead is in status "${targetStatus}". Skipping.`);
          io.emit('campaign_progress', { current: i + 1, total: targets.length, success: false, leadId: lead.id, error: `Lead status is ${targetStatus}` });
          continue;
        }
      }

      const dLink1 = catTemplates ? (catTemplates.demoLink1 || '') : '';
      const dLink2 = catTemplates ? (catTemplates.demoLink2 || '') : '';

      // Compile template placeholders
      let compiledMessage = activeTemplateText
        .replace(/{{business_name}}/gi, lead.name)
        .replace(/{{category}}/gi, lead.category)
        .replace(/{{location}}/gi, lead.location)
        .replace(/{{demo_link1}}/gi, dLink1)
        .replace(/{{demo_link2}}/gi, dLink2)
        .replace(/{{demo_link}}/gi, demoLink || '');

      try {
        logProgress(`[Campaign] Sending message...`);
        const sent = await sendMessage(lead.phone, compiledMessage);
        
        if (sent) {
          const updated = updateLead(lead.id, {
            status: nextStatus,
            lastSentDate: new Date().toISOString()
          });

          io.emit('lead_updated', updated);
          io.emit('campaign_progress', { current: i + 1, total: targets.length, success: true, leadId: lead.id });
          logProgress(`[Campaign] ✅ Sent successfully to ${lead.name}`);
        }
      } catch (err) {
        logProgress(`[Campaign] ❌ Failed to send to ${lead.name}: ${err.message}`);
        io.emit('campaign_progress', { current: i + 1, total: targets.length, success: false, leadId: lead.id, error: err.message });
      }

      // Add a random delay (e.g. 20 - 45 seconds) to avoid WhatsApp ban block, except for the last message
      if (i < targets.length - 1) {
        const delay = Math.floor(Math.random() * (45 - 20 + 1) + 20);
        logProgress(`[Campaign] Waiting for ${delay} seconds to safeguard account...`);
        await new Promise(resolve => setTimeout(resolve, delay * 1000));
      }
    }

    logProgress('[Campaign] Outreach campaign completed.');

  } catch (error) {
    logProgress(`[Campaign Error] ${error.message}`);
  } finally {
    activeCampaign = false;
  }
});

// ----------------------------------------------------------------------------
// AUTOMATIC OUTREACH ENGINE (ANTI-BAN SECURITY PROTOCOL)
// ----------------------------------------------------------------------------
async function runAutomaticOutreachLoop() {
  if (activeOutreachLoop) return;
  activeOutreachLoop = true;
  
  logProgress('[System] Automatic outreach loop started.');
  currentOutreachStatus = "Active (Initializing outreach queue...)";
  io.emit('outreach_operation', currentOutreachStatus);
  
  while (getWhatsAppStatus() === 'ready') {
    try {
      const leads = getLeads();
      const templates = getTemplates();
      
      // 1. Look for next Intro target (Pending status, oldest first)
      const pendingLeads = leads
        .filter(l => l.status === 'Pending')
        .sort((a, b) => a.id.localeCompare(b.id));
        
      let targetLead = null;
      let messageType = 'intro';
      
      for (const lead of pendingLeads) {
        const catTemplates = templates.categories ? templates.categories[lead.category] : null;
        if (catTemplates && catTemplates.introTemplate) {
          targetLead = lead;
          break;
        }
      }
      
      // 2. If no intros pending, look for Follow-up target (Sent status, oldest first, last sent >= 7 days)
      if (!targetLead) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const sentLeads = leads
          .filter(l => l.status === 'Sent' && l.lastSentDate && new Date(l.lastSentDate) < sevenDaysAgo)
          .sort((a, b) => a.id.localeCompare(b.id));
          
        for (const lead of sentLeads) {
          const catTemplates = templates.categories ? templates.categories[lead.category] : null;
          if (catTemplates && catTemplates.followupTemplate) {
            targetLead = lead;
            messageType = 'followup';
            break;
          }
        }
      }
      
      if (targetLead) {
        const catTemplates = templates.categories[targetLead.category];
        const templateText = messageType === 'intro' ? catTemplates.introTemplate : catTemplates.followupTemplate;
        
        currentOutreachStatus = `Sending ${messageType} to: ${targetLead.name} (${targetLead.phone})`;
        io.emit('outreach_operation', currentOutreachStatus);
        logProgress(`[Auto-Campaign] Sending ${messageType} to ${targetLead.name} (${targetLead.phone})`);
        
        let compiledMessage = templateText
          .replace(/{{business_name}}/gi, targetLead.name)
          .replace(/{{category}}/gi, targetLead.category)
          .replace(/{{location}}/gi, targetLead.location)
          .replace(/{{demo_link1}}/gi, catTemplates.demoLink1 || '')
          .replace(/{{demo_link2}}/gi, catTemplates.demoLink2 || '');
          
        try {
          const sent = await sendMessage(targetLead.phone, compiledMessage);
          if (sent) {
            const updated = updateLead(targetLead.id, {
              status: 'Sent',
              lastSentDate: new Date().toISOString()
            });
            io.emit('lead_updated', updated);
            logProgress(`[Auto-Campaign] ✅ Sent successfully to ${targetLead.name}`);
            currentOutreachStatus = `✅ Sent ${messageType} to ${targetLead.name}`;
            io.emit('outreach_operation', currentOutreachStatus);
          }
        } catch (err) {
          logProgress(`[Auto-Campaign] ❌ Failed to send to ${targetLead.name}: ${err.message}`);
          currentOutreachStatus = `❌ Failed for ${targetLead.name}: ${err.message}`;
          io.emit('outreach_operation', currentOutreachStatus);
        }
        
        // Anti-ban security delay: wait random duration between 20 to 45 seconds
        const delaySec = Math.floor(Math.random() * (45 - 20 + 1) + 20);
        for (let d = delaySec; d > 0; d--) {
          if (getWhatsAppStatus() !== 'ready') break;
          currentOutreachStatus = `Waiting ${d}s before next send (Anti-ban security delay...)`;
          io.emit('outreach_operation', currentOutreachStatus);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } else {
        // No leads require processing right now
        currentOutreachStatus = "Idle (Queue empty - All intros and weekly follow-ups up to date)";
        io.emit('outreach_operation', currentOutreachStatus);
        // Wait 15 seconds before checking database again
        await new Promise(resolve => setTimeout(resolve, 15000));
      }
    } catch (error) {
      logProgress(`[Auto-Campaign Loop Error] ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, 15000));
    }
  }
  
  activeOutreachLoop = false;
  currentOutreachStatus = "Idle (WhatsApp disconnected)";
  io.emit('outreach_operation', currentOutreachStatus);
  logProgress('[System] Automatic outreach loop stopped.');
}

// Start the HTTP / Socket.io server
httpServer.listen(PORT, () => {
  console.log(`Outreach Portal Server running on http://localhost:${PORT}`);
});
