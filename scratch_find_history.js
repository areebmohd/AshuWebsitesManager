import fs from 'fs';
import readline from 'readline';

async function parseLogs() {
  const filePath = 'C:\\Users\\aashu\\.gemini\\antigravity-ide\\brain\\8157f7e2-6c8d-451c-9dc3-fa2362d18823\\.system_generated\\logs\\transcript_full.jsonl';
  
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  console.log("Searching transcript for any occurrences of ashu_premium_history...");

  let lineCount = 0;
  for await (const line of rl) {
    lineCount++;
    if (line.includes('ashu_premium_history')) {
      console.log(`\nLine ${lineCount} contains ashu_premium_history:`);
      // Search for JSON parts in the line
      let idx = 0;
      while (true) {
        const foundIdx = line.indexOf('ashu_premium_history', idx);
        if (foundIdx === -1) break;
        console.log(`- Snippet at index ${foundIdx}:`, line.substring(Math.max(0, foundIdx - 100), Math.min(line.length, foundIdx + 300)));
        idx = foundIdx + 1;
      }
    }
  }
}

parseLogs();
