# Vyvážení verze 9

23. září 2026. Reprodukovatelný audit:

```sh
node scripts/balance-tower-defense.js
node scripts/balance-tower-defense.js --json
```

Skript má **38 pevných srovnání**: čtyři zahájení, dvanáct porovnání posil,
šestnáct kombinací porad a šest porovnání záseků. Každý scénář začíná
čerstvým táborem s 20 body a izoluje jednu vlnu. Simuluje krokem 0,04 s,
bez dalšího nakupování, vylepšování úrovně, chorálu a předčasných vln.
Polohy i rozpočty jsou pevně uvedené ve skriptu. Nejde o hledání optimálních
pozic ani o odhad úspěšnosti skutečných hráčů.

## Začátek: stejných 160 grošů, první vlna

| Sestava | Zastavení / 8 | Tábor |
| --- | ---: | ---: |
| Houfnice + ručničáři | 8 | 20 |
| Dva ručničáři + cepníci | 8 | 20 |
| Čtyři oddíly cepníků | 8 | 20 |
| Vůz + cepníci | 1 | 13 |

Existuje více dobrých začátků. Vůz potřebuje další palbu, proto zaučení
doporučuje jako první nákup zbraň a výsledkový tip vysvětluje slabou sestavu
s vozem. Jeho cena zůstává shodná s hlavní hrou.

## Posily: dalších 120 grošů k pevné obraně za 360

Základ: dvě houfnice, dva ručničáři a jedni cepníci; pozice jsou ve skriptu.
Posily jsou buď dva ručničáři, tři cepníci, nebo jeden podpůrný vůz.

| Posila | Tábor po vlně 3 | Vlna 5 | Vlna 7 | Vlna 8 |
| --- | ---: | ---: | ---: | ---: |
| Dva ručničáři | 20 | 10 | 14 | 0 |
| Tři cepníci | 20 | 18 | 16 | 3 |
| Vůz | 20 | 12 | 14 | 0 |

Cepníci jsou v těchto pozicích silní proti jízdě. Vůz pomáhá skutečným
zpomalením a podporou, ale v dané sestavě nenahradí dostatečnou protibrněnou
palbu. Na vlně 7 přidal 226 skutečného poškození a součet doby zpomalení
činil 76 sekund přes všechny nepřátele.

## Úprava širokého rozptylu

Původní výhoda zasáhla druhý prstenec za 25 % poškození a první ponechala
na 50 %. Ve všech osmi srovnáních s jinak shodnou sestavou na vlnách 7 a 8
měla horší výsledek tábora než rychlejší přebíjení.

Ve verzi 9 proto **Široký rozptyl** zasahuje první prstenec za **65 %**
a druhý za **35 %**. Přímý zásah i houfnice bez této výhody zůstávají stejné.

Příklad s obranou za 480 grošů a Lepším prachem:

| Další volby | Tábor: vlna 7 | Tábor: vlna 8 |
| --- | ---: | ---: |
| Rychlejší přebíjení + řetězy | 20 | 3 |
| Rychlejší přebíjení + sehraná hradba | 18 | 5 |
| Široký rozptyl + řetězy | 20 | 3 |
| Široký rozptyl + sehraná hradba | 20 | 3 |

V tomto porovnání rozptyl lépe zvládá skupiny, přebíjení se silnější podporou
lépe vychází proti závěrečnému útoku. Volby u vozů se podle situace střídají
ve výhodnosti; jejich hodnoty se neměnily. Podobně výsledek volby mezi prachem
a cepy závisí na zastoupení zbraní. Všech osm kombinací je ve výstupu skriptu.

## Cena objížďky

Při rozpočtu 530, základní obraně za 480 a páté vlně zůstalo bez dalšího
nákupu 12 bodů tábora, s oběma záseky za 50 grošů 14 a s dalšími cepníky za
40 grošů také 14. Objížďka prodloužila boj z 21 na 23,4 sekundy.
Záseky mají cenu podle pokrytí nové větve palbou; ceny a cesty se neměnily.

## Hranice závěrů

Automatické testy navíc dokončí celé osmivlnové obrany s oběma sadami
voleb, včetně sestavy nakupující oba záseky. Testy hlídají skutečné zásahy,
žádné přičítání přestřelené výdrže, součet zastavení a účetnictví grošů.
To potvrzuje funkčnost a dosažitelnost výhry. Finální obtížnost, tempo a
srozumitelnost se mají dál posuzovat podle [prvního testování](PLAYTEST.md).
