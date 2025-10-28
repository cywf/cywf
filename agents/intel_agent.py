#!/usr/bin/env python3
"""
Intel Agent
Produces the Global Intelligence Report from RSS/JSON news feeds
"""

import requests
import xml.etree.ElementTree as ET
from typing import List, Dict, Optional, Any
from datetime import datetime
from base_agent import BaseAgent


class IntelAgent(BaseAgent):
    """Agent for fetching global intelligence news."""
    
    # RSS feed sources (no authentication required)
    NEWS_FEEDS = [
        {
            'name': 'Reuters World',
            'url': 'https://feeds.reuters.com/reuters/worldNews',
            'type': 'rss'
        },
        {
            'name': 'AP World News',
            'url': 'https://feeds.apnews.com/rss/apf-topnews',
            'type': 'rss'
        },
        {
            'name': 'BBC News',
            'url': 'https://feeds.bbci.co.uk/news/world/rss.xml',
            'type': 'rss'
        }
    ]
    
    def __init__(self):
        super().__init__("Intel")
        self.timeout = 15  # seconds
        self.max_stories = 3
    
    def fetch(self) -> Optional[List[Dict[str, Any]]]:
        """
        Fetch top news stories from RSS feeds.
        
        Returns:
            List of news stories with title, link, and description
        """
        all_stories = []
        
        for feed in self.NEWS_FEEDS:
            try:
                stories = self._fetch_feed(feed)
                if stories:
                    all_stories.extend(stories)
                    self.logger.info(f"Fetched {len(stories)} stories from {feed['name']}")
            except Exception as e:
                self.logger.warning(f"Failed to fetch from {feed['name']}: {e}")
                continue
        
        if not all_stories:
            self.logger.error("Failed to fetch any news stories")
            return None
        
        # Sort by date (most recent first) and take top stories
        all_stories.sort(key=lambda x: x.get('date', datetime.min), reverse=True)
        return all_stories[:self.max_stories]
    
    def _fetch_feed(self, feed: Dict[str, str]) -> List[Dict[str, Any]]:
        """
        Fetch and parse an RSS feed.
        
        Args:
            feed: Dict with feed name, url, and type
            
        Returns:
            List of parsed news stories
        """
        try:
            response = requests.get(
                feed['url'],
                timeout=self.timeout,
                headers={'User-Agent': 'cywf-daily-brief'}
            )
            response.raise_for_status()
            
            return self._parse_rss(response.text, feed['name'])
            
        except requests.exceptions.RequestException as e:
            self.logger.debug(f"Request failed for {feed['name']}: {e}")
            raise
    
    def _parse_rss(self, xml_content: str, source: str) -> List[Dict[str, Any]]:
        """
        Parse RSS XML content.
        
        Args:
            xml_content: RSS XML string
            source: Source name for attribution
            
        Returns:
            List of parsed stories
        """
        stories = []
        
        try:
            root = ET.fromstring(xml_content)
            
            # Handle both RSS 2.0 and Atom feeds
            items = root.findall('.//item') or root.findall('.//{http://www.w3.org/2005/Atom}entry')
            
            for item in items[:10]:  # Limit to 10 items per feed
                story = self._parse_item(item, source)
                if story:
                    stories.append(story)
        
        except ET.ParseError as e:
            self.logger.warning(f"XML parsing error for {source}: {e}")
        
        return stories
    
    def _parse_item(self, item: ET.Element, source: str) -> Optional[Dict[str, Any]]:
        """Parse a single RSS item/entry."""
        try:
            # Try RSS 2.0 format first
            title = self._get_text(item, 'title')
            link = self._get_text(item, 'link')
            description = self._get_text(item, 'description')
            pub_date = self._get_text(item, 'pubDate')
            
            # Try Atom format if RSS failed
            if not title:
                title = self._get_text(item, '{http://www.w3.org/2005/Atom}title')
            if not link:
                link_elem = item.find('{http://www.w3.org/2005/Atom}link')
                if link_elem is not None:
                    link = link_elem.get('href', '')
            if not description:
                description = self._get_text(item, '{http://www.w3.org/2005/Atom}summary')
            if not pub_date:
                pub_date = self._get_text(item, '{http://www.w3.org/2005/Atom}updated')
            
            if not title or not link:
                return None
            
            # Clean description
            if description:
                # Remove HTML tags and truncate
                description = self._clean_html(description)[:300]
            else:
                description = "No description available"
            
            # Parse date
            date = self._parse_date(pub_date) if pub_date else datetime.now()
            
            return {
                'title': title.strip(),
                'link': link.strip(),
                'description': description.strip(),
                'source': source,
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
        # Try common date formats
        formats = [
            '%a, %d %b %Y %H:%M:%S %z',  # RFC 2822
            '%a, %d %b %Y %H:%M:%S %Z',
            '%Y-%m-%dT%H:%M:%S%z',       # ISO 8601
            '%Y-%m-%dT%H:%M:%SZ',
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        
        # If all fail, return current time
        return datetime.now()
    
    def render(self, data: List[Dict[str, Any]]) -> str:
        """
        Render news stories as Markdown.
        
        Args:
            data: List of news stories
            
        Returns:
            Markdown formatted intelligence report
        """
        if not data:
            return "**No news stories available** ⛔\n"
        
        markdown = "## 📰 Global Intelligence Report\n\n"
        
        for i, story in enumerate(data, 1):
            markdown += f"### {i}. [{story['title']}]({story['link']})\n\n"
            markdown += f"**Source:** {story['source']}\n\n"
            
            # Create digest (first 2-3 sentences or 200 chars)
            description = story['description']
            sentences = description.split('. ')
            digest = '. '.join(sentences[:3])
            if len(digest) < len(description):
                digest += '...'
            
            markdown += f"{digest}\n\n"
            
            # Add formatted date
            date_str = story['date'].strftime('%B %d, %Y at %H:%M UTC')
            markdown += f"*Published: {date_str}*\n\n"
            
            if i < len(data):
                markdown += "---\n\n"
        
        return markdown


def main():
    """Test the IntelAgent independently."""
    agent = IntelAgent()
    success = agent.run()
    
    if success:
        print("✅ IntelAgent completed successfully")
        output_file = agent.output_dir / "intel.md"
        print("\n" + output_file.read_text())
    else:
        print("❌ IntelAgent failed")
        return 1
    
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())
