
// Jediný zdroj pravdy pro herní plochu Plzně. Městský terén, popisek mapy
// i vítězná zóna musí obsahovat stejné hexy, jinak hráč vidí jiný cíl, než
// jaký ve skutečnosti vyhodnocují pravidla.
const PLZEN_CITY_HEXES = [
    [16,4], [17,4], [18,4], [19,4],
    [16,5], [17,5], [18,5], [19,5],
    [16,6], [17,6], [18,6], [19,6],
    [16,7], [17,7], [18,7], [19,7],
    [16,8], [17,8], [18,8], [19,8]
];
const plzenCityHexes = () => PLZEN_CITY_HEXES.map(([col, row]) => [col, row]);

const Scenarios = {
    // ==========================================
    // BITVA 0: ŽIVOHOŠŤ (4. listopadu 1419) - TUTORIÁL
    // ==========================================
    zivohost_1419: {
        id: 'zivohost_1419',
        name: 'Bitva u Živohoště',
        date: "4. nebo 6. listopadu 1419",

        type: 'field_battle',
        difficulty: 3,
        tutorial: false,
        description: 'První větší střetnutí husitských válek. Jihočeští poutníci musí přežít útok do příchodu posil.',
        historicalSignificance: 'Ukázka nutnosti organizované obrany, předchůdce vozové hradby.',

        briefing: {
            hussites: 'Petr ze Šternberka přepadl u brodu váš houf jihočeských poutníků. Stáhněte bezbranné — jsou mezi nimi ženy a děti — na kopec Červenka a udržte se, dokud nedorazí posily z Nového Knína!',
            crusaders: 'Dohoňte husitské poutníky dříve, než se jim dostane pomoci. Máte převahu - využijte ji!'
        },

        mapSize: { width: 18, height: 14 },

        terrain: {
            // Kopec Červenka - keltské hradiště (pravá strana mapy)
            hills: [
                [13,5], [14,5], [15,5],
                [13,6], [14,6], [15,6],
                [14,7], [15,7]
            ],
            // Brod přes Vltavu (levý horní roh)
            water: [
                [0,2], [1,2], [2,2],
                [0,3], [1,3]
            ],
            // Řídký les
            forest: [
                [15,0], [16,0], [17,0],
                [16,1], [17,1],
                [0,11], [1,11], [2,11],
                [0,12], [1,12], [2,12], [3,12],
                [0,13], [1,13], [2,13]
            ],
            // Benešovská silnice
            road: [
                [0,7], [1,7], [2,7], [3,7], [4,7], [5,7], [6,7], [7,7], [8,7]
            ],
            plains: 'default'
        },

        mapLabels: [
            { text: 'Červenka', hexes: [[13,5], [14,5], [15,5], [14,6], [15,6]] },
            { text: 'Brod přes Vltavu', i18nKey: 'vltavaFord', hexes: [[0,2], [1,2], [2,2], [0,3], [1,3]], offset: [0.5, 0] }
        ],

        forces: {
            hussites: {
                commander: 'Břeněk Švihovský z Rýzmburka',
                units: [
                    // Kněz Koranda - kazatel na vrcholu kopce, drží morálku poutníků
                    { type: 'VACLAV_KORANDA', col: 14, row: 6 },
                    // Ozbrojení bojovníci - kryjí ústup poutníků na kopec
                    { type: 'CEPNICI', col: 10, row: 6 },
                    { type: 'SUDLICNICI', col: 10, row: 7 },
                    { type: 'KUSINICI_HUSITI', col: 13, row: 5 },  // na kopci - střílí z výšiny
                    { type: 'JIZDA_HUSITI', col: 8, row: 7 },       // zdržuje nepřítele vpředu
                    // Bezbranní poutníci (ženy, děti, chudina) - stáhni je na kopec Červenka!
                    { type: 'POUTNICI', col: 11, row: 5 },
                    { type: 'POUTNICI', col: 11, row: 7 },
                    { type: 'POUTNICI', col: 12, row: 6 }
                ],
                reinforcements: {
                    turn: 5,
                    units: [
                        // Posily z Nového Knína - přicházejí blíže k boji
                        { type: 'BRENEK_SVIHOVSKY', col: 6, row: 7 },
                        { type: 'CEPNICI', col: 5, row: 6 },
                        { type: 'CEPNICI', col: 5, row: 8 },
                        { type: 'CEPNICI', col: 6, row: 6 },
                        { type: 'SUDLICNICI', col: 6, row: 8 },
                        { type: 'SUDLICNICI', col: 7, row: 7 },
                        { type: 'KUSINICI_HUSITI', col: 7, row: 6 },
                        { type: 'KUSINICI_HUSITI', col: 7, row: 8 },
                        { type: 'JIZDA_HUSITI', col: 5, row: 7 }
                    ],
                    message: 'Posily z Nového Knína přicházejí! Břeněk Švihovský vede oddíl na pomoc!'
                }
            },
            crusaders: {
                commander: 'Petr Konopišťský ze Šternberka',
                units: [
                    // VELITEL - Petr ze Šternberka (historicky ~1300 jezdců)
                    { type: 'PETR_STERNBERK', col: 4, row: 7 },
                    // Těžká jízda - hlavní útočná síla
                    { type: 'TEZKY_RYTIR', col: 3, row: 6 },
                    { type: 'TEZKY_RYTIR', col: 3, row: 7 },
                    { type: 'TEZKY_RYTIR', col: 3, row: 8 },
                    // Lehká jízda
                    { type: 'LEHKA_JIZDA', col: 5, row: 6 },
                    { type: 'LEHKA_JIZDA', col: 5, row: 8 },
                    // Pěchota
                    { type: 'KOPINICI', col: 2, row: 6 },
                    { type: 'KOPINICI', col: 2, row: 7 },
                    { type: 'HALAPARTNICI', col: 1, row: 7 }
                ]
            }
        },

        phases: [
            {
                id: 1,
                name: 'Překvapivý útok',
                turnRange: [1, 2],
                description: 'Šternberk útočí na unavené jihočeské poutníky.',
                events: [
                    { trigger: 'turn_1', message: 'Petr ze Šternberka vás dostihl! Opevněte se na kopci Červenka!' },
                    { trigger: 'turn_1', type: 'tutorial', text: 'TIP: Vaše jednotky jsou blízko kopce. Přesuňte je na zelená pole pro obranný bonus.' }
                ]
            },
            {
                id: 2,
                name: 'Obrana na kopci',
                turnRange: [3, 4],
                description: 'Husité budují improvizovanou obranu.',
                events: [
                    { trigger: 'turn_3', type: 'tutorial', text: 'TIP: Stáhni bezbranné poutníky na kopec za bojovníky. Střelci z kopce střílejí dál a silněji (bonus z výšiny).' }
                ]
            },
            {
                id: 3,
                name: 'Příchod posil',
                turnRange: [5, 7],
                description: 'Posily z Nového Knína přicházejí na pomoc.',
                events: [
                    { trigger: 'turn_5', message: 'Břeněk Švihovský přivádí posily! Držte pozice!' }
                ]
            },
            {
                id: 4,
                name: 'Protiútok',
                turnRange: [8, 10],
                description: 'S posilami můžete přejít do protiútoku.',
                events: [
                    { trigger: 'turn_8', message: 'Šternberk vidí přesilu a váhá. Teď je čas udeřit!' }
                ]
            }
        ],

        victoryConditions: {
            primary: {
                type: 'survive',
                turns: 5,
                minUnitsPercent: 40,
                description: 'Stáhni poutníky na kopec Červenka a vydrž do příchodu Knínských (kolo 5). Ochraň bezbranné!'
            },
            secondary: [
                { type: 'hold_position', positions: [[13,6], [14,6], [15,6]], description: 'Udržte kopec Červenka' },
                { type: 'eliminate_commander', description: 'Zajměte nebo zabijte Petra ze Šternberka' }
            ]
        },

        debriefing: {
            victory: 'Vítězství u Živohoště otevírá cestu dál. O jeho ceně však rozhoduje i osud těch, které jste měli chránit.',
            defeat: 'Poutníci byli u brodu rozprášeni a pobiti. Petr ze Šternberka slaví. Husitské hnutí utrpělo těžkou ránu hned v počátcích.',
            // Skupiny na mapě, nikoli počet jednotlivých lidí; uprchlí nejsou padlí.
            victoryVariants: {
                allPilgrims: 'Bitva je vyhraná a všechny původní skupiny poutníků jsou stále na bojišti. Neznamená to boj beze ztrát, ale jejich cesta tady nekončí.\n\nHlas z bojiště — autorská fikce, nikoli citace pramene:\n„Než jsme začali mluvit o vítězství, volali jsme na sebe. Ze všech skupin přicházely odpovědi.“',
                somePilgrims: 'Bitva je vyhraná, ale na bojišti zůstala jen část původních skupin poutníků. Další cesta začne s mezerami v houfu; vítězná zpráva je nezaplní.\n\nHlas z bojiště — autorská fikce, nikoli citace pramene:\n„Volali jsme přes pole. Některé hlasy odpověděly; na jiné jsme čekali marně.“',
                noPilgrims: 'Vojsko zvítězilo, ale žádná z původních skupin poutníků už na bojišti nezůstala. Padlí a ti, kdo uprchli, nejsou totéž; původní houf však už nestojí pohromadě.\n\nHlas z bojiště — autorská fikce, nikoli citace pramene:\n„Měli jsme zprávu o vítězství. Z houfu, který jsme měli chránit, ji tu už nikdo neposlouchal.“'
            }
        },

        maxTurns: 10,
        playerFaction: 'hussites'
    },

    // ==========================================
    // BITVA 0.5: NEKMÍŘ (prosinec 1419) - PRVNÍ VOZOVÁ HRADBA
    // ==========================================
    nekmir_1419: {
        id: 'nekmir_1419',
        name: 'Bitva u Nekmíře',
        date: "prosinec 1419 / leden 1420",

        type: 'field_battle',
        difficulty: 2,
        description: "Raný doklad husitské vozové taktiky. Jan Žižka s malým houfem odráží útok plzeňského landfrýdu.",

        historicalSignificance: "Jeden z nejranějších písemně zachycených bojů husitů s využitím vozů; nikoli první použití vozů v dějinách.",

        aiDoctrine: {
            charge: 'reckless',
            pursueRouted: true,
            flankSeeking: true,
            fearThreshold: 18,
            // Hynek je nyní součástí hlavního cíle a podle tradice v boji padl:
            // nesmí používat obecnou velitelskou logiku útěku do týlu.
            aggressiveCommanders: ['HYNEK_NEKMIRE']
        },

        briefing: {
            hussites: "Landfrýd dostihl váš houf s vozy poblíž Nekmíře. Sražte vozy do obrany, kryjte pěchotu a vyřaďte Hynka. Pouhé čekání k vítězství nestačí. Sedm vozů a jejich polokruhová formace představují herní zpracování stručné zprávy, ne přesný plán bitvy.",
            crusaders: "Dostihnete husitské kacíře, než stihnou zničit tvrz Nekmíř. Máte jasnou početní převahu. Zničte je!"
        },

        mapSize: { width: 20, height: 15 },

        terrain: {
            // Cesta k Nekmíři
            road: [
                [0,7], [1,7], [2,7], [3,7], [4,7], [5,7], [6,7], [7,7], [8,7], [9,7],
                [10,7], [11,7], [12,7], [13,7], [14,7], [15,7]
            ],
            // Tvrz Nekmíř - cíl výpadu
            town: [
                [18,7], [19,7], [18,8], [19,8]
            ],
            // Řídký les po stranách
            forest: [
                [0,0], [1,0], [2,0], [3,0], [4,0],
                [0,1], [1,1], [2,1], [3,1], [4,1],
                [16,12], [17,12], [18,12], [19,12],
                [16,13], [17,13], [18,13], [19,13],
                [17,14], [18,14], [19,14]
            ],
            plains: 'default'
        },

        mapLabels: [
            { text: 'Tvrz Nekmíř', i18nKey: 'nekmirFortress', hexes: [[18,7], [19,7], [18,8], [19,8]], offset: [-0.45, 0] }
        ],

        forces: {
            hussites: {
                commander: 'Jan Žižka z Trocnova',
                units: [
                    // VELITEL - Jan Žižka (jeho první známá bitva jako velitele!)
                    { type: 'JAN_ZIZKA', col: 11, row: 7 },
                    // POUZE 7 VOZŮ - startují ROZPOJENÉ (formation:'open'), protože
                    // Žižka je vezl na pochodu (obléhací trén k Nekmíři) a landfrýd
                    // ho dostihl v poli - hradbu si musel sbít NARYCHLO. Hráč si tedy
                    // polokruh sepne SÁM (viz briefing), ne že by rozpojoval hotovou
                    // hradbu. Bezpečné: nejbližší rytíři ~6 hexů (pohyb 3), hráč táhne
                    // první -> jistý 1. tah na sepnutí.
                    { type: 'VOZOVA_HRADBA', col: 10, row: 6, formation: 'open' },
                    { type: 'VOZOVA_HRADBA', col: 10, row: 7, formation: 'open' },
                    { type: 'VOZOVA_HRADBA', col: 10, row: 8, formation: 'open' },
                    { type: 'VOZOVA_HRADBA', col: 11, row: 5, formation: 'open' },
                    { type: 'VOZOVA_HRADBA', col: 11, row: 6, formation: 'open' },
                    { type: 'VOZOVA_HRADBA', col: 11, row: 8, formation: 'open' },
                    { type: 'VOZOVA_HRADBA', col: 11, row: 9, formation: 'open' },
                    // Pěchota za vozy
                    { type: 'CEPNICI', col: 12, row: 6 },
                    { type: 'CEPNICI', col: 12, row: 7 },
                    { type: 'CEPNICI', col: 12, row: 8 },
                    { type: 'SUDLICNICI', col: 13, row: 7 },
                    // Střelci
                    { type: 'KUSINICI_HUSITI', col: 13, row: 6 },
                    { type: 'KUSINICI_HUSITI', col: 13, row: 8 },
                    { type: 'RUCNICARI', col: 14, row: 7 }
                ]
            },
            crusaders: {
                commander: 'Bohuslav ze Švamberka',
                units: [
                    // VELITEL - Bohuslav ze Švamberka (hejtman landfrýdu)
                    { type: 'BOHUSLAV_SVAMBERK', col: 3, row: 7 },
                    // Těžká jízda - hlavní útočná síla (800 jezdců!)
                    { type: 'TEZKY_RYTIR', col: 4, row: 5 },
                    { type: 'TEZKY_RYTIR', col: 4, row: 6 },
                    { type: 'TEZKY_RYTIR', col: 4, row: 7 },
                    { type: 'TEZKY_RYTIR', col: 4, row: 8 },
                    { type: 'TEZKY_RYTIR', col: 4, row: 9 },
                    { type: 'TEZKOODENCI', col: 5, row: 6 },
                    { type: 'TEZKOODENCI', col: 5, row: 7 },
                    { type: 'TEZKOODENCI', col: 5, row: 8 },
                    // Lehká jízda
                    { type: 'LEHKA_JIZDA', col: 3, row: 5 },
                    { type: 'LEHKA_JIZDA', col: 3, row: 9 },
                    // Pěchota (nezasáhla do bitvy)
                    { type: 'KOPINICI', col: 1, row: 6 },
                    { type: 'KOPINICI', col: 1, row: 7 },
                    { type: 'KOPINICI', col: 1, row: 8 },
                    { type: 'HALAPARTNICI', col: 0, row: 7 },
                    // Hynek z Nekmíře - majitel tvrze (zahyne v boji)
                    { type: 'HYNEK_NEKMIRE', col: 6, row: 7 }
                ]
            }
        },

        phases: [
            {
                id: 1,
                name: "Husitský výpad z Plzně",
                turnRange: [1,2],
                description: "Žižka vytahuje z Plzně směrem k Nekmíři.",
                events: [
                    {"trigger":"turn_1","message":"Plzeňský landfrýd dostihl husitskou kolonu! Rychle vytvořte vozovou hradbu!"},
                    {
                        trigger: "turn_1",
                        type: "tutorial",
                        text: "TIP: Vozy máš na pochodu (rozpojené). Sepni je do vozové hradby — polokruh otevřený k tvrzi. Na uzavřený kruh 7 vozů nestačí."
                    }
                ]
            },
            {
                id: 2,
                name: "Formování vozové obrany",
                turnRange: [3,4],
                description: "Houf využívá vozy jako obranné postavení.",
                events: [
                    {"trigger":"turn_3","message":"Žižka: \"Sražte vozy k sobě! Střelci za vozy, cepníci připraveni!\""},
                    {"trigger":"turn_4","type":"message","condition":{"type":"closed_wagons","faction":"hussites","minCount":3},"text":"Vozy drží pohromadě. Střelci mohou bezpečněji krýt pěchotu — využijte chvíle k útoku na Hynka."}
                ]
            },
            {
                id: 3,
                name: "Útok jízdy na vozovou hradbu",
                turnRange: [5,5],
                description: "Švamberk vrhá jízdu proti vozům.",
                events: [
                    {"trigger":"turn_5","message":"Těžká jízda landfrýdu útočí! Vydrží vozová hradba?"}
                ]
            },
            {
                id: 4,
                name: "Klíčová fáze bitvy",
                turnRange: [6,8],
                description: "Boj o vozové postavení pokračuje.",
                events: [
                    {"trigger":"turn_6","type":"message","condition":{"type":"ready_units","faction":"crusaders","requiredType":"HYNEK_NEKMIRE","area":{"minCol":7,"maxCol":14,"minRow":4,"maxRow":10}},"text":"Hynek se přiblížil k vozům. Připravte proti němu úder, dokud je na dostřel."}
                ]
            },
            {
                id: 5,
                name: "Závěr střetu",
                turnRange: [9,10],
                description: "O výsledku rozhodnou poslední kola a osud Hynka.",
                events: [
                    {"trigger":"turn_9","condition":{"type":"faction_losses_percent","faction":"crusaders","percent":50},"message":"Landfrýd utrpěl těžké ztráty. Zbývá dokončit střet s Hynkem."}
                ]
            }
        ],

        victoryConditions: {
            primary: {
                type: 'survive',
                turns: 10,
                minUnitsPercent: 50,
                requiredEnemyType: 'HYNEK_NEKMIRE',
                description: 'Přežijte 10 kol s alespoň 50 % oddílů a vyřaďte Hynka z Nekmíře'
            },
            secondary: [
                { type: 'protect_wagons', minWagons: 5, description: 'Uchraňte alespoň 5 vozů' }
            ]
        },

        specialMechanics: {
            firstWagonWall: {
                description: 'Historicky první použití vozové hradby',
                wagonsAvailable: 7,
                formationPossible: 'semicircle_only',
                bonuses: {
                    defense: 3,
                    cavalryNegation: true,
                    rangedCover: true
                },
                vulnerabilities: {
                    openFlank: true,
                    noChains: true
                }
            }
        },

        debriefing: {
            victory: "Vozová obrana obstála. V této partii se vám podařilo odrazit landfrýd. Historický střet u Nekmíře patří k raným dokladům Žižkovy taktiky; přesný průběh a počty ztrát však neznáme.",
            defeat: "U Nekmíře se nepodařilo udržet potřebnou sílu a vyřadit Hynka. Přesný průběh historického střetu neznáme; výsledek této partie je herní rekonstrukce."
        },

        maxTurns: 12,
        playerFaction: 'hussites'
    },

    // ==========================================
    // BITVA 1: SUDOMĚŘ (25. března 1420)
    // ==========================================
    sudomere_1420: {
        id: 'sudomere_1420',
        name: 'Bitva u Sudoměře',
        date: '25. března 1420',
        type: 'field_battle',
        difficulty: 2,
        description: "Houf vedený Břeňkem Švihovským a Janem Žižkou brání postavení mezi rybníky proti přesile katolických pánů.",
        historicalSignificance: "Obrana houfu s vozy v rybniční krajině. Raný významný úspěch husitů, nikoli počátek používání vozů ve světových dějinách.",

        briefing: {
            hussites: 'Vaše malá skupina poutníků je pronásledována vojskem katolických pánů. Využijte hráz mezi rybníky a postavte vozovou hradbu. Musíte přežít do setmění.',
            crusaders: 'Dohoňte a zničte husitské kacíře dříve, než se opevní. Útočte rychle, než padne mlha.'
        },

        mapSize: { width: 20, height: 12 },

        terrain: {
            // Hráz - úzký průchod mezi rybníky (2 hexy, řady 5-6)
            dam: [
                [9,5], [9,6]
            ],
            // Rybník Markovec - napuštěný (neprůchodný) - SEVERNĚ od hráze.
            // Historicky: hráz vedla mezi plným Markovcem a vypuštěným
            // Škaredým - útočník musel buď úzkou hrází, nebo bahnem
            water: [
                [6,0], [7,0], [8,0], [9,0], [10,0], [11,0], [12,0], [13,0],
                [6,1], [7,1], [8,1], [9,1], [10,1], [11,1], [12,1], [13,1],
                [6,2], [7,2], [8,2], [9,2], [10,2], [11,2], [12,2], [13,2],
                [6,3], [7,3], [8,3], [9,3], [10,3], [11,3], [12,3], [13,3],
                [6,4], [7,4], [8,4], [9,4], [10,4], [11,4], [12,4], [13,4]
            ],
            // Rybník Škaredý - vypuštěný (bahno) - JIŽNĚ od hráze, na straně
            // útočníka: jediný obchvat vozové hradby vede jeho dnem.
            // Pěchota platí 2 body za hex, jízda 3 - pod palbou z hráze
            mud: [
                [6,7], [7,7], [8,7], [9,7], [10,7], [11,7], [12,7], [13,7],
                [6,8], [7,8], [8,8], [9,8], [10,8], [11,8], [12,8], [13,8],
                [6,9], [7,9], [8,9], [9,9], [10,9], [11,9], [12,9], [13,9],
                [6,10], [7,10], [8,10], [9,10], [10,10], [11,10], [12,10], [13,10],
                [6,11], [7,11], [8,11], [9,11], [10,11], [11,11], [12,11], [13,11]
            ],
            // Vyvýšenina na hrázi je součástí dam terénu (dam poskytuje +20% obranu)
            plains: 'default'
        },

        mapLabels: [
            { text: 'Rybník Markovec', i18nKey: 'markovecPond', hexes: [[7,1], [9,1], [11,1], [13,1]] },
            { text: 'Hráz', i18nKey: 'causeway', hexes: [[9,5], [9,6]], offset: [-2, -1.6] },
            { text: 'Rybník Škaredý (vypuštěný)', i18nKey: 'skaredyPondDrained', hexes: [[7,9], [9,9], [11,9], [13,9]] }
        ],

        forces: {
            hussites: {
                commander: 'Jan Žižka z Trocnova',
                units: [
                    // Vozová hradba - čelní zeď, ucpává úžinu mezi rybníky.
                    // formation:'open' - Žižkovu kolonu na útěku z Plzně dostihli
                    // v poli, hradbu musel sbít na hrázi narychlo (Dolejší). Hráč
                    // ji musí sám sepnout - viz briefing "postavte vozovou hradbu".
                    // Bezpečné: nejbližší rytíři jsou ~6 hexů daleko (pohyb 3),
                    // hráč táhne v kole první, takže má jistý 1. tah na sepnutí.
                    { type: 'VOZOVA_HRADBA', col: 9, row: 5, formation: 'open' },
                    { type: 'VOZOVA_HRADBA', col: 9, row: 6, formation: 'open' },
                    // 3. vůz na (8,6) - společný soused obou předchozích, kryje
                    // i severní okraj bahenního rybníka (jediný obchvat hradby).
                    // isInWagonLine chce 2+ sousední vozy na bonus - trojice
                    // (9,5)-(9,6)-(8,6) je vzájemně sousedící trojúhelník, takže
                    // po sepnutí bonus dostanou všechny tři, ne jen jedna z nich.
                    { type: 'VOZOVA_HRADBA', col: 8, row: 6, formation: 'open' },
                    // Střelci - TĚSNĚ za vozy, dostřel kryje úžinu (col 9) i
                    // severní okraj bahna (řady 7-8) - bagrující jízda dostane palbu
                    { type: 'KUSINICI_HUSITI', col: 10, row: 5 },
                    { type: 'KUSINICI_HUSITI', col: 10, row: 6 },
                    { type: 'RUCNICARI', col: 11, row: 5 },
                    { type: 'RUCNICARI', col: 11, row: 6 },
                    // Pěchota - druhá řada, drží linii a vyráží k protiútoku
                    { type: 'CEPNICI', col: 12, row: 5 },
                    { type: 'CEPNICI', col: 12, row: 6 },
                    { type: 'SUDLICNICI', col: 13, row: 5 },
                    // VELITEL - Jan Žižka (za linií, aura dosah 3 kryje hradbu)
                    { type: 'JAN_ZIZKA', col: 13, row: 6 },
                    // Kněz Koranda - morální kotva za hradbou (Dolejší: byl u Sudoměře)
                    { type: 'VACLAV_KORANDA', col: 14, row: 5 },
                    // Jízda - záloha připravená k výpadu
                    { type: 'JIZDA_HUSITI', col: 14, row: 6 }
                ]
            },
            crusaders: {
                commander: 'Bohuslav ze Švamberka',
                units: [
                    // VELITEL - Bohuslav ze Švamberka
                    { type: 'BOHUSLAV_SVAMBERK', col: 2, row: 5 },
                    // Těžká jízda - musí projet úzkým průchodem
                    { type: 'TEZKY_RYTIR', col: 3, row: 5 },
                    { type: 'TEZKY_RYTIR', col: 3, row: 6 },
                    { type: 'TEZKY_RYTIR', col: 4, row: 5 },
                    { type: 'TEZKY_RYTIR', col: 4, row: 6 },
                    { type: 'TEZKOODENCI', col: 5, row: 5 },
                    { type: 'TEZKOODENCI', col: 5, row: 6 },
                    // Pěchota
                    { type: 'KOPINICI', col: 2, row: 6 },
                    { type: 'HALAPARTNICI', col: 1, row: 5 },
                    { type: 'HALAPARTNICI', col: 1, row: 6 },
                    // Střelci
                    { type: 'KUSNICI', col: 0, row: 5 },
                    { type: 'KUSNICI', col: 0, row: 6 },
                    // Historická přesila jízdy - Sudoměř bylo ~400 husitů proti tisícům
                    // jezdců. Rozšíření náporu na SUCHÉ řady 4 a 7 (rybníky jsou od col 6).
                    { type: 'TEZKY_RYTIR', col: 3, row: 4 },
                    { type: 'TEZKY_RYTIR', col: 4, row: 7 },
                    { type: 'TEZKOODENCI', col: 3, row: 7 }
                ],
                // Druhá vlna - landfrýd dorážel na hráz opakovaně. Čerstvá jízda
                // přijede od západu v kole 6, právě když hráč ubránil první nápor.
                reinforcements: {
                    turn: 6,
                    units: [
                        { type: 'TEZKY_RYTIR', col: 0, row: 4 },
                        { type: 'TEZKY_RYTIR', col: 1, row: 7 },
                        { type: 'TEZKOODENCI', col: 0, row: 7 }
                    ],
                    message: 'Druhá vlna! Čerstvá jízda landfrýdu se žene na hráz!'
                }
            }
        },

        phases: [
            {
                id: 1,
                name: 'Počáteční rozestavení',
                turnRange: [1, 3],
                description: 'Husité se opevňují na hrázi, katolíci se přibližují.',
                events: []
            },
            {
                id: 2,
                name: 'Čelní útok',
                turnRange: [4, 7],
                description: 'Johanité a královské vojsko útočí po hrázi.',
                events: [
                    { trigger: 'turn_4', message: 'Křižáci zahajují útok po úzké hrázi!' }
                ]
            },
            {
                id: 3,
                name: 'Mlha a zmatek',
                turnRange: [8, 12],
                description: 'Padá mlha, katolíci ztrácejí orientaci.',
                events: [
                    { trigger: 'turn_10', message: 'Padá hustá mlha! Viditelnost klesá.' }
                ]
            }
        ],

        victoryConditions: {
            primary: {
                type: 'survive',
                turns: 12,
                minUnitsPercent: 50,
                alternative: { type: 'eliminate_field_army' },
                description: 'Přežijte do kola 12 s alespoň 50% jednotek'
            },
            secondary: [
                { type: 'destroy_percent', percent: 50, description: 'Zničte 50% nepřátelských sil' }
            ]
        },

        debriefing: {
            victory: 'Rybník a bahna se staly hrobem pro železné pány! Husité využili terénu a odrazili přesilu. Tato bitva ukázala, že správně zvolené bojiště může vyvážit i značnou početní nevýhodu. Žižkův génius se projevil naplno.',
            defeat: 'Bahna u Sudoměře se nestala pastí pro nepřítele, ale pro vás. Rytíři prolomili vaši obranu. Žižkova kariéra končí dříve, než mohla skutečně začít.',
            victoryVariants: {
                fieldArmyEliminated: 'Nepřátelskou polní armádu jste rozbili, ale za cenu většiny vlastních oddílů. Osamělý velitel už výsledek bitvy nemohl zvrátit. Je to vítězství — kronikář z něj však vaše ztráty nevymaže.'
            }
        },

        maxTurns: 12,
        playerFaction: 'hussites'
    },

    // ==========================================
    // BITVA 2: VÍTKOV (14. července 1420)
    // ==========================================
    vitkov_1420: {
        id: 'vitkov_1420',
        mapRevision: 2,
        // Útočníci musí projít nevýhodným svahem až ke srubům, ne hlídat rovinu.
        aiDoctrine: { advance: 'assault' },
        name: 'Bitva na Vítkově',
        date: '14. července 1420',
        type: 'defensive_battle',
        difficulty: 2,
        description: 'Obrana Prahy proti první křížové výpravě. Malá posádka na Vítkově musí odolat do příchodu posil.',
        historicalSignificance: 'Zlomový okamžik první křížové výpravy, obrana Prahy.',

        briefing: {
            hussites: "Braňte sruby a zídku na Vítkově. Úzká šíje omezuje rozvinutí útočníků; vydržte do příchodu pražské pomoci. Kronikář líčí malou posádku včetně žen, nikoli vozovou hradbu.",
            crusaders: "Dobyjte husitské opevnění na Vítkově a otevřete cestu k Praze."
        },

        mapSize: { width: 12, height: 8 },

        terrain: {
            // Vítkov = pevnost na úzké šíji (Dolejší). Plošina na východě,
            // obehnaná strmými srázy; jediný přístup je 2hexové hrdlo (řady 3-4)
            // se sruby. Jízda se v hrdle namačká a nemůže se rozvinout.
            // Vrcholová plošina - obránci (+30% obrana)
            hills: [
                [8,1], [9,1], [10,1], [11,1],
                [8,2], [9,2], [10,2], [11,2],
                [8,3], [9,3], [10,3], [11,3],
                [8,4], [9,4], [10,4], [11,4],
                [8,5], [9,5], [10,5], [11,5],
                [8,6], [9,6], [10,6], [11,6]
            ],
            // Strmé srázy obklopující plošinu - trychtýřují útok do hrdla.
            // 'slope' je průchozí, ale pomalý (jízda 3): svahem se dá jen
            // zemřít pod palbou, rychlá cesta vede jen hrdlem.
            slope: [
                [4,0], [5,0], [6,0], [7,0], [8,0], [9,0], [10,0], [11,0],
                [4,1], [5,1], [6,1], [7,1],
                [4,2], [5,2], [6,2], [7,2],
                [4,5], [5,5], [6,5], [7,5],
                [4,6], [5,6], [6,6], [7,6],
                [4,7], [5,7], [6,7], [7,7], [8,7], [9,7], [10,7], [11,7]
            ],
            // Příkopy v hrdle ("tři pásy úzkých příkopů" - Dolejší) - zpomalují
            // namačkanou jízdu těsně před sruby
            mud: [
                [5,3], [6,3],
                [5,4], [6,4]
            ],
            plains: 'default'
        },

        mapLabels: [
            { text: 'Hřeben Vítkov', i18nKey: 'vitkovRidge', hexes: [[8,2], [9,2], [10,2], [11,2]], offset: [0, -0.25] },
            { text: 'Špitálské pole', i18nKey: 'hospitalField', hexes: [[0,3], [1,3], [2,3], [3,3]], offset: [0.35, 0] }
        ],

        forces: {
            hussites: {
                commander: "Jan Žižka z Trocnova",
                units: [
                    {"type":"POLNI_OPEVNENI","col":7,"row":3},
                    {"type":"POLNI_OPEVNENI","col":7,"row":4},
                    {"type":"JAN_ZIZKA","col":9,"row":4},
                    {"type":"CEPNICI","col":8,"row":3},
                    {"type":"CEPNICI","col":8,"row":2},
                    {"type":"SUDLICNICI","col":8,"row":4},
                    {"type":"KUSINICI_HUSITI","col":9,"row":3}
                ],
                reinforcements: {
                    turn: 4,
                    units: [
                        {"type":"JAN_ZELIVSKY","col":10,"row":5},
                        {"type":"CEPNICI","col":10,"row":6},
                        {"type":"CEPNICI","col":11,"row":5},
                        {"type":"SUDLICNICI","col":11,"row":6}
                    ],
                    message: "Z Prahy přichází pomoc! Udržte opevnění a kryjte její postup."
                }
            },
            crusaders: {
                commander: "Heinrich z Isenburgu",
                units: [
                    {"type":"HEINRICH_ISENBURG","col":1,"row":3},
                    {"type":"TEZKY_RYTIR","col":0,"row":2},
                    {"type":"TEZKY_RYTIR","col":0,"row":3},
                    {"type":"TEZKY_RYTIR","col":0,"row":4},
                    {"type":"TEZKOODENCI","col":1,"row":2},
                    {"type":"TEZKOODENCI","col":1,"row":4},
                    {"type":"KUSNICI","col":2,"row":2},
                    {"type":"KUSNICI","col":2,"row":4},
                    {"type":"LEHKA_JIZDA","col":3,"row":5}
                ]
            }
        },

        phases: [
            {
                id: 1,
                name: "Útok na šíji",
                turnRange: [1,3],
                description: "Míšeňská a duryňská jízda se valí do úzkého hrdla šíje.",
                events: [
                    {
                        trigger: "turn_3",
                        message: "Útok se soustřeďuje na šíji. Posádka srubů drží úzký přístup; pražská pomoc je na cestě."
                    }
                ]
            },
            {
                id: 2,
                name: "Boj o sruby",
                turnRange: [4,6],
                description: "Křižáci pronikají k opevnění. Posily z Prahy jsou na cestě!",
                events: []
            },
            {
                id: 3,
                name: "Protiútok",
                turnRange: [7,8],
                description: "Husité vytlačují křižáky z kopce.",
                events: []
            }
        ],

        victoryConditions: {
            primary: {
                type: 'survive',
                turns: 8,
                minUnitsPercent: 30,
                description: 'Přežijte do kola 8 s alespoň 30% jednotek'
            },
            secondary: [
                { type: 'kill_commander', description: 'Zabijte nepřátelského velitele' }
            ]
        },

        debriefing: {
            victory: "Vítkov obstál! Obrana výšiny a příchod pomoci z Prahy zmařily v této partii nepřátelský útok. Historicky vítězství pomohlo uchovat spojení Prahy s okolím; samo ještě neukončilo obléhání ani válku.",
            defeat: "Sruby na Vítkově padly a s nimi i naděje Prahy. Křižáci obsadili strategickou výšinu a Praha je v obležení. Husitská revoluce končí dříve, než mohla rozvinout svou sílu."
        },

        maxTurns: 8,
        playerFaction: 'hussites'
    },

    // ==========================================
    // BITVA 2.5: VYŠEHRAD (1. listopadu 1420)
    // ==========================================
    vysehrad_1420: {
        id: 'vysehrad_1420',
        mapRevision: 2,
        name: 'Bitva pod Vyšehradem',
        date: '1. listopadu 1420',
        type: 'relief_battle',
        difficulty: 4,
        description: 'Rozhodující husitské vítězství. Zikmund přichází pozdě a česká šlechta je pobita v úvozu pod Podolím.',
        historicalSignificance: "Porážka královského vojska umožnila převzetí Vyšehradu a oslabila Zikmundovo postavení v Čechách.",
        aiDoctrine: { charge: 'reckless', pursueRouted: true, flankSeeking: true, fearThreshold: 20 },

        briefing: {
            hussites: "Obléháte Vyšehrad. Posádka slíbila kapitulaci, pokud jí do dohodnuté lhůty nepřijde pomoc. Lhůta uplynula a Zikmundovo vojsko se blíží k pankráckým pozicím. Braňte příkopy i západní bok od Podolí.",
            crusaders: "Musíte prorazit k Vyšehradu a zachránit posádku! Česká šlechta útočí od Podolí, hlavní voj čelně."
        },

        mapSize: { width: 30, height: 25 },

        terrain: {
            town: [
                [5,5],
                [5,6],
                [5,7],
                [6,5],
                [6,6],
                [6,7],
                [7,5],
                [7,6],
                [7,7],
                [8,5],
                [8,6],
                [8,7],
                [9,5],
                [9,6],
                [9,7],
                [6,8],
                [7,8],
                [8,8],
                [9,8]
            ],
            plains: "default",
            trenches: [
                [12,12],
                [13,12],
                [14,12],
                [15,12],
                [16,12],
                [17,12],
                [18,12],
                [12,13],
                [13,13],
                [14,13],
                [15,13],
                [16,13],
                [17,13],
                [18,13],
                [13,14],
                [14,14],
                [15,14],
                [16,14],
                [17,14]
            ],
            church: [
                [15,13]
            ],
            slope: [
                [6,18],
                [6,19],
                [6,20],
                [7,18],
                [7,19],
                [7,20],
                [8,18],
                [8,19],
                [8,20],
                [9,18],
                [9,19],
                [9,20],
                [10,18],
                [10,19],
                [10,20],
                [7,21],
                [8,21],
                [9,21],
                [10,21]
            ],
            mud: [
                [4,21],
                [5,21],
                [4,22],
                [5,22],
                [6,22],
                [4,23],
                [5,23],
                [6,23],
                [7,23]
            ],
            forest: [
                [14,3],
                [14,4],
                [15,3],
                [15,4],
                [16,3],
                [16,4],
                [17,3],
                [17,4],
                [18,3],
                [18,4],
                [19,3],
                [19,4],
                [20,3],
                [20,4]
            ],
            water: [
                [0,0],
                [0,1],
                [0,2],
                [0,3],
                [0,4],
                [0,5],
                [0,6],
                [0,7],
                [0,8],
                [0,9],
                [0,10],
                [0,11],
                [0,12],
                [0,13],
                [0,14],
                [0,15],
                [0,16],
                [0,17],
                [0,18],
                [0,19],
                [0,20],
                [0,21],
                [0,22],
                [0,23],
                [0,24],
                [1,0],
                [1,1],
                [1,2],
                [1,3],
                [1,4],
                [1,5],
                [1,6],
                [1,7],
                [1,8],
                [1,9],
                [1,10],
                [1,11],
                [1,12],
                [1,13],
                [1,14],
                [1,15],
                [1,16],
                [1,17],
                [1,18],
                [1,19],
                [1,20],
                [1,21],
                [1,22],
                [1,23],
                [1,24],
                [2,0],
                [2,1],
                [2,2],
                [2,3],
                [2,4],
                [2,5],
                [2,6],
                [2,7],
                [2,8],
                [2,9],
                [2,10],
                [2,11],
                [2,12],
                [2,13],
                [2,14],
                [2,15],
                [2,16],
                [2,17],
                [2,18],
                [2,19],
                [2,20],
                [2,21],
                [2,22],
                [2,23],
                [2,24],
                [3,0],
                [3,1],
                [3,2],
                [3,3],
                [3,4],
                [3,5],
                [3,6],
                [3,7],
                [3,8],
                [3,9],
                [3,10],
                [3,11],
                [4,2],
                [5,2],
                [6,2],
                [7,2],
                [8,2],
                [9,2],
                [10,2],
                [11,2],
                [12,2],
                [13,2],
                [14,2],
                [15,2],
                [16,2],
                [17,2],
                [18,2],
                [19,2],
                [20,2],
                [21,2],
                [22,2],
                [23,2],
                [24,2],
                [25,2],
                [26,2],
                [27,2],
                [28,2],
                [29,2]
            ],
            road: [
                [15,24],
                [15,23],
                [15,22],
                [15,21],
                [15,20],
                [15,19],
                [15,18],
                [15,17],
                [15,16],
                [15,15]
            ],
            hills: [
                [4,4],
                [5,4],
                [6,4],
                [7,4],
                [8,4],
                [9,4],
                [10,4],
                [10,5],
                [10,6],
                [10,7],
                [5,8],
                [5,9],
                [6,9],
                [7,9],
                [8,9],
                [9,9]
            ]
        },

        mapLabels: [
            {
                text: "Vyšehrad",
                hexes: [
                    [6,5],
                    [7,6],
                    [8,7]
                ],
                offset: [-0.5,0]
            },
            {
                text: "Pankrácká pláň",
                i18nKey: "pankracPlain",
                hexes: [
                    [13,12],
                    [15,12],
                    [17,12],
                    [15,14]
                ],
                offset: [0,-0.35]
            },
            {
                text: "Podolský svah",
                i18nKey: "podoliSlope",
                hexes: [
                    [7,18],
                    [8,19],
                    [9,20]
                ],
                offset: [0.65,0]
            },
            {
                text: "Vltava",
                i18nKey: "vltava",
                hexes: [
                    [1,9],
                    [1,13],
                    [1,17]
                ]
            },
            {
                text: "Botič",
                i18nKey: "botic",
                hexes: [
                    [14,2],
                    [20,2]
                ]
            }
        ],

        forces: {
            hussites: {
                commander: "Hynek Krušina z Lichtenburka",
                units: [
                    {"type":"HYNEK_KRUSINA","col":15,"row":13},
                    {"type":"CEPNICI","col":13,"row":12},
                    {"type":"CEPNICI","col":14,"row":12},
                    {"type":"CEPNICI","col":15,"row":12},
                    {"type":"CEPNICI","col":16,"row":12},
                    {"type":"CEPNICI","col":17,"row":12},
                    {"type":"SUDLICNICI","col":12,"row":13},
                    {"type":"SUDLICNICI","col":18,"row":13},
                    {"type":"KUSINICI_HUSITI","col":14,"row":13},
                    {"type":"KUSINICI_HUSITI","col":16,"row":13},
                    {"type":"KUSINICI_HUSITI","col":15,"row":14},
                    {"type":"CEPNICI","col":8,"row":16},
                    {"type":"SUDLICNICI","col":9,"row":16},
                    {"type":"CEPNICI","col":14,"row":14},
                    {"type":"SUDLICNICI","col":16,"row":14},
                    {"type":"CEPNICI","col":15,"row":15},
                    {"type":"JIZDA_HUSITI","col":12,"row":15},
                    {"type":"JIZDA_HUSITI","col":18,"row":15}
                ]
            },
            crusaders: {
                commander: "Zikmund Lucemburský",
                units: [
                    {"type":"ZIKMUND","col":15,"row":22},
                    {"type":"TEZKY_RYTIR","col":15,"row":21},
                    {"type":"LEHKA_JIZDA","col":14,"row":21},
                    {"type":"LEHKA_JIZDA","col":13,"row":21},
                    {"type":"LEHKA_JIZDA","col":17,"row":21},
                    {"type":"TEZKOODENCI","col":14,"row":22},
                    {"type":"TEZKOODENCI","col":16,"row":22},
                    {"type":"LEHKA_JIZDA","col":12,"row":20},
                    {"type":"LEHKA_JIZDA","col":18,"row":20},
                    {"type":"KOPINICI","col":14,"row":23},
                    {"type":"KOPINICI","col":15,"row":23},
                    {"type":"KOPINICI","col":16,"row":23},
                    {"type":"HALAPARTNICI","col":13,"row":22},
                    {"type":"HALAPARTNICI","col":17,"row":22},
                    {"type":"KUSNICI","col":14,"row":24},
                    {"type":"KUSNICI","col":16,"row":24},
                    {"type":"KUSNICI","col":13,"row":24},
                    {"type":"KUSNICI","col":17,"row":24},
                    {"type":"TEZKY_RYTIR","col":8,"row":20},
                    {"type":"TEZKY_RYTIR","col":9,"row":20},
                    {"type":"TEZKY_RYTIR","col":10,"row":21},
                    {"type":"TEZKOODENCI","col":10,"row":20},
                    {"type":"TEZKOODENCI","col":9,"row":21},
                    {"type":"JINDRICH_PLUMOV","col":7,"row":20}
                ]
            }
        },

        reinforcements: {
            orebska_zaloha: {
                turn: 7,
                faction: 'hussites',
                message: 'Hynek Krušina nasazuje orebské cepníky z rezervy!',
                units: [
                    { type: 'CEPNICI', col: 14, row: 15 },
                    { type: 'CEPNICI', col: 16, row: 15 },
                    { type: 'SUDLICNICI', col: 15, row: 16 }
                ]
            },
            vysehradske_oddily: {
                turn: 8,
                faction: 'hussites',
                message: 'Jednotky uvolněné z obléhání Vyšehradu se připojují k bitvě!',
                units: [
                    { type: 'JIZDA_HUSITI', col: 15, row: 18 },
                    { type: 'JIZDA_HUSITI', col: 20, row: 18 }
                ]
            }
        },

        phases: [
            {
                id: 1,
                name: "Po vypršení lhůty",
                turnRange: [1,2],
                description: "Dohodnutá lhůta pro pomoc posádce vypršela; královské vojsko teprve nastupuje do bitvy.",
                events: [
                    {"trigger":"turn_1","message":"Lhůta vypršela. Vyšehradská posádka se podle dohody nemá zapojit do boje."},
                    {"trigger":"turn_2","message":"Zikmund marně mává mečem směrem k Vyšehradu. Je pozdě."}
                ]
            },
            {
                id: 2,
                name: "Útok na pankrácká opevnění",
                turnRange: [3,4],
                description: "Uhři a Němci čelně útočí na husitské příkopy.",
                events: [
                    {
                        id: "trench_attack_msg",
                        trigger: "turn_3",
                        triggerBefore: "turn_5",
                        condition: {
                            type: "units_in_area",
                            faction: "crusaders",
                            area: {"minCol":10,"maxCol":20,"minRow":10,"maxRow":16},
                            minCount: 3
                        },
                        message: "Uhři a Němci zahajují čelní útok na vaše příkopy!"
                    },
                    {"trigger":"turn_3","type":"trench_bonus","text":"Připravené pozice poskytují +3 k obraně!"}
                ]
            },
            {
                id: 3,
                name: "Boční útok české šlechty",
                turnRange: [5,8],
                description: "Česká a moravská šlechta útočí od Podolí.",
                events: [
                    {
                        id: "plumov_warning",
                        trigger: "turn_4",
                        triggerBefore: "turn_7",
                        condition: {
                            type: "units_in_area",
                            faction: "crusaders",
                            area: {"minCol":4,"maxCol":10,"minRow":15,"maxRow":21},
                            minCount: 2
                        },
                        message: "Česká a moravská šlechta nastupuje od Podolí. Strmý přístup omezuje její jízdu."
                    },
                    {
                        id: "nobility_dismount_msg",
                        trigger: "turn_5",
                        triggerBefore: "turn_8",
                        condition: {
                            type: "units_in_area",
                            faction: "crusaders",
                            area: {"minCol":6,"maxCol":10,"minRow":18,"maxRow":23},
                            minCount: 2
                        },
                        message: "Uražená česká šlechta útočí! Musí sesednout kvůli strmému svahu."
                    },
                    {
                        id: "nobility_dismount_effect",
                        trigger: "turn_5",
                        triggerBefore: "turn_8",
                        condition: {
                            type: "units_in_area",
                            faction: "crusaders",
                            area: {"minCol":6,"maxCol":10,"minRow":18,"maxRow":23},
                            minCount: 2
                        },
                        type: "dismount",
                        faction: "crusaders",
                        text: "Česká šlechta ztrácí výhodu jízdy na strmém svahu!"
                    }
                ]
            },
            {
                id: 4,
                name: "Husitský protiútok",
                turnRange: [7,9],
                description: "Hynek Krušina nasazuje zálohy.",
                events: [
                    {"trigger":"turn_7","message":"„Běží nepřátelé!“ Orebští cepníci vyrážejí do protiútoku — zálohy jsou nasazeny."},
                    {"trigger":"turn_8","message":"Jednotky z obléhání Vyšehradu se připojují k bitvě!"}
                ]
            },
            {
                id: 5,
                name: "Masakr české šlechty",
                turnRange: [10,14],
                description: "Šlechta je uvězněna v úvozu a pobita.",
                events: [
                    {
                        id: "nobility_trapped",
                        trigger: "turn_9",
                        triggerBefore: "turn_14",
                        condition: {
                            "type":"units_routing",
                            "faction":"crusaders",
                            "minCount":2,
                            "area":{"minCol":6,"maxCol":10,"minRow":18,"maxRow":23}
                        },
                        message: "Česká šlechta uvízla v úvozu! Nemůže uniknout!"
                    },
                    {
                        id: "massacre_event",
                        trigger: "turn_10",
                        triggerBefore: "turn_14",
                        condition: {
                            "type":"units_routing",
                            "faction":"crusaders",
                            "minCount":3,
                            "area":{"minCol":6,"maxCol":10,"minRow":18,"maxRow":23}
                        },
                        type: "massacre",
                        faction: "crusaders",
                        text: "Táboři a orebité nebrali zajatce... Masakr v úvozu!"
                    }
                ]
            },
            {
                id: 6,
                name: "Všeobecný ústup",
                turnRange: [15,17],
                description: "Zikmund dává rozkaz k ústupu.",
                events: [
                    {
                        id: "retreat_order",
                        trigger: "turn_12",
                        triggerBefore: "turn_17",
                        condition: {"type":"faction_losses_percent","faction":"crusaders","percent":40},
                        message: "Zikmund dává rozkaz k ústupu! Královské vojsko prchá k Českému Brodu."
                    },
                    {
                        trigger: "turn_17",
                        message: "Bitva rozhoduje o osudu Vyšehradu. Ovládnutí celé Prahy však z jejího výsledku automaticky neplyne."
                    }
                ]
            }
        ],

        victoryConditions: {
            primary: {
                type: "hold_position",
                positions: [
                    [15,13]
                ],
                turns: 15,
                description: "Ubraňte kostel sv. Pankráce do kola 15"
            },
            secondary: [
                {"type":"destroy_percent","percent":50,"description":"Způsobte 50% ztrát královskému vojsku"},
                {"type":"kill_commander","description":"Vyřaďte nepřátelské velitele"}
            ]
        },

        specialMechanics: {
            capitulationAgreement: {
                description: 'Lhůta dohodnutá pro pomoc vyšehradské posádce vypršela',
                effect: 'no_vysehrad_sortie',
                note: 'Posádka do bitvy nezasáhne bez ohledu na průběh'
            },
            lateArrival: {
                description: 'Zikmund dorazil po vypršení dohodnuté lhůty',
                effect: 'no_pincer_movement'
            },
            terrainTrap: {
                description: 'Podolský svah - past pro těžkou jízdu',
                effect: 'cavalry_must_dismount',
                retreatBlocked: true,
                massacrePotential: true
            },
            noQuarterGiven: {
                description: 'Táboři a orebité nebrali zajatce',
                effect: 'routed_units_destroyed',
                exception: 'hussite_nobles_could_ransom',
                activeFromTurn: 10,
                requiresEvent: 'massacre_event',
                area: { minCol: 6, maxCol: 10, minRow: 18, maxRow: 23 }
            }
        },

        debriefing: {
            victory: "Vaše obrana pod Vyšehradem obstála. Historicky královské vojsko utrpělo těžkou porážku a Vyšehrad přešel do rukou husitů. Padla řada českých a moravských pánů včetně Jindřicha z Plumlova. Přesné součty ztrát jsou nejisté; Praha přitom ještě nebyla celá pod husitskou kontrolou.",
            defeat: "Zikmundovy síly prorazily k Vyšehradu včas. Posádka byla zachráněna a husité utrpěli těžké ztráty. Obléhání Prahy pokračuje a husitská věc je v ohrožení."
        },

        maxTurns: 17,
        playerFaction: 'hussites'
    },

    // ==========================================
    // BITVA: ŽATEC (10. září - 2. října 1421) - 2. křížová výprava
    // ==========================================
    zatec_1421: {
        id: 'zatec_1421',
        name: 'Obrana Žatce',
        date: "září – 2. října 1421",

        type: 'defensive_battle',
        difficulty: 3,
        description: "Křižácká výprava obléhá město nad Ohří. Udržte opevnění, dokud se útočící vojsko nestáhne.",
        historicalSignificance: 'Neúspěch u Žatce nalomil 2. křížovou výpravu - bez jediné polní bitvy se Žižkou.',
        aiDoctrine: { charge: 'reckless', pursueRouted: false, flankSeeking: false, fearThreshold: 35 },

        briefing: {
            hussites: 'Žatec - "pevnost Slunce" - obléhá obrovská křižácká výprava. Ohře vás chrání ze tří stran, útok jde jen na západní hradbu. Žádný slavný velitel zde není - drží celá obec, na šest tisíc obránců i lidu z okolí. Odrazte útoky, než výpravu zlomí hlad a spory knížat.',
            crusaders: 'Rozbijte žateckou hradbu děly a vezměte město. Erkinger vede útok. Padne-li Žatec, husitský severozápad je váš.'
        },

        mapSize: { width: 18, height: 11 },

        terrain: {
            // Město Žatec na ostrožně - hradby a zástavba (obrana)
            town: [
                [8,3],[9,3],[10,3],[11,3],[12,3],[13,3],[14,3],[15,3],
                [8,4],[9,4],[10,4],[11,4],[12,4],[13,4],[14,4],[15,4],
                [8,5],[9,5],[10,5],[11,5],[12,5],[13,5],[14,5],[15,5],
                [8,6],[9,6],[10,6],[11,6],[12,6],[13,6],[14,6],[15,6],
                [8,7],[9,7],[10,7],[11,7],[12,7],[13,7],[14,7],[15,7]
            ],
            // Řeka Ohře - obtéká ostrožnu ze tří stran (S, V, J), neprůchodná
            water: [
                [7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],
                [16,3],[16,4],[16,5],[16,6],[16,7],
                [7,8],[8,8],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],[16,8]
            ],
            // Glacis před západní hradbou - útočníci ho přecházejí pomalu pod palbou
            slope: [
                [6,3],[7,3],[6,4],[7,4],[6,5],[7,5],[6,6],[7,6],[6,7],[7,7]
            ],
            plains: 'default'
        },

        mapLabels: [
            { text: 'Ohře', hexes: [[8,2], [10,2], [12,2], [14,2]], offset: [0, -0.15] },
            { text: 'Západní hradba', i18nKey: 'westernWall', hexes: [[6,3], [6,5], [6,7]], offset: [-0.45, 0] },
            { text: 'Žatec', hexes: [[10,4], [12,5], [14,6]], offset: [0.35, 0] }
        ],

        forces: {
            hussites: {
                commander: 'Žatecký hejtman (jméno nedoloženo)',
                units: [
                    // Velitel obrany - bezejmenný žatecký hejtman, uvnitř města
                    { type: 'ZATECKY_HEJTMAN', col: 11, row: 5 },
                    // Západní hradba - hlavní obranná linie
                    { type: 'SUDLICNICI', col: 8, row: 3 },
                    { type: 'CEPNICI', col: 8, row: 4 },
                    { type: 'KUSINICI_HUSITI', col: 8, row: 5 },
                    { type: 'CEPNICI', col: 8, row: 6 },
                    { type: 'SUDLICNICI', col: 8, row: 7 },
                    // Druhá řada - dělo a palné zbraně (Žatec je měl)
                    { type: 'TARASNICE', col: 9, row: 4 },
                    { type: 'RUCNICARI', col: 9, row: 5 },
                    { type: 'KUSINICI_HUSITI', col: 9, row: 6 },
                    // Záloha
                    { type: 'CEPNICI', col: 10, row: 4 },
                    { type: 'KUSINICI_HUSITI', col: 10, row: 6 },
                    // Balanc: posílení obrany "pevnosti Slunce" (ratio bylo 0.46, neubránitelné)
                    { type: 'TARASNICE', col: 10, row: 5 },
                    { type: 'KUSINICI_HUSITI', col: 11, row: 6 }
                ]
            },
            crusaders: {
                commander: 'Erkinger ze Seinsheim',
                units: [
                    // VELITEL - Erkinger ze Seinsheim
                    { type: 'ERKINGER_SEINSHEIM', col: 2, row: 5 },
                    // Obléhací děla - bombardují hradbu
                    { type: 'HOUFNICE', col: 0, row: 4 },
                    { type: 'HOUFNICE', col: 0, row: 6 },
                    // Těžká jízda a pěchota - útok na hradby
                    { type: 'TEZKY_RYTIR', col: 1, row: 3 },
                    { type: 'TEZKY_RYTIR', col: 1, row: 4 },
                    { type: 'TEZKY_RYTIR', col: 1, row: 6 },
                    { type: 'TEZKY_RYTIR', col: 1, row: 7 },
                    { type: 'TEZKOODENCI', col: 2, row: 4 },
                    { type: 'TEZKOODENCI', col: 2, row: 6 },
                    { type: 'HALAPARTNICI', col: 3, row: 3 },
                    { type: 'HALAPARTNICI', col: 3, row: 7 },
                    { type: 'KOPINICI', col: 3, row: 4 },
                    { type: 'KOPINICI', col: 3, row: 6 },
                    { type: 'KUSNICI', col: 3, row: 5 }
                ]
            }
        },

        phases: [
            {
                id: 1,
                name: 'Obležení',
                turnRange: [1, 3],
                description: 'Křižáci obkličují Žatec a zahajují palbu z děl.',
                events: [
                    { trigger: 'turn_1', message: 'Křižácké vojsko obklíčilo Žatec. Děla pálí na hradby!' }
                ]
            },
            {
                id: 2,
                name: 'Šest útoků',
                turnRange: [4, 8],
                description: 'Erkinger žene pěchotu na hradby - jeden útok za druhým.',
                events: [
                    { trigger: 'turn_4', message: 'Erkinger zahajuje útok na západní hradbu! Držte linii!' },
                    { trigger: 'turn_6', type: 'morale_boost', faction: 'hussites', modifier: 12, title: 'Výpad z bran!', text: 'Žatečtí vyrazili z bran, pobili množství obléhatelů a stáhli se zpět za hradby. Obránci nabírají odvahu!' }
                ]
            },
            {
                id: 3,
                name: 'Požár ležení',
                turnRange: [8, 12],
                description: 'Křižácké ležení hoří, knížata se hádají, tábor svírá hlad.',
                events: [
                    { trigger: 'turn_8', type: 'panic', faction: 'crusaders', level: 2, title: 'Požár ležení!', text: 'Křižácké ležení vzplálo! Hlad, spory knížat a falešná zpráva o blížícím se pražském vojsku lámou výpravu.' }
                ]
            }
        ],

        victoryConditions: {
            primary: {
                type: 'survive',
                turns: 12,
                minUnitsPercent: 40,
                description: 'Udržte hradby do kola 12 s alespoň 40% obránců'
            },
            secondary: [
                { type: 'kill_commander', description: 'Zabijte Erkingera ze Seinsheim' }
            ]
        },

        debriefing: {
            victory: 'Žatec obstál! Šest útoků odraženo, ležení v plamenech - a na falešnou zprávu, že táhnou pražané, výprava 2. října prchá a Žatečtí ji ženou na útěku. Druhá křížová výprava se rozpadá, aniž stanula proti Žižkovi. "Pevnost Slunce" obhájila celá obec, beze jména jediného hrdiny - sláva města, ne muže.',
            defeat: 'Hradby Žatce padly. Křižáci vnikli do "pevnosti Slunce" a husitský severozápad leží otevřený. Druhá výprava slaví krvavý úspěch.'
        },

        maxTurns: 12,
        playerFaction: 'hussites'
    },

    // ==========================================
    // BITVA: KUTNÁ HORA (21.-22. prosince 1421)
    // ==========================================
    kutna_hora_1421: {
        id: 'kutna_hora_1421',
        mapRevision: 2,
        factionNames: { crusaders: 'Zikmundovo vojsko' },
        name: 'Bitva u Kutné Hory',
        date: "21.–22. prosince 1421",

        type: 'breakout_battle',
        difficulty: 4,
        description: 'Žižka obklíčen přesilou u Kutné Hory po zradě měšťanů. Musí v noci prorazit vozovou hradbou!',
        historicalSignificance: "Úspěšný průlom obklíčení přes Kaňk ukázal význam soudržnosti houfu, vozů a palebné podpory.",

        briefing: {
            hussites: "Královské vojsko získalo Kutnou Horu a hrozí vám obklíčení. Připravte průlom přes Kaňk na severozápad ke Kolínu. Kryjte ustupující oddíly vozy a palbou.",
            crusaders: "Husité jsou v pasti! Obklíčili jsme je před městem. Zničte Žižkovu vozovou hradbu dříve, než unikne!"
        },

        mapSize: {"width":16,"height":15},

        mapLabels: [
            {
                text: "Kutná Hora",
                hexes: [
                    [12,13],
                    [13,12],
                    [14,13],
                    [15,12],
                    [12,12],
                    [13,11],
                    [14,12],
                    [15,11],
                    [12,11],
                    [13,10],
                    [14,11],
                    [15,10]
                ]
            },
            {
                text: "Kaňk",
                hexes: [
                    [5,3],
                    [6,3],
                    [7,3],
                    [8,3]
                ],
                offset: [0,-0.65]
            }
        ],

        terrain: {
            town: [
                [12,13],
                [13,12],
                [14,13],
                [15,12],
                [12,12],
                [13,11],
                [14,12],
                [15,11],
                [12,11],
                [13,10],
                [14,11],
                [15,10]
            ],
            hills: [
                [5,3],
                [5,4],
                [6,3],
                [6,4],
                [7,3],
                [7,4],
                [8,3],
                [8,4]
            ],
            road: [
                [8,7],
                [7,5],
                [6,5],
                [5,3],
                [4,3],
                [3,1],
                [2,1],
                [12,10],
                [11,8],
                [10,8],
                [9,6]
            ],
            forest: [
                [0,14],
                [1,13],
                [2,14],
                [0,13],
                [1,12],
                [2,13],
                [0,12],
                [1,11],
                [0,4],
                [1,3],
                [0,3],
                [1,2],
                [2,3],
                [14,4],
                [15,3],
                [14,3],
                [15,2],
                [15,1]
            ],
            plains: "default"
        },

        forces: {
            hussites: {
                commander: "Jan Žižka z Trocnova",
                units: [
                    {"type":"JAN_ZIZKA","col":8,"row":8},
                    {"type":"VOZOVA_HRADBA","col":7,"row":8},
                    {"type":"VOZOVA_HRADBA","col":8,"row":9},
                    {"type":"VOZOVA_HRADBA","col":9,"row":8},
                    {"type":"VOZOVA_HRADBA","col":7,"row":7},
                    {"type":"VOZOVA_HRADBA","col":9,"row":7},
                    {"type":"VOZOVA_HRADBA","col":7,"row":6},
                    {"type":"VOZOVA_HRADBA","col":8,"row":7},
                    {"type":"VOZOVA_HRADBA","col":9,"row":6},
                    {"type":"CEPNICI","col":7,"row":5},
                    {"type":"CEPNICI","col":9,"row":5},
                    {"type":"SUDLICNICI","col":8,"row":6},
                    {"type":"RUCNICARI","col":7,"row":9},
                    {"type":"RUCNICARI","col":9,"row":9},
                    {"type":"KUSINICI_HUSITI","col":6,"row":9},
                    {"type":"KUSINICI_HUSITI","col":10,"row":9}
                ]
            },
            crusaders: {
                commander: "Zikmund Lucemburský",
                units: [
                    {"type":"ZIKMUND","col":13,"row":10},
                    {"type":"TEZKY_RYTIR","col":6,"row":12},
                    {"type":"TEZKY_RYTIR","col":7,"row":11},
                    {"type":"TEZKY_RYTIR","col":8,"row":12},
                    {"type":"TEZKY_RYTIR","col":9,"row":11},
                    {"type":"LEHKA_JIZDA","col":5,"row":10},
                    {"type":"LEHKA_JIZDA","col":10,"row":11},
                    {"type":"KOPINICI","col":11,"row":8},
                    {"type":"KOPINICI","col":11,"row":7},
                    {"type":"KOPINICI","col":11,"row":6},
                    {"type":"HALAPARTNICI","col":12,"row":8},
                    {"type":"TEZKY_RYTIR","col":4,"row":9},
                    {"type":"TEZKY_RYTIR","col":4,"row":7},
                    {"type":"LEHKA_JIZDA","col":5,"row":7},
                    {"type":"FILIPPO_SCOLARI","col":6,"row":4},
                    {"type":"KOPINICI","col":6,"row":5},
                    {"type":"KOPINICI","col":7,"row":4},
                    {"type":"KOPINICI","col":8,"row":5},
                    {"type":"LEHKA_JIZDA","col":5,"row":3},
                    {"type":"LEHKA_JIZDA","col":9,"row":3},
                    {"type":"KUSNICI","col":10,"row":10},
                    {"type":"KUSNICI","col":6,"row":10},
                    {"type":"KUSNICI","col":10,"row":6}
                ]
            }
        },

        phases: [
            {
                id: 1,
                name: "Obklíčení",
                turnRange: [1,2],
                description: "Kutnohorští zradili! Křižáci svírají husity ze všech stran.",
                events: [
                    {
                        trigger: "turn_1",
                        message: "Kutnohorští horníci otevřeli Kolínskou bránu! Křižáci proudí do města - jste v obklíčení!"
                    },
                    {"trigger":"turn_2","message":"Připravte průlom přes Kaňk. Cíl ústupu ke Kolínu leží na severozápadě mapy."},
                    {"trigger":"turn_1","message":"Sevření se stahuje. Udržte houf pohromadě a nenechte si uzavřít cestu ke Kaňku."}
                ]
            },
            {
                id: 2,
                name: "Noční průlom",
                turnRange: [3,5],
                description: "Vojsko připravuje průlom z obklíčení pod ochranou vozů a palby.",
                events: [
                    {"trigger":"turn_3","message":"K průlomu! Střelci kryjí postup, vozy drží houf pohromadě."},
                    {"trigger":"turn_4","message":"Křižáci v nočním zmatku nedokáží koordinovat obranu!"}
                ]
            },
            {
                id: 3,
                name: "Ke Kolínu",
                turnRange: [6,8],
                description: "Ústupová cesta vede přes Kaňk na severozápad ke Kolínu.",
                events: [
                    {
                        trigger: "turn_6",
                        message: "Pokračujte přes Kaňk na severozápad ke Kolínu. Dostaňte oddíly do vyznačené únikové zóny."
                    },
                    {"trigger":"turn_8","message":"Dokončete ústup. O bezpečí houfu rozhodne počet oddílů, které skutečně uniknou."}
                ]
            }
        ],

        victoryConditions: {
            primary: {
                type: "escape",
                escapeZone: [
                    [2,2],
                    [2,1],
                    [3,1],
                    [3,0]
                ],
                unitsRequired: 5,
                zoneLabel: "↖ Kolín",
                zoneLabelKey: "towardKolin",
                alternative: { type: 'eliminate_field_army', survivingCommander: 'JAN_ZIZKA' },
                description: "Probijte se z obklíčení ke Kolínu (alespoň 5 jednotek). Alternativa: do konce bitvy rozbijte nepřátelskou polní armádu a zachraňte Žižku."
            },
            secondary: [
                {"type":"survive_commander","description":"Žižka musí přežít"},
                {"type":"save_wagons","count":4,"description":"Zachraňte alespoň 4 vozy"}
            ]
        },

        specialMechanics: {
            betrayal: {
                description: 'Kutnohorští měšťané zradili husity',
                effect: 'city_hostile',
                note: 'Město je v rukou nepřítele od začátku'
            },
            nightBreakout: {
                description: 'Noční průlom - snížená viditelnost',
                effect: 'reduced_enemy_accuracy',
                note: 'Od tahu 3: křižáci mají -20% přesnost střelby'
            },
            mobileFirearms: {
                description: 'Střelba z jedoucích vozů',
                effect: 'wagons_can_shoot_after_move',
                note: 'Historicky první použití palných zbraní za pohybu'
            }
        },

        debriefing: {
            victory: "Průlom se podařil! Zachráněné oddíly se vydávají ke Kolínu. Historicky Žižka unikl z obklíčení a na začátku ledna 1422 se vrátil do protiútoku. Počty zachráněných vozů v této partii najdete ve výsledcích, nikoli v kronikářských součtech celého tažení.",
            defeat: "Průlom selhal. Vozová hradba byla rozbita a Žižkova armáda zničena. Kutná Hora zůstává v rukou nepřítele a husitské hnutí přichází o svého nejschopnějšího vojevůdce.",
            victoryVariants: {
                fieldArmyEliminated: "Místo historického ústupu ke Kolínu jste na bojišti rozdrtili Zikmundovu polní armádu. Žižka přežil a důvod k průlomu zanikl. Je to alternativní vítězství: výsledek se od doloženého průběhu bitvy vědomě odchyluje."
            }
        },

        maxTurns: 8,
        playerFaction: 'hussites'
    },

    // ==========================================
    // BITVA: NĚMECKÝ BROD (8.-10. ledna 1422)
    // ==========================================
    nemecky_brod_1422: {
        id: 'nemecky_brod_1422',
        mapRevision: 2,
        factionNames: { crusaders: 'Zikmundovo vojsko' },
        name: 'Bitva u Německého Brodu',
        date: "8.–10. ledna 1422",

        type: 'pursuit_battle',
        difficulty: 2,
        description: 'Pronásledování ustupujícího Zikmundova vojska od Kutné Hory. Led na Sázavě se propadá pod těžkými vozy.',
        historicalSignificance: "Vyvrcholení zimního tažení: porážka ustupujícího vojska a zpustošení města. Součty ztrát a kořisti jsou nejisté.",

        briefing: {
            hussites: "Po ústupu od Kutné Hory a střetu u Habrů pronásledujete královské vojsko k Německému Brodu. Obsaďte městský přístup k mostu dříve, než nepřítel unikne přes Sázavu k Jihlavě. Led na řece představuje riskantní cestu.",
            crusaders: "Ustupujete od Habrů přes Německý Brod. Město leží před řekou: pokračujte přes Sázavu směrem k Jihlavě. Most je úzkým hrdlem; cesta po ledu je nebezpečná."
        },

        mapSize: { width: 16, height: 16 },

        mapLabels: [
            {
                text: "Německý Brod",
                hexes: [
                    [7,9],
                    [7,10],
                    [7,11],
                    [8,9],
                    [8,10],
                    [8,11],
                    [9,9],
                    [9,10],
                    [9,11]
                ],
                offset: [3,-1.5]
            },
            {
                text: "Sázava",
                hexes: [
                    [0,12],
                    [1,12],
                    [2,12],
                    [3,12],
                    [4,12],
                    [5,12],
                    [6,12],
                    [7,12],
                    [8,12],
                    [9,12],
                    [10,12],
                    [11,12],
                    [12,12],
                    [13,12],
                    [14,12],
                    [15,12]
                ]
            },
            {
                text: "Od Habrů",
                i18nKey: "fromHabry",
                hexes: [
                    [8,0],
                    [8,1]
                ],
                offset: [3,0]
            },
            {
                text: "K Jihlavě",
                i18nKey: "towardJihlava",
                hexes: [
                    [8,14],
                    [8,15]
                ],
                offset: [2,0]
            }
        ],

        terrain: {
            hills: [
                [3,1],
                [4,1],
                [5,1],
                [3,2],
                [4,2],
                [5,2]
            ],
            water: [
                [0,12],
                [1,12],
                [2,12],
                [3,12],
                [4,12],
                [5,12],
                [6,12],
                [7,12],
                [9,12],
                [10,12],
                [11,12],
                [12,12],
                [13,12],
                [14,12],
                [15,12]
            ],
            road: [
                [8,11],
                [8,12],
                [8,13],
                [8,0],
                [8,1],
                [8,2],
                [8,3],
                [8,4],
                [8,5],
                [8,6],
                [8,7],
                [8,8],
                [8,9],
                [8,10],
                [8,14],
                [8,15]
            ],
            forest: [
                [5,3],
                [6,3],
                [7,3],
                [9,3],
                [10,3],
                [11,3],
                [5,4],
                [6,4],
                [10,4],
                [11,4],
                [0,5],
                [1,5],
                [13,5],
                [14,5],
                [15,5],
                [13,6],
                [14,6]
            ],
            town: [
                [7,9],
                [7,10],
                [7,11],
                [8,9],
                [8,10],
                [8,11],
                [9,9],
                [9,10],
                [9,11]
            ],
            plains: "default"
        },

        forces: {
            hussites: {
                commander: 'Jan Žižka z Trocnova',
                units: [
                    // VELITEL - Žižka (již slepý na obě oči) - přichází ze severu
                    { type: 'JAN_ZIZKA', col: 8, row: 1 },
                    // Vozová hradba - hlavní síla
                    { type: 'VOZOVA_HRADBA', col: 7, row: 2 },
                    { type: 'VOZOVA_HRADBA', col: 8, row: 2 },
                    { type: 'VOZOVA_HRADBA', col: 9, row: 2 },
                    // Táborité - pěchota
                    { type: 'CEPNICI', col: 6, row: 3 },
                    { type: 'CEPNICI', col: 7, row: 3 },
                    { type: 'CEPNICI', col: 9, row: 3 },
                    { type: 'CEPNICI', col: 10, row: 3 },
                    { type: 'SUDLICNICI', col: 6, row: 4 },
                    { type: 'SUDLICNICI', col: 10, row: 4 },
                    // Střelci
                    { type: 'KUSINICI_HUSITI', col: 7, row: 4 },
                    { type: 'KUSINICI_HUSITI', col: 9, row: 4 },
                    { type: 'RUCNICARI', col: 8, row: 3 },
                    // Jízda - pronásledování (křídla)
                    { type: 'JIZDA_HUSITI', col: 4, row: 2 },
                    { type: 'JIZDA_HUSITI', col: 12, row: 2 }
                ]
            },
            crusaders: {
                commander: 'Filippo Scolari',
                units: [
                    // VELITEL - Scolari (velí ústupu, blíž k řece)
                    { type: 'FILIPPO_SCOLARI', col: 8, row: 9 },
                    // Uherská jízda - prchá k řece
                    { type: 'TEZKY_RYTIR', col: 7, row: 10 },
                    { type: 'TEZKY_RYTIR', col: 8, row: 10 },
                    { type: 'TEZKY_RYTIR', col: 9, row: 10 },
                    { type: 'LEHKA_JIZDA', col: 6, row: 9 },
                    { type: 'LEHKA_JIZDA', col: 10, row: 9 },
                    // Německá pěchota - zadní voj (blíž k husitům)
                    { type: 'KOPINICI', col: 7, row: 6 },
                    { type: 'KOPINICI', col: 8, row: 6 },
                    { type: 'KOPINICI', col: 9, row: 6 },
                    { type: 'HALAPARTNICI', col: 7, row: 7 },
                    { type: 'HALAPARTNICI', col: 9, row: 7 },
                    // Střelci - krytí ústupu
                    { type: 'KUSNICI', col: 8, row: 7 },
                    { type: 'KUSNICI', col: 10, row: 8 },
                    // Těžkoodění - stráž u mostu
                    { type: 'TEZKOODENCI', col: 7, row: 11 },
                    { type: 'TEZKOODENCI', col: 9, row: 11 }
                ]
            }
        },

        phases: [
            {
                id: 1,
                name: "Pronásledování od Kutné Hory",
                turnRange: [1,3],
                description: "Žižkovo vojsko pronásleduje ustupující křižáky.",
                events: [
                    {"trigger":"turn_1","message":"Zikmund uprchl! Scolariho vojsko ustupuje k Německému Brodu. Pronásledujte je!"},
                    {"trigger":"turn_2","message":"Křižáci zanechávají kořist po cestě. Nedejte se rozptýlit - ničte vojsko!"}
                ]
            },
            {
                id: 2,
                name: "Zadní voj před Brodem",
                turnRange: [4,6],
                description: "Po dřívějším střetu u Habrů kryje zadní voj přístup do Německého Brodu.",
                events: [
                    {"trigger":"turn_4","message":"Zadní voj se staví do cesty před Brodem. Prorazte k městu a mostu."},
                    {"trigger":"turn_5","message":"Křižáci neudrží pozice - začínají prchat k řece!"}
                ]
            },
            {
                id: 3,
                name: "Útěk přes Sázavu",
                turnRange: [7,9],
                description: "Panikařící vojsko se valí k mostu a na zamrzlou řeku.",
                events: [
                    {"trigger":"turn_7","message":"Most je přeplněný! Část vojska se pokouší přejít přes zamrzlou Sázavu!"},
                    {"trigger":"turn_8","message":"Led praská pod těžkými vozy! Řeka pohlcuje prchající!"}
                ]
            },
            {
                id: 4,
                name: "Zničení ustupujícího vojska",
                turnRange: [10,12],
                description: "Husité dobíjejí zbytky královského vojska.",
                events: [
                    {"trigger":"turn_10","message":"Královské vojsko je rozprášeno! Sbírejte kořist a dobijte zbytky odporu."},
                    {
                        trigger: "turn_12",
                        message: "Ústupová cesta vede přes řeku k Jihlavě. Vítězství závisí na splnění cíle této bitvy."
                    }
                ]
            }
        ],

        victoryConditions: {
            primary: {
                type: "breakthrough",
                positions: [
                    [7,11],
                    [8,11],
                    [9,11]
                ],
                count: 1,
                deadline: 9,
                zoneLabel: "↓ Brod",
                zoneLabelKey: "towardBrod",
                description: "Obsaďte městský přístup k mostu do kola 9, než vojsko unikne přes Sázavu"
            },
            secondary: [
                {"type":"kill_commander","target":"FILIPPO_SCOLARI","description":"Porazte Filippo Scolariho"},
                {"type":"fast_victory","maxTurns":10,"description":"Zvítězte do 10. kola"}
            ]
        },

        specialMechanics: {
            frozenRiver: {
                description: 'Zamrzlá Sázava - tenký led',
                effect: 'heavy_units_drown',
                note: 'Těžké jednotky (rytíři, vozy) riskují propadnutí při přechodu řeky'
            },
            pursuit: {
                description: 'Pronásledování - křižáci ustupují',
                effect: 'enemy_retreating',
                note: 'AI křižáků se snaží utéct přes řeku, ne bojovat'
            },
            bridgeBottleneck: {
                description: 'Most je úzký - jen 1 jednotka za tah',
                effect: 'bridge_limit',
                position: [8, 12]
            }
        },

        debriefing: {
            victory: "Dostihli jste ustupující vojsko u Brodu. Historicky následovalo dobytí a zpustošení města; ztráty v bitvě, při útěku a při násilí po dobytí nelze zaměňovat. Zprávy o propadajícím se ledu a množství kořisti je třeba číst s opatrností, ne jako přesné počítadlo této partie.",
            defeat: "Zikmund unikl! Většina jeho vojska překročila Sázavu a spálila most za sebou. Kořist je minimální a příští křížová výprava přijde mnohem dříve."
        },

        maxTurns: 12,
        playerFaction: 'hussites'
    },

    // ==========================================
    // BITVA: MOST (5. srpna 1421)
    // ==========================================
    most_1421: {
        id: 'most_1421',
        name: 'Bitva u Mostu',
        date: '5. srpna 1421',
        type: 'dual_objective_battle',
        difficulty: 4,
        description: "Pražské vojsko obléhá Most a Hněvín. Příchod protivníkových posil ohrožuje jeho postavení.",
        historicalSignificance: "Významná porážka pražského svazu. Neprokazuje, že bez Žižky či vozové hradby nemohli husité vítězit.",

        briefing: {
            hussites: 'Hrad Hněvín je téměř náš! Posádka nabídla kapitulaci, ale Želivský ji odmítl. Máš dva cíle: dobýt hrad NEBO zablokovat městskou bránu, odkud může přijít posila. Na obojí nemáš dost mužů - rozhodni se!',
            crusaders: 'Držte hrad za každou cenu! Posily markraběte Fridricha jsou na cestě. Mostečtí vyrazí z brány a udeří husitům do boku.'
        },

        mapSize: { width: 18, height: 16 },

        mapLabels: [
            { text: 'Hrad Hněvín', i18nKey: 'hnevinCastle', hexes: [[8,0],[9,0],[10,0],[8,1],[9,1],[10,1]] },
            { text: 'Most', hexes: [[7,13],[8,13],[9,13],[10,13],[7,14],[8,14],[9,14],[10,14],[8,15],[9,15]] },
            { text: 'Klášter', i18nKey: 'monastery', hexes: [[8,7],[9,7]] }
        ],

        terrain: {
            // Hrad Hněvín (sever) + Město Most (jih)
            town: [
                // Hrad Hněvín
                [8,0], [9,0], [10,0],
                [8,1], [9,1], [10,1],
                // Město Most
                [7,13], [8,13], [9,13], [10,13],
                [7,14], [8,14], [9,14], [10,14],
                [8,15], [9,15]
            ],
            // Svahy kopce
            hills: [
                [7,1], [11,1],
                [6,2], [7,2], [8,2], [9,2], [10,2], [11,2], [12,2],
                [6,3], [7,3], [8,3], [9,3], [10,3], [11,3], [12,3],
                [7,4], [8,4], [9,4], [10,4], [11,4]
            ],
            // Klášter - husitský tábor
            church: [
                [8,7], [9,7]
            ],
            // Cesta od brány (končí před městem)
            road: [
                [9,10], [9,11], [9,12]
            ],
            // Lesy po stranách
            forest: [
                [0,4], [1,4], [2,4],
                [0,5], [1,5], [2,5],
                [15,4], [16,4], [17,4],
                [15,5], [16,5], [17,5],
                [0,10], [1,10],
                [16,10], [17,10]
            ],
            plains: 'default'
        },

        forces: {
            hussites: {
                commander: 'Jan Želivský',
                units: [
                    // VELITEL - Želivský (u kláštera)
                    { type: 'JAN_ZELIVSKY', col: 9, row: 6 },
                    // Pěchota - připravena k útoku na hrad
                    { type: 'CEPNICI', col: 8, row: 5 },
                    { type: 'CEPNICI', col: 9, row: 5 },
                    { type: 'CEPNICI', col: 10, row: 5 },
                    { type: 'SUDLICNICI', col: 7, row: 5 },
                    { type: 'SUDLICNICI', col: 11, row: 5 },
                    { type: 'SUDLICNICI', col: 9, row: 4 },
                    // Střelci
                    { type: 'KUSINICI_HUSITI', col: 7, row: 6 },
                    { type: 'KUSINICI_HUSITI', col: 11, row: 6 },
                    { type: 'RUCNICARI', col: 8, row: 6 },
                    { type: 'RUCNICARI', col: 10, row: 6 },
                    // Obléhací zařízení
                    { type: 'HOUFNICE', col: 9, row: 7 },
                    // Vozy (málo užitečné na svahu)
                    { type: 'VOZOVA_HRADBA', col: 8, row: 8 },
                    { type: 'VOZOVA_HRADBA', col: 10, row: 8 }
                ]
            },
            crusaders: {
                commander: 'Fridrich IV. Bojovný',
                units: [
                    // HRADNÍ POSÁDKA (na hradě)
                    { type: 'KOPINICI', col: 8, row: 1 },
                    { type: 'KOPINICI', col: 10, row: 1 },
                    { type: 'KUSNICI', col: 9, row: 0 },
                    { type: 'KUSNICI', col: 9, row: 1 },
                    // MOSTECKÁ POSÁDKA (ve městě - vyjde v tahu 3)
                    // Přidány jako reinforcements
                ]
            }
        },

        reinforcements: {
            // Mostecká posádka - boční úder
            mostecka_posadka: {
                turn: 3,
                faction: 'crusaders',
                message: 'Mostecká hotovost vyráží z městské brány!',
                units: [
                    { type: 'KOPINICI', col: 9, row: 12 },
                    { type: 'KOPINICI', col: 8, row: 12 },
                    { type: 'KOPINICI', col: 10, row: 12 },
                    { type: 'TEZKY_RYTIR', col: 9, row: 13 }
                ]
            },
            // Míšeňská armáda - hlavní posily
            misenska_armada: {
                turn: 5,
                faction: 'crusaders',
                message: 'Míšeňská armáda markraběte Fridricha přichází ze severu!',
                units: [
                    { type: 'FRIDRICH_MISNENSKY', col: 9, row: 0 },
                    { type: 'TEZKY_RYTIR', col: 7, row: 0 },
                    { type: 'TEZKY_RYTIR', col: 8, row: 0 },
                    { type: 'TEZKY_RYTIR', col: 10, row: 0 },
                    { type: 'KOPINICI', col: 11, row: 0 },
                    { type: 'KOPINICI', col: 6, row: 0 },
                    { type: 'KOPINICI', col: 12, row: 0 },
                    { type: 'KUSNICI', col: 7, row: 1 },
                    { type: 'KUSNICI', col: 11, row: 1 }
                ]
            }
        },

        phases: [
            {
                id: 1,
                name: 'Obléhání',
                turnRange: [1, 2],
                description: 'Hrad Hněvín je na dosah. Posádka nabídla kapitulaci, ale Želivský odmítl.',
                events: [
                    { trigger: 'turn_1', message: 'Želivský: "Žádná milost pro zrádce! Dobyjeme hrad silou!"' },
                    { trigger: 'turn_2', message: 'Hradní posádka se houževnatě brání. Z města se ozývá ruch...' }
                ]
            },
            {
                id: 2,
                name: 'Boční úder',
                turnRange: [3, 4],
                description: 'Mostečtí vyrazili z brány! Úder do boku husitského vojska.',
                events: [
                    { trigger: 'turn_3', message: 'Z městské brány vyráží mostecká hotovost! Úder do boku!' },
                    { trigger: 'turn_4', message: 'Musíte se rozhodnout - pokračovat v útoku na hrad, nebo se otočit?' }
                ]
            },
            {
                id: 3,
                name: 'Příchod posil',
                turnRange: [5, 7],
                description: 'Míšeňská armáda! Markrabě Fridrich přichází ze severu!',
                events: [
                    { trigger: 'turn_5', message: 'Na obzoru míšeňské prapory! Markrabě Fridrich přichází s posilami!' },
                    { trigger: 'turn_6', message: 'Útok na hrad je nyní velmi riskantní. Zvažte alternativní cíl.' },
                    { trigger: 'turn_5', message: 'Zásah koně husitského praporečníka rozvrací šik - a s příchodem míšeňských posil se mezi husity šíří strach.' }
                ]
            },
            {
                id: 4,
                name: 'Rozhodnutí',
                turnRange: [8, 10],
                description: 'Splňte alespoň jeden cíl, nebo čelíte porážce.',
                events: [
                    { trigger: 'turn_8', message: 'Čas se krátí! Držte bránu, nebo dobyjte hrad!' },
                    { trigger: 'turn_10', message: 'Poslední šance! Buď splníte cíl, nebo je vše ztraceno.' }
                ]
            }
        ],

        victoryConditions: {
            primary: {
                type: 'dual_objective',
                description: 'Splň JEDEN z cílů: Dobij hrad Hněvín NEBO udrž městskou bránu zablokovanou',
                objectives: [
                    {
                        id: 'capture_castle',
                        type: 'capture_position',
                        positions: [[9,0], [9,1]],
                        holdTurns: 2,
                        description: 'Dobij a udrž hrad Hněvín (2 kola)'
                    },
                    {
                        id: 'block_gate',
                        type: 'capture_position',
                        positions: [[9,12]],
                        // Brána je 5 hexů od nejbližší jednotky (pohyb 2) - obsadit ji lze
                        // nejdřív v kole 3, při maxTurns 10 je tedy strop držení 8 kol
                        holdTurns: 6,
                        description: 'Zablokuj městskou bránu a udrž 6 kol'
                    }
                ]
            },
            secondary: [
                { type: 'both_objectives', description: 'Splň OBA cíle' },
                { type: 'survive_commander', description: 'Želivský přežije' },
                { type: 'protect_artillery', description: 'Zachraň houfnici' },
                { type: 'max_losses', maxLosses: 5, description: 'Méně než 5 ztracených jednotek' }
            ]
        },

        specialMechanics: {
            weakCommander: {
                description: 'Želivský je kněz, ne voják',
                effect: 'reduced_aura',
                note: 'Menší velitelská aura, žádné bojové bonusy'
            },
            flanking: {
                description: 'Boční úder z města',
                effect: 'reinforcements_from_south',
                note: 'V tahu 3 vyrazí mostecká posádka z brány'
            },
            dualObjective: {
                description: 'Dva cíle - stačí splnit jeden',
                effect: 'alternative_victory',
                note: 'Dobij hrad NEBO zablokuj bránu'
            }
        },

        debriefing: {
            victory: 'Hrad Hněvín je váš! Kombinace dobývání hradu a blokování městské brány se vyplatila. Most je pod husitskou kontrolou a cesta do Saska otevřena pro budoucí spanilé jízdy.',
            defeat: 'Mostečtí měšťané a posádka hradu udrželi své pozice. Husitský útok selhal a vojsko musí ustoupit. Severozápadní Čechy zůstávají v rukou nepřítele.'
        },

        maxTurns: 10,
        playerFaction: 'hussites'
    },

    // ==========================================
    // BITVA 3: ÚSTÍ NAD LABEM (16. června 1426)
    // ==========================================
    usti_1426: {
        id: 'usti_1426',
        factionNames: { crusaders: 'Sasové a Míšeňané' },
        name: 'Bitva u Ústí nad Labem',
        date: '16. června 1426',
        type: 'field_battle',
        difficulty: 2,
        description: "Spojená husitská vojska brání vozové postavení na Běhání proti vojsku přicházejícímu na pomoc Ústí.",
        historicalSignificance: "Výrazné vítězství husitských svazů. Kronikářské údaje o nepatrných vlastních a obrovských nepřátelských ztrátách vyžadují kritické čtení.",

        briefing: {
            hussites: 'Postavte dvojitou vozovou hradbu na návrší Na Běhání. Nechte nepřítele přijít k vám a zničte ho palbou. Před bojem si obě strany slíbily nikoho nešetřit.',
            crusaders: 'Prorazte husitské opevnění a osvoboďte obležené Ústí nad Labem. Vrchní velení má kondotiér Boso z Vitzthumu.'
        },

        mapSize: { width: 22, height: 14 },

        terrain: {
            // Návrší Na Běhání (kóta 212)
            hills: [
                [14,4], [15,4], [16,4], [17,4], [18,4],
                [14,5], [15,5], [16,5], [17,5], [18,5],
                [14,6], [15,6], [16,6], [17,6], [18,6],
                [15,7], [16,7], [17,7]
            ],
            // Chabařovický potok pod svahem (po bitvě prý celý rudý krví)
            water: [
                [10,3], [11,4], [12,5], [11,6], [10,7]
            ],
            // Cesta od Chabařovic
            road: [
                [0,5], [1,5], [2,5], [3,5], [4,5], [5,5]
            ],
            plains: 'default'
        },

        mapLabels: [
            { text: 'Na Běhání', hexes: [[14,4], [16,5], [18,6]] },
            { text: 'Ústí nad Labem', hexes: [[20,5], [21,5], [20,6], [21,6]], offset: [-0.25, 0] }
        ],

        forces: {
            hussites: {
                commander: 'Prokop Holý',
                units: [
                    // VELITEL - Prokop Holý
                    { type: 'PROKOP_HOLY', col: 17, row: 5 },
                    // Dvojitá vozová hradba - vnější linie (první pás)
                    { type: 'VOZOVA_HRADBA', col: 14, row: 4 },
                    { type: 'VOZOVA_HRADBA', col: 14, row: 5 },
                    { type: 'VOZOVA_HRADBA', col: 14, row: 6 },
                    // Vnitřní linie (druhý pás)
                    { type: 'VOZOVA_HRADBA', col: 16, row: 4 },
                    { type: 'VOZOVA_HRADBA', col: 16, row: 5 },
                    { type: 'VOZOVA_HRADBA', col: 16, row: 6 },
                    // Pěchota mezi vozy
                    { type: 'CEPNICI', col: 15, row: 4 },
                    { type: 'CEPNICI', col: 15, row: 6 },
                    { type: 'SUDLICNICI', col: 15, row: 5 },
                    // Střelci za vnitřní linií
                    { type: 'KUSINICI_HUSITI', col: 17, row: 4 },
                    { type: 'KUSINICI_HUSITI', col: 17, row: 6 },
                    { type: 'RUCNICARI', col: 18, row: 5 },
                    // Dělostřelectvo - houfnice a tarasnice
                    { type: 'HOUFNICE', col: 18, row: 4 },
                    { type: 'TARASNICE', col: 17, row: 7 },
                    { type: 'TARASNICE', col: 18, row: 6 },
                    // Jízda - křídla a těžké družiny husitské šlechty
                    { type: 'JIZDA_HUSITI', col: 13, row: 5 },
                    { type: 'JIZDA_HUSITI', col: 13, row: 7 },
                    { type: 'SLECHTICKA_JIZDA_HUSITI', col: 13, row: 3 },
                    { type: 'SLECHTICKA_JIZDA_HUSITI', col: 13, row: 8 }
                ]
            },
            crusaders: {
                commander: 'Boso z Vitzthumu',
                units: [
                    // VELITEL - kondotiér Boso z Vitzthumu (vrchní polní velení, padl). Fridrich Bojovný výpravu zorganizoval, ale bitvy se neúčastnil.
                    { type: 'BOSO_VITZTHUM', col: 2, row: 5 },
                    // Saská a míšeňská jízda - hlavní útočná síla
                    { type: 'TEZKY_RYTIR', col: 3, row: 4 },
                    { type: 'TEZKY_RYTIR', col: 3, row: 5 },
                    { type: 'TEZKY_RYTIR', col: 3, row: 6 },
                    { type: 'TEZKOODENCI', col: 4, row: 4 },
                    { type: 'TEZKOODENCI', col: 4, row: 6 },
                    // Pěchota
                    { type: 'HALAPARTNICI', col: 1, row: 4 },
                    { type: 'HALAPARTNICI', col: 1, row: 6 },
                    { type: 'KOPINICI', col: 0, row: 4 },
                    { type: 'KOPINICI', col: 0, row: 6 },
                    // Střelci
                    { type: 'KUSNICI', col: 2, row: 3 },
                    { type: 'KUSNICI', col: 2, row: 7 },
                    { type: 'LUCISTNICI', col: 1, row: 3 },
                    { type: 'LUCISTNICI', col: 1, row: 7 },
                    // Lehká jízda
                    { type: 'LEHKA_JIZDA', col: 5, row: 5 }
                ]
            }
        },

        phases: [
            {
                id: 1,
                name: 'Křižácký útok',
                turnRange: [1, 4],
                description: 'Němci útočí v parném vedru.',
                events: [
                    { trigger: 'turn_1', message: 'Smírný list odmítnut! Němci pyšně vzkázali, že "nikoho neživit nebudou a všechny pobijí" - Češi se proto zavázali stejným slibem. Pardon nedá nikdo.' },
                    { trigger: 'turn_2', message: 'Saské a míšeňské jezdectvo útočí do svahu v nesnesitelném červnovém vedru!' }
                ]
            },
            {
                id: 2,
                name: 'Palba z vozů',
                turnRange: [5, 8],
                description: 'Husitské palné zbraně decimují útočníky.',
                events: []
            },
            {
                id: 3,
                name: 'Panika a útěk',
                turnRange: [9, 12],
                description: 'Křižáci se dávají na bezhlavý útěk.',
                events: [
                    { trigger: 'turn_9', message: '"Běží! Němci běží!" - křižáci prchají!' },
                    { trigger: 'turn_11', message: 'Pod německou korouhví pokleklo 24 hrabat a korouhevních pánů s meči zabodnutými do země a prosili o milost - pro slib daný před bojem jsou ale do jednoho pobiti.' }
                ]
            }
        ],

        victoryConditions: {
            primary: {
                type: 'destroy_percent',
                percent: 50,
                description: 'Udržte vozovou hradbu a zničte 50% křižáků'
            },
            secondary: [
                { type: 'destroy_percent', percent: 75, description: 'Zničte 75% nepřátel (historický výsledek)' }
            ]
        },

        specialMechanics: {
            noQuarterGiven: {
                description: 'Obě strany si před bojem slíbily nikoho nešetřit',
                effect: 'routed_units_destroyed',
                exception: 'pážata a štítonoši, kteří se boje nezúčastnili, byli ušetřeni'
            }
        },

        debriefing: {
            victory: 'Masakr Na Běhání! Podle Starých letopisů padlo Čechů jen 19 - a nikdo významný kromě měšťana Jana Bradatého; německé ztráty kroniky kladou na tisíce, až k 15 000. Dvojitá vozová hradba se ukázala jako nepřekonatelná překážka. Vítězství ale neslo i temný stín: 24 klečících hrabat a korouhevních pánů, kteří prosili o milost, bylo pro vzájemný slib nešetřit nikoho do jednoho pobito. Pověst o české nepřemožitelnosti je na světě — a s ní nebezpečná víra, že vítězům je dovoleno vše.',
            defeat: 'Saská jízda prorazila vaši hradbu! Katastrofální porážka husitů mění rovnováhu sil. Bez vozové hradby jste bezbranní proti těžké jízdě.'
        },

        maxTurns: 12,
        playerFaction: 'hussites'
    },

    // ==========================================
    // BITVA: TACHOV (3.-4. srpna 1427)
    // ==========================================
    tachov_1427: {
        id: 'tachov_1427',
        name: 'Bitva u Tachova',
        date: "3.–4. srpna 1427",

        type: 'pursuit_battle',
        difficulty: 1,
        description: "Výprava roku 1427 se rozpadá při husitském postupu k Tachovu. Pronásledujte ustupující oddíly.",
        historicalSignificance: "Neúspěch další výpravy proti husitům. Ústup polního vojska předcházel samostatnému dobývání Tachova a hradu.",
        aiDoctrine: { charge: 'cautious', pursueRouted: false, flankSeeking: false, fearThreshold: 50 },

        briefing: {
            hussites: 'Křižáci neúspěšně obléhali Stříbro a nyní se stahují k Tachovu. Přibližte se rychle a využijte jejich demoralizace. Pronásledujte prchající a zajměte Tachov!',
            crusaders: 'Husité se blíží! Vaše vojsko je demoralizované po neúspěšném obléhání Stříbra. Pokuste se zorganizovat obranu, nebo ustupte k bavorským hranicím.'
        },

        mapSize: { width: 22, height: 14 },

        terrain: {
            // Město Tachov
            town: [
                [16,5], [17,5], [16,6], [17,6]
            ],
            // Vrch u Tachova (pozice křižáckého velení)
            hills: [
                [18,4], [19,4], [18,5], [19,5]
            ],
            // Šumavské hvozdy směrem k Bavorsku
            forest: [
                [19,0], [20,0], [21,0],
                [19,1], [20,1], [21,1],
                [20,2], [21,2],
                [19,11], [20,11], [21,11],
                [19,12], [20,12], [21,12],
                [20,13], [21,13]
            ],
            // Cesta od Stříbra (západ)
            road: [
                [0,6], [1,6], [2,6], [3,6], [4,6], [5,6], [6,6], [7,6], [8,6], [9,6], [10,6], [11,6], [12,6]
            ],
            // Cesta k Bavorsku (východ) - úniková trasa
            road2: [
                [19,6], [20,6], [21,6]
            ],
            // Křižácký tábor severně od města (pláně)
            plains: 'default'
        },

        // Speciální hexy pro únik
        escapeZone: [[20,6], [21,6], [20,5], [21,5], [20,7], [21,7]],

        mapLabels: [
            { text: 'Tachov', hexes: [[16,5], [17,5], [16,6], [17,6]] },
            { text: 'K Bavorsku', i18nKey: 'towardBavaria', hexes: [[20,6], [21,6]] },
            { text: 'Od Stříbra', i18nKey: 'fromStribro', hexes: [[0,6], [1,6]] },
            { text: 'Vrch', i18nKey: 'hill', hexes: [[18,4], [19,4]] }
        ],

        forces: {
            hussites: {
                commander: 'Prokop Holý',
                units: [
                    // VELITEL - Prokop Holý
                    { type: 'PROKOP_HOLY', col: 3, row: 6 },
                    // Táborité - hlavní síla
                    { type: 'VOZOVA_HRADBA', col: 2, row: 5 },
                    { type: 'VOZOVA_HRADBA', col: 2, row: 6 },
                    { type: 'VOZOVA_HRADBA', col: 2, row: 7 },
                    { type: 'CEPNICI', col: 3, row: 5 },
                    { type: 'CEPNICI', col: 3, row: 7 },
                    { type: 'SUDLICNICI', col: 4, row: 5 },
                    { type: 'SUDLICNICI', col: 4, row: 7 },
                    // Sirotci
                    { type: 'CEPNICI', col: 1, row: 6 },
                    { type: 'SUDLICNICI', col: 1, row: 5 },
                    // Střelci
                    { type: 'KUSINICI_HUSITI', col: 1, row: 7 },
                    { type: 'RUCNICARI', col: 0, row: 6 },
                    // Dělostřelectvo
                    { type: 'HOUFNICE', col: 0, row: 5 },
                    { type: 'TARASNICE', col: 0, row: 7 },
                    // Pražané
                    { type: 'PAVEZNICI', col: 4, row: 6 },
                    // Jízda - pronásledování
                    { type: 'JIZDA_HUSITI', col: 5, row: 4 },
                    { type: 'JIZDA_HUSITI', col: 5, row: 8 }
                ]
            },
            crusaders: {
                commander: 'Ota z Ziegenheimu',
                units: [
                    // Křižácké velení na vrchu - demoralizované
                    { type: 'TEZKY_RYTIR', col: 18, row: 4 },
                    { type: 'TEZKY_RYTIR', col: 19, row: 4 },
                    // Hlavní síla v táboře severně od Tachova
                    { type: 'TEZKOODENCI', col: 15, row: 3 },
                    { type: 'TEZKOODENCI', col: 16, row: 3 },
                    { type: 'KOPINICI', col: 14, row: 4 },
                    { type: 'KOPINICI', col: 14, row: 5 },
                    { type: 'HALAPARTNICI', col: 15, row: 4 },
                    // Angličtí lučištníci kardinála Beauforta
                    { type: 'LUCISTNICI', col: 17, row: 3 },
                    { type: 'LUCISTNICI', col: 18, row: 3 },
                    // Lehká jízda - průzkum
                    { type: 'LEHKA_JIZDA', col: 13, row: 5 },
                    { type: 'LEHKA_JIZDA', col: 13, row: 7 },
                    // Jízda Jindřicha z Plavna (vrátila se bez boje)
                    { type: 'TEZKY_RYTIR', col: 12, row: 6 },
                    // Oddíly plzeňského landfrýdu
                    { type: 'KUSNICI', col: 14, row: 6 },
                    { type: 'KUSNICI', col: 15, row: 5 },
                    // Početní převaha kruciáty je na mapě komprimovaná, ale už
                    // tvoří skutečnou masu, která se po zlomu pověsti dává na útěk.
                    { type: 'KOPINICI', col: 12, row: 2 },
                    { type: 'HALAPARTNICI', col: 13, row: 2 },
                    { type: 'KOPINICI', col: 14, row: 2 },
                    { type: 'HALAPARTNICI', col: 15, row: 2 },
                    { type: 'KOPINICI', col: 16, row: 2 },
                    { type: 'HALAPARTNICI', col: 17, row: 2 },
                    { type: 'KOPINICI', col: 18, row: 2 },
                    { type: 'LEHKA_JIZDA', col: 12, row: 8 },
                    { type: 'KUSNICI', col: 13, row: 8 },
                    { type: 'KUSNICI', col: 14, row: 8 },
                    { type: 'KUSNICI', col: 15, row: 8 },
                    { type: 'TEZKOODENCI', col: 16, row: 8 },
                    { type: 'TEZKOODENCI', col: 17, row: 8 },
                    { type: 'TEZKOODENCI', col: 18, row: 8 }
                ]
            }
        },

        phases: [
            {
                id: 1,
                name: 'Husitský pochod',
                turnRange: [1, 2],
                description: 'Husité postupují od Stříbra. Křižáci vysílají jízdu, aby zpomalila postup.',
                events: [
                    { trigger: 'turn_1', message: 'Husitské vojsko se blíží od Stříbra! 16 000 pěších a 1500 jezdců pod Prokopem Holým.' },
                    // Zadní voj první kola kryje ústup. Hráč tak skutečně
                    // narazí na odpor, ne pouze na oddíly prchající od prvního tahu.
                    { id: 'tachov-rear-guard', trigger: 'turn_1', type: 'ai_stance', mode: 'defensive', untilTurn: 4 },
                    { trigger: 'turn_2', type: 'panic', faction: 'crusaders', level: 1, text: 'Harcovníci Jindřicha z Plavna odraženi husity na pochodu - ve zmatku se ženou zpět do ležení a šíří paniku!' }
                ]
            },
            {
                id: 2,
                name: 'Panika v táboře',
                turnRange: [3, 5],
                description: 'Strach se šíří křižáckým táborem. Jednotky začínají dezertovat.',
                events: [
                    { trigger: 'turn_3', type: 'panic', faction: 'crusaders', level: 2, text: 'Celé oddíly křižáků opouštějí tábor a prchají k hranicím!' },
                    { trigger: 'turn_4', message: 'Kardinál Beaufort se marně snaží zastavit prchající vojáky.' },
                    { trigger: 'turn_5', type: 'panic', faction: 'crusaders', level: 3, text: 'Beaufort v hněvu roztrhá říšské korouhve a hodí je knížatům k nohám!' }
                ]
            },
            {
                id: 3,
                name: 'Útěk k Bavorsku',
                turnRange: [6, 10],
                description: 'Křižácká armáda prchá. Husité pronásledují a dobývají opuštěný tábor.',
                events: [
                    { trigger: 'turn_6', type: 'rout', faction: 'crusaders', text: 'Při zaslechnutí chorálu „Ktož sú boží bojovníci", troubení a hluku válečných vozů se zbytky křižácké armády dávají na zběsilý útěk!' },
                    { trigger: 'turn_7', message: 'Husité nacházejí opuštěný křižácký tábor plný zásob a výzbroje.' }
                ]
            }
        ],

        specialMechanics: {
            // Křižáci se snaží uprchnout
            pursuit: true,
            escapeTarget: { col: 21, row: 6 },
            // Demoralizace - křižáci mají sníženou morálku
            startingMorale: {
                crusaders: 40  // Křižáci začínají s nízkou morálkou
            }
        },

        victoryConditions: {
            primary: {
                type: 'destroy_or_rout',
                percent: 50,
                description: 'Zničte nebo rozprašte 50% křižácké armády'
            },
            secondary: [
                { type: 'capture_position', positions: [[16,5], [17,5]], description: 'Zajměte město Tachov', bonus: 'Historické vítězství' },
                { type: 'destroy_percent', percent: 75, description: 'Zničte 75% nepřátel před jejich útěkem' }
            ]
        },

        debriefing: {
            victory: "Nepřátelská obrana se v této bitvě zhroutila. Historicky se polní vojsko výpravy rozpadlo začátkem srpna; dobytí města Tachova 11. srpna a hradu 14. srpna byly až další události, nikoli jeden okamžitý triumf.",
            defeat: "Křižákům se podařilo překonat strach a zorganizovat obranu. Husitská pověst neporazitelnosti dostala trhlinu. Tachov zůstává v rukou nepřítele."
        },

        maxTurns: 10,
        playerFaction: 'hussites'
    },

    // ==========================================
    // BITVA: NISA (18. března 1428) - Spanilá jízda do Slezska
    // ==========================================
    nisa_1428: {
        id: 'nisa_1428',
        name: 'Bitva u Nisy',
        date: "březen 1428",

        type: 'assault_battle',
        difficulty: 2,
        description: 'Spanilá jízda do Slezska. Husité drtivě poráží slezské vojsko před hradbami města Nisa.',
        historicalSignificance: "Střet ve slezském tažení roku 1428. Polní vítězství před Nisou neznamená dobytí jejího opevněného jádra.",

        briefing: {
            hussites: 'Po úspěšné rejse do Uher pokračujeme do Slezska. Před hradbami Nisy nás očekává vojsko vratislavského biskupa. Rozdrťte je a vypálte předměstí!',
            crusaders: 'Husité táhnou na Nisu! Shromážděte sedláky a měšťany k obraně. Město musí být ubráněno za každou cenu!'
        },

        mapSize: { width: 20, height: 14 },

        terrain: {
            // Město Nisa (hradby na východě)
            town: [
                [16,5], [17,5], [18,5],
                [16,6], [17,6], [18,6],
                [16,7], [17,7], [18,7]
            ],
            // Předměstí (mezi husity a městem)
            church: [
                [13,5], [14,5], [13,6], [14,6]
            ],
            // Řeka Nisa (pod městem)
            water: [
                [15,9], [16,9], [17,9], [18,9], [19,9],
                [16,10], [17,10], [18,10], [19,10],
                [17,11], [18,11], [19,11]
            ],
            // Cesta od západu (odkud přicházejí husité)
            road: [
                [0,6], [1,6], [2,6], [3,6], [4,6], [5,6], [6,6], [7,6], [8,6]
            ],
            // Lesy kolem
            forest: [
                [0,0], [1,0], [2,0],
                [0,1], [1,1],
                [0,12], [1,12], [2,12],
                [0,13], [1,13], [2,13]
            ],
            // Kopce na severu
            hills: [
                [10,0], [11,0], [12,0],
                [10,1], [11,1], [12,1]
            ],
            plains: 'default'
        },

        mapLabels: [
            { text: 'Nisa', hexes: [[16,5], [17,5], [18,5], [16,6], [17,6], [18,6]] },
            { text: 'Předměstí', i18nKey: 'suburb', hexes: [[13,5], [14,5], [13,6], [14,6]] },
            { text: 'Řeka Nisa', i18nKey: 'nysaRiver', hexes: [[16,9], [17,9], [18,9]] }
        ],

        forces: {
            hussites: {
                commander: 'Prokop Holý',
                units: [
                    // Sirotci pod Velkem z Březnice
                    { type: 'VOZOVA_HRADBA', col: 3, row: 5 },
                    { type: 'VOZOVA_HRADBA', col: 3, row: 6 },
                    { type: 'VOZOVA_HRADBA', col: 3, row: 7 },
                    { type: 'CEPNICI', col: 4, row: 5 },
                    { type: 'CEPNICI', col: 4, row: 6 },
                    { type: 'CEPNICI', col: 4, row: 7 },
                    { type: 'SUDLICNICI', col: 5, row: 5 },
                    { type: 'SUDLICNICI', col: 5, row: 7 },
                    // Táboři pod Prokopem Holým
                    { type: 'PROKOP_HOLY', col: 2, row: 6 },
                    { type: 'PAVEZNICI', col: 5, row: 6 },
                    { type: 'KUSINICI_HUSITI', col: 2, row: 5 },
                    { type: 'KUSINICI_HUSITI', col: 2, row: 7 },
                    // Dělostřelectvo
                    { type: 'HOUFNICE', col: 1, row: 5 },
                    { type: 'HOUFNICE', col: 1, row: 7 },
                    { type: 'TARASNICE', col: 1, row: 6 },
                    // Ručničáři
                    { type: 'RUCNICARI', col: 4, row: 4 },
                    { type: 'RUCNICARI', col: 4, row: 8 },
                    // Jízda - pronásledování
                    { type: 'JIZDA_HUSITI', col: 6, row: 4 },
                    { type: 'JIZDA_HUSITI', col: 6, row: 8 }
                ]
            },
            crusaders: {
                commander: 'Půta z Častolovic',
                units: [
                    // Obrana města - vojsko biskupa Konráda pod Půtou z Častolovic
                    // Sedláci a měšťané (slabá pěchota)
                    { type: 'KOPINICI', col: 11, row: 5 },
                    { type: 'KOPINICI', col: 11, row: 6 },
                    { type: 'KOPINICI', col: 11, row: 7 },
                    { type: 'KOPINICI', col: 12, row: 5 },
                    { type: 'KOPINICI', col: 12, row: 7 },
                    { type: 'HALAPARTNICI', col: 12, row: 6 },
                    // Městská hotovost
                    { type: 'TEZKOODENCI', col: 13, row: 6 },
                    { type: 'TEZKOODENCI', col: 14, row: 6 },
                    { type: 'KUSNICI', col: 13, row: 7 },
                    { type: 'KUSNICI', col: 14, row: 7 },
                    // Rytíři Půty z Častolovic
                    { type: 'TEZKY_RYTIR', col: 10, row: 6 },
                    { type: 'TEZKY_RYTIR', col: 9, row: 6 },
                    { type: 'LEHKA_JIZDA', col: 10, row: 5 },
                    { type: 'LEHKA_JIZDA', col: 10, row: 7 },
                    // Obrana hradeb
                    { type: 'TEZKOODENCI', col: 15, row: 5 },
                    { type: 'TEZKOODENCI', col: 15, row: 7 },
                    { type: 'KUSNICI', col: 16, row: 5 },
                    { type: 'LUCISTNICI', col: 17, row: 6 }
                ]
            }
        },

        phases: [
            {
                id: 1,
                name: 'Husitský útok',
                turnRange: [1, 3],
                description: 'Husité zahajují útok na slezské vojsko před hradbami.',
                events: [
                    { trigger: 'turn_1', message: 'Husitské vojsko postupuje s vozy a děly proti obráncům Nisy!' },
                    { trigger: 'turn_2', message: 'Sedláci a vesničané se staví husitům na odpor před předměstím.' }
                ]
            },
            {
                id: 2,
                name: 'Průlom obrany',
                turnRange: [4, 6],
                description: 'Husité prolamují slezskou obranu.',
                events: [
                    { trigger: 'turn_4', type: 'panic', faction: 'crusaders', level: 1, text: 'Slezské oddíly začínají ustupovat pod tlakem husitského útoku!' },
                    { trigger: 'turn_5', message: 'Půta z Častolovic se snaží organizovat obranu u hradeb.' }
                ]
            },
            {
                id: 3,
                name: 'Masakr a útěk',
                turnRange: [7, 10],
                description: 'Obránci prchají, mnozí hynou v řece.',
                events: [
                    { trigger: 'turn_7', type: 'panic', faction: 'crusaders', level: 2, text: 'Obránci v panice prchají - mnoho jich hyne v řece Nise!' },
                    { trigger: 'turn_8', message: 'Husité pálí předměstí a útočí na hradby!' }
                ]
            }
        ],

        victoryConditions: {
            primary: {
                type: 'destroy_percent',
                percent: 60,
                description: 'Zničte 60% slezského vojska'
            },
            secondary: [
                { type: 'capture_position', positions: [[13,5], [14,5]], description: 'Vypalte předměstí (zajměte pozice)', bonus: 'Historické vítězství' },
                { type: 'destroy_percent', percent: 80, description: 'Zničte 80% nepřátel (2000 padlých)' }
            ]
        },

        debriefing: {
            victory: "Polní protivník ustoupil. Historicky střet u Nisy patřil k tažení do Slezska v roce 1428. Vítězství mimo hradby neznamenalo automatické dobytí města ani konec odporu celého Slezska.",
            defeat: "Slezská obrana vydržela. Půta z Častolovic úspěšně ubránil Nisu. Spanilá jízda musí pokračovat jinudy a husitská pověst neporazitelnosti utrpěla trhlinu."
        },

        maxTurns: 10,
        playerFaction: 'hussites',

        specialMechanics: {
            noFogOfWar: true  // Otevřená bitva - obě armády se vidí
        }
    },

    // ==========================================
    // BITVA 4: DOMAŽLICE (14. srpna 1431)
    // ==========================================
    domazlice_1431: {
        id: 'domazlice_1431',
        name: 'Bitva u Domažlic',
        date: '14. srpna 1431',
        type: 'pursuit_battle',
        difficulty: 1,
        description: "Příchod husitů na pomoc Domažlicím zastihuje křižácké vojsko ve zmatku. Využijte jeho rozkolísané morálky.",
        historicalSignificance: "Rozpad výpravy roku 1431 urychlil cestu k jednání. Chorál je symbolem vítězství, ne prokázanou jedinou příčinou útěku.",
        aiDoctrine: { charge: 'cautious', pursueRouted: false, flankSeeking: false, fearThreshold: 58 },

        briefing: {
            hussites: "Přicházíte na pomoc obleženým Domažlicím. V nepřátelském vojsku se šíří zmatek při přesunech a strach z vašeho příchodu. Využijte zaváhání, ale počítejte i s odporem. Chorál je ve hře prostředkem práce s morálkou, nikoli jedinou příčinou historického útěku.",
            crusaders: "Husité se blíží! Pokuste se zformovat obranu, nebo alespoň bezpečně ustupte do Bavorska."
        },

        mapSize: { width: 24, height: 14 },

        terrain: {
            // Město Domažlice
            town: [
                [16,6], [17,6], [16,7], [17,7]
            ],
            // Šumavské hvozdy
            forest: [
                [20,0], [21,0], [22,0], [23,0],
                [20,1], [21,1], [22,1], [23,1],
                [21,2], [22,2], [23,2],
                [20,11], [21,11], [22,11], [23,11],
                [20,12], [21,12], [22,12], [23,12],
                [21,13], [22,13], [23,13]
            ],
            // Všerubský průsmyk (únik)
            road: [
                [22,6], [23,6], [22,7], [23,7]
            ],
            hills: [
                [12,5], [13,5], [12,6], [13,6]
            ],
            plains: 'default'
        },

        mapLabels: [
            { text: 'Baldov', hexes: [[12,5], [13,5], [12,6], [13,6]], offset: [0, -0.25] },
            { text: 'Domažlice', hexes: [[16,6], [17,6], [16,7], [17,7]], offset: [0, 0.35] },
            { text: 'Všerubský průsmyk', i18nKey: 'vserubyPass', hexes: [[22,6], [23,6], [22,7], [23,7]], offset: [-0.8, 0] }
        ],

        forces: {
            hussites: {
                commander: 'Prokop Holý',
                units: [
                    // Husitský proud
                    { type: 'VOZOVA_HRADBA', col: 2, row: 5 },
                    { type: 'VOZOVA_HRADBA', col: 2, row: 6 },
                    { type: 'VOZOVA_HRADBA', col: 2, row: 7 },
                    { type: 'VOZOVA_HRADBA', col: 2, row: 8 },
                    { type: 'CEPNICI', col: 3, row: 5 },
                    { type: 'CEPNICI', col: 3, row: 6 },
                    { type: 'CEPNICI', col: 3, row: 7 },
                    { type: 'SUDLICNICI', col: 4, row: 5 },
                    { type: 'SUDLICNICI', col: 4, row: 8 },
                    { type: 'KUSINICI_HUSITI', col: 1, row: 6 },
                    { type: 'KUSINICI_HUSITI', col: 1, row: 7 },
                    { type: 'RUCNICARI', col: 1, row: 5 },
                    { type: 'RUCNICARI', col: 1, row: 8 },
                    { type: 'HOUFNICE', col: 0, row: 6 },
                    { type: 'HOUFNICE', col: 0, row: 7 },
                    { type: 'JIZDA_HUSITI', col: 5, row: 4 },
                    { type: 'JIZDA_HUSITI', col: 5, row: 9 },
                    // Jízda - pronásledování
                    { type: 'JIZDA_HUSITI', col: 6, row: 6 },
                    { type: 'JIZDA_HUSITI', col: 6, row: 7 }
                ]
            },
            crusaders: {
                commander: 'Fridrich Braniborský',
                units: [
                    // Dezorganizované křižácké vojsko
                    { type: 'TEZKY_RYTIR', col: 14, row: 5 },
                    { type: 'TEZKY_RYTIR', col: 14, row: 8 },
                    { type: 'TEZKOODENCI', col: 15, row: 6 },
                    { type: 'TEZKOODENCI', col: 15, row: 7 },
                    { type: 'LEHKA_JIZDA', col: 16, row: 5 },
                    { type: 'LEHKA_JIZDA', col: 16, row: 8 },
                    { type: 'KOPINICI', col: 13, row: 6 },
                    { type: 'KOPINICI', col: 13, row: 7 },
                    { type: 'HALAPARTNICI', col: 14, row: 6 },
                    { type: 'HALAPARTNICI', col: 14, row: 7 },
                    { type: 'KUSNICI', col: 12, row: 5 },
                    { type: 'KUSNICI', col: 12, row: 8 },
                    // Vizuálně komprimovaná masa páté kruciáty: další šiky
                    // zaplní tábor, aby chorál skutečně obrátil početní přesilu.
                    { type: 'KOPINICI', col: 11, row: 3 },
                    { type: 'KOPINICI', col: 12, row: 3 },
                    { type: 'KOPINICI', col: 13, row: 3 },
                    { type: 'KOPINICI', col: 14, row: 3 },
                    { type: 'KOPINICI', col: 15, row: 3 },
                    { type: 'KOPINICI', col: 16, row: 3 },
                    { type: 'KOPINICI', col: 17, row: 3 },
                    { type: 'KOPINICI', col: 18, row: 3 },
                    { type: 'HALAPARTNICI', col: 11, row: 4 },
                    { type: 'HALAPARTNICI', col: 12, row: 4 },
                    { type: 'HALAPARTNICI', col: 13, row: 4 },
                    { type: 'HALAPARTNICI', col: 14, row: 4 },
                    { type: 'KUSNICI', col: 15, row: 4 },
                    { type: 'KUSNICI', col: 16, row: 4 },
                    { type: 'KUSNICI', col: 17, row: 4 },
                    { type: 'KUSNICI', col: 18, row: 4 },
                    { type: 'TEZKOODENCI', col: 17, row: 9 },
                    { type: 'TEZKOODENCI', col: 18, row: 9 }
                ]
            }
        },

        phases: [
            {
                id: 1,
                name: "Husitský pochod",
                turnRange: [1,3],
                description: "Husité se rychle přibližují k Domažlicím.",
                events: [
                    {"trigger":"turn_1","message":"Husitské vojsko urazilo 80 km za 2 dny a blíží se k Domažlicím!"},
                    // Před skriptovaným ústupem ve 4. kole drží zadní voj
                    // krátkou obranu, aby pronásledování obsahovalo i střet.
                    { id: "domazlice-rear-guard", trigger: "turn_1", type: "ai_stance", mode: "defensive", untilTurn: 3 },
                    {
                        trigger: "turn_2",
                        type: "panic",
                        faction: "crusaders",
                        level: 1,
                        text: "Zvědové hlásí: Husité jsou blíž, než jsme čekali!"
                    }
                ]
            },
            {
                id: 2,
                name: "Zmatek v ležení",
                turnRange: [4,6],
                description: "Přesuny vojska, nejednotné velení a zprávy o husitském příchodu živí paniku.",
                events: [
                    {
                        trigger: "turn_4",
                        type: "activate_choral",
                        duration: 3,
                        text: "Zvuk chorálu děsí křižáky!",
                        message: "Husitský houf se blíží. V ležení se přesuny oddílů vykládají jako začínající útěk."
                    },
                    {
                        trigger: "turn_4",
                        type: "panic",
                        faction: "crusaders",
                        level: 2,
                        text: "Zmatek a strach oslabují morálku křižáckého vojska."
                    },
                    {"trigger":"turn_5","message":"Kardinál Cesarini prchá a ztrácí kardinálský klobouk!"},
                    {"trigger":"turn_5","type":"panic","faction":"crusaders","level":3,"text":"Panika se šíří křižáckým táborem!"},
                    {
                        trigger: "turn_4",
                        type: "ai_stance",
                        mode: "retreat",
                        target: {"col":23,"row":6},
                        message: "Křižáci slyší chorál a rachot vozů - a dávají se na útěk!",
                        text: "Strach z příchodu husitů a narušené velení šíří paniku. Některé oddíly však mohou klást odpor."
                    }
                ]
            },
            {
                id: 3,
                name: "Útěk k Bavorsku",
                turnRange: [7,12],
                description: "Křižáci prchají Všerubským průsmykem do Bavorska.",
                events: [
                    {"trigger":"turn_7","type":"rout","faction":"crusaders","text":"Celá křižácká armáda se dává na útěk!"}
                ]
            }
        ],

        victoryConditions: {
            primary: {"type":"destroy_or_rout","percent":60,"description":"Způsobte útěk křižácké armády (zničte 60%)"},
            secondary: [
                {
                    type: "capture_position",
                    positions: [
                        [16,6],
                        [17,6]
                    ],
                    description: "Uvolněte přístup k obleženým Domažlicím"
                }
            ]
        },

        specialMechanics: {
            // Pověst z kampaně tuto hodnotu posouvá: při vysoké pověsti
            // začínají některé oddíly pod prahem strachu, při nízké vydrží.
            startingMorale: { crusaders: 65 }
        },

        debriefing: {
            victory: "Výprava ustoupila a cesta k Domažlicím je volná. Historický rozpad křižáckého vojska souvisel se zmatkem, přesuny a obavou z husitů; místy se přesto bojovalo. Chorál se stal symbolem vítězství, ale příběh o samotné písni, která bez boje porazila celou armádu, je zjednodušení.",
            defeat: "Křižáci překonali svůj strach a zformovali obranu. I přes váš chorál se nezhroutili. Husitská pověst neporazitelnosti je otřesena."
        },

        maxTurns: 12,
        playerFaction: 'hussites'
    },

    // ==========================================
    // BITVA: OBLÉHÁNÍ PLZNĚ (1433-1434)
    // ==========================================
    oblehani_plzne_1433: {
        id: 'oblehani_plzne_1433',
        name: 'Obléhání Plzně',
        date: "14. července 1433 – 9. května 1434",

        type: 'siege_assault',
        difficulty: 3,
        description: "Herní výsek dlouhého obléhání Plzně: pokus o útok na městské opevnění. Nejde o rekonstrukci doloženého generálního útoku v konkrétní den.",

        historicalSignificance: 'Největší neúspěch husitů. Plzeň odolala téměř rok a získala velblouda do znaku.',
        aiDoctrine: { charge: 'cautious', pursueRouted: false, flankSeeking: false, fearThreshold: 16, holdWagonFort: true },

        briefing: {
            hussites: 'Po měsících obléhání je čas na rozhodující útok! Prorazte hradby a dobyjte město. Prokop Holý sleduje z týla - nesmi selhat!',
            crusaders: 'Husité chystají generální útok! Vilém Švihovský z Rýzmberka vede obranu. Udrž hradby za každou cenu!'
        },

        mapSize: { width: 22, height: 14 },

        terrain: {
            // Město Plzeň (východ mapy)
            town: plzenCityHexes(),
            // Kostel sv. Bartoloměje (centrum města)
            church: [
                [17,6], [18,6]
            ],
            // Řeka Mže (jižně od města)
            water: [
                [14,10], [15,10], [16,10], [17,10], [18,10], [19,10], [20,10], [21,10],
                [15,11], [16,11], [17,11], [18,11], [19,11], [20,11], [21,11]
            ],
            // Příkopy a opevnění husitů (západ)
            trenches: [
                [6,4], [6,5], [6,6], [6,7], [6,8],
                [7,3], [7,9]
            ],
            // Husitské tábory (pět obléhacích bašt)
            hills: [
                [2,2], [3,2], [2,3], [3,3],   // Tábor 1 - sever
                [2,10], [3,10], [2,11], [3,11], // Tábor 2 - jih
                [0,6], [1,6], [0,7], [1,7]    // Hlavní tábor - střed
            ],
            // Cesty k hradbám
            road: [
                [8,6], [9,6], [10,6], [11,6], [12,6], [13,6], [14,6]
            ],
            road2: [
                [8,4], [9,4], [10,4], [11,4], [12,4],
                [8,8], [9,8], [10,8], [11,8], [12,8]
            ],
            // Zbytky lesů
            forest: [
                [0,0], [1,0], [0,1],
                [20,0], [21,0], [20,1], [21,1],
                [0,12], [1,12], [0,13], [1,13]
            ],
            plains: 'default'
        },

        mapLabels: [
            { text: 'Plzeň', hexes: plzenCityHexes(), offset: [0, -3.4] },
            { text: 'Sv. Bartoloměj', hexes: [[17,6], [18,6]], offset: [2.5, 2.2] },
            { text: 'Řeka Mže', i18nKey: 'mzeRiver', hexes: [[16,10], [17,10], [18,10]] },
            { text: 'Husitský tábor', i18nKey: 'hussiteCamp', hexes: [[0,6], [1,6], [0,7], [1,7]] },
            { text: 'Příkopy', i18nKey: 'trenches', hexes: [[6,5], [6,6], [6,7]] }
        ],

        forces: {
            hussites: {
                commander: 'Prokop Holý',
                units: [
                    // Prokop Holý v týlu (po hádce s hejtmany)
                    { type: 'PROKOP_HOLY', col: 1, row: 6 },
                    // Vozová hradba - obléhací pozice
                    { type: 'VOZOVA_HRADBA', col: 5, row: 4 },
                    { type: 'VOZOVA_HRADBA', col: 5, row: 5 },
                    { type: 'VOZOVA_HRADBA', col: 5, row: 6 },
                    { type: 'VOZOVA_HRADBA', col: 5, row: 7 },
                    { type: 'VOZOVA_HRADBA', col: 5, row: 8 },
                    // Táboři - hlavní útočná síla (Jan Pardus z Horky)
                    { type: 'CEPNICI', col: 7, row: 5 },
                    { type: 'CEPNICI', col: 7, row: 6 },
                    { type: 'CEPNICI', col: 7, row: 7 },
                    { type: 'SUDLICNICI', col: 8, row: 5 },
                    { type: 'SUDLICNICI', col: 8, row: 7 },
                    // Sirotci (Bedřich ze Strážnice)
                    // POZOR: typ musí mít faction: 'hussites' - HALAPARTNICI jsou křižácká šablona
                    { type: 'PAVEZNICI', col: 8, row: 6 },
                    { type: 'SUDLICNICI', col: 9, row: 5 },
                    { type: 'SUDLICNICI', col: 9, row: 7 },
                    // Střelci
                    { type: 'KUSINICI_HUSITI', col: 6, row: 4 },
                    { type: 'KUSINICI_HUSITI', col: 6, row: 8 },
                    { type: 'RUCNICARI', col: 4, row: 5 },
                    { type: 'RUCNICARI', col: 4, row: 7 },
                    // Dělostřelectvo - klíč k průlomu hradeb
                    { type: 'HOUFNICE', col: 3, row: 5 },
                    { type: 'HOUFNICE', col: 3, row: 7 },
                    { type: 'TARASNICE', col: 3, row: 6 },
                    // Těžká bombarda je před bitvou usazená v předsunuté
                    // baterii; s pohybem 0 odtud skutečně dostřelí na obranu.
                    { type: 'BOMBARDA', col: 11, row: 6 },
                    // Jízda - záloha
                    { type: 'JIZDA_HUSITI', col: 2, row: 4 },
                    { type: 'JIZDA_HUSITI', col: 2, row: 8 }
                ]
            },
            crusaders: {
                commander: 'Vilém Švihovský z Rýzmberka',
                units: [
                    // Obrana hradeb - Vilém Švihovský a Děpolt z Dolan
                    // Těžkooděnci na hradbách
                    { type: 'TEZKOODENCI', col: 15, row: 4 },
                    { type: 'TEZKOODENCI', col: 15, row: 5 },
                    { type: 'TEZKOODENCI', col: 15, row: 6 },
                    { type: 'TEZKOODENCI', col: 15, row: 7 },
                    { type: 'TEZKOODENCI', col: 15, row: 8 },
                    // Kopiníci - záloha
                    { type: 'KOPINICI', col: 16, row: 5 },
                    { type: 'KOPINICI', col: 16, row: 7 },
                    { type: 'HALAPARTNICI', col: 16, row: 6 },
                    // Střelci na hradbách
                    { type: 'KUSNICI', col: 14, row: 4 },
                    { type: 'KUSNICI', col: 14, row: 5 },
                    { type: 'KUSNICI', col: 14, row: 7 },
                    { type: 'KUSNICI', col: 14, row: 8 },
                    { type: 'LUCISTNICI', col: 13, row: 5 },
                    { type: 'LUCISTNICI', col: 13, row: 7 },
                    // Městská děla
                    { type: 'POLNI_DELO', col: 14, row: 6 },
                    // Rytíři Viléma Švihovského - mobilní záloha
                    // Vilém je cílem podmínky kill_commander - musí být na mapě
                    { type: 'VILEM_SVIHOVSKY', col: 18, row: 5 },
                    { type: 'TEZKY_RYTIR', col: 17, row: 5 },
                    { type: 'TEZKY_RYTIR', col: 17, row: 7 },
                    { type: 'LEHKA_JIZDA', col: 18, row: 6 }
                ]
            }
        },

        phases: [
            {
                id: 1,
                name: "Dělostřelecká příprava",
                turnRange: [1,3],
                description: "Husitská děla ostřelují hradby. Obránci odpovídají z městských pozic.",
                events: [
                    {"trigger":"turn_1","message":"Husitské bombardy zahajují palbu na hradby Plzně!"},
                    {"trigger":"turn_2","message":"Obránci se kryjí za cimbuřím. Vilém Švihovský povzbuzuje posádku."},
                    {"trigger":"turn_3","message":"V hradbách se objevují první trhliny!"}
                ]
            },
            {
                id: 2,
                name: "Útok na hradby",
                turnRange: [4,7],
                description: "Pěchota postupuje k hradbám. Těžké ztráty na obou stranách.",
                events: [
                    {"trigger":"turn_4","message":"Jan Pardus z Horky vede táborskou pěchotu do útoku!"},
                    {"trigger":"turn_5","message":"Obránci kryjí přístupy ke hradbám a odrážejí útočící pěchotu."},
                    {"trigger":"turn_6","message":"Krvavé boje u hradeb! Husité se snaží prolomit obranu."}
                ]
            },
            {
                id: 3,
                name: "Boj o brány",
                turnRange: [8,10],
                description: "Posádka se může pokusit o výpad, pokud má ještě sílu. Boj pokračuje u opevnění.",
                events: [
                    {
                        trigger: 'turn_8', triggerBefore: 'turn_8',
                        message: 'Vilém Švihovský připravuje výpad z bran. Bojeschopní obránci se shromažďují u opevnění.',
                        condition: { type: 'ready_units', faction: 'crusaders', minCount: 5,
                            requiredType: 'VILEM_SVIHOVSKY',
                            area: { minCol: 15, maxCol: 18, minRow: 4, maxRow: 8 } }
                    },
                    {
                        trigger: "turn_9",
                        triggerBefore: 'turn_9',
                        type: "morale_boost",
                        faction: "crusaders",
                        modifier: 15,
                        text: "Bojeschopným obráncům u bran roste sebedůvěra.",
                        condition: { type: 'ready_units', faction: 'crusaders', minCount: 5,
                            requiredType: 'VILEM_SVIHOVSKY',
                            area: { minCol: 15, maxCol: 18, minRow: 4, maxRow: 8 } }
                    }
                ]
            },
            {
                id: 4,
                name: "Rozhodnutí",
                turnRange: [11,14],
                description: "Útok buď uspěje, nebo husité budou muset ustoupit.",
                events: [
                    {"trigger":"turn_11","message":"Poslední šance na průlom! Prokop Holý posílá zálohy."},
                    {
                        trigger: "turn_13",
                        type: "morale",
                        faction: "hussites",
                        amount: 2,
                        text: "Hlad, násilné „picování“ okolí a spory mezi hejtmany lámou tábor. Někteří vojáci dezertují."
                    }
                ]
            }
        ],

        victoryConditions: {
            primary: {
                type: 'capture_position',
                positions: plzenCityHexes(),
                count: 3,
                description: 'Obsaďte 3 libovolná pole Plzně',
                zoneLabel: 'CÍL: PLZEŇ'
            },
            secondary: [
                { type: 'destroy_percent', percent: 70, description: 'Zničte 70% obránců' },
                { type: 'kill_commander', description: 'Zabijte Viléma Švihovského' }
            ]
        },

        defeatConditions: {
            primary: {
                type: 'lose_percent',
                percent: 60,
                description: 'Ztratíte 60% vojska'
            }
        },

        debriefing: {
            victory: "Do města jste pronikli. Tím se tato partie odchýlila od historie: obléhání v letech 1433–1434 skončilo neúspěchem polních vojsk. Dobyli jste městské pozice, ne však ztracenou jednotu husitských svazů.",
            defeat: "Plzeň odolala, stejně jako při historickém obléhání ukončeném 9. května 1434. Dlouhé tažení oslabovalo polní vojska a prohlubovalo jejich krizi. Ukořistěný velbloud se stal městským symbolem; tuto figuru si Plzeňané přidali do znaku sami, ne jako Zikmundovu odměnu."
        },

        maxTurns: 14,
        playerFaction: 'hussites'
    },

    // ==========================================
    // BITVA 5: LIPANY (30. května 1434)
    // ==========================================
    lipany_1434: {
        id: 'lipany_1434',
        factionNames: { hussites: 'Polní vojska', crusaders: 'Panská jednota' },
        name: 'Bitva u Lipan',
        date: '30. května 1434',
        type: 'civil_war',
        difficulty: 3,
        description: 'Bratrovražedná bitva mezi husity. Umírnění kališníci a katolíci porazí radikální Tábory a Sirotky.',
        historicalSignificance: "Porážka radikálních polních vojsk a smrt Prokopa Holého. Významný obrat, nikoli okamžitý konec všech husitských válek.",

        aiDoctrine: { charge: 'cautious', pursueRouted: true, flankSeeking: true, fearThreshold: 18, feignedRetreat: true },

        briefing: {
            hussites: 'Jako velitel radikálů musíte odrazit útok umírněných. Pozor na jejich léčku - klamný útěk!',
            crusaders: 'Vedete koalici umírněných. Použijte klamný útěk, vylákat radikály z vozové hradby a udeřte z boku jízdou.'
        },

        mapSize: { width: 22, height: 14 },

        terrain: {
            // Lipská hora - pozice radikálů
            hills: [
                [14,3], [15,3], [16,3],
                [14,4], [15,4], [16,4],
                [14,5], [15,5], [16,5]
            ],
            // Vesnice
            town: [
                [18,6], [19,6]
            ],
            // Rybník
            water: [
                [17,2], [18,2], [17,3], [18,3]
            ],
            // Potok Bylanka - skrytá pozice
            forest: [
                [4,6], [4,7], [4,8], [5,6], [5,7], [5,8]
            ],
            plains: 'default'
        },

        mapLabels: [
            { text: 'Lipská hora', i18nKey: 'lipskaHill', hexes: [[14,3], [15,3], [16,3], [15,4], [15,5]] },
            { text: 'Hřiby', hexes: [[18,6], [19,6]], offset: [0, 0.35] }
        ],

        forces: {
            hussites: {
                commander: 'Prokop Holý',
                faction_name: 'Radikálové (Táboři a Sirotci)',
                units: [
                    // Prokop Holý - event i debriefing čtou jeho skutečný stav.
                    { type: 'PROKOP_HOLY', col: 16, row: 6 },
                    // Vozová hradba radikálů
                    { type: 'VOZOVA_HRADBA', col: 14, row: 3 },
                    { type: 'VOZOVA_HRADBA', col: 14, row: 4 },
                    { type: 'VOZOVA_HRADBA', col: 14, row: 5 },
                    { type: 'VOZOVA_HRADBA', col: 14, row: 6 },
                    // Pěchota
                    { type: 'CEPNICI', col: 15, row: 3 },
                    { type: 'CEPNICI', col: 15, row: 4 },
                    { type: 'CEPNICI', col: 15, row: 5 },
                    { type: 'SUDLICNICI', col: 15, row: 6 },
                    // Střelci
                    { type: 'KUSINICI_HUSITI', col: 16, row: 4 },
                    { type: 'KUSINICI_HUSITI', col: 16, row: 5 },
                    { type: 'RUCNICARI', col: 16, row: 3 },
                    // Dělostřelectvo
                    { type: 'HOUFNICE', col: 17, row: 4 },
                    { type: 'TARASNICE', col: 17, row: 5 },
                    // Jízda
                    { type: 'JIZDA_HUSITI', col: 13, row: 2 },
                    { type: 'JIZDA_HUSITI', col: 13, row: 7 },
                    // Kušiníci - střed
                    { type: 'KUSINICI_HUSITI', col: 12, row: 5 }
                ]
            },
            crusaders: {
                commander: 'Diviš Bořek z Miletínka',
                faction_name: 'Umírnění (Panská jednota)',
                units: [
                    // Diviš Bořek - velitel umírněných (cíl "kill_commander" ho vyžaduje na mapě,
                    // jinak je podmínka splněná automaticky - every() na prázdném poli)
                    { type: 'DIVIS_BOREK', col: 6, row: 4 },
                    // Vozová hradba umírněných (pražské vozy - modré)
                    // formation:'open' - aby mohly předstírat ústup (WP0 lure; AII toggle nedělá).
                    // Pole je před WP1 neškodné (engine ho zatím ignoruje).
                    { type: 'VOZOVA_HRADBA_PRASKY', col: 7, row: 5, formation: 'open' },
                    { type: 'VOZOVA_HRADBA_PRASKY', col: 7, row: 6, formation: 'open' },
                    { type: 'VOZOVA_HRADBA_PRASKY', col: 7, row: 7, formation: 'open' },
                    // Pěchota (pražští cepníci - modří)
                    { type: 'CEPNICI_PRASKY', col: 8, row: 5 },
                    { type: 'CEPNICI_PRASKY', col: 8, row: 6 },
                    { type: 'KOPINICI', col: 8, row: 7 },
                    { type: 'HALAPARTNICI', col: 9, row: 5 },
                    { type: 'HALAPARTNICI', col: 9, row: 7 },
                    // Střelci (pražští kušiníci - modří)
                    { type: 'KUSINICI_PRASKY', col: 6, row: 5 },
                    { type: 'KUSINICI_PRASKY', col: 6, row: 7 },
                    // Dělostřelectvo (pražské houfnice - modré)
                    { type: 'HOUFNICE_PRASKY', col: 6, row: 6 },
                    // Skrytá šlechtická jízda (u Bylanky) - zůstávají rytíři (byli tam i katoličtí spojenci)
                    { type: 'TEZKY_RYTIR', col: 4, row: 6 },
                    { type: 'TEZKY_RYTIR', col: 4, row: 7 },
                    { type: 'TEZKOODENCI', col: 5, row: 6 },
                    { type: 'TEZKOODENCI', col: 5, row: 7 },
                    // Lehká jízda - pražská (modrá)
                    { type: 'JIZDA_PRASKY', col: 4, row: 8 }
                ]
            }
        },

        phases: [
            {
                id: 1,
                name: 'Patová situace',
                turnRange: [1, 4],
                description: 'Vyjednávání selhalo. Někdejší spojenci stojí proti sobě.',
                events: [
                    { trigger: 'turn_1', message: 'Bratrovražedná bitva začíná...' },
                    { trigger: 'turn_2', message: 'Smír se nepodařilo dojednat. Proti vám stojí i muži, kteří dříve bojovali pod stejným znamením.' }
                ]
            },
            {
                id: 2,
                name: 'Pokus o léčku',
                turnRange: [5, 7],
                description: 'Koalice hledá příležitost vylákat polní vojska z obrany.',
                events: [
                    { trigger: 'turn_5', message: 'Koalice hledá slabé místo vaší obrany. Pozor na předstíraný útěk!' },
                    { trigger: 'turn_6', type: 'ai_stance', mode: 'lure', target: { col: 2, row: 6 }, untilTurn: 7, proximity: 3, message: 'Koalice dostává rozkaz předstírat ústup. Pronásledování může otevřít cestu její jízdě.' }
                ]
            },
            {
                id: 3,
                name: 'Rozhodující střet',
                turnRange: [8, 10],
                description: 'Sledujte pohyb jízdy; soudržnost obrany může rozhodnout.',
                events: [
                    { trigger: 'turn_8', message: 'Rozhodující střet. Sledujte pohyb jízdy; o opuštění hradby rozhodujete vy.' }
                ]
            },
            {
                id: 4,
                name: 'Závěr bitvy',
                turnRange: [11, 15],
                description: 'Bitva pokračuje. Rozhodnou oddíly, které ještě drží pohromadě.',
                events: [
                    {
                        trigger: 'turn_12',
                        message: 'Závěr bitvy se blíží. Rozhodující je, které oddíly ještě drží pohromadě.',
                        unitStatus: {
                            type: 'PROKOP_HOLY', faction: 'hussites',
                            texts: {
                                alive: 'Prokop Holý žije a je stále na bojišti. O výsledku bitvy se ještě bojuje.',
                                fallen: 'Prokop Holý v této bitvě padl. Zbývající oddíly bojují bez něj.',
                                escaped: 'Prokop Holý opustil bojiště. Boj pokračuje bez něj.'
                            }
                        }
                    }
                ]
            }
        ],

        victoryConditions: {
            primary: {
                type: 'destroy_percent',
                percent: 50,
                description: 'Udržte vozovou hradbu a zničte 50% koalice'
            },
            secondary: [
                { type: 'kill_commander', description: 'Zabijte Diviše Bořka' }
            ]
        },

        debriefing: {
            victory: 'Polní vojska u Lipan zvítězila a koalice utrpěla porážku. Vyhráli jste bitvu, kterou historie prohrála — rozdělená země však nezmizela. Vojenské vítězství ještě není smír.',
            defeat: 'Polní vojska u Lipan utrpěla porážku. Koalice rozhodla střetnutí ve svůj prospěch; o další cestě země budou nyní vyjednávat z pozice síly její vítězové.',
            unitStatus: {
                type: 'PROKOP_HOLY', faction: 'hussites',
                texts: {
                    alive: 'Prokop Holý tuto bitvu přežil. Jeho další osud zůstává za hranicí této partie.',
                    fallen: 'Prokop Holý v této bitvě padl. Výsledek střetnutí jeho smrt nezvrátí.',
                    escaped: 'Prokop Holý z bojiště uprchl. Není mezi padlými, ale na konci střetnutí už nestojí se svým vojskem.'
                }
            }
        },

        maxTurns: 15,
        playerFaction: 'hussites'
    },

    // ==========================================
    // BITVA: OBLÉHÁNÍ HRADU SION (1437)
    // ==========================================
    sion_1437: {
        id: 'sion_1437',
        mapRevision: 2,
        name: 'Obléhání hradu Sion',
        date: "6. září 1437",

        type: 'last_stand',
        difficulty: 4,
        description: "Závěr obléhání Sionu. Jan Roháč z Dubé drží opevněné předhradí a hradní jádro proti královskému vojsku.",

        historicalSignificance: "Pád Sionu a poprava Jana Roháče s druhy v Praze 9. září 1437 se staly výrazným symbolem potlačení ozbrojeného odporu proti Zikmundovi.",

        briefing: {
            hussites: "Od jara čelíte královskému obléhání. Braňte tři valy předhradí a hradní jádro nad Vrchlicí. Posily zvyšují tlak útočníků. Dvanáct herních kol představuje závěrečný úsek, ne celé měsíce obléhání.",
            crusaders: "Král Zikmund ztrácí trpělivost. S uherskými posilami konečně dobyjte ten prokletý hrádek a zajměte Roháče živého!"
        },

        mapSize: {"width":18,"height":14},

        terrain: {
            hills: [
                [5,6],
                [5,7],
                [5,8],
                [5,9],
                [5,10],
                [6,6],
                [6,7],
                [6,8],
                [6,9],
                [6,10],
                [7,6],
                [7,7],
                [7,8],
                [7,9],
                [7,10],
                [8,6],
                [8,7],
                [8,8],
                [8,9],
                [8,10],
                [9,6],
                [9,7],
                [9,8],
                [9,9],
                [9,10],
                [10,6],
                [10,7],
                [10,8],
                [10,9],
                [10,10]
            ],
            town: [
                [5,7],
                [6,7],
                [5,8],
                [6,8],
                [7,8],
                [6,9]
            ],
            water: [
                [2,6],
                [2,7],
                [2,8],
                [2,9],
                [3,9],
                [3,10],
                [3,11],
                [4,11],
                [4,12],
                [5,12],
                [6,12],
                [7,12],
                [8,12],
                [9,12],
                [10,13],
                [11,13]
            ],
            slope: [
                [3,6],
                [4,6],
                [4,7],
                [4,8],
                [4,9],
                [5,10],
                [6,11],
                [7,11]
            ],
            forest: [
                [0,0],
                [1,0],
                [0,1],
                [1,1],
                [0,11],
                [1,11],
                [0,12],
                [1,12],
                [0,13],
                [1,13],
                [16,0],
                [17,0],
                [16,1],
                [17,1],
                [16,12],
                [17,12],
                [16,13],
                [17,13]
            ],
            trenches: [
                [11,5],
                [11,6],
                [11,7],
                [11,8],
                [11,9],
                [12,4],
                [12,5],
                [12,6],
                [12,7],
                [12,8],
                [12,9],
                [13,4],
                [13,5],
                [13,6],
                [13,7],
                [13,8],
                [13,9],
                [13,10],
                [7,6],
                [7,7],
                [7,9],
                [11,2],
                [12,2],
                [11,11],
                [12,11]
            ],
            road: [
                [17,7],
                [16,7],
                [15,7],
                [14,7],
                [13,7],
                [12,7],
                [11,7],
                [10,7],
                [9,7],
                [8,7],
                [7,8]
            ],
            plains: "default"
        },

        mapLabels: [
            {
                text: "Hradní jádro",
                i18nKey: "castleCore",
                hexes: [
                    [5,7],
                    [6,8]
                ],
                offset: [-0.5,-0.4]
            },
            {
                text: "Vrchlice",
                i18nKey: "vrchliceBrook",
                hexes: [
                    [3,10],
                    [6,12]
                ],
                offset: [-0.5,0]
            },
            {
                text: "Tři obranné valy",
                i18nKey: "threeBanks",
                hexes: [
                    [11,5],
                    [12,5],
                    [13,5]
                ],
                offset: [0,-0.5]
            },
            {
                text: "Předhradí",
                i18nKey: "castleBailey",
                hexes: [
                    [9,7],
                    [9,8]
                ],
                offset: [0,0.7]
            },
            {
                text: "Obléhací postavení",
                i18nKey: "siegePositions",
                hexes: [
                    [11,2],
                    [12,2]
                ],
                offset: [0,-0.65]
            },
            {
                text: "Obléhací postavení",
                i18nKey: "siegePositions",
                hexes: [
                    [11,11],
                    [12,11]
                ],
                offset: [0,0.65]
            }
        ],

        forces: {
            hussites: {
                commander: "Jan Roháč z Dubé",
                units: [
                    {"type":"JAN_ROHAC","col":6,"row":8},
                    {"type":"CEPNICI","col":6,"row":7},
                    {"type":"CEPNICI","col":8,"row":8},
                    {"type":"CEPNICI","col":9,"row":7},
                    {"type":"SUDLICNICI","col":8,"row":7},
                    {"type":"SUDLICNICI","col":10,"row":7},
                    {"type":"PAVEZNICI","col":7,"row":8},
                    {"type":"SUDLICNICI","col":9,"row":6},
                    {"type":"KUSINICI_HUSITI","col":10,"row":6},
                    {"type":"KUSINICI_HUSITI","col":8,"row":9},
                    {"type":"RUCNICARI","col":10,"row":8},
                    {"type":"TARASNICE","col":9,"row":9}
                ]
            },
            crusaders: {
                commander: "Hynce Ptáček z Pirkštejna",
                units: [
                    {"type":"KOPINICI","col":15,"row":5},
                    {"type":"KOPINICI","col":15,"row":7},
                    {"type":"KOPINICI","col":15,"row":9},
                    {"type":"HALAPARTNICI","col":14,"row":5},
                    {"type":"HALAPARTNICI","col":14,"row":9},
                    {"type":"TEZKOODENCI","col":15,"row":6},
                    {"type":"KUSNICI","col":16,"row":4},
                    {"type":"KUSNICI","col":16,"row":9},
                    {"type":"LUCISTNICI","col":16,"row":6},
                    {"type":"POLNI_DELO","col":11,"row":2},
                    {"type":"HOUFNICE_PRASKY","col":11,"row":11},
                    {"type":"LEHKA_JIZDA","col":15,"row":3},
                    {"type":"LEHKA_JIZDA","col":15,"row":11},
                    {"type":"TEZKY_RYTIR","col":17,"row":7}
                ],
                reinforcements: {
                    turn: 4,
                    message: "Uherské posily Michala Országha dorazily!",
                    units: [
                        {"type":"TEZKY_RYTIR","col":17,"row":4},
                        {"type":"TEZKY_RYTIR","col":17,"row":9},
                        {"type":"TEZKOODENCI","col":16,"row":3},
                        {"type":"TEZKOODENCI","col":16,"row":11},
                        {"type":"LEHKA_JIZDA","col":17,"row":3},
                        {"type":"LEHKA_JIZDA","col":17,"row":11}
                    ]
                }
            }
        },

        phases: [
            {
                id: 1,
                name: "Obléhací postavení",
                turnRange: [1,3],
                description: "Královské vojsko tlačí na opevněné předhradí a hradní jádro.",
                events: [
                    {"trigger":"turn_1","message":"Obléhání trvá od jara. Dělostřelecká postavení svírají hrad ze severu a jihu."},
                    {
                        trigger: "turn_2",
                        message: "Hrad nemá doloženou studnu, ale chráněný přístup k Vrchlici mohl zajišťovat vodu. Držte obranné pásmo."
                    },
                    {"trigger":"turn_3","message":"Král Zikmund ztrácí trpělivost. Posílá uherské vojsko!"}
                ]
            },
            {
                id: 2,
                name: "Příchod Uhrů",
                turnRange: [4,6],
                description: "Uherské posily mění rovnováhu sil.",
                events: [
                    {"trigger":"turn_4","message":"Michal Országh přivádí uherské rytíře! Situace je zoufalá."},
                    {
                        trigger: "turn_5",
                        type: "morale_boost",
                        faction: "crusaders",
                        modifier: 20,
                        text: "Uherští rytíři povzbuzují královské vojsko k rozhodnému útoku!"
                    }
                ]
            },
            {
                id: 3,
                name: "Poslední útok",
                turnRange: [7,10],
                description: "Generální útok na hradby. Obránci bojují o holé přežití.",
                events: [
                    {
                        trigger: "turn_7",
                        message: "Děla ostřelují obranu. Rozhodující je, zda posádka udrží přístupy k hradnímu jádru."
                    },
                    {
                        trigger: "turn_8",
                        type: "panic",
                        faction: "hussites",
                        level: 1,
                        text: "Někteří obránci ztrácejí naději. Jan Roháč je povzbuzuje k boji!"
                    },
                    {"trigger":"turn_9","message":"Útočníci hledají cestu přes příkopy. Hlídejte průchody mezi valy."}
                ]
            },
            {
                id: 4,
                name: "Závěrečný odpor",
                turnRange: [11,12],
                description: "O výsledku rozhodne udržení hradního jádra.",
                events: [
                    {"trigger":"turn_11","message":"Bojuje se o přístupy k jádru. Ztráta jeho klíčových pozic ukončí obranu."},
                    {
                        trigger: "turn_12",
                        message: "Závěr obrany. O osudu této partie rozhoduje posádka a držené pozice, ne předem napsaná legenda."
                    }
                ]
            }
        ],

        victoryConditions: {
            primary: {
                type: 'survive_turns',
                turns: 12,
                description: 'Udržte hrad 12 kol (do soumraku)'
            },
            secondary: [
                { type: 'destroy_percent', percent: 40, description: 'Zničte 40% útočníků' },
                { type: 'survive_commander', description: 'Jan Roháč přežije' }
            ]
        },

        defeatConditions: {
            primary: {"type":"commander_death","description":"Jan Roháč padne nebo je zajat"},
            alternative: {
                type: "lose_positions",
                positions: [
                    [6,8],
                    [7,8]
                ],
                description: "Nepřítel obsadí hradní jádro"
            }
        },

        specialMechanics: {"lastStand":true},

        debriefing: {
            victory: "Sion v této partii vydržel a Jan Roháč přežil. To je herní odbočka od historie: hrad padl 6. září 1437 a Roháč byl se svými druhy o tři dny později popraven v Praze. Vaše vítězství mění osud této obrany, ne výsledek skutečného obléhání.",
            defeat: "Obrana Sionu v této partii skončila. Historicky hrad padl 6. září 1437; zajatý Jan Roháč a jeho druhové byli 9. září popraveni v Praze. Přesné počty obětí a dramatické podrobnosti popravy se v podáních liší. Nálezy opevnění a střeliva svědčí o skutečném boji, ne pouze předstíraném obléhání."
        },

        maxTurns: 12,
        playerFaction: 'hussites'
    },

    // ==========================================
    // BITVA: HOŘICE (20. dubna 1423)
    // ==========================================
    horice_1423: {
        id: 'horice_1423',
        factionNames: { crusaders: 'Panská jednota' },
        name: 'Bitva u Hořic',
        date: "duben 1423",

        type: 'field_battle',
        difficulty: 3,
        description: "Žižkovo vojsko s vozy brání výšinu Gothard proti silám Čeňka z Vartenberka. Obranné postavení vyvažuje nepřátelskou jízdu.",

        historicalSignificance: 'Rozhodující porážka panské jednoty v severovýchodních Čechách. Slepý Žižka ubránil kopec vozovou hradbou a ukořistil nepřátelské vozy a děla.',
        aiDoctrine: { charge: 'reckless', pursueRouted: true, flankSeeking: true, fearThreshold: 18 },

        briefing: {
            hussites: 'Sražte vozovou hradbu na kopci Gothard a děla do ní. Panská jednota pod Čeňkem z Vartenberka se blíží s přesilou jízdy. Nechte rytíře vyjet do svahu, sesednout a unavit se - pak je rozbijte palbou a vyrazte jízdou dolů!',
            crusaders: 'Žižkovi radikálové se opevnili na kopci. Za panskou jednotu - máte převahu v jízdě, rozdrťte je dříve, než se zformují!'
        },

        mapSize: { width: 18, height: 14 },

        terrain: {
            // Kostel sv. Gotharda na vrcholu kopce
            church: [
                [10,4]
            ],
            // Kopec Gothard (357m) - střed mapy, vyvýšená pozice
            hills: [
                [8,4], [9,4], [11,4],
                [7,5], [8,5], [9,5], [10,5], [11,5], [12,5],
                [7,6], [8,6], [9,6], [10,6], [11,6], [12,6],
                [8,7], [9,7], [10,7], [11,7]
            ],
            // Cesta z Hořic (od severu, končí před kopci)
            road: [
                [9,0], [9,1], [9,2], [9,3],
                [0,10], [1,10], [2,10], [3,10], [4,10], [5,10]
            ],
            // Lesy na okrajích
            forest: [
                [0,0], [1,0], [2,0],
                [0,1], [1,1],
                [15,0], [16,0], [17,0],
                [16,1], [17,1],
                [0,12], [1,12], [2,12],
                [0,13], [1,13], [2,13],
                [15,12], [16,12], [17,12],
                [15,13], [16,13], [17,13]
            ],
            // Město Hořice (severní okraj)
            town: [
                [8,0], [10,0],
                [8,1], [10,1]
            ],
            plains: 'default'
        },

        mapLabels: [
            { text: 'Gothard', hexes: [[8,4], [10,5], [12,6]], offset: [0, 0.35] },
            { text: 'Hořice', hexes: [[8,0], [10,0], [8,1], [10,1]], offset: [0, 0.45] }
        ],

        forces: {
            hussites: {
                commander: 'Jan Žižka z Trocnova',
                units: [
                    // VELITELÉ - uprostřed za hradbou
                    { type: 'JAN_ZIZKA', col: 9, row: 5 },
                    { type: 'DIVIS_BOREK', col: 10, row: 5 },
                    // VOZOVÁ HRADBA - dvě řady na jižním svahu (čelí útoku do svahu),
                    // děla uvnitř. Žižka měl u Hořic ~120 vozů (Dolejší: "dvě řady vozů").
                    { type: 'VOZOVA_HRADBA', col: 8, row: 7 },
                    { type: 'VOZOVA_HRADBA', col: 9, row: 7 },
                    { type: 'VOZOVA_HRADBA', col: 10, row: 7 },
                    { type: 'VOZOVA_HRADBA', col: 11, row: 7 },
                    { type: 'VOZOVA_HRADBA', col: 7, row: 6 },
                    { type: 'VOZOVA_HRADBA', col: 12, row: 6 },
                    // Děla v hradbě
                    { type: 'HOUFNICE', col: 9, row: 6 },
                    { type: 'TARASNICE', col: 10, row: 6 },
                    // Střelci za vozy
                    { type: 'RUCNICARI', col: 8, row: 6 },
                    { type: 'RUCNICARI', col: 11, row: 6 },
                    { type: 'KUSINICI_HUSITI', col: 8, row: 5 },
                    { type: 'KUSINICI_HUSITI', col: 11, row: 5 },
                    // Pěchota uvnitř/za hradbou
                    { type: 'SUDLICNICI', col: 7, row: 5 },
                    { type: 'SUDLICNICI', col: 12, row: 5 },
                    { type: 'CEPNICI', col: 8, row: 4 },
                    { type: 'PAVEZNICI', col: 9, row: 4 },
                    { type: 'PAVEZNICI', col: 11, row: 4 },
                    // Orebitská jízda na křídlech - VÝPAD dolů ze svahu po zlomení nepřítele
                    { type: 'JIZDA_HUSITI', col: 5, row: 5 },
                    { type: 'JIZDA_HUSITI', col: 6, row: 6 },
                    { type: 'JIZDA_HUSITI', col: 13, row: 5 },
                    { type: 'JIZDA_HUSITI', col: 14, row: 6 }
                ]
            },
            crusaders: {
                commander: 'Čeněk z Vartenberka',
                units: [
                    // VELITEL
                    { type: 'CENEK_VARTENBERK', col: 9, row: 11 },
                    // Další velitelé
                    { type: 'ARNOST_FLASKA', col: 7, row: 11 },
                    { type: 'JINDRICH_BERKA', col: 11, row: 11 },
                    // Těžká jízda - hlavní útočná síla
                    { type: 'TEZKY_RYTIR', col: 6, row: 10 },
                    { type: 'TEZKY_RYTIR', col: 7, row: 10 },
                    { type: 'TEZKY_RYTIR', col: 8, row: 10 },
                    { type: 'TEZKY_RYTIR', col: 9, row: 10 },
                    { type: 'TEZKY_RYTIR', col: 10, row: 10 },
                    { type: 'TEZKY_RYTIR', col: 11, row: 10 },
                    { type: 'TEZKY_RYTIR', col: 12, row: 10 },
                    // Lehká jízda na křídlech
                    { type: 'LEHKA_JIZDA', col: 4, row: 10 },
                    { type: 'LEHKA_JIZDA', col: 5, row: 10 },
                    { type: 'LEHKA_JIZDA', col: 13, row: 10 },
                    { type: 'LEHKA_JIZDA', col: 14, row: 10 },
                    // Pěchota
                    { type: 'KOPINICI', col: 6, row: 12 },
                    { type: 'KOPINICI', col: 7, row: 12 },
                    { type: 'KOPINICI', col: 8, row: 12 },
                    { type: 'KOPINICI', col: 10, row: 12 },
                    { type: 'KOPINICI', col: 11, row: 12 },
                    { type: 'KOPINICI', col: 12, row: 12 },
                    { type: 'HALAPARTNICI', col: 9, row: 12 },
                    // Střelci
                    { type: 'KUSNICI', col: 5, row: 11 },
                    { type: 'KUSNICI', col: 13, row: 11 },
                    // Prameny mluví nejméně o trojnásobné přesile. Plný poměr by
                    // zahltil tahy AI; tyto dva šiky jej herně komprimují, ale
                    // dávají panské jednotě zřetelnou početní převahu bez HP buffů.
                    { type: 'TEZKY_RYTIR', col: 4, row: 9 },
                    { type: 'TEZKY_RYTIR', col: 5, row: 9 },
                    { type: 'TEZKY_RYTIR', col: 6, row: 9 },
                    { type: 'TEZKY_RYTIR', col: 7, row: 9 },
                    { type: 'TEZKY_RYTIR', col: 8, row: 9 },
                    { type: 'TEZKY_RYTIR', col: 9, row: 9 },
                    { type: 'TEZKY_RYTIR', col: 10, row: 9 },
                    { type: 'TEZKY_RYTIR', col: 11, row: 9 },
                    { type: 'TEZKY_RYTIR', col: 12, row: 9 },
                    { type: 'TEZKY_RYTIR', col: 13, row: 9 },
                    { type: 'KOPINICI', col: 5, row: 13 },
                    { type: 'HALAPARTNICI', col: 6, row: 13 },
                    { type: 'KOPINICI', col: 7, row: 13 },
                    { type: 'HALAPARTNICI', col: 8, row: 13 },
                    { type: 'KOPINICI', col: 9, row: 13 },
                    { type: 'HALAPARTNICI', col: 10, row: 13 },
                    { type: 'KOPINICI', col: 11, row: 13 },
                    { type: 'HALAPARTNICI', col: 12, row: 13 }
                    // Poznámka: Nepřátelské vozy byly ukořistěny až PO bitvě, nejsou v počátečním setupu
                ]
            }
        },

        phases: [
            {
                id: 1,
                name: 'Zaujmutí pozic',
                turnRange: [1, 2],
                description: 'Husité se opevňují na kopci Gothard, panská jednota se shromažďuje.',
                events: [
                    { trigger: 'turn_1', message: 'Žižka: "Na kopec! Držte svahy, střelci dopředu!"' },
                    { trigger: 'turn_2', message: 'Panská jednota se formuje k útoku pod kopcem.' }
                ]
            },
            {
                id: 2,
                name: 'Čelní útok',
                turnRange: [3, 5],
                description: 'Čeněk z Vartenberka vrhá jízdu do čelního útoku na kopec.',
                events: [
                    { trigger: 'turn_3', message: 'Čeněk z Vartenberka: "Vpřed! Rozbijte Žižkovy radikály!"' },
                    { trigger: 'turn_4', message: 'Těžká jízda naráží na husitskou pěchotu! Útok vázne ve strmém svahu.' },
                    { trigger: 'turn_5', type: 'cavalry_charge_blocked', text: 'Páni musí sesednout z koní - do strmého svahu na vozy a sudlice se koňmo zaútočit nedá.' }
                ]
            },
            {
                id: 3,
                name: 'Tříhodinový boj',
                turnRange: [6, 8],
                description: 'Zuřivé boje na svazích Gothardu. Panská jednota utrpí těžké ztráty.',
                events: [
                    { trigger: 'turn_6', message: 'Husitské houfnice a střelci kosí útočníky!' },
                    { trigger: 'turn_7', message: 'Houf Arnošta Flašky se hroutí pod palbou!' },
                    { trigger: 'turn_7', type: 'morale_drop', faction: 'crusaders', amount: 2, text: 'Zhroucení Flaškova houfu otřáslo panskou jednotou.' }
                ]
            },
            {
                id: 4,
                name: 'Husitský protiútok',
                turnRange: [9, 11],
                description: 'Žižka nařizuje protiútok. Orebitská jízda a pěchota vyráží z kopce.',
                events: [
                    { trigger: 'turn_9', message: 'Žižka: "Teď! Vpřed, za kalich!"' },
                    { trigger: 'turn_10', message: 'Panská jednota se dává na útěk! Čeněk prchá s hrstkou mužů!' }
                ]
            },
            {
                id: 5,
                name: 'Pronásledování',
                turnRange: [12, 14],
                description: 'Husité pronásledují prchající pány a ukořisťují jejich vozy.',
                events: [
                    { trigger: 'turn_12', message: 'Ukořistěny všechny nepřátelské vozy a děla!' },
                    { trigger: 'turn_13', message: 'Čeněk z Vartenberka uprchl. Husitské vítězství je úplné.' }
                ]
            }
        ],

        victoryConditions: {
            primary: {
                type: 'destroy_percent',
                percent: 60,
                description: 'Zničte 60% vojska panské jednoty'
            },
            secondary: [
                { type: 'hold_position', positions: [[8,5], [9,5], [10,5], [11,5]], description: 'Udržte kopec Gothard po celou bitvu' }
            ]
        },

        debriefing: {
            victory: "Obrana Gothardu obstála. Vozy, palba a výhoda svahu pomohly v této partii odrazit útok. Historicky Žižkovo vítězství posílilo jeho postavení ve východních Čechách; přesné rozmístění a počty ztrát neznáme.",
            defeat: "Panská jednota prolomila obranu. Kopec Gothard padl a s ním i naděje na udržení východních Čech. Husitské síly jsou rozptýleny a Čeněk z Vartenberka slaví vítězství."
        },

        maxTurns: 14,
        playerFaction: 'hussites'
    },

    // ==========================================
    // BITVA U MALEŠOVA (7. června 1424)
    // ==========================================
    malesov_1424: {
        id: 'malesov_1424',
        factionNames: { crusaders: 'Pražský svaz' },
        name: 'Bitva u Malešova',
        date: '7. června 1424',
        type: 'field_battle',
        difficulty: 4,
        description: "Žižkovo vojsko využívá obranné postavení proti koalici Pražanů a šlechty. Připravte protiútok ze svahu.",
        historicalSignificance: "Významné Žižkovo vítězství nad koalicí Pražanů a šlechty. Přesné místo střetu i počty padlých zůstávají předmětem výkladu.",

        briefing: {
            hussites: 'Protižižkovská koalice vás dostihla u Malešova. Využijte svah nad údolím potoka Bohynka. Nepřítel má početní převahu, ale terén je na vaší straně!',
            crusaders: 'Konečně jsme Žižku dostihli! Má méně mužů. Vtrhneme do údolí a rozdrtíme Žižkovce jednou provždy!'
        },

        mapSize: { width: 18, height: 14 },

        terrain: {
            // Svah nad údolím Bohynky (husitská pozice - horní část mapy)
            hills: [
                [4,2], [5,2], [6,2], [7,2], [8,2], [9,2], [10,2], [11,2], [12,2], [13,2],
                [5,3], [6,3], [7,3], [8,3], [9,3], [10,3], [11,3], [12,3],
                [6,4], [7,4], [8,4], [9,4], [10,4], [11,4]
            ],
            // Potok Bohynka (střed mapy - úzké údolí s brody)
            water: [
                [0,7], [1,7], [2,7], [3,7], [4,7], [5,7],
                // Brod u cesty: [9,7] vynechán
                [13,7], [14,7], [15,7], [16,7], [17,7]
            ],
            // Bažinaté údolí potoka (zpomaluje postup, ale průchodné)
            swamp: [
                [2,6], [3,6], [4,6], [5,6], [6,6], [7,6], [10,6], [11,6], [12,6], [13,6], [14,6], [15,6],
                [6,7], [7,7], [8,7], [9,7], [10,7], [11,7], [12,7],  // Údolí kolem brodu
                [2,8], [3,8], [4,8], [5,8], [6,8], [7,8], [10,8], [11,8], [12,8], [13,8], [14,8], [15,8]
            ],
            // Cesta k Malešovu (od jihu)
            road: [
                [9,13], [9,12], [9,11], [9,10], [9,9], [9,8]
            ],
            // Lesy na okrajích
            forest: [
                [0,0], [1,0], [2,0], [0,1], [1,1],
                [15,0], [16,0], [17,0], [16,1], [17,1],
                [0,12], [1,12], [0,13], [1,13],
                [16,12], [17,12], [16,13], [17,13]
            ],
            // Tvrz Malešov (jihovýchod)
            town: [
                [14,11], [15,11],
                [14,12], [15,12]
            ],
            plains: 'default'
        },

        mapLabels: [
            { text: 'Potok Bohynka', i18nKey: 'bohynkaBrook', hexes: [[1,7], [3,7], [5,7], [13,7], [15,7], [17,7]], offset: [0, 0.25] },
            { text: 'Tvrz Malešov', i18nKey: 'malesovFortress', hexes: [[14,11], [15,11], [14,12], [15,12]], offset: [-0.35, 0] }
        ],

        forces: {
            hussites: {
                commander: 'Jan Žižka z Trocnova',
                units: [
                    // VELITELÉ - Žižka a jeho průvodci
                    { type: 'JAN_ZIZKA', col: 8, row: 3 },
                    { type: 'JAN_ROHAC', col: 9, row: 3 },
                    { type: 'JAN_HVEZDA', col: 10, row: 3 },
                    { type: 'VIKTORIN_BOCEK', col: 7, row: 3 },
                    // Vozová hradba na svahu (tvořící obrannou linii)
                    { type: 'VOZOVA_HRADBA', col: 5, row: 4 },
                    { type: 'VOZOVA_HRADBA', col: 6, row: 4 },
                    { type: 'VOZOVA_HRADBA', col: 7, row: 4 },
                    { type: 'VOZOVA_HRADBA', col: 8, row: 4 },
                    { type: 'VOZOVA_HRADBA', col: 9, row: 4 },
                    { type: 'VOZOVA_HRADBA', col: 10, row: 4 },
                    { type: 'VOZOVA_HRADBA', col: 11, row: 4 },
                    { type: 'VOZOVA_HRADBA', col: 12, row: 4 },
                    // Pěchota za hradbou
                    { type: 'CEPNICI', col: 6, row: 3 },
                    { type: 'CEPNICI', col: 11, row: 3 },
                    { type: 'SUDLICNICI', col: 5, row: 3 },
                    { type: 'SUDLICNICI', col: 12, row: 3 },
                    { type: 'KOPINICI_HUSITI', col: 7, row: 2 },
                    { type: 'KOPINICI_HUSITI', col: 10, row: 2 },
                    // Střelci (ručnice a kuše)
                    { type: 'RUCNICARI', col: 8, row: 2 },
                    { type: 'RUCNICARI', col: 9, row: 2 },
                    { type: 'KUSINICI_HUSITI', col: 6, row: 2 },
                    { type: 'KUSINICI_HUSITI', col: 11, row: 2 },
                    // Děla na svahu
                    { type: 'HOUFNICE', col: 5, row: 2 },
                    { type: 'HOUFNICE', col: 12, row: 2 },
                    // Jízda na křídlech (pro protiútok)
                    { type: 'JIZDA_HUSITI', col: 4, row: 3 },
                    { type: 'JIZDA_HUSITI', col: 13, row: 3 }
                ]
            },
            crusaders: {
                commander: 'Diviš Bořek z Miletínka',
                units: [
                    // VELITELÉ koalice - Diviš Bořek vede pražské vojsko. Žižkův
                    // spojenec u Hořic 1423, o rok později jeho protivník (občanská válka).
                    { type: 'DIVIS_BOREK', col: 9, row: 11 },
                    { type: 'ARNOST_FLASKA', col: 7, row: 11 },
                    { type: 'JINDRICH_BERKA', col: 11, row: 11 },
                    // Těžká jízda - hlavní síla (7-8000 mužů historicky)
                    { type: 'TEZKY_RYTIR', col: 5, row: 10 },
                    { type: 'TEZKY_RYTIR', col: 6, row: 10 },
                    { type: 'TEZKY_RYTIR', col: 7, row: 10 },
                    { type: 'TEZKY_RYTIR', col: 8, row: 10 },
                    { type: 'TEZKY_RYTIR', col: 9, row: 10 },
                    { type: 'TEZKY_RYTIR', col: 10, row: 10 },
                    { type: 'TEZKY_RYTIR', col: 11, row: 10 },
                    { type: 'TEZKY_RYTIR', col: 12, row: 10 },
                    { type: 'TEZKY_RYTIR', col: 13, row: 10 },
                    // Lehká jízda na křídlech
                    { type: 'LEHKA_JIZDA', col: 3, row: 10 },
                    { type: 'LEHKA_JIZDA', col: 4, row: 10 },
                    { type: 'LEHKA_JIZDA', col: 14, row: 10 },
                    { type: 'LEHKA_JIZDA', col: 15, row: 10 },
                    // Pražská pěchota (umírnění husité)
                    { type: 'KOPINICI', col: 6, row: 12 },
                    { type: 'KOPINICI', col: 7, row: 12 },
                    { type: 'KOPINICI', col: 8, row: 12 },
                    { type: 'KOPINICI', col: 9, row: 12 },
                    { type: 'KOPINICI', col: 10, row: 12 },
                    { type: 'KOPINICI', col: 11, row: 12 },
                    { type: 'KOPINICI', col: 12, row: 12 },
                    { type: 'HALAPARTNICI', col: 5, row: 12 },
                    { type: 'HALAPARTNICI', col: 13, row: 12 },
                    // Pražští střelci
                    { type: 'KUSNICI', col: 5, row: 11 },
                    { type: 'KUSNICI', col: 13, row: 11 },
                    { type: 'KUSNICI', col: 6, row: 11 },
                    { type: 'KUSNICI', col: 12, row: 11 },
                    // Záloha pěchoty
                    { type: 'KOPINICI', col: 7, row: 13 },
                    { type: 'KOPINICI', col: 8, row: 13 },
                    { type: 'KOPINICI', col: 10, row: 13 },
                    { type: 'KOPINICI', col: 11, row: 13 }
                ]
            }
        },

        phases: [
            {
                id: 1,
                name: "Zaujmutí pozic",
                turnRange: [1,2],
                description: "Žižka rozpoznává terén s pomocí Roháče a Hvězdy. Husité se opevňují na svahu.",
                events: [
                    {
                        trigger: "turn_1",
                        message: "Jan Roháč: \"Pane hejtmane, máme dobrý svah nad údolím. Potok Bohynka nám kryje střed.\""
                    },
                    {
                        trigger: "turn_2",
                        message: "Jan Hvězda: \"Znám tato místa. Údolí je úzké - nepřítel se nebude moci rozvinout.\""
                    }
                ]
            },
            {
                id: 2,
                name: "Koaliční útok",
                turnRange: [3,5],
                description: "Protižižkovská koalice vrhá jízdu do údolí. Nepřítel se nemůže plně rozvinout.",
                events: [
                    {"trigger":"turn_3","message":"Diviš Bořek: \"Do útoku! Rozdrtíme slepce jednou provždy!\""},
                    {"trigger":"turn_4","message":"Těžká jízda vjíždí do úzkého údolí... Řady se tísní!"},
                    {
                        trigger: "turn_5",
                        type: "terrain_penalty",
                        faction: "crusaders",
                        text: "Jízda ztrácí hybnost v bažinatém údolí!"
                    }
                ]
            },
            {
                id: 3,
                name: "Krvavé údolí",
                turnRange: [6,8],
                description: "Palba a tísnivý terén narušují postup útočníků. Obránci hledají chvíli k protiútoku.",
                events: [
                    {"trigger":"turn_6","message":"Houfnice a ručnice pálí do natěsnaných řad nepřítele!"},
                    {"trigger":"turn_7","message":"Ztráty koalice rostou! Údolí se barví krví!"},
                    {
                        trigger: "turn_8",
                        type: "morale_drop",
                        faction: "crusaders",
                        amount: 3,
                        text: "Koaliční vojsko ztrácí odvahu v zabijácké palbě."
                    },
                    {
                        trigger: "turn_5",
                        triggerBefore: "turn_10",
                        condition: {
                            type: "units_in_area",
                            faction: "crusaders",
                            area: {"minCol":4,"maxCol":14,"minRow":5,"maxRow":9},
                            minCount: 4
                        },
                        type: "panic",
                        faction: "crusaders",
                        level: 3,
                        title: "Rozvrácené čelo kolony",
                        text: "Natěsnané oddíly se pod palbou nemohou rozvinout. Zmatek v čele kolony podlamuje soudržnost dalších šiků."
                    }
                ]
            },
            {
                id: 4,
                name: "Žižkův protiútok",
                turnRange: [9,11],
                description: "Žižka nařizuje smrtící protiútok ze svahu dolů.",
                events: [
                    {"trigger":"turn_9","message":"Žižka: \"Teď! Dolů z kopce! Za pravdu Boží!\""},
                    {"trigger":"turn_10","message":"Husitská jízda a pěchota se řítí ze svahu na dezorientovaného nepřítele!"},
                    {
                        trigger: "turn_11",
                        type: "charge_bonus",
                        faction: "hussites",
                        amount: 15,
                        text: "Útok z kopce! +15% k útoku husitských jednotek."
                    }
                ]
            },
            {
                id: 5,
                name: "Zhroucení koalice",
                turnRange: [12,15],
                description: "Koaliční vojsko se hroutí. Zadní voje prchají bez boje.",
                events: [
                    {"trigger":"turn_12","message":"Koalice se hroutí! Muži prchají směrem k Malešovu!"},
                    {"trigger":"turn_13","message":"Diviš Bořek: \"Zpět! Všichni zpět!\" Zadní voje už ani nevstoupily do boje."},
                    {
                        trigger: "turn_14",
                        message: "O výsledku rozhoduje soudržnost oddílů. Historické odhady padlých nejsou součtem ztrát této partie."
                    },
                    {"trigger":"turn_15","message":"Žižka ovládl bojiště. Cesta na Kutnou Horu je volná!"}
                ]
            }
        ],

        victoryConditions: {
            primary: {
                type: "breakthrough",
                positions: [
                    [8,11],
                    [9,11],
                    [10,11]
                ],
                count: 1,
                deadline: 10,
                description: "Vyrazte ze svahu a prorazte koaliční šik — obsaďte jeho pozici do kola 10"
            },
            secondary: [
                {
                    type: "hold_position",
                    positions: [
                        [7,3],
                        [8,3],
                        [9,3],
                        [10,3]
                    ],
                    description: "Udržte velitelskou pozici na svahu"
                },
                {"type":"survive_commander","description":"Jan Žižka musí přežít"},
                {"type":"max_losses","maxLosses":30,"description":"Ztratit méně než 30% vlastních jednotek"}
            ]
        },

        debriefing: {
            victory: "Koaliční obrana je prolomena! V této partii uspěl váš postup ze svahu. Historicky vítězství u Malešova otevřelo Žižkovi cestu ke Kutné Hoře. Pozdější příběh o vozech s kamením není spolehlivě doloženým vysvětlením tohoto úspěchu.",
            defeat: "Koalice odrazila váš postup. Žižkovo východočeské vojsko se musí stáhnout. Tato partie se rozešla s historickým výsledkem; označení sirotci se pro část jeho následovníků ujalo až po Žižkově smrti."
        },

        maxTurns: 15,
        playerFaction: 'hussites'
    }
};

