import re
import json

def parse_articles_bank(md_text):
    articles = {}
    current_id = None
    current = {}
    current_section = None
    lines = md_text.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        article_header = re.match(r'^##\s*([a-z0-9\-]+)', line)
        name = re.match(r'^name:\s*(.+)', line)
        title = re.match(r'^title:\s*(.+)', line)
        section_header = re.match(r'^###\s*([a-z0-9\-]+)', line)
        section_name = re.match(r'^name:\s*(.+)', line)
        section_title = re.match(r'^title:\s*(.+)', line)
        clauses = re.match(r'^clauses:', line)
        bullet = re.match(r'^\s*-\s*(.+)', line)

        if article_header:
            if current_id:
                if current_section:
                    current['sections'][current_section['id']] = {
                        'name': current_section['name'],
                        'title': current_section['title'],
                        'content': current_section['content']
                    }
                articles[current_id] = current
            current_id = article_header.group(1).strip()
            current = {'sections': {}}
            current_section = None
        elif name and not current_section:
            current['name'] = name.group(1).strip()
        elif title and not current_section:
            current['title'] = title.group(1).strip()
        elif section_header:
            # Save previous section if exists
            if current_section:
                current['sections'][current_section['id']] = {
                    'name': current_section['name'],
                    'title': current_section['title'],
                    'content': current_section['content']
                }
            current_section = {
                'id': section_header.group(1).strip(),
                'name': '',
                'title': '',
                'content': []
            }
        elif section_name and current_section:
            current_section['name'] = section_name.group(1).strip()
        elif section_title and current_section:
            current_section['title'] = section_title.group(1).strip()
        elif bullet and current_section:
            current_section['content'].append(bullet.group(1).strip())
        elif clauses:
            # Save last section if exists
            if current_section:
                current['sections'][current_section['id']] = {
                    'name': current_section['name'],
                    'title': current_section['title'],
                    'content': current_section['content']
                }
                current_section = None
            current['clauses'] = []
            i += 1
            while i < len(lines) and re.match(r'^\s*-\s*(.+)', lines[i]):
                bullet = re.match(r'^\s*-\s*(.+)', lines[i])
                if bullet:
                    current['clauses'].append(bullet.group(1).strip())
                i += 1
            i -= 1
        i += 1
    # Save last article and section
    if current_id:
        if current_section:
            current['sections'][current_section['id']] = {
                'name': current_section['name'],
                'title': current_section['title'],
                'content': current_section['content']
            }
        articles[current_id] = current
    return articles

if __name__ == "__main__":
    with open("articles-bank.md", "r", encoding="utf-8") as f:
        md_text = f.read()
    articles = parse_articles_bank(md_text)
    with open("articles-bank.json", "w", encoding="utf-8") as f:
        json.dump(articles, f, indent=2, ensure_ascii=False)
    print("Wrote articles-bank.json")