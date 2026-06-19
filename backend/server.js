import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { getLeads, updateLead, getStats, getTemplates, saveTemplates } from './db.js';
import { runScraper } from './scraper.js';
import { initWhatsApp, getWhatsAppStatus, sendMessage, logoutWhatsApp, checkReplies } from './whatsapp.js';

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
let activeOutreachLoop = false;
let currentOutreachStatus = "Idle (Stop automatic messages button not clicked)";

// Socket.io Connection
io.on('connection', (socket) => {
  console.log('Client connected to socket');
  
  // Send current status immediately on connect
  socket.emit('whatsapp_status', getWhatsAppStatus());
  socket.emit('outreach_operation', currentOutreachStatus);

  socket.on('disconnect', () => {
    console.log('Client disconnected from socket');
  });
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
    if (updates && (updates.status === 'Sent' || updates.status === 'Failed')) {
      updates.lastSentDate = new Date().toISOString();
    }
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

// 3d. Delete templates configuration
app.post('/api/templates/delete', (req, res) => {
  const { category } = req.body;
  if (!category) {
    return res.status(400).json({ error: 'Category is required' });
  }

  try {
    const templates = getTemplates();
    const cleanCategory = category.toLowerCase().trim();
    if (templates.categories && templates.categories[cleanCategory]) {
      delete templates.categories[cleanCategory];
      const saved = saveTemplates(templates);
      if (saved) {
        res.json({ message: `Templates for category "${cleanCategory}" deleted successfully` });
      } else {
        res.status(500).json({ error: 'Failed to delete templates' });
      }
    } else {
      res.status(404).json({ error: 'Category not found' });
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
      },
      (qrCode) => {
        io.emit('whatsapp_qr', qrCode);
      },
      (logMsg) => {
        logProgress(logMsg);
      },
      async (fromPhone, messageBody) => {
        const cleanFrom = fromPhone.replace(/[^0-9]/g, '');
        const last10From = cleanFrom.slice(-10);
        logProgress(`[WhatsApp] Inbound message from ${cleanFrom} (ending in ${last10From}): "${messageBody.substring(0, 60)}"`);
        
        const leads = getLeads();
        const matchingLead = leads.find(l => {
          const cleanLeadPhone = l.phone.replace(/[^0-9]/g, '');
          const last10Lead = cleanLeadPhone.slice(-10);
          return last10Lead === last10From && (l.status === 'Sent' || l.status === 'Pending');
        });
        
        if (matchingLead) {
          logProgress(`[System] Lead "${matchingLead.name}" replied! Auto-updating status to 'Replied'.`);
          const updated = updateLead(matchingLead.id, {
            status: 'Replied'
          });
          io.emit('lead_updated', updated);
        } else {
          logProgress(`[System] No matching 'Sent' or 'Pending' lead found in database for number ending in ${last10From}.`);
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
    activeOutreachLoop = false;
    await logoutWhatsApp(
      (status) => io.emit('whatsapp_status', status),
      (logMsg) => logProgress(logMsg)
    );
    res.json({ message: 'WhatsApp client destroyed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Start Automated Outreach Campaign
app.post('/api/outreach/start', (req, res) => {
  if (getWhatsAppStatus() !== 'ready') {
    return res.status(400).json({ error: 'WhatsApp client must be connected and ready first.' });
  }
  if (activeOutreachLoop) {
    return res.json({ message: 'Automatic outreach is already running.' });
  }
  
  // Start the background loop
  runAutomaticOutreachLoop();
  res.json({ message: 'Automatic campaign outreach loop started.' });
});

// 9. Stop Automated Outreach Campaign
app.post('/api/outreach/stop', (req, res) => {
  if (!activeOutreachLoop) {
    return res.json({ message: 'Automatic outreach is not active.' });
  }
  activeOutreachLoop = false;
  currentOutreachStatus = "Idle (Stop automatic messages button clicked)";
  io.emit('outreach_operation', currentOutreachStatus);
  res.json({ message: 'Automatic campaign outreach stopped.' });
});

// 9b. Check Replies
let isCheckingReplies = false;
app.post('/api/outreach/check-replies', (req, res) => {
  if (getWhatsAppStatus() !== 'ready') {
    return res.status(400).json({ error: 'WhatsApp client must be connected and ready first.' });
  }
  if (isCheckingReplies) {
    return res.json({ message: 'Reply check is already in progress.' });
  }
  
  isCheckingReplies = true;
  res.json({ message: 'Check replies process started.' });

  // Run async check loop
  (async () => {
    try {
      currentOutreachStatus = "Active (Scanning chats for replies...)";
      io.emit('outreach_operation', currentOutreachStatus);

      const leads = getLeads();
      const sentLeads = leads.filter(l => l.status === 'Sent');

      if (sentLeads.length === 0) {
        logProgress('[System] No leads with status "Sent" found in database.');
        return;
      }

      await checkReplies(
        sentLeads,
        async (leadId) => {
          const updated = updateLead(leadId, { status: 'Replied' });
          io.emit('lead_updated', updated);
        },
        (logMsg) => {
          logProgress(logMsg);
        }
      );
    } catch (err) {
      logProgress(`[System] ❌ Check replies failed: ${err.message}`);
    } finally {
      isCheckingReplies = false;
      currentOutreachStatus = "Idle (Scan completed)";
      io.emit('outreach_operation', currentOutreachStatus);
    }
  })();
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
  
  while (getWhatsAppStatus() === 'ready' && activeOutreachLoop) {
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
          
          const updated = updateLead(targetLead.id, {
            status: 'Failed',
            notes: 'Outreach failed: ' + err.message,
            lastSentDate: new Date().toISOString()
          });
          io.emit('lead_updated', updated);
        }
        
        // Anti-ban security delay: wait random duration between 20 to 45 seconds
        const delaySec = Math.floor(Math.random() * (45 - 20 + 1) + 20);
        for (let d = delaySec; d > 0; d--) {
          if (getWhatsAppStatus() !== 'ready' || !activeOutreachLoop) break;
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
  currentOutreachStatus = "Idle (WhatsApp disconnected or loop stopped)";
  io.emit('outreach_operation', currentOutreachStatus);
  logProgress('[System] Automatic outreach loop stopped.');
}

// Start the HTTP / Socket.io server
httpServer.listen(PORT, () => {
  console.log(`Outreach Portal Server running on http://localhost:${PORT}`);
});
