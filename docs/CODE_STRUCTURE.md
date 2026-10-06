# Struktura kódu a pravidla údržby

## Bitva: pravidla a prezentace

`Game` vlastní stav bitvy a koordinuje tahy, scénáře, výběr jednotek, pohyb a herní
systémy. `CombatSystem` provádí souboje; `ScenarioEventSystem` spravuje průběh
scénářových událostí. Žádná z těchto tříd přímo nepracuje s DOM nebo s animační
smyčkou prohlížeče.

Prezentace bitvy je rozdělena podle odpovědností:

- `BattleView` překládá vstupy prohlížeče na příkazy hry, vykresluje mapu a minimapu,
  ovládá kameru, notifikace a efekty. Vlastní listenery a animační smyčku.
- `WoodcutRenderer` vlastní kreslení terénu, žetonů a zvýraznění. `HexGrid.render()`
  mu deleguje prezentaci, zatímco souřadnice, sousedé a obsazení zůstávají v mřížce.
  Sdílené kódové vektorové značky slouží i přehledu armády; žádné další assety ani
  závislosti se nestahují. Kreslení nespotřebovává náhodná čísla herních pravidel.
  `glyphKind()` rozlišuje siluety jízdy a dělostřelectva podle typu a třídy,
  nezávisle na frakci. Canvas, HTML/SVG i bonusová hra čtou stejný slovník `glyphs`;
  viditelné oddíly pro mapu a minimapu dál filtruje `BattleView`, nikoli kresba.
- `BattlePanels` sestavuje HTML jednotek, přehledu armád, tlačítek a fázového banneru.
  Průběh alternativních cílů čte přes `VictoryConditionsSystem.getDualObjectiveProgress()`;
  stejný výpočet používají bonusy, závěr i tooltip. `Ukázat na mapě` ovládá jen
  kameru a fokus, ne výběr nebo herní rozkaz. Levý panel vrací posun nahoru jen
  při změně prohlíženého oddílu; běžná aktualizace zachovává místo čtení.
  Vysvětlivky rozkazů vozů čtou propojení přes `Game.connectedWagonLine()`;
  nativní `details` nevydává rozkaz a změna jazyka zachovává otevření.
  Rozbalená nápověda posouvá celý panel, aby detail neměl nulovou výšku.
  Popis prchání sdílí panel a tooltip přes `routingExplanation()`; pod mlhou
  války jej tooltip nikdy nevyžádá pro skrytý oddíl. Nové texty pravidel,
  dělostřelectva a prchání jsou v locale, nikoli ve druhé kódové kopii.
  Situační pokyn pod mapou pouze odvozuje ze stavu tahu a vybrané jednotky;
  neprohledává pozice protivníka ani nemění herní pravidla.
- `BattleTooltip` vlastní tooltip, jeho obsah a cache pro hover. Při náhledu
  nepřátelského dojezdu hledá místo mimo promítnuté viditelné hexy a žeton.
  Pokud karta na mapě nemá místo, dočasně ji přesune do pravého panelu;
  sbalení panelu ani výběr oddílu se tím trvale nemění. Ukončení náhledu,
  změna tahu, jazyka nebo velikosti okna inspekci uklidí. Dotyková inspekce
  dál používá stejný úplný obsah bez desktopového přemisťování.
- `BattleMapInput` vlastní gesta a kameru: posun, zoom, převody souřadnic a
  potlačení kompatibilního clicku po dotyku/tažení. Zvětšuje prezentační velikost
  Canvasu, ne logickou mřížku nebo pohybové dosahy.
- `BattleOrders` převádí dotykové rozkazy na stejné přímé herní příkazy jako myš
  a drží pouze bezpečnou inspekci hexu. Obsah inspekce sdílí
  s `BattleTooltip.contentForHex()` a respektuje mlhu války.

Pohled čte stav a dotazuje se pravidel. Změny herního stavu provádí příkazy `Game`
nebo příslušného systému, nikoli přímým přepisováním jeho polí. Například klik na
Canvas převede `BattleView.handleClick()` přes kameru na hex. Myš na desktopu jej
předá `Game.handleHexClick()` přímo. Dotyk/kompaktní režim stejnou cestou provádí
přesun, pochod i útok bez mezikroku. Filtr gest zůstává v `BattleMapInput`.
Přepnutí rychlosti AI jde přes `Game.skipAIAnimations()`.

Dosavadní metody `Game.updateUI()`, `Game.updateUnitPanel()` a další veřejné vstupy
pro prezentaci jsou zatím tenké delegáty. Udržují kompatibilitu s `main.js`, AI
a systémy; nejde o novou druhou implementaci UI.

