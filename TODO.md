# TODO — Husitské války

**Aktuální verze:** Alpha 0.3.8 (30. 9. 2026)

**Cíl:** stabilní veřejná Alpha 1.0

Dokončené změny jsou v [českém](CHANGELOG.md) a [anglickém](CHANGELOG.en.md)
changelogu. Tento soubor obsahuje pouze otevřené úkoly a záměrně odložené náměty.

## Nejbližší priority (Alpha 0.3.x)

### Plán úprav podle říjnového feedbacku

Podklad: feedback Jana Hanzelky a čtyři screenshoty, přijaté 5. 10. 2026.
Nejdřív opravit vyhodnocení cílů a dostupnost informací, potom vysvětlit pravidla.
Obtížnost a bojové statistiky neměnit současně s těmito opravami. Most, levý panel,
vysvětlení rozkazů a prchání, nápověda, návrat z minihry i rozlišení ikon jsou
implementované a automaticky ověřené. Zbývá zaučení u Živohoště,
zvětšení prohlížeče a fyzický telefon. Existující místní
oprava nepřátelského tooltipu zůstává samostatnou připravenou změnou.

#### 1 Most a vyhodnocení cílů

- [x] **Viditelně označit městskou bránu i cílová pole Hněvína.**
  - Brána je konkrétní silniční hex `[9,12]`, nikoli městská pole Mostu.
  - Doplnit popisek mapy, detail při prohlížení pole a zvýraznění přes panel cílů.
  - Ukazovat průběh držení: Hněvín 2 kola, brána 6 kol. Vysvětlit, že jde
    o souvislé držení požadovaných polí na konci vlastního tahu.
- [x] **Opravit bonus „Splň OBA cíle“ a sladit ho s koncem bitvy.**
  - Původní chyba: `both_objectives` vracel splnění bez kontroly cílů; opraveno.
  - Hlavní pravidlo má zůstat „stačí jeden cíl“; mise nyní končí ihned při
    jeho splnění, což je v rozporu s dosažitelností původního bonusu.
  - **Implementovaná varianta:** zachovat okamžitý konec a bonus
    změnit na „Ovládni hrad i bránu“: splněný časový cíl a současné obsazení
    všech cílových polí obou lokalit. Název i popis musí odpovídat nové podmínce.
  - Pokud chceme plné časové splnění obou cílů, vyžaduje to jiné ukončení mise;
    takovou změnu nezavádět skrytě jako opravu bonusu.
- [x] **Srovnat texty Mostu v CS/EN.**
  - Upravit „Dobyjeme“ na „Dobudeme“ a „Dobij hrad“ na „Dobyj hrad“.
  - Závěr má odpovídat skutečně splněnému cíli; pouhé blokování brány nesmí
    automaticky oznámit dobytí Hněvína a splnění obou cílů.
- [x] **Přidat regresní scénáře.**
  - Obsazení města bez brány nesplní blokování; šest souvislých kol na bráně ano.
  - Opuštění nebo ztráta cílového pole vynuluje držení; Hněvín vyžaduje obě pole.
  - Vyhrát pouze hradem, pouze bránou a ověřit bonus podle potvrzené definice.
  - Ověřit počítadla po save/load, koncový limit, výsledný text a jiné typy vítězství.

#### 2 Levý panel na menších obrazovkách

- [x] **Obnovit bezpečné posouvání detailu jednotky.**
  - Opraven pozdější styl, který přepisoval posouvání detailu na `overflow: visible`.
  - V nízkém okně a dotykovém režimu se posouvá celý panel; ve vyšším okně
    samotný detail. Nový oddíl začíná nahoře, aktualizace stejného oddílu zachová posun.
  - Akce a obsah se nesmí překrývat ani zasahovat přes spodní ovládací lištu.
  - Zachovat funkční sbalení panelu, dotykové zobrazení i připravenou inspekci
    nepřítele v pravém panelu.
- [x] **Ověřit krátký i dlouhý detail v základních viewports prohlížeče.**
  - Pěchota, vůz, střelec s krycí palbou a velitel; CS/EN ověřeno.
  - Desktop 1920×1080, 1366×768, 1280×720 a kompaktní 1024×576 ověřeno.
  - Mobilní viewport 375×812 a landscape 844×390: dostupné celé informace,
    rozkazy i spodní lišta. Sbalení a opětovné otevření funguje.
