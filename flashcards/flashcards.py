import re
import json

def parse_markdown(md_text):
    slides = []
    slide = None
    flashcards = []

    lines = md_text.splitlines()
    card = None
    for line in lines:
        # Slide title
        slide_title_match = re.match(r'^##\s+(.*)', line)
        if slide_title_match:
            if slide:
                slide['flashcards'] = flashcards
                slides.append(slide)
            slide = {'title': slide_title_match.group(1), 'id': None}
            flashcards = []
            continue

        # Slide id
        slide_id_match = re.match(r'^- id:\s*(.*)', line)
        if slide_id_match and slide:
            slide['id'] = slide_id_match.group(1).strip()
            continue

        # Flashcard Q
        q_match = re.match(r'^- Q:\s*(.*)', line)
        if q_match:
            card = {
                'front': q_match.group(1).strip(),
                'back': '',
                'mode': [],
                'level': '',
                'subject': [],
                'year': None,
                'tags': [],
                'slides': []
            }
            flashcards.append(card)
            continue

        # Flashcard A
        a_match = re.match(r'^\s*A:\s*(.*)', line)
        if a_match and card:
            card['back'] = a_match.group(1).strip()
            continue

        # Mode
        mode_match = re.match(r'^\s*Mode:\s*(.*)', line)
        if mode_match and card:
            card['mode'] = [m.strip() for m in mode_match.group(1).split(',')]
            continue

        # Level
        level_match = re.match(r'^\s*Level:\s*(.*)', line)
        if level_match and card:
            level_str = level_match.group(1).strip()
            if level_str:
                card['level'] = int(level_str)
            else:
                card['level'] = ''
            continue

        # Subject
        subject_match = re.match(r'^\s*Subject:\s*(.*)', line)
        if subject_match and card:
            card['subject'] = [s.strip() for s in subject_match.group(1).split(',')]
            continue

        # Year
        year_match = re.match(r'^\s*Year:\s*(.*)', line)
        if year_match and card:
            year_str = year_match.group(1).strip()
            try:
                card['year'] = int(year_str)
            except ValueError:
                card['year'] = year_str
            continue

        # Tags
        tags_match = re.match(r'^\s*Tags:\s*(.*)', line)
        if tags_match and card:
            tags = [t.strip() for t in tags_match.group(1).split(',')]
            card['tags'] = tags
            continue

        # Slides
        slides_match = re.match(r'^\s*Slides:\s*(.*)', line)
        if slides_match and card:
            slides_str = slides_match.group(1).strip()
            if slides_str:
                card['slides'] = [s.strip() for s in slides_str.split(',')]
            else:
                card['slides'] = []
            continue

    # Add last slide
    if slide:
        slide['flashcards'] = flashcards
        slides.append(slide)

    return {'slides': slides}

if __name__ == "__main__":
    with open("american-gov-questions.md", "r", encoding="utf-8") as f:
        md_text = f.read()

    data = parse_markdown(md_text)

    with open("american-gov-questions.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print("Conversion complete! Output written to american-gov-questions.json.") 