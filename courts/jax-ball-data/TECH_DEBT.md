# Jax-Ball Technical Debt Log

## Data Schema Inconsistencies

### JU Rebounds Field
- Location: stats/player-season-stats.js
- Function: getRebounds()
- Issue: JU JSON uses `trb` instead of `reb`
- Temporary Fix: `p.reb ?? p.trb`
- Remove When:
  - MD notes standardized
  - Python builder outputs `reb` for all teams

### Rebound Field Inconsistency
- Location:
  - players.js → getRebounds()
  - stats/player-season-stats.js → getRebounds()
- Issue:
  - JU uses `total_reb`
  - Others use `reb` or `trb`
- Temporary Fix:
  - Superset rebound accessor
- Remove When:
  - Python builder outputs unified `reb`

## Normalization in JS
- normalizePlayerId()
- normalizeJersey()
- Remove When:
  - Python builder enforces IDs at build time

## Team Stats Refactor
- Phase: 2.2
- Change:
  - Moved team aggregation + leader logic out of jax-ball.js
- Temporary Constraints:
  - Still depends on runtime PLAYER_SEASON_STATS
- Remove When:
  - Python builder outputs team-level aggregates directly
## Team Stats Extraction (Phase 2.2)
- Source:
  - buildSeasonTotals
  - buildTeamLeaders
- Moved To:
  - stats/team-season-stats.js
- Temporary Shims:
  - getPlayerReb()
- Remove When:
  - Python build step outputs team-level aggregates
## Phase 2.2 Cleanup
- Removed stale PLAYER_SEASON_STATS reference from jax-ball.js
- Reason: team stats now depend only on GAME_STATS_BY_ID


## Duplicate Stat Helpers in jax-ball.js
- Functions:
  - num()
  - getPlayerReb()
  - getStatValue()
  - getStatLeaders()
- Reason:
  - Used for per-game UI rendering only
- Remove When:
  - Game stat rendering extracted to UI module

## Calendar Extraction (Phase 2.3)
- Scope:
  - Calendar grid rendering
  - Month/day layout
  - October special case
- Deferred:
  - Game detail rendering
  - CSS refactors
- Reason:
  - Avoid breaking layout contracts
- Next Phase:
  - Phase 2.4 (UI builders)

## Calendar Game Square Styling
- Phase: 2.3
- Issue:
  - Calendar extraction removed team-based game square styling
- Fix:
  - Reattached `data-team` and `.has-stats` in calendar controller
- Future:
  - Replace with shared UI builder in Phase 2.4

## UI Helper Extraction (Phase 2.4)
- Split by page context:
  - jax-ball main page
  - players page (later)
- Goal:
  - isolate DOM construction
  - preserve orchestration flow
- Deferred:
  - players.js UI helpers
## Main Page UI Helpers (Phase 2.4a)
- Extracted:
  - Formatters
  - Team card UI
  - Game detail UI
- Left in jax-ball.js:
  - Page orchestration
  - Data loading
- Players page UI:
  - Deferred to Phase 2.4b

## Formatters Extraction (Phase 2.4a)
- Moved:
  - Date formatting
  - Player display formatting
  - Numeric coercion
- Reason:
  - Remove UI helpers from page orchestration
- Verified:
  - No visual or behavioral changes

- Fixed remaining formatPlayer call sites in game stats rendering (Phase 2.4a)

## Team UI Helpers (Phase 2.4b)
- Extracted:
  - Static team cards
  - Expanded team view
- jax-ball.js now owns:
  - When teams render
  - Interaction logic

## Game UI Helpers (Phase 2.4c)
- Extracted:
  - Game detail block UI
  - Game stats table UI
  - Stat leaders display
- Left in jax-ball.js:
  - Page flow
  - Data loading

## Players Page Refactor
- Phase P0: Full review & mapping
- No code changes yet
- Goal:
  - Separate UI, state, and data logic

## State Architecture
- Planned `state/` folder for reusable selectors
- `getActivePlayers` temporarily lives in players.js
- Will move after player builders are extracted (P1b → P2)

