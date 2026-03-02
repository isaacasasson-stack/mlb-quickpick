#!/usr/bin/env python3
"""
Build players.json from Lahman data (1980-2021) + Fangraphs fielding data (2022-2025).

New data model - each player has a 'seasons' array of per-season objects:
  { year: 2011, team: "MIN", positions: ["RF", "LF"] }

This lets the puzzle engine check team + position + year all against the SAME season record,
eliminating false positives from players who played RF for one team in year X and
were on MIN in year X for a different position.

Rules:
- A player counts for a position/team/year only if they played >= MIN_GAMES at that position
  for that team in that year.
- SP/RP split: SP if GS/G_p >= 0.5, else RP
"""

import json
import re
import sys
import warnings
import pandas as pd
from collections import defaultdict

warnings.filterwarnings('ignore')

MIN_GAMES = 5
MIN_YEAR  = 1980
MAX_YEAR  = 2025

TEAM_MAP = {
    'ANA': 'LAA', 'CAL': 'LAA', 'MON': 'WSN', 'FLO': 'MIA',
    'TBA': 'TBR', 'KCA': 'KCR', 'CHA': 'CHW', 'CHN': 'CHC',
    'SLN': 'STL', 'LAN': 'LAD', 'SFN': 'SFG', 'NYN': 'NYM',
    'NYA': 'NYY', 'SDN': 'SDP', 'FLA': 'MIA',
    'MIL': 'MIL', 'MIN': 'MIN', 'PHI': 'PHI', 'PIT': 'PIT',
    'CIN': 'CIN', 'ATL': 'ATL', 'HOU': 'HOU', 'DET': 'DET',
    'CLE': 'CLE', 'BAL': 'BAL', 'BOS': 'BOS', 'OAK': 'OAK',
    'SEA': 'SEA', 'TEX': 'TEX', 'TOR': 'TOR', 'WSN': 'WSN',
    'MIA': 'MIA', 'LAA': 'LAA', 'TBR': 'TBR', 'KCR': 'KCR',
    'CHW': 'CHW', 'CHC': 'CHC', 'STL': 'STL', 'LAD': 'LAD',
    'SFG': 'SFG', 'NYM': 'NYM', 'NYY': 'NYY', 'SDP': 'SDP',
    'COL': 'COL', 'ARI': 'ARI',
}

def normalize_team(code):
    c = str(code).strip().upper()
    return TEAM_MAP.get(c, c)

def slugify(name):
    s = name.lower()
    s = s.replace('.', '').replace("'", '').replace('-', ' ')
    s = re.sub(r'[^a-z0-9 ]', '', s)
    return re.sub(r'\s+', '-', s.strip())

def make_unique_id(name, existing_ids):
    base = slugify(name)
    if base not in existing_ids:
        return base
    i = 2
    while f"{base}-{i}" in existing_ids:
        i += 1
    return f"{base}-{i}"

# ── STEP 1: Load Lahman 1980-2021 ───────────────────────────────────────────
print("Loading Lahman data...")
app = pd.read_csv('/tmp/Appearances.csv')
people = pd.read_csv('/tmp/People.csv')

people['fullName'] = (people['nameFirst'].fillna('') + ' ' + people['nameLast'].fillna('')).str.strip()
name_lookup = people.set_index('playerID')['fullName'].to_dict()

app = app[(app['yearID'] >= MIN_YEAR) & (app['yearID'] <= 2021)].copy()
game_cols = ['G_p','G_c','G_1b','G_2b','G_3b','G_ss','G_lf','G_cf','G_rf','G_dh','GS','G_all']
for col in game_cols:
    if col in app.columns:
        app[col] = app[col].fillna(0).astype(int)

print("Processing Lahman appearances...")

# player_seasons: name -> { (year, team) -> set of positions }
player_seasons = defaultdict(lambda: defaultdict(set))

for _, row in app.iterrows():
    pid = row['playerID']
    name = name_lookup.get(pid, '').strip()
    if not name:
        continue
    year = int(row['yearID'])
    team = normalize_team(row['teamID'])
    key = (year, team)

    gp = int(row['G_p'])
    gs = int(row.get('GS', 0))
    if gp >= MIN_GAMES:
        pos = 'SP' if gp > 0 and gs / gp >= 0.5 else 'RP'
        player_seasons[name][key].add(pos)

    if row['G_c']  >= MIN_GAMES: player_seasons[name][key].add('C')
    if row['G_1b'] >= MIN_GAMES: player_seasons[name][key].add('1B')
    if row['G_2b'] >= MIN_GAMES: player_seasons[name][key].add('2B')
    if row['G_3b'] >= MIN_GAMES: player_seasons[name][key].add('3B')
    if row['G_ss'] >= MIN_GAMES: player_seasons[name][key].add('SS')
    if row['G_lf'] >= MIN_GAMES: player_seasons[name][key].add('LF')
    if row['G_cf'] >= MIN_GAMES: player_seasons[name][key].add('CF')
    if row['G_rf'] >= MIN_GAMES: player_seasons[name][key].add('RF')
    if row['G_dh'] >= MIN_GAMES: player_seasons[name][key].add('DH')

