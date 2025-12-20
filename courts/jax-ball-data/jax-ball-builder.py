import json
import pathlib

BASE_DIR = pathlib.Path(__file__).parent
ROSTERS_DIR = BASE_DIR / "rosters"
TEAMS_DIR = BASE_DIR / "teams"
SCHEDULES_DIR = BASE_DIR / "schedules"
GAME_STATS_DIR = BASE_DIR / "game_stats"
GAME_STATS_JSON_DIR = BASE_DIR / "game_stats_json"


OUTPUT_FILE = BASE_DIR / "site_data.json"


def parse_frontmatter(md_text):
    if not md_text.startswith("---"):
        return {}, md_text

    _, raw_fm, body = md_text.split("---", 2)
    data = {}

    for line in raw_fm.splitlines():
        line = line.strip()
        if not line or ":" not in line:
            continue
        key, value = line.split(":", 1)
        data[key.strip()] = value.strip()

    return data, body.strip()


def build_team_object(flat):
    """Rebuilds nested team JSON from flat frontmatter keys"""

    team = {
        "team_id": flat.get("team_id"),
        "team_name": flat.get("team_name"),

        "competition": {
            "conference": {
                "name": flat.get("state_comp_name"),
                "short": flat.get("state_comp_short"),
                "url": flat.get("state_comp_url"),
            },
            "national": {
                "name": flat.get("national_comp_name"),
                "short": flat.get("national_comp_short"),
                "division": flat.get("national_comp_division"),
                "url": flat.get("national_comp_url"),
            }
        },

        "coaching_staff": {
            "head_coach": {
                "name": flat.get("head_coach_name")
            },
            "assistant_coaches": []
        },

        "branding": {
            "colors": {
                "primary": flat.get("branding_color_primary"),
                "secondary": flat.get("branding_color_secondary"),
                "accent": flat.get("branding_color_accent"),
            },
            "colors_url": flat.get("branding_colors_url")
        }
    }

    for i in range(1, 10):
        name = flat.get(f"assistant_coach_{i}_name")
        cid = flat.get(f"assistant_coach_{i}_id")
        if name:
            team["coaching_staff"]["assistant_coaches"].append({
                "id": cid,
                "name": name
            })

    return team


def parse_markdown_table(md_body):
    lines = [l.strip() for l in md_body.splitlines() if l.strip()]
    if len(lines) < 3:
        return []

    header = [h.strip() for h in lines[0].split("|")[1:-1]]
    rows = []

    for line in lines[2:]:
        values = [v.strip() for v in line.split("|")[1:-1]]
        rows.append(dict(zip(header, values)))

    return rows


def load_teams():
    teams = {}

    for md_file in TEAMS_DIR.glob("*.md"):
        text = md_file.read_text(encoding="utf-8")
        flat, _ = parse_frontmatter(text)

        team_id = flat.get("team_id")
        if not team_id:
            continue

        teams[team_id] = build_team_object(flat)

    return teams


def load_rosters():
    rosters = {}

    for md_file in ROSTERS_DIR.glob("*.md"):
        text = md_file.read_text(encoding="utf-8")
        frontmatter, body = parse_frontmatter(text)

        team_id = frontmatter.get("team_id")
        if not team_id:
            continue

        rows = parse_markdown_table(body)
        rosters.setdefault(team_id, []).extend(rows)

    return rosters

def load_game_stats_ids():
    """
    Collects all game_ids that have stats available
    (based on filenames like ju_01.md)
    """
    ids = set()

    if not GAME_STATS_DIR.exists():
        return ids

    for team_dir in GAME_STATS_DIR.iterdir():
        if not team_dir.is_dir():
            continue

        for md_file in team_dir.glob("*.md"):
            ids.add(md_file.stem)

    return ids

