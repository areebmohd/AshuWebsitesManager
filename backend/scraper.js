import puppeteer from 'puppeteer';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Classify a raw Google Maps category string into predefined template categories
 * @param {string} rawCat - Raw category text from Maps listing (e.g., "North Indian restaurant")
 * @returns {string} - Preset category matching a custom template, or "shops" fallback
 */
export function classifyCategory(rawCat) {
  const cat = (rawCat || '').toLowerCase().trim();
  if (!cat) return 'restaurants';

  // Gyms & Fitness
  if (
    cat.includes('gym') || 
    cat.includes('fitness') || 
    cat.includes('yoga') || 
    cat.includes('crossfit') || 
    cat.includes('workout') || 
    cat.includes('training') || 
    cat.includes('trainer') || 
    cat.includes('sports') || 
    cat.includes('academy') ||
    cat.includes('health club') ||
    cat.includes('zumba') ||
    cat.includes('pilates')
  ) {
    return 'gyms & fitness';
  }

  // Jewelry Shops
  if (
    cat.includes('jewelry') || 
    cat.includes('jeweller') || 
    cat.includes('gold') || 
    cat.includes('diamond') || 
    cat.includes('silver') ||
    cat.includes('ornament')
  ) {
    return 'jewelry shops';
  }

  // Electronics & Mobile Shops
  if (
    cat.includes('electronic') || 
    cat.includes('mobile') || 
    cat.includes('computer') || 
    cat.includes('phone') || 
    cat.includes('appliance') || 
    cat.includes('gadget') || 
    cat.includes('telecom') || 
    cat.includes('camera') || 
    cat.includes('repair')
  ) {
    return 'electronics shops';
  }

  // Bakeries & Cafes (Run before restaurants to prevent sweet/cafe/bakery overlap)
  if (
    cat.includes('bakery') || 
    cat.includes('baker') || 
    cat.includes('cafe') || 
    cat.includes('coffee') || 
    cat.includes('sweet') || 
    cat.includes('cake') || 
    cat.includes('dessert') ||
    cat.includes('waffle') ||
    cat.includes('patisserie')
  ) {
    return 'bakeries & cafes';
  }

  // Restaurants & Dining
  if (
    cat.includes('restaurant') || 
    cat.includes('food') || 
    cat.includes('dining') || 
    cat.includes('dhaba') || 
    cat.includes('bistro') || 
    cat.includes('pizzeria') || 
    cat.includes('kitchen') || 
    cat.includes('bar') ||
    cat.includes('pub') ||
    cat.includes('lounge') ||
    cat.includes('eatery')
  ) {
    return 'restaurants';
  }

  // Salons & Spas
  if (
    cat.includes('salon') || 
    cat.includes('spa') || 
    cat.includes('parlour') || 
    cat.includes('makeup') || 
    cat.includes('hair') || 
    cat.includes('barber') || 
    cat.includes('beauty') ||
    cat.includes('grooming')
  ) {
    return 'salons';
  }

  // Clinics & Doctors
  if (
    cat.includes('clinic') || 
    cat.includes('hospital') || 
    cat.includes('doctor') || 
    cat.includes('dentist') || 
    cat.includes('medical') || 
    cat.includes('healthcare') || 
    cat.includes('physiotherapy') ||
    cat.includes('diagnostic') ||
    cat.includes('pharmacy')
  ) {
    return 'clinics';
  }

  // Clothing & Fashion Shops
  if (
    cat.includes('clothing') || 
    cat.includes('boutique') || 
    cat.includes('apparel') || 
    cat.includes('fashion') || 
    cat.includes('garment') || 
    cat.includes('wear') || 
    cat.includes('tailor') || 
    cat.includes('dress') || 
    cat.includes('textile') || 
    cat.includes('shoe') || 
    cat.includes('footwear')
  ) {
    return 'clothing shops';
  }

  // Furniture & Decor
  if (
    cat.includes('furniture') || 
    cat.includes('decor') || 
    cat.includes('interior') || 
    cat.includes('mattress') || 
    cat.includes('curtain') || 
    cat.includes('carpet') || 
    cat.includes('lighting') || 
    cat.includes('upholstery') || 
    cat.includes('furnishing') ||
    cat.includes('sofa') ||
    cat.includes('plywood') ||
    cat.includes('hardware')
  ) {
    return 'furniture & decor';
  }

  return 'restaurants'; // Fallback category (uses restaurants template)
}

/**
 * Discover malls, plazas, and commercial markets in a city
 * @param {string} city - The city to search in
 * @param {function} onLog - Callback for real-time progress logging
 * @returns {Promise<Array>} - Array of discovered locations
 */
