# TODO — Husitské války

**Aktuální verze:** Alpha 0.3.5 (19. 9. 2026)

**Cíl:** stabilní veřejná Alpha 1.0

Dokončené změny jsou v [českém](CHANGELOG.md) a [anglickém](CHANGELOG.en.md)
changelogu. Tento soubor obsahuje pouze otevřené úkoly a záměrně odložené náměty.

## Nejbližší priority (Alpha 0.3.x)

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
  - Jeden tester ji nedokončil ani na pět pokusů; před změnou čísel získat alespoň
    tři další výsledky.
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
