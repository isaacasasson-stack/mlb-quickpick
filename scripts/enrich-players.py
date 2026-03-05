#!/usr/bin/env python3
"""
Cross-references players.json against the MLB Stats API to find and fill
missing seasons in the 2022-2025 window. Writes proposed changes to
scripts/enrich-proposals.json for review before applying.
"""

import json, urllib.request, urllib.parse, time, sys

# MLB Stats API team abbreviation overrides (API abbr → our dataset abbr)
TEAM_ABBR_OVERRIDE = {
    'KC':  'KCR',
    'AZ':  'ARI',
    'WSH': 'WSN',
    'CWS': 'CHW',
    'SD':  'SDP',
    'SF':  'SFG',
    'TB':  'TBR',
}

def fetch(url, retries=3):
    for i in range(retries):
        try:
            with urllib.request.urlopen(url, timeout=15) as r:
                return json.load(r)
        except Exception as e:
            if i == retries - 1:
                raise
            time.sleep(1)

# Build team id → our abbreviation map once
def build_team_map():
    team_map = {}
    for season in range(2022, 2026):
        data = fetch(f'https://statsapi.mlb.com/api/v1/teams?sportId=1&season={season}')
        for t in data['teams']:
            abbr = t.get('abbreviation', '')
            abbr = TEAM_ABBR_OVERRIDE.get(abbr, abbr)
            team_map[t['id']] = abbr
    return team_map

def search_player(name):
    encoded = urllib.parse.quote(name)
    data = fetch(f'https://statsapi.mlb.com/api/v1/people/search?names={encoded}&sportId=1')
    people = data.get('people', [])
    for p in people:
        if p['fullName'].lower() == name.lower():
            return p['id']
    return people[0]['id'] if people else None

def get_api_seasons(mlb_id, team_map):
    """Returns dict of (year, team_abbr) -> set of positions from the API."""
    seasons = {}

    for group in ['hitting', 'pitching', 'fielding']:
        try:
            url = (f'https://statsapi.mlb.com/api/v1/people/{mlb_id}'
                   f'?hydrate=stats(group={group},type=yearByYear,sportId=1)')
            data = fetch(url)
            person = data['people'][0]
            for stat_group in person.get('stats', []):
                for split in stat_group.get('splits', []):
                    if split.get('sport', {}).get('id') != 1:
                        continue
                    if split.get('gameType') != 'R':
                        continue
                    yr = int(split['season'])
                    if yr < 2022 or yr > 2025:
                        continue
                    team_id = split.get('team', {}).get('id')
                    team = team_map.get(team_id, '')
                    if not team:
                        continue
                    key = (yr, team)
                    if key not in seasons:
                        seasons[key] = set()
                    if group == 'fielding':
                        pos = split.get('position', {}).get('abbreviation', '')
                        if pos in ('SP','RP','C','1B','2B','3B','SS','LF','CF','RF','OF','DH'):
                            seasons[key].add(pos)
                    elif group == 'pitching':
                        gs = split['stat'].get('gamesStarted', 0)
                        g  = split['stat'].get('gamesPitched', split['stat'].get('gamesPlayed', 0))
                        if gs >= 5:
                            seasons[key].add('SP')
                        if (g - gs) >= 5:
                            seasons[key].add('RP')
                        # If pitched but neither threshold met, still record they were a pitcher
                        if g > 0 and not seasons[key]:
                            seasons[key].add('RP' if gs == 0 else 'SP')
        except Exception:
            pass

    return seasons

def main():
    with open('public/players.json') as f:
        players = json.load(f)

    print('Building team ID map...', flush=True)
    team_map = build_team_map()

    # Build flagged list: bracketed gaps in 2022-2024
    flagged = []
    for p in players:
        years = sorted(set(s['year'] for s in p['seasons']))
        if not years or max(years) < 2024:
            continue
        for yr in range(2022, 2025):
            if yr not in years and (yr - 1) in years and (yr + 1) in years:
                flagged.append(p['name'])
                break

    flagged = sorted(set(flagged))
    print(f'Flagged players to check: {len(flagged)}\n', flush=True)

    proposals = []
    not_found = []

    for i, name in enumerate(flagged):
        print(f'[{i+1}/{len(flagged)}] {name}...', end=' ', flush=True)
        try:
            mlb_id = search_player(name)
            if not mlb_id:
                print('NOT FOUND')
                not_found.append(name)
                continue

            api_seasons = get_api_seasons(mlb_id, team_map)

            our_player = next(p for p in players if p['name'] == name)
            our_keys = {(s['year'], s['team']) for s in our_player['seasons']}

            missing = []
            for (yr, team), positions in sorted(api_seasons.items()):
                if (yr, team) not in our_keys and positions:
                    missing.append({
                        'year': yr,
                        'team': team,
                        'positions': sorted(positions)
                    })

            if missing:
                proposals.append({
                    'name': name,
                    'id': our_player['id'],
                    'mlb_id': mlb_id,
                    'missing_seasons': missing,
                })
                summary = [str(s['year']) + ' ' + s['team'] + ' ' + str(s['positions']) for s in missing]
                print('MISSING: ' + str(summary))
            else:
                print('ok')

            time.sleep(0.15)
        except Exception as e:
            print(f'ERROR: {e}')
            not_found.append(name)

    with open('scripts/enrich-proposals.json', 'w') as f:
        json.dump({'proposals': proposals, 'not_found': not_found}, f, indent=2)

    print(f'\nDone. {len(proposals)} players with missing seasons, {len(not_found)} not found.')
    print('Review scripts/enrich-proposals.json, then run enrich-apply.py')

if __name__ == '__main__':
    main()
