import json
from datetime import datetime

# Load data
with open('wnba-games.json', 'r', encoding='utf-8') as f:
    games = json.load(f)
with open('wnba-standings-combined.json', 'r', encoding='utf-8') as f:
    standings = json.load(f)
with open('wnba-teams.json', 'r', encoding='utf-8') as f:
    teams = json.load(f)

# Date range for the week
start_date = datetime.strptime("Tuesday, Jun 3, 2025", "%A, %b %d, %Y")
end_date = datetime.strptime("Tuesday, Jun 10, 2025", "%A, %b %d, %Y")

def parse_game_date(date_str):
    return datetime.strptime(date_str, "%A, %b %d, %Y")

def build_team_block(team_name, record, standings, teams):
    static = teams.get(team_name, {})
    stats = standings.get(team_name, {})
    conference = static.get("conference", "").lower()
    conf_label = f"{conference[0].upper()} - conference ranking" if conference else "conference ranking"
    return {
        "teamCode": static.get("teamCode", ""),
        "teamName": team_name,
        "conference": static.get("conference", ""),
        "favorite": static.get("favorite", False),
        "conferenceRanking": stats.get("conferenceRanking", ""),
        "overallRanking": stats.get("overallRanking", ""),
        "wlRecord": stats.get("wlRecord", record.strip("()")),
        "defaultContent": static.get("defaultContent", {}),
        "factsContent": [
            {"label": conf_label, "value": f"#{stats.get('conferenceRanking', '')}"},
            {"label": "overall ranking", "value": f"#{stats.get('overallRanking', '')}"},
            {"label": "W/L", "value": stats.get("wlRecord", record.strip('()'))}
        ]
    }

# Filter games for the week and build matchups
weekly_matchups = []
blurbs_outline = {}
for game in games:
    game_date = parse_game_date(game["date"])
    if start_date <= game_date <= end_date:
        home = build_team_block(game["home_team"]["name"], game["home_team"]["record"], standings, teams)
        away = build_team_block(game["away_team"]["name"], game["away_team"]["record"], standings, teams)
        matchup_id = f"{home['teamCode']}-{away['teamCode']}-{game_date.strftime('%Y-%m-%d')}"
        weekly_matchups.append({
            "id": matchup_id,
            "date": game["date"],
            "home": home,
            "away": away
        })
        # Add to blurbs outline
        blurbs_outline[matchup_id] = {
            "pregame": {
                "title": "",
                "content": ""
            },
            "postgame": {
                "title": "",
                "content": ""
            }
        }

# Output weekly matchups JSON
weekly_json = {"matchups": weekly_matchups}
with open('wnba-2025-week-05.json', 'w', encoding='utf-8') as f:
    json.dump(weekly_json, f, indent=2)
print(f"Saved wnba-2025-week-05.json with {len(weekly_matchups)} matchups.")

# Output matchup blurbs outline JSON
with open('matchup-blurbs-week-2025-05.json', 'w', encoding='utf-8') as f:
    json.dump(blurbs_outline, f, indent=2)
print(f"Saved matchup-blurbs-week-05.json outline for you to fill in.")