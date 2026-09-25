# 📜 Changelog

[Čeština](CHANGELOG.md) · English

The older planning sections below are preserved as a record of earlier development; they are not the current release plan. See [TODO.md](TODO.md) for the current state and open tasks (currently maintained in Czech).

## Alpha 0.3.6 (25 September 2026)

- The standalone [Wagon Fort](https://hussitewars.com/bonus/vozova-hradba/) tower-defense bonus game features eight waves, unit building and upgrades, barricades and war councils. It is playable in Czech and English and is not linked to the main menu or campaign progress.
- A visible enemy now shows its possible next-turn movement range: hover on desktop or long-press on touch without issuing an order. The preview follows terrain and fog-of-war rules and does not reveal hidden units.
- Nekmíř can no longer be won by waiting alone: at least 50% of the player's units must survive through round 10, and Hynek of Nekmíř must be defeated. Preserving five wagons remains a secondary objective. The briefing, ending and in-battle messages now match these conditions and the actual battlefield state.
- Plains, hills and slopes have more distinct colors and linework, making them easier to distinguish without a tooltip.
- Text wraps more reliably in panels, briefings and controls on narrow phones. The reputation display, map controls and battle notification layout have been adjusted; bottom controls and notifications account for mobile browser chrome. Actual X/LinkedIn in-app browser bars and enlarged system text still need verification on a phone.
- Regression tests cover movement previews without information leaks, passive play at Nekmíř, conditional messages, terrain rendering and mobile controls.

## Alpha 0.3.5 (19 September 2026)

- The Siege of Plzeň objective now counts all twenty city tiles: any three occupied city tiles bring victory, rather than a hidden set of six coordinates that differed from the map label.
- The full Plzeň objective zone is marked on the map and the objective header shows live progress such as `Occupied 0/3`; Czech and English now describe the same rule clearly.
- Regression tests keep the city terrain, Plzeň label and victory zone aligned and verify an actual victory on tiles that were previously ignored.
- `TODO.md` has been reduced to genuinely open priorities and deferred ideas; completed work remains in the changelog.

## Alpha 0.3.4 (19 September 2026)

- Both the bottom battle menu and the pause screen now offer **Try Again**. Restarting discards current progress only after confirmation, while cancelling safely restores the previous game state.
- Kutná Hora retains the historical withdrawal as its primary objective, but now recognizes an alternative victory at the deadline when only enemy commanders remain and Žižka survives. This divergence from history has its own ending.
- The Plzeň bombarda now begins in a forward battery where defenders are immediately within range despite its zero movement.
- The Crusader rear guard at Tachov and Domažlice now resists for several turns before retreating. At Tachov, the retreat follows the scenario's escape point towards Bavaria.
- AI-controlled commanders no longer flee merely because of low morale and move no more than three hexes in one turn, preventing them from crossing half the battlefield at once.
- Regression tests cover the bombarda's position, the rear guard's initial resistance, the retreat direction and commander behavior.

## Alpha 0.3.3 (16 September 2026)

- The changelog now has a complete English version linked with the Czech original.
- The **Changelog** link in the title menu opens the Czech or English file according to the currently selected language, including a first visit using the browser preference.
- The English README links directly to the English release history. Regression tests cover both language directions and the case where a translation fails to load.
- The **About** screen no longer repeats a copyright line. Authorship remains in its dedicated section and the standard notice remains in `LICENSE`.

## Alpha 0.3.2 (15 September 2026)

- An idle battlefield no longer redraws the entire map and minimap on every animation frame. The loop runs only during brief token movement, projectiles or explosions.
- Individual unit tokens now slide briefly to their destination hex. Covering fire and follow-up attacks begin only after the visual arrival. The animation pauses with the game and is skipped for reduced motion or fast-forwarded AI turns.
- The Plzeň sortie and morale bonus are not announced unless enough defenders fit to fight, including Vilém Švihovský, remain near the gates. The phase title no longer claims that the sortie is already happening.
- At End Turn, stationary unused units with range 2+ and a shot remaining prepare covering fire without a defense bonus; other unused units defend automatically. Manual **Defend** protects a shooter but consumes that shot. The difference is explained beside the order, in Help and in the tutorial in both languages. A visible enemy shooter shows whether covering fire is ready.
- The **Defend** button fits in a narrow panel. Its explanation explicitly states that covering fire is not defense and the two benefits do not stack.
- **Next mission** after victory first opens its details, orders, sources and historical introduction. The next battle begins only when **Start battle** is selected.
- The tutorial and combat rules now accurately describe which melee defenders counterattack, and that a shooter's covering fire reacts to enemy movement, not to being hit.
- An AI commander no longer retreats merely because it has few adjacent allies when there is no immediate threat; it also keeps a good support position instead of moving without purpose.
- Regression tests cover the idle animation loop, Plzeň garrison state, covering fire at End Turn, manual defense and saved stances.

## Alpha 0.3.1 (14 September 2026)

Control fixes and refinements from the first public playtest.

- Attacks and ending a turn now act directly, with no confirmation step. A rapid second input during animation cannot issue a duplicate order.
- Unused actions automatically become defense at End Turn. The interface and Help clearly state its effect.
- After a battle, the result can be hidden, the final battlefield inspected and the same debriefing reopened.
- Fixed stale movement ranges when switching units, mission objectives obscured by controls, and bottom controls in mobile in-app browsers.
- Sudoměř recognizes a costly victory when only the enemy commander remains from the opposing army.
- Nekmíř triggers its decisive phase in time, brings Hynek into the fight and keeps its bonus objective achievable.
- Vyšehrad no longer removes routing troops en masse in turn 7; the later “no mercy” rule applies only to the historical trap near Podolí.
- Expanded regression tests for controls, results, scenario events, mobile layout and bilingual text.

## Alpha 0.3 (12 September 2026)

GitHub Pages release on the custom domain `hussitewars.com`. Moving to the new address does not migrate old saves or chronicle entries; the old data is not deleted.

- Unified woodcut-inspired title menu, dialogs and chronicle, with clearer commanders and touch controls.
- Attack strength now reflects a unit's injuries; the attacking AI's advance at Vítkov was fixed.
- Revised historical context for all 18 scenarios, distinguishing sources from playable reconstruction.
- New instrumental arrangement of the chorale and more reliable music controls.
- The menu recommends an entry point based on battles in progress and completed; an empty manual save is not shown.
- The language switch shows the target language, EN or CS. Without a saved choice, the first supported browser language is used; otherwise the fallback is Czech.
- A single version string appears in the menu and both About screens. The support link was renamed “Buy Me a Coffee”.

## Woodcut — experimental visual direction (8 September 2026)

- Engraved forests, buildings, water hatching and a paper map replaced saturated color blocks and glowing tokens.
- Circular friendly units and enemy shields use shared vector marks on the map and in the army overview.
- Selection, movement, attack, escape and unit states have distinguishable shapes; health remains readable after a unit has spent its actions.
- Drawn hex edges match the actual neighbors; coordinates and ranges did not change.
- Rendering moved from `HexGrid` to `WoodcutRenderer` without changing combat rules, scenarios or the save format.
- Ten new regressions covered all 13 terrain types, unit types, 18 scenarios, fog and rendering stability.
- At this stage the visual change belonged only to the test branch; a production release still required separate approval. It was later included in Alpha 0.3.

## Automated checks and scenario events (6 September 2026)

- Added a GitHub Actions workflow for pushes, pull requests and manual runs, using the same project check on Node.js 24.
- CI had read-only permissions, pinned action versions and a timeout; it installed no dependencies and did not deploy the site.
- Phases, events and reinforcements moved from `Game` into `ScenarioEventSystem` without changing mechanics or the save format.
- Public interfaces and the scenario state used by saving and localization were preserved.
- Seventeen new regressions passed before and after the extraction, covering timing, conditions, deduplication, reinforcements, save/load and mechanical effects.
- The unified project check then ran 55 tests; the presentation boundary also covered the new system.

## Separating presentation and cleaning CSS (6 September 2026)

- `Game` and `CombatSystem` no longer used the DOM or the animation loop directly. `BattleView`, `BattlePanels` and `BattleTooltip` owned browser presentation.
- `Game` became roughly a thousand lines shorter; public UI methods remained thin compatibility delegates.
- Rules could be tested with an injected view and no global `document` or `window`; rendering did not recalculate visibility or morale.
- Eight new regression tests covered the presentation contract, inputs, log and UI cleanup. The unified project check then contained 38 tests.
- The original CSS was split into seven sections while preserving cascade order. 189 declarations superseded by later rules and nine empty blocks were removed.
- Added checks for CSS structure, import order and asset paths, plus documentation of responsibility boundaries.
- No intended balance or appearance changes. Selected menu and battle states were compared with the original CSS at widths of 390, 753 and 1280 px.

## Stabilizing battles (6 September 2026)

- Fixed premature defeat at Sion and double morale loss from thirst.
- An attack spends its action immediately; double-clicking, End Turn and saving cannot interrupt combat in progress.
- AI waits for the complete charge, reaction shot and counterattack, including when fast-forwarded.
- Highlighted targets and the actual attack use the same visibility check.
- Entire battles load through a single path that validates a save before replacing the current instance; save v4 remains compatible with v1–v3.
- Pause stops pending actions. Replacing a battle cancels old timers and minimap listeners.
- Quick Battle no longer inherits the previous mission's objectives; old damage numbers do not remain after loading.
- Integration regressions use real game classes; the original AI tests use the real hex grid.
- One command runs all checks: `node scripts/check.js`.

## Alpha 0.2 plan (3 September 2026)

### New

- Place names on all 18 maps, respecting fog of war and the game language.
- Scenario-specific AI doctrines: cavalry attack, pursuit, flank seeking, feigned retreat and holding a wagon fort.
- Campaign reputation, act unlocking and a one-time break after Lipany.
- Summaries of four acts and a chronicle of the victorious opposing side; Sion keeps both chronicler and archaeological versions.
- Localization validator and a deterministic regression suite for the game core.

### Changed

- Historical numerical advantages at Hořice, Tachov and Domažlice are represented by token counts and AI doctrine, not inflated HP.
- Ústí gained two Hussite noble-cavalry units; Plzeň gained mechanical pressure from hunger and desertion.
- Dynamic panels, units, tooltips, events and campaign text translate without a reload.
- At a width of 753 px, side panels can collapse without obscuring content.

### Fixed

- Complete event-data contract, notification queue and consistent accounting for death and rout.
- Save v3 records time, reputation, AI stance and the state of one-off mechanics.
- A new battle clears the old game log; fixed translations of the sound button and Hořice briefing.

## Alpha 0.1 (3 February 2026)

### Features

- 18 historical scenarios.
- Interactive tutorial.
- Combat system with morale.
- Fog of war.
- Commander abilities and auras.
- Victory conditions: survive, destroy, hold a position, escape and others.
- AI opponent.
- Encyclopedia covering units, tactics and history.
- Save/load system.
- Music and sound effects.

### Design

- Medieval manuscript style.
- Parchment textures.
- Gold ornaments.
- Consistent Palatino Linotype font throughout the game.

### Balance

- All scenarios valid, with zero validation errors at the time.
- Average balance ratio at the time: 1.05.
- Corrected unit types.
- All planned victory-condition types implemented at the time.

### Known issues at the time

- AI sometimes made strange moves.
- Mobile UX was not yet optimized.
- Some scenarios could be difficult.
- Saving could fail in some browsers.

---

## Earlier Beta 0.2 plan (historical)

- Multiplayer or hotseat mode.
- Scenario editor.
- Achievements.
- English and Czech localization.
- Mobile optimization.
- Improved AI.

---

**Alpha:** A test version with bugs.

**Beta:** A nearly finished version.

**Release:** The final version.
