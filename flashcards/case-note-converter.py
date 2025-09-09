import json
import re

def slugify_case(name):
    name = name.lower()
    name = re.sub(r'[^a-z0-9 ]', '', name.replace(' v. ', ' '))
    return '-'.join(name.split())

def parse_case_notes(md_text):
    cases = []
    lines = md_text.splitlines()
    case = None
    in_details = False
    current_detail = None

    for i, line in enumerate(lines):
        h2 = re.match(r'^##\s*case:\s*(.*)', line, re.I)
        year = re.match(r'^year:\s*(.*)', line, re.I)
        con_elem = re.match(r'^con-elem:\s*(.*)', line, re.I)
        fedlaw = re.match(r'^federal-law:\s*(.*)', line, re.I)
        statelaw = re.match(r'^state-law:\s*(.*)', line, re.I)
        exorder = re.match(r'^executive-order:\s*(.*)', line, re.I)
        caselaw = re.match(r'^case-law:\s*(.*)', line, re.I)
        h4_details = re.match(r'^####\s*details:', line, re.I)
        bullet = re.match(r'^\s*-\s*([a-zA-Z0-9\-]+):\s*(.*)', line)
        numbered = re.match(r'^\s*(\d+)\.\s*(.*)', line)
        text = line.rstrip()

        if h2:
            if case:
                cases.append(case)
            case = {
                "case_name": h2.group(1).strip(),
                "case_id": slugify_case(h2.group(1).strip()),
                "attributes": {},
                "details": {}
            }
            in_details = False
            current_detail = None
        elif case and year:
            case["attributes"]["year"] = year.group(1).strip()
        elif case and con_elem:
            case["attributes"]["con_elem"] = [x.strip() for x in con_elem.group(1).split(',') if x.strip()]
        elif case and fedlaw:
            case["attributes"]["federal_law"] = [x.strip() for x in fedlaw.group(1).split(',') if x.strip()]
        elif case and statelaw:
            case["attributes"]["state_law"] = [x.strip() for x in statelaw.group(1).split(',') if x.strip()]
        elif case and exorder:
            case["attributes"]["executive_order"] = [x.strip() for x in exorder.group(1).split(',') if x.strip()]
        elif case and caselaw:
            case["attributes"]["case_law"] = [x.strip() for x in caselaw.group(1).split(',') if x.strip()]
        elif case and h4_details:
            in_details = True
            current_detail = None
        elif case and in_details and bullet:
            current_detail = bullet.group(1).strip().lower()
            value = bullet.group(2).strip()
            if current_detail == "facts":
                case["details"]["facts"] = []
            else:
                case["details"][current_detail] = value
        elif case and in_details and current_detail == "facts" and numbered:
            case["details"]["facts"].append(numbered.group(2).strip())
        elif case and in_details and current_detail and not numbered and not bullet and text:
            # Append to the current detail (issues-questions, decision, impact)
            if current_detail == "facts":
                continue
            if case["details"][current_detail]:
                case["details"][current_detail] += " " + text.strip()
            else:
                case["details"][current_detail] = text.strip()
        elif case and in_details and bullet is None and not numbered and not text:
            # Blank line inside details: skip
            continue
    if case:
        cases.append(case)
    return cases

if __name__ == "__main__":
    with open("templated-case-notes.md", "r", encoding="utf-8") as f:
        md_text = f.read()
    cases = parse_case_notes(md_text)
    with open("case-notes.json", "w", encoding="utf-8") as f:
        json.dump(cases, f, indent=2, ensure_ascii=False)
    print("Conversion complete! Output written to case-notes.json.")