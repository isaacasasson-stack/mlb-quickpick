"""
Builds src/data/players.json from the Lahman database (tannerhodges fork).

For each player-team-year combination, records which of our 11 positions
they played (minimum 1 game at that position):
  C, 1B, 2B, 3B, SS, LF, CF, RF, DH  → from Appearances.csv
  SP  → from Pitching.csv where GS >= 1
  RP  → from Pitching.csv where (G - GS) >= 1

Output schema:
  [{ id, name, teams[], positions[], seasons[] }, ...]

'teams', 'positions', 'seasons' are arrays of all unique values across
ALL years the player played. The game's puzzle.ts will find all players
matching team+position+season by checking:
  player.teams.includes(team) &&
  player.positions.includes(position) &&
  player.seasons.includes(season)

NOTE: This means positions[] = every position ever played in any season,
and teams[] = every team ever played for. The game will ask, e.g.,
"Name a CF for the LAD in 2019" and accept any player who:
  - has "LAD" in teams[]
  - has "CF" in positions[]
  - has 2019 in seasons[]
"""

import json, re, sys
from io import StringIO
import urllib.request
from collections import defaultdict
import csv

BASE = "https://raw.githubusercontent.com/tannerhodges/baseballdatabank/master/core"

def fetch_csv(name):
    print(f"Fetching {name}...", flush=True)
    url = f"{BASE}/{name}"
    with urllib.request.urlopen(url, timeout=30) as r:
        data = r.read().decode("utf-8")
    rows = list(csv.DictReader(StringIO(data)))
    print(f"  {len(rows):,} rows", flush=True)
    return rows

appearances = fetch_csv("Appearances.csv")
pitching    = fetch_csv("Pitching.csv")
people      = fetch_csv("People.csv")

YEAR_MIN, YEAR_MAX = 1980, 2024

# ── Name lookup ───────────────────────────────────────────────────────────
name_map = {}
for row in people:
    pid = row["playerID"]
    fn  = (row.get("nameFirst") or "").strip()
    ln  = (row.get("nameLast")  or "").strip()
    name_map[pid] = f"{fn} {ln}".strip() if fn else ln

# ── Appearances: C 1B 2B 3B SS LF CF RF DH ───────────────────────────────
POS_COLS = {
    "G_c":  "C",
    "G_1b": "1B",
    "G_2b": "2B",
    "G_3b": "3B",
    "G_ss": "SS",
    "G_lf": "LF",
    "G_cf": "CF",
    "G_rf": "RF",
    "G_dh": "DH",
}

def ival(v):
    try: return int(float(v or 0))
    except: return 0

# player → { team_years: {team→{years}}, pos_years: {pos→{years}} }
players = defaultdict(lambda: {
    "team_years": defaultdict(set),
    "pos_years":  defaultdict(set),
})

for row in appearances:
    year = ival(row.get("yearID", 0))
    if not (YEAR_MIN <= year <= YEAR_MAX):
        continue
    pid  = row["playerID"]
    team = row["teamID"].strip()

    players[pid]["team_years"][team].add(year)

    for col, pos in POS_COLS.items():
        if ival(row.get(col, 0)) >= 1:
            players[pid]["pos_years"][pos].add(year)

# ── Pitching: SP and RP ───────────────────────────────────────────────────
# Group by playerID+yearID+teamID (multiple stints)
pitch_agg = defaultdict(lambda: defaultdict(lambda: {"G": 0, "GS": 0}))

for row in pitching:
    year = ival(row.get("yearID", 0))
    if not (YEAR_MIN <= year <= YEAR_MAX):
        continue
    pid  = row["playerID"]
    team = row["teamID"].strip()
    g    = ival(row.get("G",  0))
    gs   = ival(row.get("GS", 0))
    pitch_agg[pid][(team, year)]["G"]  += g
    pitch_agg[pid][(team, year)]["GS"] += gs

for pid, ty_dict in pitch_agg.items():
    for (team, year), stats in ty_dict.items():
        # Make sure team/year is already in player (pitcher may not appear in Appearances)
        players[pid]["team_years"][team].add(year)
        if stats["GS"] >= 1:
            players[pid]["pos_years"]["SP"].add(year)
        if (stats["G"] - stats["GS"]) >= 1:
            players[pid]["pos_years"]["RP"].add(year)

print(f"Unique players (with 1980-2024 data): {len(players):,}", flush=True)

# ── Convert to output format ──────────────────────────────────────────────
def make_id(name):
    s = name.lower()
    s = re.sub(r"[^a-z0-9 ]", "", s)
    s = re.sub(r"\s+", "-", s.strip())
    return s

output = []
seen_ids = {}

for pid, data in players.items():
    name = name_map.get(pid, "").strip()
    if not name:
        continue
    if not data["pos_years"]:
        continue

    all_seasons  = sorted({y for ys in data["team_years"].values() for y in ys})
    all_teams    = sorted(data["team_years"].keys())
    all_positions = sorted(data["pos_years"].keys())

    if not all_seasons:
        continue

    base_id = make_id(name)
    uid = base_id
    if uid in seen_ids and seen_ids[uid] != pid:
        uid = f"{base_id}-{pid}"
    seen_ids[uid] = pid

    output.append({
        "id":        uid,
        "name":      name,
        "teams":     all_teams,
        "positions": all_positions,
        "seasons":   all_seasons,
    })

output.sort(key=lambda x: x["name"])

# ── Stats ─────────────────────────────────────────────────────────────────
all_teams_set = {t for p in output for t in p["teams"]}
all_pos_set   = {pos for p in output for pos in p["positions"]}
print(f"\nOutput: {len(output):,} players", flush=True)
print(f"Teams:  {len(all_teams_set)}", flush=True)
print(f"Positions: {sorted(all_pos_set)}", flush=True)
min_yr = min(p["seasons"][0]  for p in output)
max_yr = max(p["seasons"][-1] for p in output)
print(f"Season range: {min_yr} – {max_yr}", flush=True)

out_path = "/Users/isaacsasson/Desktop/mlb-trivia/src/data/players.json"
with open(out_path, "w") as f:
    json.dump(output, f, separators=(",", ":"))

print(f"\nWrote {out_path}", flush=True)
