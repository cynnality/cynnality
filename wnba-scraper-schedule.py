from bs4 import BeautifulSoup
import json

with open('WNBA Schedule - Games, Scores & Events ｜ WNBA (6_3_2025 2：32：42 AM).html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')

games = []
current_date = None

# Get all date headers and game blocks in order
for elem in soup.find_all(['header', 'div']):
    # Check for date header
    if elem.name == 'header' and 'GameSection_date__1Jkgq' in elem.get('class', []):
        date_heading = elem.find('h2', class_='GameSection_dateHeading__m5d5a')
        if date_heading:
            current_date = date_heading.text.strip()
    # Check for game block
    elif elem.name == 'div' and '_GameTile__scoreboard_1y4oh_52' in elem.get('class', []):
        team_names = elem.find_all('p', class_='_TeamName__name_1k5qz_11')
        team_records = elem.find_all('span', class_='_GameTile__team__record_1y4oh_82')
        if len(team_names) == 2 and len(team_records) == 2:
            away_team = team_names[0].text.strip()
            away_record = team_records[0].text.strip()
            home_team = team_names[1].text.strip()
            home_record = team_records[1].text.strip()
            games.append({
                "date": current_date,
                "away_team": {"name": away_team, "record": away_record},
                "home_team": {"name": home_team, "record": home_record}
            })

json_data = json.dumps(games, indent=2)
print(json_data)

with open('wnba-games.json', 'w', encoding='utf-8') as f:
    f.write(json_data)
print("Saved to wnba-games.json")