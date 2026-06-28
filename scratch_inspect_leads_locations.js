import fs from 'fs';
import readline from 'readline';

async function parseLogs() {
  const filePath = 'C:\\Users\\aashu\\.gemini\\antigravity-ide\\brain\\8157f7e2-6c8d-451c-9dc3-fa2362d18823\\.system_generated\\logs\\transcript_full.jsonl';
  
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  console.log("Printing all USER_INPUT steps in the transcript...");

  for await (const line of rl) {
    try {
      const cleanLine = JSON.parse(line);
      if (cleanLine.type === 'USER_INPUT') {
        console.log(`\nStep ${cleanLine.step_index} | User: ${cleanLine.content}`);
      }
    } catch (e) {}
  }
}

parseLogs();
