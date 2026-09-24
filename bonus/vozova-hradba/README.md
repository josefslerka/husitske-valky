# Vozová hradba

Samostatně spustitelná bonusová tower defense hra v adresáři hlavní hry. Je to
arkádová odměna po první kampani, ale během testování není postup kampaně
vyžadován.

## Spuštění a odkaz pro testery

[Stálá testovací adresa](https://josefslerka.github.io/husitske-valky-test/bonus/vozova-hradba/).
Pokyny pro testery a způsob předání postřehů jsou v [PLAYTEST.md](PLAYTEST.md).

Vývojová podoba čte z **adresářů `js/data` a `js/ui` hlavní hry** ceny jednotek
a původní dřevořezové symboly. Při lokálním testu
spusťte statický server z kořene repozitáře, například:

```sh
python3 -m http.server 8778
```

Pak otevřete `http://127.0.0.1:8778/bonus/vozova-hradba/`. Na hostovaném webu
testerům pošlete základní adresu webu doplněnou o `bonus/vozova-hradba/`.
Hra nevyžaduje přihlášení,
uloženou kampaň ani další serverovou logiku. Odkaz z hlavní stránky lze přidat
po odzkoušení.

Pro zveřejnění na stávajícím testovacím webu připraví následující skript
samostatný adresář, včetně přesné kopie obou sdílených souborů v `shared/`:

```sh
node scripts/prepare-tower-defense.js /cesta/k/testovacimu-repozitari/bonus/vozova-hradba
```

Publikuje se jen tento adresář do `main` repozitáře `husitske-valky-test`.
Jeho hlavní hra může mít jinou verzi kreslení a jednotek; bonus má právě
otestované kopie. `release.json` obsahuje verzi a kontrolní součty všech
souborů. Produkční konfigurace `CNAME` do tohoto adresáře nepatří.

## Ovládání

- Klepněte na volný hex, vyberte ručničáře, cepníky, houfnici nebo bojový vůz
  a zkontrolujte náhled dosahu. Umístění potvrďte tlačítkem Postavit.
  Nabídka se přesouvá nad nebo pod zvolené pole, aby je nezakrývala.
- Jednotky bojují samy. Ručničáři střílejí z dálky, cepníci prorážejí zbroj,
  houfnice zasahuje skupiny a vůz zpomaluje nepřátele a posiluje sousedy.
- Klepnutím na oddíl jej můžete dvakrát vylepšit nebo stáhnout za část ceny.
- Trojúhelníkem označená návrší dávají ručničářům a houfnicím další hex
  dostřelu. Na mapě jsou tři; používají kresbu terénu z hlavní hry.
- Značky **I a II** na cestě nebo tlačítko **Záseky** otevřou náhled objížďky.
  Tlačítko **Výhody** ukazuje vylepšení přijatá při válečných poradách.
- Osm vln vysíláte tlačítkem; jejich složení a počet zbývajících protivníků
  jsou nad mapou. Po vstupu posledního útočníka lze další vlnu přivolat dřív
  za groše. Odměna za každou odraženou vlnu zůstává zachována i při překrytí.
  Chorál pomůže jednou za partii.
- Při prvním hraní se ukážou tři stručné tipy přímo na mapě. Lze je vypnout
  a znovu zapnout v nápovědě. Tip o záseku přijde až po první vlně.
- Tlačítko pauzy nebo klávesa P zastaví boj a dovolí stavět. Po přepnutí
  do jiné karty zůstane bitva pozastavená. Novou partii zahájíte tlačítkem ↻.
- Hra podporuje češtinu a angličtinu, myš, dotyk i klávesnici.

Minigra čerpá názvy, základní ceny a výtvarný jazyk z hlavní hry. Výdrž tábora,
dosahy a rytmus vln jsou vlastní pravidla krátkého arkádového režimu.

## Hexová mapa a dosahy

Mapa používá stejně orientované hexy jako hlavní hra: rovná horní hrana,
liché sloupce posunuté dolů. Cesta vede přes společné hrany sousedních hexů.
Nepřátelé se pohybují plynule a účinek se řídí hexem, na kterém právě stojí.

| Oddíl | Úroveň 1 | Úroveň 2 | Úroveň 3 |
| --- | ---: | ---: | ---: |
| Cepníci | 1 hex | 1 hex | 1 hex |
| Ručničáři | 2 hexy | 2 hexy | 3 hexy |
| Houfnice | 3 hexy | 3 hexy | 4 hexy |
| Vůz – zpomalení | 1 hex | 1 hex | 2 hexy |

Dosah je počet přechodů přes společnou hranu, nikdy desetinný poloměr.
Náhled zvýrazňuje celá zasažitelná pole a používá stejnou vzdálenost jako
palba a zpomalení. Cepníci zůstávají jednotkou pro boj zblízka; jejich
vylepšení zvyšuje sílu a rychlost útoku. Houfnice způsobí plné poškození
ve zvoleném hexu a poloviční v šesti sousedních hexech.

### Návrší

Tři hexy `(3,0)`, `(6,6)` a `(2,9)` (indexy od nuly) dávají ručničářům
a houfnicím **+1 hex** ke všem úrovním dostřelu. Bonus se sčítá s třetí
úrovní jednotky. Cepníci ani vozy jej nedostávají; podpora vozů zůstává
v šesti sousedních hexech. Náhled stavby, nabídka vylepšení i skutečná palba
počítají stejný výsledný dosah.

### Záseky a objížďky

- Každý ze dvou záseků stojí **25 grošů** a prodlužuje cestu o **2 hexy**.
  Oba současně přidají 4 hexy. Modrá přerušovaná čára ukazuje trasu po změně;
  tmavší cesta a šipky označují aktuální trasu.
- Přestavba je možná před první vlnou a mezi vlnami, pouze pokud na celé
  cestě nikdo nezůstal. Pauza během útoku přestavbu neumožní. Rozebrání
  vrací přesně celých 25 grošů.
- Krátká větev i objížďka jsou vždy vyhrazené pro cestu. Nelze na ně
  umístit oddíl. Všechny čtyři kombinace záseků mají průchod až do tábora.
- Zásek pošle útok jinudy; sám neútočí ani nezpomaluje. Za delší trasu
  se platí groši a jiným pokrytím zbraní. Obsluha nemůže měnit trasu
  pod postupujícími nepřáteli.

### Válečné porady

Po odražení vln **2, 4 a 6** se nabídnou dvě výhody. Hráč vybere jednu
a potvrdí ji. Během porady stojí celá simulace, včetně rozběhnuté další
vlny, přebíjení a chorálu. Výhoda platí pro všechny stávající i budoucí
oddíly daného druhu až do nové partie; druhá možnost již není dostupná.

| Vlna | První možnost | Druhá možnost |
| --- | --- | --- |
| 2 | **Lepší prach:** ručničáři mají +20 % útoku. | **Okované cepy:** cepníci mají +25 % útoku; prorážení zbroje zůstává. |
| 4 | **Sehraná obsluha:** houfnice mají o 25 % kratší přebíjení. | **Široký rozptyl:** první prstenec dostává 65 % poškození, druhý 35 %. |
| 6 | **Řetězy mezi vozy:** zpomalení vozů +10 procentních bodů. | **Sehraná hradba:** podpora vozů +12 procentních bodů, součet stále nejvýše +80 % útoku. |

Široký rozptyl ponechává plné poškození v cílovém hexu. Brnění se odečítá
od každého zásahu. Rychlejší přebíjení zkrátí
stejným poměrem i právě rozběhnuté nabíjení. Výběr se uloží do přehledu
Výhody; restart obnoví základní pravidla i krátké cesty.

## Jak fungují vozy

Vůz sám neútočí; je vhodný jako podpora již postavených zbraní.
Tabulka uvádí hodnoty před případnou výhodou z porady po šesté vlně.

| Úroveň | Dosah zpomalení | Zpomalení | Útok sousedních oddílů |
| --- | ---: | ---: | ---: |
| 1 | 1 hex | 30 % | +32 % |
| 2 | 1 hex | 36 % | +38 % |
| 3 | 2 hexy | 42 % | +44 % |

- **Červené hexy cesty:** zpomalení platí pouze na těchto polích. Přesýpací
  hodiny označují zasaženého nepřítele. Při překryvu se použije nejsilnější
  vůz; ostatní rozšiřují pokrytí. Po opuštění zasažených hexů účinek končí.
- **Zlaté hexy:** podpora útoku platí v šesti sousedních hexech se společnou
  hranou. Bonusy vozů se sčítají nejvýše do +80 %; odečtení brnění se
  provede až po výpočtu posíleného útoku. Vylepšení nezvětšuje počet sousedních polí.
- **Chorál:** násobí zbývající rychlost číslem 0,75. Se základním vozem
  zbude 52,5 % rychlosti, tedy celkové zpomalení 47,5 %. Samotný chorál
  označují zlaté hodiny.
- V detailu vozu je živý počet nepřátel v jeho dosahu a podporovaných oddílů.
  Při stavbě mimo dosah cesty se zobrazí upozornění.

## Výsledek a zpětná vazba

- Výhra s 20 body tábora má tři hvězdy, s 10–19 dvě, s 1–9 jednu.
  Po porážce je vidět počet dokončených vln. Rekord porovnává nejprve
  vítězství, poté dokončené vlny, tábor a zastavené nepřátele.
- Poškození je součet skutečně ubrané výdrže, bez přestřeleného zbytku.
  Zastavení se připisuje poslednímu útočníkovi. Stažené oddíly své zásahy
  neztrácejí. Součet jejich zastavení odpovídá celkovému počtu.
- Přínos podpory vozů je rozdíl mezi skutečným zásahem a stejným zásahem
  bez podpory, se stejným brněním, chorálem a zbývající výdrží cíle.
  Je už zahrnutý v poškození zbraní, takže se znovu nepřičítá.
- Doba zpomalení se sčítá přes jednotlivé nepřátele. Dvě překrývající se
  zóny stejného nepřítele nezapočítají dvakrát; samotný chorál se vozům
  nepřipisuje. Čas boje je simulační čas v rychlosti 1×, bez pauz a porad.
- **Postřehy a odkaz** funguje během hry i po výsledku. Tři volby a text
  se kopírují společně s herním souhrnem. Bez dostupné schránky se zobrazí
  označený text pro ruční kopírování. Žádný automatický sběr na serveru.
- Záznamy se ukládají pod klíčem `wagonDefense:9:<cesta minihry>`.
  Testovací web a hlavní hra mají oddělené klíče; úložiště jiné hry se
  nečte ani nemění. Nedostupné úložiště nebrání hraní.

Kontrola shody hexové geometrie s hlavní hrou, hranic výběru, dosahů,
skutečného pohybu, překryvů, vylepšení, prodeje, podpory útoku, všech
kombinací cest a účinků výhod (včetně dvou kompletních vítězných sestav):
`node scripts/test-tower-defense.js`.

Závěry rešerše a návrhy pro další testování jsou v [DESIGN-RESEARCH.md](DESIGN-RESEARCH.md).
Porovnání 38 situací a odůvodnění změny rozptylu je v [BALANCE.md](BALANCE.md).
