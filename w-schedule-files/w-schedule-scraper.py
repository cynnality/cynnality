from bs4 import BeautifulSoup
import json
from datetime import datetime

DATE_HEADER_CLASS = "GameSection_date__1Jkgq"
DATE_HEADING_CLASS = "GameSection_dateHeading__m5d5a"
GAME_BLOCK_CLASS = "GameTile"
SCOREBOARD_CLASS = "_GameTile__scoreboard_12tan_52"
TEAM_NAME_CLASS = "_TeamName__name_1k5qz_11"
TEAM_RECORD_CLASS = "_GameTile__team__record_12tan_82"
TIME_CLASS = "_GameTile__date__time_12tan_141"


START_DATE = datetime(2025, 7, 19)
END_DATE = datetime(2025, 7, 29)

with open('jul19-jul29-w-schedule.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')

games = []
current_date = None

for elem in soup.find_all(['header', 'div']):
    # Date header
    if elem.name == 'header' and DATE_HEADER_CLASS in elem.get('class', []):
        date_heading = elem.find('h2', class_=DATE_HEADING_CLASS)
        if date_heading:
            current_date = date_heading.text.strip()
    # Game block
    elif elem.name == 'div' and GAME_BLOCK_CLASS in elem.get('class', []):
        scoreboard = elem.find('div', class_=SCOREBOARD_CLASS)
        if scoreboard and current_date:
            teams = scoreboard.find_all('div', class_="_GameTile__team_12tan_60")
            # Find game time if present
            time_span = elem.find('span', class_=TIME_CLASS)
            game_time = time_span.text.strip() if time_span else ""
            if len(teams) == 2:
                away_team_name = teams[0].find('p', class_=TEAM_NAME_CLASS)
                away_team_record = teams[0].find('span', class_=TEAM_RECORD_CLASS)
                home_team_name = teams[1].find('p', class_=TEAM_NAME_CLASS)
                home_team_record = teams[1].find('span', class_=TEAM_RECORD_CLASS)
                # Parse date to filter
                try:
                    game_date = datetime.strptime(current_date, "%A, %b %d, %Y")
                except Exception:
                    continue
                if START_DATE <= game_date <= END_DATE:
                    games.append({
                        "date": current_date,
                        "time": game_time,
                        "away_team": {
                            "name": away_team_name.text.strip() if away_team_name else "",
                            "record": away_team_record.text.strip() if away_team_record else ""
                        },
                        "home_team": {
                            "name": home_team_name.text.strip() if home_team_name else "",
                            "record": home_team_record.text.strip() if home_team_record else ""
                        }
                    })

with open('w-schedule-jul19-29.json', 'w', encoding='utf-8') as f:
    json.dump(games, f, indent=2)
print(f"Saved {len(games)} games to w-schedule-jul19-29.json")