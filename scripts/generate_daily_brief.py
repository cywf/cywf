#!/usr/bin/env python3
"""
Daily Brief Orchestrator
Multi-agent architecture for generating the daily intelligence brief.
Spawns and coordinates independent agents, then assembles the final report.
"""

import sys
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('Orchestrator')

# Add agents directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'agents'))

# Import agents
from quote_agent import QuoteAgent
from weather_agent import WeatherAgent
from intel_agent import IntelAgent
from cyberpulse_agent import CyberPulseAgent
from trending_agent import TrendingAgent


class DailyBriefOrchestrator:
    """Orchestrates the multi-agent daily brief generation."""
    
    def __init__(self):
        self.root_dir = Path(__file__).parent.parent
        self.output_dir = self.root_dir / 'agents' / 'output'
        self.daily_dir = self.root_dir / 'daily'
        self.readme_path = self.root_dir / 'README.md'
        
        # Ensure directories exist
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.daily_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize agents
        self.agents = [
            QuoteAgent(),
            WeatherAgent(),
            IntelAgent(),
            CyberPulseAgent(),
            TrendingAgent(assets_dir=str(self.root_dir / 'assets'))
        ]
    
    def run_agents(self, parallel: bool = True) -> Dict[str, Tuple[bool, str]]:
        """
        Run all agents and collect their outputs.
        
        Args:
            parallel: Run agents in parallel (default: True)
            
        Returns:
            Dict mapping agent name to (success, output_path)
        """
        logger.info("=" * 60)
        logger.info("🚀 Starting Daily Brief Generation")
        logger.info("=" * 60)
        
        results = {}
        
        if parallel:
            # Run agents in parallel
            logger.info("Running agents in parallel...")
            with ThreadPoolExecutor(max_workers=5) as executor:
                future_to_agent = {executor.submit(agent.run): agent for agent in self.agents}
                
                for future in as_completed(future_to_agent):
                    agent = future_to_agent[future]
                    try:
                        success = future.result()
                        output_file = self.output_dir / f"{agent.name.lower()}.md"
                        results[agent.name] = (success, str(output_file))
                        
                        status = "✅" if success else "❌"
                        logger.info(f"{status} {agent.name}Agent: {'Success' if success else 'Failed'}")
                    except Exception as e:
                        logger.error(f"❌ {agent.name}Agent exception: {e}")
                        results[agent.name] = (False, None)
        else:
            # Run agents sequentially
            logger.info("Running agents sequentially...")
            for agent in self.agents:
                try:
                    success = agent.run()
                    output_file = self.output_dir / f"{agent.name.lower()}.md"
                    results[agent.name] = (success, str(output_file))
                    
                    status = "✅" if success else "❌"
                    logger.info(f"{status} {agent.name}Agent: {'Success' if success else 'Failed'}")
                except Exception as e:
                    logger.error(f"❌ {agent.name}Agent exception: {e}")
                    results[agent.name] = (False, None)
        
        return results
    
    def collect_outputs(self) -> Dict[str, str]:
        """
        Collect markdown outputs from all agents.
        
        Returns:
            Dict mapping agent name to markdown content
        """
        outputs = {}
        
        for agent in self.agents:
            md_file = self.output_dir / f"{agent.name.lower()}.md"
            
            if md_file.exists():
                outputs[agent.name] = md_file.read_text(encoding='utf-8')
                logger.info(f"📄 Collected output from {agent.name}Agent")
            else:
                outputs[agent.name] = f"**{agent.name} data unavailable** ⛔\n"
                logger.warning(f"⚠️  No output file for {agent.name}Agent")
        
        return outputs
    
    def generate_brief(self, outputs: Dict[str, str]) -> str:
        """
        Generate the unified daily brief markdown.
        
        Args:
            outputs: Dict of agent outputs
            
        Returns:
            Complete markdown brief
        """
        now = datetime.now()
        date_long = now.strftime('%A, %B %d, %Y')
        time_str = now.strftime('%I:%M %p %Z')
        
        markdown = f"<div align=\"center\">\n\n"
        markdown += f"# 📅 Daily Brief\n\n"
        markdown += f"**{date_long}**\n\n"
        markdown += f"</div>\n\n"
        markdown += f"---\n\n"
        
        # 1. Quote of the Day
        markdown += f"<details>\n<summary><b>💭 Quote of the Day</b></summary>\n\n"
        markdown += outputs.get('Quote', '**Quote unavailable** ⛔\n')
        markdown += f"\n</details>\n\n"
        
        # 2. Weather & Space Weather
        markdown += f"<details>\n<summary><b>🌤️ Weather Report</b></summary>\n\n"
        markdown += outputs.get('Weather', '**Weather data unavailable** ⛔\n')
        markdown += f"\n</details>\n\n"
        
        # 3. Global Intelligence Report
        markdown += f"<details>\n<summary><b>📰 Global Intelligence News</b></summary>\n\n"
        markdown += outputs.get('Intel', '**No news stories available** ⛔\n')
        markdown += f"\n</details>\n\n"
        
        # 4. Cyber Pulse Report
        markdown += f"<details>\n<summary><b>🔐 Cyber Pulse Report</b></summary>\n\n"
        markdown += outputs.get('CyberPulse', '**No cybersecurity headlines available** ⛔\n')
        markdown += f"\n</details>\n\n"
        
        # 5. Trending Repos
        markdown += f"<details>\n<summary><b>🔥 Trending on GitHub</b></summary>\n\n"
        markdown += outputs.get('Trending', '**No trending repositories available** ⛔\n')
        markdown += f"\n</details>\n\n"
        
        markdown += f"---\n\n"
        markdown += f"<div align=\"center\">\n\n"
        markdown += f"_Generated at {time_str}_\n\n"
        markdown += f"</div>\n"
        
        return markdown
    
    def update_readme(self, brief_content: str) -> bool:
        """
        Update README.md with the daily brief.
        
        Args:
            brief_content: The generated brief markdown
            
        Returns:
            True if successful, False otherwise
        """
        try:
            readme = self.readme_path.read_text(encoding='utf-8')
            
            # Find markers
            start_marker = '<!-- BEGIN DAILY BRIEF -->'
            end_marker = '<!-- END DAILY BRIEF -->'
            
            start_idx = readme.find(start_marker)
            end_idx = readme.find(end_marker)
            
            if start_idx == -1 or end_idx == -1:
                logger.error("⚠️  Daily brief markers not found in README.md")
                return False
            
            # Build new content
            before = readme[:start_idx + len(start_marker)]
            after = readme[end_idx:]
            
            wrapped_content = (
                f"\n<details>\n"
                f"<summary><b>📰 Today's Intelligence Brief</b></summary>\n\n"
                f"{brief_content}\n\n"
                f"</details>\n"
            )
            
            new_readme = before + wrapped_content + after
            
            # Write updated README
            self.readme_path.write_text(new_readme, encoding='utf-8')
            logger.info("✅ README.md updated successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error updating README: {e}")
            return False
    
    def create_archive(self, brief_content: str) -> bool:
        """
        Create daily archive file.
        
        Args:
            brief_content: The generated brief markdown
            
        Returns:
            True if successful, False otherwise
        """
        try:
            now = datetime.now()
            date_iso = now.strftime('%Y-%m-%d')
            date_long = now.strftime('%A, %B %d, %Y')
            
            archive_path = self.daily_dir / f"{date_iso}.md"
            
            archive_content = f"---\n"
            archive_content += f"date: {date_iso}\n"
            archive_content += f"title: \"Daily Brief - {date_long}\"\n"
            archive_content += f"generated: {now.isoformat()}\n"
            archive_content += f"---\n\n"
            archive_content += brief_content
            
            archive_path.write_text(archive_content, encoding='utf-8')
            logger.info(f"✅ Archive created: {archive_path}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error creating archive: {e}")
            return False
    
    def print_summary(self, results: Dict[str, Tuple[bool, str]]) -> None:
        """Print execution summary."""
        logger.info("")
        logger.info("=" * 60)
        logger.info("✨ Daily Brief Generation Complete!")
        logger.info("=" * 60)
        
        for agent_name, (success, _) in results.items():
            status = "✅" if success else "❌"
            logger.info(f"{status} {agent_name}Agent: {'Success' if success else 'Failed'}")
    
    def run(self) -> int:
        """
        Execute the complete daily brief generation workflow.
        
        Returns:
            Exit code (0 for success, 1 for failure)
        """
        try:
            # Step 1: Run all agents
            results = self.run_agents(parallel=True)
            
            # Step 2: Collect outputs
            logger.info("")
            logger.info("📦 Collecting agent outputs...")
            outputs = self.collect_outputs()
            
            # Step 3: Generate unified brief
            logger.info("📝 Generating unified daily brief...")
            brief_content = self.generate_brief(outputs)
            
            # Step 4: Update README
            logger.info("📄 Updating README.md...")
            readme_updated = self.update_readme(brief_content)
            
            # Step 5: Create archive
            logger.info("📁 Creating daily archive...")
            archive_created = self.create_archive(brief_content)
            
            # Print summary
            self.print_summary(results)
            
            logger.info("")
            logger.info(f"README Updated: {'✅' if readme_updated else '❌'}")
            logger.info(f"Archive Created: {'✅' if archive_created else '❌'}")
            
            return 0
            
        except Exception as e:
            logger.error(f"❌ Fatal error: {e}", exc_info=True)
            return 1


def main():
    """Main entry point."""
    orchestrator = DailyBriefOrchestrator()
    return orchestrator.run()


if __name__ == "__main__":
    sys.exit(main())
