#!/usr/bin/env python3
"""
Finds players whose last recorded season is 2024 and checks if they
played in 2025 via the MLB Stats API. Patches players.json directly.
"""
import json, urllib.request, urllib.parse, time

TEAM_ABBR_OVERRIDE = {
    'KC': 'KCR', 'AZ': 'ARI', 'WSH': 'WSN', 'CWS': 'CHW',
    'SD': 'SDP', 'SF': 'SFG', 'TB': 'TBR',
}

def fetch(url, retries=3):
    for i in range(retries):
        try:
            with urllib.request.urlopen(url, timeout=15) as r:
                return json.load(r)
        except Exception as e:
            if i == retries - 1: raise
            time.sleep(1)

def build_team_map():
    data = fetch('https://statsapi.mlb.com/api/v1/teams?sportId=1&season=2025')
    return {t['id']: TEAM_ABBR_OVERRIDE.get(t['abbreviation'], t['abbreviation'])
            for t in data['teams']}

def search_player(name):
    data = fetch(f'https://statsapi.mlb.com/api/v1/people/search?names={urllib.parse.quote(name)}&sportId=1')
    people = data.get('people', [])
    for p in people:
        if p['fullName'].lower() == name.lower():
            return p['id']
    return people[0]['id'] if people else None

def get_2025_seasons(mlb_id, team_map):
    seasons = {}
    for group in ['hitting', 'pitching', 'fielding']:
        try:
            url = (f'https://statsapi.mlb.com/api/v1/people/{mlb_id}'
                   f'?hydrate=stats(group={group},type=yearByYear,sportId=1)')
            data = fetch(url)
            for stat_group in data['people'][0].get('stats', []):
                for split in stat_group.get('splits', []):
                    if split.get('sport', {}).get('id') != 1: continue
                    if split.get('gameType') != 'R': continue
                    if int(split['season']) != 2025: continue
                    team = team_map.get(split.get('team', {}).get('id'), '')
                    if not team: continue
                    key = team
                    if key not in seasons: seasons[key] = set()
                    if group == 'fielding':
                        pos = split.get('position', {}).get('abbreviation', '')
                        if pos in ('SP','RP','C','1B','2B','3B','SS','LF','CF','RF','OF','DH'):
                            seasons[key].add(pos)
                    elif group == 'pitching':
                        gs = split['stat'].get('gamesStarted', 0)
                        g  = split['stat'].get('gamesPitched', split['stat'].get('gamesPlayed', 0))
                        if gs >= 5: seasons[key].add('SP')
                        if (g - gs) >= 5: seasons[key].add('RP')
                        if g > 0 and not seasons[key]: seasons[key].add('RP' if gs == 0 else 'SP')
        except Exception:
            pass
    return [{'year': 2025, 'team': team, 'positions': sorted(pos)}
            for team, pos in sorted(seasons.items()) if pos]

def main():
    with open('public/players.json') as f:
        players = json.load(f)

    # Players whose last season is 2024 (missing 2025 entirely)
    candidates = [p for p in players if p['seasons'] and max(s['year'] for s in p['seasons']) == 2024]
    print(f'Players with last season = 2024: {len(candidates)}')

    team_map = build_team_map()
    added_total = 0
    patched = 0

    for i, p in enumerate(candidates):
        print(f'[{i+1}/{len(candidates)}] {p["name"]}...', end=' ', flush=True)
        try:
            mlb_id = search_player(p['name'])
            if not mlb_id:
                print('not found')
                continue
            new_seasons = get_2025_seasons(mlb_id, team_map)
            if new_seasons:
                existing = {(s['year'], s['team']) for s in p['seasons']}
                to_add = [s for s in new_seasons if (s['year'], s['team']) not in existing]
                if to_add:
                    p['seasons'].extend(to_add)
                    p['seasons'].sort(key=lambda s: (s['year'], s['team']))
                    added_total += len(to_add)
                    patched += 1
                    print(f'ADDED {[(s["team"], s["positions"]) for s in to_add]}')
                else:
                    print('already up to date')
            else:
                print('no 2025 MLB games')
            time.sleep(0.15)
        except Exception as e:
            print(f'ERROR: {e}')

    with open('public/players.json', 'w') as f:
        json.dump(players, f, separators=(',', ':'))

    print(f'\nDone. Added {added_total} season records across {patched} players.')

if __name__ == '__main__':
    main()