### Stav se nemění při kreslení

`Game.render()` je kompatibilní bod pro obnovení odvozené viditelnosti po změně hry
a následné vykreslení. Samotné `BattleView.render()`, které volá animační smyčka,
už pravidla nepřepočítává. Stejně tak panel morálky pouze zobrazuje vypočítanou
hodnotu, nezapisuje do stavu armády.

Herní log vlastní výhradně `Game`; pohled jen přidává nebo odstraňuje jeho HTML.
`Game.destroy()` nejprve zruší čekající akce a poté zničí pohled. Ten odpojí vstupy
včetně minimapy, zastaví animaci a odstraní notifikace. Čísla poškození se odstraní
také při zrušení čekání.

### Vyměnitelný pohled a testy

Konstruktor přijímá volitelné `{ viewFactory }`. Ve hře se automaticky použije
`BattleView`; testy vkládají explicitní `TestBattleView`:

```js
const game = new Game(grid, {
    viewFactory: game => new TestBattleView(game)
});
```

`SaveGameSystem.load()` zachovává factory dosavadní hry, případně přijímá explicitní
třetí argument `{ viewFactory }`. Načtení tak v testech omylem nevytvoří prohlížečové
UI. Testovací adaptér je v `scripts/helpers/test-battle-view.js`; jeho kontrakt se
ověřuje proti metodám skutečně používaným pravidly. Nepřepisujeme `Game.prototype`.

Soubory jsou nadále klasické skripty, nikoli ES moduly. V `index.html` se proto
`BattlePanels`, `BattleTooltip`, `BattleView` i `ScenarioEventSystem` načítají před `Game`.

## Nápověda a encyklopedie

`main.js` sdílí jeden dialog pro Encyklopedii (výchozí Historie) a `Jak hrát`
(výchozí Pravidla). Otevření nastaví kartu, lokalizovatelný nadpis, rozsah jednotek
`data-unit-scope` a návratový fokus; lišta na mobilu posune aktivní kartu do výřezu.
Překlad obnoví obsah, nikoli zvolenou kartu. Katalog z hlavního menu zůstává úplný
i při existenci instance bitvy, nápověda z bitvy vypisuje její typy jednotek.

Statistiky karet čte `populateHelpUnits()` přímo z `UnitTypes`. Zvláštní schopnosti
v panelu, tooltipu, katalogu a pravidlech používají stejné locale klíče;
`BattlePanels.artilleryOrderExplanation()` sdílí popis pořadí palby a pohybu
mezi detailem a katalogem. Pražské varianty nepřebírají schopnosti podle jména.
Menu testy sdílejí skutečnou inicializaci přes `scripts/helpers/menu-harness.js`.

Bonusová Vozová hradba se vrací nativním relativním odkazem `../../index.html`.
Jeho překlad používá vlastní tabulku minihry. Odkaz nemění úložiště kampaně,
nepřepisuje jazyk hlavní hry a nepotřebuje historii prohlížeče.

## Scénářové události

Každá instance `Game` má vlastní `scenarioEventSystem`. Systém vlastní implementaci
přechodů fází, vyhodnocení jednorázových událostí, jejich účinků a příchodu posil.
`ScenarioManager` nadále poskytuje scénářová data a vyhodnocuje podmínky událostí.
Veřejné metody `Game.updatePhase()`, `checkPhaseEvents()`, `processEvent()`,
`checkReinforcements()` a `spawnReinforcements()` zůstávají kompatibilními delegáty.

Stav `currentScenario`, `currentPhase` a `processedEvents` zůstává v `Game`; systém
si nedrží druhou kopii. Díky tomu lokalizace pracuje s aktuálními daty a save v4
nemění strukturu ani kompatibilitu se staršími verzemi.

Při začátku kola se nejprve aktualizuje fáze, pak provedou její způsobilé události
a posily. Identifikátor události se uloží před provedením účinku. Posily používají
dosavadní klíče `reinf-hussites-<kolo>`, `reinf-crusaders-<kolo>` a
`reinf-scenario-<skupina>-<kolo>`. Neměňte je bez migrace uložených her.
Podmíněné události používají stabilní ID nezávislé na kole skutečného spuštění.

