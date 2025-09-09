import json
import re

def parse_attribute_bank(md_text):
    lookup = {}
    current_section = None
    current_tag = None
    for line in md_text.splitlines():
        section = re.match(r'^##\s*([a-z\-]+)', line)
        tag = re.match(r'^\s*-\s*([a-z0-9\-]+)\s*$', line)
        mapping = re.match(r'^\s*-\s*([a-z0-9\-]+):\s*(.+)', line)
        subitem = re.match(r'^\s*-\s*([a-z]+):\s*(.+)', line)
        if section:
            current_section = section.group(1).strip()
            if current_section not in lookup:
                lookup[current_section] = {}
            current_tag = None
        elif tag and current_section == "con-elem":
            current_tag = tag.group(1).strip()
            lookup[current_section][current_tag] = {}
        elif subitem and current_section == "con-elem" and current_tag:
            key, value = subitem.groups()
            lookup[current_section][current_tag][key.strip()] = value.strip()
        elif mapping and current_section and current_section != "con-elem":
            tag, display = mapping.groups()
            lookup[current_section][tag.strip()] = display.strip()
    return lookup

if __name__ == "__main__":
    with open("case-attribute-bank.md", "r", encoding="utf-8") as f:
        md_text = f.read()
    lookup = parse_attribute_bank(md_text)
    with open("case-attribute-bank.json", "w", encoding="utf-8") as f:
        json.dump(lookup, f, indent=2, ensure_ascii=False)
    print("Wrote case-attribute-bank.json")