- [ ] **Doplnit kontrolu zvětšení a skutečného telefonu.**
  - Zvětšení prohlížeče 125–150 %, systémového písma a skutečné dotykové ovládání;
    simulovaný viewport není ověření fyzického zařízení ani lišt X/LinkedIn.

#### 3 Vysvětlení vozů houfnice a prchání

- [x] **Popsat rozkazy vozů přímo u ovládání.**
  - Rozevření/sepnutí: který vůz se změní, možnost pohybu a spotřeba akce.
  - Celá linie: které sousedící vozy rozkaz ovlivní a které už nemohou jednat.
  - Pochod/zastavení: skupinový pohyb, překážky a změna ochrany.
  - Popisky tlačítek a rozbalovací vysvětlení jsou v CS/EN, včetně počtu vozů,
    kterých se rozkaz týká. Ověřeno dotykově v mobilním rozložení i klávesnicí;
    otevření nápovědy nemění rozkazy a neznepřístupní detail jednotky.
- [x] **Prověřit a přesně popsat pořadí akcí dělostřelectva.**
  - Potvrzené současné chování houfnice: po pohybu nevystřelí, ale po výstřelu
    se ještě může přesunout. Text „buď pohyb, nebo útok“ tomu neodpovídá.
  - Obě pořadí i výjimka mobilní tarasnice jsou otestované skutečnými akcemi.
    Detail jednotky a pravidla popisují současné chování v CS/EN;
    nepohyblivá děla mají samostatné vysvětlení.
  - Případné sjednocení na výlučnou volbu pohybu nebo střelby je samostatné
    rozhodnutí o hratelnosti, nikoli součást opravy nápovědy.
- [x] **Vysvětlit stav „Prchá“ a jeho možné konce.**
  - Rozlišit prchání, opětovné zformování, útěk přes okraj, dezertování uvnitř
    mapy a zničení oddílu, který nemůže ustoupit.
  - Detail a tooltip ukazují zbývající pokusy; pravidla a hlášky v CS/EN
    rozlišují skutečné konce. Dva pokusy o zformování, potom při třetím
    zpracování dezertování i uprostřed mapy; útěk není zničení.
  - Nová sada 35 testů pokrývá rozkazy vozů, pořadí palby, zformování,
    dezertování, okraj mapy, nemožnost ústupu, scénářové bez milosti,
    překlady a mlhu války. Šance na zformování ani pravidla morálky se nemění.

#### 4 Nápověda encyklopedie a návrat z minihry

- [x] **Zpřístupnit herní nápovědu pod srozumitelným názvem.**
  - `Jak hrát` v hlavním menu, bitvě i pauze otevírá Pravidla;
    Encyklopedie otevírá Historii. Sdílejí stávající obsah v CS/EN.
  - Zavření vrací fokus, aktivní záložka je na mobilní posuvné liště vidět.
- [x] **Sjednotit informace o jednotkách.**
  - Sudličníci mají v panelu, tooltipu i encyklopedii základní dosah 1
    a stejný popis podmíněného útoku na 2 hexy přes spojence.
  - Pražské varianty mají vlastní herní popisy v CS/EN, `wagon` má čitelný
    název. Nezdědí plošný útok, náraz ani jinou schopnost, kterou nemají.
  - Čísla vycházejí z dat, dělostřelectvo sdílí vysvětlení pořadí akcí;
    přepnutí jazyka zachová kartu i úplný katalog otevřený z menu.
- [x] **Přidat do Vozové hradby odkaz zpět do hlavní hry.**
  - Viditelný nativní odkaz nahoře v CS/EN, relativní `../../index.html`.
    Funguje i v podadresáři a při přímém vstupu bez historie prohlížeče.
  - Ověřen návrat klávesnicí a rozložení 320/375 px; kampaň a odměna zůstávají.
  - Balík pokrývá 17 nových regresních testů. Herní mechaniky se nemění.

#### 5 Ikony a první zkušenost

- [x] **Jemně rozlišit sdílené ikony jízdy a dělostřelectva.**
  - Po porovnání vybrána varianta Siluety: prostý kůň, kůň se štítem, rytíř
    s kopím; tarasnice, houfnice a pevná bombarda mají vlastní profily.
  - Šlechtická jízda používá štít, pražské houfnice profil houfnice;
    lehká jízda a zvědi ponechávají koně. Barvy stran ani stavy se nemění.
  - Společná kresba v mapě, přehledu, encyklopedii i bonusové hře; čtyři nové
    testy hlídají přiřazení, Canvas/SVG, zoomy, vyčerpání a mlhu války.
    Ověřeno oddálení mapy na 64 % a katalog v šířkách 320/375 px.
