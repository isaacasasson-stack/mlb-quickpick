#!/usr/bin/env python3
"""Applies enrich-proposals.json to public/players.json"""

import json

with open('public/players.json') as f:
    players = json.load(f)

with open('scripts/enrich-proposals.json') as f:
    proposals = json.load(f)['proposals']

player_map = {p['id']: p for p in players}
added = 0

for proposal in proposals:
    p = player_map.get(proposal['id'])
    if not p:
        print(f"SKIP (not found): {proposal['name']}")
        continue
    existing_keys = {(s['year'], s['team']) for s in p['seasons']}
    for s in proposal['missing_seasons']:
        key = (s['year'], s['team'])
        if key not in existing_keys:
            p['seasons'].append(s)
            existing_keys.add(key)
            added += 1
    # Re-sort seasons by year then team
    p['seasons'].sort(key=lambda s: (s['year'], s['team']))

with open('public/players.json', 'w') as f:
    json.dump(players, f, separators=(',', ':'))

print(f'Added {added} season records across {len(proposals)} players.')
