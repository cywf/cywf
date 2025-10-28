#!/usr/bin/env python3
"""
CyberPulse Agent
Compiles top cybersecurity headlines with favicons
"""

import requests
import xml.etree.ElementTree as ET
from typing import List, Dict, Optional, Any
from datetime import datetime
from base_agent import BaseAgent


class CyberPulseAgent(BaseAgent):
    """Agent for fetching cybersecurity news."""
    
    # Cybersecurity news sources
    CYBER_FEEDS = [
        {
            'name': 'BleepingComputer',
            'url': 'https://www.bleepingcomputer.com/feed/',
            'favicon': 'https://www.bleepingcomputer.com/favicon.ico',
            'type': 'rss'
        },
        {
            'name': 'KrebsOnSecurity',
            'url': 'https://krebsonsecurity.com/feed/',
            'favicon': 'https://krebsonsecurity.com/favicon.ico',
            'type': 'rss'
        },
        {
            'name': 'The Hacker News',
            'url': 'https://feeds.feedburner.com/TheHackersNews',
            'favicon': 'https://thehackernews.com/favicon.ico',
            'type': 'rss'
        }
    ]
    
    def __init__(self):
        super().__init__("CyberPulse")
        self.timeout = 15  # seconds
        self.max_headlines = 3
    
    def fetch(self) -> Optional[List[Dict[str, Any]]]:
        """
        Fetch top cybersecurity headlines.
        
        Returns:
            List of headlines with title, link, description, and favicon
        """
        all_headlines = []
        
        for feed in self.CYBER_FEEDS:
            try:
                headlines = self._fetch_feed(feed)
                if headlines:
                    all_headlines.extend(headlines)
                    self.logger.info(f"Fetched {len(headlines)} headlines from {feed['name']}")
            except Exception as e:
                self.logger.warning(f"Failed to fetch from {feed['name']}: {e}")
                continue
        
        if not all_headlines:
            self.logger.error("Failed to fetch any cybersecurity headlines")
            return None
        
        # Sort by date (most recent first) and take top headlines
        all_headlines.sort(key=lambda x: x.get('date', datetime.min), reverse=True)
        return all_headlines[:self.max_headlines]
    
    def _fetch_feed(self, feed: Dict[str, str]) -> List[Dict[str, Any]]:
        """
        Fetch and parse a cybersecurity RSS feed.
        
        Args:
            feed: Dict with feed configuration
            
        Returns:
            List of parsed headlines
        """
        try:
            response = requests.get(
                feed['url'],
                timeout=self.timeout,
                headers={'User-Agent': 'cywf-daily-brief'}
            )
            response.raise_for_status()
            
            headlines = self._parse_rss(response.text, feed['name'], feed.get('favicon'))
            return headlines
            
        except requests.exceptions.RequestException as e:
            self.logger.debug(f"Request failed for {feed['name']}: {e}")
            raise
    
    def _parse_rss(self, xml_content: str, source: str, favicon: Optional[str]) -> List[Dict[str, Any]]:
        """Parse RSS XML content."""
        headlines = []
        
        try:
            root = ET.fromstring(xml_content)
            items = root.findall('.//item')
            
            for item in items[:5]:  # Limit to 5 items per feed
                headline = self._parse_item(item, source, favicon)
                if headline:
                    headlines.append(headline)
        
        except ET.ParseError as e:
            self.logger.warning(f"XML parsing error for {source}: {e}")
        
        return headlines
    
    def _parse_item(self, item: ET.Element, source: str, favicon: Optional[str]) -> Optional[Dict[str, Any]]:
        """Parse a single RSS item."""
        try:
            title = self._get_text(item, 'title')
            link = self._get_text(item, 'link')
            description = self._get_text(item, 'description')
            pub_date = self._get_text(item, 'pubDate')
            
            if not title or not link:
                return None
            
            # Clean description
            if description:
                description = self._clean_html(description)[:250]
            else:
                description = "No description available"
            
            # Parse date
            date = self._parse_date(pub_date) if pub_date else datetime.now()
            
            return {
                'title': title.strip(),
                'link': link.strip(),
                'description': description.strip(),
                'source': source,
                'favicon': favicon,
                'date': date
            }
        
        except Exception as e:
            self.logger.debug(f"Error parsing item: {e}")
            return None
    
    def _get_text(self, element: ET.Element, tag: str) -> str:
        """Safely get text from XML element."""
        child = element.find(tag)
        if child is not None and child.text:
            return child.text
        return ""
    
    def _clean_html(self, text: str) -> str:
        """Remove HTML tags from text."""
        import re
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', '', text)
        # Remove CDATA markers
        text = re.sub(r'<!\[CDATA\[|\]\]>', '', text)
        # Remove extra whitespace
        text = ' '.join(text.split())
        return text
    
    def _parse_date(self, date_str: str) -> datetime:
        """Parse date string to datetime object."""
        formats = [
            '%a, %d %b %Y %H:%M:%S %z',
            '%a, %d %b %Y %H:%M:%S %Z',
            '%Y-%m-%dT%H:%M:%S%z',
            '%Y-%m-%dT%H:%M:%SZ',
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        
        return datetime.now()
    
    def render(self, data: List[Dict[str, Any]]) -> str:
        """
        Render cybersecurity headlines as Markdown.
        
        Args:
            data: List of cyber headlines
            
        Returns:
            Markdown formatted cyber pulse report
        """
        if not data:
            return "**No cybersecurity headlines available** ⛔\n"
        
        markdown = "## 🔐 Cyber Pulse Report\n\n"
        
        for i, headline in enumerate(data, 1):
            # Add favicon if available
            if headline.get('favicon'):
                markdown += f"![icon]({headline['favicon']}) "
            
            # Add title and link
            markdown += f"**[{headline['title']}]({headline['link']})**\n\n"
            
            # Add source
            markdown += f"_Source: {headline['source']}_\n\n"
            
            # Create digest with who/what/when/where/why structure
            description = headline['description']
            
            # Format the digest
            markdown += f"{description}\n\n"
            
            # Add date
            date_str = headline['date'].strftime('%B %d, %Y')
            markdown += f"📅 {date_str}\n\n"
            
            if i < len(data):
                markdown += "---\n\n"
        
        return markdown


def main():
    """Test the CyberPulseAgent independently."""
    agent = CyberPulseAgent()
    success = agent.run()
    
    if success:
        print("✅ CyberPulseAgent completed successfully")
        output_file = agent.output_dir / "cyberpulse.md"
        print("\n" + output_file.read_text())
    else:
        print("❌ CyberPulseAgent failed")
        return 1
    
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())
