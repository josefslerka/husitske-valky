# 📜 Changelog

[Čeština](CHANGELOG.md) · English

The older planning sections below are preserved as a record of earlier development; they are not the current release plan. See [TODO.md](TODO.md) for the current state and open tasks (currently maintained in Czech).

## Alpha 0.3.10 (17 October 2026)

- Shorter, more natural Czech/English scenario messages describe troop conditions and suggest a useful next step instead of explaining the scenario script. Repeated commander-fate messages and selected endings are also more concise. Historical notes still distinguish source accounts from events in the game. Three new regressions protect brevity, the removal of technical phrasing and every state/outcome branch; gameplay rules, difficulty and Tachov are unchanged.

- Czech/English scenario messages respect commanders’ and fighting groups’ actual condition: commanders present, routing, fallen or escaped; groups able to fight, routing or absent. Targeted fixes cover Hořice, Malešov, Pilsen, Nekmíř, Vyšehrad, Žatec and Sion in particular. Routing shooters are not mistaken for the whole infantry force fleeing, and handgun terror alone is not routing. Unknown or hidden states use neutral wording without revealing units through fog of war.
- Phase names and descriptions no longer treat a new round as proof of the player counterattacking, enemies fleeing, shots being fired, losses or loot. Expected reinforcements are distinguished from confirmation of actual arrival. Historical stories and fates are not automatically presented as actions just performed in the game.
- Endings at Brod, Pilsen and Malešov distinguish eliminating the enemy from occupying the main target hexes. Domažlice confirms a secured approach only when both target hexes are occupied. Sion reports Roháč’s actual fate; defeat in the early missions no longer automatically kills Žižka or every pilgrim. The personal Chronicle preserves and translates the new outcome branches without rewriting earlier records.
- Added 24 reactive-message regression tests covering Czech/English, every variant, mixed groups, unknown commanders, fog of war, queued messages, save/load, actual victory routes and the Chronicle. Tests compare combat effects and RNG consumption and protect unchanged gameplay data for all 18 scenarios. Manually checked Malešov’s new opening message in Czech at 1280×720 and English at a 375×812 mobile layout. **Difficulty and rules are unchanged; Tachov, including both translations, is untouched.**

- Hořice, Malešov and Domažlice now mark the exact hexes for optional objectives with gold outlines and ◇ symbols, live occupation counts, tile explanations and `Show on map` buttons. Hořice and Malešov require at least 2 of 4 marked hexes when you win; Domažlice requires both. Arbitrary hill or town hexes do not count, and continuous occupation is not required. The panel, tooltip and final evaluation share the same calculation. Czech/English descriptions are more precise; primary objectives and deployment are unchanged.
- Malešov correctly checks losses **below 30%** of the original player force, rather than allowing up to 30 lost units. Another surviving commander can no longer satisfy Žižka's survival objective. Dead or escaped units do not count as occupying objectives.
- Winning at Lipany no longer forces the historical reputation collapse. The one-time penalty applies only to an actual in-game defeat before the first victory; a later failed replay does not erase an earlier win. Results report the actual reputation change, including the 0–100 limits. Previously saved records and reputation already reduced by the old rule are not recalculated retroactively.
- Enemy-turn speed can be switched **in both directions** from the turn indicator or `Menu → Enemy turns`. Controls show the current mode and available change, work with the keyboard and remain accessible between turns. The choice is saved with the current battle; a new battle starts normally. In-progress actions are not cancelled, and neither rules nor AI decisions change.
- Added 36 regression tests for objectives, speed, campaign results and map markers: exact hexes, leaving and returning, movement/undo, percentage boundaries, named commanders, save/load, Czech/English, reputation without replay farming, focus and fog of war. Manually checked objectives and speed controls at 1280×720, 375×812 and 320×640, including restoring normal speed during the same enemy turn. **Tachov is unchanged**: its panic, difficulty, early ending and optional-objective definitions are outside this batch.

- Revised 33 Czech/English unit and commander profiles: descriptions, equipment, origins and notes distinguish historical context from game reconstruction. Removed invented or unsupported attributed sayings and anachronistic equipment; corrected Viktorín and Hynek's relationship to George of Poděbrady, Diviš's relationship with Žižka and overly definite claims about the early battles. Affected short descriptions now agree with the longer profiles. This is a targeted first pass, not a complete audit of every biography.
- The Encyclopedia no longer automatically puts authored notes in quotation marks or presents them as chronicle quotations. Eighteen cards now offer specific further reading, with eight museum and scholarly references added to the catalogue. The introduction explains that sources do not establish exact game statistics or the deployment of every type in every battle. Text and bibliography are escaped, and links allow HTTPS only.
- Slopes use a lighter background, soft contour lines and short hatching instead of sharp rocky peaks. The shared artwork appears on Vítkov, other maps and the terrain key. Movement costs, defence bonuses and terrain placement are unchanged; checked at 100% and 64% map zoom.
- Manually checked actual Chrome browser zoom at 125–150%: mission briefings, scrolling unit cards and objectives, and access to bottom controls, including Czech/English text. Revised cards and long links were also checked at a 375×812 mobile viewport. Added 10 editorial/source regression tests and one slope-rendering test, including unchanged combat properties for all 59 unit types. Physical phones, system font scaling and X/LinkedIn browser bars still need verification. Difficulty and combat rules are unchanged.

