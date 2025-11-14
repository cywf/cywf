#!/usr/bin/env python3
"""
Test script for AI Daily Brief workflow validation and update logic.
This script tests the Python functions used in the GitHub Actions workflow.
"""

import sys
import os
import tempfile
from pathlib import Path


def validate_brief(filepath):
    """Validate the generated brief content before inserting into README"""
    
    print(f"📂 Reading file: {filepath}")
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"❌ VALIDATION FAILED: File '{filepath}' not found")
        return False
    except Exception as e:
        print(f"❌ VALIDATION FAILED: Error reading file: {e}")
        return False
    
    # Check 1: File is not empty
    if not content or len(content.strip()) == 0:
        print("❌ VALIDATION FAILED: Brief file is empty")
        return False
    print("✅ Check 1: File is not empty")
    
    # Check 2: Contains <details> block
    if '<details>' not in content:
        print("❌ VALIDATION FAILED: Missing <details> block")
        return False
    print("✅ Check 2: Contains <details> block")
    
    # Check 3: Contains date header
    if '# 📅 Daily Brief' not in content and '📅 Daily Brief' not in content:
        print("❌ VALIDATION FAILED: Missing date header (# 📅 Daily Brief)")
        return False
    print("✅ Check 3: Contains date header")
    
    # Check 4: Has real content (more than 10 non-empty lines)
    non_empty_lines = [line for line in content.split('\n') if line.strip()]
    if len(non_empty_lines) < 10:
        print(f"❌ VALIDATION FAILED: Insufficient content ({len(non_empty_lines)} non-empty lines, need at least 10)")
        return False
    print(f"✅ Check 4: Has sufficient content ({len(non_empty_lines)} non-empty lines)")
    
    # Check 5: Includes both markers
    if '<!-- BEGIN DAILY BRIEF -->' not in content:
        print("❌ VALIDATION FAILED: Missing <!-- BEGIN DAILY BRIEF --> marker")
        return False
    if '<!-- END DAILY BRIEF -->' not in content:
        print("❌ VALIDATION FAILED: Missing <!-- END DAILY BRIEF --> marker")
        return False
    print("✅ Check 5: Both markers present")
    
    # Check 6: Uses literal HTML tags (not escaped)
    if '&lt;details&gt;' in content or '&lt;summary&gt;' in content:
        print("❌ VALIDATION FAILED: HTML tags are escaped (found &lt;details&gt; or &lt;summary&gt;)")
        return False
    print("✅ Check 6: HTML tags are not escaped")
    
    # Additional check: Verify markers are in correct order
    begin_pos = content.find('<!-- BEGIN DAILY BRIEF -->')
    end_pos = content.find('<!-- END DAILY BRIEF -->')
    if begin_pos >= end_pos:
        print("❌ VALIDATION FAILED: Markers are in wrong order or overlapping")
        return False
    print("✅ Check 7: Markers are in correct order")
    
    print("\n🎉 All validation checks passed!")
    return True


def update_readme(readme_path, brief_path):
    """Update README.md with the daily brief content using Python"""
    
    # Read the generated brief
    print(f"📂 Reading brief from: {brief_path}")
    try:
        with open(brief_path, 'r', encoding='utf-8') as f:
            brief_content = f.read()
    except Exception as e:
        print(f"❌ ERROR: Failed to read brief file: {e}")
        return False
    
    # Read the README
    print(f"📂 Reading README from: {readme_path}")
    try:
        with open(readme_path, 'r', encoding='utf-8') as f:
            readme_content = f.read()
    except Exception as e:
        print(f"❌ ERROR: Failed to read README: {e}")
        return False
    
    begin_marker = '<!-- BEGIN DAILY BRIEF -->'
    end_marker = '<!-- END DAILY BRIEF -->'
    
    # Check if markers exist
    begin_pos = readme_content.find(begin_marker)
    end_pos = readme_content.find(end_marker)
    
    if begin_pos == -1 or end_pos == -1:
        print("⚠️  Markers not found in README. Creating new section...")
        
        # Create a new daily brief section with markers
        starter_block = f"\n\n## 📅 Daily Brief\n\n{brief_content}\n\n---\n"
        
        # Ensure README ends with exactly one newline
        readme_content = readme_content.rstrip('\n') + '\n'
        
        # Append the starter block
        new_readme = readme_content + starter_block
        
        print("✅ Starter block with markers appended to README")
    else:
        print("✅ Markers found in README")
        print(f"   BEGIN marker at position: {begin_pos}")
        print(f"   END marker at position: {end_pos}")
        
        # Replace everything between and including markers
        before_section = readme_content[:begin_pos]
        after_section = readme_content[end_pos + len(end_marker):]
        
        # Insert new content (which includes the markers)
        new_readme = before_section + brief_content + after_section
        
        print("✅ Content between markers replaced")
    
    # Ensure file ends with exactly one newline
    new_readme = new_readme.rstrip('\n') + '\n'
    
    # Write updated README
    try:
        with open(readme_path, 'w', encoding='utf-8') as f:
            f.write(new_readme)
        print(f"✅ README.md updated successfully")
        return True
    except Exception as e:
        print(f"❌ ERROR: Failed to write README: {e}")
        return False


