// Team abbreviation -> display name
const TEAM_NAMES: Record<string, string> = {
  NYY: 'New York Yankees', BOS: 'Boston Red Sox', LAD: 'Los Angeles Dodgers',
  SFG: 'San Francisco Giants', CHC: 'Chicago Cubs', STL: 'St. Louis Cardinals',
  ATL: 'Atlanta Braves', HOU: 'Houston Astros', NYM: 'New York Mets',
  PHI: 'Philadelphia Phillies', CIN: 'Cincinnati Reds', PIT: 'Pittsburgh Pirates',
  MIL: 'Milwaukee Brewers', MIN: 'Minnesota Twins', DET: 'Detroit Tigers',
  CLE: 'Cleveland Guardians', TEX: 'Texas Rangers', OAK: 'Oakland Athletics',
  SEA: 'Seattle Mariners', ANA: 'Los Angeles Angels', LAA: 'Los Angeles Angels',
  TBR: 'Tampa Bay Rays', TOR: 'Toronto Blue Jays', BAL: 'Baltimore Orioles',
  CHW: 'Chicago White Sox', KCR: 'Kansas City Royals', MIA: 'Miami Marlins',
  FLA: 'Florida Marlins', ARI: 'Arizona Diamondbacks', COL: 'Colorado Rockies',
  SDP: 'San Diego Padres', WSN: 'Washington Nationals', MON: 'Montreal Expos',
  BRO: 'Brooklyn Dodgers', NY1: 'New York Giants', BSN: 'Boston Braves',
  PHA: 'Philadelphia Athletics', SLB: 'St. Louis Browns',
};

const POSITION_LABELS: Record<string, string> = {
  C: 'Catcher', '1B': 'First Base', '2B': 'Second Base',
  '3B': 'Third Base', SS: 'Shortstop',
  LF: 'Left Field', CF: 'Center Field', RF: 'Right Field',
  DH: 'Designated Hitter',
  SP: 'Starting Pitcher', RP: 'Relief Pitcher',
};

// Team -> primary color class
const TEAM_COLORS: Record<string, string> = {
  NYY: 'bg-gray-800 text-white border-gray-600',
  BOS: 'bg-red-900 text-red-100 border-red-700',
  LAD: 'bg-blue-900 text-blue-100 border-blue-700',
  SFG: 'bg-orange-900 text-orange-100 border-orange-700',
  CHC: 'bg-blue-800 text-blue-100 border-blue-600',
  STL: 'bg-red-800 text-red-100 border-red-600',
  ATL: 'bg-red-900 text-red-100 border-red-700',
  HOU: 'bg-orange-800 text-orange-100 border-orange-600',
  NYM: 'bg-blue-900 text-blue-100 border-blue-700',
  PHI: 'bg-red-800 text-red-100 border-red-600',
};

const DEFAULT_TEAM_COLOR = 'bg-gray-700 text-white border-gray-500';

interface Props {
  team: string;
  position: string;
  season: number;
}

export default function ClueCard({ team, position, season }: Props) {
  const teamColor = TEAM_COLORS[team] ?? DEFAULT_TEAM_COLOR;
  const teamName = TEAM_NAMES[team] ?? team;
  const positionLabel = POSITION_LABELS[position] ?? position;

  return (
    <div className="w-full animate-slide-in">
      <p className="text-center text-sm text-gray-400 mb-4 uppercase tracking-widest font-semibold">
        Name a player who was a...
      </p>
      <div className="flex flex-col gap-3">
        {/* Team */}
        <div className={`rounded-2xl border px-6 py-4 flex items-center gap-4 ${teamColor}`}>
          <span className="text-3xl">🏟️</span>
          <div>
            <p className="text-xs uppercase tracking-widest opacity-60 font-semibold">Team</p>
            <p className="text-xl font-black tracking-tight">{teamName}</p>
            <p className="text-sm opacity-70 font-mono">{team}</p>
          </div>
        </div>

        {/* Position */}
        <div className="rounded-2xl border border-purple-700 bg-purple-900/40 px-6 py-4 flex items-center gap-4">
          <span className="text-3xl">🧤</span>
          <div>
            <p className="text-xs uppercase tracking-widest text-purple-400 font-semibold">Position</p>
            <p className="text-xl font-black text-white">{positionLabel}</p>
            <p className="text-sm text-purple-300 font-mono">{position}</p>
          </div>
        </div>

        {/* Season */}
        <div className="rounded-2xl border border-yellow-700 bg-yellow-900/30 px-6 py-4 flex items-center gap-4">
          <span className="text-3xl">📅</span>
          <div>
            <p className="text-xs uppercase tracking-widest text-yellow-400 font-semibold">Season</p>
            <p className="text-xl font-black text-white">{season}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
