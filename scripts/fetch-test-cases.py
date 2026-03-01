#!/usr/bin/env python3
"""Fetch all 134 test cases from ilmsummit.org inheritance calculator."""

import re
import json
import time
import urllib.request

def fetch_test_case(case_id):
    """Fetch a single test case and parse the HTML."""
    url = f"http://inheritance.ilmsummit.org/projects/inheritance/Results.aspx?TestCaseID={case_id}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=15) as response:
            html = response.read().decode('utf-8', errors='replace')
    except Exception as e:
        return {"id": case_id, "error": str(e)}

    # Extract text content between tags
    text_vals = re.findall(r'>([^<]+)<', html)
    meaningful = [v.strip() for v in text_vals if v.strip() and len(v.strip()) > 0]

    # Find the relevant sections
    result = {
        "id": case_id,
        "shares_by_category": [],
        "shares_by_individual": [],
        "calculation_steps": []
    }

    mode = None
    i = 0
    while i < len(meaningful):
        val = meaningful[i]

        if "Shares by Category" in val:
            mode = "category"
            i += 1
            # Skip headers
            while i < len(meaningful) and meaningful[i] in ["Relative Category", "Share Fraction", "Share Percentage"]:
                i += 1
            continue
        elif "Shares by Individual" in val:
            mode = "individual"
            i += 1
            while i < len(meaningful) and meaningful[i] in ["Relative", "Share Fraction", "Share Percentage"]:
                i += 1
            continue
        elif "Calculation Steps:" in val:
            mode = "steps"
            i += 1
            continue
        elif val in ["Home", "Test Cases", "FAQ", "Contact Us", "Rules", "Chart", "Articles", "Donate",
                      "Inheritance Calculator - Results", "(According to Authentic Qur'an & Sunnah)",
                      "Relative Category", "Share Fraction", "Share Percentage", "Relative",
                      "Powered by", "Developed by", "&nbsp;"]:
            i += 1
            continue

        if mode == "category" and i + 2 < len(meaningful):
            heir = meaningful[i]
            fraction = meaningful[i + 1] if i + 1 < len(meaningful) else ""
            percentage = meaningful[i + 2] if i + 2 < len(meaningful) else ""
            if "/" in fraction or fraction == "0":
                result["shares_by_category"].append({
                    "heir": heir,
                    "fraction": fraction,
                    "percentage": percentage
                })
                i += 3
                continue

        if mode == "individual" and i + 2 < len(meaningful):
            heir = meaningful[i]
            fraction = meaningful[i + 1] if i + 1 < len(meaningful) else ""
            percentage = meaningful[i + 2] if i + 2 < len(meaningful) else ""
            if "/" in fraction or fraction == "0":
                result["shares_by_individual"].append({
                    "heir": heir,
                    "fraction": fraction,
                    "percentage": percentage
                })
                i += 3
                continue

        if mode == "steps":
            # Collect step text
            if val and not val.startswith("Powered") and not val.startswith("Developed"):
                result["calculation_steps"].append(val)

        i += 1

    return result

def main():
    all_cases = []
    for case_id in range(1, 135):
        print(f"Fetching test case {case_id}/134...", flush=True)
        case = fetch_test_case(case_id)
        all_cases.append(case)
        time.sleep(0.3)  # Be polite

    with open("test-cases.json", "w") as f:
        json.dump(all_cases, f, indent=2)

    print(f"\nDone! Fetched {len(all_cases)} test cases.")

    # Also write a summary
    with open("test-cases-summary.md", "w") as f:
        f.write("# IlmSummit Inheritance Test Cases\n\n")
        for case in all_cases:
            if "error" in case:
                f.write(f"## Test Case {case['id']}\n**ERROR**: {case['error']}\n\n")
                continue
            f.write(f"## Test Case {case['id']}\n")
            if case["shares_by_category"]:
                f.write("| Heir | Fraction | Percentage |\n|------|----------|------------|\n")
                for s in case["shares_by_category"]:
                    f.write(f"| {s['heir']} | {s['fraction']} | {s['percentage']} |\n")
            if case["calculation_steps"]:
                f.write("\n**Steps:**\n")
                for step in case["calculation_steps"]:
                    f.write(f"- {step}\n")
            f.write("\n")

if __name__ == "__main__":
    main()
