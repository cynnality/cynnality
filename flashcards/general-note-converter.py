import json
import re

def parse_md(md_text):
    slides = []
    lines = md_text.splitlines()
    slide = None
    stack = []
    last_vocab = None
    last_term = None

    def add_to_stack(item, indent):
        # Remove stack items with greater or equal indent
        while stack and stack[-1][0] >= indent:
            stack.pop()
        if stack:
            parent = stack[-1][1]
            if 'subitems' not in parent:
                parent['subitems'] = []
            parent['subitems'].append(item)
        else:
            slide['content'].append(item)
        stack.append((indent, item))

    for line in lines:
        h2 = re.match(r'^##\s+(.*)', line)
        h3 = re.match(r'^###\s+(.*)', line)
        h4 = re.match(r'^####\s+(.*)', line)
        vocab = re.match(r'^\s*-\s*vocab:\s*(.*)', line)
        vocdef = re.match(r'^\s*-\s*voc-def:\s*(.*)', line)
        term = re.match(r'^\s*-\s*term:\s*(.*)', line)
        termdef = re.match(r'^\s*-\s*term-def:\s*(.*)', line)
        termexample = re.match(r'^\s*-\s*term-example:\s*(.*)', line)
        ul = re.match(r'^(\s*)-\s+(.*)', line)
        if h2:
            if slide:
                slides.append(slide)
            slide = {'title': h2.group(1).strip(), 'content': []}
            stack = []
            last_vocab = None
            last_term = None
        elif h3:
            slide['content'].append({'type': 'subtopic', 'title': h3.group(1).strip(), 'details': []})
            stack = []
            last_vocab = None
            last_term = None
        elif h4:
            slide['content'].append({'type': 'detail', 'title': h4.group(1).strip(), 'details': []})
            stack = []
            last_vocab = None
            last_term = None
        elif vocab:
            item = {'type': 'vocab', 'word': vocab.group(1).strip()}
            slide['content'].append(item)
            last_vocab = item
            last_term = None
        elif vocdef and last_vocab:
            last_vocab['definition'] = vocdef.group(1).strip()
        elif term:
            item = {'type': 'term', 'term': term.group(1).strip()}
            slide['content'].append(item)
            last_term = item
            last_vocab = None
        elif termdef and last_term:
            last_term['definition'] = termdef.group(1).strip()
        elif termexample and last_term:
            if 'examples' not in last_term:
                last_term['examples'] = []
            last_term['examples'].append(termexample.group(1).strip())
        elif ul:
            indent = len(ul.group(1))
            item = {'text': ul.group(2).strip()}
            add_to_stack(item, indent)
            last_vocab = None
            last_term = None
        elif line.strip() == "":
            continue
        else:
            # Add as detail to last subtopic/detail if present
            if slide['content']:
                last = slide['content'][-1]
                if 'details' in last:
                    last['details'].append(line.strip())
            last_vocab = None
            last_term = None
    if slide:
        slides.append(slide)
    return slides

if __name__ == "__main__":
    with open("general-notes.md", "r", encoding="utf-8") as f:
        md_text = f.read()
    slides = parse_md(md_text)
    with open("general-notes.json", "w", encoding="utf-8") as f:
        json.dump(slides, f, indent=2, ensure_ascii=False)
    print("Conversion complete! Output written to general-notes.json.")