- Clearer unit names: `Rytířská jízda` replaces `Těžký rytíř` and `Střelci z ručnic` replaces `Ručničáři` in Czech. English uses `Knightly Cavalry` and retains `Handgunners`. The unit card, tooltip, army overview, Encyclopedia and loaded saves use the same names; Wagon Fort also uses the new Czech handgunner name. Unit types, statistics and the save format are unchanged.
- `Optional Objectives` replaces the bonus terminology. Mission briefings, the objectives panel, rules and results explain that these are extra challenges evaluated at the end of battle, not requirements for victory or a source of new units and combat bonuses.
- The `Battle hymn` / `Bojový chorál` button explicitly shows `1× per battle`, remaining rounds or its used state. Introductory help, the rules and button tooltip distinguish an immediate combat ability from the music controls. Its effects, activation and use with sound off are unchanged. The longer label does not squeeze other mobile controls; the English objectives button uses the shorter label `Goals`. Manually verified Czech/English text, unit names, army overview, objectives and controls at 1280×720, 375×812, 320×640 and 844×390.
- Živohošť's three endings use shorter prose reflecting the pilgrim groups still present. `A voice from the field (fiction, not a source quotation)` still explicitly identifies the invented speech rather than presenting it as a historical source. All changes have Czech/English text and 17 new regression tests; difficulty is unchanged.

- Živohošť explicitly states before battle that at least 40% of the original units (4 of 8) must survive five full rounds. The header and objectives panel show a live original-unit count and minimum; the round indicator uses the actual five-round objective. Help explains that reinforcements arrive at the start of round five, do not count towards the minimum, and routing the enemy alone does not replace survival.
- The opening tip points to the labelled Červenka hill on the right of the map. It distinguishes defensive terrain from green movement-destination highlights.
- The briefing, rules and expandable help by the orders explain movement points, one move per turn, terrain costs, passing through allies, zones of control and the guaranteed adjacent step. Costs for the selected unit come from the actual rules; the tooltip shows entry cost rather than the whole route. Immobile units and marching wagons have their own explanations. All text is available in Czech and English.
- Added 21 onboarding regression tests covering the briefing, victory threshold and existing early victory by eliminating the entire enemy force, exclusion of reinforcements, completed rounds, save/load, language switching, actual movement, shared terrain costs and fog-of-war privacy. Manually verified Czech/English briefings, keyboard access, reloading and layouts at 1280×720, 375×812, 320×640 and 844×390. Difficulty, army composition, combat statistics and reinforcement timing are unchanged.

## Alpha 0.3.9 (7 October 2026)

