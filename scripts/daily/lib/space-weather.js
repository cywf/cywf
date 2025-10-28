#!/usr/bin/env node

/**
 * Space Weather Data Fetcher
 * Fetches space weather alerts and KP index from NOAA SWPC
 */

const https = require('https');

const SWPC_ALERTS_URL = 'https://services.swpc.noaa.gov/products/alerts.json';
const SWPC_KP_URL = 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json';

/**
 * Fetch JSON data from HTTPS URL
 */
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          reject(new Error(`API returned status ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Map severity to emoji
 */
function getSeverityEmoji(severity) {
  const severityUpper = (severity || '').toUpperCase();
  if (severityUpper.includes('EXTREME') || severityUpper.includes('SEVERE')) return '🔴';
  if (severityUpper.includes('STRONG') || severityUpper.includes('MODERATE')) return '🟡';
  return '🟢';
}

/**
 * Fetch space weather alerts
 */
async function fetchSpaceWeatherAlerts() {
  try {
    const alerts = await fetchJSON(SWPC_ALERTS_URL);
    
    // Get most recent alerts (last 3)
    return alerts.slice(-3).map(alert => ({
      message: alert.message || alert.issue_datetime || 'No message',
      type: alert.product_id || 'ALERT',
      time: alert.issue_datetime || new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error fetching space weather alerts:', error.message);
    return null;
  }
}

/**
 * Fetch KP index forecast
 */
async function fetchKpIndex() {
  try {
    const data = await fetchJSON(SWPC_KP_URL);
    
    // Skip header row and get latest forecast
    if (data && data.length > 1) {
      const latest = data[data.length - 1];
      const kpValue = parseFloat(latest[1]);
      const observedTime = latest[0];
      
      let condition = 'Quiet';
      let emoji = '🟢';
      
      if (kpValue >= 5) {
        condition = 'Storm';
        emoji = '🔴';
      } else if (kpValue >= 4) {
        condition = 'Active';
        emoji = '🟡';
      }
      
      return {
        value: kpValue,
        condition,
        emoji,
        time: observedTime
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching KP index:', error.message);
    return null;
  }
}

/**
 * Format space weather data as markdown
 */
function formatSpaceWeatherMarkdown(alerts, kpIndex) {
  let md = `### 🌌 Space Weather Status\n\n`;
  
  if (kpIndex) {
    md += `**KP Index:** ${kpIndex.emoji} ${kpIndex.value} (${kpIndex.condition})\n\n`;
  } else {
    md += `**KP Index:** Data unavailable\n\n`;
  }
  
  if (alerts && alerts.length > 0) {
    md += `**Recent Alerts:**\n\n`;
    alerts.forEach((alert, index) => {
      const shortMsg = alert.message.split('\n')[0].substring(0, 100);
      md += `${index + 1}. ${shortMsg}...\n`;
    });
  } else {
    md += `**Recent Alerts:** No active alerts ✅\n`;
  }
  
  return md;
}

module.exports = {
  fetchSpaceWeatherAlerts,
  fetchKpIndex,
  formatSpaceWeatherMarkdown
};

// CLI test
if (require.main === module) {
  Promise.all([
    fetchSpaceWeatherAlerts(),
    fetchKpIndex()
  ]).then(([alerts, kpIndex]) => {
    console.log(formatSpaceWeatherMarkdown(alerts, kpIndex));
  });
}
