import { runScraper } from './scraper.js';

async function test() {
  console.log('--- STARTING SCRAPER TEST ---');
  
  // We search for a very narrow term in Gurugram to test quickly
  const category = 'salons';
  const location = 'Sector 14 Gurugram';
  
  await runScraper(
    category,
    location,
    (msg) => console.log(msg),
    (lead) => console.log('✅ TEST LEAD SCRAPED:', lead.name, lead.phone)
  );
  
  console.log('--- SCRAPER TEST FINISHED ---');
  process.exit(0);
}

test();
