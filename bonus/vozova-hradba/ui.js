(() => {
    const COPY = {
        cs: {
            title: 'Vozová hradba', pageTitle: 'Vozová hradba · Husitské války',
            gold: 'Groše', camp: 'Tábor', wave: 'Vlna',
            initial: 'Klepni na volné pole, vyber oddíl a zkontroluj jeho dosah.',
            forbidden: 'Na cestě ani v táboře nelze stavět. Vyber volné pole vedle cesty.',
            built: '{unit}: oddíl připraven.', upgraded: '{unit}: oddíl posílen.', sold: 'Oddíl stažen. Část grošů je zpět.',
            notEnough: 'Na tento oddíl zatím nemáš dost grošů.',
            placeUnit: 'Postavit · {cost}', missingGold: 'Chybí {gold} grošů', firstUnit: 'Nejprve postav bojový oddíl',
            waveIncoming: 'Příští vlna {wave}', waveAttacking: 'Útok {wave}', waveLeft: 'Zbývá {count}', waveActive: 'V boji {count}', waveCount: 'Celkem {count}',
            waveBriefLabel: 'Průběh a složení vlny',
            pause: 'Pozastavit hru (P)', resume: 'Pokračovat v boji (P)', pauseHint: 'Pauza · můžeš stavět',
            restart: 'Nová obrana', restartTitle: 'Začít znovu?', restartBody: 'Rozehranou obranu nahradí nová partie s 170 groši.', cancel: 'Zpět do hry',
            interval: 'Každých {seconds} s', slowStat: 'Zpomalení {value} %', boostStat: 'Podpora +{value} %',
            noRoad: 'Odtud oddíl na cestu nedosáhne.', upgradePreview: 'Po vylepšení: {stats}',
            enemies: { pesak: 'Pěšák', rytir: 'Rytíř', pavez: 'Pavézník', prapor: 'Praporečník' },
            startWave: 'Vyslat vlnu', earlyWave: 'Další vlna +{bonus}', battle: 'Bitva…',
            waveStarted: 'Vlna {wave} táhne k táboru. Můžeš dál stavět i během boje.',
            waveEarly: 'Další vlna přivolána dřív. Získal jsi {bonus} grošů, ale útoky se překryjí.',
            waveComplete: 'Vlna {wave} odražena. Získal jsi {bonus} grošů.',
            breach: 'Nepřátelé pronikli do tábora!',
            choral: 'Chorál', choralActive: 'Chorál zní', choralUsed: 'Chorál použit',
            choralMessage: 'Zní „Ktož jsú boží bojovníci“: naše oddíly bijí silněji a nepřítel váhá.',
            speedLabel: 'Rychlost hry', helpLabel: 'Jak hrát', languageLabel: 'Switch to English',
            mapLabel: 'Klikatá cesta shora k husitskému táboru. Klepni na volné pole u cesty a postav oddíl.',
            stageLabel: 'Herní mapa', history: 'Bonusová arkáda, nikoli rekonstrukce konkrétní bitvy.',
            buildTitle: 'Vyber oddíl', close: 'Zavřít', level: 'úroveň {level}',
            upgrade: 'Vylepšit · {cost}', maxLevel: 'Nejvyšší úroveň', sell: 'Stáhnout · +{gold}',
            range: 'Dosah {range}', hexOne: '1 hex', hexFew: '{count} hexy', attack: 'Útok {damage}',
            hexMany: '{count} hexů', splashStat: 'Rozptyl {range}',
            hillLegend: '△ Návrší: dostřel +1', hillLabel: 'Návrší',
            hillNote: 'Návrší · dostřel +1 hex pro ručničáře a houfnice.',
            hillApplied: 'Návrší · +1 hex už započtený v dosahu.',
            barricadesLabel: 'Záseky {count}/2', tacticsLabel: 'Výhody {count}/3',
            barricadeTitle: 'Zásek {mark}', gateNames: { east: 'Východní cesta', west: 'Západní cesta' },
            barricadeOpen: 'Uzavři krátkou větev. Útok obejde zásek po cestě delší o 2 hexy. Modře je trasa po změně.',
            barricadeClosed: 'Zásek odvádí útok po objížďce. Rozebráním zkrátíš cestu o 2 hexy a získáš zpět celou cenu. Modře je trasa po změně.',
            barricadeLocked: 'Záseky lze měnit mezi vlnami, až je celá cesta prázdná.',
            barricadeBuild: 'Postavit zásek · {cost}', barricadeRemove: 'Rozebrat · +{cost}',
            barricadeChanged: 'Zásek {mark}: {route}', routeLong: 'útok půjde objížďkou.', routeShort: 'kratší cesta je otevřená.',
            routeLength: 'Po změně: cesta delší o {range} oproti původní.',
            routeOriginal: 'Po změně: původní krátká cesta.',
            choiceTitle: 'Válečná porada', choiceIntro: 'Vlna {wave} odražena. Vyber jednu výhodu pro zbytek obrany. Platí pro všechny současné i budoucí oddíly daného druhu.',
            choicePaused: 'Boj během volby stojí. Druhá možnost pro tuto partii zanikne.',
            chooseTactic: 'Přijmout výhodu', tacticChosen: 'Přijato: {name}. Platí do konce této obrany.',
            tacticsTitle: 'Výhody této obrany', noTactics: 'Po 2., 4. a 6. odražené vlně si vybereš jednu ze dvou výhod.',
            nextChoice: 'Další porada po odražení vlny {wave}.', allChoices: 'Všechny tři porady proběhly. Výhody platí až do konce obrany.',
            activeTactics: 'Výhoda: {names}',
            scatterDesc: 'Plný zásah v cílovém hexu, 65 % poškození o 1 hex dál a 35 % o 2 hexy dál.',
            tactics: {
                powder: { name: 'Lepší prach', desc: 'Ručničáři: útok +20 %. Silnější jednotlivé zásahy.' },
                flails: { name: 'Okované cepy', desc: 'Cepníci: útok +25 %. Bonus proti zbroji zůstává.' },
                reload: { name: 'Sehraná obsluha', desc: 'Houfnice: přebíjení o 25 % kratší. Častější palba.' },
                scatter: { name: 'Široký rozptyl', desc: 'Houfnice: rozptyl 2 hexy. První prstenec zasáhne za 65 %, druhý za 35 % poškození.' },
                obstacles: { name: 'Řetězy mezi vozy', desc: 'Vozy: zpomalení +10 procentních bodů. Základní vůz zpomalí o 40 %.' },
                formation: { name: 'Sehraná hradba', desc: 'Vozy: podpora +12 procentních bodů. Základní vůz přidá 44 % útoku; strop zůstává +80 %.' }
            },
            support: 'Podpora vozů: útok +{value} %',
            wagonRules: 'Červené hexy zpomalují; zlaté dostávají podporu. V překryvu platí nejsilnější zpomalení. Podpora šesti sousedních hexů se sčítá do +80 % útoku.',
            wagonLive: 'Nepřátelé v dosahu: {enemies} · Podpořené oddíly: {allies}',
            wagonNoRoad: 'Odtud vůz na cestu nedosáhne. Může jen podporovat sousední oddíly.',
            helpTitle: 'Jak bránit tábor', helpBody: 'Protivník postupuje po cestě od praporu k táboru. Obránci útočí sami, ty rozhoduješ o jejich rozmístění.',
            helpItems: [
                'Klepni na volný hex, vyber oddíl a prohlédni si zvýrazněné hexy v dosahu. Tlačítkem Postavit potvrď jeho umístění. Dosah se počítá přes společné hrany hexů.',
                'Ručničáři střílejí z dálky, cepníci jsou silní proti obrněným, houfnice zasahuje skupiny a vůz podporuje okolí.',
                'Červené přesýpací hodiny označují zpomalení vozem. Platí na červených hexech cesty, v překryvu nejsilnější vůz. Podpora zvyšuje útok v šesti sousedních hexech, nejvýše o 80 %.',
                'Cepníci zasáhnou 1 hex, ručničáři 2 a houfnice 3. Na třetí úrovni získají střelci, houfnice a vůz další hex dosahu. Cepníci zůstávají u boje zblízka.',
                'Tři návrší označená trojúhelníkem prodlužují dostřel ručničářů a houfnic o 1 hex. Vozy a cepníci bonus nedostávají.',
                'Záseky I a II stojí každý 25 grošů a prodlouží cestu o 2 hexy. Klepni na značku na cestě nebo na tlačítko Záseky. Měnit je můžeš jen na prázdné cestě mezi vlnami; rozebrání vrátí celou cenu.',
                'Po 2., 4. a 6. odražené vlně vyber jednu trvalou výhodu pro tuto partii. Boj během volby stojí i při překrytí vln. Přijaté výhody najdeš pod tlačítkem Výhody.',
                'Chorál na 6 sekund přidá 40 % k útoku a sníží rychlost o čtvrtinu. Se základním vozem tak nepřítele zpomalí celkem o 47,5 %. Zlaté hodiny označují samotný chorál.',
                'Za zastavené jednotky dostáváš groše. Oddíl lze vylepšit nebo stáhnout.',
                'Chorál použiješ jednou za partii. Další vlnu můžeš přivolat dřív za bonus. Její složení uvidíš nad mapou.',
                'Pauza zastaví boj a dovolí stavět. Klávesa P ovládá pauzu, šipky vybírají pole a Enter otevírá nabídku.'
            ],
            continue: 'Pokračovat', wonTitle: 'Tábor ubráněn',
            wonBody: 'Odrazil jsi všech osm vln. Zůstalo {camp} bodů tábora a zastavil jsi {kills} nepřátel.',
            lostTitle: 'Tábor padl',
            lostBody: 'Křižáci prorazili ve vlně {wave}. Zastavil jsi {kills} nepřátel. Zkus jinak spojit vozy se střelci a cepníky.',
            again: 'Hrát znovu', best: 'Nejlepší obrana: {wave} z 8 odražených vln.',
            grades: ['Obrana prolomena', 'Tábor zachráněn', 'Pevná hradba', 'Bez jediného průlomu'],
            resultCamp: 'Síla tábora', resultWaves: 'Odražené vlny', resultTime: 'Čas boje',
            contribution: 'Jak bojovaly oddíly', unitColumn: 'Oddíl', damageColumn: 'Poškození', killsColumn: 'Zastavení',
            damageNote: 'Poškození počítá skutečně ubranou výdrž. Zastavení patří poslednímu zásahu. Čas boje odpovídá rychlosti 1×.',
            wagonContribution: 'Přínos vozů', supportResult: '+{damage} poškození díky podpoře', slowResult: '{seconds} s zpomalení nepřátel celkem',
            supportNote: 'Podpora je už zahrnutá v poškození zbraní. Čas zpomalení se sčítá za každého nepřítele zvlášť.',
            newRecord: 'Nový osobní rekord', bestResult: 'Rekord: {waves}/8 vln · tábor {camp}/20',
            nextTry: 'Příště zkus', resultTactics: 'Zvolená vylepšení',
            resultTips: {
                weapons: 'Vůz potřebuje zbraně. Nejprve postav dva útočící oddíly a potom je podpoř vozem.',
                armor: 'Proti pronikajícím obrněncům přidej cepníky k cestě. Jejich zásahy prorážejí zbroj.',
                hill: 'Vyzkoušej ručničáře nebo houfnici na návrší. Získají celý hex dostřelu navíc.',
                choral: 'Chorál si nech na hustý útok. Na šest sekund posílí zbraně a zpomalí nepřátele.',
                route: 'Prohlédni si objížďku u záseku. Delší cesta se vyplatí, když ji pokryjí tvoje zbraně.',
                perfect: 'Zkus jinou dvojici zbraní nebo druhou možnost při válečné poradě.'
            },
            coachLabel: 'Krátké zaučení', coachProgress: 'Tip {step}/3', coachSkip: 'Vypnout tipy', coachReplay: 'Znovu ukázat tipy',
            coach: {
                build: { title: 'Postav první oddíl', body: 'Zvýrazněný hex je u cesty. Vyber ručničáře nebo houfnici, prohlédni si dosah a potvrď stavbu.', action: 'Ukázat místo' },
                hill: { title: 'Získej výhodu návrší', body: 'Na hexu s △ dostřelí ručničáři i houfnice o 1 hex dál. V náhledu si to můžeš prohlédnout bez placení.', action: 'Ukázat návrší' },
                barricade: { title: 'Veď útok kolem obrany', body: 'Zásek za 25 grošů přidá cestě 2 hexy. Modrý náhled ti ukáže, kam nepřítel půjde. Přestavuj mezi vlnami.', action: 'Ukázat zásek' }
            },
            testerButton: 'Postřehy a odkaz', feedbackTitle: 'Jak se ti hrálo?',
            feedbackIntro: 'Vyplň krátké hodnocení, zkopíruj souhrn a pošli ho člověku, který ti dal odkaz. Připojí se průběh této obrany.',
            feedbackClarity: 'Bylo jasné, co dělat?', feedbackDifficulty: 'Jaká byla obtížnost?', feedbackReplay: 'Chceš hrát znovu?',
            feedbackNote: 'Co tě zmátlo nebo bys změnil/a?', feedbackPlaceholder: 'Např. nebylo jasné, kam patří vůz…',
            feedbackOptions: { clarity: [['clear', 'Ano'], ['mixed', 'Většinou'], ['lost', 'Ztrácel/a jsem se']],
                difficulty: [['easy', 'Lehká'], ['fair', 'Akorát'], ['hard', 'Těžká']], replay: [['yes', 'Ano'], ['maybe', 'Možná'], ['no', 'Ne']] },
            unanswered: 'Vyber odpověď', copyReport: 'Zkopírovat hodnocení', reportCopied: 'Hodnocení je zkopírované. Můžeš ho vložit do zprávy.',
            copyLink: 'Zkopírovat odkaz na hru', linkCopied: 'Odkaz je zkopírovaný.', copyFallback: 'Automatické kopírování není dostupné. Zkopíruj označený text.',
            feedbackBack: 'Zpět', reportLabel: 'Souhrn ke zkopírování',
            tips: [
                '',
                'Příště přijedou rytíři. Cepníci jim lépe prorážejí zbroj.',
                'Nejbližší bude střet s rychlou jízdou. Rozlož oddíly na více úseků cesty.',
                'Pavézníci hodně vydrží. Houfnice zasáhne celý hlouček.',
                'Vůz zpomalí útočníky a posílí oddíly v sousedních polích.',
                'Chorál si schovej na chvíli, kdy se obrana láme.',
                'Příště přijde větší směs pěchoty a štítů.',
                'Poslední vlna nese křižácký prapor.'
            ],
            units: {
                rucnicari: { name: 'Ručničáři', role: 'Dálková palba', desc: 'Píšťaly střílejí rychle. Brnění jejich palbu tlumí.' },
                cepnici: { name: 'Cepníci', role: 'Proti zbroji', desc: 'Krátký dosah. Cepy prorážejí brnění a bijí obrněné silněji.' },
                houfnice: { name: 'Houfnice', role: 'Proti skupinám', desc: 'Plný zásah v cílovém hexu, poloviční v sousedních. Pomalé přebíjení.' },
                vuz: { name: 'Bojový vůz', role: 'Zpomalení a podpora', desc: 'Sám neútočí: podpoř jím zbraně. Červené hexy zpomalují, 6 zlatých sousedů posiluje útok. Zpomalení vozů se nesčítá.' }
            }
        },
        en: {
            title: 'Wagon Fort', pageTitle: 'Wagon Fort · Hussite Wars',
            gold: 'Coin', camp: 'Camp', wave: 'Wave',
            initial: 'Tap an empty field, choose a unit and check its range.',
            forbidden: 'You cannot build on the road or in the camp. Choose an open field beside it.',
            built: '{unit} deployed.', upgraded: '{unit} upgraded.', sold: 'Unit withdrawn. Some coin returned.',
            notEnough: 'You do not have enough coin for this unit yet.',
            placeUnit: 'Deploy · {cost}', missingGold: 'Need {gold} more coin', firstUnit: 'Deploy a fighting unit first',
            waveIncoming: 'Next wave {wave}', waveAttacking: 'Attack {wave}', waveLeft: '{count} remaining', waveActive: '{count} still fighting', waveCount: '{count} in total',
            waveBriefLabel: 'Wave progress and enemy troops',
            pause: 'Pause the game (P)', resume: 'Resume the battle (P)', pauseHint: 'Paused · you can build',
            restart: 'New defense', restartTitle: 'Start again?', restartBody: 'This run will be replaced by a new defense with 170 coin.', cancel: 'Back to the game',
            interval: 'Every {seconds} s', slowStat: 'Slow {value}%', boostStat: 'Support +{value}%',
            noRoad: 'This unit cannot reach the road from here.', upgradePreview: 'After upgrade: {stats}',
            enemies: { pesak: 'Footman', rytir: 'Knight', pavez: 'Pavisier', prapor: 'Standard bearer' },
            startWave: 'Send wave', earlyWave: 'Next wave +{bonus}', battle: 'Battle…',
            waveStarted: 'Wave {wave} is advancing. You can keep building during the fight.',
            waveEarly: 'Next wave called early. You gained {bonus} coin, but the attacks overlap.',
            waveComplete: 'Wave {wave} repelled. You gained {bonus} coin.',
            breach: 'Enemies reached the camp!',
            choral: 'Chorale', choralActive: 'Singing', choralUsed: 'Chorale used',
            choralMessage: 'The battle hymn sounds: your units hit harder and the enemy hesitates.',
            speedLabel: 'Game speed', helpLabel: 'How to play', languageLabel: 'Přepnout do češtiny',
            mapLabel: 'A winding road leads from the banner to the Hussite camp. Tap an open field beside it to build.',
            stageLabel: 'Game map', history: 'An arcade bonus, not a reconstruction of a specific battle.',
            buildTitle: 'Choose a unit', close: 'Close', level: 'level {level}',
            upgrade: 'Upgrade · {cost}', maxLevel: 'Maximum level', sell: 'Withdraw · +{gold}',
            range: 'Range {range}', hexOne: '1 hex', hexFew: '{count} hexes', attack: 'Attack {damage}',
            hexMany: '{count} hexes', splashStat: 'Blast {range}',
            hillLegend: '△ Hills: range +1', hillLabel: 'Hill',
            hillNote: 'Hill · +1 hex of range for handgunners and howitzers.',
            hillApplied: 'Hill · the extra hex is included in this range.',
            barricadesLabel: 'Barricades {count}/2', tacticsLabel: 'Perks {count}/3',
            barricadeTitle: 'Barricade {mark}', gateNames: { east: 'Eastern road', west: 'Western road' },
            barricadeOpen: 'Block the short branch. Enemies take a detour 2 hexes longer. Blue shows the route after the change.',
            barricadeClosed: 'Enemies take the detour. Remove the barricade to shorten the route by 2 hexes and reclaim its full cost. Blue shows the route after the change.',
            barricadeLocked: 'Change barricades between waves, once the entire road is empty.',
            barricadeBuild: 'Build barricade · {cost}', barricadeRemove: 'Remove · +{cost}',
            barricadeChanged: 'Barricade {mark}: {route}', routeLong: 'enemies will take the detour.', routeShort: 'the short road is open.',
            routeLength: 'After change: route {range} longer than the original.',
            routeOriginal: 'After change: the original short route.',
            choiceTitle: 'War council', choiceIntro: 'Wave {wave} repelled. Choose one perk for the rest of this run. It affects all current and future units of its type.',
            choicePaused: 'The battle waits while you choose. The other option is lost for this run.',
            chooseTactic: 'Accept perk', tacticChosen: 'Accepted: {name}. Active until this defense ends.',
            tacticsTitle: 'Perks for this defense', noTactics: 'After repelling waves 2, 4 and 6, choose one of two perks.',
            nextChoice: 'Next council after repelling wave {wave}.', allChoices: 'All three councils are complete. Your perks last until this defense ends.',
            activeTactics: 'Perk: {names}',
            scatterDesc: 'Full damage in the target hex, 65% damage 1 hex away and 35% damage 2 hexes away.',
            tactics: {
                powder: { name: 'Better powder', desc: 'Handgunners: +20% attack. Stronger individual shots.' },
                flails: { name: 'Iron-bound flails', desc: 'Flailmen: +25% attack. The armour bonus still applies.' },
                reload: { name: 'Drilled crews', desc: 'Howitzers: 25% shorter reload. More frequent fire.' },
                scatter: { name: 'Wide scatter', desc: 'Howitzers: a 2-hex blast. The first ring takes 65% damage, the second 35%.' },
                obstacles: { name: 'Wagon chains', desc: 'Wagons: +10 percentage points of slowing. A basic wagon slows by 40%.' },
                formation: { name: 'Drilled formation', desc: 'Wagons: +12 percentage points of support. A basic wagon grants +44% attack; the cap stays +80%.' }
            },
            support: 'Wagon support: attack +{value}%',
            wagonRules: 'Red hexes slow enemies; gold hexes receive support. Only the strongest overlapping slow applies. Support reaches six adjacent hexes and stacks up to +80% attack.',
            wagonLive: 'Enemies in range: {enemies} · Supported units: {allies}',
            wagonNoRoad: 'This wagon cannot reach the road. It can only support adjacent units.',
            helpTitle: 'Defend the camp', helpBody: 'Enemies follow the road from the banner to the camp. Defenders fight automatically; you decide where they stand.',
            helpItems: [
                'Tap an empty hex, choose a unit and check the highlighted hexes in range. Press Deploy to place it. Range is counted across shared hex edges.',
                'Handgunners fire at range, flailmen pierce armour, howitzers hit groups, and wagons support nearby units.',
                'A red hourglass marks enemies slowed by a wagon on red road hexes. Only the strongest overlapping wagon applies. Support increases attack in the six adjacent hexes, up to +80%.',
                'Flailmen reach 1 hex, handgunners 2 and howitzers 3. At level three, handgunners, howitzers and wagons gain one extra hex of range. Flailmen remain melee units.',
                'Three hills marked with a triangle give handgunners and howitzers 1 extra hex of range. Wagons and flailmen get no hill bonus.',
                'Barricades I and II cost 25 coin each and extend the route by 2 hexes. Tap a road marker or the Barricades button. Change them only on an empty road between waves; removal refunds the full cost.',
                'After repelling waves 2, 4 and 6, pick one perk for this run. Combat waits during the choice, even with overlapping waves. The Perks button lists your choices.',
                'The chorale adds 40% attack and reduces speed by a quarter for 6 seconds. With a basic wagon, the combined slow is 47.5%. A gold hourglass marks the chorale alone.',
                'Defeated enemies earn coin. You can upgrade or withdraw a unit.',
                'Use the chorale once per run. Call the next wave early for a bonus; its troops appear above the map.',
                'Pause to plan and build. P toggles pause, arrow keys select a field and Enter opens its menu.'
            ],
            continue: 'Continue', wonTitle: 'The camp held',
            wonBody: 'You repelled all eight waves. The camp has {camp} points left and you stopped {kills} enemies.',
            lostTitle: 'The camp fell',
            lostBody: 'The crusaders broke through in wave {wave}. You stopped {kills} enemies. Try another mix of wagons, gunners and flailmen.',
            again: 'Play again', best: 'Best defense: {wave} of 8 waves repelled.',
            grades: ['Defense breached', 'Camp saved', 'Strong formation', 'Not a single breach'],
            resultCamp: 'Camp strength', resultWaves: 'Waves repelled', resultTime: 'Battle time',
            contribution: 'Your units in battle', unitColumn: 'Unit', damageColumn: 'Damage', killsColumn: 'Stopped',
            damageNote: 'Damage counts health actually removed. The final hit receives the stop. Battle time is measured at 1× speed.',
            wagonContribution: 'Wagon contribution', supportResult: '+{damage} damage from support', slowResult: '{seconds} s of enemy slowing in total',
            supportNote: 'Support is already included in weapon damage. Slowing time is added up for each enemy individually.',
            newRecord: 'New personal best', bestResult: 'Best: {waves}/8 waves · camp {camp}/20',
            nextTry: 'For your next attempt', resultTactics: 'Chosen perks',
            resultTips: {
                weapons: 'Wagons need weapons. Deploy two attacking units first, then support them with a wagon.',
                armor: 'Add flailmen beside the road to stop armoured enemies. Their hits pierce armour.',
                hill: 'Try handgunners or a howitzer on a hill for one extra hex of range.',
                choral: 'Save the chorale for a dense attack. It strengthens weapons and slows enemies for six seconds.',
                route: 'Preview a barricade detour. The longer route pays off when your weapons can cover it.',
                perfect: 'Try a different pair of weapons or the other choice at a war council.'
            },
            coachLabel: 'Quick introduction', coachProgress: 'Tip {step}/3', coachSkip: 'Turn tips off', coachReplay: 'Show tips again',
            coach: {
                build: { title: 'Deploy your first unit', body: 'The marked hex is beside the road. Choose handgunners or a howitzer, check the range and confirm deployment.', action: 'Show the spot' },
                hill: { title: 'Use the high ground', body: 'On a △ hex, handgunners and howitzers gain 1 hex of range. Check the preview without spending coin.', action: 'Show a hill' },
                barricade: { title: 'Lead enemies past your defense', body: 'A barricade costs 25 coin and adds 2 hexes to the route. Blue previews where enemies will go. Rebuild between waves.', action: 'Show a barricade' }
            },
            testerButton: 'Feedback and link', feedbackTitle: 'How did it play?',
            feedbackIntro: 'Rate your experience, copy the report and send it to the person who gave you the link. This defense is included in the summary.',
            feedbackClarity: 'Was it clear what to do?', feedbackDifficulty: 'How was the difficulty?', feedbackReplay: 'Would you play again?',
            feedbackNote: 'What confused you or would you change?', feedbackPlaceholder: 'For example, I was unsure where to put a wagon…',
            feedbackOptions: { clarity: [['clear', 'Yes'], ['mixed', 'Mostly'], ['lost', 'I felt lost']],
                difficulty: [['easy', 'Easy'], ['fair', 'About right'], ['hard', 'Hard']], replay: [['yes', 'Yes'], ['maybe', 'Maybe'], ['no', 'No']] },
            unanswered: 'Choose an answer', copyReport: 'Copy feedback report', reportCopied: 'Report copied. You can paste it into a message.',
            copyLink: 'Copy game link', linkCopied: 'Game link copied.', copyFallback: 'Automatic copying is unavailable. Copy the selected text.',
            feedbackBack: 'Back', reportLabel: 'Report to copy',
            tips: [
                '',
                'Knights are coming. Flailmen pierce their armour.',
                'Fast cavalry is next. Spread defenders along the road.',
                'Pavise infantry can take a lot of damage. Howitzers strike groups.',
                'A wagon slows attackers and strengthens adjacent defenders.',
                'Save the chorale for a moment when the line is close to breaking.',
                'A larger mix of infantry and shields is coming.',
                'The final wave carries a crusader banner.'
            ],
            units: {
                rucnicari: { name: 'Handgunners', role: 'Ranged fire', desc: 'Fast fire at range. Armour reduces their damage.' },
                cepnici: { name: 'Flailmen', role: 'Armour piercing', desc: 'Short reach. Flails ignore armour and hit armoured troops harder.' },
                houfnice: { name: 'Howitzer', role: 'Area damage', desc: 'Full damage in the target hex, half in adjacent hexes. Slow reload.' },
                vuz: { name: 'War wagon', role: 'Slow and support', desc: 'Cannot attack: support your weapons. Red hexes slow enemies; 6 gold neighbours boost attack. Wagon slows do not stack.' }
            }
        }
    };

    const storage = { getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value) };
    const profile = DefenseSession.read(storage, location.pathname);
    const game = new WagonDefense.Game();
    const app = document.getElementById('app');
    const stage = document.getElementById('stage');
    const canvas = document.getElementById('battlefield');
    const ctx = canvas.getContext('2d');
    const tokenRenderer = new WoodcutRenderer({ ctx });
    const sheet = document.getElementById('build-sheet');
    const message = document.getElementById('message');
    const overlay = document.getElementById('overlay');
    const overlayCard = overlay.querySelector('.overlay-card');
    const overlayTitle = document.getElementById('overlay-title');
    const overlayBody = document.getElementById('overlay-body');
    const overlayButton = document.getElementById('overlay-button');
    const overlaySecondary = document.getElementById('overlay-secondary');
    const waveButton = document.getElementById('wave-button');
    const choralButton = document.getElementById('choral-button');
    const speedButton = document.getElementById('speed-button');
    const pauseButton = document.getElementById('pause-button');
    const pausedBanner = document.getElementById('paused-banner');
    const waveHeading = document.getElementById('wave-heading');
    const waveRemaining = document.getElementById('wave-remaining');
    const waveRoster = document.getElementById('wave-roster');
    const waveProgress = document.getElementById('wave-progress');
    const barricadesButton = document.getElementById('barricades-button');
    const tacticsButton = document.getElementById('tactics-button');
    const coach = document.getElementById('coach');
    const coachAction = document.getElementById('coach-action');
    const coachSkip = document.getElementById('coach-skip');
    const coachTargets = { build: { col: 3, row: 3 }, hill: { col: 3, row: 0 }, barricade: { col: 5, row: 3 } };
    const palette = WoodcutRenderer.palette;
    const unitKinds = {
        rucnicari: { type: 'RUCNICARI', unitClass: 'ranged' },
        cepnici: { type: 'CEPNICI', unitClass: 'infantry' },
        houfnice: { type: 'HOUFNICE', unitClass: 'artillery' },
        vuz: { type: 'VOZOVA_HRADBA', unitClass: 'wagon' }
    };
    const enemyKinds = {
        pesak: { type: 'PESAK_KRIZACI', unitClass: 'infantry' },
        rytir: { type: 'RYTIRI', unitClass: 'cavalry' },
        pavez: { type: 'PAVEZNICI_KRIZACI', unitClass: 'infantry' },
        prapor: { type: 'VELITEL_KRIZACI', unitClass: 'commander' }
    };
    const glyphs = {};
    for (const [name, unit] of Object.entries({ ...unitKinds, ...enemyKinds })) {
        glyphs[name] = new Path2D(WoodcutRenderer.glyphs[WoodcutRenderer.glyphKind(unit)]);
    }
    let language = readLanguage();
    let cell = 40;
    let dpr = 1;
    let background = null;
    let selected = null;
    let speed = 1;
    let paused = false;
    let lastBuildType = 'rucnicari';
    let rosterKey = '';
    let returnFocus = null;
    let lastFrame = 0;
    let needsRender = true;
    let effects = [];
    let overlayKind = null;
    let runResult = null;
    let newRecord = false;
    let coachStep = null;
    let coachKey = '';
    let feedbackDraft = {};
    let feedbackReturn = null;

    function readLanguage() {
        if (profile.language) return profile.language;
        for (const preference of navigator.languages || [navigator.language]) {
            const code = (preference || '').toLowerCase().split('-')[0];
            if (code === 'cs' || code === 'en') return code;
        }
        return 'cs';
    }
    function saveProfile() { DefenseSession.save(storage, location.pathname, profile); }
    function saveResult() {
        if (runResult) return;
        runResult = { ...game.summary(), attempt: profile.attempts };
        newRecord = DefenseSession.record(profile, runResult);
        saveProfile();
    }
    function markTip(step) {
        if (profile.seen.includes(step)) return;
        profile.seen.push(step); saveProfile();
    }
    function refreshCoach() {
        if (game.wave > 0 || game.towers.some(tower => tower.type !== 'vuz')) markTip('build');
        if (game.metrics.hillsBuilt) markTip('hill');
        const step = DefenseSession.STEPS.find(id => !profile.seen.includes(id) && (id !== 'barricade' || game.wave > 0));
        const visible = step && game.state === 'ready' && overlay.hidden && sheet.hidden;
        if (coachStep !== (visible ? step : null)) needsRender = true;
        coachStep = visible ? step : null;
        coach.hidden = !visible;
        if (!visible) return;
        const key = language + ':' + step;
        if (key !== coachKey) {
            coachKey = key;
            const copy = COPY[language].coach[step];
            setText(document.getElementById('coach-progress'), t('coachProgress', { step: DefenseSession.STEPS.indexOf(step) + 1 }));
            setText(document.getElementById('coach-title'), copy.title);
            setText(document.getElementById('coach-body'), copy.body);
            setText(coachAction, copy.action); setText(coachSkip, t('coachSkip'));
        }
        coach.setAttribute('aria-label', t('coachLabel'));
        const controls = document.querySelector('.controls').getBoundingClientRect();
        const appRect = app.getBoundingClientRect();
        coach.style.bottom = Math.max(8, appRect.bottom - controls.top + 8) + 'px';
    }
    function t(key, values = {}) {
        let value = COPY[language][key];
        for (const [name, replacement] of Object.entries(values)) value = value.replaceAll('{' + name + '}', replacement);
        return value;
    }
    function setText(element, value) {
        if (element.textContent !== String(value)) element.textContent = value;
    }
    function setMessage(text) { setText(message, text); }
    function unitName(type) { return COPY[language].units[type].name; }
    function number(value) { return (Math.round(value * 10) / 10).toFixed(1).replace('.', language === 'cs' ? ',' : '.'); }
    function hexCount(count) { return t(count === 1 ? 'hexOne' : count >= 2 && count < 5 ? 'hexFew' : 'hexMany', { count }); }

    function positionSheet() {
        if (sheet.hidden || !selected) return;
        const appRect = app.getBoundingClientRect();
        const mapRect = canvas.getBoundingClientRect();
        const tileHeight = canvas.clientHeight / WagonDefense.MAP_HEIGHT;
        const center = WagonDefense.hexCenter(selected.col, selected.row);
        const tileTop = mapRect.top - appRect.top + canvas.clientTop + (center.y - 0.5) * tileHeight;
        const top = mapRect.top - appRect.top + 3;
        const above = tileTop - top - 8;
        const below = app.clientHeight - (tileTop + tileHeight) - 18;
        const atTop = above > below;
        sheet.style.top = atTop ? top + 'px' : 'auto';
        sheet.style.bottom = atTop ? 'auto' : '8px';
        sheet.style.maxHeight = Math.max(120, Math.floor(atTop ? above : below)) + 'px';
    }

    function fitCanvas() {
        needsRender = true;
        const rect = stage.getBoundingClientRect();
        const next = Math.max(18, Math.floor(Math.min((rect.width - 8) / WagonDefense.MAP_WIDTH,
            (rect.height - 8) / WagonDefense.MAP_HEIGHT)));
        if (next === cell && background) { positionSheet(); refreshCoach(); return; }
        cell = next;
        dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        canvas.style.width = WagonDefense.MAP_WIDTH * cell + 'px';
        canvas.style.height = WagonDefense.MAP_HEIGHT * cell + 'px';
        canvas.width = Math.round(WagonDefense.MAP_WIDTH * cell * dpr);
        canvas.height = Math.round(WagonDefense.MAP_HEIGHT * cell * dpr);
        makeBackground();
        positionSheet();
        refreshCoach();
        render();
    }
    function scale(g) { g.setTransform(dpr * cell, 0, 0, dpr * cell, 0, 0); }
    function random(seed) {
        return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    }
    function path(g, points = game.path) {
        g.beginPath();
        points.forEach((point, index) => {
            if (index) g.lineTo(point.x, point.y);
            else g.moveTo(point.x, point.y);
        });
    }
    function hexPath(g, col, row, inset = 0, append = false) {
        const center = WagonDefense.hexCenter(col, row);
        const radius = WagonDefense.HEX_RADIUS - inset;
        if (!append) g.beginPath();
        for (let corner = 0; corner < 6; corner++) {
            const angle = corner * Math.PI / 3;
            const x = center.x + radius * Math.cos(angle), y = center.y + radius * Math.sin(angle);
            if (corner) g.lineTo(x, y); else g.moveTo(x, y);
        }
        g.closePath();
    }
    function drawHexRegion(g, hexes, fill, stroke, lineWidth = 0.025) {
        if (!hexes.length) return;
        g.save();
        if (fill) {
            g.beginPath();
            for (const hex of hexes) hexPath(g, hex.col, hex.row, 0, true);
            g.fillStyle = fill; g.fill();
        }
        if (stroke) {
            const keys = new Set(hexes.map(hex => hex.col + ',' + hex.row));
            g.beginPath();
            // Obrys vede po hranách skutečně zasažitelných hexů.
            for (const hex of hexes) {
                const center = WagonDefense.hexCenter(hex.col, hex.row);
                for (let edge = 0; edge < 6; edge++) {
                    const normal = (edge + 0.5) * Math.PI / 3;
                    const neighbor = WagonDefense.hexAt(center.x + Math.cos(normal), center.y + Math.sin(normal));
                    if (neighbor && keys.has(neighbor.col + ',' + neighbor.row)) continue;
                    const a = edge * Math.PI / 3, b = (edge + 1) * Math.PI / 3;
                    g.moveTo(center.x + WagonDefense.HEX_RADIUS * Math.cos(a), center.y + WagonDefense.HEX_RADIUS * Math.sin(a));
                    g.lineTo(center.x + WagonDefense.HEX_RADIUS * Math.cos(b), center.y + WagonDefense.HEX_RADIUS * Math.sin(b));
                }
            }
            g.strokeStyle = stroke; g.lineWidth = lineWidth; g.lineJoin = 'round'; g.stroke();
        }
        g.restore();
    }
    function drawBanner(g, x, y, hussite) {
        g.save();
        g.strokeStyle = palette.ink; g.lineWidth = 0.04;
        g.beginPath(); g.moveTo(x - 0.25, y + 0.36); g.lineTo(x - 0.25, y - 0.44); g.stroke();
        g.fillStyle = hussite ? palette.red : palette.light;
        g.beginPath(); g.moveTo(x - 0.23, y - 0.4); g.lineTo(x + 0.27, y - 0.35);
        g.lineTo(x + 0.19, y - 0.12); g.lineTo(x + 0.26, y + 0.05);
        g.lineTo(x - 0.23, y + 0.04); g.closePath(); g.fill(); g.stroke();
        g.strokeStyle = hussite ? palette.light : palette.blue;
        g.lineWidth = 0.055;
        g.beginPath();
        if (hussite) {
            g.moveTo(x - 0.085, y - 0.29); g.lineTo(x + 0.12, y - 0.29);
            g.quadraticCurveTo(x + 0.12, y - 0.15, x + 0.02, y - 0.15);
            g.quadraticCurveTo(x - 0.085, y - 0.15, x - 0.085, y - 0.29);
            g.moveTo(x + 0.02, y - 0.15); g.lineTo(x + 0.02, y - 0.05);
            g.moveTo(x - 0.05, y - 0.05); g.lineTo(x + 0.09, y - 0.05);
        } else {
            g.moveTo(x + 0.02, y - 0.3); g.lineTo(x + 0.02, y - 0.04);
            g.moveTo(x - 0.09, y - 0.18); g.lineTo(x + 0.14, y - 0.18);
        }
        g.stroke();
        g.restore();
    }
    function makeBackground() {
        background = document.createElement('canvas');
        background.width = canvas.width; background.height = canvas.height;
        const g = background.getContext('2d');
        scale(g);
        g.fillStyle = palette.paper;
        g.fillRect(0, 0, WagonDefense.MAP_WIDTH, WagonDefense.MAP_HEIGHT);
        const rnd = random(1419);
        const activeRoad = new Set(game.route.map(hex => hex.col + ',' + hex.row));
        const terrainRenderer = new WoodcutRenderer({ ctx: g, hexSize: 40, hexToPixel: () => ({ x: 0, y: 0 }) });
        for (const hex of WagonDefense.HEXES) {
            const road = WagonDefense.PATH_CELLS.has(hex.col + ',' + hex.row);
            const hill = game.isHill(hex.col, hex.row);
            hexPath(g, hex.col, hex.row);
            g.fillStyle = road ? activeRoad.has(hex.col + ',' + hex.row) ? '#cfb687' : '#e0d4b9'
                : hill ? WoodcutRenderer.terrainColors.hills
                    : (hex.col * 17 + hex.row) % 3 ? palette.paper : '#e2d4b5';
            g.fill(); g.strokeStyle = '#766f5760'; g.lineWidth = 0.018; g.stroke();
            g.save(); g.clip();
            if (road) {
                g.fillStyle = '#76684f60';
                for (let index = 0; index < 4; index++) {
                    g.fillRect(hex.x - 0.35 + rnd() * 0.7, hex.y - 0.35 + rnd() * 0.7, 0.025, 0.025);
                }
            } else if (hill) {
                // The hill engraving is the main game's original artwork.
                g.save(); g.translate(hex.x, hex.y);
                g.scale(WagonDefense.HEX_RADIUS / 40, WagonDefense.HEX_RADIUS / 40);
                terrainRenderer.terrain({ ...hex, terrain: 'hills' }); g.restore();
            } else {
                g.strokeStyle = '#28302b38'; g.lineWidth = 0.02; g.lineCap = 'round';
                for (let index = 0; index < 3; index++) {
                    const x = hex.x - 0.36 + rnd() * 0.62, y = hex.y - 0.27 + rnd() * 0.64;
                    g.beginPath(); g.moveTo(x, y); g.lineTo(x + 0.05, y - 0.12);
                    g.moveTo(x + 0.075, y); g.lineTo(x + 0.11, y - 0.09); g.stroke();
                }
            }
            g.restore();
        }
        drawHexRegion(g, WagonDefense.ROAD_HEXES, null, '#766f5780', 0.035);
        drawHexRegion(g, game.route, null, '#5d513ecc', 0.045);
        g.lineJoin = 'round'; g.lineCap = 'round';
        path(g); g.setLineDash([0.055, 0.16]); g.strokeStyle = '#76684f80';
        g.lineWidth = 0.025; g.stroke(); g.setLineDash([]);
        for (let distance = 1.5; distance < game.pathLength - 1; distance += 3) {
            const point = game.pointAt(distance);
            g.save(); g.translate(point.x, point.y); g.rotate(point.angle);
            g.strokeStyle = '#76684f70'; g.lineWidth = 0.035;
            g.beginPath(); g.moveTo(-0.12, -0.1); g.lineTo(0.04, 0); g.lineTo(-0.12, 0.1); g.stroke();
            g.restore();
        }
        const banner = WagonDefense.hexCenter(0, 0);
        drawBanner(g, banner.x, banner.y, false);
        g.fillStyle = palette.light; g.strokeStyle = palette.ink; g.lineWidth = 0.035;
        for (const [col, row] of [[5, 10], [6, 10]]) {
            const { x, y } = WagonDefense.hexCenter(col, row);
            g.beginPath(); g.moveTo(x - 0.34, y + 0.2); g.lineTo(x, y - 0.3);
            g.lineTo(x + 0.34, y + 0.2); g.closePath(); g.fill(); g.stroke();
            g.beginPath(); g.moveTo(x, y - 0.3); g.lineTo(x, y + 0.2); g.stroke();
        }
        const camp = WagonDefense.hexCenter(5, 10);
        drawBanner(g, camp.x + 0.15, camp.y - 0.12, true);
    }
    function drawHillBadge(g, hex) {
        g.save(); g.translate(hex.x - 0.2, hex.y + 0.34);
        g.fillStyle = palette.light; g.strokeStyle = palette.blue; g.lineWidth = 0.022;
        g.fillRect(-0.14, -0.13, 0.42, 0.24);
        g.beginPath(); g.moveTo(-0.1, 0.065); g.lineTo(-0.025, -0.075);
        g.lineTo(0.05, 0.065); g.closePath(); g.stroke();
        g.fillStyle = palette.blue; g.font = 'bold .17px Georgia'; g.textAlign = 'left';
        g.fillText('+1', 0.06, 0.06); g.restore();
    }
    function drawBarricades(g) {
        for (const gate of Object.values(WagonDefense.BARRICADES)) {
            const { x, y } = WagonDefense.hexCenter(gate.col, gate.row);
            const closed = game.barricades.has(gate.id);
            g.save(); g.translate(x, y);
            g.fillStyle = closed ? palette.red : palette.light;
            g.strokeStyle = closed ? palette.red : palette.gold; g.lineWidth = 0.025;
            if (!closed) g.setLineDash([0.07, 0.04]);
            g.fillRect(-0.31, -0.27, 0.62, 0.54); g.strokeRect(-0.31, -0.27, 0.62, 0.54);
            g.setLineDash([]);
            g.strokeStyle = closed ? palette.light : palette.gold; g.lineWidth = 0.045;
            for (const side of [-1, 1]) {
                g.beginPath(); g.moveTo(-0.19, side * 0.14); g.lineTo(0.19, -side * 0.14); g.stroke();
            }
            g.fillStyle = palette.light; g.fillRect(-0.13, 0.1, 0.26, 0.25);
            g.fillStyle = closed ? palette.red : palette.ink;
            g.font = 'bold .2px Georgia'; g.textAlign = 'center'; g.fillText(gate.mark, 0, 0.3);
            g.restore();
        }
    }
    function drawToken(g, type, x, y, radius, enemy = false) {
        const commander = type === 'prapor';
        g.save(); g.translate(x, y); g.scale(radius / 24, radius / 24);
        tokenRenderer.tokenPath(enemy, 24, commander);
        g.fillStyle = palette.light; g.fill();
        g.strokeStyle = palette.ink; g.lineWidth = 2; g.stroke();
        tokenRenderer.tokenPath(enemy, 21, commander);
        g.fillStyle = enemy ? palette.blue : palette.red; g.fill();
        g.save(); g.clip(); g.strokeStyle = '#f2e8d326'; g.lineWidth = 0.8;
        for (let y = -25; y < 25; y += 5) {
            g.beginPath(); g.moveTo(-25, y); g.lineTo(25, y + 5); g.stroke();
        }
        g.restore();
        g.strokeStyle = palette.light; g.lineWidth = 2.2; g.lineCap = 'round'; g.lineJoin = 'round';
        g.stroke(glyphs[type]);
        g.restore();
    }
    function drawTower(g, tower) {
        drawToken(g, tower.type, tower.x, tower.y, 0.36);
        if (game.state === 'running' && tower.type !== 'vuz' && tower.cooldown > 0) {
            const loaded = Math.max(0, Math.min(1, 1 - tower.cooldown / game.towerStats(tower).cooldown));
            g.strokeStyle = palette.gold; g.lineWidth = 0.035;
            g.beginPath(); g.arc(tower.x, tower.y, 0.42, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * loaded); g.stroke();
        }
        if (tower.level > 1) {
            g.fillStyle = palette.gold;
            for (let index = 0; index < tower.level - 1; index++) {
                g.beginPath(); g.arc(tower.x - 0.26 + index * 0.15, tower.y - 0.34, 0.055, 0, Math.PI * 2); g.fill();
            }
        }
        if (tower.type !== 'vuz' && game.adjacentWagons(tower)) {
            g.fillStyle = palette.red;
            g.beginPath(); g.arc(tower.x + 0.3, tower.y + 0.3, 0.05, 0, Math.PI * 2); g.fill();
        }
    }
    function drawEnemy(g, enemy) {
        if (enemy.y < -0.4 || enemy.y > WagonDefense.MAP_HEIGHT + 0.4) return;
        const radius = enemy.type === 'prapor' ? 0.34 : 0.29;
        drawToken(g, enemy.type, enemy.x, enemy.y, radius, true);
        const width = enemy.type === 'prapor' ? 0.55 : 0.42;
        const barY = enemy.y - radius * (enemy.type === 'prapor' ? 1.4 : 1) - 0.13;
        g.fillStyle = palette.ink; g.fillRect(enemy.x - width / 2, barY, width, 0.07);
        g.fillStyle = enemy.health / enemy.maxHealth > 0.4 ? palette.light : '#e99c7d';
        g.fillRect(enemy.x - width / 2 + 0.01, barY + 0.01,
            Math.max(0, (width - 0.02) * enemy.health / enemy.maxHealth), 0.05);
        const movement = game.movementEffectsAt(enemy.x, enemy.y);
        if (movement.speedMultiplier < 1) {
            // Hodiny čerpají účinek ze stejných pravidel jako skutečný pohyb.
            const color = movement.wagonSlow ? palette.red : palette.gold;
            g.save();
            g.strokeStyle = color; g.lineWidth = 0.035; g.setLineDash([0.09, 0.07]);
            g.beginPath(); g.arc(enemy.x, enemy.y, radius + 0.065, 0, Math.PI * 2); g.stroke();
            g.setLineDash([]);
            g.translate(enemy.x + radius * 0.85, enemy.y + radius * 0.95);
            g.fillStyle = palette.light; g.lineWidth = 0.025;
            g.beginPath(); g.arc(0, 0, 0.16, 0, Math.PI * 2); g.fill(); g.stroke();
            g.lineWidth = 0.028; g.lineCap = 'round';
            g.beginPath(); g.moveTo(-0.065, -0.09); g.lineTo(0.065, -0.09);
            g.lineTo(-0.065, 0.09); g.lineTo(0.065, 0.09); g.closePath(); g.stroke();
            g.restore();
        }
    }
    function drawSlowZones(g, wagons) {
        const affected = new Map();
        for (const tower of wagons) {
            for (const hex of WagonDefense.hexesInRange(tower.col, tower.row, game.towerStats(tower).range)) {
                const key = hex.col + ',' + hex.row;
                if (WagonDefense.PATH_CELLS.has(key)) affected.set(key, hex);
            }
        }
        // Každý zasažený hex jednou, i při překryvu několika vozů.
        drawHexRegion(g, [...affected.values()], '#80352d32', '#80352d95');
    }
    function drawSupportFields(g, col, row) {
        g.save(); g.fillStyle = '#ad8b5030'; g.strokeStyle = palette.gold; g.lineWidth = 0.035;
        for (const hex of WagonDefense.hexesInRange(col, row, 1)) {
            if ((hex.col === col && hex.row === row) || !game.isBuildable(hex.col, hex.row)) continue;
            hexPath(g, hex.col, hex.row, 0.07); g.fill(); g.stroke();
        }
        g.restore();
    }
    function render() {
        if (!background) return;
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(background, 0, 0);
        scale(ctx);
        if (selected?.barricade) {
            const preview = game.previewBarricade(selected.barricade);
            drawHexRegion(ctx, preview.route, '#3f59651a', null);
            ctx.save(); ctx.setLineDash([0.13, 0.09]); ctx.lineWidth = 0.06;
            ctx.strokeStyle = palette.blue; path(ctx, preview.path); ctx.stroke(); ctx.restore();
        }
        if (game.wave === 0 && !game.towers.length && !selected) {
            ctx.strokeStyle = '#80352d85'; ctx.lineWidth = 0.025;
            for (const [col, row] of [[3, 3], [4, 4], [3, 0]]) {
                const { x, y } = WagonDefense.hexCenter(col, row);
                ctx.beginPath(); ctx.arc(x, y, 0.21, 0, Math.PI * 2); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(x - 0.1, y); ctx.lineTo(x + 0.1, y);
                ctx.moveTo(x, y - 0.1); ctx.lineTo(x, y + 0.1); ctx.stroke();
            }
        }
        const wagons = game.towers.filter(tower => tower.type === 'vuz');
        if (selected?.preview === 'vuz') {
            wagons.push({ type: 'vuz', level: 1, col: selected.col, row: selected.row });
        }
        drawSlowZones(ctx, wagons);
        if (selected && (selected.preview === 'vuz' || game.towerAt(selected.col, selected.row)?.type === 'vuz')) {
            drawSupportFields(ctx, selected.col, selected.row);
        }
        ctx.strokeStyle = '#8b652fa0'; ctx.lineWidth = 0.035; ctx.setLineDash([0.06, 0.075]);
        for (const tower of game.towers) if (tower.type === 'vuz') {
            for (const other of game.towers) if (other !== tower && other.type !== 'vuz'
                && game.supportingWagons(other).includes(tower)) {
                ctx.beginPath(); ctx.moveTo(tower.x, tower.y); ctx.lineTo(other.x, other.y); ctx.stroke();
            }
        }
        ctx.setLineDash([]);
        if (selected) {
            const tower = game.towerAt(selected.col, selected.row);
            const range = tower ? game.towerStats(tower).range
                : selected.preview ? game.towerStats({ ...selected, type: selected.preview, level: 1 }).range : 0;
            if (range) {
                drawHexRegion(ctx, WagonDefense.hexesInRange(selected.col, selected.row, range),
                    '#80352d19', '#80352dcc', 0.035);
            }
            ctx.strokeStyle = palette.red; ctx.lineWidth = 0.055;
            hexPath(ctx, selected.col, selected.row, 0.05); ctx.stroke();
            if (!tower && selected.preview) {
                ctx.save(); ctx.globalAlpha = 0.65;
                const { x, y } = WagonDefense.hexCenter(selected.col, selected.row);
                drawToken(ctx, selected.preview, x, y, 0.36);
                ctx.restore();
            }
        }
        drawBarricades(ctx);
        if (coachStep) {
            const target = coachTargets[coachStep];
            drawHexRegion(ctx, [target], '#ad8b5038', palette.gold, 0.085);
        }
        if (game.choralRemaining > 0) {
            ctx.fillStyle = '#ad8b5020'; ctx.fillRect(0, 0, WagonDefense.MAP_WIDTH, WagonDefense.MAP_HEIGHT);
        }
        for (const tower of game.towers) drawTower(ctx, tower);
        for (const hex of WagonDefense.HEXES) if (game.isHill(hex.col, hex.row)) drawHillBadge(ctx, hex);
        for (const enemy of game.enemies) drawEnemy(ctx, enemy);
        for (const effect of effects) {
            const opacity = Math.max(0, effect.life / effect.max);
            if (effect.type === 'shot') {
                ctx.strokeStyle = 'rgba(139,101,47,' + opacity + ')';
                ctx.lineWidth = 0.04;
                ctx.beginPath(); ctx.moveTo(effect.from.x, effect.from.y);
                ctx.lineTo(effect.to.x, effect.to.y); ctx.stroke();
                ctx.fillStyle = 'rgba(242,232,211,' + opacity + ')';
                ctx.beginPath(); ctx.arc(effect.from.x, effect.from.y, 0.13 * opacity, 0, Math.PI * 2); ctx.fill();
            } else if (effect.type === 'strike') {
                const angle = Math.atan2(effect.to.y - effect.from.y, effect.to.x - effect.from.x);
                ctx.strokeStyle = 'rgba(128,53,45,' + opacity + ')'; ctx.lineWidth = 0.085;
                ctx.beginPath(); ctx.arc(effect.from.x, effect.from.y, 0.75, angle - 0.55, angle + 0.55); ctx.stroke();
                ctx.lineWidth = 0.04;
                ctx.beginPath(); ctx.moveTo(effect.to.x - 0.12, effect.to.y - 0.12);
                ctx.lineTo(effect.to.x + 0.12, effect.to.y + 0.12); ctx.stroke();
            } else if (effect.type === 'blast') {
                drawHexRegion(ctx, WagonDefense.hexesInRange(effect.to.col, effect.to.row, effect.radius),
                    'rgba(139,101,47,' + opacity * 0.2 + ')', 'rgba(128,53,45,' + opacity + ')', 0.045);
            } else if (effect.type === 'coin') {
                ctx.fillStyle = 'rgba(139,101,47,' + opacity + ')';
                ctx.font = 'bold .25px Georgia'; ctx.textAlign = 'center';
                ctx.fillText('+' + effect.reward, effect.x, effect.y - 0.28 - (1 - opacity) * 0.35);
            }
        }
    }

    function refreshWaveBrief() {
        const upcoming = game.wave < WagonDefense.WAVE_COUNT && (game.state === 'ready' || game.canCallEarly());
        const wave = upcoming ? game.wave + 1 : Math.max(1, game.wave);
        const roster = WagonDefense.waveInfo(wave);
        const remaining = game.queue.length + game.enemies.length;
        setText(waveHeading, t(upcoming ? 'waveIncoming' : 'waveAttacking', { wave }));
        setText(waveRemaining, game.state === 'running'
            ? t(upcoming ? 'waveActive' : 'waveLeft', { count: remaining })
            : t('waveCount', { count: roster.reduce((count, item) => count + item.count, 0) }));
        const key = language + ':' + wave;
        if (key !== rosterKey) {
            rosterKey = key;
            waveRoster.replaceChildren();
            for (const item of roster) {
                const badge = document.createElement('span'); badge.className = 'enemy-badge';
                const icon = document.createElement('span');
                icon.innerHTML = WoodcutRenderer.icon(enemyKinds[item.type]);
                const text = document.createElement('span');
                text.textContent = item.count + ' × ' + COPY[language].enemies[item.type];
                badge.append(icon, text); waveRoster.append(badge);
            }
        }
        waveProgress.max = Math.max(1, game.kills + game.leaks + remaining);
        waveProgress.value = game.state === 'running' ? game.kills + game.leaks : 0;
        waveProgress.setAttribute('aria-label', waveRemaining.textContent);
    }
    function refreshUI() {
        setText(document.getElementById('gold-value'), game.gold);
        setText(document.getElementById('camp-value'), game.camp);
        document.getElementById('camp-wrap').classList.toggle('low', game.camp <= 6);
        setText(document.getElementById('wave-value'), game.wave + '/' + WagonDefense.WAVE_COUNT);
        const needsUnit = game.wave === 0 && !game.towers.some(tower => tower.type !== 'vuz');
        waveButton.disabled = paused || needsUnit || Boolean(game.pendingChoice) || !(game.state === 'ready' || game.canCallEarly());
        waveButton.title = needsUnit ? t('firstUnit') : '';
        setText(waveButton, game.canCallEarly()
            ? t('earlyWave', { bonus: WagonDefense.EARLY_BONUS })
            : game.state === 'running' ? t('battle') : t('startWave'));
        choralButton.disabled = paused || game.state !== 'running' || game.choralUsed;
        choralButton.classList.toggle('active', game.choralRemaining > 0);
        setText(choralButton, game.choralRemaining > 0 ? t('choralActive') + ' ' + Math.ceil(game.choralRemaining)
            : game.choralUsed ? t('choralUsed') : t('choral'));
        setText(speedButton, speed + '×');
        pauseButton.disabled = game.state !== 'running';
        pauseButton.setAttribute('aria-label', t(paused ? 'resume' : 'pause'));
        pauseButton.title = t(paused ? 'resume' : 'pause');
        pauseButton.setAttribute('aria-pressed', String(paused));
        setText(pauseButton, paused ? '▶' : 'Ⅱ');
        pausedBanner.hidden = !paused;
        setText(pausedBanner, t('pauseHint'));
        setText(barricadesButton, t('barricadesLabel', { count: game.barricades.size }));
        setText(tacticsButton, t('tacticsLabel', { count: game.tactics.size }));
        barricadesButton.disabled = ['won', 'lost'].includes(game.state);
        refreshWaveBrief();
        refreshCoach();
        if (!sheet.hidden) {
            const wagonLive = sheet.querySelector('[data-wagon-live]');
            if (wagonLive && selected) {
                const tower = game.towerAt(selected.col, selected.row);
                const range = game.towerStats(tower).range;
                setText(wagonLive, t('wagonLive', {
                    enemies: game.enemies.filter(enemy => game.inRange(tower, enemy, range)).length,
                    allies: game.towers.filter(other => other.type !== 'vuz'
                        && game.supportingWagons(other).includes(tower)).length
                }));
            }
            sheet.querySelectorAll('[data-cost]').forEach(button => {
                const cost = Number(button.dataset.cost);
                button.disabled = game.gold < cost;
                if (button.dataset.build) setText(button, t(button.disabled ? 'missingGold' : 'placeUnit',
                    { gold: cost - game.gold, cost }));
            });
            sheet.querySelectorAll('.option').forEach(button => {
                button.classList.toggle('unaffordable', game.gold < WagonDefense.DEFENSES[button.dataset.type].cost);
            });
            const barrier = sheet.querySelector('[data-barricade]');
            if (barrier) {
                barrier.disabled = !game.canToggleBarricade(barrier.dataset.barricade);
                const closed = game.barricades.has(barrier.dataset.barricade);
                setText(barrier, !closed && game.gold < WagonDefense.BARRICADE_COST
                    ? t('missingGold', { gold: WagonDefense.BARRICADE_COST - game.gold })
                    : t(closed ? 'barricadeRemove' : 'barricadeBuild', { cost: WagonDefense.BARRICADE_COST }));
            }
        }
    }
    function closeSheet() {
        sheet.hidden = true;
        selected = null;
        refreshCoach();
        canvas.focus({ preventScroll: true });
        render();
    }
    function sheetHeader(title) {
        sheet.replaceChildren();
        const heading = document.createElement('div'); heading.className = 'sheet-heading';
        const h2 = document.createElement('h2'); h2.id = 'sheet-title'; h2.textContent = title;
        const close = document.createElement('button'); close.type = 'button'; close.className = 'close-button';
        close.textContent = '×'; close.setAttribute('aria-label', t('close')); close.addEventListener('click', closeSheet);
        heading.append(h2, close); sheet.append(heading);
    }
    function describeStats(type, stats) {
        const parts = [t('range', { range: hexCount(stats.range) })];
        if (type === 'vuz') {
            parts.push(t('slowStat', { value: Math.round(stats.slow * 100) }),
                t('boostStat', { value: Math.round(stats.boost * 100) }));
        } else {
            parts.push(t('attack', { damage: Math.round(stats.damage) }),
                t('interval', { seconds: number(stats.cooldown) }));
            if (stats.splash) parts.push(t('splashStat', { range: hexCount(stats.splash) }));
        }
        return parts.join(' · ');
    }
    function terrainNote(col, row, type) {
        if (!game.isHill(col, row)) return null;
        const note = document.createElement('p'); note.className = 'terrain-note';
        note.textContent = t(['rucnicari', 'houfnice'].includes(type) ? 'hillApplied' : 'hillNote');
        return note;
    }
    function tacticNote(type) {
        const names = game.tacticsFor(type).map(id => COPY[language].tactics[id].name);
        if (!names.length) return null;
        const note = document.createElement('p'); note.className = 'tactic-note';
        note.textContent = t('activeTactics', { names: names.join(', ') });
        return note;
    }
    function openBuild(col, row) {
        selected = { col, row, preview: lastBuildType };
        sheetHeader(t('buildTitle'));
        const options = document.createElement('div'); options.className = 'options';
        const detail = document.createElement('p'); detail.className = 'build-detail';
        const bonuses = document.createElement('div');
        const footer = document.createElement('div'); footer.className = 'build-footer';
        const stats = document.createElement('span'); stats.className = 'build-stats';
        const build = document.createElement('button'); build.type = 'button';
        build.className = 'action-button primary'; build.dataset.build = 'true';
        function choose(type) {
            selected.preview = type; lastBuildType = type;
            options.querySelectorAll('.option').forEach(option => {
                const active = option.dataset.type === type;
                option.classList.toggle('selected', active);
                option.setAttribute('aria-pressed', String(active));
            });
            const spec = WagonDefense.DEFENSES[type];
            const actual = game.towerStats({ type, level: 1, col, row });
            detail.textContent = type === 'houfnice' && actual.splash === 2
                ? t('scatterDesc') : COPY[language].units[type].desc;
            const reaches = game.route.some(hex => WagonDefense.hexDistance({ col, row }, hex) <= actual.range);
            detail.classList.toggle('placement-warning', !reaches);
            if (!reaches) detail.textContent = t(type === 'vuz' ? 'wagonNoRoad' : 'noRoad');
            stats.textContent = describeStats(type, actual);
            bonuses.replaceChildren(...[terrainNote(col, row, type), tacticNote(type)].filter(Boolean));
            build.dataset.cost = spec.cost;
            refreshUI(); positionSheet(); render();
        }
        for (const [type, spec] of Object.entries(WagonDefense.DEFENSES)) {
            const button = document.createElement('button'); button.type = 'button';
            button.className = 'option'; button.dataset.type = type;
            const icon = document.createElement('span'); icon.className = 'option-icon';
            icon.innerHTML = WoodcutRenderer.icon(unitKinds[type]); // společná, kódem definovaná kresba
            const name = document.createElement('span'); name.className = 'option-name';
            const label = document.createElement('span'); label.textContent = unitName(type);
            const price = document.createElement('b'); price.textContent = spec.cost;
            name.append(label, price);
            const description = document.createElement('span'); description.className = 'option-desc';
            description.textContent = COPY[language].units[type].role;
            button.append(icon, name, description);
            button.addEventListener('click', () => choose(type));
            options.append(button);
        }
        build.addEventListener('click', () => {
            const type = selected.preview;
            if (game.place(selected.col, selected.row, type)) {
                setMessage(t('built', { unit: unitName(type) })); closeSheet(); refreshUI();
            } else setMessage(t('notEnough'));
        });
        footer.append(stats, build); sheet.append(options, detail, bonuses, footer);
        sheet.hidden = false; choose(lastBuildType);
    }
    function openTower(tower) {
        selected = { col: tower.col, row: tower.row };
        sheetHeader(unitName(tower.type) + ' · ' + t('level', { level: tower.level }));
        const stats = game.towerStats(tower);
        const info = document.createElement('p'); info.className = 'sheet-info';
        info.textContent = describeStats(tower.type, stats)
            + (tower.type !== 'vuz' && game.adjacentWagons(tower)
                ? ' · ' + t('support', { value: Math.round(game.supportBoost(tower) * 100) }) : '');
        sheet.append(info);
        sheet.append(...[terrainNote(tower.col, tower.row, tower.type), tacticNote(tower.type)].filter(Boolean));
        if (tower.type === 'vuz') {
            const rules = document.createElement('p'); rules.className = 'effect-note';
            rules.textContent = t('wagonRules');
            const live = document.createElement('p'); live.className = 'effect-live'; live.dataset.wagonLive = 'true';
            sheet.append(rules, live);
        }
        if (tower.level < 3) {
            const next = document.createElement('p'); next.className = 'upgrade-preview';
            next.textContent = t('upgradePreview', {
                stats: describeStats(tower.type, game.towerStats({ ...tower, level: tower.level + 1 }))
            });
            sheet.append(next);
        }
        const actions = document.createElement('div'); actions.className = 'sheet-actions';
        const upgrade = document.createElement('button'); upgrade.type = 'button';
        upgrade.className = 'action-button primary';
        const cost = game.upgradeCost(tower);
        upgrade.textContent = tower.level >= 3 ? t('maxLevel') : t('upgrade', { cost });
        if (tower.level < 3) upgrade.dataset.cost = cost;
        upgrade.disabled = tower.level >= 3 || game.gold < cost;
        upgrade.addEventListener('click', () => {
            if (game.upgrade(tower.col, tower.row)) {
                setMessage(t('upgraded', { unit: unitName(tower.type) }));
                openTower(tower); refreshUI();
            } else setMessage(t('notEnough'));
        });
        const sell = document.createElement('button'); sell.type = 'button'; sell.className = 'action-button';
        sell.textContent = t('sell', { gold: Math.round(tower.spent * 0.6) });
        sell.addEventListener('click', () => {
            if (game.sell(tower.col, tower.row)) {
                setMessage(t('sold')); closeSheet(); refreshUI();
            }
        });
        actions.append(upgrade, sell); sheet.append(actions); sheet.hidden = false;
        positionSheet(); refreshUI(); render();
    }
    function openBarricade(id, focusControl = null) {
        const gate = WagonDefense.BARRICADES[id];
        selected = { col: gate.col, row: gate.row, barricade: id };
        keyboardCell = { col: gate.col, row: gate.row };
        sheetHeader(t('barricadeTitle', { mark: gate.mark }));
        const tabs = document.createElement('div'); tabs.className = 'route-tabs';
        for (const option of Object.values(WagonDefense.BARRICADES)) {
            const tab = document.createElement('button'); tab.type = 'button'; tab.className = 'route-tab';
            tab.textContent = option.mark + ' · ' + COPY[language].gateNames[option.id];
            tab.setAttribute('aria-pressed', String(id === option.id));
            tab.addEventListener('click', () => openBarricade(option.id, 'tab')); tabs.append(tab);
        }
        const closed = game.barricades.has(id);
        const description = document.createElement('p'); description.className = 'sheet-info';
        description.textContent = t(closed ? 'barricadeClosed' : 'barricadeOpen');
        const preview = document.createElement('p'); preview.className = 'terrain-note';
        const extra = Math.round(game.previewBarricade(id).length - WagonDefense.PATH_LENGTH);
        preview.textContent = extra ? t('routeLength', { range: hexCount(extra) }) : t('routeOriginal');
        const note = document.createElement('p'); note.className = 'effect-note';
        note.textContent = t('barricadeLocked');
        const button = document.createElement('button'); button.type = 'button';
        button.className = 'action-button primary barricade-action'; button.dataset.barricade = id;
        button.textContent = !closed && game.gold < WagonDefense.BARRICADE_COST
            ? t('missingGold', { gold: WagonDefense.BARRICADE_COST - game.gold })
            : t(closed ? 'barricadeRemove' : 'barricadeBuild', { cost: WagonDefense.BARRICADE_COST });
        button.addEventListener('click', () => {
            if (!game.toggleBarricade(id)) return;
            makeBackground();
            setMessage(t('barricadeChanged', { mark: gate.mark,
                route: t(game.barricades.has(id) ? 'routeLong' : 'routeShort') }));
            openBarricade(id, 'action');
        });
        sheet.append(tabs, description, preview, note, button); sheet.hidden = false;
        positionSheet(); refreshUI(); render();
        if (focusControl === 'tab') tabs.querySelector('[aria-pressed="true"]').focus({ preventScroll: true });
        else if (focusControl === 'action') button.focus({ preventScroll: true });
    }
    function selectCell(col, row, keyboard = false) {
        if (!overlay.hidden || ['won', 'lost'].includes(game.state)) return;
        keyboardCell = { col, row };
        const tower = game.towerAt(col, row);
        const gate = game.barricadeAt(col, row);
        if (gate) markTip('barricade');
        if (game.isHill(col, row)) markTip('hill');
        if (gate) openBarricade(gate.id);
        else if (tower) openTower(tower);
        else if (game.isBuildable(col, row)) openBuild(col, row);
        else { closeSheet(); setMessage(t('forbidden')); }
        if (keyboard && !sheet.hidden) (sheet.querySelector('.option.selected') || sheet.querySelector('button')).focus();
    }
    function closeOverlay() {
        overlay.hidden = true; overlayKind = null; lastFrame = 0;
        for (const child of app.children) if (child !== overlay) child.inert = false;
        if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
        returnFocus = null;
        refreshCoach();
        if (game.pendingChoice) showOverlay('choice');
    }
    function togglePause() {
        if (game.state !== 'running' || !overlay.hidden) return;
        paused = !paused; lastFrame = 0;
        refreshUI(); render();
    }
    function resultPanel() {
        const result = runResult || game.summary();
        const grade = document.createElement('p'); grade.className = 'result-grade';
        grade.textContent = (result.grade ? '★'.repeat(result.grade) + '☆'.repeat(3 - result.grade) + ' · ' : '')
            + COPY[language].grades[result.grade];
        const stats = document.createElement('div'); stats.className = 'result-stats';
        const time = Math.floor(result.seconds / 60) + ':' + String(result.seconds % 60).padStart(2, '0');
        for (const [label, value] of [['resultCamp', result.camp + '/20'], ['resultWaves', result.cleared + '/8'], ['resultTime', time]]) {
            const item = document.createElement('div');
            const number = document.createElement('strong'); number.textContent = value;
            const name = document.createElement('span'); name.textContent = t(label); item.append(number, name); stats.append(item);
        }
        overlayBody.append(grade, stats);
        if (profile.best) {
            const record = document.createElement('p'); record.className = 'record-line';
            record.textContent = (newRecord ? t('newRecord') + ' · ' : '')
                + t('bestResult', { waves: profile.best.cleared, camp: profile.best.camp }); overlayBody.append(record);
        }
        const table = document.createElement('table'); table.className = 'result-table';
        const caption = document.createElement('caption'); caption.textContent = t('contribution'); table.append(caption);
        const head = document.createElement('thead'), header = document.createElement('tr');
        for (const key of ['unitColumn', 'damageColumn', 'killsColumn']) {
            const th = document.createElement('th'); th.scope = 'col'; th.textContent = t(key); header.append(th);
        }
        head.append(header); table.append(head);
        const body = document.createElement('tbody');
        for (const [type, unit] of Object.entries(result.units)) {
            if (!unit.built || type === 'vuz') continue;
            const row = document.createElement('tr'), name = document.createElement('th'); name.scope = 'row';
            name.textContent = unitName(type) + ' ×' + unit.built;
            const damage = document.createElement('td'); damage.textContent = unit.damage.toLocaleString(language);
            const kills = document.createElement('td'); kills.textContent = unit.kills;
            row.append(name, damage, kills); body.append(row);
        }
        if (body.children.length) { table.append(body); overlayBody.append(table); }
        const note = document.createElement('p'); note.className = 'result-note'; note.textContent = t('damageNote'); overlayBody.append(note);
        if (result.units.vuz.built) {
            const wagons = document.createElement('section'); wagons.className = 'result-support';
            const title = document.createElement('h3'); title.textContent = t('wagonContribution') + ' ×' + result.units.vuz.built;
            const attack = document.createElement('p'); attack.textContent = t('supportResult', { damage: result.supportDamage });
            const slow = document.createElement('p'); slow.textContent = t('slowResult', { seconds: result.slowedSeconds });
            const help = document.createElement('p'); help.className = 'result-note'; help.textContent = t('supportNote');
            wagons.append(title, attack, slow, help); overlayBody.append(wagons);
        }
        if (result.tactics.length) {
            const heading = document.createElement('h3'); heading.textContent = t('resultTactics');
            const choices = document.createElement('p'); choices.className = 'result-perks';
            choices.textContent = result.tactics.map(id => COPY[language].tactics[id].name).join(' · ');
            overlayBody.append(heading, choices);
        }
        const weapons = result.units.rucnicari.built + result.units.houfnice.built + result.units.cepnici.built;
        const tip = result.units.vuz.built && weapons < 2 ? 'weapons'
            : result.leaks && !result.units.cepnici.built ? 'armor'
                : !result.hillsBuilt ? 'hill' : result.outcome === 'lost' && !result.choralUsed ? 'choral'
                    : !result.barricades.length ? 'route' : 'perfect';
        const hint = document.createElement('div'); hint.className = 'result-hint';
        const title = document.createElement('strong'); title.textContent = t('nextTry');
        const text = document.createElement('p'); text.textContent = COPY[language].resultTips[tip];
        hint.append(title, text); overlayBody.append(hint);
    }
    function openFeedback() {
        feedbackReturn = ['won', 'lost', 'help'].includes(overlayKind) ? overlayKind : null;
        showOverlay('feedback');
    }
    function backFromFeedback() {
        const previous = feedbackReturn; feedbackReturn = null;
        if (previous) showOverlay(previous); else closeOverlay();
    }
    function feedbackPanel() {
        const intro = document.createElement('p'); intro.className = 'choice-note'; intro.textContent = t('feedbackIntro');
        const form = document.createElement('div'); form.className = 'feedback-form';
        for (const [key, title] of [['clarity', 'feedbackClarity'], ['difficulty', 'feedbackDifficulty'], ['replay', 'feedbackReplay']]) {
            const label = document.createElement('label'); label.textContent = t(title);
            const select = document.createElement('select'); select.id = 'feedback-' + key;
            for (const [value, text] of [['', t('unanswered')], ...COPY[language].feedbackOptions[key]]) {
                const option = document.createElement('option'); option.value = value; option.textContent = text; select.append(option);
            }
            select.value = feedbackDraft[key] || '';
            select.addEventListener('change', () => { feedbackDraft[key] = select.value; });
            label.append(select); form.append(label);
        }
        const label = document.createElement('label'); label.textContent = t('feedbackNote');
        const note = document.createElement('textarea'); note.id = 'feedback-note'; note.rows = 3; note.maxLength = 1200;
        note.placeholder = t('feedbackPlaceholder'); note.value = feedbackDraft.note || '';
        note.addEventListener('input', () => { feedbackDraft.note = note.value; }); label.append(note); form.append(label);
        const status = document.createElement('p'); status.className = 'copy-status'; status.setAttribute('role', 'status');
        async function copy(text, success) {
            try {
                await navigator.clipboard.writeText(text); status.textContent = t(success);
            } catch (_) {
                status.textContent = t('copyFallback');
                let fallback = form.querySelector('.copy-fallback');
                if (!fallback) { fallback = document.createElement('textarea'); fallback.className = 'copy-fallback'; form.append(fallback); }
                fallback.readOnly = true; fallback.value = text; fallback.setAttribute('aria-label', t('reportLabel'));
                fallback.focus(); fallback.select();
            }
        }
        const link = document.createElement('button'); link.type = 'button'; link.className = 'text-button'; link.textContent = t('copyLink');
        link.addEventListener('click', () => {
            const url = ['localhost', '127.0.0.1'].includes(location.hostname)
                ? 'https://josefslerka.github.io/husitske-valky-test/bonus/vozova-hradba/' : new URL('./', location.href).href;
            copy(url, 'linkCopied');
        });
        overlayBody.append(intro, form, link, status);
        overlayButton.textContent = t('copyReport');
        overlayButton.onclick = () => copy(DefenseSession.report({ ...(runResult || game.summary()),
            attempt: profile.attempts, tutorialSeen: [...profile.seen], recentResults: profile.recent }, feedbackDraft), 'reportCopied');
        overlaySecondary.hidden = false; overlaySecondary.textContent = t('feedbackBack'); overlaySecondary.onclick = backFromFeedback;
    }
    function showOverlay(kind) {
        if (overlay.hidden) returnFocus = document.activeElement;
        overlayKind = kind;
        overlay.hidden = false;
        for (const child of app.children) if (child !== overlay) child.inert = true;
        overlayBody.replaceChildren();
        overlaySecondary.hidden = true;
        overlayButton.disabled = false;
        overlayCard.classList.toggle('result-card', ['won', 'lost'].includes(kind));
        if (kind === 'help') {
            overlayTitle.textContent = t('helpTitle');
            const intro = document.createElement('p'); intro.textContent = t('helpBody');
            const list = document.createElement('ul');
            for (const item of COPY[language].helpItems) {
                const li = document.createElement('li'); li.textContent = item; list.append(li);
            }
            overlayBody.append(intro, list);
            overlayButton.textContent = t('continue');
            overlayButton.onclick = closeOverlay;
            const replay = document.createElement('button'); replay.type = 'button'; replay.className = 'text-button'; replay.textContent = t('coachReplay');
            replay.addEventListener('click', () => { profile.seen = []; saveProfile(); closeOverlay(); refreshCoach(); render(); });
            overlayBody.prepend(replay);
        } else if (kind === 'feedback') {
            overlayTitle.textContent = t('feedbackTitle'); feedbackPanel();
        } else if (kind === 'choice') {
            const choice = game.pendingChoice;
            if (!choice) { closeOverlay(); return; }
            overlayTitle.textContent = t('choiceTitle');
            const intro = document.createElement('p'); intro.className = 'choice-note';
            intro.textContent = t('choiceIntro', { wave: choice.wave });
            const cards = document.createElement('div'); cards.className = 'choice-list';
            let picked = null;
            for (const id of choice.options) {
                const copy = COPY[language].tactics[id];
                const card = document.createElement('button'); card.type = 'button'; card.className = 'choice-card';
                card.setAttribute('aria-pressed', 'false');
                const icon = document.createElement('span');
                icon.innerHTML = WoodcutRenderer.icon(unitKinds[WagonDefense.TACTICS[id].type]);
                const name = document.createElement('strong'); name.textContent = copy.name;
                const description = document.createElement('small'); description.textContent = copy.desc;
                card.append(icon, name, description);
                card.addEventListener('click', () => {
                    picked = id;
                    for (const other of cards.children) other.setAttribute('aria-pressed', String(card === other));
                    overlayButton.disabled = false;
                });
                cards.append(card);
            }
            const note = document.createElement('p'); note.className = 'choice-note'; note.textContent = t('choicePaused');
            overlayBody.append(intro, cards, note);
            overlayButton.disabled = true; overlayButton.textContent = t('chooseTactic');
            overlayButton.onclick = () => {
                if (!game.chooseTactic(picked)) return;
                setMessage(t('tacticChosen', { name: COPY[language].tactics[picked].name }));
                closeOverlay(); refreshUI(); render();
            };
        } else if (kind === 'tactics') {
            overlayTitle.textContent = t('tacticsTitle');
            if (!game.tactics.size) {
                const intro = document.createElement('p'); intro.textContent = t('noTactics'); overlayBody.append(intro);
            }
            for (const id of game.tactics) {
                const item = document.createElement('div'); item.className = 'perk-record';
                const name = document.createElement('strong'); name.textContent = COPY[language].tactics[id].name;
                const description = document.createElement('p'); description.textContent = COPY[language].tactics[id].desc;
                item.append(name, description); overlayBody.append(item);
            }
            const next = WagonDefense.CHOICES.find(choice => !game.clearedWaves.has(choice.wave));
            const note = document.createElement('p'); note.className = 'choice-note';
            note.textContent = next ? t('nextChoice', { wave: next.wave }) : t('allChoices'); overlayBody.append(note);
            overlayButton.textContent = t('continue'); overlayButton.onclick = closeOverlay;
        } else if (kind === 'restart') {
            overlayTitle.textContent = t('restartTitle');
            const description = document.createElement('p'); description.textContent = t('restartBody');
            overlayBody.append(description);
            overlayButton.textContent = t('restart'); overlayButton.onclick = reset;
            overlaySecondary.hidden = false; overlaySecondary.textContent = t('cancel');
            overlaySecondary.onclick = closeOverlay;
        } else {
            const won = kind === 'won';
            overlayTitle.textContent = t(won ? 'wonTitle' : 'lostTitle');
            resultPanel();
            overlayButton.textContent = t('again');
            overlayButton.onclick = reset;
            overlaySecondary.hidden = false; overlaySecondary.textContent = t('testerButton'); overlaySecondary.onclick = openFeedback;
        }
        overlayBody.scrollTop = 0;
        refreshCoach();
        (['help', 'tactics', 'choice', 'feedback', 'won', 'lost'].includes(kind) ? overlayCard
            : kind === 'restart' ? overlaySecondary : overlayButton)
            .focus({ preventScroll: true });
    }
    function reset() {
        game.reset(); effects = []; selected = null; speed = 1; lastFrame = 0;
        runResult = null; newRecord = false; feedbackDraft = {}; feedbackReturn = null;
        paused = false; lastBuildType = 'rucnicari'; keyboardCell = { col: 3, row: 3 };
        sheet.hidden = true; closeOverlay();
        makeBackground();
        setMessage(t('initial')); refreshUI(); render();
        canvas.focus();
    }
    function applyLanguage() {
        document.documentElement.lang = language;
        document.title = t('pageTitle');
        document.getElementById('title').textContent = t('title');
        document.getElementById('gold-label').textContent = t('gold');
        document.getElementById('camp-label').textContent = t('camp');
        document.getElementById('wave-label').textContent = t('wave');
        document.getElementById('historical-note').textContent = t('history');
        document.getElementById('feedback-button').textContent = t('testerButton');
        document.getElementById('help-button').setAttribute('aria-label', t('helpLabel'));
        document.getElementById('restart-button').setAttribute('aria-label', t('restart'));
        document.getElementById('restart-button').title = t('restart');
        document.getElementById('language-button').textContent = language === 'cs' ? 'EN' : 'CS';
        document.getElementById('language-button').setAttribute('aria-label', t('languageLabel'));
        speedButton.setAttribute('aria-label', t('speedLabel'));
        stage.setAttribute('aria-label', t('stageLabel'));
        document.getElementById('hill-legend').textContent = t('hillLegend');
        document.getElementById('map-tools').setAttribute('aria-label', language === 'cs'
            ? 'Terén a příprava obrany' : 'Terrain and defense preparation');
        document.querySelector('.wave-brief').setAttribute('aria-label', t('waveBriefLabel'));
        canvas.setAttribute('aria-label', t('mapLabel'));
        if (game.state === 'running') setMessage(t('waveStarted', { wave: game.wave }));
        else if (game.state === 'ready' && game.wave > 0) {
            setMessage(t('waveComplete', { wave: game.wave, bonus: 20 + 4 * game.wave })
                + ' ' + COPY[language].tips[game.wave]);
        } else if (game.wave === 0) setMessage(t('initial'));
        if (!sheet.hidden && selected) {
            const tower = game.towerAt(selected.col, selected.row);
            if (selected.barricade) openBarricade(selected.barricade);
            else if (tower) openTower(tower);
            else openBuild(selected.col, selected.row);
        }
        if (overlayKind) showOverlay(overlayKind);
        refreshUI(); render();
    }

    canvas.addEventListener('pointerdown', event => {
        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left - canvas.clientLeft) / canvas.clientWidth * WagonDefense.MAP_WIDTH;
        const y = (event.clientY - rect.top - canvas.clientTop) / canvas.clientHeight * WagonDefense.MAP_HEIGHT;
        const hex = WagonDefense.hexAt(x, y);
        if (hex) selectCell(hex.col, hex.row);
    });
    let keyboardCell = { col: 3, row: 3 };
    canvas.addEventListener('keydown', event => {
        const change = {
            ArrowLeft: [-1, 0], ArrowRight: [1, 0],
            ArrowUp: [0, -1], ArrowDown: [0, 1]
        }[event.key];
        if (change) {
            event.preventDefault();
            keyboardCell.col = Math.max(0, Math.min(WagonDefense.COLS - 1, keyboardCell.col + change[0]));
            keyboardCell.row = Math.max(0, Math.min(WagonDefense.ROWS - 1, keyboardCell.row + change[1]));
            if (!sheet.hidden) selectCell(keyboardCell.col, keyboardCell.row);
            else { selected = { ...keyboardCell }; render(); }
        } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault(); selectCell(keyboardCell.col, keyboardCell.row, true);
        }
    });
    waveButton.addEventListener('click', () => {
        const result = game.startWave();
        if (!result) return;
        if (result.wave === 1) { profile.attempts++; saveProfile(); }
        closeSheet();
        setMessage(result.early
            ? t('waveEarly', { bonus: WagonDefense.EARLY_BONUS })
            : t('waveStarted', { wave: result.wave }));
        refreshUI();
    });
    choralButton.addEventListener('click', () => {
        if (game.activateChoral()) { setMessage(t('choralMessage')); refreshUI(); }
    });
    speedButton.addEventListener('click', () => { speed = speed === 1 ? 2 : 1; refreshUI(); });
    pauseButton.addEventListener('click', togglePause);
    coachAction.addEventListener('click', () => {
        if (!coachStep) return;
        const target = coachTargets[coachStep]; selectCell(target.col, target.row, true);
    });
    coachSkip.addEventListener('click', () => {
        profile.seen = [...DefenseSession.STEPS]; saveProfile(); refreshCoach(); render(); canvas.focus();
    });
    barricadesButton.addEventListener('click', () => {
        if (!overlay.hidden) return;
        const id = selected?.barricade || 'east';
        const gate = WagonDefense.BARRICADES[id];
        selectCell(gate.col, gate.row);
    });
    tacticsButton.addEventListener('click', () => showOverlay(game.pendingChoice ? 'choice' : 'tactics'));
    document.getElementById('restart-button').addEventListener('click', () => showOverlay('restart'));
    document.getElementById('help-button').addEventListener('click', () => showOverlay('help'));
    document.getElementById('feedback-button').addEventListener('click', () => openFeedback());
    document.getElementById('language-button').addEventListener('click', () => {
        language = language === 'cs' ? 'en' : 'cs';
        profile.language = language; saveProfile();
        applyLanguage();
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            if (overlayKind === 'feedback') { backFromFeedback(); return; }
            if (['help', 'restart', 'tactics'].includes(overlayKind)) closeOverlay();
            else if (overlay.hidden && !sheet.hidden) closeSheet();
        } else if (event.key.toLowerCase() === 'p' && !event.ctrlKey && !event.metaKey && !event.altKey
            && !event.target.closest('input, textarea, select, [contenteditable="true"]')) {
            event.preventDefault(); togglePause();
        } else if (event.key === 'Tab' && !overlay.hidden) {
            const buttons = [...overlayCard.querySelectorAll('button:not(:disabled), input, select, textarea')]
                .filter(button => !button.hidden);
            const index = buttons.indexOf(document.activeElement);
            event.preventDefault();
            const next = index < 0 ? (event.shiftKey ? buttons.length - 1 : 0)
                : (index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
            buttons[next]?.focus();
        }
    });
    document.addEventListener('visibilitychange', () => {
        lastFrame = 0; needsRender = true;
        if (document.hidden && game.state === 'running') paused = true;
        refreshUI();
    });
    new ResizeObserver(fitCanvas).observe(stage);
    fitCanvas();
    applyLanguage();
    setMessage(t('initial'));
    function frame(now) {
        const elapsed = lastFrame ? Math.min(0.08, (now - lastFrame) / 1000) : 0;
        lastFrame = now;
        const active = !document.hidden && overlay.hidden && !paused && game.state === 'running';
        if (active) {
            for (let step = 0; step < speed; step++) {
                const events = game.tick(elapsed);
                for (const event of events) {
                    if (event.type === 'fire') {
                        effects.push({
                            type: event.splash ? 'blast' : event.weapon === 'cepnici' ? 'strike' : 'shot',
                            from: event.from, to: event.to,
                            radius: event.splash, life: event.splash ? 0.4 : 0.2, max: event.splash ? 0.4 : 0.2
                        });
                    } else if (event.type === 'kill') {
                        effects.push({ type: 'coin', x: event.x, y: event.y,
                            reward: event.reward, life: 0.8, max: 0.8 });
                    } else if (event.type === 'breach') {
                        setMessage(t('breach'));
                    } else if (event.type === 'waveComplete') {
                        setMessage(t('waveComplete', { wave: event.wave, bonus: event.bonus })
                            + (game.state === 'ready' ? ' ' + COPY[language].tips[event.wave] : ''));
                    } else if (event.type === 'won' || event.type === 'lost') {
                        saveResult();
                        closeSheet();
                        showOverlay(event.type);
                    }
                }
                if (game.pendingChoice && !['won', 'lost'].includes(game.state)) {
                    closeSheet(); showOverlay('choice');
                }
                if (game.state !== 'running' || !overlay.hidden) break;
            }
            refreshUI();
        }
        const hadEffects = effects.length > 0;
        if (!paused && overlay.hidden) effects.forEach(effect => { effect.life -= elapsed * speed; });
        effects = effects.filter(effect => effect.life > 0);
        if (active || hadEffects || needsRender) {
            render(); needsRender = false;
        }
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
})();
