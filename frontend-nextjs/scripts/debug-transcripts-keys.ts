import 'dotenv/config';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load env
const loadEnv = (filename: string) => {
  const envPath = path.join(process.cwd(), filename);
  if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
      process.env[k] = envConfig[k];
    }
  }
};
loadEnv('.env');

const METABASE_URL = process.env.METABASE_URL || 'http://metabase.fsgo365.cn:3000';
const METABASE_USERNAME = process.env.METABASE_USERNAME;
const METABASE_PASSWORD = process.env.METABASE_PASSWORD;

async function checkTranscripts() {
  try {
    // Login
    const loginResp = await axios.post(`${METABASE_URL}/api/session`, {
      username: METABASE_USERNAME,
      password: METABASE_PASSWORD
    }, { proxy: false });
    const token = loginResp.data.id;

    // Fetch 1 row from Transcripts (1938)
    console.log('Fetching 1 row from Transcripts...');
    const resp = await axios.post(
      `${METABASE_URL}/api/card/1938/query/json`,
      { parameters: [] },
      { 
        headers: { 'X-Metabase-Session': token },
        proxy: false,
        params: { limit: 1 } // Try to limit if possible, though Metabase JSON query endpoint might ignoring params in body sometimes
      }
    );

    const data = resp.data;
    if (Array.isArray(data) && data.length > 0) {
        const row = data[0];
        console.log('Transcripts Row Keys:', Object.keys(row));
        console.log('Content type:', typeof row.content);
        console.log('Content length:', row.content ? row.content.length : 0);
        if (row.content) {
            console.log('Content start:', String(row.content).substring(0, 50));
        }
    } else {
        console.log('No data returned');
    }

  } catch (e) {
    console.error(e);
  }
}

checkTranscripts();