Posily nejprve naplánují umístění **celé skupiny**, bez vytváření jednotek a spotřeby
ID. BFS hledá nejbližší volný průchodný hex, zachovává pořadí sousedů a rezervuje
každé jednotce jiné místo. Nejde o hledání cesty pohybu, takže hledání pokračuje
i za obsazenými nebo vodními hexy; voda sama není povolené místo příchodu.
Pokud skupina nemá dost míst, nevznikne žádná její část. Do `processedEvents` se
uloží `<původní-klíč>:pending` a jednou se zaloguje čekání. Pozdější kontrola skupinu
zkusí znovu; až při úspěchu odstraní čekání, zapíše původní klíč a ohlásí příchod.
Klíč vždy obsahuje plánované kolo, nikoli kolo skutečného příchodu. Prosté `turn <=`
by u starých savů bez evidence zopakovalo minulé posily, proto se mimo plánované
kolo zkoušejí pouze explicitně čekající skupiny.
Přímé `spawnReinforcements()` vrací počet vytvořených jednotek, nebo `0`, a samo
nezakládá čekající skupinu. Automatické opakování patří scénářovým skupinám.

Načtení sestaví bitvu s `{ restoring: true }`, bez přehrání úvodních událostí,
a obnoví jednotky i `processedEvents` ze savu. Již provedené účinky se neopakují;
budoucí události a posily zůstanou připravené. Testy pokrývají save před příchodem
i po příchodu posil, oba datové formáty, správnou frakci a zachování ID jednotek.

Změny zde nesmějí měnit balanc jako vedlejší efekt refaktoringu. Nová mechanika
nebo oprava jejího chování potřebuje vlastní explicitní očekávání v testu.

### Reaktivní vyprávění

`ScenarioEventSystem.getDebriefing()` vybírá text pouze čtením aktuálního stavu.
Živohošť používá `debriefing.victoryVariants` s klíči `allPilgrims`, `somePilgrims`
a `noPilgrims`. Počítá původní hráčské skupiny `POUTNICI`, nikoli posily, cizí
jednotky nebo jednotlivé osoby uvnitř skupiny. Uprchlé nejsou mezi přítomnými.
Texty nepředpokládají příchod posil ani přežití každého člověka ve zraněné skupině.
Literární hlas svědka je výslovně označený jako autorská fikce.

Zprávy a debriefing mohou mít `unitStatus: { type, faction, texts }`; slovník `texts`
obsahuje `alive`, `fallen`, `escaped`. `getUnitStatusText()` dává příznaku `escaped`
přednost před nulovým zdravím, protože engine takto eviduje útěk. Pokud v savu
jednotka chybí nebo není jednoznačná, zůstane neutrální základní zpráva. U Lipan
se zachovaly rozsahy fází, kola a ID událostí i rozkaz AI; nové jsou pouze texty
a výběr varianty. Narativ nikoho nezabíjí, nepřesouvá ani nemění vítězné podmínky.

Varianty jsou v české bázi i v CS/EN overlay pod stabilními názvy. Lokalizace
kopíruje pouze texty, nikoli typ jednotky nebo frakci. Validátor vyžaduje překlad
každé větve v obou jazycích. Není přidán nový stav ani formát savu: výběr přežije
načtení díky již ukládaným jednotkám a deduplikaci událostí.

Při porážce Lipan je nejprve skutečný výsledek a Prokopův osud, teprve potom jasně
označený nespolehlivý hlas vítězné protistrany. Samotná kronika si záměrné zkreslení
ponechává; není to tvrzení neutrálního herního vypravěče. Nová povinná okna nevznikají.

### Paměť Kroniky a offline export

`captureNarrativeOutcome()` zachytí pouze `{ version: 1, victoryVariant, unitState }`.
Statické `ScenarioEventSystem.formatDebriefing()` z otisku a lokalizovaného scénáře
sestaví stejný epilog pro konec bitvy i pozdější otevření Kroniky. Neuchovává se
lokalizovaný text ani reference na jednotky. Ukládá se volba větve; její formulace
se může s budoucími redakčními úpravami hry změnit. Rozehraný save zůstává v4.

`ChronicleSystem` ukládá otisk do volitelného pole `narrative` záznamu bitvy.
Nové pole `playerFled` rozděluje dosavadní společné `playerLosses` na útěk a zničení.
Starší řádky bez těchto polí zůstávají čitelné a nejistota je výslovná. Neplatný
řádek se při čtení přeskočí, validní řádky zůstanou; samotné čtení původní úložiště
nepřepisuje. Neznámý formát otisku nezahodí statistiky, ale nezobrazuje domnělý osud.
Nový zápis se přidává k původním řádkům, aby nesmazal jejich neznámá pole; nečitelný
celý archiv se odmítne přepsat i při dokončení další bitvy.
Zápis vrací úspěch/neúspěch a chyba úložiště nesmí zabránit zobrazení výsledku bitvy.

