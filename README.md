# Husitské války — tahová strategie

Čeština · [English](README.en.md)

![Husitské války / Hussite Wars](imgs/social-preview.png)

Historická tahová strategická hra zasazená do období husitských válek (1419-1437). Hrajte za husitské armády pod vedením Jana Žižky, Prokopa Holého a dalších legendárních velitelů.

## 🎮 O hře

Taktická tahovka na hexagonálním poli inspirovaná husitskými válkami. Vozová taktika, palné zbraně a terén tvoří základ hry; historický rámec je oddělený od herní rekonstrukce a legend.

### Hlavní funkce

- **18 historicky zasazených scénářů** - Od Živohoště po poslední odpor na Sionu
- **Historické typy jednotek** - Cepníci, vozová hradba, ručničáři, šlechtická jízda a další
- **Komplexní bojový systém** - Terén, morálka, velitelé, speciální schopnosti
- **Fog of War** - Omezená viditelnost, průzkum, skryté jednotky
- **Morálkový systém** - Jednotky mohou prchat, znovu se semknout nebo dezertovat
- **Variabilní vítězné podmínky** - Držení pozic, zničení nepřítele, přežití, únik
- **AI protivník** - Taktická AI pro křižácké armády
- **Kampaňový režim** - Propojené scénáře s progresí příběhu
- **Encyklopedie** - Historické informace o jednotkách, bitvách a osobnostech
- **Osobní kronika** - Paměť vašich bitev, pramenná kritika a stažitelná offline kniha

