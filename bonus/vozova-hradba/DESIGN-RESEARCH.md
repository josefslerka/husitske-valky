# Vozová hradba: rešerše tower defense a kontrola vozů

**Verze 9:** po porovnání 38 pevných situací je Široký rozptyl posílen na
65 % poškození v prvním a 35 % ve druhém prstenci. Základní houfnice zůstává
na 100/50 %. Metoda, výsledky a meze závěrů jsou v [BALANCE.md](BALANCE.md).
První hraní má krátké zaučení, výsledek ukazuje skutečné zásahy i podporu
vozů a testovací verze umožňuje předat kopírovatelné hodnocení.

## Přidaná inspirace ve verzi 8

Po převodu na hexy byly na žádost uživatele doplněny tři mechaniky:

| Primární zdroj | Popsaná vlastnost jiné hry | Naše provedení |
| --- | --- | --- |
| [Hexguardian – popis vývojáře na Steamu](https://store.steampowered.com/app/2381740/Hexguardian/) | Vyšší poloha prodlužuje dostřel věží. | Tři návrší s +1 hexem dostřelu pro ručničáře a houfnice, s původní kresbou terénu Husitských válek. |
| [HexaScape: Cyber Defense – popis vývojáře na Steamu](https://store.steampowered.com/app/2647510/HexaScape_Cyber_Defense/) | Odemykání schopností a úpravy věží pomocí bodů dovedností. | Válečné porady po 2., 4. a 6. vlně, vždy výběr jedné ze dvou výhod pro celou aktuální obranu. |
| [HexDefense – popis autora na Google Play](https://play.google.com/store/apps/details?id=com.gotow.hexdefense) | Hráč stavbou věží vytváří na hexové mapě bludiště. | Dva placené záseky přepínají připravené větve cesty. Přestavba jen na prázdné mapě mezi vlnami; všechny kombinace zůstávají průchodné. |

Konkrétní hodnoty, nabídky porad a omezení přestavby jsou náš návrh.
Automaticky je ověřena skutečná palba z návrší, účinky všech šesti výhod,
zastavení simulace během porady při překrytých vlnách a pohyb nepřítele
po všech čtyřech kombinacích cest. Dvě obrany financované jen příjmy ze hry
dokončí všech osm vln s oběma sadami voleb; druhá také kupuje oba záseky.
To dokládá dosažitelnost výhry, nikoli vyváženost všech strategií.
Aktuální pravidla jsou v [README.md](README.md).

## Starší audit

**Aktualizace po převodu na hexy (verze 7):** geometrické dosahy a testy
sestav níže zachycují předchozí čtvercovou verzi 6. Aktuální hra používá
celé hexy a šest sousedů. Platná pravidla a tabulka dosahů jsou
v [README.md](README.md#hexová-mapa-a-dosahy). Procenta zpomalení,
podpory a jejich kombinování zůstávají stejná; náhled, palba i zpomalení
nově používají hexovou vzdálenost. Účinek houfnice je plný v cílovém
hexu a poloviční v sousedních. Balanc sestav je proto potřeba znovu
posuzovat na této geometrii. Test výhry se smíšenou obranou prošel i na hexech.

23. září 2026. Cíl: krátká samostatně přístupná odměna po první kampani,
se zbraněmi a grafikou Husitských válek. Zdroje níže jsou návody vydavatelů
a výpovědi samotných vývojářů. Nejde o měření aktuálního vyvážení cizích her;
u každého příkladu rozlišujeme konkrétní hru/verzi a vlastní návrh pro náš bonus.

## Co si vzít z jiných her

| Hra / zdroj | Doložená mechanika nebo zkušenost | Návrh pro Vozovou hradbu |
| --- | --- | --- |
| **Kingdom Rush Battles** – oficiální průvodce [Dwarven Drill](https://support.ironhidegames.com/support/solutions/articles/4000223650-dwarven-drill-skills-breakdown-control-the-ground-in-kingdom-rush-battles) a [Dwarven Artillery](https://support.ironhidegames.com/support/solutions/articles/4000223644-dwarven-artillery-skills-breakdown-kingdom-rush-battles-tower-guide), 3. 11. 2025 | Drill má nízké poškození jednotlivého cíle, ale krátkými zastaveními prodlužuje působení dalších věží. Artillery trestá shluky plošným poškozením. Autoři doporučují kombinovat kontrolu pohybu s palbou a využívat zákruty. | Vůz vytváří úsek delšího ostřelování. Houfnice využívá shluky, cepníci řeší zbroj, ručničáři rychle pálí. Jejich role musí hráč rozeznat během boje. |
| **Defense Grid: The Awakening** – [oficiální manuál](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/18500/manuals/manual_english.pdf?t=1721059385), zejména s. 2–3 a 9–13 | Rozhraní ukazuje hrozby a dosah. Věže mají jasné výhody a slabiny. Temporal zpomaluje a jeho vylepšení rozšiřují dosah. Command přináší malý užitek z překryvu. | Ukazovat skutečný dosah, efekt na konkrétní nepřátele a přínos dalšího vozu. Při nákupu má být jasné, zda rozšiřuji pokrytí, nebo podporuji další zbraň. |
| **Element TD, verze pro Dota 2** – [vývojář Noya, 1. 3. 2016](https://forums.eletd.com/topic/95381-submit-your-tips-here/) | Vývojář uvádí násobení zpomalení a sandbox pro ověřování sestav. Jde o tuto starší verzi, nikoli o ověření pravidel Element TD 2. | Explicitně stanovit kombinování efektů. U nás nejsilnější vůz, chorál násobí zbylou rychlost. Toto pravidlo je vlastní designová volba, nikoli univerzální pravidlo žánru. |
| **Sanctum 2** – [postmortem Johannese Aspebyho, 7. 5. 2014](https://www.gamedeveloper.com/business/postmortem-sanctum-2) | Autoři popsali podpůrnou věž, která měnila vizuální indikaci dosahu, ale její skutečný účinek nefungoval. Hráči i testeři ji přesto považovali za užitečnou. Zmiňují také nedostatečné vyhodnocování prototypů a potřebu vnějšího testování. | Odděleně ověřit skutečný posun nepřítele a skutečně způsobené poškození. Vizuální dojem není důkaz. Nové značky čerpají ze stejných pravidel jako pohyb. |
| **Defenders of the Last Colony** – [postmortem Sergia Santose, 16. 11. 2016](https://www.gamedeveloper.com/business/defenders-of-the-last-colony-postmortem) | Vývojáři považují množství souběžných činností za problém; vysvětlující obrazovky a text ho samy nevyřešily. | Pro krátký bonus držet čtyři srozumitelné oddíly, osm vln a jednu aktivní schopnost. Další složitost přidávat až podle pozorování testerů. |

## Co ukázal audit verze 6 před převodem na hexy

Zpomalení fungovalo již před úpravou. Nedostatečná byla jeho čitelnost:
nepřítel neměl značku účinku, dvě různé oblasti vozu nebyly vysvětlené
a stavba mimo dosah cesty nevarovala. Dosah zpomalení je kruh; podpora
útoku používá osm sousedních polí a vylepšením se nerozšiřuje.

Měřeno z posunu po cestě během simulace, nikoli z popisku jednotky:

| Vůz | Zpomalení | Zbývající rychlost | Zpomalení s chorálem |
| --- | ---: | ---: | ---: |
| Základní | 30 % | 70 % | 47,5 % |
| Úroveň 2 | 36 % | 64 % | 52 % |
| Úroveň 3 | 42 % | 58 % | 56,5 % |

Dva základní vozy ve stejném místě stále dávají 30 %. Překryv základního
a třetí úrovně dává 42 %, nezávisle na pořadí stavby. Ověřeny všechny čtyři
druhy nepřátel, vstup/výstup z dosahu, rozšíření dosahu vylepšením, prodej,
reset i souběh s chorálem. Pohyb se vyhodnocuje po simulačních krocích,
nejvýše 80 ms; hranice kruhu proto nemá spojitou přesnost na podkrok.

Podpora byla ověřena na skutečných zásazích ručničářů proti neobrněnému cíli:
9 bez vozu, 11,88 s jedním základním vozem, 14,76 se dvěma a nejvýše 16,2
s více vozy (+80 %). Funguje i úhlopříčka a vylepšení. Vzdálený vůz
útok neovlivňuje.

### Proč nezvyšovat zpomalení bez měření

Vlastní výpočet: při zpomalení o 30 % trvá průchod stejným úsekem
`1 / 0,70 = 1,429` původního času, tedy **o 42,9 % déle**.
S podporou útoku +32 % může zbraň během společného dosahu teoreticky
způsobit `1,32 / 0,70 = 1,886`, tedy asi o 89 % více poškození.
To předpokládá nepřetržitou palbu, stejný pokrytý úsek a neobrněný cíl;
skutečný výsledek ovlivní přebíjení, volba cíle, brnění a příchod dalších jednotek.
Samotné procento zpomalení tedy nevystihuje sílu podpory.

### Riziko prvního nákupu

Kontrolní simulace první vlny: 170 počátečních grošů, každá níže uvedená
sestava stála 160, bez dalších nákupů a chorálu, krok 0,04 s.
Souřadnice jsou indexy od nuly.

| Sestava | Zastavení nepřátelé | Zbývající tábor |
| --- | ---: | ---: |
| Vůz (2,3), cepníci (3,3) | 1 z 8 | 13 |
| Houfnice (3,3), ručničáři (4,4) | 8 z 8 | 20 |
| Ručničáři (3,3) a (4,4), cepníci (0,6) | 8 z 8 | 20 |

Toto není hledání optimální sestavy ani důkaz zbytečnosti vozů. Ukazuje to
riziko podpory koupené dříve než dostatečná palba. Cena vozu 120 odpovídá
hlavní hře. Nabídka teď výslovně říká, že vůz sám neútočí a slouží k podpoře
postavených zbraní.

## Úpravy provedené ve verzi 6

- Značka přesýpacích hodin a obrys na skutečně zpomaleném nepříteli.
- Červeně vyznačený zpomalovaný úsek cesty; překryv není falešně tmavší.
- Zlatá sousední pole při výběru či náhledu vozu, spojnice k podporovaným zbraním.
- Živý počet nepřátel v kruhu a podporovaných oddílů v detailu vozu.
- Přesná hodnota podpory v detailu zbraně; vysvětlení překryvu a chorálu v nápovědě.
- Upozornění na vůz mimo dosah cesty.
- Regresní testy skutečného pohybu a zásahů v `scripts/test-tower-defense.js`.

## Priority dalšího hraní s testery

1. **Porozumění:** pozná hráč bez nápovědy zpomaleného nepřítele a rozdíl
   mezi kruhem a zlatými poli? Rozhodne se rozšířit dosah dalším vozem?
2. **Ekonomika podpory:** kupují se vozy až k více zbraním a vyplatí se proti
   dalšímu střelci nebo vylepšení? Porovnávat stejně drahé sestavy ve více
   pozicích a vlnách. Podle toho teprve měnit cenu nebo účinek.
3. **Volba zbraně:** vyžádají si rytíři cepníky a shluky houfnici? Výhra
   jediným typem rozmístěným téměř libovolně by oslabila smysl rolí.
4. **Tempo:** měřit délku první partie, vlnu první prohry a využití pauzy,
   chorálu a předčasných vln. Cílovou délku krátkého bonusu ještě ověřit hraním.

Tyto body jsou návrhy dalšího vyvážení, nikoli již ověřené závěry o všech
strategiích. V tomto průchodu se měnila čitelnost a kontrolovatelnost;
hodnoty cen, zpomalení, podpory a síly vln zůstaly na dosavadních hodnotách.