- Cavalry and artillery now use the selected distinguishing silhouettes in the existing woodcut style: a plain horse for light cavalry, a horse with a shield for armoured and Hussite noble cavalry, and a horse with a lance for heavy knights. The tarasnice has a long narrow barrel, the howitzer a shorter wider barrel, and the bombard a fixed carriage. The map, army overview and Encyclopedia share the artwork; Prague howitzers share the howitzer profile, and the bonus Wagon Fort uses the new marks too. Faction colours and outlines, action marks, health bars and gameplay rules are unchanged.
- Added four silhouette regression tests and expanded Czech/English catalogue checks: type mapping including Prague variants and the bonus game, matching Canvas/SVG artwork at different scales and after exhaustion, and preserved fog-of-war filtering on the map and minimap. Manually verified 64% map zoom, the bonus game's deployment menu and the Encyclopedia at 320px and 375px widths.
- The main menu now has a separate `How to Play — Rules, Controls and Tactics` entry. Help from the battle menu and pause screen opens the Rules tab, while the Encyclopedia still opens History. The active tab scrolls into view on narrow screens; closing restores focus, and switching Czech/English preserves the current tab and unit-list scope.
- The panel, tooltip and Encyclopedia all show pikemen's base range of 1 and explain the conditional two-hex attack over an ally. Prague variants have concise Czech and English gameplay descriptions without inheriting abilities they do not possess; a readable name replaces the internal `wagon` identifier. The Encyclopedia shares artillery action-order explanations with the unit card, reads statistics from unit data, and the rules reuse the same reach, wagon-cover and area-attack descriptions as the cards.
- Wagon Fort now has a visible `Back to Hussite Wars` link at the top. Its relative URL works under a subdirectory and for direct visits; it does not depend on browser history or alter campaign progress. Verified with keyboard navigation and 320px and 375px layouts.
- Added 17 regression tests for help, unit information and returning: entry from the main menu, battle and pause screen, active tab and focus, pikemen's actual reach condition, Prague variants, shared artillery explanations, live language switching, relative links and preservation of the main campaign reward.
- Wagon orders now have Czech and English tooltips and expandable explanations, accessible with a mouse, touch or keyboard. They distinguish a single wagon from its connected line, show the number of eligible wagons and explain movement costs, group marching, obstacles and half cover. Unlinking no longer promises an immediate move: independent movement becomes available next turn. Opening the help does not hide the unit detail, even on desktop.
- Artillery cards and rules describe the existing action order accurately: a howitzer cannot fire after moving, but can move after firing; a mobile tarasnice can do both in either order. Immobile guns have a separate explanation. Mechanics and combat statistics are unchanged.
- `Routing` now explains rally attempts at the start of the unit's own turn, automatic retreat, escape at the map edge, desertion within the map and destruction of units unable to retreat. The card and tooltip show remaining attempts; Czech and English logs distinguish desertion from escape and no longer claim a destroyed or departed unit is still routing. Chances and timing are unchanged: two actual attempts, then desertion on the next processing step.
- Added 35 regression tests for orders and help: actual group marching, obstacles, action costs, both artillery action orders, routing outcomes, commander bonuses, live language switching and fog-of-war privacy.
- Most now marks the city gate at the end of the road and both Hněvín target hexes. The objectives panel, header and tile tooltip show holding progress for the castle (`0/2`) and gate (`0/6`); `Show on map` centers the camera on the exact location. The Czech and English briefing and help explain that Most's city hexes do not count as the gate, and counters update at the end of the player's own turns.
- Fixed Most's falsely awarded bonus. Completing one holding objective still wins the battle; `Control the castle and gate` requires all three target hexes to be occupied at that victory. Both counters update before the result is decided, so objective order no longer affects the outcome. The ending and personal Chronicle entry distinguish capturing the castle, blocking the gate and controlling both locations; destroying all enemies early does not invent completion of those objectives. Corrected the Czech siege message.
- The unit detail can scroll again. Short windows and touch layouts scroll the entire left panel so long wagon orders do not leave the detail with only a few lines. Collapsed panels hide their contents and buttons; selecting a new unit returns to the top, while refreshing the same unit preserves the reading position. Verified in Czech and English on desktop and mobile viewports, including landscape.
- Added 22 regression tests for Most and the panel: exact target hexes, counting only player turns, interrupted holds, each victory route, the actual bonus, the deadline, save/load, translations, Chronicle entries, camera movement without issuing orders and fog of war. Unit strength and reinforcement timing are unchanged.
- A visible enemy's tooltip no longer covers its highlighted movement range or its own token. The card finds free space on the map; if it cannot fit, the full details appear in the right-hand panel. Ending the inspection restores the army overview and its previous collapsed state. The preview does not change the selected unit, orders or fog-of-war rules; regression tests cover edges, zoom, map scrolling and long cards.

## Alpha 0.3.8 (30 September 2026)

- Wagon Fort's opening map clearly separates deployment sites from the enemy road: empty sites are green with prominent plus markers before the first wave, and the legend and first tip explain that roads and detours cannot hold units. Markers do not obscure range previews and disappear when combat starts. Text is available in Czech and English; difficulty and combat rules are unchanged.
- The player's shooter card now shows covering-fire status directly above its orders, including the specific reason it is unavailable after movement, spending all shots, taking cover or routing. Tooltips show the same information. Shooters' defensive order is now called `Take Cover`, explicitly explaining both the 30% damage reduction and the forfeited shot. All text is available in Czech and English.
- The bombard now has a range of 5 hexes and starts behind the infantry at the Siege of Plzeň, outside the defenders' immediate firing range. It can bombard the two forward archer units from the start, but cannot reach the entire city garrison. It remains immobile and vulnerable to an enemy sortie.

## Alpha 0.3.7 (27 September 2026)

- Winning all five battles of Act I, Birth, unlocks a link to the bonus Wagon Fort game in the main menu. The unlock persists after reloading the page; testers can still use the direct link without completing the act.
- Scenario events and separate reinforcement groups now have complete Czech and English text in the locale files. Switching languages also updates open and queued battle notifications without repeating their gameplay effects, while preserving state-dependent message variants.
- Locale validation catches missing text and mismatches between scenario events and their translations. Regression tests cover the reward unlock, language switching while notifications are queued, and reinforcements arriving later.

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
