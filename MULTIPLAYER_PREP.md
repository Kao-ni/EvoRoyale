# Multiplayer Preparation

This prototype is still local single-player, as required by the plan. The code is prepared for later multiplayer migration in these ways:

- Player, bots, resources, XP orbs, walls, and generators receive stable runtime `entityId` and `entityType` data when spawned.
- Combat math is centralized in `src/systems/rules.ts`.
- Balance constants and buildable costs are centralized in `src/config/balance.ts`.
- Input intent is kept as short-lived scene state, such as attack requests and selected buildable, before game-state mutation.

Future multiplayer must be server-authoritative for:

- damage and deaths;
- resource and XP totals;
- wall and generator placement;
- sword levels;
- safe-zone state;
- win/loss results.

The browser client should send input intents only, such as movement direction, attack requested, selected buildable, and build requested.