`ChronicleView` vlastní HTML, otevření/zavření dialogu, fokus a export. Každý text
prochází jedním escapováním, včetně textů ze scénářů a překladů. Modal a offline
kniha sdílejí renderer; export obsahuje vlastní malé tiskové CSS, žádné skripty,
síťové assety ani uživatelův save. Je to čtenářský dokument, ne přenositelná záloha
kampaně. Blob URL se po zahájení stahování uvolní i při chybě.
Kronika má nativní `<details>`, klávesnici v dialogu a návrat fokusu k otevíracímu
tlačítku. Změna jazyka zachová rozbalené záznamy a nezmění uložená data.

## První spuštění a výsledek

`main.js` zpřístupní menu až po úspěšném `i18n.init()`. Český fallback musí být
skutečně načtený; chyba se nesmí maskovat prázdným slovníkem. Statická dvojjazyčná
obrazovka chyby funguje i bez locale. Neplatný uložený jazyk se ignoruje, vadné
nastavení se čte přes whitelist bez automatického přepisování původního JSON.

Zkratka první bitvy používá běžný briefing a `startMission()`, ne druhý herní režim.
Výsledek má vlastní scrollovaný obsah a samostatnou spodní řadu akcí. Fokus začíná
na titulku, klávesnice zůstává v dialogu a návrat z Kroniky obnoví otevírací tlačítko.
`getBattleResultCounts()` sjednocuje rychlé hodnocení a srovnání s prameny: celkový
počet zahrnuje i příchozí posily a ztráty zničené i uprchlé. Nemění výsledek bitvy.

## Bezpečný zápis savu

`Game.saveGame()` sestaví snapshot uvnitř ošetření chyb a předá jej do
`SaveGameSystem.write()`. Ten nejprve serializuje JSON, pak skutečně serializovaná
data ověří přes `prepare()`, které používá i načítání. Teprve potom zavolá
`localStorage.setItem()`. Neúspěšný pokus tak nepřepíše poslední funkční save a
hráči se nehlásí úspěch. Validace nemění aktivní jednotky ani factory ID.
Formát zůstává v4; kompatibilita načítání v1–v3 se nemění.

`saveGame({ automatic: true })` používá samostatný klíč AUTO_KEY. Bezpečný
checkpoint spouští dokončení `BattleActionSystem.run()`, nikoli render nebo
časový interval. Vyvolaná výjimka checkpoint nevytvoří. Ruční uložení se
nepřepisuje. Dokončení bitvy smaže automatickou pozici jen při přesné shodě
s posledním zápisem dané instance. `visibilitychange` vlastní pohled a jeho
AbortController; při skrytí stránky zachová ruční pauzu, pozastaví čekání,
zastaví render a zruší gesta/náhled. Podrobnosti: [MOBILE_PLAYTEST.md](MOBILE_PLAYTEST.md).

## CSS: zachované pořadí kaskády

`style.css` je pouze vstupní seznam importů. Jeho pořadí odpovídá původnímu souboru:

| Soubor v `styles/` | Odpovědnost |
| --- | --- |
| `base.css` | Proměnné, typografie a základ stránky |
| `battle.css` | Rozložení bitvy, mapa, jednotky a přehledy |
| `dialogs-and-help.css` | Dialogy, tooltip a encyklopedie |
| `campaign.css` | Kampaň, mise, fáze a události |
| `menu-and-results.css` | Hlavní menu, nastavení, výsledky a tutorial |
| `feedback.css` | Animace, indikátory, přístupnost a kronika |
| `field-theme.css` | Výsledné dřevořezové téma a jeho přepsání základních stylů |
| `touch-and-layout.css` | Kamera, inspekce místa, dotykové panely a kompaktní rozložení |

Rozdělení zachovalo relativní pořadí selektorů i media queries. Pozdější téma stále
přepisuje základní rozložení; soubory se nesmí prostě abecedně seřadit. Validátor
toto pořadí hlídá. Nepřidáváme `@layer`, protože by změnilo prioritu existující CSS.

Při údržbě upravujte vlastníka pravidla místo přidávání dalšího přepsání na konec
souboru. Před sloučením pravidel ověřte media query, specificitu, `!important`
a vztah zkrácených a dílčích vlastností. Duplicitní selektor sám o sobě není chyba.
Po změně stylů obnovte příslušné `?v=` v importu a verzi `style.css` v `index.html`.

