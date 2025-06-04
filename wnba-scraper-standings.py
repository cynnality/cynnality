from bs4 import BeautifulSoup
import json
import re

def clean_team_name(name):
    # Remove all newlines and extra spaces
    return re.sub(r'\s+', ' ', name).strip()

def parse_standings(filename, ranking_key):
    with open(filename, 'r', encoding='utf-8') as f:
        html = f.read()
    soup = BeautifulSoup(html, 'html.parser')
    standings = {}
    for row in soup.find_all('tr'):
        team_name_tag = row.find('p', class_='_TeamName__name_1k5qz_11')
        if not team_name_tag:
            continue
        team_name = clean_team_name(team_name_tag.text)
        cells = row.find_all('td')
        if len(cells) < 3:
            continue
        ranking_span = cells[0].find('span')
        ranking = int(ranking_span.text.strip()) if ranking_span else None
        wins = cells[1].text.strip()
        losses = cells[2].text.strip()
        wl_record = f"{wins}-{losses}"
        standings[team_name] = {
            "wlRecord": wl_record,
            ranking_key: ranking
        }
    return standings

def parse_conference_standings(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        html = f.read()
    soup = BeautifulSoup(html, 'html.parser')
    standings = {}
    conference_tables = soup.find_all('table')
    for table in conference_tables:
        rows = table.find_all('tr')
        rank = 1
        for row in rows:
            team_name_tag = row.find('p', class_='_TeamName__name_1k5qz_11')
            if not team_name_tag:
                continue
            team_name = clean_team_name(team_name_tag.text)
            cells = row.find_all('td')
            if len(cells) < 3:
                continue
            wins = cells[1].text.strip()
            losses = cells[2].text.strip()
            wl_record = f"{wins}-{losses}"
            standings[team_name] = {
                "wlRecord": wl_record,
                "conferenceRanking": rank
            }
            rank += 1
    return standings

# Parse both files
overall = parse_standings('wnba-overall-standings-table.html', 'overallRanking')
conference = parse_conference_standings('wnba-conference-standings-table.html')

# Merge by team name
combined = {}
for team, data in overall.items():
    combined[team] = data
    if team in conference:
        combined[team]['conferenceRanking'] = conference[team]['conferenceRanking']

for team, data in conference.items():
    if team not in combined:
        combined[team] = data

# Save to JSON
with open('wnba-standings-combined.json', 'w', encoding='utf-8') as f:
    json.dump(combined, f, indent=2)

print(json.dumps(combined, indent=2))