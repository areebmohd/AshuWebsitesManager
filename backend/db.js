import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database', 'leads.json');

// Ensure database file and directory exist
export function initDb() {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify([], null, 2), 'utf8');
  }
}

// Read all leads
export function getLeads() {
  initDb();
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return [];
  }
}

// Save all leads
export function saveLeads(leads) {
  initDb();
  try {
    fs.writeFileSync(dbPath, JSON.stringify(leads, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing database:', error);
    return false;
  }
}

// Add a single lead (avoids duplicates based on phone number)
export function addLead(newLead) {
  const leads = getLeads();
  
  // Normalize phone number to avoid duplicates
  const cleanPhone = newLead.phone.replace(/[^0-9]/g, '');
  if (!cleanPhone) return null;

  // Check duplicate
  const exists = leads.find(l => l.phone.replace(/[^0-9]/g, '') === cleanPhone);
  if (exists) {
    return null; // duplicate
  }

  const lead = {
    id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: newLead.name.trim(),
    phone: cleanPhone,
    category: newLead.category.toLowerCase().trim(),
    location: newLead.location ? newLead.location.trim() : 'Gurugram',
    url: newLead.url || '',
    outreachStatus: 'Not Sent',
    replyStatus: 'No Reply',
    leadOutcome: 'Undecided',
    lastSentDate: null,
    createdAt: new Date().toISOString()
  };

  leads.push(lead);
  saveLeads(leads);
  return lead;
}

// Update specific fields of a lead by ID
export function updateLead(id, updates) {
  const leads = getLeads();
  const index = leads.findIndex(l => l.id === id);
  if (index === -1) return null;

  leads[index] = {
    ...leads[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  saveLeads(leads);
  return leads[index];
}

// Get outreach campaign stats
export function getStats() {
  const leads = getLeads();
  const totalLeads = leads.length;
  const sentLeads = leads.filter(l => l.outreachStatus === 'Sent' || l.outreachStatus === 'Follow-up Sent').length;
  const repliedLeads = leads.filter(l => l.replyStatus === 'Replied').length;
  const wonLeads = leads.filter(l => l.leadOutcome === 'Won').length;
  const lostLeads = leads.filter(l => l.leadOutcome === 'Lost').length;

  return {
    totalLeads,
    sentLeads,
    repliedLeads,
    wonLeads,
    lostLeads,
    conversionRate: totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0'
  };
}