def load_schedules(game_stats_ids):
    games = []

    for md_file in SCHEDULES_DIR.glob("*.md"):
        text = md_file.read_text(encoding="utf-8")
        _, body = parse_frontmatter(text)

        rows = parse_markdown_table(body)

        for row in rows:
            game_id = row.get("game_id")
            if not game_id:
                continue

            games.append({
                "game_id": game_id,
                "team_id": game_id.split("_")[0],  # ju_03 → ju
                "date": row.get("date"),
                "venue": row.get("venue"),
                "opponent": row.get("opponent"),
                "location_city": row.get("location_city"),
                "location_state": row.get("location_state"),
                "arena": row.get("arena"),
                "event": row.get("event"),
                "result": row.get("result"),
                "team_score": row.get("team_score"),
                "opp_score": row.get("opp_score"),
                "box_score_url": row.get("box_score_url"),
                "has_stats": game_id in game_stats_ids
            })

    return games

def main():
    # ---------- SITE DATA ----------
    game_stats_ids = load_game_stats_ids()

    data = {
        "teams": load_teams(),
        "rosters": load_rosters(),
        "games": load_schedules(game_stats_ids)
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"✅ Site data built → {OUTPUT_FILE}")

    # ---------- GAME STATS ----------
    GAME_STATS_JSON_DIR.mkdir(exist_ok=True)

    for team_dir in GAME_STATS_DIR.iterdir():
        if not team_dir.is_dir():
            continue

        for md_file in team_dir.glob("*.md"):
            game_data = build_game_stats(md_file)

            game_id = game_data.get("game_id")
            if not game_id:
                continue

            out_path = GAME_STATS_JSON_DIR / f"{game_id}.json"
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(game_data, f, indent=2, ensure_ascii=False)

            print(f"🏀 Game stats built → {out_path.name}")

def split_md_sections(text):
    sections = {}
    current = None
    buffer = []

    for line in text.splitlines():
        if line.startswith("## "):
            if current:
                sections[current] = "\n".join(buffer).strip()
            current = line[3:].strip().lower().replace(" ", "_")
            buffer = []
        else:
            buffer.append(line)

    if current:
        sections[current] = "\n".join(buffer).strip()

    return sections

def load_table_safe(md_text):
    try:
        return parse_markdown_table(md_text)
    except Exception:
        return []
    
def extract_period_scores(row):
    scores = []
    for k, v in row.items():
        if k.startswith("q") or k == "ot":
            val = safe_int(v)
            if val is not None:
                scores.append(val)
    return scores

    
def safe_int(value):
    """
    Convert a value to int if possible.
    Returns None if conversion fails.
    """
    if value is None:
        return None

    value = value.strip()

    if value == "":
        return None

    # Remove common non-numeric characters
    value = value.replace("%", "")
    value = value.replace("–", "-")

    try:
        return int(value)
    except ValueError:
        return None


def build_game_stats(md_path):
    text = md_path.read_text(encoding="utf-8")
    frontmatter, body = parse_frontmatter(text)

    sections = split_md_sections(body)

    game_id = frontmatter.get("game_id")
    team_id = frontmatter.get("team_id")

    data = {
        "game_id": game_id,
        "team_id": team_id,
        "score_by_period": {},
        "players": { "home": [], "away": [] },
        "team_stats": { "home": {}, "away": {} }
    }

    # Score by period
    if "score_by_period" in sections:
        rows = load_table_safe(sections["score_by_period"])
        if len(rows) >= 2:
            data["score_by_period"]["away"] = extract_period_scores(rows[0])
            data["score_by_period"]["home"] = extract_period_scores(rows[1])


    # Players
    player_sections = [k for k in sections if k.endswith("_player_stats")]

    if len(player_sections) >= 1:
        data["players"]["home"] = load_table_safe(sections[player_sections[0]])

    if len(player_sections) >= 2:
        data["players"]["away"] = load_table_safe(sections[player_sections[1]])

    # Team stats
    team_stat_sections = [k for k in sections if k.endswith("_team_stats")]

    if len(team_stat_sections) >= 1:
        for row in load_table_safe(sections[team_stat_sections[0]]):
            val = safe_int(row.get("value"))
            if val is not None:
                data["team_stats"]["home"][row["stat"]] = val

    if len(team_stat_sections) >= 2:
        for row in load_table_safe(sections[team_stat_sections[1]]):
            val = safe_int(row.get("value"))
            if val is not None:
                data["team_stats"]["away"][row["stat"]] = val

    return data

if __name__ == "__main__":
    main()