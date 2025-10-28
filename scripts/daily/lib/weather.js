#!/usr/bin/env node

/**
 * Weather Data Fetcher
 * Fetches current weather and forecast data from OpenWeatherMap API
 */

const https = require('https');

const OPENWEATHER_API_URL = 'api.openweathermap.org';
const DEFAULT_LOCATION = {
  city: 'San Juan',
  country: 'PR',
  lat: 18.4655,
  lon: -66.1057
};

/**
 * Make HTTPS GET request with retry logic
 */
function httpsGet(url, retries = 3) {
  return new Promise((resolve, reject) => {
    const attempt = (retriesLeft) => {
      https.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else if (retriesLeft > 0) {
            console.log(`Retrying weather fetch... (${retriesLeft} retries left)`);
            setTimeout(() => attempt(retriesLeft - 1), 2000);
          } else {
            reject(new Error(`API returned status ${res.statusCode}`));
          }
        });
      }).on('error', (err) => {
        if (retriesLeft > 0) {
          console.log(`Retrying weather fetch... (${retriesLeft} retries left)`);
          setTimeout(() => attempt(retriesLeft - 1), 2000);
        } else {
          reject(err);
        }
      });
    };
    
    attempt(retries);
  });
}

/**
 * Fetch current weather data
 */
async function fetchCurrentWeather(apiKey) {
  if (!apiKey) {
    console.warn('⚠️  OpenWeather API key not provided');
    return null;
  }
  
  try {
    const url = `https://${OPENWEATHER_API_URL}/data/2.5/weather?lat=${DEFAULT_LOCATION.lat}&lon=${DEFAULT_LOCATION.lon}&appid=${apiKey}&units=imperial`;
    const data = await httpsGet(url);
    
    return {
      location: `${data.name}, ${data.sys.country}`,
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: Math.round(data.wind.speed),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      clouds: data.clouds.all
    };
  } catch (error) {
    console.error('Error fetching weather:', error.message);
    return null;
  }
}

/**
 * Fetch weather forecast
 */
async function fetchForecast(apiKey) {
  if (!apiKey) {
    return null;
  }
  
  try {
    const url = `https://${OPENWEATHER_API_URL}/data/2.5/forecast?lat=${DEFAULT_LOCATION.lat}&lon=${DEFAULT_LOCATION.lon}&appid=${apiKey}&units=imperial`;
    const data = await httpsGet(url);
    
    // Get next 3 days forecast (one per day at noon)
    const forecast = data.list
      .filter((item, index) => index % 8 === 4) // Roughly noon each day
      .slice(0, 3)
      .map(item => ({
        date: new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        temp: Math.round(item.main.temp),
        description: item.weather[0].description,
        icon: item.weather[0].icon
      }));
    
    return forecast;
  } catch (error) {
    console.error('Error fetching forecast:', error.message);
    return null;
  }
}

/**
 * Format weather data as markdown
 */
function formatWeatherMarkdown(current, forecast) {
  if (!current) {
    return '**Weather data unavailable** ⛔';
  }
  
  let md = `### 🌤️ Current Weather\n\n`;
  md += `**${current.location}**\n\n`;
  md += `- 🌡️ Temperature: ${current.temperature}°F (Feels like ${current.feelsLike}°F)\n`;
  md += `- 📝 Conditions: ${current.description}\n`;
  md += `- 💧 Humidity: ${current.humidity}%\n`;
  md += `- 💨 Wind Speed: ${current.windSpeed} mph\n`;
  md += `- ☁️ Cloud Cover: ${current.clouds}%\n\n`;
  
  if (forecast && forecast.length > 0) {
    md += `### 📅 3-Day Forecast\n\n`;
    md += `| Day | Temp | Conditions |\n`;
    md += `|-----|------|------------|\n`;
    forecast.forEach(day => {
      md += `| ${day.date} | ${day.temp}°F | ${day.description} |\n`;
    });
  }
  
  return md;
}

module.exports = {
  fetchCurrentWeather,
  fetchForecast,
  formatWeatherMarkdown
};

// CLI test
if (require.main === module) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  Promise.all([
    fetchCurrentWeather(apiKey),
    fetchForecast(apiKey)
  ]).then(([current, forecast]) => {
    console.log(formatWeatherMarkdown(current, forecast));
  });
}
