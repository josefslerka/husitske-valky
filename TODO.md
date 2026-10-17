# TODO — Husitské války

**Aktuální verze:** Alpha 0.3.10 (17. 10. 2026)

**Cíl:** stabilní veřejná Alpha 1.0

Dokončené změny jsou v [českém](CHANGELOG.md) a [anglickém](CHANGELOG.en.md)
changelogu. Tento soubor obsahuje pouze otevřené úkoly a záměrně odložené náměty.

## Nejbližší priority (Alpha 0.3.x)

### Plán úprav podle říjnového feedbacku

Podklad: feedback Jana Hanzelky a čtyři screenshoty, přijaté 5. 10. 2026.
Nejdřív opravit vyhodnocení cílů a dostupnost informací, potom vysvětlit pravidla.
Obtížnost a bojové statistiky neměnit současně s těmito opravami. Most, levý panel,
vysvětlení rozkazů a prchání, nápověda, návrat z minihry i rozlišení ikon jsou
implementované a automaticky ověřené. Živohošť má nově popsané minimum
původních oddílů, živé počítadlo a vysvětlení pohybu; srozumitelnost ještě
ověřit s dalšími začátečníky. Zvětšení Chromu na 125–150 % je ověřené,
fyzický telefon a systémové písmo zatím ne.
Oprava nepřátelského tooltipu je součástí Alpha 0.3.9.

Navazující feedback (Hořice, Malešov, Tachov, Domažlice, Lipany a rychlost AI)
zpracován v prvním balíčku 17. 10. 2026; viz bod 6. Tachov je výslovně odložený.

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
- [x] **Ověřit skutečné zvětšení prohlížeče 125–150 %.**
  - Chrome na desktopu, CS/EN: zadání mise, karta jednotky včetně spodních
    statistik, cíle a spodní ovládání. Dlouhý obsah se posouvá bez překrytí lišt.
- [ ] **Doplnit kontrolu systémového písma a skutečného telefonu.**
  - Zvětšené systémové písmo a skutečné dotykové ovládání; simulovaný viewport
    ani desktopový zoom nenahrazují fyzické zařízení a lišty X/LinkedIn.

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
- [x] **Zpřehlednit podmínky Živohoště a základní pohyb bez změny obtížnosti.**
  - Briefing a hlavní cíl uvádějí 5 celých kol a nejméně 40 % původních oddílů
    (4 z 8). Živé počítadlo nezahrnuje posily; vysvětlen je příchod posil
    na začátku 5. kola a rozdíl mezi přežitím a prcháním nepřítele.
  - Opravený tip odkazuje na pojmenovaný kopec Červenka, ne na zelenou barvu terénu.
  - Briefing, rozkazy a pravidla vysvětlují body pohybu, jednu akci přesunu,
    náklady terénu, překážky a výjimky; ceny čtou skutečná pravidla.
  - CS/EN a 21 nových regresních testů; síla jednotek ani posily se nemění.
- [ ] **Znovu ověřit první zkušenost a obtížnost po úpravě zaučení.**
  - Zaznamenat první pokusy dalších nezkušených hráčů bez nutnosti hledat návod na X.
  - Teprve podle výsledků rozhodnout o změně síly jednotek nebo načasování posil.

#### 6 Navazující cíle Lipany a rychlost AI

- [x] **Označit přesná pole Hořic, Malešova a Domažlic a sladit popis s hodnocením.**
  - Zlatý obrys a ◇, počítadlo obsazení, tooltip a `Ukázat na mapě`.
  - Hořice a Malešov: při vítězství alespoň 2 ze 4 označených polí;
    Domažlice: obě označená pole. Opuštění a pozdější návrat nevadí.
  - Stejný výpočet pro živý stav i výsledek; mrtvé a uprchlé oddíly se nepočítají.
- [x] **Opravit další vyhodnocování Malešova.**
  - Striktně méně než 30 % původních oddílů, ne 30 ztracených jednotek.
  - Podmínka přežití vyžaduje Žižku, nikoli jiného velitele.
- [x] **Respektovat herní vítězství u Lipan při výpočtu pověsti.**
  - Historický propad pouze po skutečné porážce před prvním vítězstvím;
    neznehodnocovat dříve vyhranou bitvu prohrou při opakování.
  - Výsledek ukazuje skutečnou změnu pověsti po všech omezeních.
    Staré záznamy ani dříve snížená pověst se zpětně nepřepisují.
- [x] **Umožnit vratné přepínání rychlosti soupeře.**
  - Indikátor tahu i herní menu, aktuální režim, CS/EN, klávesnice a save/load.
  - Menu umožní návrat i mezi tahy. Nová bitva začíná normálně;
    rozpracovaná akce doběhne, rozhodování AI a pravidla se nemění.
- [x] **Ověřit první balíček.**
  - 36 nových regresí, shoda počítadel a konečného výsledku, focus, mlha války,
    nezměněné ostatní scénáře a bojové statistiky.
  - Ručně 1280×720, 375×812 a 320×640; přepnutí zpět během stejného tahu.
