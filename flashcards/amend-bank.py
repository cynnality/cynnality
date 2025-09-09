import re
import json

def parse_amendment_bank(md_text):
    amendments = {}
    current_id = None
    current = {}
    current_field = None
    lines = md_text.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        header = re.match(r'^##\s*([a-z0-9\-]+)', line)
        name = re.match(r'^name:\s*(.+)', line)
        year = re.match(r'^year:\s*(.*)', line)
        title = re.match(r'^title:\s*(.+)', line)
        definition = re.match(r'^definition:\s*(.*)', line)
        clauses = re.match(r'^clauses:', line)
        cases = re.match(r'^cases:', line)
        bullet = re.match(r'^\s*-\s*(.+)', line)

        if header:
            if current_id:
                amendments[current_id] = current
            current_id = header.group(1).strip()
            current = {}
            current_field = None
        elif name:
            current['name'] = name.group(1).strip()
        elif year:
            current['year'] = year.group(1).strip()
        elif title:
            current['title'] = title.group(1).strip()
        elif definition:
            # Handle multi-line definitions
            def_lines = [definition.group(1).strip()]
            i += 1
            while i < len(lines) and not re.match(r'^(clauses:|cases:|##\s*[a-z0-9\-]+)', lines[i]):
                def_lines.append(lines[i].strip())
                i += 1
            current['definition'] = ' '.join(def_lines).strip()
            i -= 1  # step back so outer loop doesn't skip a line
        elif clauses:
            current['clauses'] = []
            i += 1
            while i < len(lines) and re.match(r'^\s*-\s*(.+)', lines[i]):
                bullet = re.match(r'^\s*-\s*(.+)', lines[i])
                if bullet:
                    current['clauses'].append(bullet.group(1).strip())
                i += 1
            i -= 1
        elif cases:
            current['cases'] = []
            i += 1
            while i < len(lines) and re.match(r'^\s*-\s*(.+)', lines[i]):
                bullet = re.match(r'^\s*-\s*(.+)', lines[i])
                if bullet:
                    current['cases'].append(bullet.group(1).strip())
                i += 1
            i -= 1
        i += 1
    if current_id:
        amendments[current_id] = current
    return amendments

if __name__ == "__main__":
    with open("amendment-bank.md", "r", encoding="utf-8") as f:
        md_text = f.read()
    amendments = parse_amendment_bank(md_text)
    with open("amendment-bank.json", "w", encoding="utf-8") as f:
        json.dump(amendments, f, indent=2, ensure_ascii=False)
    print("Wrote amendment-bank.json")