import puppeteer from 'puppeteer';

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
        '--disable-gpu',
        '--disable-audio-output',
        '--disable-extensions',
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
      if (options.checkCancelled && options.checkCancelled()) {
        onLog('[Scraper] Stop signal received. Exiting scroll loop.');
        break;
      }
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

    // Create a Set of existing normalized phone numbers for fast duplicate checking
    const existingPhoneSet = new Set(
      (options.existingPhones || []).map(p => p.replace(/[^0-9]/g, ''))
    );

    for (let i = 0; i < uniqueItems.length; i++) {
      if (options.checkCancelled && options.checkCancelled()) {
        onLog('[Scraper] Stop signal received. Exiting scrape details inspection.');
        break;
      }
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

        // Verify if website is actually functional or if it redirects to Google/Social
        if (details.hasWebsite && details.websiteUrl) {
          try {
            onLog(`[Scraper] 🔍 Checking website status for "${details.name || item.title}": ${details.websiteUrl}`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
              try { controller.abort(); } catch(e){}
            }, 4000); // 4s timeout
            
            const response = await fetch(details.websiteUrl, {
              method: 'GET',
              signal: controller.signal,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
              }
            });
            clearTimeout(timeoutId);
            
            const finalUrl = response.url || details.websiteUrl;
            const isRedirectedToGoogleOrSocial = 
              finalUrl.includes('google.com') || 
              finalUrl.includes('google.co') || 
              finalUrl.includes('gstatic.com') ||
              finalUrl.includes('facebook.com') || 
              finalUrl.includes('instagram.com');

            if (isRedirectedToGoogleOrSocial) {
              onLog(`[Scraper] ℹ️ Website redirects to Google/Social (${finalUrl}). Treating as no real website.`);
              details.hasWebsite = false;
              details.notes = `Website redirects to Google/Social: ${details.websiteUrl}`;
            } else if (!response.ok && response.status >= 400) {
              onLog(`[Scraper] ⚠️ Website responded with status ${response.status}. Treating as broken.`);
              details.hasWebsite = false;
              details.notes = `Broken/Offline website (Status ${response.status}): ${details.websiteUrl}`;
            }
          } catch (err) {
            onLog(`[Scraper] ⚠️ Website check failed (${err.message}). Treating as broken.`);
            details.hasWebsite = false;
            details.notes = `Broken/Offline website: ${details.websiteUrl}`;
          }
        }

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

        // Check duplicates against frontend state
        if (existingPhoneSet.has(digits)) {
          onLog(`[Scraper] ℹ️ Duplicate: "${details.name || item.title}" phone already exists in contacts list.`);
          continue;
        }

        // We have a lead! Save it in memory and emit to frontend
        const leadData = {
          id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: (details.name || item.title).trim(),
          phone: digits,
          category: category.toLowerCase().trim(),
          location: location ? location.trim() : 'Gurugram',
          url: item.url || '',
          status: 'Pending',
          notes: details.notes || '',
          lastSentDate: null,
          createdAt: new Date().toISOString()
        };

        savedCount++;
        onLog(`[Scraper]  Lead Found: "${leadData.name}" | Phone: ${leadData.phone}`);
        onLead(leadData); // trigger real-time lead update to client

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