Hrajte zdarma a bez registrace na [hussitewars.com](https://hussitewars.com/).

## 🚀 Jak spustit

Hra je čistý HTML/CSS/JavaScript bez instalačních závislostí. Kvůli načítání lokalizačních JSON souborů ji spouštějte přes lokální HTTP server:

```bash
# V kořeni projektu
python3 -m http.server 8000
```

Pak otevřete [http://localhost:8000](http://localhost:8000). Přímé otevření `index.html` přes `file://` nemusí kvůli bezpečnostním pravidlům prohlížeče načíst překlady.

**Doporučené prohlížeče:** aktuální Chrome, Firefox nebo Safari.

Nasazení na GitHub Pages a postup aktualizace jsou v
[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md).

### První zážitek

**První bitva: Živohošť** otevře rovnou rozkazy a stručné ovládání. Hlavní cíl
je oddělený od volitelných bonusů. Situační řádek pod mapou vysvětlí výběr oddílu,
pohyb, sepnutý vůz, útěk nebo čekání na protivníka; nevydává rozkazy za hráče.
Výsledek zvýrazňuje důvod konce a ponechává další volby dostupné i při dlouhém
vyprávění. Z uloženého výsledku lze rovnou otevřít osobní kroniku. **Další mise**
vede nejprve na její detail s rozkazy, prameny a historickým úvodem; bitva začne
až po kliknutí na **Zahájit bitvu**.

Menu čeká na načtení překladů. Při chybě nabídne čitelný dvojjazyčný návod;
poškozené nastavení nebo blokované úložiště preferencí nebrání samotnému startu.
Stručný návod pro hráče je v [START_HERE.md](START_HERE.md).

### Kontroly před testováním

```bash
node scripts/check.js
```

Příkaz ověří syntaxi JS, HTML vstup a jeho assety, strukturu a pořadí CSS, scénáře,
překlady a regresní testy. Regrese průběhu bitvy lze samostatně spustit přes
`node scripts/test-battle.js`; používají skutečné herní třídy a hexovou mřížku
s řízeným časem a vloženým testovacím pohledem, bez přepisování metod `Game`.
`node scripts/test-presentation.js` ověřuje hranici mezi pravidly a zobrazením
i úklid skutečného prohlížečového adaptéru nad zjednodušeným DOM.
`node scripts/test-scenario-events.js` hlídá fáze, jednorázové události, oba formáty
posil a jejich obnovu ze savu. Posily se umisťují na nejbližší volné průchodné hexy;
pokud se nevejde celá skupina, počká na uvolnění místa. Čekání přežije uložení hry.
`node scripts/test-save.js` ověřuje ochranu posledního funkčního savu.
`node scripts/test-narrative.js` používá skutečné CS/EN překlady a ověřuje reaktivní
závěry Živohoště, Prokopův osud u Lipan, přepnutí jazyka i save/load.
`node scripts/test-chronicle.js` hlídá uchování závěrů, staré a poškozené zápisy,
oddělení zničených a uprchlých jednotek i bezpečný offline export.
`node scripts/test-first-experience.js` ověřuje situační pokyny, jejich obnovu po
save/load, chyby překladů a nastavení i jednotný účet výsledků včetně posil.
`node scripts/test-touch.js` ověřuje přímý přesun, útok i konec tahu, gesta, kameru,
samostatné automatické ukládání a přerušení hry přepnutím aplikace.
`node scripts/test-storage.js` ověřuje oddělení savů, postupu a preferencí
testovacího webu od stabilní hry, včetně mazání a opětovného načtení.
`node scripts/validate-entrypoint.js` hlídá pořadí všech klasických skriptů a lokální
cesty v HTML, hudbě i načítání překladů, včetně velikosti písmen a relativních URL.
Samotnou kontrolu vstupu testuje `node scripts/test-entrypoint.js`.

Workflow [.github/workflows/ci.yml](.github/workflows/ci.yml) spouští stejný příkaz
na Node.js 24 při každém pushi a pull requestu, případně ručně přes GitHub Actions.
Nevyžaduje `npm install`, nic nenasazuje a má pouze právo číst repozitář.
Začne fungovat po pushi souboru na GitHub; povinné kontroly pro merge jsou samostatné
nastavení repozitáře.

Hru lze uložit během hráčova tahu po dokončení rozpracované akce. Načítání z hlavního
menu, herního menu i pauzy obnoví celý scénář. Save v4 zachovává i změněný terén;
starší verze v1–v3 lze nadále načíst. Neplatný save ponechá rozehranou bitvu beze změny.
Před zápisem se ověří skutečný serializovaný snapshot stejnými pravidly jako při
načítání; chyba sestavení, validace nebo zápisu nepřepíše předchozí uloženou hru.

Živohošť má tři vítězné závěry podle toho, kolik původních skupin poutníků zůstalo
na bojišti. Krátký hlas svědka je označený jako autorská fikce, ne citace pramene.
Lipanské zprávy a závěr rozlišují živého, padlého a uprchlého Prokopa; nepřisuzují
hráči předem danou taktiku. Tato vyprávěcí úprava nemění pravidla vítězství ani
historické podklady.

V hlavním menu otevřete **Kroniku** a pod zápisem rozbalte **Pramennou kritiku**.
Uvidíte odděleně nespolehlivý hlas kronikáře, skutečný účet herních jednotek a epilog
své partie. Nové zápisy pamatují i osudy poutníků a Prokopa; staré záznamy zůstávají
čitelné a chybějící závěry se zpětně nevymýšlejí. Přepnutí CS/EN historii nemění.
**Stáhnout kroniku** vytvoří samostatný HTML dokument bez připojení, skriptů nebo
externích souborů. Lze jej sdílet a vytisknout (včetně tisku do PDF přes prohlížeč).
Jde o čtenářský archiv, **nikoli zálohu savu**: nelze z něj obnovit rozehranou hru.

První řízený playtest je popsaný v [docs/ACT_I_PLAYTEST.md](docs/ACT_I_PLAYTEST.md).
Lokální dotykové ovládání a kontrola na telefonu/tabletu jsou popsány v
[docs/MOBILE_PLAYTEST.md](docs/MOBILE_PLAYTEST.md). Nejde o potvrzení podpory fyzických
zařízení; ta je nutné otestovat před publikací.

## 📁 Struktura projektu

```
strategie/
├── .github/workflows/ci.yml # Automatické kontroly při pushi a pull requestu
├── index.html              # Hlavní HTML soubor
├── style.css               # Vstupní manifest: pevné pořadí CSS importů
├── styles/                 # Devět částí stylů včetně kompaktního dotykového rozložení
├── js/
│   ├── core/              # Základní herní logika
│   │   ├── game.js        # Hlavní herní třída
│   │   └── hex.js         # Hexagonální mřížka
│   ├── systems/           # Herní systémy
│   │   ├── BattleActionSystem.js   # Akce, pauza a rušení čekání
│   │   ├── CombatSystem.js         # Bojový systém
│   │   ├── SaveGameSystem.js       # Validace a obnova uložené bitvy
│   │   ├── ScenarioEventSystem.js  # Fáze, jednorázové události a posily
│   │   ├── CampaignProgressSystem.js # Postup kampaně a pověst
│   │   ├── ChronicleSystem.js     # Datový archiv bitev a jejich vyprávění
│   │   ├── FogOfWarSystem.js       # Systém viditelnosti
│   │   ├── MoraleSystem.js         # Systém morálky
│   │   ├── VictoryConditionsSystem.js  # Vítězné podmínky
│   │   └── TutorialSystem.js       # Tutorial
│   ├── entities/          # Herní entity
│   │   ├── Unit.js        # Třída jednotky
│   │   └── UnitFactory.js # Factory pro vytváření jednotek
│   ├── data/              # Herní data
│   │   ├── unitTypes.js   # Definice typů jednotek
│   │   ├── scenarios.js   # Scénáře bitev
│   │   ├── campaign.js    # Struktura kampaně
│   │   └── battleLore.js  # Historické texty
│   ├── ui/                # UI komponenty
│   │   ├── WoodcutRenderer.js # Dřevořezová mapa a společné vektorové značky oddílů
│   │   ├── BattleView.js  # Vstupy bitvy, kamera, vykreslování a UI lifecycle
│   │   ├── BattleMapInput.js # Posun, zoom, gesta a souřadnice
│   │   ├── BattleOrders.js # Přímé dotykové rozkazy a bezpečná inspekce mapy
│   │   ├── BattlePanels.js # Panely jednotek, armád a fází
│   │   ├── BattleTooltip.js # Obsah a stav tooltipu
│   │   ├── ChronicleView.js # Kronika, pramenná kritika a offline export
│   │   ├── main.js        # UI logika
│   │   ├── sound.js       # Zvukové efekty
│   │   └── music.js       # Hudba — instrumentální chorál, menu a jednorázové přehrání
│   └── ai.js              # AI protivníka
├── docs/                  # Dokumentace
│   ├── CODE_STRUCTURE.md       # Hranice odpovědností, CSS a testování
│   ├── VICTORY_CONDITIONS.md    # Dokumentace vítězných podmínek
│   ├── CONSISTENCY_REPORT.md    # Report konzistence herní logiky
│   └── design/            # Design dokumenty
├── assets/                # Grafické assety
├── audio/                 # Zvukové soubory
└── imgs/                  # Obrázky
```

## 🎯 Herní mechaniky

Hudební motiv má vlastní instrumentální aranžmá pro flétnu, fagot, violoncella
a harfu. [Původ, licence samplů a postup nového renderu](audio/README.md).
Při hraní se přehrává hotové lokální MP3, bez externí hudební služby.

### Bojový systém

Útok a ukončení tahu jsou přímé rozkazy bez dalšího potvrzení. Přeživší pěchota
s útokem alespoň 28 může v boji zblízka protiútočit; střelci po vlastním zásahu
automaticky neopětují palbu. Stojící oddíl s dostřelem 2+ a zbývajícím výstřelem
na konci tahu připraví **krycí palbu**, která reaguje na pohyb protivníka a
nepřidává bonus obrany. Ostatní nevyužité oddíly se automaticky brání a dostanou
−30 % příchozího poškození. Ruční **Bránit** chrání i střelce, ale spotřebuje
jeho reakční výstřel. Jde o vědomou volbu mezi palbou a ochranou, nikoli dva
sčítající se bonusy.

Přesun žetonu je krátce animovaný; krycí palba a navazující útok začnou až po
jeho příjezdu. Při omezení animací nebo zrychleném tahu AI se efekt přeskočí.
Klidné bojiště se nepřekresluje v každém animačním snímku.

- **Damage calculation** - Komplexní pipeline s 13 kroky výpočtu
- **Terrain bonuses** - Les (+20% obrana), kopce (+30%), města (+40%)
- **Special abilities** - Reach, RapidFire, Charge, ArmorPiercing, Siege...
- **Formation bonuses** - Wagenburg obrana, shield wall, commander auras
- **Random factor** - ±20% variance pro taktickou hloubku

### Jednotky
- **Husité**: Cepníci, sudličníci, kušiníci, píšťalníci, vozy, houfnice
- **Křižáci**: Těžcí rytíři, kopiníci, halapartníci, kušníci, lučištníci
- **Legendary commanders**: Jan Žižka, Prokop Holý, Zikmund Korybutovič, Hynek Krušina

### Vítězné podmínky
10 typů primárních podmínek (survive, destroy_percent, capture_position, escape...)
10 typů sekundárních bonusových cílů
3 typy porážkových podmínek

Viz: [docs/VICTORY_CONDITIONS.md](docs/VICTORY_CONDITIONS.md)

## 📚 Dokumentace

- **[CODE_STRUCTURE.md](docs/CODE_STRUCTURE.md)** - Rozdělení herní logiky a prezentace, pravidla údržby CSS a testů
- **[VICTORY_CONDITIONS.md](docs/VICTORY_CONDITIONS.md)** - Kompletní přehled vítězných a porážkových podmínek
- **[CONSISTENCY_REPORT.md](docs/CONSISTENCY_REPORT.md)** - Analýza konzistence herní logiky
- **[docs/design/](docs/design/)** - Design dokumenty a poznámky

## 🛠️ Tech Stack

- **Vanilla JavaScript** (ES6+) - Žádné závislosti, čistý JS
- **HTML5 Canvas** - Rendering hexagonální mapy
- **CSS3** - Responsivní UI s custom properties
- **Class-based architecture** - OOP design pro lepší maintainability

## 🎨 Grafický styl

Současná hra používá **dřevořez**: teplý papír, tmavou rytinu krajiny a střídmou
červenou/modrou pro strany. Vlastní oddíly mají kruhové žetony, protivník štíty;
značky zbraní jsou společné pro mapu a přehled armády. Pohyb má přerušovaný obrys
s tečkou, útok červený obrys s křížky a výběr dvojitou linku.

Vykreslení je oddělené v `WoodcutRenderer`; nemění scénáře, pravidla ani formát
savu. `node scripts/test-woodcut.js` hlídá terény, značky, mlhu, geometrii a kreslení
všech 18 scénářů. Podrobnosti a ruční kontrola: [WOODCUT_PLAYTEST.md](docs/WOODCUT_PLAYTEST.md).

## 🏛️ Historická autenticita

Všech 18 scénářů má v briefingu, výsledcích i osobní kronice rozbalovací oddíl
**Historie a prameny**: doložený rámec, herní rekonstrukce, tradice a nejistoty.
Odkazy rozlišují odborné studie, institucionální přehledy a sekundární popularizaci.
Shrnutí nejsou vydávána za doslovné citace kronik. Jednotky, tahy a souřadnice hexů
nepředstavují historická měřítka; alternativní vítězství mění příběh partie, nikoli dějiny.

Rozhodnutí, rozsah a omezení revize: [HISTORICAL_AUDIT.md](docs/HISTORICAL_AUDIT.md).
Seznam použité četby: [historicalSources.js](js/data/historicalSources.js).
Nejde o úplný rozbor kritických edic ani odborné potvrzení každého detailu map.

## 📝 Stav vývoje

**Verze:** Alpha 0.3.6 (25. září 2026)

**Produkční adresa:** [hussitewars.com](https://hussitewars.com/)

**Stav:** veřejná alfa pro zpětnou vazbu; podrobnosti vydání jsou v [changelogu](CHANGELOG.md).

### Dokončeno
- ✅ Kompletní bojový systém
- ✅ 18+ historických scénářů
- ✅ AI protivník
- ✅ Fog of War
- ✅ Morálkový systém
- ✅ Vítězné podmínky
- ✅ Tutorial
- ✅ Encyklopedie
- ✅ Save/Load system
- ✅ Česká a anglická lokalizace
- ✅ Doktríny AI, postup kampaně a pověst
- ✅ Kronika hráče i vítězné protistrany

### Známé limity

- AI používá čitelné historické doktríny, ale nenahrazuje lidského soupeře.
- Balanc scénářů, hlavně v pozdějších aktech, potřebuje ověřit reálnými hráči.
- Dotykové ovládání funguje, ale některé texty na úzkých telefonech ještě potřebují ověřit a upravit.
- Postup i savy jsou v `localStorage`; vymazání dat webu je odstraní a mezi prohlížeči se nesynchronizují.
- Hra nemá backend, multiplayer ani cloudové ukládání.

### Další práce

Z veřejného playtestu zbývá zejména ověřit balanc Živohoště, mobilní přetékající
texty, srozumitelnost terénů a návaznost vodních polí. Podrobnosti jsou v [TODO.md](TODO.md).

## 🤝 Contributing

Projekt je otevřený pro příspěvky. Při přidávání nových featur dodržujte:
- Existující code style (class-based OOP)
- Separaci concerns (systems/, entities/, data/)
- Historickou autenticitu u nových jednotek/scénářů

## 📜 Licence

Zdrojový kód je dostupný pod [licencí MIT](LICENSE).

## 🙏 Autorství a poděkování

- **Koncept, herní návrh a texty:** Josef Šlerka
- **Vývoj:** Vytvořeno metodou vibe codingu ve spolupráci s OpenAI Codex a Claude Code
- **Historická rešerše:** Prameny a odborná literatura uvedené u jednotlivých bitev
- **Testování:** Díky všem hráčům, kteří testují alfa verzi a posílají připomínky

## 💝 Support

Líbí se ti hra? Podpoř vývoj: https://buymeacoffee.com/josefslerka

## 📧 Zpětná vazba

- [Nahlásit chybu nebo navrhnout změnu](https://github.com/josefslerka/husitske-valky/issues)

---

*"Kdo jsú boží bojovníci, a zákona jeho... 🎵"*