- [ ] **Zlepšit zaučení u Živohoště a pak znovu měřit obtížnost.**
  - Jasně uvést chráněné poutníky, dobu přežití a příchod posil; případný tip
    vysvětlí možnosti manévrování, nikoli povinný postup k vítězství.
  - Zaznamenat první pokusy dalších nezkušených hráčů bez nutnosti hledat návod na X.
  - Teprve podle výsledků rozhodnout o změně síly jednotek nebo načasování posil.

#### Ověření a vydání

Jednotlivé balíky ověřovat odděleně; zejména změnu bonusu nemíchat s laděním
obtížnosti. U textů vždy upravit CS i EN a u vizuálních změn uložit screenshoty.
Automatická brána je `node scripts/check.js`, doplněná ruční kontrolou změněných
obrazovek. Po implementaci zapsat skutečné změny do obou changelogů a upravit
potřebné cache verze. Číslo vydání, commit, push a nasazení řešit až na pokyn.

### P1 — Mobilní použitelnost

- [x] **Odstranit reprodukované přetékání v úzkém mobilním zobrazení.**
  - Na 320–360 px a na šířku prověřeny bitevní ovladače, panel oddílu, cíle,
    kampaňový briefing a herní menu. Opraveno lámání pověsti a úzký sloupec
    události; dlouhé texty v panelech se mohou bezpečně zalomit či posouvat.
- [ ] **Dokončit ruční mobilní kontrolu na fyzickém zařízení.**
  - Zvětšené systémové písmo, výsledky bitvy a další scénáře na Samsungu S24.
- [ ] **Ověřit spodní bezpečnou zónu ve skutečných in-app prohlížečích.**
  - X a LinkedIn, portrait i landscape; porovnat se Safari/Chrome.
  - Plovoucí lišta hostitelské aplikace nesmí zakrýt `Ukončit tah`, `Cíle` ani `Menu`.
  - Výpočtový odstup a běžné mobilní viewporty jsou otestované; test v hostitelských
    aplikacích vyžaduje skutečný telefon.

### P1 — Obtížnost první bitvy

- [ ] **Ověřit obtížnost Živohoště na dalších průchodech.**
  - Jeden tester ji nedokončil ani na pět pokusů; další nezkušený hráč uspěl
    přibližně na pátý pokus až s tipem na X. Před změnou čísel získat alespoň
    tři další výsledky a odlišit průchody s nápovědou od samostatných pokusů.
  - Zvlášť zaznamenat srozumitelnost cíle, načasování posil a možnosti obrany proti
    těžkému rytíři.
  - Rozlišit problém pravidel od nejasného vysvětlení; neupravovat rytíře jen podle
    jediného výsledku.

### P2 — Čitelnost rozhodování

- [x] **Ukázat možný dojezd viditelného nepřítele.**
  - Hover na desktopu, bezpečný výběr nebo dlouhý dotyk na mobilu.
  - Respektovat terén, aktuální stav a mlhu války; náhled nesmí odhalit skrytou
    jednotku ani informace, které hráč nemá znát.
- [x] **Prověřit, zda Nekmíř neřeší jediná pasivní taktika.**
  - Otestovat vozovou hradbu ponechanou v počáteční pozici.
  - Pokud je výhra opakovatelně triviální, změnit rozhodování AI nebo motivaci
    scénáře, ne pouze nahodile zvýšit statistiky protivníka.

### P2 — Texty a scénářové zprávy

- [ ] **Redakčně projít české texty, které působí strojově.**
  - Zachovat jasné rozlišení mezi pramenem, herní rekonstrukcí a autorskou fikcí.
  - Kontrolovat současně anglický význam, aby se jazykové verze nerozešly.
- [ ] **Prověřit zprávy závislé na stavu bojiště.**
  - Hláška nesmí oznamovat protiútok, paniku nebo výpad, pokud už pro něj nejsou
    odpovídající živé jednotky nebo podmínky.
  - Nekmířské zprávy jsou opravené; další konkrétní případy z hráčského feedbacku
    kontrolovat průběžně, ne plošným přepisem všech událostí.

### P2 — Mapa a výtvarná čitelnost

- [x] **Odlišit pláň, kopec a svah i bez tooltipu.**
  - Vyzkoušet jemnější tón pláně a čitelnější kresbu výškového terénu v současném
    dřevorytovém stylu.
  - Jednotky, dosahy a stavové značky musí zůstat kontrastní.
