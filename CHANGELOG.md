# 📜 Changelog

Čeština · [English](CHANGELOG.en.md)

Starší plánovací oddíly níže zachováváme jako dobový záznam; nejsou aktuálním plánem vydání. Aktuální stav a otevřené úkoly jsou v [TODO.md](TODO.md).

## Nevydané změny

- Viditelný nepřítel ukáže možný dojezd v příštím tahu: na počítači při najetí myší, na dotyku po dlouhém podržení bez vydání rozkazu. Náhled respektuje terén a mlhu války a neodhaluje skryté oddíly.
- Nekmíř už nelze vyhrát pouhým čekáním: do konce 10. kola musí přežít alespoň 50 % vlastních oddílů a Hynek z Nekmíře musí být vyřazen. Záchrana pěti vozů zůstává vedlejším cílem. Briefing, závěr a hlášky v průběhu bitvy odpovídají novým podmínkám a skutečnému stavu bojiště.
- Pláň, kopec a svah mají odlišnější barvy a kresbu, aby šly rozpoznat i bez tooltipu.
- Na úzkých telefonech se lépe zalamují texty v panelech, briefingu a ovládání; opraveno rozložení pověsti, mapových tlačítek a bitevní notifikace. Spodní ovládání i notifikace zohledňují bezpečný odstup od lišty mobilního prohlížeče. Skutečné lišty X/LinkedIn a zvětšené systémové písmo ještě čekají na ověření na telefonu.
- Regresní testy pokrývají náhled dojezdu bez úniku informací, pasivní taktiku u Nekmíře, podmíněné hlášky, terénní kresbu a mobilní ovládání.

## Alpha 0.3.5 (19. září 2026)

- Cíl obléhání Plzně nyní počítá všech dvacet polí města: vítězství přinesou libovolná tři obsazená městská pole, ne skrytá šestice souřadnic odlišná od popisku mapy.
- Celá plzeňská cílová zóna je na mapě označena a záhlaví cíle průběžně ukazuje `Obsazeno 0/3`; česká i anglická verze používají stejné pravidlo a srozumitelný text.
- Regresní testy hlídají shodu městského terénu, názvu Plzně a vítězné zóny i skutečné vítězství na dříve nepočítaných polích.
- `TODO.md` je zkrácený na skutečně otevřené priority a odložené náměty; dokončenou práci zachovává changelog.

## Alpha 0.3.4 (19. září 2026)

- Spodní herní menu i pauza nabízejí `Zkusit znovu`; restart současný postup zahodí až po potvrzení a zrušený dialog bezpečně obnoví předchozí stav hry.
- Kutná Hora zachovává historický ústup jako hlavní cíl, ale na konci uzná i alternativní vítězství, pokud z nepřátelské polní armády zůstanou pouze velitelé a Žižka přežije; tato odchylka od historie má vlastní závěr.
- Plzeňská bombarda začíná v předsunuté baterii, odkud má i s nulovým pohybem obránce ihned v dostřelu.
- Křižácký zadní voj u Tachova a Domažlic nejprve několik kol klade odpor a teprve potom ustupuje; u Tachova vede ústup ke scénářovému únikovému bodu směrem k Bavorsku.
- Velitelé řízení AI neutíkají jen kvůli nízké morálce a během jednoho tahu se přesunou nejvýše o tři hexy, takže nepřebíhají přes polovinu bojiště.
- Regresní testy hlídají postavení bombard, počáteční odpor zadního voje, směr ústupu i chování velitelů.

## Alpha 0.3.3 (16. září 2026)

- Changelog má úplnou anglickou verzi propojenou s českým originálem.
- Odkaz `Změny` v titulním menu otevírá český nebo anglický changelog podle právě zvoleného jazyka, včetně první návštěvy podle nastavení prohlížeče.
- Anglický README odkazuje přímo na anglickou historii vydání; regresní testy hlídají oba jazykové směry i případ, kdy se překlad nepodaří načíst.
- Obrazovka `O hře` už neopakuje copyrightovou řádku; autorství zůstává v příslušné sekci a standardní notice v souboru `LICENSE`.

## Alpha 0.3.2 (15. září 2026)