### Player selectors extraction (Phase 2)

- Extracted player selection logic into ui/player-selectors.js
- Functions moved:
  - getActivePlayers
  - getTopPlayersByTeam
  - hasAnyGameLeader
- Temporary wiring errors expected during transition
- All selector calls must be routed through PlayerSelectors
- No selector logic should live in players.js after this phase
Selectors interface normalization

During Phase 2, selector functions were standardized to accept a single ctx object instead of positional arguments.
This enables safer reuse, easier debugging, and predictable wiring during future ES module migration (Phase 5).

Renderer/Selector interface normalization

During Phase 2, renderer files were updated to consume selectors exclusively via a shared ctx object.
All positional arguments and duplicate selector logic were removed to prevent drift and undefined state access.

## Phase 2.5 — Player cleanup & contract locking

### What was done
- Removed remaining selector logic from `players.js`
- Centralized player filtering and ranking in `ui/player-selectors.js`
- Locked renderer contract to accept a single `ctx` object
- Enforced `PlayerState` as the sole source of UI state
- Reduced `players.js` to a thin coordinator layer

### Why this exists
- Prevents logic drift across files
- Makes renderers testable and predictable
- Avoids hidden dependencies on globals
- Ensures future refactors (ES modules) are mechanical

### What to revisit later
- Convert `PlayerState` to an immutable reducer-style store
- Add runtime assertions for required `ctx` properties
- Replace string-based stat keys with enum/constants
- Remove legacy stat fallbacks after data pipeline cleanup

### Risk level
- Low (no behavioral changes)
- High payoff for long-term maintainability
## Phase 2.5 — players.js final cleanup

### What was done
- Confirmed players.js acts only as a coordinator
- Fully removed selector logic from players.js
- Centralized state changes via PlayerState
- Ensured renderers receive a complete UI context
- Verified all filters, views, and layouts function correctly

### Known leftovers
- `formatPlayer()` remains in players.js but is unused
- Legacy stat helpers still exist pending data hardening

### Why this is acceptable
- No runtime impact
- Safe to remove later during Phase 4 (data hardening)
- Keeping now avoids unnecessary churn

### Status
- Phase 2.5 complete

## Phase 2.6 — Team selectors extraction

### What was done
- Extracted team-derived logic into ui/team-selectors.js
- Moved team record calculation and caching out of jax-ball.js
- Encapsulated TEAM_RECORD_CACHE inside selectors
- Updated jax-ball.js to consume selectors via context

### What did NOT change
- UI output
- Team card layout
- Record calculation logic
- Cache behavior

### Known follow-ups
- Team leaders (PTS/REB/AST) may later move into selectors
- Team-level aggregates can be expanded here (streaks, splits)

### Why this matters
- Reduces global state
- Makes team logic reusable across pages
- Aligns team architecture with player architecture

### Status
- Phase 2.6a complete
## Phase 2.6 — Team selector integration cleanup

### Fixed
- Replaced local getTeamRecord usage with TeamSelectors.getTeamRecord
- Removed direct fetch calls in favor of DataLoader
- Ensured selectors are passed explicitly into TeamUI

### Still pending
- Extract getPlayerReb / getStatValue into game selectors
- Remove unused globals (SITE_DATA, GAMES_BY_DATE)

### Status
- Phase 2.6 selectors: COMPLETE
- Ready for Phase 2.7 (Team renderers)


## Phase 2.6 — Game stat helper placement

### Decision
- Keep getPlayerReb and getStatValue within game-related UI logic
- Avoid creating new folders until Phase 3 restructuring

### Current placement
- Moved to ui/game-ui.js (or exposed via GameStatHelpers)
- Passed explicitly into renderGameStatsInto

### Rationale
- Functions interpret raw box score stats
- Not selectors, not season aggregators, not UI formatting
- Best conceptual fit: game rendering layer

### Future cleanup (Phase 3)
- Extract to stats/game-stat-utils.js
- Remove stat field normalization from runtime
- Enforce schema in data build step