- [ ] **Nechat kresbu vody plynule navazovat přes sousední hexy.**
  - Preferovat souvislý motiv v souřadnicích mapy nebo hranově kompatibilní varianty.
  - Ověřit velké vodní plochy, členité pobřeží a několik úrovní přiblížení.
- [ ] **Ověřit s dalšími hráči srozumitelnost piktogramů jednotek.**
  - Měnit je pouze tehdy, pokud hráči opakovaně nerozeznají druh vojska nebo velitele;
    zachovat čitelnost v malém měřítku.

## Ruční kontrola před Alpha 1.0

Automatická brána je `node scripts/check.js`. Následující body vyžadují skutečný
prohlížeč, zařízení nebo lidské posouzení a automatické testy je nenahrazují.

### Scénáře v češtině i angličtině

- [ ] Bitva u Živohoště
- [ ] Bitva u Nekmíře
- [ ] Bitva u Sudoměře
- [ ] Bitva na Vítkově
- [ ] Bitva pod Vyšehradem
- [ ] Obrana Žatce
- [ ] Bitva u Kutné Hory
- [ ] Bitva u Německého Brodu
- [ ] Bitva u Mostu
- [ ] Bitva u Ústí nad Labem
- [ ] Bitva u Tachova
- [ ] Bitva u Nisy
- [ ] Bitva u Domažlic
- [ ] Obléhání Plzně
- [ ] Bitva u Lipan
- [ ] Obléhání hradu Sion
- [ ] Bitva u Hořic
- [ ] Bitva u Malešova

U každého scénáře zkontrolovat briefing, hlavní a bonusový cíl, události, výsledek,
zápis do Kroniky a přepnutí CS/EN. Není nutné opakovat testy mechanik, které už
spolehlivě kryje automatická sada.

### Průřezové funkce

- [ ] Quick Battle: vytvoření, restart a dokončení bitvy.
- [ ] Save/Load: ruční i automatický save, obnovení po načtení stránky.
- [ ] Mlha války a různé obtížnosti.
- [ ] Chorál, bombardování a další speciální schopnosti.
- [ ] Hlavní typy vítězství: přežití, zničení, únik a držení pozice.
- [ ] Tutoriál a encyklopedie v CS/EN.
- [ ] Kronika: zobrazení, přepnutí jazyka a stažení offline exportu.
- [ ] Žádné smíšené CS/EN texty ani chybějící překlady.

### Prohlížeče a zařízení

- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari na macOS a iOS
- [ ] Edge
- [ ] Android Chrome na úzkém telefonu
- [ ] Tablet v obou orientacích
- [ ] X a LinkedIn in-app browser

## Odložené směry

Tyto položky nejsou součástí nejbližší roadmapy. Před zahájením potřebují nové
rozhodnutí o rozsahu.

### Hratelnost a obsah

- [ ] Hratelná katolická strana.
- [ ] Lokální hotseat; nejprve prototyp jedné bitvy až po zpřístupnění obou stran.
- [ ] Online multiplayer pouze tehdy, pokud hotseat prokáže skutečný zájem.
- [ ] Strategická vrstva mezi bitvami.
- [ ] Statistiky po bitvě, achievementy a replay.
- [ ] Editor vlastních scénářů a další historické či alternativní bitvy.
- [ ] Další jazyky, zejména němčina a polština.

### Prezentace a platforma

- [ ] Animace skupinového pochodu sepnuté vozové linie.
- [ ] Další hudba, zvuky jednotek a střídmé efekty počasí či boje.
- [ ] PWA manifest a offline režim přes Service Worker.
- [ ] Volitelná anonymní telemetrie průchodů scénáři; základní návštěvnost už měří
  Cloudflare Web Analytics.
- [ ] Error reporting pouze s jasným souhlasem a popisem ochrany soukromí.
- [ ] Optimalizace obrázků, lazy loading nebo build/minifikace až podle měření výkonu.

## Opakovatelný release checklist

- [ ] Zvolit číslo verze a datum.
- [ ] Uzavřít český i anglický changelog.
- [ ] Sjednotit verzi v menu, překladech, README a tomto souboru.
- [ ] Spustit `git diff --check` a `node scripts/check.js`.
- [ ] Ručně ověřit změněné chování v prohlížeči a na relevantním mobilním viewportu.
- [ ] Commitnout a pushnout na `main`.
- [ ] Ověřit úspěšné CI, GitHub Pages a číslo verze na
  [hussitewars.com](https://hussitewars.com/).