print(f"  Lahman: {sum(len(v) for v in player_seasons.values())} season-records for {len(player_seasons)} players")

# ── STEP 2: Fetch Fangraphs 2022-2025 ───────────────────────────────────────
print("Fetching Fangraphs data 2022-2025...")
try:
    import pybaseball
    pybaseball.cache.enable()
except:
    pass

for year in range(2022, MAX_YEAR + 1):
    print(f"  Year {year}...")

    # Fielding
    try:
        df = pybaseball.fielding_stats(year, year, qual=1)
        pos_map = {'C':'C','1B':'1B','2B':'2B','3B':'3B','SS':'SS','LF':'LF','CF':'CF','RF':'RF','DH':'DH'}
        for _, row in df.iterrows():
            pos = str(row.get('Pos','')).strip()
            if pos not in pos_map:
                continue
            name = str(row.get('Name','')).strip()
            team = normalize_team(str(row.get('Team','')))
            g = int(row.get('G', 0))
            if name and g >= MIN_GAMES:
                player_seasons[name][(year, team)].add(pos_map[pos])
    except Exception as e:
        print(f"    fielding {year} failed: {e}")

    # Pitching
    try:
        pdf = pybaseball.pitching_stats(year, year, qual=1)
        for _, row in pdf.iterrows():
            name = str(row.get('Name','')).strip()
            team = normalize_team(str(row.get('Team','')))
            g = int(row.get('G', 0))
            gs = int(row.get('GS', 0))
            if name and g >= MIN_GAMES:
                pos = 'SP' if g > 0 and gs / g >= 0.5 else 'RP'
                player_seasons[name][(year, team)].add(pos)
    except Exception as e:
        print(f"    pitching {year} failed: {e}")

    # DH via batting_stats (position column)
    try:
        bdf = pybaseball.batting_stats(year, year, qual=1)
        for _, row in bdf.iterrows():
            pos_str = str(row.get('Pos', '')).strip()
            if 'DH' not in pos_str:
                continue
            name = str(row.get('Name','')).strip()
            team = normalize_team(str(row.get('Team','')))
            g = int(row.get('G', 0))
            if name and g >= MIN_GAMES:
                player_seasons[name][(year, team)].add('DH')
    except Exception as e:
        print(f"    batting/DH {year} failed: {e}")

print(f"Total: {len(player_seasons)} players")

# ── STEP 3: Build final JSON with per-season records ────────────────────────
print("Serializing...")
players = []
existing_ids = set()

for name in sorted(player_seasons.keys()):
    season_map = player_seasons[name]
    if not season_map:
        continue

    pid = make_unique_id(name, existing_ids)
    existing_ids.add(pid)

    seasons_list = []
    for (year, team), positions in sorted(season_map.items()):
        if positions:
            seasons_list.append({
                'year': year,
                'team': team,
                'positions': sorted(positions),
            })

    players.append({
        'id': pid,
        'name': name,
        'seasons': seasons_list,
    })

output_path = '/Users/isaacsasson/Desktop/mlb-trivia/public/players.json'
with open(output_path, 'w') as f:
    json.dump(players, f, separators=(',', ':'))

size_kb = len(open(output_path).read()) / 1024
print(f"\nDone! {len(players)} players, {size_kb:.0f} KB -> {output_path}")

# ── Sanity checks ────────────────────────────────────────────────────────────
all_years = set()
for p in players:
    for s in p['seasons']:
        all_years.add(s['year'])
print(f"Year range: {min(all_years)} – {max(all_years)}")

# 2011 MIN RF
min_rf_2011 = [
    p['name'] for p in players
    if any(s['year'] == 2011 and s['team'] == 'MIN' and 'RF' in s['positions']
           for s in p['seasons'])
]
print(f"\n2011 Twins RF ({len(min_rf_2011)} players): {sorted(min_rf_2011)}")

# 2022+ sample
recent = [p['name'] for p in players if any(s['year'] >= 2022 for s in p['seasons'])]
print(f"\nPlayers with 2022+ data: {len(recent)}")
print(f"Sample 2024 players: {recent[:10]}")