export async function discoverMalls(city, onLog, checkCancelled) {
  onLog(`[Discoverer] Starting location search for malls/markets in: "${city}"`);
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
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

    const searchQuery = `shopping malls and markets in ${city}`;
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
    onLog(`[Discoverer] Navigating to: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    await delay(5000);

    const feedSelector = 'div[role="feed"], div[role="main"] div[tabindex="0"]';
    
    onLog('[Discoverer] Scrolling listings to load premium locations...');
    let scrollCount = 0;
    const maxScrolls = 6;
    while (scrollCount < maxScrolls) {
      if (checkCancelled && checkCancelled()) {
        onLog('[Discoverer] Cancel signal received. Exiting scroll loop.');
        break;
      }
      const feedExists = await page.$(feedSelector);
      if (!feedExists) {
        await page.evaluate(() => window.scrollBy(0, 800));
      } else {
        await page.evaluate((selector) => {
          const feed = document.querySelector(selector);
          if (feed) {
            feed.scrollBy(0, 1000);
          }
        }, feedSelector);
      }
      await delay(1500);
      scrollCount++;
    }

    if (checkCancelled && checkCancelled()) {
      onLog('[Discoverer] Cancel signal received. Aborting locations details extraction.');
      return [];
    }

    onLog('[Discoverer] Extracting names and addresses of locations...');
    const locations = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/maps/place/"]'));
      
      const items = links.map(a => {
        const name = a.ariaLabel || a.querySelector('.qBF1Pd')?.textContent || '';
        if (!name) return null;

        let address = '';
        let container = a.closest('div[role="article"]') || a.parentElement;
        if (container) {
          const spans = Array.from(container.querySelectorAll('span, div'));
          for (const span of spans) {
            const txt = span.textContent ? span.textContent.trim() : '';
            if (txt && txt !== name && !txt.includes('★') && txt.length > 5 && txt.length < 80 && !txt.includes('Open') && !txt.includes('Closed')) {
              address = txt;
              break;
            }
          }
        }

        return {
          name: name.trim(),
          url: a.href,
          address: address || 'N/A'
        };
      });

      return items.filter(item => item !== null);
    });

    const uniqueLocations = [];
    const nameSet = new Set();
    for (const loc of locations) {
      const normalized = loc.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!nameSet.has(normalized)) {
        nameSet.add(normalized);
        uniqueLocations.push(loc);
      }
    }

    onLog(`[Discoverer] Successfully found ${uniqueLocations.length} locations in ${city}.`);
    return uniqueLocations;

  } catch (error) {
    onLog(`[Discoverer] Error: ${error.message}`);
    console.error('Discover error:', error);
    return [];
  } finally {
    if (browser) {
      await browser.close();
      onLog('[Discoverer] Browser closed.');
    }
  }
}

/**
 * Run Google Maps scraper across single or multiple locations
 * @param {string} category - Business category (e.g. restaurants or 'all shops')
 * @param {string|Array<string>} location - Location string or array of target location names
 * @param {object} options - Configuration and state checkers
 * @param {function} onLog - Callback for real-time progress logging
 * @param {function} onLead - Callback when a lead is successfully saved
 */
export async function runScraper(category, location, options = {}, onLog, onLead) {
  const locationsList = Array.isArray(location) ? location : [location];
  onLog(`[Scraper] Starting scraper session for category "${category}" across ${locationsList.length} locations.`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
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

    let totalSavedAcrossLocations = 0;

    for (let lIndex = 0; lIndex < locationsList.length; lIndex++) {
      const activeLocation = locationsList[lIndex];
      const categoryKeyword = category.toLowerCase().trim() === 'all shops' ? 'shops' : category;
      const searchQuery = `${categoryKeyword} in ${activeLocation}`;
      onLog(`[Scraper] [Location ${lIndex + 1}/${locationsList.length}] Crawling: "${searchQuery}"`);

      if (options.checkCancelled && options.checkCancelled()) {
        onLog('[Scraper] Stop signal received. Aborting remaining locations.');
        break;
      }

      const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
      onLog(`[Scraper] Navigating to: ${searchUrl}`);
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

      onLog('[Scraper] Waiting for search results to load...');
      await delay(5000);

      const feedSelector = 'div[role="feed"], div[role="main"] div[tabindex="0"]';
      
      onLog('[Scraper] Scrolling search results list to load items...');
      let scrollCount = 0;
      const maxScrolls = options.scrollDepth ? Number(options.scrollDepth) : 15;
      let lastListingCount = 0;
      let noChangeCount = 0;

      while (scrollCount < maxScrolls) {
        if (options.checkCancelled && options.checkCancelled()) {
          onLog('[Scraper] Stop signal received. Exiting scroll loop.');
          break;
        }

        // Get current number of listing items in the DOM
        const currentListingCount = await page.evaluate(() => {
          return document.querySelectorAll('a[href*="/maps/place/"]').length;
        });

        if (currentListingCount > 0 && currentListingCount === lastListingCount) {
          noChangeCount++;
          if (noChangeCount >= 3) {
            onLog(`[Scraper] End of list reached (found ${currentListingCount} items). Exiting scroll loop early.`);
            break;
          }
        } else {
          noChangeCount = 0;
          lastListingCount = currentListingCount;
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

      const itemLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="/maps/place/"]'));
        return links.map(a => ({
          url: a.href,
          title: a.ariaLabel || a.querySelector('.qBF1Pd')?.textContent || 'Business'
        }));
      });

      const uniqueItems = [];
      const urls = new Set();
      for (const item of itemLinks) {
        if (!urls.has(item.url)) {
          urls.add(item.url);
          uniqueItems.push(item);
        }
      }

      onLog(`[Scraper] Found ${uniqueItems.length} unique business listings in "${activeLocation}". Inspecting details...`);

      let scrapedCount = 0;
      let savedCount = 0;

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
        onLog(`[Scraper] Inspecting [${scrapedCount}/${uniqueItems.length}] in "${activeLocation}": "${item.title}"`);

        try {
          await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
          await delay(2000);

          const details = await page.evaluate(() => {
            const nameEl = document.querySelector('h1');
            const name = nameEl ? nameEl.textContent.trim() : '';

            // Extract primary category
            const categoryEl = document.querySelector('button[jsaction*="category"], button[data-item-id="category"], [class*="category"]');
            const rawCategory = categoryEl ? categoryEl.textContent.trim() : '';

            const websiteEl = document.querySelector('a[data-item-id="authority"], button[data-item-id="authority"], a[aria-label*="Website"], a[aria-label*="website"]');
            let hasWebsite = !!websiteEl;
            let websiteUrl = websiteEl ? (websiteEl.href || '') : '';

            if (!hasWebsite) {
              const externalLinks = Array.from(document.querySelectorAll('a[href]'));
              for (const link of externalLinks) {
                const href = link.href;
                const isMapsOrGoogle = href.includes('google.com') || href.includes('google.co') || href.includes('gstatic.com') || href.includes('apple.com');
                const isTel = href.startsWith('tel:');
                const isSocial = href.includes('facebook.com') || href.includes('instagram.com') || href.includes('youtube.com') || href.includes('twitter.com');
                
                if (href && !isMapsOrGoogle && !isTel && !isSocial && href.startsWith('http')) {
                  hasWebsite = true;
                  websiteUrl = href;
                  break;
                }
              }
            }

            let phone = '';
            const telLink = document.querySelector('a[href^="tel:"]');
            if (telLink) {
              phone = telLink.href.replace('tel:', '').trim();
            } else {
              const buttons = Array.from(document.querySelectorAll('button[data-item-id^="phone:tel:"]'));
              if (buttons.length > 0) {
                const dataId = buttons[0].getAttribute('data-item-id');
                phone = dataId.replace('phone:tel:', '').trim();
              } else {
                const divs = Array.from(document.querySelectorAll('div, button'));
                for (const div of divs) {
                  const text = div.textContent ? div.textContent.trim() : '';
                  const phoneMatch = text.match(/(?:\+91|0)?[6-9]\d{4}\s?\d{5}/);
                  if (phoneMatch) {
                    phone = phoneMatch[0];
                    break;
                  }
                }
              }
            }

            return { name, hasWebsite, websiteUrl, phone, rawCategory };
          });

          if (details.hasWebsite && details.websiteUrl) {
            try {
              onLog(`[Scraper] 🔍 Checking website status for "${details.name || item.title}": ${details.websiteUrl}`);
              const controller = new AbortController();
              const timeoutId = setTimeout(() => {
                try { controller.abort(); } catch(e){}
              }, 4000);
              
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
              } else if (!response.ok && response.status === 404) {
                onLog(`[Scraper] ⚠️ Website responded with 404 (Not Found). Treating as broken.`);
                details.hasWebsite = false;
                details.notes = `Broken website (404): ${details.websiteUrl}`;
              } else if (!response.ok) {
                onLog(`[Scraper] ℹ️ Website check responded with code ${response.status}. Skipping lead since website is listed.`);
              }
            } catch (err) {
              onLog(`[Scraper] ℹ️ Website check connection failed (${err.message}). Skipping lead since website is listed.`);
              details.notes = `Website check connection failed: ${details.websiteUrl}`;
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

          if (existingPhoneSet.has(digits)) {
            onLog(`[Scraper] ℹ️ Duplicate: "${details.name || item.title}" phone already exists in contacts list.`);
            continue;
          }

          // Classify the category dynamically if targeting "all shops"
          const finalCategory = category.toLowerCase().trim() === 'all shops'
            ? classifyCategory(details.rawCategory)
            : category.toLowerCase().trim();

          const leadData = {
            id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: (details.name || item.title).trim(),
            phone: digits,
            category: finalCategory,
            location: activeLocation ? activeLocation.trim() : 'Gurugram',
            url: item.url || '',
            status: 'Pending',
            notes: details.notes || (details.rawCategory ? `Category: ${details.rawCategory}` : ''),
            lastSentDate: null,
            createdAt: new Date().toISOString()
          };

          savedCount++;
          totalSavedAcrossLocations++;
          onLog(`[Scraper]  Lead Found: "${leadData.name}" | Classified As: ${leadData.category} | Phone: ${leadData.phone}`);
          onLead(leadData);

        } catch (err) {
          onLog(`[Scraper] Error loading details for "${item.title}": ${err.message}`);
        }
      }
      onLog(`[Scraper] Finished location crawl: "${activeLocation}". Processed ${scrapedCount} listings. Saved ${savedCount} new leads.`);
    }

    onLog(`[Scraper] Scraping session completed. Saved ${totalSavedAcrossLocations} total leads across all target locations.`);

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
