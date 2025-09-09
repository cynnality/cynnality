import re
import json

def parse_con_elem_bank(md_text):
    elements = {}
    current_id = None
    current = {}
    lines = md_text.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        header = re.match(r'^##\s*([a-z0-9\-]+)', line)
        name = re.match(r'^name:\s*(.+)', line)
        article = re.match(r'^article:\s*(.+)', line)
        amendment = re.match(r'^amendment:\s*(.+)', line)
        definition = re.match(r'^definition:\s*(.*)', line)
        cases = re.match(r'^cases:', line)
        bullet = re.match(r'^\s*-\s*(.+)', line)

        if header:
            if current_id:
                elements[current_id] = current
            current_id = header.group(1).strip()
            current = {}
        elif name:
            current['name'] = name.group(1).strip()
        elif article:
            current['article'] = article.group(1).strip()
        elif amendment:
            current['amendment'] = amendment.group(1).strip()
        elif definition:
            # Handle multi-line definitions
            def_lines = [definition.group(1).strip()]
            i += 1
            while i < len(lines) and not re.match(r'^(cases:|##\s*[a-z0-9\-]+)', lines[i]):
                def_lines.append(lines[i].strip())
                i += 1
            current['definition'] = ' '.join(def_lines).strip()
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
        elements[current_id] = current
    return elements

if __name__ == "__main__":
    with open("con-elem-bank.md", "r", encoding="utf-8") as f:
        md_text = f.read()
    elements = parse_con_elem_bank(md_text)
    with open("con-elem-bank.json", "w", encoding="utf-8") as f:
        json.dump(elements, f, indent=2, ensure_ascii=False)
    print("Wrote con-elem-bank.json")