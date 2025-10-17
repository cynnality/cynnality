import re
import json

def parse_list(lines, start_idx):
    items = []
    i = start_idx
    while i < len(lines):
        line = lines[i]
        if line.strip().startswith('-'):
            item = {}
            # Parse key-value pairs in the list item
            while i < len(lines) and (lines[i].strip().startswith('-') or re.match(r'\s+\w+:', lines[i])):
                l = lines[i].strip().lstrip('-').strip()
                if l:
                    if ':' in l:
                        k, v = l.split(':', 1)
                        k = k.strip()
                        v = v.strip()
                        # Handle arrays
                        if v.startswith('[') and v.endswith(']'):
                            v = json.loads(v.replace("'", '"'))
                        elif v.lower() == 'true':
                            v = True
                        elif v.lower() == 'false':
                            v = False
                        elif v == 'N/A':
                            v = v
                        elif v.isdigit():
                            v = int(v)
                        item[k] = v
                i += 1
            items.append(item)
        else:
            break
    return items, i

def parse_player_block(block):
    lines = [line for line in block.strip().split('\n') if line.strip()]
    player = {}
    i = 0
    while i < len(lines):
        line = lines[i]
        if ':' in line:
            key, value = line.split(':', 1)
            key = key.strip()
            value = value.strip()
            # Handle lists
            if key == 'teamHistory':
                items, next_i = parse_list(lines, i + 1)
                player[key] = items
                i = next_i - 1
            # Handle arrays
            elif value.startswith('[') and value.endswith(']'):
                player[key] = json.loads(value.replace("'", '"'))
            # Handle booleans
            elif value.lower() == 'true':
                player[key] = True
            elif value.lower() == 'false':
                player[key] = False
            elif value == 'N/A':
                player[key] = value
            elif value.isdigit():
                player[key] = int(value)
            else:
                player[key] = value
        i += 1
    return player

def md_to_json(md_path, json_path):
    with open(md_path, 'r') as f:
        content = f.read()
    blocks = [b for b in content.split('---') if b.strip()]
    players = {}
    for block in blocks:
        player = parse_player_block(block)
        name = player.get('name')
        if name:
            players[name] = player
    with open(json_path, 'w') as f:
        json.dump(players, f, indent=4)

# Usage
md_to_json('pro-players.md', 'players_pro.json')