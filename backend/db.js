import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'public', 'leads.json');

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
    notes: newLead.notes || '',
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
      "introTemplate": "Hey {{business_name}}! 🍔\n\nI noticed you have a great restaurant listing on Google Maps in {{location}}, but you don't have a website to showcase your menu and get direct online orders.\n\nSince everyone is ordering online now, having your own website is essential to get direct orders without paying heavy commissions to Swiggy/Zomato. We can help you build a custom website starting at just ₹999! 🚀\n\nIf you are interested, we can send you some of our demo previews. If you like them, we can create your very own site! Let us know if you'd like to check them out.",
      "followupTemplate": "Hey {{business_name}}! 🍔\n\nJust following up on my previous message.\n\nSince everyone is moving online, we can launch your premium custom website—complete with an easy dashboard to track all your orders—in just 2 days for only ₹999! 🚀\n\nIf you'd be interested to see how it looks, we can share some demo previews with you. If you like what you see, we can create a custom site specifically for your business!"
    },
    "clinics": {
      "demoLink1": "",
      "demoLink2": "",
      "introTemplate": "Hello {{business_name}}! 🩺\n\nI saw your medical clinic profile on Google Maps in {{location}}, but you don't have a website for patients to book appointments directly.\n\nHaving your own professional website is essential to manage appointments smoothly and build trust. We can help you build a custom booking website starting at just ₹999! 🚀\n\nIf you are interested, we can send you some of our clinic website demo previews. If you like them, we can create your very own booking site! Let us know if you'd like to check them out.",
      "followupTemplate": "Hello {{business_name}}! 🩺\n\nJust following up on my previous message.\n\nGive your patients a seamless way to book appointments while keeping your reception organized. We can launch your custom clinic-booking website in just 2 days for only ₹999! 🚀\n\nIf you'd be interested, we can send you some demo booking layouts. If you like them, we can set up your own clinic booking site!"
    },
    "salons": {
      "demoLink1": "",
      "demoLink2": "",
      "introTemplate": "Hey {{business_name}}! ✂️\n\nI saw your salon profile on Google Maps in {{location}}, but you don't have a website for direct client appointment booking.\n\nWe build custom booking websites for salons that let clients schedule appointments directly. We can set up a premium booking website starting at just ₹999! 🚀\n\nIf you are interested, we can send you some salon website demo previews. If you like them, we can create your very own site! Let us know if you'd like to check them out.",
      "followupTemplate": "Hey {{business_name}}! ✂️\n\nJust following up on my previous message.\n\nWe can build your salon's direct booking portal and services catalog in just 2 days for only ₹999! 🚀\n\nIf you'd be interested, we can share some demo scheduling pages. If you like what you see, we can build one specifically for your salon!"
    },
    "clothing shops": {
      "demoLink1": "",
      "demoLink2": "",
      "introTemplate": "Hey {{business_name}}! 👗\n\nI saw your clothing shop listing on Google Maps in {{location}}, but you don't have a website to showcase your catalog and collection.\n\nWe build custom digital catalog websites for apparel shops that let customers browse your styles. We can help you build your custom catalog website starting at just ₹999! 🚀\n\nIf you are interested, we can send you some boutique catalog demo previews. If you like them, we can create your very own site! Let us know if you'd like to check them out.",
      "followupTemplate": "Hey {{business_name}}! 👗\n\nJust following up on my previous message.\n\nWe can launch your digital shop catalog and ordering system in just 2 days for only ₹999! 🚀\n\nIf you'd be interested, we can send you some demo catalogs to browse. If you like them, we can create a custom site for your clothing shop!"
    },
    "electronics shops": {
      "demoLink1": "",
      "demoLink2": "",
      "introTemplate": "Hey {{business_name}}! ⚡\n\nI saw your electronics shop profile on Google Maps in {{location}}, but you don't have a website to showcase your inventory.\n\nWe build custom product catalog websites for electronics shops that let clients browse spec sheets and request quotes. We can build your premium catalog website starting at just ₹999! 🚀\n\nIf you are interested, we can send you some electronics shop demo previews. If you like them, we can create your very own site! Let us know if you'd like to check them out.",
      "followupTemplate": "Hey {{business_name}}! ⚡\n\nJust following up on my previous message.\n\nWe can launch your digital catalog inventory system and quote request portal in just 2 days for only ₹999! 🚀\n\nIf you'd be interested to see, we can share some demo shop layouts. If you like them, we can build a custom site for your business!"
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