def run_tests():
    """Run comprehensive tests for validation and update logic"""
    
    print("🧪 Running AI Daily Brief Workflow Tests\n")
    print("=" * 60 + "\n")
    
    passed = 0
    failed = 0
    
    # Test 1: Valid brief passes validation
    print("Test 1: Valid brief passes validation")
    print("-" * 60)
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False) as f:
        valid_brief = """<!-- BEGIN DAILY BRIEF -->
<details>
<summary><b>📰 Today's Intelligence Brief</b></summary>

<div align="center">

# 📅 Daily Brief

**Thursday, November 14, 2024**

</div>

---

<details>
<summary><b>💭 Quote of the Day</b></summary>

### 💭 Quote of the Day

> "The only way to do great work is to love what you do."
>
> — **Steve Jobs**

</details>

---

<div align="center">

_Generated at 10:00 AM UTC_

</div>
</details>
<!-- END DAILY BRIEF -->
"""
        f.write(valid_brief)
        temp_file = f.name
    
    try:
        if validate_brief(temp_file):
            print("✅ Test 1 PASSED\n")
            passed += 1
        else:
            print("❌ Test 1 FAILED\n")
            failed += 1
    finally:
        os.unlink(temp_file)
    
    # Test 2: Invalid brief (escaped HTML) fails validation
    print("Test 2: Invalid brief (escaped HTML) fails validation")
    print("-" * 60)
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False) as f:
        invalid_brief = """<!-- BEGIN DAILY BRIEF -->
&lt;details&gt;
&lt;summary&gt;&lt;b&gt;📰 Today's Intelligence Brief&lt;/b&gt;&lt;/summary&gt;

# 📅 Daily Brief

&lt;/details&gt;
<!-- END DAILY BRIEF -->
"""
        f.write(invalid_brief)
        temp_file = f.name
    
    try:
        if not validate_brief(temp_file):
            print("✅ Test 2 PASSED (correctly rejected invalid content)\n")
            passed += 1
        else:
            print("❌ Test 2 FAILED (should have rejected content)\n")
            failed += 1
    finally:
        os.unlink(temp_file)
    
    # Test 3: Missing markers fails validation
    print("Test 3: Missing markers fails validation")
    print("-" * 60)
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False) as f:
        no_markers = """<details>
<summary><b>📰 Today's Intelligence Brief</b></summary>

# 📅 Daily Brief

Some content here.

</details>
"""
        f.write(no_markers)
        temp_file = f.name
    
    try:
        if not validate_brief(temp_file):
            print("✅ Test 3 PASSED (correctly rejected content without markers)\n")
            passed += 1
        else:
            print("❌ Test 3 FAILED (should have rejected content)\n")
            failed += 1
    finally:
        os.unlink(temp_file)
    
    # Test 4: Update README with existing markers
    print("Test 4: Update README with existing markers")
    print("-" * 60)
    
    with tempfile.TemporaryDirectory() as tmpdir:
        readme_path = os.path.join(tmpdir, 'README.md')
        brief_path = os.path.join(tmpdir, 'brief.md')
        
        # Create README with existing markers
        with open(readme_path, 'w') as f:
            f.write("""# My Profile

Some intro text.

## 📅 Daily Brief

<!-- BEGIN DAILY BRIEF -->
Old content here
<!-- END DAILY BRIEF -->

## Other Section

More content.
""")
        
        # Create new brief
        with open(brief_path, 'w') as f:
            f.write("""<!-- BEGIN DAILY BRIEF -->
<details>
<summary><b>📰 Today's Intelligence Brief</b></summary>

New content for today!

</details>
<!-- END DAILY BRIEF -->""")
        
        if update_readme(readme_path, brief_path):
            # Verify update
            with open(readme_path, 'r') as f:
                updated = f.read()
            
            if ('New content for today!' in updated and 
                'Old content here' not in updated and
                updated.count('<!-- BEGIN DAILY BRIEF -->') == 1 and
                updated.count('<!-- END DAILY BRIEF -->') == 1):
                print("✅ Test 4 PASSED (README updated correctly)\n")
                passed += 1
            else:
                print("❌ Test 4 FAILED (README update incorrect)\n")
                failed += 1
        else:
            print("❌ Test 4 FAILED (update function returned False)\n")
            failed += 1
    
    # Test 5: Update README without markers (creates new section)
    print("Test 5: Update README without markers (creates new section)")
    print("-" * 60)
    
    with tempfile.TemporaryDirectory() as tmpdir:
        readme_path = os.path.join(tmpdir, 'README.md')
        brief_path = os.path.join(tmpdir, 'brief.md')
        
        # Create README without markers
        with open(readme_path, 'w') as f:
            f.write("""# My Profile

Some intro text.

## Other Section

More content.
""")
        
        # Create new brief
        with open(brief_path, 'w') as f:
            f.write("""<!-- BEGIN DAILY BRIEF -->
<details>
<summary><b>📰 Today's Intelligence Brief</b></summary>

New daily brief section!

</details>
<!-- END DAILY BRIEF -->""")
        
        if update_readme(readme_path, brief_path):
            # Verify update
            with open(readme_path, 'r') as f:
                updated = f.read()
            
            if ('New daily brief section!' in updated and 
                '<!-- BEGIN DAILY BRIEF -->' in updated and
                '<!-- END DAILY BRIEF -->' in updated and
                '## 📅 Daily Brief' in updated):
                print("✅ Test 5 PASSED (New section created correctly)\n")
                passed += 1
            else:
                print("❌ Test 5 FAILED (New section creation incorrect)\n")
                failed += 1
        else:
            print("❌ Test 5 FAILED (update function returned False)\n")
            failed += 1
    
    # Test 6: Idempotency - running update twice produces same result
    print("Test 6: Idempotency test")
    print("-" * 60)
    
    with tempfile.TemporaryDirectory() as tmpdir:
        readme_path = os.path.join(tmpdir, 'README.md')
        brief_path = os.path.join(tmpdir, 'brief.md')
        
        # Create README with existing markers
        with open(readme_path, 'w') as f:
            f.write("""# My Profile

<!-- BEGIN DAILY BRIEF -->
Old content
<!-- END DAILY BRIEF -->
""")
        
        # Create brief
        with open(brief_path, 'w') as f:
            f.write("""<!-- BEGIN DAILY BRIEF -->
<details>
<summary><b>📰 Today's Intelligence Brief</b></summary>

Consistent content!

</details>
<!-- END DAILY BRIEF -->""")
        
        # Run update twice
        update_readme(readme_path, brief_path)
        with open(readme_path, 'r') as f:
            first_result = f.read()
        
        update_readme(readme_path, brief_path)
        with open(readme_path, 'r') as f:
            second_result = f.read()
        
        if first_result == second_result:
            print("✅ Test 6 PASSED (Updates are idempotent)\n")
            passed += 1
        else:
            print("❌ Test 6 FAILED (Second update changed the result)\n")
            failed += 1
    
    # Summary
    print("=" * 60)
    print(f"\n📊 Test Results:")
    print(f"   ✅ Passed: {passed}")
    print(f"   ❌ Failed: {failed}")
    print(f"   📈 Total: {passed + failed}")
    print("\n" + "=" * 60)
    
    return failed == 0


if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)
