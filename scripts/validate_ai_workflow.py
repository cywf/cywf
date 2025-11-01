#!/usr/bin/env python3
"""
Workflow Validation Script
Validates the AI daily brief workflow configuration before deployment.
"""

import sys
import yaml
from pathlib import Path

def validate_workflow():
    """Validate the AI daily brief workflow."""
    workflow_path = Path('.github/workflows/ai-daily-brief.yml')
    
    print("🔍 Validating AI Daily Brief Workflow...")
    print(f"   File: {workflow_path}")
    print()
    
    # Check file exists
    if not workflow_path.exists():
        print(f"❌ ERROR: Workflow file not found at {workflow_path}")
        return False
    
    # Load YAML
    try:
        with open(workflow_path) as f:
            workflow = yaml.safe_load(f)
        print("✅ YAML syntax is valid")
    except yaml.YAMLError as e:
        print(f"❌ ERROR: Invalid YAML syntax: {e}")
        return False
    
    # Validate structure
    checks = []
    
    # Check name
    if 'name' in workflow:
        checks.append(("Name", workflow['name'], True))
    else:
        checks.append(("Name", "Missing", False))
    
    # Check triggers
    # Note: PyYAML treats 'on' as boolean True, so we check for both 'on' and True
    triggers = workflow.get('on') or workflow.get(True)
    if triggers is not None and isinstance(triggers, dict):
        trigger_list = []
        if 'schedule' in triggers:
            trigger_list.append('schedule')
        if 'workflow_dispatch' in triggers:
            trigger_list.append('workflow_dispatch')
        checks.append(("Triggers", ', '.join(trigger_list) if trigger_list else "None", len(trigger_list) > 0))
    else:
        checks.append(("Triggers", "None configured", False))
    
    # Check permissions
    if 'permissions' in workflow:
        perms = workflow['permissions']
        if 'contents' in perms and perms['contents'] == 'write':
            checks.append(("Permissions", "contents: write ✓", True))
        else:
            checks.append(("Permissions", "Missing contents: write", False))
    else:
        checks.append(("Permissions", "Not configured", False))
    
    # Check jobs
    if 'jobs' in workflow:
        jobs = workflow['jobs']
        job_names = list(jobs.keys())
        checks.append(("Jobs", f"{len(job_names)} job(s): {', '.join(job_names)}", len(job_names) > 0))
        
        # Check for OpenAI integration
        openai_found = False
        openai_key_found = False
        
        for job_name, job_config in jobs.items():
            # Check for OpenAI API key in env
            if 'env' in job_config and 'OPENAI_API_KEY' in job_config['env']:
                openai_key_found = True
            
            if 'steps' in job_config:
                for step in job_config['steps']:
                    # Check if step uses OpenAI API endpoint
                    if 'run' in step:
                        run_content = step['run']
                        # Check for OpenAI API endpoint (more reliable than string matching)
                        if 'api.openai.com/v1/chat/completions' in run_content:
                            openai_found = True
                        # Also check for general openai references as fallback
                        elif 'openai' in run_content.lower() and ('curl' in run_content or 'api' in run_content):
                            openai_found = True
        
        if openai_key_found:
            checks.append(("OpenAI API Key", "Configured", True))
        else:
            checks.append(("OpenAI API Key", "Missing", False))
        
        if openai_found:
            checks.append(("OpenAI Integration", "Found", True))
        else:
            checks.append(("OpenAI Integration", "Not found", False))
    else:
        checks.append(("Jobs", "Missing", False))
    
    # Print results
    print()
    print("📋 Validation Results:")
    print()
    all_passed = True
    for check_name, check_value, check_status in checks:
        status_icon = "✅" if check_status else "❌"
        print(f"   {status_icon} {check_name:20s} {check_value}")
        if not check_status:
            all_passed = False
    
    print()
    
    # Check README markers
    readme_path = Path('README.md')
    if readme_path.exists():
        with open(readme_path) as f:
            readme_content = f.read()
        
        has_begin = '<!-- BEGIN DAILY BRIEF -->' in readme_content
        has_end = '<!-- END DAILY BRIEF -->' in readme_content
        
        print("📄 README.md Validation:")
        print()
        print(f"   {'✅' if has_begin else '❌'} BEGIN DAILY BRIEF marker found")
        print(f"   {'✅' if has_end else '❌'} END DAILY BRIEF marker found")
        print()
        
        if not has_begin or not has_end:
            print("   ⚠️  WARNING: Daily brief markers are required for the workflow to work")
            all_passed = False
    else:
        print("⚠️  WARNING: README.md not found")
        all_passed = False
    
    print()
    if all_passed:
        print("🎉 All validations passed! Workflow is ready to use.")
        print()
        print("📝 Next steps:")
        print("   1. Ensure OPENAI_API_KEY secret is set in repository settings")
        print("   2. Commit and push the workflow file")
        print("   3. Trigger manually from Actions tab for testing")
        print("   4. Monitor the first few automated runs")
        return True
    else:
        print("❌ Some validations failed. Please fix the issues above.")
        return False

def main():
    """Main entry point."""
    success = validate_workflow()
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
