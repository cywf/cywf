#!/usr/bin/env python3
"""
Base Agent Class
Defines the common interface and utilities for all daily brief agents.
"""

import json
import logging
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, Dict, Optional
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


class DateTimeEncoder(json.JSONEncoder):
    """Custom JSON encoder that handles datetime objects."""
    
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)


class BaseAgent(ABC):
    """Base class for all daily brief agents."""
    
    def __init__(self, name: str, output_dir: str = "agents/output"):
        """
        Initialize the base agent.
        
        Args:
            name: Name of the agent
            output_dir: Directory to write output files
        """
        self.name = name
        self.output_dir = Path(output_dir)
        self.logger = logging.getLogger(f"Agent.{name}")
        self.status = "initialized"
        self.error_message = None
        
        # Ensure output directory exists
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    @abstractmethod
    def fetch(self) -> Optional[Any]:
        """
        Fetch data from the agent's source.
        
        Returns:
            Fetched data or None on failure
        """
        pass
    
    @abstractmethod
    def render(self, data: Any) -> str:
        """
        Render the fetched data as Markdown.
        
        Args:
            data: Data fetched by the agent
            
        Returns:
            Markdown-formatted string
        """
        pass
    
    def run(self) -> bool:
        """
        Execute the agent workflow: fetch, render, and save.
        
        Returns:
            True if successful, False otherwise
        """
        try:
            self.logger.info(f"Starting {self.name} agent...")
            self.status = "running"
            
            # Fetch data
            data = self.fetch()
            
            if data is None:
                self.logger.warning(f"{self.name} agent: No data fetched")
                self.status = "error"
                self.error_message = "Failed to fetch data"
                self._write_error_output()
                return False
            
            # Render to markdown
            markdown = self.render(data)
            
            # Save output
            self._write_output(markdown, data)
            
            self.logger.info(f"{self.name} agent completed successfully")
            self.status = "success"
            return True
            
        except Exception as e:
            self.logger.error(f"{self.name} agent failed: {e}", exc_info=True)
            self.status = "error"
            self.error_message = str(e)
            self._write_error_output()
            return False
    
    def _write_output(self, markdown: str, data: Any):
        """Write agent output to files."""
        # Write markdown output
        md_file = self.output_dir / f"{self.name.lower()}.md"
        md_file.write_text(markdown, encoding='utf-8')
        self.logger.debug(f"Wrote markdown to {md_file}")
        
        # Write JSON metadata
        json_file = self.output_dir / f"{self.name.lower()}.json"
        metadata = {
            "agent": self.name,
            "status": self.status,
            "data": data if isinstance(data, (dict, list)) else str(data),
            "error": self.error_message
        }
        json_file.write_text(json.dumps(metadata, indent=2, cls=DateTimeEncoder), encoding='utf-8')
        self.logger.debug(f"Wrote metadata to {json_file}")
    
    def _write_error_output(self):
        """Write error output when agent fails."""
        # Write error markdown
        md_file = self.output_dir / f"{self.name.lower()}.md"
        error_md = f"**{self.name} data unavailable** ⛔\n"
        if self.error_message:
            error_md += f"\n_Error: {self.error_message}_\n"
        md_file.write_text(error_md, encoding='utf-8')
        
        # Write error JSON
        json_file = self.output_dir / f"{self.name.lower()}.json"
        metadata = {
            "agent": self.name,
            "status": "error",
            "error": self.error_message or "Unknown error"
        }
        json_file.write_text(json.dumps(metadata, indent=2), encoding='utf-8')


class AgentError(Exception):
    """Custom exception for agent errors."""
    pass