## Ověření změn

### Úložiště a testovací nasazení

`GameStorage` se načítá jako první, před lokalizací i herními systémy. Je jediným
místem přístupu k `localStorage`; poskytuje `getItem`, `setItem`, `removeItem`
a mapování `keyFor`. Nikdy nemaže celý origin a chyby předává existujícím
volajícím, aby zůstala viditelná varování a ochrana posledního dobrého savu.

Na `/husitske-valky-test/` má každý klíč prefix `husitskeValky_test:`; jinde zůstává
původní klíč. Žádná migrace ani fallback k produkčním datům se v testu neprovádí.
Tak lze publikovat stejný commit do testovacího repozitáře a později sloučit větev
do produkce bez přepínání konfiguračních souborů. URL testu je explicitní kontrakt,
ne odhad podle názvu Git větve; samotná lokální větev nemění režim prohlížeče.
`test-storage.js` ověřuje oba weby nad společným úložištěm a zakazuje přímé
přístupy ostatních runtime souborů k `localStorage`.

### Spuštění kontrol

```bash
node scripts/check.js
```

Příkaz kontroluje syntaxi JavaScriptu, testy jádra, průběhu bitvy, scénářových
událostí, narativních variant, Kroniky a exportu, bezpečného ukládání, prvního
spuštění a prezentačního rozhraní, HTML vstup a testy jeho validátoru, strukturu
CSS, překlady a scénáře.
CSS kontrola není plnohodnotný parser: hlídá importy, závorky,
prázdné bloky a existenci assetů.
Testy UI používají zjednodušený DOM a nenahrazují kontrolu v prohlížeči.

`validate-entrypoint.js` má explicitní kontrakt pořadí klasických synchronních
skriptů a porovnává ho i se všemi `.js` soubory v `js/`. Nový runtime soubor je
potřeba zapojit do HTML i kontraktu. Kontroluje lokální `src`, `href` a `poster`,
vstupní stylesheet a dvě současná dynamická místa načítání (hudba a locale soubory
pro jazyky z HTML nabídky). Cesty čte přímo ze zdrojů; při změně způsobu načítání
upravte i validátor a jeho testy. Neprovádí síťové dotazy ani obecnou analýzu JS.
Přesnou velikost písmen ověřuje i na macOS, zakazuje úniky mimo projekt a absolutní
lokální URL, které by nefungovaly pod podadresářem statického hostingu. `<base>`
a `srcset` zatím záměrně odmítá: jejich zavedení vyžaduje rozšíření kontroly cest.

Při změně prezentace zkontrolujte menu, výběr mise, briefing, vybranou jednotku,
průběh tahu a pauzu. Pro rozložení používejte alespoň šířky 390, 753 a 1280 px.
Při větším úklidu CSS porovnejte vypočtené styly i obrazovky s výchozí verzí.

### Automatické kontroly

`.github/workflows/ci.yml` spouští `node scripts/check.js` na Node.js 24 při pushi,
pull requestu a ručním spuštění. Jeden běh má limit pět minut; novější změna ve stejné
větvi nebo pull requestu zruší starší rozpracovaný běh. Není potřeba instalovat
balíčky, přidávat přístupové údaje ani vytvářet build.

Oficiální akce pro checkout a Node.js jsou připnuté na konkrétní commity. Při jejich
aktualizaci ověřte tag v původním repozitáři a aktualizujte hash i komentář verze.
Workflow má pouze `contents: read`, neukládá Git credentials a nic nepublikuje.
Konfigurace vychází z [oficiálního návodu GitHub Actions](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs).
Úspěšná lokální kontrola nepotvrzuje vzdálený běh: ten ověřte v Actions po pushi.
Povinné kontroly pro merge se nastavují zvlášť; tento workflow je sám nezapíná.

## Co ještě není oddělené

Toto je hranice prezentace bitvy, nikoli dokončená přestavba celé aplikace.
`Game` stále koordinuje mnoho pravidel a používá zvuk, lokalizaci a ukládání.
`HexGrid` spojuje hexovou geometrii s Canvas rendererem. `MoraleSystem` a
`TutorialSystem` ještě obsahují vlastní dialogy a `main.js` řídí obrazovky globálně.
V CSS zůstává samostatná vrstva pozdějšího tématu a v panelech inline styly.

Další menší krok může oddělit hexovou geometrii od kreslení. Sloučení základních
stylů s tématem už potřebuje samostatnou vizuální regresi; nemá se míchat s úpravami
pravidel nebo balancu.