- [ ] **Tachov: samostatně prověřit rychlý konec a dosažitelnost volitelných cílů.**
  - Odloženo na přání uživatele; nyní neměnit paniku, chorál, obtížnost ani konec.
  - Prověřit dobytí města před automatickým vítězstvím a požadavek 75 % zničených
    před útěkem. Rozlišit skutečné zničení od útěku v počítadle i popisu.
  - Případné pokračování v pronásledování či změnu cíle řešit jako vlastní
    rozhodnutí o hratelnosti, ne jako skrytou opravu tohoto balíčku.

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

- [x] **První redakční a pramenný průchod medailonků jednotek v CS/EN.**
  - Revidováno 26 medailonků druhů vojska a sedm velitelských; sjednoceny
    dotčené krátké popisy. Autorské poznámky se nevydávají za citace kronik.
  - Opraveny záměny příbuzných, Divišův vztah k Žižkovi, nepodložené výroky
    a anachronické vybavení; nejisté složení vojska je označené jako rekonstrukce.
  - U 18 karet konkrétní další čtení, osm nových podkladů. Deset nových testů
    hlídá překlady, bezpečné vykreslení, zdroje, save/load a nezměněné statistiky.
- [ ] **Dokončit historický audit zbývajících velitelských životopisů.**
  - První průchod pokrývá sedm z 27 velitelů; dalších 20 medailonků ještě
    potřebuje kontrolu údajů, připsaných výroků a konkrétního odborného čtení.
  - Zvlášť Prokop, Želivský, Koranda a protivní velitelé; prověřovat současně
    krátký popis i celý medailonek v obou jazycích. Revize jednotek nenahrazuje
    odbornou kontrolu scénářů a obecné historie v encyklopedii.

- [x] **Druhý malý textový balíček bez změny obtížnosti.**
  - Rytířská jízda / Knightly Cavalry, Střelci z ručnic / Handgunners;
    názvy sjednocené v herních pohledech, nápovědě, savech a u střelců v minihře.
  - Volitelné cíle jsou výzvy do závěrečného hodnocení, ne odměny nebo nutná
    podmínka vítězství. Vysvětlení je před bitvou, v cílech, pravidlech i výsledku.
  - Bojový chorál viditelně ukazuje jednorázové použití; nápověda ho odlišuje
    od přepínače hudby. Kratší Hlas z bojiště dál přiznává fikci, ne citaci.
  - CS/EN, kompatibilita uložených her a 17 nových regresních testů;
    jednotky, herní pravidla a obtížnost se nemění.

- [ ] **Redakčně projít české texty, které působí strojově.**
  - Zachovat jasné rozlišení mezi pramenem, herní rekonstrukcí a autorskou fikcí.
  - Kontrolovat současně anglický význam, aby se jazykové verze nerozešly.
- [x] **Zkrátit a uhladit nové reaktivní hlášky v CS/EN.**
  - Odstraněny technické vsuvky o scénářovém skriptu, zkráceny opakované zprávy
    o velitelích a některé závěry. Zachováno rozlišení skutečného stavu a historie.
  - Tři další regrese hlídají stručnost a stejné stavové/výsledkové větve;
    pravidla, obtížnost i Tachov včetně překladů beze změny.
- [x] **První cílená kontrola zpráv podle stavu bojiště.**
  - Hořice, Malešov, Plzeň, Nekmíř, Vyšehrad, Žatec a Sion rozlišují osud
    velitelů a stav bojových skupin. Prchání střelců není útěkem celé pěchoty.
  - Problematické fáze nepředjímají útok, útěk, palbu ani kořist; očekávané
    posily nejsou vydávané za potvrzeně příchozí. Historický příběh je oddělený
    od skutečného průběhu partie.
  - Závěry Brodu, Plzně a Malešova rozlišují vyřazení protivníka od obsazení,
    Domažlice vyžadují obě pole pro potvrzení zajištěného přístupu a Sion
    ukládá skutečný Roháčův osud. Staré zápisy Kroniky se nepřepisují.
  - CS/EN, 24 nových regresí, ochrana mlhy války a zachování stavu čekající
    zprávy při překladu. Účinky, podmínky, ID, kola, AI i obtížnost beze změny.
  - Tachov včetně textů je výslovně vynechaný a zůstává samostatným úkolem.
- [ ] **S dalšími hráči ověřit srozumitelnost reaktivních hlášek.**
  - Průběžně kontrolovat další konkrétní rozpory z feedbacku a nezaměňovat
    cílenou opravu vyprávění za úplný historický audit nebo test celé kampaně.

### P2 — Mapa a výtvarná čitelnost

- [x] **Odlišit pláň, kopec a svah i bez tooltipu.**
  - Vyzkoušet jemnější tón pláně a čitelnější kresbu výškového terénu v současném
    dřevorytovém stylu.
  - Jednotky, dosahy a stavové značky musí zůstat kontrastní.
- [x] **Zjemnit kresbu svahu na Vítkově.**
  - Ostré skalní štíty nahrazeny vrstevnicemi na světlejším podkladu;
    společná kresba platí pro všechny mapy i legendu terénu.
  - Ověřeno při 100% a 64% přiblížení, bez změny pravidel nebo terénních dat.
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