- Klidné bojiště už nepřekresluje celou mapu a minimapu v každém animačním snímku; smyčka běží jen po dobu krátkého pohybu žetonu, projektilu nebo exploze.
- Jednotlivé oddíly při pohybu krátce plynule dojedou na cílové pole. Krycí palba a navazující útok začnou až po vizuálním příjezdu; během pauzy animace stojí, omezený pohyb a zrychlený tah AI ji přeskočí.
- Plzeňský výpad a bonus morálky se neohlásí, pokud u bran nezůstalo dost bojeschopných obránců včetně Viléma Švihovského. Název fáze už netvrdí, že výpad skutečně probíhá.
- Nevyužité stojící oddíly s dostřelem 2+ a zbývajícím výstřelem na konci tahu připraví krycí palbu bez bonusu obrany; ostatní nevyužité oddíly se automaticky brání. Ruční `Bránit` střelce ochrání, ale spotřebuje jeho výstřel. Rozdíl je vysvětlený u rozkazu, v nápovědě a tutoriálu česky i anglicky; viditelný nepřátelský střelec ukazuje připravenost krycí palby.
- Tlačítko `Bránit` se vejde i do úzkého panelu; text u rozkazu výslovně říká, že krycí palba není obrana a obě možnosti se nesčítají.
- `Další mise` po vítězství otevře nejdřív její detail s rozkazy, prameny a historickým úvodem; nový boj začne až po kliknutí na `Zahájit bitvu`.
- Tutoriál a pravidla boje nyní přesně uvádějí, kdo v boji zblízka protiútočí a že krycí palba střelce reaguje na pohyb nepřítele, nikoli na zásah.
- Velitel AI se bez bezprostřední hrozby nestahuje jen proto, že má málo sousedních spojenců; z dobré podpůrné pozice se také bezúčelně nepřesouvá.
- Regresní testy hlídají klidnou animační smyčku, stav plzeňské posádky, krycí palbu po konci tahu, ruční obranu a uložení postojů.

## Alpha 0.3.1 (14. září 2026)

Opravy a úpravy ovládání podle prvního veřejného playtestu.

- Útok i ukončení tahu se provedou přímo, bez potvrzovacího mezikroku; rychlý druhý vstup během animace nevydá duplicitní rozkaz.
- Nevyužité akce se při ukončení tahu automaticky převedou na obranu. Rozhraní i nápověda jasně uvádějí její účinek.
- Po skončení bitvy lze skrýt výsledek, prohlédnout poslední stav bojiště a stejný debriefing znovu otevřít.
- Opravené zůstávající dosahy při přepínání oddílů, překrytý cíl mise a spodní ovládání v mobilních prohlížečích uvnitř aplikací.
- Sudoměř uzná draze zaplacené vítězství, pokud z nepřátelské armády zůstal pouze velitel.
- Nekmíř spouští rozhodující fázi včas, vede Hynka do boje a ponechává bonusový cíl dosažitelný.
- Vyšehrad už v 7. kole hromadně nemaže prchající vojsko; pozdější pravidlo „bez milosti“ platí jen pro historickou past u Podolí.
- Rozšířené regresní testy ovládání, výsledků, scénářových událostí, mobilního rozložení a dvojjazyčných textů.

## Alpha 0.3 (12. září 2026)

Vydání pro GitHub Pages s vlastní doménou `hussitewars.com`.
Přechod na novou adresu nepřenáší staré savy ani kroniky; původní data se nemažou.

- Sjednocený dřevořez titulního menu, dialogů a kroniky; čitelnější velitelé a ovládání na dotyku.
- Síla útoku zohledňuje oslabení oddílu; opraven postup útočící AI na Vítkově.
- Revidovaný historický kontext všech 18 scénářů, s rozlišením pramenů a herní rekonstrukce.
- Nová instrumentální úprava chorálu a spolehlivější ovládání hudby.
- Menu doporučuje vstup podle rozehraných a odehraných bitev, prázdné ruční uložení nezobrazuje.
- Přepínač ukazuje cílový jazyk EN/CS. Bez uložené volby se vybírá první podporovaný jazyk v preferencích prohlížeče; jinak čeština.
- Jednotný údaj o verzi v menu i obou obrazovkách O hře; odkaz podpory přejmenován na Buy me a coffee.

## Dřevořez — testovací výtvarný směr (8. září 2026)

- Ryté lesy, stavby, vodní šrafy a papírová mapa místo sytých plošek a zářících žetonů.
- Kruhové vlastní oddíly a nepřátelské štíty, společné vektorové značky v mapě i přehledu armády.
- Výběr, přesun, útok, únik a stavy jednotek mají rozlišitelné tvary; zdraví je čitelné i po vyčerpání oddílu.
- Geometrie kreslených hran odpovídá stávajícím sousedům; souřadnice a dosahy se nemění.
- Kreslení přesunuto z `HexGrid` do `WoodcutRenderer`, bez změny bojových pravidel, scénářů a formátu savu.
- Deset nových regresí pokrývá všech 13 terénů, typy jednotek, 18 scénářů, mlhu i stabilitu kreslení.
- Výtvarná změna patří pouze do testovací větve; ostré vydání vyžaduje samostatné schválení.

## Automatické kontroly a scénářové události (6. září 2026)

- Přidán GitHub Actions workflow pro push, pull request i ruční spuštění; běží stejná kontrola projektu na Node.js 24.
- CI má jen oprávnění ke čtení, připnuté verze akcí a časový limit; neinstaluje závislosti ani nenasazuje web.
- Fáze, události a posily přesunuty z `Game` do `ScenarioEventSystem`, bez změn mechanik a formátu savu.
- Zachována veřejná rozhraní i jediný stav scénáře používaný ukládáním a lokalizací.
- Sedmnáct nových regresí prošlo před extrakcí i po ní: časování, podmínky, deduplikace, posily, save/load a mechanické účinky.
- Jednotná kontrola projektu nyní spouští 55 testů; hranice prezentace se hlídá i pro nový systém.

