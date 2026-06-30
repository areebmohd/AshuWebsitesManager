import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { runScraper, discoverMalls } from './scraper.js';

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
let activeDiscoverer = false;
let scraperCancelled = false;

// Socket.io Connection
io.on('connection', (socket) => {
  console.log('Client connected to socket');
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

// Start Google Maps Scraping
app.post('/api/scrape/start', async (req, res) => {
  const { category, location, scrollDepth, existingPhones } = req.body;
  if (!category || !location || (Array.isArray(location) && location.length === 0)) {
    return res.status(400).json({ error: 'Category and Location are required' });
  }

  if (activeScraper) {
    return res.status(400).json({ error: 'Another scraper is already running' });
  }

  activeScraper = true;
  scraperCancelled = false;
  res.json({ message: 'Scraping started' });

  // Run in background
  try {
    await runScraper(
      category, 
      location, 
      { 
        scrollDepth: Number(scrollDepth),
        existingPhones: existingPhones || [],
        checkCancelled: () => scraperCancelled
      },
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

// Discover Shopping Malls & Markets
app.post('/api/scrape/malls', async (req, res) => {
  const { city } = req.body;
  if (!city) {
    return res.status(400).json({ error: 'City is required' });
  }

  if (activeScraper || activeDiscoverer) {
    return res.status(400).json({ error: 'Another scraper or discovery process is already running' });
  }

  activeDiscoverer = true;
  scraperCancelled = false;
  logProgress(`[System] Discovery phase requested: finding shopping malls and markets in "${city}"...`);
  
  try {
    const locations = await discoverMalls(
      city, 
      (logMsg) => logProgress(logMsg),
      () => scraperCancelled
    );
    res.json({ success: true, locations, cancelled: scraperCancelled });
  } catch (error) {
    logProgress(`[Discovery Error] ${error.message}`);
    res.status(500).json({ error: error.message });
  } finally {
    activeDiscoverer = false;
  }
});

// Stop Google Maps Scraping or Discovery
app.post('/api/scrape/stop', (req, res) => {
  if (!activeScraper && !activeDiscoverer) {
    return res.json({ message: 'No active scraper or discovery process is running' });
  }
  scraperCancelled = true;
  logProgress('[System] Cancel request received. Stopping active process...');
  res.json({ message: 'Cancellation requested' });
});

// Start the HTTP / Socket.io server
httpServer.listen(PORT, () => {
  console.log(`Outreach Portal Scraper Server running on http://localhost:${PORT}`);
});

