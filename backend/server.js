import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { getLeads, updateLead, getStats } from './db.js';
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

// Socket.io Connection
io.on('connection', (socket) => {
  console.log('Client connected to socket');
  
  // Send current WhatsApp status immediately on connect
  socket.emit('whatsapp_status', getWhatsAppStatus());

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

// 4. Start Google Maps Scraping
app.post('/api/scrape/start', async (req, res) => {
  const { category, location } = req.body;
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
  if (!template) {
    return res.status(400).json({ error: 'Message template is required' });
  }

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

    for (let i = 0; i < targets.length; i++) {
      const lead = targets[i];
      logProgress(`[Campaign] [${i+1}/${targets.length}] Processing message to: ${lead.name} (${lead.phone})`);

      // Compile template placeholders
      let compiledMessage = template
        .replace(/{{business_name}}/gi, lead.name)
        .replace(/{{category}}/gi, lead.category)
        .replace(/{{location}}/gi, lead.location)
        .replace(/{{demo_link}}/gi, demoLink || '');

      try {
        logProgress(`[Campaign] Sending message...`);
        const sent = await sendMessage(lead.phone, compiledMessage);
        
        if (sent) {
          const newStatus = isFollowup ? 'Follow-up Sent' : 'Sent';
          const updated = updateLead(lead.id, {
            outreachStatus: newStatus,
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

// Start the HTTP / Socket.io server
httpServer.listen(PORT, () => {
  console.log(`Outreach Portal Server running on http://localhost:${PORT}`);
});