## Oddělení prezentace a úklid CSS (6. září 2026)

- `Game` a `CombatSystem` již přímo nepoužívají DOM ani animační smyčku. Prohlížečovou prezentaci vlastní `BattleView`, `BattlePanels` a `BattleTooltip`.
- `Game` je přibližně o tisíc řádků menší; veřejné UI metody zatím zůstávají tenkými delegáty pro kompatibilitu.
- Pravidla lze testovat s vloženým pohledem bez globálního `document` a `window`; vykreslení nepřepočítává viditelnost ani morálku.
- Osm nových regresních testů hlídá prezentační kontrakt, vstupy, log a úklid UI. Celkem 38 testů v jednotné kontrole projektu.
- Původní CSS rozděleno do sedmi částí při zachování pořadí kaskády. Odstraněno 189 deklarací přepsaných pozdějšími pravidly a devět prázdných bloků.
- Přidána kontrola struktury, pořadí importů a cest v CSS a dokumentace hranic odpovědností.
- Bez záměrných změn balancu nebo vzhledu; vybrané stavy menu a bitvy porovnány s původním CSS při šířkách 390, 753 a 1280 px.

## Stabilizace bitev (6. září 2026)

- Opravená předčasná porážka na Sionu a dvojí ztráta morálky kvůli žízni.
- Útok spotřebuje akci okamžitě; dvojklik, konec tahu a ukládání nemohou přerušit rozpracovaný souboj.
- AI čeká na celý nájezd, reakční palbu i protiútok, také při zrychlení.
- Zvýraznění cílů i provedení útoku používá společnou kontrolu viditelnosti.
- Jednotné načítání celé bitvy s validací savu před výměnou instance; save v4 a kompatibilita v1–v3.
- Pauza zastavuje čekající akce. Výměna bitvy ruší staré časovače a listenery minimapy.
- Rychlá bitva nepřebírá cíle předchozí mise; po načtení nezůstávají stará čísla poškození.
- Integrační regrese nad skutečnými třídami; původní AI testy používají skutečnou hexovou mřížku.
- Jediný příkaz pro všechny kontroly: `node scripts/check.js`.

## Připravovaná Alpha 0.2 (3. září 2026)

### Nové
- Názvy míst na všech 18 mapách, respektující fog of war a jazyk hry.
- Scénářové doktríny AI: útok jízdy, pronásledování, hledání boků, klamný ústup a držení vozové hradby.
- Kampaňová pověst, odemykání aktů a jednorázový zlom po Lipanech.
- Shrnutí čtyř aktů a kronika vítězné protistrany; Sion zachovává kronikářskou i archeologickou verzi.
- Lokalizační validátor a deterministický testovací balík herního jádra.

### Změny
- Historické přesily u Hořic, Tachova a Domažlic jsou vyjádřeny počtem žetonů a doktrínou AI, ne navýšením HP.
- Ústí dostalo dvě jednotky husitské šlechtické jízdy; Plzeň mechanický tlak hladu a dezercí.
- Dynamické panely, jednotky, tooltipy, události a kampaň se překládají bez reloadu.
- Rozhraní při šířce 753 px dovoluje sbalit boční panely bez překrývání obsahu.

### Opravy
- Úplný datový kontrakt událostí, fronta notifikací, jednotná evidence úmrtí a routu.
- Save v3 ukládá čas, pověst, AI stance a stav jednorázových mechanik.
- Nová bitva čistí starý herní log; opravené překlady tlačítka zvuku a briefingu Hořic.

## Alpha 0.1 (3. února 2026)

### ✨ Features
- 🎮 18 historických scénářů
- 🎓 Interaktivní tutorial
- 🏰 Kompletní bojový systém s morálkou
- 🗺️ Fog of War systém
- 👑 Velitelské schopnosti a aury
- 🎯 Vítězné podmínky (survive, destroy, hold position, escape...)
- 🤖 AI protivník
- 📚 Encyklopedie (jednotky, taktika, historie)
- 💾 Save/Load system
- 🎵 Hudba a zvukové efekty

### 🎨 Design
- Středověký rukopis styl
- Parchment textury
- Zlaté ornamenty
- Palatino Linotype font (konzistentní napříč celou hrou)

### ⚖️ Balance
- Všechny scénáře validní (0 chyb)
- Balance ratio: průměr 1.05
- Opravené unit types
- Implementované všechny victory conditions

### 🐛 Známé problémy
- AI občas dělá divné tahy
- Mobile UX není optimalizováno
- Některé scénáře mohou být těžké
- Save může selhat v některých prohlížečích

---

## Plánované pro Beta 0.2
- 🎮 Multiplayer/hotseat mode
- 🛠️ Scenario editor
- 🏆 Achievement system
- 🌍 Lokalizace (EN/CZ)
- 📱 Mobile optimalizace
- 🤖 Vylepšená AI

---

**Alpha = Testovací verze s bugy**
**Beta = Téměř hotová verze**
**Release = Finální verze**
