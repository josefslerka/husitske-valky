# Hussite Wars — turn-based strategy

[Čeština](README.md) · English

![Husitské války / Hussite Wars](imgs/social-preview.png)

A free, browser-based historical turn-based strategy game set during the Hussite Wars (1419–1437). Lead Hussite forces through a campaign inspired by historical sources, from Živohošť to the last stand at Sion. The documented setting, playable reconstruction and later traditions are kept distinct.

Play in Czech or English, without registration or installation, at [hussitewars.com](https://hussitewars.com/).

## About the game

- **18 historically situated scenarios** with different primary and optional objectives.
- **Hex-based tactical battles** with terrain, wagon forts, firearms, commanders and special abilities.
- **Morale, fog of war and tactical AI** with scenario-specific doctrines.
- **Campaign progression** connecting battles across the story.
- **An encyclopedia and a personal chronicle** with historical context, source criticism and a downloadable offline reading copy.
- **Local save and load** during an unfinished battle.

The game is an alpha: balance and some mobile layouts still need feedback from players.

## Play locally

The project is plain HTML, CSS and JavaScript. It needs no package installation or build step. Serve the repository root over HTTP so that the browser can load the localization JSON files:

```bash
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000). Opening `index.html` directly as `file://` may block the translations under browser security rules. Recent Chrome, Firefox and Safari are recommended. [START_HERE.md](START_HERE.md) has a short Czech player guide; [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) documents GitHub Pages deployment in Czech.

### Your first battle

Choose **First battle: Živohošť**. Its mission details show the orders, main objective, optional bonuses and concise controls before you start. Select one of your units on the map; green hexes show possible moves and highlighted enemies show possible attacks. A contextual line beneath the map explains what is happening without issuing orders for you.

The result explains why the battle ended. You can inspect the battlefield again or open a saved entry in your personal chronicle. **Next mission** now opens that mission's details, orders, sources and historical introduction first. The next battle starts only when you choose **Start battle**.

The menu waits for both translations to load. If loading fails, it shows a readable bilingual recovery message. Damaged preferences or blocked preference storage do not prevent a new game from starting.

## Battle rules at a glance

Attacks and ending a turn are direct actions; there is no extra confirmation step. A surviving infantry defender with a base attack of at least 28 can counterattack a melee strike. Ranged units do not automatically shoot back merely because they were hit.

At the end of your turn, an unused unit normally takes a defensive stance automatically, reducing incoming damage by 30%. There is one deliberate exception: a stationary unit with range 2+ and a shot remaining prepares **covering fire** instead. It can react when an enemy moves into range, but it receives no defensive bonus. Choosing **Defend** manually protects a ranged unit, but consumes its remaining reaction shot. The two benefits do not stack.

Units briefly slide to their destination hex. Covering fire and any follow-up attack resolve after the token visually arrives. The movement effect is skipped when reduced motion is requested or the AI turn is fast-forwarded. An idle battlefield no longer redraws the map on every animation frame.

Terrain, morale, commander auras, wagon formations and special abilities also affect combat. The encyclopedia in the game explains the rules in both languages. [Victory conditions](docs/VICTORY_CONDITIONS.md) are documented in Czech.

## Saves and the personal chronicle

You can save during your turn after any action in progress has finished. Loading from the main menu, game menu or pause restores the entire scenario. Save format v4 also preserves changed terrain; older v1–v3 saves remain readable. An invalid save does not replace the current battle, and a failed write does not overwrite the last working save.

Your chronicle keeps the outcome of completed battles, including casualties, retreats and selected narrative consequences. Open **Chronicle** in the main menu and expand **Source criticism** beneath an entry to compare the unreliable chronicler's voice, the actual tally of game units and your battle's epilogue. Živohošť distinguishes how many original pilgrim groups remained; Lipany distinguishes Prokop as alive, fallen or escaped. Missing conclusions in older entries are not invented retroactively.

**Download chronicle** produces a self-contained HTML reading copy that works offline and can be printed to PDF. It is **not a save backup** and cannot restore an unfinished battle. Saves, campaign progress, preferences and chronicle entries remain in the browser's local storage for that exact site address. Clearing site data removes them; they do not sync between browsers or devices.

## Historical approach

Every scenario's briefing, result and personal chronicle include expandable **History and sources** notes. They distinguish attested context, gameplay reconstruction, traditions and uncertainty. Summaries are paraphrases, not purported verbatim quotations from chronicles. Units, turns and hex coordinates are not historical scale measurements; alternate victories change your game's story, not the historical record.

The [historical audit](docs/HISTORICAL_AUDIT.md) records the scope and limits of the review, and [historicalSources.js](js/data/historicalSources.js) lists the reading used. These notes are not a complete review of critical editions or an expert certification of every map detail. Short fictional witness voices are labeled as the author's fiction.

## Running checks

```bash
node scripts/check.js
```

This checks JavaScript syntax, the HTML entrypoint and assets, CSS structure, scenarios, both translations and regression tests. It does not require `npm install`. The same command runs in [GitHub Actions CI](.github/workflows/ci.yml) on Node.js 24 for pushes and pull requests; CI does not deploy the site and has read-only repository access.

You can run focused checks individually, including `node scripts/test-battle.js`, `node scripts/test-presentation.js`, `node scripts/test-scenario-events.js`, `node scripts/test-first-experience.js`, `node scripts/test-touch.js`, `node scripts/test-save.js`, `node scripts/test-narrative.js`, `node scripts/test-chronicle.js` and `node scripts/test-woodcut.js`. The [code structure guide](docs/CODE_STRUCTURE.md) describes the boundaries between game rules and rendering, as well as CSS maintenance. The [Act I playtest guide](docs/ACT_I_PLAYTEST.md) and [mobile playtest guide](docs/MOBILE_PLAYTEST.md) are currently in Czech; physical-device behavior still needs manual verification.

## Repository layout

```text
index.html        HTML entrypoint and game screens
style.css         Ordered CSS imports
styles/           Nine CSS sections, including touch layouts
js/core/          Game and hex-grid logic
js/systems/       Combat, events, morale, fog, victory, saves and campaign
js/entities/      Units and unit factory
js/data/          Scenarios, unit types and historical content
js/i18n/          Czech and English UI translations
js/ui/            Battle rendering, controls, menus, chronicle, sound and music
js/ai.js          Tactical AI
scripts/          Automated checks and regression tests
docs/             Design, implementation and playtest documentation
imgs/, audio/     Images and local audio assets
```

The visual style uses warm paper, dark woodcut-inspired lines and restrained red/blue faction colors. Unit tokens, commander silhouettes, terrain marks and UI status signs share a consistent visual language. Rendering is separated in `WoodcutRenderer` and does not alter battle rules or the save format. The [woodcut playtest notes](docs/WOODCUT_PLAYTEST.md) are in Czech.

The game's musical theme is an original instrumental arrangement played from a local MP3, without an external music service. [Sample provenance, licenses and re-rendering](audio/README.md) are documented in Czech.

## Current state and known limits

**Version:** Alpha 0.3.6 (25 September 2026). See the [English changelog](CHANGELOG.en.md) for details. **Production site:** [hussitewars.com](https://hussitewars.com/).

- The AI follows readable, historically inspired doctrines but is not a human opponent.
- Scenario balance, particularly in later acts and the first battle at Živohošť, needs more player testing.
- Touch controls work, but enlarged system text, in-app browser bars and iPad usability need more manual checking.
- Saves and progress live only in `localStorage`; there is no backend, multiplayer or cloud synchronization.
- Terrain recognition and the way adjacent water hexes join are still being reviewed.

See [TODO.md](TODO.md) for the detailed backlog; it is currently maintained in Czech.

## Contributing, license and feedback

The source code is available under the [MIT License](LICENSE). Contributions should preserve the separation between rules, data and presentation, and distinguish historical evidence from gameplay invention.

- **Concept, game design and writing:** Josef Šlerka.
- **Development:** vibe coding in collaboration with OpenAI Codex and Claude Code.
- **Historical research:** sources and specialist literature cited with each battle.
- **Playtesting:** thanks to everyone trying the alpha and sending candid feedback.

[Report a bug or propose a change](https://github.com/josefslerka/husitske-valky/issues). If you enjoy the game, you can [support further development](https://buymeacoffee.com/josefslerka).
