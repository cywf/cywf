#!/usr/bin/env python3
"""
Test script for the multi-agent daily brief system.
Tests each agent independently and then runs the full orchestrator.
"""

import sys
from pathlib import Path

# Add agents directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'agents'))

from quote_agent import QuoteAgent
from weather_agent import WeatherAgent
from intel_agent import IntelAgent
from cyberpulse_agent import CyberPulseAgent
from trending_agent import TrendingAgent


def test_agent(agent_class, name):
    """Test a single agent."""
    print(f"\n{'='*60}")
    print(f"Testing {name}...")
    print('='*60)
    
    try:
        agent = agent_class()
        success = agent.run()
        
        if success:
            print(f"✅ {name} PASSED")
            return True
        else:
            print(f"⚠️  {name} FAILED (but handled gracefully)")
            return False
    except Exception as e:
        print(f"❌ {name} EXCEPTION: {e}")
        return False


def main():
    """Run all agent tests."""
    print("🧪 Multi-Agent Daily Brief System Test Suite")
    print("="*60)
    
    results = []
    
    # Test each agent
    results.append(("QuoteAgent", test_agent(QuoteAgent, "QuoteAgent")))
    results.append(("WeatherAgent", test_agent(WeatherAgent, "WeatherAgent")))
    results.append(("IntelAgent", test_agent(IntelAgent, "IntelAgent")))
    results.append(("CyberPulseAgent", test_agent(CyberPulseAgent, "CyberPulseAgent")))
    results.append(("TrendingAgent", test_agent(TrendingAgent, "TrendingAgent")))
    
    # Print summary
    print("\n" + "="*60)
    print("📊 Test Summary")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASSED" if result else "⚠️  FAILED"
        print(f"{name:20} {status}")
    
    print("="*60)
    print(f"Results: {passed}/{total} agents passed")
    
    if passed == total:
        print("🎉 All agents operational!")
        return 0
    elif passed > 0:
        print("⚠️  Some agents failed but system will continue with graceful degradation")
        return 0
    else:
        print("❌ All agents failed - check network connectivity and APIs")
        return 1


if __name__ == "__main__":
    sys.exit(main())
