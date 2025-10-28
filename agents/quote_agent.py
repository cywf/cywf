#!/usr/bin/env python3
"""
Quote Agent
Fetches the Quote of the Day from ZenQuotes API or quotable.io
"""

import requests
from typing import Dict, Optional
from base_agent import BaseAgent


class QuoteAgent(BaseAgent):
    """Agent for fetching daily inspirational quotes."""
    
    # API endpoints (no authentication required)
    ZENQUOTES_API = "https://zenquotes.io/api/today"
    QUOTABLE_API = "https://api.quotable.io/random"
    
    # Fallback quotes for when APIs fail
    FALLBACK_QUOTES = [
        {"text": "The only way to do great work is to love what you do.", "author": "Steve Jobs"},
        {"text": "Innovation distinguishes between a leader and a follower.", "author": "Steve Jobs"},
        {"text": "Stay hungry, stay foolish.", "author": "Steve Jobs"},
        {"text": "The best way to predict the future is to invent it.", "author": "Alan Kay"},
        {"text": "Code is like humor. When you have to explain it, it's bad.", "author": "Cory House"},
        {"text": "First, solve the problem. Then, write the code.", "author": "John Johnson"},
        {"text": "Experience is the name everyone gives to their mistakes.", "author": "Oscar Wilde"},
        {"text": "Knowledge is power.", "author": "Francis Bacon"},
        {"text": "In order to be irreplaceable, one must always be different.", "author": "Coco Chanel"},
        {"text": "The only impossible journey is the one you never begin.", "author": "Tony Robbins"}
    ]
    
    def __init__(self):
        super().__init__("Quote")
        self.timeout = 10  # seconds
    
    def fetch(self) -> Optional[Dict[str, str]]:
        """
        Fetch quote from ZenQuotes API with fallback to quotable.io
        
        Returns:
            Dict with 'text' and 'author' keys, or None on total failure
        """
        # Try ZenQuotes first
        quote = self._fetch_zenquotes()
        if quote:
            return quote
        
        # Fallback to quotable.io
        self.logger.info("ZenQuotes failed, trying quotable.io...")
        quote = self._fetch_quotable()
        if quote:
            return quote
        
        # Use daily fallback quote
        self.logger.warning("All quote APIs failed, using fallback")
        return self._get_fallback_quote()
    
    def _fetch_zenquotes(self) -> Optional[Dict[str, str]]:
        """Fetch from ZenQuotes API."""
        try:
            response = requests.get(
                self.ZENQUOTES_API,
                timeout=self.timeout,
                headers={'User-Agent': 'cywf-daily-brief'}
            )
            response.raise_for_status()
            
            data = response.json()
            if data and len(data) > 0:
                return {
                    "text": data[0].get('q', ''),
                    "author": data[0].get('a', 'Unknown')
                }
        except Exception as e:
            self.logger.debug(f"ZenQuotes API error: {e}")
        
        return None
    
    def _fetch_quotable(self) -> Optional[Dict[str, str]]:
        """Fetch from quotable.io API."""
        try:
            response = requests.get(
                self.QUOTABLE_API,
                timeout=self.timeout,
                headers={'User-Agent': 'cywf-daily-brief'}
            )
            response.raise_for_status()
            
            data = response.json()
            return {
                "text": data.get('content', ''),
                "author": data.get('author', 'Unknown')
            }
        except Exception as e:
            self.logger.debug(f"Quotable API error: {e}")
        
        return None
    
    def _get_fallback_quote(self) -> Dict[str, str]:
        """Get a fallback quote based on the current day."""
        from datetime import date
        index = date.today().day % len(self.FALLBACK_QUOTES)
        return self.FALLBACK_QUOTES[index]
    
    def render(self, data: Dict[str, str]) -> str:
        """
        Render quote as Markdown.
        
        Args:
            data: Dict with 'text' and 'author' keys
            
        Returns:
            Markdown formatted quote
        """
        if not data or not data.get('text'):
            return "**Quote unavailable** ⛔\n"
        
        markdown = "### 💭 Quote of the Day\n\n"
        markdown += f"> \"{data['text']}\"\n"
        markdown += ">\n"
        markdown += f"> — **{data['author']}**\n"
        
        return markdown


def main():
    """Test the QuoteAgent independently."""
    agent = QuoteAgent()
    success = agent.run()
    
    if success:
        print("✅ QuoteAgent completed successfully")
        # Read and display output
        output_file = agent.output_dir / "quote.md"
        print("\n" + output_file.read_text())
    else:
        print("❌ QuoteAgent failed")
        return 1
    
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())
