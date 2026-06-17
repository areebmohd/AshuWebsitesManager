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

// Read all leads with on-the-fly schema migration
export function getLeads() {
  initDb();
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    const leads = JSON.parse(data);
    
    // Automatically migrate old fields to single "status" field if missing
    let migrated = false;
    const migratedLeads = leads.map(l => {
      if (l.status === undefined) {
        migrated = true;
        let status = 'Pending';
        if (l.leadOutcome === 'Won') status = 'Won';
        else if (l.leadOutcome === 'Lost') status = 'Lost';
        else if (l.replyStatus === 'Replied') status = 'Replied';
        else if (l.outreachStatus === 'Sent' || l.outreachStatus === 'Follow-up Sent') status = 'Sent';
        else if (l.outreachStatus === 'Not Sent') status = 'Pending';
        
        l.status = status;
        // Keep old fields in memory for backward-compatibility or delete them
        delete l.outreachStatus;
        delete l.replyStatus;
        delete l.leadOutcome;
      }
      return l;
    });

    if (migrated) {
      saveLeads(migratedLeads);
    }
    
    return migratedLeads;
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
    status: 'Pending',
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
  const sentLeads = leads.filter(l => ['Sent', 'Replied', 'Won', 'Lost'].includes(l.status)).length;
  const repliedLeads = leads.filter(l => ['Replied', 'Won', 'Lost'].includes(l.status)).length;
  const wonLeads = leads.filter(l => l.status === 'Won').length;
  const lostLeads = leads.filter(l => l.status === 'Lost').length;

  return {
    totalLeads,
    sentLeads,
    repliedLeads,
    wonLeads,
    lostLeads,
    conversionRate: totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0'
  };
}

const templatesPath = path.join(process.cwd(), 'database', 'templates.json');

export function getTemplates() {
  initDb();
  
  const defaultCategories = {
    "restaurants": {
      "demoLink1": "",
      "demoLink2": "",
      "introTemplate": "Hey {{business_name}}!\n\nI noticed you have a great restaurant listing on Google Maps in {{location}} but don't have a website for direct online ordering.\n\nWe build custom ordering websites that let you take direct orders on WhatsApp without paying Zomato/Swiggy commissions.\n\nHere are some of our previews:\n- Preview 1: {{demo_link1}}\n- Preview 2: {{demo_link2}}\n\nReply back if you want to see a free mockup built for your restaurant!",
      "followupTemplate": "Hey {{business_name}}!\n\nJust following up on my previous message. We can build your direct-ordering menu website in just 2 days.\n\nHere are the previews again:\n- Preview 1: {{demo_link1}}\n- Preview 2: {{demo_link2}}\n\nWould you be open to a quick call to check out a mockup?"
    },
    "clinics": {
      "demoLink1": "",
      "demoLink2": "",
      "introTemplate": "Hello {{business_name}}!\n\nI saw your medical clinic profile on Google Maps in {{location}} and noticed you don't have a website for direct appointment booking.\n\nWe build custom booking websites for clinics that let patients schedule appointments easily and receive updates on WhatsApp.\n\nHere are some of our previews:\n- Preview 1: {{demo_link1}}\n- Preview 2: {{demo_link2}}\n\nReply back if you'd like a free booking page mockup for your clinic!",
      "followupTemplate": "Hello {{business_name}}!\n\nJust following up. We can set up your online booking assistant and patient portal in just 2 days.\n\nCheck out the demo pages here:\n- Demo 1: {{demo_link1}}\n- Demo 2: {{demo_link2}}\n\nLet me know if we can show you a quick mockup."
    },
    "salons": {
      "demoLink1": "",
      "demoLink2": "",
      "introTemplate": "Hey {{business_name}}!\n\nI saw your salon profile on Google Maps in {{location}} and noticed you don't have a website for direct client booking.\n\nWe build custom booking and catalog websites for salons that let clients book appointments directly on WhatsApp and view services.\n\nHere are some of our previews:\n- Preview 1: {{demo_link1}}\n- Preview 2: {{demo_link2}}\n\nReply back if you want a free demo booking site for your salon!",
      "followupTemplate": "Hey {{business_name}}!\n\nJust following up on my message. We can build your direct scheduling portal in just 2 days.\n\nCheck out our live previews:\n- Preview 1: {{demo_link1}}\n- Preview 2: {{demo_link2}}\n\nWould you be open to a quick call?"
    },
    "clothing shops": {
      "demoLink1": "",
      "demoLink2": "",
      "introTemplate": "Hey {{business_name}}!\n\nI saw your clothing boutique listing on Google Maps in {{location}} and noticed you don't have a catalog website.\n\nWe build custom digital catalog websites for apparel shops that let customers browse collection categories and place orders directly on WhatsApp.\n\nCheck out some of our previews:\n- Preview 1: {{demo_link1}}\n- Preview 2: {{demo_link2}}\n\nReply back if you want a free catalog mockup built for your shop!",
      "followupTemplate": "Hey {{business_name}}!\n\nJust following up. We can build your digital clothing catalog and WhatsApp checkout system in just 2 days.\n\nHere are the previews:\n- Preview 1: {{demo_link1}}\n- Preview 2: {{demo_link2}}\n\nLet me know if you want to see a free mockup!"
    },
    "electronics shops": {
      "demoLink1": "",
      "demoLink2": "",
      "introTemplate": "Hey {{business_name}}!\n\nI saw your electronics shop profile on Google Maps in {{location}} and noticed you don't have a catalog website.\n\nWe build custom catalog and inquiry pages for electronics retailers to list inventories, check specs, and take order inquiries on WhatsApp.\n\nCheck out some of our previews:\n- Preview 1: {{demo_link1}}\n- Preview 2: {{demo_link2}}\n\nReply back if you want a free inventory inquiry page mockup!",
      "followupTemplate": "Hey {{business_name}}!\n\nJust following up on my previous message. We can build your digital catalog inquiry portal in just 2 days.\n\nHere are the links:\n- Preview 1: {{demo_link1}}\n- Preview 2: {{demo_link2}}\n\nLet me know if we can build a free demo page for your inventory!"
    }
  };

  let templates = { categories: defaultCategories };

  if (fs.existsSync(templatesPath)) {
    try {
      const data = fs.readFileSync(templatesPath, 'utf8');
      const parsed = JSON.parse(data);
      if (parsed) {
        templates = parsed;
        if (!templates.categories) {
          templates.categories = {};
        }
        
        // Seed or override target default categories
        for (const cat in defaultCategories) {
          if (!templates.categories[cat]) {
            templates.categories[cat] = defaultCategories[cat];
          }
        }
      }
    } catch (error) {
      console.error('Error reading templates file, using defaults:', error);
    }
  }

  // Always write templates file to disk to make sure they are written
  fs.writeFileSync(templatesPath, JSON.stringify(templates, null, 2), 'utf8');
  return templates;
}

export function saveTemplates(templates) {
  initDb();
  try {
    fs.writeFileSync(templatesPath, JSON.stringify(templates, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing templates:', error);
    return false;
  }
}
