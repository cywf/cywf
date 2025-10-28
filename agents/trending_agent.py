#!/usr/bin/env python3
"""
Trending Agent
Queries GitHub Trending and generates visualizations
"""

import requests
from typing import List, Dict, Optional, Any
from pathlib import Path
from base_agent import BaseAgent


class TrendingAgent(BaseAgent):
    """Agent for fetching GitHub trending repositories."""
    
    # GitHub Trending API (no authentication required)
    TRENDING_API = "https://api.gitterapp.com/repositories"
    GITHUB_TRENDING_API = "https://api.github.com/search/repositories"
    
    def __init__(self, assets_dir: str = "assets"):
        super().__init__("Trending")
        self.timeout = 15  # seconds
        self.max_repos = 3
        self.assets_dir = Path(assets_dir)
        self.assets_dir.mkdir(parents=True, exist_ok=True)
    
    def fetch(self) -> Optional[List[Dict[str, Any]]]:
        """
        Fetch trending GitHub repositories.
        
        Returns:
            List of trending repositories with metadata
        """
        # Try the GitHub API first (most reliable)
        repos = self._fetch_from_github_api()
        if repos:
            return repos[:self.max_repos]
        
        # Fallback to gitterapp API
        self.logger.info("GitHub API failed, trying gitterapp...")
        repos = self._fetch_from_gitterapp()
        if repos:
            return repos[:self.max_repos]
        
        self.logger.error("Failed to fetch trending repositories from all sources")
        return None
    
    def _fetch_from_github_api(self) -> Optional[List[Dict[str, Any]]]:
        """Fetch trending repos using GitHub search API."""
        try:
            # Search for repos created in the last 7 days, sorted by stars
            from datetime import datetime, timedelta
            week_ago = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
            
            params = {
                'q': f'created:>{week_ago}',
                'sort': 'stars',
                'order': 'desc',
                'per_page': 10
            }
            
            response = requests.get(
                self.GITHUB_TRENDING_API,
                params=params,
                timeout=self.timeout,
                headers={'User-Agent': 'cywf-daily-brief'}
            )
            response.raise_for_status()
            
            data = response.json()
            items = data.get('items', [])
            
            if not items:
                return None
            
            repos = []
            for item in items:
                repos.append({
                    'name': item.get('name', ''),
                    'full_name': item.get('full_name', ''),
                    'author': item.get('owner', {}).get('login', ''),
                    'description': item.get('description', 'No description'),
                    'stars': item.get('stargazers_count', 0),
                    'forks': item.get('forks_count', 0),
                    'language': item.get('language', 'Unknown'),
                    'url': item.get('html_url', '')
                })
            
            return repos
            
        except Exception as e:
            self.logger.debug(f"GitHub API error: {e}")
            return None
    
    def _fetch_from_gitterapp(self) -> Optional[List[Dict[str, Any]]]:
        """Fetch trending repos from gitterapp API."""
        try:
            response = requests.get(
                self.TRENDING_API,
                timeout=self.timeout,
                headers={'User-Agent': 'cywf-daily-brief'}
            )
            response.raise_for_status()
            
            data = response.json()
            
            if not data:
                return None
            
            repos = []
            for item in data[:10]:
                repos.append({
                    'name': item.get('name', ''),
                    'full_name': item.get('full_name', item.get('name', '')),
                    'author': item.get('author', ''),
                    'description': item.get('description', 'No description'),
                    'stars': item.get('stars', 0),
                    'forks': item.get('forks', 0),
                    'language': item.get('language', 'Unknown'),
                    'url': item.get('url', f"https://github.com/{item.get('full_name', '')}")
                })
            
            return repos
            
        except Exception as e:
            self.logger.debug(f"Gitterapp API error: {e}")
            return None
    
    def _generate_chart(self, repos: List[Dict[str, Any]]) -> Optional[str]:
        """
        Generate a bar chart of stars vs forks using matplotlib.
        
        Args:
            repos: List of repository data
            
        Returns:
            Path to the generated chart image
        """
        try:
            import matplotlib
            matplotlib.use('Agg')  # Non-interactive backend
            import matplotlib.pyplot as plt
            
            # Prepare data
            names = [repo['name'][:20] for repo in repos]  # Truncate long names
            stars = [repo['stars'] for repo in repos]
            forks = [repo['forks'] for repo in repos]
            
            # Create figure
            fig, ax = plt.subplots(figsize=(10, 6))
            
            x = range(len(names))
            width = 0.35
            
            # Create bars
            bars1 = ax.bar([i - width/2 for i in x], stars, width, label='Stars', color='#FFD700')
            bars2 = ax.bar([i + width/2 for i in x], forks, width, label='Forks', color='#4A90E2')
            
            # Customize chart
            ax.set_xlabel('Repository', fontsize=12, fontweight='bold')
            ax.set_ylabel('Count', fontsize=12, fontweight='bold')
            ax.set_title('GitHub Trending Repositories - Stars vs Forks', fontsize=14, fontweight='bold')
            ax.set_xticks(x)
            ax.set_xticklabels(names, rotation=45, ha='right')
            ax.legend()
            
            # Add value labels on bars
            for bars in [bars1, bars2]:
                for bar in bars:
                    height = bar.get_height()
                    ax.text(bar.get_x() + bar.get_width()/2., height,
                           f'{int(height)}',
                           ha='center', va='bottom', fontsize=9)
            
            plt.tight_layout()
            
            # Save chart
            chart_path = self.assets_dir / 'trending.png'
            plt.savefig(chart_path, dpi=100, bbox_inches='tight')
            plt.close()
            
            self.logger.info(f"Chart saved to {chart_path}")
            return str(chart_path)
            
        except Exception as e:
            self.logger.warning(f"Failed to generate chart: {e}")
            return None
    
    def render(self, data: List[Dict[str, Any]]) -> str:
        """
        Render trending repositories as Markdown with chart.
        
        Args:
            data: List of trending repositories
            
        Returns:
            Markdown formatted trending report
        """
        if not data:
            return "**No trending repositories available** ⛔\n"
        
        markdown = "## 🔥 Trending on GitHub\n\n"
        
        # Generate chart
        chart_path = self._generate_chart(data)
        
        if chart_path:
            # Use relative path for markdown
            relative_path = chart_path.replace(str(Path.cwd()) + '/', '')
            markdown += f"![Trending Repos Chart]({relative_path})\n\n"
        
        # Create table
        markdown += "| Repo | Author | Description | Language | Stars | Forks | Link |\n"
        markdown += "|------|--------|-------------|----------|-------|-------|------|\n"
        
        for repo in data:
            name = repo['name']
            author = repo['author']
            description = repo['description'][:60]  # Truncate long descriptions
            if len(repo['description']) > 60:
                description += "..."
            language = repo['language']
            stars = f"⭐ {repo['stars']}"
            forks = f"🔱 {repo['forks']}"
            link = f"[View]({repo['url']})"
            
            markdown += f"| {name} | {author} | {description} | {language} | {stars} | {forks} | {link} |\n"
        
        return markdown


def main():
    """Test the TrendingAgent independently."""
    agent = TrendingAgent()
    success = agent.run()
    
    if success:
        print("✅ TrendingAgent completed successfully")
        output_file = agent.output_dir / "trending.md"
        print("\n" + output_file.read_text())
    else:
        print("❌ TrendingAgent failed")
        return 1
    
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())
