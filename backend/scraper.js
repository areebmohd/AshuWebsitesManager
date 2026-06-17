import puppeteer from 'puppeteer';
import { addLead } from './db.js';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Run Google Maps scraper
 * @param {string} category - Business category (e.g. restaurants)
 * @param {string} location - Location (e.g. Gurugram)
 * @param {function} onLog - Callback for real-time progress logging
 * @param {function} onLead - Callback when a lead is successfully saved
 */
export async function runScraper(category, location, options = {}, onLog, onLead) {
  const searchQuery = `${category} in ${location}`;
  onLog(`[Scraper] Starting scraper for: "${searchQuery}"`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new', // Runs in background
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--window-size=1280,800'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
    onLog(`[Scraper] Navigating directly to search URL: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for search results container
    onLog('[Scraper] Waiting for search results to load...');
    await delay(5000); // Wait for initial load

    // Find the scrollable feed container (Google Maps sidebar uses role="feed" or role="main" scrollable)
    const feedSelector = 'div[role="feed"], div[role="main"] div[tabindex="0"]';
    
    // We will scroll the feed a few times to load initial listings
    onLog('[Scraper] Scrolling search results list to load items...');
    let previousHeight = 0;
    let scrollCount = 0;
    const maxScrolls = options.scrollDepth ? Number(options.scrollDepth) : 15; // Set dynamic scroll limit based on options

    while (scrollCount < maxScrolls) {
      const feedExists = await page.$(feedSelector);
      if (!feedExists) {
        onLog('[Scraper] Sidebar list not found. Scrolling page body instead...');
        await page.evaluate(() => window.scrollBy(0, 1000));
      } else {
        await page.evaluate((selector) => {
          const feed = document.querySelector(selector);
          if (feed) {
            feed.scrollBy(0, 1500);
          }
        }, feedSelector);
      }
      await delay(2000);
      scrollCount++;
    }

    onLog('[Scraper] Loading complete. Beginning extraction...');

    // Select all listing links
    // The items inside the sidebar feed are usually links matching maps/place/
    const itemLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/maps/place/"]'));
      return links.map(a => ({
        url: a.href,
        title: a.ariaLabel || a.querySelector('.qBF1Pd')?.textContent || 'Business'
      }));
    });

    // Remove duplicate links from the list
    const uniqueItems = [];
    const urls = new Set();
    for (const item of itemLinks) {
      if (!urls.has(item.url)) {
        urls.add(item.url);
        uniqueItems.push(item);
      }
    }

    onLog(`[Scraper] Found ${uniqueItems.length} unique business listings. Inspecting details...`);

    let scrapedCount = 0;
    let savedCount = 0;

    for (let i = 0; i < uniqueItems.length; i++) {
      const item = uniqueItems[i];
      scrapedCount++;
      onLog(`[Scraper] Inspecting [${scrapedCount}/${uniqueItems.length}]: "${item.title}"`);

      try {
        // Navigate to the detail page directly (faster than clicking)
        await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await delay(2000); // Let details settle

        // Extract details
        const details = await page.evaluate(() => {
          // 1. Extract Name
          const nameEl = document.querySelector('h1');
          const name = nameEl ? nameEl.textContent.trim() : '';

          // 2. Check for website
          // Look for data-item-id="authority" or links containing external domains
          const websiteEl = document.querySelector('a[data-item-id="authority"], button[data-item-id="authority"], a[aria-label*="Website"], a[aria-label*="website"]');
          let hasWebsite = !!websiteEl;
          let websiteUrl = websiteEl ? (websiteEl.href || '') : '';

          // Double check external anchors in the main panel just in case
          if (!hasWebsite) {
            const externalLinks = Array.from(document.querySelectorAll('a[href]'));
            for (const link of externalLinks) {
              const href = link.href;
              const isMapsOrGoogle = href.includes('google.com') || href.includes('google.co') || href.includes('gstatic.com') || href.includes('apple.com');
              const isTel = href.startsWith('tel:');
              const isSocial = href.includes('facebook.com') || href.includes('instagram.com') || href.includes('youtube.com') || href.includes('twitter.com');
              
              // If it's a standard link, not google, not telephone, and looks like a website, count it
              if (href && !isMapsOrGoogle && !isTel && !isSocial && href.startsWith('http')) {
                hasWebsite = true;
                websiteUrl = href;
                break;
              }
            }
          }

          // 3. Extract Phone Number
          // Find tel: links or search text for matching formats
          let phone = '';
          const telLink = document.querySelector('a[href^="tel:"]');
          if (telLink) {
            phone = telLink.href.replace('tel:', '').trim();
          } else {
            // Check button elements with phone numbers
            const buttons = Array.from(document.querySelectorAll('button[data-item-id^="phone:tel:"]'));
            if (buttons.length > 0) {
              const dataId = buttons[0].getAttribute('data-item-id');
              phone = dataId.replace('phone:tel:', '').trim();
            } else {
              // Fallback text search for phone icon adjacent texts
              const divs = Array.from(document.querySelectorAll('div, button'));
              for (const div of divs) {
                const text = div.textContent ? div.textContent.trim() : '';
                // Check if text matches Indian phone format (+91 xxxxx xxxxx or 0xxxxxxxxx or xxxxxxxxxx)
                const phoneMatch = text.match(/(?:\+91|0)?[6-9]\d{4}\s?\d{5}/);
                if (phoneMatch) {
                  phone = phoneMatch[0];
                  break;
                }
              }
            }
          }

          return { name, hasWebsite, websiteUrl, phone };
        });

        if (details.hasWebsite) {
          onLog(`[Scraper] ❌ Skipped: "${details.name || item.title}" already has a website (${details.websiteUrl || 'listed'}).`);
          continue;
        }

        if (!details.phone) {
          onLog(`[Scraper] ❌ Skipped: "${details.name || item.title}" has no phone number listed.`);
          continue;
        }

        const digits = details.phone.replace(/[^0-9]/g, '');
        const last10 = digits.slice(-10);
        const isMobile = /^[6-9]\d{9}$/.test(last10) && (digits.length === 10 || (digits.length === 11 && digits.startsWith('0')) || (digits.length === 12 && digits.startsWith('91')));
        
        if (!isMobile) {
          onLog(`[Scraper] ❌ Skipped: "${details.name || item.title}" phone number (${details.phone}) is not a mobile number.`);
          continue;
        }

        // We have a lead! Save it
        const leadData = {
          name: details.name || item.title,
          phone: details.phone,
          category: category,
          location: location,
          url: item.url
        };

        const savedLead = addLead(leadData);
        if (savedLead) {
          savedCount++;
          onLog(`[Scraper]  Lead Saved: "${savedLead.name}" | Phone: ${savedLead.phone}`);
          onLead(savedLead); // trigger real-time lead update to client
        } else {
          onLog(`[Scraper] ℹ️ Duplicate: "${leadData.name}" already exists in contacts database.`);
        }

      } catch (err) {
        onLog(`[Scraper] Error loading details for "${item.title}": ${err.message}`);
      }
    }

    onLog(`[Scraper] Scraping session completed. Processed ${scrapedCount} listings. Saved ${savedCount} new leads.`);

  } catch (error) {
    onLog(`[Scraper] Fatal error: ${error.message}`);
    console.error('Fatal scraping error:', error);
  } finally {
    if (browser) {
      await browser.close();
      onLog('[Scraper] Browser closed.');
    }
  }
}