// Pomocné funkce pro práci se scénáři
const ScenarioManager = {
    // Získání seznamu všech scénářů
    getScenarioList: function() {
        return Object.values(Scenarios).map(s => {
            // Aplikuj lokalizaci pokud je dostupná
            const localized = (typeof getLocalizedScenario === 'function')
                ? getLocalizedScenario(s.id, s)
                : s;

            return {
                id: localized.id,
                name: localized.name,
                date: localized.date,
                difficulty: localized.difficulty,
                description: localized.description
            };
        });
    },

    // Získání konkrétního scénáře
    getScenario: function(id) {
        const baseScenario = Scenarios[id];
        if (!baseScenario) return null;

        // Aplikuj lokalizaci pokud je dostupná
        if (typeof getLocalizedScenario === 'function') {
            return getLocalizedScenario(id, baseScenario);
        }

        return baseScenario;
    },

    // Vytvoření terénu pro scénář
    applyScenarioTerrain: function(hexGrid, scenario) {
        const terrain = scenario.terrain;

        // Projít všechny hexy a nastavit výchozí terén
        for (const [key, hex] of hexGrid.hexes) {
            hex.terrain = 'plains';
        }

        // Aplikovat specifické terény (s převodem souřadnic pro okrajové hexagony)
        for (const [terrainType, positions] of Object.entries(terrain)) {
            if (terrainType === 'plains' || !Array.isArray(positions)) continue;

            for (const [col, row] of positions) {
                // Převod souřadnic ze scénáře na skutečné souřadnice mapy
                const mapped = hexGrid.scenarioToMap(col, row);
                const hex = hexGrid.getHex(mapped.col, mapped.row);
                if (hex) {
                    hex.terrain = terrainType;
                }
            }
        }
    },

    // Vytvoření jednotek pro scénář
    createScenarioUnits: function(scenario, unitFactory, hexGrid) {
        const units = [];

        // Husitské jednotky
        for (const unitDef of scenario.forces.hussites.units) {
            try {
                // Převod souřadnic ze scénáře na skutečné souřadnice mapy
                const mapped = hexGrid.scenarioToMap(unitDef.col, unitDef.row);
                const unit = unitFactory.createUnit(unitDef.type, mapped.col, mapped.row);
                // Strana ve scénáři přebíjí frakci šablony (např. Diviš Bořek je
                // husitská šablona, ale u Lipan velí straně protivníka)
                unit.faction = 'hussites';
                // WP1: volitelný startovní stav hradby (default sepnuto; 'open' = rozpojeno)
                if (unit.isWagon() && unitDef.formation === 'open') unit.formationClosed = false;
                units.push(unit);
            } catch (e) {
                console.error(`Failed to create hussite unit: ${unitDef.type}`, e);
            }
        }

        // Křižácké jednotky
        for (const unitDef of scenario.forces.crusaders.units) {
            try {
                // Převod souřadnic ze scénáře na skutečné souřadnice mapy
                const mapped = hexGrid.scenarioToMap(unitDef.col, unitDef.row);
                const unit = unitFactory.createUnit(unitDef.type, mapped.col, mapped.row);
                unit.faction = 'crusaders';
                // WP1: volitelný startovní stav hradby (default sepnuto; 'open' = rozpojeno)
                if (unit.isWagon() && unitDef.formation === 'open') unit.formationClosed = false;
                units.push(unit);
            } catch (e) {
                console.error(`Failed to create crusader unit: ${unitDef.type}`, e);
            }
        }

        return units;
    },

    // Kontrola událostí fáze - vrací seznam eventů pro daný tah
    // game parametr je volitelný - potřebný pro podmíněné eventy
    checkPhaseEvents: function(scenario, turn, game) {
        const events = [];
        for (const phase of scenario.phases) {
            if (turn >= phase.turnRange[0] && turn <= phase.turnRange[1]) {
                for (let i = 0; i < phase.events.length; i++) {
                    const event = phase.events[i];
                    const eventId = event.id || `phase${phase.id}_evt${i}`;

                    // Podmíněný event: trigger je nejdřívější kolo, triggerBefore nejpozdější
                    if (event.condition) {
                        const triggerFrom = event.trigger ? parseInt(event.trigger.replace('turn_', '')) : phase.turnRange[0];
                        const triggerTo = event.triggerBefore ? parseInt(event.triggerBefore.replace('turn_', '')) : phase.turnRange[1];
                        if (turn < triggerFrom || turn > triggerTo) continue;

                        // Kontrola podmínky - potřebuje game objekt
                        if (!game || !this.checkEventCondition(game, event.condition)) continue;
                    } else {
                        // Standardní event - přesná shoda kola
                        if (event.trigger !== `turn_${turn}`) continue;
                    }

                    // Zachovej celý datový kontrakt eventu. Ruční výčet polí dříve
                    // zahazoval např. amount a vlastní title, takže se Malešov místo
                    // -15 morálky/+15 % útoku tiše přepočítal na defaultní hodnoty.
                    events.push({
                        ...event,
                        turn,
                        type: event.type || 'message',
                        id: eventId,
                        title: event.title || phase.name,
                        text: event.text || event.message,
                        area: event.area || event.condition?.area
                    });
                }
            }
        }
        return events;
    },

    // Kontrola podmínky eventu
    checkEventCondition: function(game, condition) {
        switch (condition.type) {
            case 'closed_wagons':
                return game.units.filter(unit => unit.faction === condition.faction &&
                    unit.health > 0 && unit.isWagon?.() && unit.formationClosed).length >= (condition.minCount || 1);
            case 'ready_units': {
                const area = condition.area;
                const ready = game.units.filter(u =>
                    u.faction === condition.faction && u.health > 0 && !u.isRouting && !u.escaped &&
                    (!area || (u.col >= area.minCol && u.col <= area.maxCol &&
                               u.row >= area.minRow && u.row <= area.maxRow))
                );
                return ready.length >= (condition.minCount ?? 1) &&
                    (!condition.requiredType || ready.some(u => u.type === condition.requiredType));
            }
            case 'units_in_area': {
                const area = condition.area;
                const count = game.units.filter(u =>
                    u.faction === condition.faction &&
                    u.health > 0 &&
                    u.col >= area.minCol && u.col <= area.maxCol &&
                    u.row >= area.minRow && u.row <= area.maxRow
                ).length;
                return count >= (condition.minCount || 1);
            }
            case 'no_units_in_area': {
                const area = condition.area;
                const count = game.units.filter(u =>
                    u.faction === condition.faction &&
                    u.health > 0 &&
                    u.col >= area.minCol && u.col <= area.maxCol &&
                    u.row >= area.minRow && u.row <= area.maxRow
                ).length;
                return count === 0;
            }
            case 'faction_losses_percent': {
                const initial = condition.faction === (game.currentScenario?.playerFaction || 'hussites')
                    ? game.initialPlayerUnits
                    : game.initialEnemyUnits;
                const current = game.units.filter(u => u.faction === condition.faction && u.health > 0).length;
                const lossPercent = ((initial - current) / initial) * 100;
                return lossPercent >= (condition.percent || 50);
            }
            case 'units_routing': {
                const area = condition.area;
                const routingCount = game.units.filter(u =>
                    u.faction === condition.faction &&
                    u.health > 0 &&
                    u.isRouting &&
                    (!area || (u.col >= area.minCol && u.col <= area.maxCol &&
                               u.row >= area.minRow && u.row <= area.maxRow))
                ).length;
                return routingCount >= (condition.minCount || 1);
            }
            default:
                return true;
        }
    },

    // Získání aktuální fáze
    getCurrentPhase: function(scenario, turn) {
        for (const phase of scenario.phases) {
            if (turn >= phase.turnRange[0] && turn <= phase.turnRange[1]) {
                return phase;
            }
        }
        return scenario.phases[scenario.phases.length - 1];
    },

    // Kontrola posil - vrací seznam posil pro daný tah a frakci
    checkReinforcements: function(scenario, turn, faction) {
        const forces = scenario.forces[faction];
        const reinforcements = [];

        if (forces.reinforcements && forces.reinforcements.turn === turn) {
            // Stará struktura - jednotlivé posily
            for (const unitDef of forces.reinforcements.units) {
                reinforcements.push({
                    turn: turn,
                    type: unitDef.type,
                    position: [unitDef.col, unitDef.row],
                    count: 1
                });
            }
        }

        return reinforcements;
    }
};
