import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode';
import fs from 'fs';
import path from 'path';

let client = null;
let clientStatus = 'disconnected'; // disconnected, connecting, qr, authenticated, ready

/**
 * Initialize WhatsApp Client
 * @param {function} onStatus - Callback when client status changes
 * @param {function} onQR - Callback when QR code is generated (data URI)
 * @param {function} onLog - Callback for general logging
 */
export function initWhatsApp(onStatus, onQR, onLog, onMessage) {
  if (client) {
    onLog('[WhatsApp] Client already exists. Returning status: ' + clientStatus);
    onStatus(clientStatus);
    return;
  }

  // Clear any stale SingletonLock files left by previous crashes to prevent startup lock errors
  try {
    const lockPath = path.join(process.cwd(), '.wwebjs_auth', 'session', 'SingletonLock');
    if (fs.existsSync(lockPath)) {
      onLog('[WhatsApp] Stale lock file found. Deleting SingletonLock to prevent startup blocks...');
      fs.unlinkSync(lockPath);
    }
  } catch (err) {
    onLog('[WhatsApp] Failed to clean stale lock file: ' + err.message);
  }

  onLog('[WhatsApp] Initializing client...');
  clientStatus = 'connecting';
  onStatus(clientStatus);

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: './.wwebjs_auth'
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    }
  });

  client.on('qr', async (qr) => {
    clientStatus = 'qr';
    onStatus(clientStatus);
    onLog('[WhatsApp] QR Code received. Converting to image...');
    
    try {
      const qrDataUri = await qrcode.toDataURL(qr);
      onQR(qrDataUri);
    } catch (err) {
      onLog('[WhatsApp] Error generating QR data URI: ' + err.message);
    }
  });

  client.on('authenticated', () => {
    clientStatus = 'authenticated';
    onStatus(clientStatus);
    onLog('[WhatsApp] Client authenticated successfully.');
  });

  client.on('auth_failure', async (msg) => {
    clientStatus = 'disconnected';
    onStatus(clientStatus);
    onLog('[WhatsApp] Auth failure: ' + msg);
    try {
      if (client) {
        await client.destroy();
      }
    } catch (err) {
      onLog('[WhatsApp] Error destroying client on auth failure: ' + err.message);
    }
    client = null;
  });

  client.on('ready', () => {
    clientStatus = 'ready';
    onStatus(clientStatus);
    onLog('[WhatsApp] Client is ready and connected!');
  });

  client.on('disconnected', async (reason) => {
    clientStatus = 'disconnected';
    onStatus(clientStatus);
    onLog('[WhatsApp] Client disconnected: ' + reason);
    try {
      if (client) {
        await client.destroy();
      }
    } catch (err) {
      onLog('[WhatsApp] Error destroying client on disconnect: ' + err.message);
    }
    client = null;
  });

  client.on('message', async (msg) => {
    if (msg.from && msg.from.endsWith('@c.us') && onMessage) {
      const phone = msg.from.replace('@c.us', '');
      onMessage(phone, msg.body);
    }
  });

  // Start initialization
  client.initialize().catch(async (err) => {
    clientStatus = 'disconnected';
    onStatus(clientStatus);
    onLog('[WhatsApp] Initialization failed: ' + err.message);
    try {
      if (client) {
        await client.destroy();
      }
    } catch (e) {
      onLog('[WhatsApp] Error destroying client after init failure: ' + e.message);
    }
    client = null;
  });
}

/**
 * Get current client status
 */
export function getWhatsAppStatus() {
  return clientStatus;
}

/**
 * Format phone number to WhatsApp JID format
 * e.g., 9876543210 -> 919876543210@c.us
 * @param {string} phone 
 */
export function formatPhoneNumber(phone) {
  let cleanNumber = phone.replace(/[^0-9]/g, '');
  
  // If it's a 10 digit Indian number, prefix it with 91
  if (cleanNumber.length === 10) {
    cleanNumber = '91' + cleanNumber;
  }
  
  // If it's 12 digits (like 919876543210), keep it. If it starts with 0, strip 0 and prepend 91.
  if (cleanNumber.startsWith('0') && cleanNumber.length === 11) {
    cleanNumber = '91' + cleanNumber.substring(1);
  }

  return cleanNumber + '@c.us';
}

/**
 * Send a WhatsApp Message
 * @param {string} phone - Target phone number
 * @param {string} message - Message text
 * @returns {Promise<boolean>}
 */
export async function sendMessage(phone, message) {
  if (!client || clientStatus !== 'ready') {
    throw new Error('WhatsApp client is not ready. Status: ' + clientStatus);
  }

  const jid = formatPhoneNumber(phone);
  try {
    // Resolve the official JID/LID from WhatsApp to prevent "No LID for user" errors
    const numberId = await client.getNumberId(jid);
    if (!numberId) {
      throw new Error('Number is not registered on WhatsApp');
    }
    const response = await client.sendMessage(numberId._serialized, message);
    return !!response.id;
  } catch (err) {
    console.error(`Error sending message to ${jid}:`, err);
    throw err;
  }
}

/**
 * Log out and destroy WhatsApp Client
 */
export async function logoutWhatsApp(onStatus, onLog) {
  if (!client) {
    onLog('[WhatsApp] No client to logout.');
    return;
  }

  onLog('[WhatsApp] Logging out and destroying client...');
  try {
    await client.logout();
    await client.destroy();
  } catch (err) {
    onLog('[WhatsApp] Error during logout: ' + err.message);
  } finally {
    client = null;
    clientStatus = 'disconnected';
    onStatus(clientStatus);
  }
}
