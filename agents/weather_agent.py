#!/usr/bin/env python3
"""
Weather Agent
Handles terrestrial weather (Open-Meteo) and space weather (NOAA SWPC)
"""

import requests
from typing import Dict, Optional, Any
from base_agent import BaseAgent


class WeatherAgent(BaseAgent):
    """Agent for fetching terrestrial and space weather data."""
    
    # San Juan, Puerto Rico coordinates
    SAN_JUAN_LAT = 18.4655
    SAN_JUAN_LON = -66.1057
    
    # API endpoints (no authentication required)
    OPEN_METEO_API = "https://api.open-meteo.com/v1/forecast"
    SWPC_ALERTS_API = "https://services.swpc.noaa.gov/products/alerts.json"
    SWPC_KP_API = "https://services.swpc.noaa.gov/json/planetary_k_index_1m.json"
    
    def __init__(self):
        super().__init__("Weather")
        self.timeout = 15  # seconds
    
    def fetch(self) -> Optional[Dict[str, Any]]:
        """
        Fetch both terrestrial and space weather data.
        
        Returns:
            Dict containing weather and space weather data
        """
        result = {
            "terrestrial": None,
            "space": None
        }
        
        # Fetch terrestrial weather
        result["terrestrial"] = self._fetch_terrestrial_weather()
        
        # Fetch space weather
        result["space"] = self._fetch_space_weather()
        
        # Return partial data if at least one succeeded
        # Only return None if both are None AND this is critical
        # For weather, we can proceed with partial data
        return result
    
    def _fetch_terrestrial_weather(self) -> Optional[Dict[str, Any]]:
        """Fetch weather from Open-Meteo API."""
        try:
            params = {
                'latitude': self.SAN_JUAN_LAT,
                'longitude': self.SAN_JUAN_LON,
                'current': 'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m',
                'daily': 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum',
                'temperature_unit': 'fahrenheit',
                'wind_speed_unit': 'mph',
                'precipitation_unit': 'inch',
                'timezone': 'America/Puerto_Rico',
                'forecast_days': 3
            }
            
            response = requests.get(
                self.OPEN_METEO_API,
                params=params,
                timeout=self.timeout,
                headers={'User-Agent': 'cywf-daily-brief'}
            )
            response.raise_for_status()
            
            data = response.json()
            
            # Extract current weather
            current = data.get('current', {})
            daily = data.get('daily', {})
            
            return {
                'location': 'San Juan, Puerto Rico',
                'temperature': round(current.get('temperature_2m', 0)),
                'humidity': current.get('relative_humidity_2m', 0),
                'wind_speed': round(current.get('wind_speed_10m', 0)),
                'precipitation': current.get('precipitation', 0),
                'weather_code': current.get('weather_code', 0),
                'forecast': {
                    'high': round(daily.get('temperature_2m_max', [0])[0]) if daily.get('temperature_2m_max') else 0,
                    'low': round(daily.get('temperature_2m_min', [0])[0]) if daily.get('temperature_2m_min') else 0,
                    'precipitation': daily.get('precipitation_sum', [0])[0] if daily.get('precipitation_sum') else 0
                }
            }
            
        except Exception as e:
            self.logger.warning(f"Failed to fetch terrestrial weather: {e}")
            return None
    
    def _fetch_space_weather(self) -> Optional[Dict[str, Any]]:
        """Fetch space weather from NOAA SWPC."""
        space_data = {
            'kp_index': None,
            'alerts': []
        }
        
        # Fetch KP index
        try:
            response = requests.get(
                self.SWPC_KP_API,
                timeout=self.timeout,
                headers={'User-Agent': 'cywf-daily-brief'}
            )
            response.raise_for_status()
            data = response.json()
            
            if data and len(data) > 0:
                latest = data[-1]
                kp_value = float(latest.get('kp_index', latest.get('Kp', 0)))
                space_data['kp_index'] = round(kp_value, 1)
        except Exception as e:
            self.logger.debug(f"Failed to fetch KP index: {e}")
        
        # Fetch alerts
        try:
            response = requests.get(
                self.SWPC_ALERTS_API,
                timeout=self.timeout,
                headers={'User-Agent': 'cywf-daily-brief'}
            )
            response.raise_for_status()
            alerts = response.json()
            
            # Get most recent 3 alerts
            if alerts:
                space_data['alerts'] = alerts[-3:]
        except Exception as e:
            self.logger.debug(f"Failed to fetch space weather alerts: {e}")
        
        # Return None if we got nothing
        if space_data['kp_index'] is None and not space_data['alerts']:
            return None
        
        return space_data
    
    def _get_weather_emoji(self, code: int) -> str:
        """Get emoji for WMO weather code."""
        # WMO Weather interpretation codes
        if code == 0:
            return "☀️"
        elif code in [1, 2, 3]:
            return "⛅"
        elif code in [45, 48]:
            return "🌫️"
        elif code in [51, 53, 55, 56, 57]:
            return "🌧️"
        elif code in [61, 63, 65, 66, 67]:
            return "🌧️"
        elif code in [71, 73, 75, 77]:
            return "🌨️"
        elif code in [80, 81, 82]:
            return "🌧️"
        elif code in [85, 86]:
            return "🌨️"
        elif code in [95, 96, 99]:
            return "⛈️"
        else:
            return "🌤️"
    
    def render(self, data: Dict[str, Any]) -> str:
        """
        Render weather data as Markdown.
        
        Args:
            data: Dict containing terrestrial and space weather data
            
        Returns:
            Markdown formatted weather report
        """
        markdown = ""
        
        # Terrestrial Weather Section
        if data.get('terrestrial'):
            weather = data['terrestrial']
            emoji = self._get_weather_emoji(weather.get('weather_code', 0))
            
            markdown += "## 🌤️ Weather Report\n\n"
            markdown += f"**Location:** {weather['location']}\n\n"
            markdown += f"{emoji} **Current Conditions:**\n"
            markdown += f"- Temperature: {weather['temperature']}°F\n"
            markdown += f"- Humidity: {weather['humidity']}%\n"
            markdown += f"- Wind Speed: {weather['wind_speed']} mph\n"
            
            if weather.get('forecast'):
                forecast = weather['forecast']
                markdown += f"\n**Today's Forecast:**\n"
                markdown += f"- High: {forecast['high']}°F / Low: {forecast['low']}°F\n"
                if forecast['precipitation'] > 0:
                    markdown += f"- Precipitation: {forecast['precipitation']} in\n"
        else:
            markdown += "## 🌤️ Weather Report\n\n"
            markdown += "**Weather data unavailable** ⛔\n"
        
        # Space Weather Section
        markdown += "\n---\n\n"
        
        if data.get('space'):
            space = data['space']
            markdown += "## 🌌 Space Weather Status\n\n"
            
            if space.get('kp_index') is not None:
                kp = space['kp_index']
                if kp < 4:
                    status = "🟢 Quiet"
                elif kp < 6:
                    status = "🟡 Unsettled"
                else:
                    status = "🔴 Storm Conditions"
                markdown += f"**KP Index:** {kp} ({status})\n\n"
            else:
                markdown += "**KP Index:** Data unavailable\n\n"
            
            if space.get('alerts'):
                markdown += "**Recent Alerts:**\n"
                for alert in space['alerts'][:3]:
                    msg = alert.get('message', 'No message')
                    # Truncate long messages
                    if len(msg) > 100:
                        msg = msg[:97] + "..."
                    markdown += f"- {msg}\n"
            else:
                markdown += "**Recent Alerts:** No active alerts ✅\n"
        else:
            markdown += "## 🌌 Space Weather Status\n\n"
            markdown += "**Space weather data unavailable** ⛔\n"
        
        return markdown


def main():
    """Test the WeatherAgent independently."""
    agent = WeatherAgent()
    success = agent.run()
    
    if success:
        print("✅ WeatherAgent completed successfully")
        output_file = agent.output_dir / "weather.md"
        print("\n" + output_file.read_text())
    else:
        print("❌ WeatherAgent failed")
        return 1
    
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())
