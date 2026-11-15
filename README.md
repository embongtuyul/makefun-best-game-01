# makefun-best-game-01

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/embongtuyul/makefun-best-game-01/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/embongtuyul/makefun-best-game-01/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

**Glowgarden — Siege of the Last Light.** An original tower-defense game in
one page of vanilla JavaScript and canvas: shadow creatures march on the
Heartlight, and you grow light-plants along their winding path to hold the
line for 12 waves — through day, and through the faster night.

Four plant-towers (Sunbloom, Thornvine, Frostbell, Starspike), each with two
upgrades; four enemy kinds including the Moth Queen boss; a day/night cycle
that speeds the swarm and lengthens your towers' glow; an economy of petals
earned from kills, wave bonuses and dawns; synthesized WebAudio sound; and a
win screen, a loss screen and a restart — all in static files under `game/`,
with no network requests and no build step.

## How to play

- **Mouse:** click a plant card (or press **1–4**), then click a soil tile to
  plant it. Click a planted tower to upgrade (**U**) or sell it (**X**).
- **SPACE** starts the next wave. **F** toggles 2x speed, **P** pauses,
  **M** mutes.
- Stop every creature before it reaches the Heartlight crystal on the right.
  Survive all 12 waves to win.

## Run it

```sh
cd game && python3 -m http.server 8080
```

Then open http://localhost:8080 in desktop Chrome. Staged screenshots:
`?shot=start|play|night|win&seed=1` renders a frozen scene.

## Entered on make.fun

Built for the [best-game-01](https://make.fun/bounty/best-game-01) bounty:
the best game, judged by an AI judge on completeness, fun and depth, feel
and polish, look and originality, and code structure.

---

<sub>Entered on [make.fun](https://make.fun/?ref=2d73gfpt&utm_source=github&utm_medium=readme&utm_campaign=best-game-01)</sub>
