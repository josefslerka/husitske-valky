// Systém jednotek - definice typů jednotek a jejich vlastností

// Typy jednotek podle armada.md
const UnitTypes = {
    // ==========================================
    // HUSITSKÉ JEDNOTKY
    // ==========================================

    // Pěchota
    CEPNICI: {
        id: 'cepnici',
        name: 'Cepníci',
        faction: 'hussites',
        symbol: '⚔',
        maxHealth: 80,
        attack: 35,
        defense: 20,
        range: 1,
        movement: 2,
        cost: 40,
        description: 'Husitská pěchota s bojovými cepy. Drtivý úder proti obrněným.',
        special: 'armorPiercing', // +30% poškození proti obrněným (jízda)
        unitClass: 'infantry',
        lore: {
            description: "Pěšáci s bojovými cepy upravenými ze zemědělského nářadí. Ve hře se hodí proti obrněným protivníkům, ale potřebují ochranu před střelbou.",
            equipment: "Okovaný cep, přilba a lehká ochranná výstroj; krátká záložní zbraň.",
            origin: "Husitské pěší houfy.",
            historicalNote: "Bojový cep je doloženou zbraní husitské pěchoty. Bonus proti obrněným je herní zjednodušení, ne údaj z kroniky."
        },
        tactics: {
            terrain: {
                forest: 10,
                hill: 0,
                water: -20,
                road: 0,
                village: 10
            },
            attackTerrain: {
                forest: 15,
                hill: 10,
                water: -30,
                road: 0,
                village: 5
            },
            weaknesses: ['ranged', 'cavalry_charge'],
            zoc: true,
            canRetreat: true
        }
    },
    SUDLICNICI: {
        id: 'sudlicnici',
        name: 'Sudličníci',
        faction: 'hussites',
        symbol: '⚔',
        maxHealth: 75,
        attack: 30,
        defense: 20,
        range: 1,
        movement: 2,
        cost: 40,
        description: 'Pěchota s tyčovými zbraněmi. Na vzdálenějšího nepřítele dosáhne jen přes spojence.',
        special: 'reach', // Může útočit přes sousední jednotku
        unitClass: 'infantry',
        lore: {
            description: "Pěšáci s dlouhými tyčovými zbraněmi. Herní schopnost Dosah jim umožňuje za určitých podmínek útočit přes spolubojovníka.",
            equipment: "Sudlice či jiná tyčová zbraň, přilba, krátká záložní zbraň.",
            origin: "Husitské pěší houfy a městská domobrana.",
            historicalNote: "Podoby tyčových zbraní i jejich označení se lišily. Herní typ nezastupuje jednotně vyzbrojený pluk."
        },
        tactics: {
            terrain: {
                forest: -10,
                hill: 10,
                water: -15,
                road: 0,
                village: -5
            },
            attackTerrain: {
                forest: -15,
                hill: 20,
                water: -25,
                road: 0,
                village: 0
            },
            weaknesses: ['close_combat', 'flanking'],
            zoc: true,
            canRetreat: true
        }
    },
    PAVEZNICI: {
        id: 'paveznici',
        name: 'Pavézníci',
        faction: 'hussites',
        symbol: '🛡',
        maxHealth: 70,
        attack: 15,
        defense: 35,
        range: 1,
        movement: 2,
        cost: 30,
        description: 'Obránci s velkými pavézami. Chrání sousední střelce.',
        special: 'shieldWall', // +20% obrana sousedním střelcům
        unitClass: 'infantry',
        lore: {
            description: "Pěšáci s velkými štíty. Ve hře chrání sousední střelce, kteří jsou jinak zranitelní v boji zblízka.",
            equipment: "Pavéza, přilba a krátká zbraň pro osobní obranu.",
            origin: "Pěší oddíly husitských vojsk.",
            historicalNote: "Ochrana sousedních střelců je způsob, jak hra modeluje spolupráci štítonošů a střelců. Nejde o přesný dobový organizační předpis."
        },
        tactics: {
            terrain: {
                forest: -10,
                hill: 5,
                water: -20,
                road: 0,
                village: 15
            },
            weaknesses: ['artillery', 'flanking'],
            zoc: true,
            canRetreat: true
        }
    },
    KOPINICI_HUSITI: {
        id: 'kopinici_husiti',
        name: 'Kopiníci',
        faction: 'hussites',
        symbol: '⚑',
        maxHealth: 75,
        attack: 28,
        defense: 25,
        range: 1,
        movement: 2,
        cost: 40,
        description: 'Pěchota s dlouhými kopími. Efektivní proti jízdě.',
        special: 'antiCavalry', // +50% poškození proti jízdě
        unitClass: 'infantry',
        lore: {
            description: "Pěchota s dlouhými kopími. Ve hře pomáhá držet linii proti jízdě a chránit zranitelnější oddíly.",
            equipment: "Dlouhé kopí, přilba, ochranný oděv a krátká záložní zbraň.",
            origin: "Pěší oddíly husitských vojsk.",
            historicalNote: "Účinek proti jízdě závisel i na soudržnosti šiku a terénu. Číselný bonus je herní pravidlo, nikoli doložený Žižkův výrok."
        },
        tactics: {
            terrain: {
                forest: -20,
                hill: 15,
                water: -10,
                road: 0,
                village: 0
            },
            weaknesses: ['ranged', 'flanking', 'infantry_close'],
            zoc: true,
            canRetreat: false
        }
    },

    // Střelci
    KUSINICI_HUSITI: {
        id: 'kusinici_husiti',
        name: 'Kušiníci',
        faction: 'hussites',
        symbol: '➶',
        maxHealth: 50,
        attack: 30,
        defense: 12,
        range: 3,
        movement: 2,
        cost: 50,
        description: 'Střelci s kušemi. Průbojné šipky.',
        special: 'armorPiercing', // Ignoruje část obrany
        unitClass: 'ranged',
        lore: {
            description: "Střelci s kušemi. Potřebují čas a kryt k nabíjení; ve hře je chrání vozy nebo pavézníci.",
            equipment: "Kuše, šipky, napínací pomůcka a krátká záložní zbraň.",
            origin: "Střelecké oddíly husitských vojsk.",
            historicalNote: "Archeologické nálezy ze Sionu dokládají také pomůcky k napínání kuší. Průbojnost nelze převést na jeden univerzální údaj pro každou kuši a zbroj."
        },
        tactics: {
            terrain: {
                forest: 10,
                hill: 15,
                water: -20,
                road: 0,
                village: 10
            },
            attackTerrain: {
                forest: 5,
                hill: 25,
                water: -30,
                road: 0,
                village: 10
            },
            weaknesses: ['cavalry', 'close_combat'],
            zoc: false,
            canRetreat: true
        }
    },
    RUCNICARI: {
        id: 'rucnicari',
        name: 'Střelci z ručnic',
        faction: 'hussites',
        symbol: '💥',
        maxHealth: 45,
        attack: 35,
        defense: 8,
        range: 2,
        movement: 2,
        cost: 60,
        description: 'Střelci s palnými zbraněmi. Děsí nepřítele.',
        special: 'terror', // -10% útok nepříteli v příštím tahu
        unitClass: 'ranged',
        lore: {
            description: "Střelci s ranými ručními palnými zbraněmi. Ve hře jejich zásah oslabuje útok protivníka.",
            equipment: "Ručnice či píšťala, střelný prach, střely a potřeby k zapálení nálože.",
            origin: "Střelecké oddíly husitských vojsk.",
            historicalNote: "Ručnice i jejich střely jsou doložené nálezy ze Sionu. To samo nepotvrzuje jejich přítomnost v každé dřívější bitvě; rozmístění herních oddílů je rekonstrukce."
        },
        tactics: {
            terrain: {
                forest: -10,
                hill: 10,
                water: -30,
                road: 0,
                village: 5
            },
            weaknesses: ['rain', 'close_combat', 'cavalry'],
            zoc: false,
            canRetreat: true
        }
    },

    // Dělostřelectvo
    HOUFNICE: {
        id: 'houfnice',
        name: 'Houfnice',
        faction: 'hussites',
        symbol: '💣',
        maxHealth: 40,
        attack: 50,
        defense: 5,
        range: 4,
        movement: 1,
        cost: 100,
        description: 'Polní dělo. Devastující plošný útok.',
        special: 'areaAttack', // Zásah sousedních jednotek (50% poškození)
        unitClass: 'artillery',
        lore: {
            description: "Polní dělo s krátkou hlavní. Ve hře zasahuje více oddílů v cílové oblasti, ale po přesunu už v témže tahu nevystřelí.",
            equipment: "Dělová hlaveň na lafetě, střelný prach, střely a vybavení obsluhy.",
            origin: "Dělostřelecké oddíly husitských vojsk.",
            historicalNote: "Kamenné střely ze Sionu dokládají dobové dělostřelectvo. Herní plošný účinek a pořadí akcí nejsou přesným přepočtem historické rychlosti palby."
        },
        tactics: {
            terrain: {
                forest: -30,
                hill: 20,
                water: null,
                road: 10,
                village: 0
            },
            weaknesses: ['cavalry', 'flanking', 'close_combat', 'capture'],
            zoc: false,
            canRetreat: false
        }
    },
    TARASNICE: {
        id: 'tarasnice',
        name: 'Tarasnice',
        faction: 'hussites',
        symbol: '🔫',
        maxHealth: 45,
        attack: 40,
        defense: 8,
        range: 3,
        movement: 2,
        cost: 70,
        description: 'Mobilní dělo. Může střílet po pohybu.',
        special: 'mobile', // Může střílet po pohybu
        unitClass: 'artillery',
        lore: {
            description: "Dělo menší ráže pro přímou palbu. Herní oddíl je pohyblivější než houfnice a může se v jednom tahu přesunout i vystřelit.",
            equipment: "Menší dělová hlaveň na podstavci či lafetě, střelný prach a střely.",
            origin: "Dělostřelecké oddíly.",
            historicalNote: "Mobilita je vlastností tohoto herního typu. Neznamená to, že všechny historické tarasnice střílely za jízdy nebo měly stejné provedení."
        },
        tactics: {
            terrain: {
                forest: -20,
                hill: 10,
                water: null,
                road: 15,
                village: 5
            },
            weaknesses: ['cavalry', 'close_combat'],
            zoc: false,
            canRetreat: true
        }
    },

    // Pevné opevnění s posádkou. Není vůz: nelze je rozpojit ani přesouvat.
    POLNI_OPEVNENI: {
        id: 'polni_opevneni',
        name: 'Posádka srubu',
        faction: 'hussites',
        symbol: '▥',
        maxHealth: 100,
        attack: 25,
        defense: 40,
        range: 2,
        movement: 0,
        cost: 120,
        description: 'Obránci pevného srubu a zídky. Střílejí z krytu, ale nemohou se přesouvat.',
        special: 'fieldwork',
        unitClass: 'fortification',
        lore: {
            description: 'Na Vítkově bránili husité pevná opevnění, nikoli pojízdnou vozovou hradbu. Herní oddíl představuje jejich posádku a kryt společně.',
            equipment: 'Dřevěný srub, zídka, kuše a tyčové zbraně obránců',
            origin: 'Obrana Vítkova, 1420',
            historicalNote: 'Rozmístění posádek je herní rekonstrukce. Historický rámec a odkazy uvádí poznámka ke scénáři.'
        },
        tactics: { terrain: {}, weaknesses: ['artillery'], zoc: true, canRetreat: false }
    },

    // Speciální jednotky
    VOZOVA_HRADBA: {
        id: 'vozova_hradba',
        name: 'Bojový vůz',
        faction: 'hussites',
        symbol: '▣',
        maxHealth: 100,
        attack: 25,
        defense: 40,
        range: 2,
        movement: 1,
        cost: 120,
        description: 'Opevněný vůz. Tvoří vozovou hradbu s dalšími vozy.',
        special: 'wagenburg', // Bonus když jsou vozy vedle sebe
        unitClass: 'wagon',
        lore: {
            description: "Bojový vůz poskytuje kryt pěchotě a střelcům. Ve hře jej lze spojovat se sousedními vozy do hradby nebo s celou linií pochodovat.",
            equipment: "Upravený vůz, ochranné desky, spojovací prostředky a zbraně posádky.",
            origin: "Vozové oddíly husitských vojsk.",
            historicalNote: "Vůz ve hře zastupuje vozidlo i posádku. Počet životů, kryt sousedních polí a skupinové rozkazy jsou zjednodušení; nejde o citaci Žižkova řádu."
        },
        tactics: {
            terrain: {
                forest: null,
                hill: -10,
                water: null,
                road: 20,
                village: 10
            },
            weaknesses: ['artillery', 'fire'],
            zoc: true,
            canRetreat: false
        }
    },
    JIZDA_HUSITI: {
        id: 'jizda_husiti',
        name: 'Lehká jízda',
        faction: 'hussites',
        symbol: '🐴',
        maxHealth: 60,
        attack: 28,
        defense: 15,
        range: 1,
        movement: 4,
        cost: 80,
        description: 'Rychlá jízda pro průzkum a pronásledování.',
        special: 'pursuit', // +30% poškození proti prchajícím/oslabeným
        unitClass: 'cavalry',
        lore: {
            description: "Lehčeji vystrojení jezdci pro průzkum, obchvaty a pronásledování. Ve hře dávají přednost volnému prostoru před lesem či bažinou.",
            equipment: "Kopí nebo meč, přilba a lehčí ochranná výstroj.",
            origin: "Jízdní oddíly husitských vojsk.",
            historicalNote: "Husitské vojsko zahrnovalo i jezdectvo. Rozdělení na lehkou a šlechtickou jízdu pomáhá hře odlišit role, ne všechny dobové formy výstroje."
        },
        tactics: {
            terrain: {
                forest: -15,
                hill: -5,
                water: -10,
                road: 20,
                village: 0
            },
            attackTerrain: {
                forest: -20,
                hill: 0,
                water: -20,
                road: 25,
                village: 5
            },
            weaknesses: ['heavy_cavalry', 'spears'],
            zoc: true,
            canRetreat: true
        }
    },

    // U Ústí tvořila významnou část husitské jízdy ozbrojená šlechta.
    // Samostatný typ ji odlišuje od lehkých průzkumných a stíhacích oddílů.
    SLECHTICKA_JIZDA_HUSITI: {
        id: 'slechticka_jizda_husiti',
        name: 'Šlechtická jízda',
        faction: 'hussites',
        symbol: '♞',
        maxHealth: 95,
        attack: 42,
        defense: 25,
        range: 1,
        movement: 3,
        cost: 130,
        description: 'Těžší husitská jízda šlechticů a jejich družin.',
        special: 'charge',
        unitClass: 'heavyCavalry',
        baseMorale: 85,
        lore: {
            description: "Obrnění jezdci husitské šlechty a jejích družin. Ve hře doplňují pěchotu a vozové oddíly údernou jízdou.",
            equipment: "Kopí, meč, přilba a plátové či kroužkové části zbroje.",
            origin: "Husitská šlechta a její ozbrojené družiny.",
            historicalNote: "Vojska husitské strany nebyla složena jen z pěchoty. Přesné zastoupení jednotlivých druhů vojska závisí na bitvě a na nejistých odhadech pramenů."
        },
        tactics: {
            terrain: {
                forest: -20,
                hill: -5,
                water: -15,
                road: 15,
                village: -10
            },
            attackTerrain: {
                forest: -25,
                hill: -10,
                water: -25,
                road: 20,
                village: -10
            },
            weaknesses: ['spears', 'wagenburg', 'firearms'],
            zoc: true,
            canRetreat: true
        }
    },

    // Zvěd - průzkumná jednotka
    POUTNICI: {
        id: 'poutnici',
        name: 'Poutníci',
        faction: 'hussites',
        symbol: '🚶',
        maxHealth: 35,
        attack: 8,       // chabě ozbrojený houf (hole, cepy) - skoro civilisté
        defense: 10,
        range: 1,
        movement: 2,
        vision: 3,
        cost: 0,
        description: 'Bezbranní poutníci — muži, ženy i děti s holemi. Chraň je: jsou to civilisté, ne vojáci.',
        special: null,
        unitClass: 'infantry',
        abilities: {},
        lore: {
            description: "Účastníci husitských náboženských poutí. Ve hře zastupují zranitelnou část houfu, kterou mají ozbrojené oddíly chránit.",
            equipment: "Cestovní hole a dostupné nářadí; ochranná výstroj je omezená.",
            origin: "Poutnické houfy z jihozápadních Čech.",
            historicalNote: "Oddíl není pravidelná bojová jednotka. Jeho síla a výzbroj slouží hernímu modelu ochrany poutníků, nikoli přesnému soupisu účastníků."
        },
        tactics: {
            terrain: { forest: 5, hill: 10, water: 0, road: 0, village: 5 },
            weaknesses: ['cavalry', 'any_combat'],
            zoc: false,
            canRetreat: true
        }
    },

    ZVED: {
        id: 'zved',
        name: 'Zvěd',
        faction: 'hussites',
        symbol: '🏇',
        maxHealth: 30,
        attack: 10,
        defense: 15,
        range: 1,
        movement: 5,
        vision: 6, // Speciální viditelnost - 6 hexů
        cost: 50,
        description: 'Lehký jezdec pro průzkum. Vidí na 6 hexů, může rychle ustoupit.',
        special: 'scout', // Speciální schopnosti zvěda
        unitClass: 'cavalry',
        abilities: {
            quickEscape: true,    // Rychlý únik - po přežití útoku se může přesunout o 2 hexy
            hiddenMovement: true, // Skrytý pohyb - v lese/kopcích ho nepřítel vidí jen na 2 hexy
            revealHidden: true    // Odhalení - vidí skryté nepřátelské jednotky
        },
        lore: {
            description: "Jezdecký průzkumník. Ve hře vidí dál než většina ostatních oddílů a dokáže rychle přenášet pozornost na jiné křídlo.",
            equipment: "Kůň, lehká výstroj a osobní zbraň.",
            origin: "Průzkumníci a poslové husitského vojska.",
            historicalNote: "Zvěd je samostatný typ kvůli průzkumu v mlze války. Herní dosah vidění není historicky měřená vlastnost vojáků."
        },
        tactics: {
            terrain: {
                forest: 20,
                hill: 15,
                water: 5,
                road: 10,
                village: 10
            },
            weaknesses: ['any_combat'],
            zoc: false,
            canRetreat: true
        }
    },

    // ==========================================
    // KŘIŽÁCKÉ JEDNOTKY
    // ==========================================

    // Jízda
    TEZKY_RYTIR: {
        id: 'tezky_rytir',
        name: 'Rytířská jízda',
        faction: 'crusaders',
        symbol: '♞',
        maxHealth: 110,
        attack: 50,
        defense: 30,
        range: 1,
        movement: 3,
        cost: 150,
        description: 'Elitní obrněná jízda. Devastující náraz.',
        special: 'charge', // +50% útok při útoku z pohybu
        unitClass: 'heavyCavalry',
        lore: {
            description: "Obrněná jízda s kopími. Ve hře je nebezpečná při nárazu na volném prostranství, méně se jí daří v těžkém terénu.",
            equipment: "Kopí, meč, přilba a zbroj; ochrana koně se mohla lišit.",
            origin: "Šlechtické družiny a další obrnění jezdci.",
            historicalNote: "Rytíř označuje také společenské postavení, ne přesný stupeň zbroje. Herní typ Rytířská jízda vyjadřuje bojovou roli."
        },
        tactics: {
            terrain: {
                forest: null,
                hill: -10,
                water: -15,
                road: 15,
                village: -10
            },
            attackTerrain: {
                forest: null,
                hill: -20,
                water: -30,
                road: 20,
                village: -15
            },
            weaknesses: ['spears', 'wagenburg', 'firearms', 'terrain'],
            zoc: true,
            canRetreat: false
        }
    },
    TEZKOODENCI: {
        id: 'tezkoodenci',
        name: 'Těžkooděnci',
        faction: 'crusaders',
        symbol: '♘',
        maxHealth: 90,
        attack: 38,
        defense: 28,
        range: 1,
        movement: 3,
        cost: 100,
        description: 'Obrněná jízda. Náraz při útoku z pohybu.',
        special: 'charge', // +30% útok při útoku z pohybu
        unitClass: 'heavyCavalry',
        lore: {
            description: "Obrnění jezdci, ve hře odlišení od údernější rytířské jízdy. Mohou chránit křídlo nebo navázat na útok jiného oddílu.",
            equipment: "Kopí, meč, přilba a kroužkové či plátové části zbroje.",
            origin: "Šlechtické družiny a placení ozbrojenci.",
            historicalNote: "Rozhraní mezi druhy jízdní výstroje nebylo pevné. Dvě herní kategorie nejsou dobovým předpisem pro rozdělení vojska."
        },
        tactics: {
            terrain: {
                forest: -20,
                hill: -5,
                water: -10,
                road: 10,
                village: -5
            },
            weaknesses: ['spears', 'wagenburg', 'firearms'],
            zoc: true,
            canRetreat: true
        }
    },
    LEHKA_JIZDA: {
        id: 'lehka_jizda',
        name: 'Lehká jízda',
        faction: 'crusaders',
        symbol: '🐎',
        maxHealth: 55,
        attack: 25,
        defense: 12,
        range: 1,
        movement: 5,
        cost: 70,
        description: 'Rychlá jízda pro průzkum a obchvaty.',
        special: 'pursuit', // +30% poškození proti oslabeným
        unitClass: 'cavalry',
        lore: {
            description: "Rychlí jezdci pro průzkum, obchvaty a pronásledování. Ve hře využívají volné cesty a mezery mezi nepřátelskými oddíly.",
            equipment: "Kopí či meč, přilba a lehčí ochranná výstroj.",
            origin: "Jízdní oddíly protivníka.",
            historicalNote: "Označení lehká jízda shrnuje různé podoby výstroje. Nelze je automaticky ztotožnit s pozdějšími rejtary nebo jednotným národním typem."
        },
        tactics: {
            terrain: {
                forest: -10,
                hill: 0,
                water: -5,
                road: 20,
                village: 0
            },
            weaknesses: ['heavy_cavalry', 'spears'],
            zoc: true,
            canRetreat: true
        }
    },

    // Zvěd - průzkumná jednotka křižáků
    ZVED_KRIZACI: {
        id: 'zved_krizaci',
        name: 'Zvěd',
        faction: 'crusaders',
        symbol: '🏇',
        maxHealth: 30,
        attack: 10,
        defense: 15,
        range: 1,
        movement: 5,
        vision: 6, // Speciální viditelnost - 6 hexů
        cost: 50,
        description: 'Lehký jezdec pro průzkum. Vidí na 6 hexů, může rychle ustoupit.',
        special: 'scout', // Speciální schopnosti zvěda
        unitClass: 'cavalry',
        abilities: {
            quickEscape: true,    // Rychlý únik
            hiddenMovement: true, // Skrytý pohyb
            revealHidden: true    // Odhalení
        },
        lore: {
            description: "Jezdecký průzkumník protivníka. Ve hře hledá přístupy a pomáhá odhalovat rozestavení vašich oddílů.",
            equipment: "Kůň, lehká výstroj a osobní zbraň.",
            origin: "Průzkumníci a poslové protivníkova vojska.",
            historicalNote: "Samostatný žeton zvěda slouží pravidlům viditelnosti. Neznamená jednotnou výstroj všech dobových průzkumníků."
        },
        tactics: {
            terrain: {
                forest: 20,
                hill: 15,
                water: 5,
                road: 10,
                village: 10
            },
            weaknesses: ['any_combat'],
            zoc: false,
            canRetreat: true
        }
    },

    // Pěchota
    KOPINICI: {
        id: 'kopinici',
        name: 'Kopiníci',
        faction: 'crusaders',
        symbol: '⚑',
        maxHealth: 80,
        attack: 25,
        defense: 28,
        range: 1,
        movement: 2,
        cost: 40,
        description: 'Pěchota s dlouhými kopími. Obranný ježek proti jízdě.',
        special: 'antiCavalry', // +50% obrana proti jízdě
        unitClass: 'infantry',
        lore: {
            description: "Pěchota s dlouhými kopími. Ve hře drží linii proti jízdě a kryje střelce nebo děla.",
            equipment: "Dlouhé kopí, přilba, ochranný oděv a krátká záložní zbraň.",
            origin: "Městská domobrana a placené pěší oddíly.",
            historicalNote: "Stejná zbraň neznamenala stejný výcvik ani odhodlání. Herní statistiky tyto rozdíly shrnují do jednoho typu."
        },
        tactics: {
            terrain: {
                forest: -20,
                hill: 10,
                water: -10,
                road: 0,
                village: 0
            },
            weaknesses: ['ranged', 'artillery', 'flanking'],
            zoc: true,
            canRetreat: false
        }
    },
    HALAPARTNICI: {
        id: 'halapartnici',
        name: 'Halapartníci',
        faction: 'crusaders',
        symbol: '⚔',
        maxHealth: 75,
        attack: 35,
        defense: 20,
        range: 1,
        movement: 2,
        cost: 50,
        description: 'Pěchota s halapardami. Strhává jezdce z koní.',
        special: 'dismount', // Šance sesadit jezdce (zpomalení)
        unitClass: 'infantry',
        lore: {
            description: "Pěšáci s halapartnami či příbuznými tyčovými zbraněmi. Ve hře představují silnější oddíl pro boj zblízka.",
            equipment: "Halapartna, přilba, krátká záložní zbraň a různá ochranná výstroj.",
            origin: "Městští a najatí pěší ozbrojenci.",
            historicalNote: "VHÚ představuje halapartníky kolem roku 1421 jako možnou rekonstrukci. To nedokládá jejich přesnou četnost v každé bitvě; herní počty nejsou historický soupis."
        },
        tactics: {
            terrain: {
                forest: -10,
                hill: 5,
                water: -10,
                road: 0,
                village: 5
            },
            weaknesses: ['ranged', 'flanking'],
            zoc: true,
            canRetreat: true
        }
    },
    PAVEZNICI_KRIZACI: {
        id: 'paveznici_krizaci',
        name: 'Pavézníci',
        faction: 'crusaders',
        symbol: '🛡',
        maxHealth: 70,
        attack: 12,
        defense: 32,
        range: 1,
        movement: 2,
        cost: 30,
        description: 'Obránci s velkými štíty. Chrání střelce.',
        special: 'shieldWall',
        unitClass: 'infantry',
        lore: {
            description: "Pěšáci s velkými štíty. Ve hře chrání sousední střelce stejně jako pavézníci na husitské straně.",
            equipment: "Pavéza, přilba a krátká zbraň pro osobní obranu.",
            origin: "Pěší oddíly protivníka.",
            historicalNote: "Barevnost štítu na žetonu označuje herní stranu. Není přesným vyobrazením konkrétního dochovaného štítu."
        },
        tactics: {
            terrain: {
                forest: -10,
                hill: 5,
                water: -20,
                road: 0,
                village: 15
            },
            weaknesses: ['artillery', 'flanking'],
            zoc: true,
            canRetreat: true
        }
    },

    // Střelci
    KUSNICI_JANOV: {
        id: 'kusnici_janov',
        name: 'Janovští kušiníci',
        faction: 'crusaders',
        symbol: '➶',
        maxHealth: 55,
        attack: 38,
        defense: 12,
        range: 3,
        movement: 2,
        cost: 60,
        description: 'Elitní žoldnéřští střelci z Janova.',
        special: 'elite', // +10% přesnost
        unitClass: 'ranged',
        lore: {
            description: "Ve hře zkušenější žoldnéřský oddíl s kušemi. Je silný při palbě z bezpečné pozice, ale potřebuje ochranu před přímým útokem.",
            equipment: "Kuše, šipky, napínací pomůcka a osobní zbraň.",
            origin: "Herní oddíl označený jako janovští kušiníci.",
            historicalNote: "Vyšší statistiky jsou herním rozlišením zkušenosti. Neprokazují univerzální průbojnost kuší ani přítomnost konkrétní žoldnéřské roty na každém bojišti."
        },
        tactics: {
            terrain: {
                forest: 5,
                hill: 15,
                water: -15,
                road: 0,
                village: 10
            },
            weaknesses: ['cavalry', 'close_combat', 'slow_reload'],
            zoc: false,
            canRetreat: true
        }
    },
    KUSNICI: {
        id: 'kusnici',
        name: 'Kušiníci',
        faction: 'crusaders',
        symbol: '➶',
        maxHealth: 50,
        attack: 32,
        defense: 10,
        range: 3,
        movement: 2,
        cost: 50,
        description: 'Střelci vyzbrojení kušemi.',
        special: null,
        unitClass: 'ranged',
        lore: {
            description: "Střelci s kušemi poskytující palebnou podporu. Ve hře potřebují odstup od nepřítele a chráněnou pozici.",
            equipment: "Kuše, šipky, napínací pomůcka a osobní zbraň.",
            origin: "Městské nebo placené střelecké oddíly.",
            historicalNote: "Kuše vyžadovala opětovné napnutí po výstřelu. Archeologické nálezy ukazují různé napínací pomůcky; herní tah není přesný časový přepočet nabíjení."
        },
        tactics: {
            terrain: {
                forest: 10,
                hill: 15,
                water: -20,
                road: 0,
                village: 10
            },
            weaknesses: ['cavalry', 'close_combat'],
            zoc: false,
            canRetreat: true
        }
    },
    LUCISTNICI: {
        id: 'lucistnici',
        name: 'Lučištníci',
        faction: 'crusaders',
        symbol: '🏹',
        maxHealth: 45,
        attack: 25,
        defense: 8,
        range: 4,
        movement: 2,
        cost: 40,
        description: 'Střelci s dlouhými luky. Rychlostřelba (2 útoky/tah).',
        special: 'rapidFire', // 2 útoky za tah (slabší)
        unitClass: 'ranged',
        lore: {
            description: "Střelci s luky. Ve hře mohou díky schopnosti Rychlá palba útočit dvakrát za tah, ale zůstávají zranitelní zblízka.",
            equipment: "Luk, toulec se šípy a krátká osobní zbraň.",
            origin: "Střelecké oddíly protivníka.",
            historicalNote: "Dva útoky za tah jsou herní rozlišení luku a kuše, ne doložený poměr jejich rychlosti. Konkrétní počty a původ střelců jsou rekonstrukce scénáře."
        },
        tactics: {
            terrain: {
                forest: 10,
                hill: 10,
                water: -10,
                road: 0,
                village: 5
            },
            weaknesses: ['cavalry', 'close_combat', 'armored_targets'],
            zoc: false,
            canRetreat: true
        }
    },

    // Dělostřelectvo
    BOMBARDA: {
        id: 'bombarda',
        name: 'Bombarda',
        faction: 'hussites',  // Husité byli mistry dělostřelectva
        symbol: '💣',
        maxHealth: 35,
        attack: 60,
        defense: 3,
        range: 5,
        movement: 0,
        cost: 140,
        description: 'Těžké obléhací dělo. Ničí opevnění.',
        special: 'siege', // +100% poškození budovám/vozům
        unitClass: 'artillery',
        lore: {
            description: "Těžké dělo určené pro palbu z připraveného postavení. Ve hře se nepohybuje; jeho baterii je třeba chránit jinými oddíly.",
            equipment: "Těžká hlaveň na lafetě, střely, střelný prach a vybavení obsluhy.",
            origin: "Obléhací dělostřelectvo.",
            historicalNote: "Nulový pohyb je zjednodušení práce s těžkou baterií během bitvy. Dostřel a účinek určují pravidla hry, ne jeden známý historický kus."
        },
        tactics: {
            terrain: {
                forest: null,
                hill: 15,
                water: null,
                road: 5,
                village: 0
            },
            weaknesses: ['cavalry', 'close_combat', 'flanking'],
            zoc: false,
            canRetreat: false
        }
    },
    POLNI_DELO: {
        id: 'polni_delo',
        name: 'Polní dělo',
        faction: 'crusaders',
        symbol: '🔫',
        maxHealth: 40,
        attack: 38,
        defense: 5,
        range: 3,
        movement: 1,
        cost: 80,
        description: 'Lehčí polní dělo.',
        special: null,
        unitClass: 'artillery',
        lore: {
            description: "Dělostřelecký oddíl protivníka. Ve hře potřebuje palebný prostor a ochranu před útokem na baterii.",
            equipment: "Dělo na lafetě, střelný prach, střely a vybavení obsluhy.",
            origin: "Dělostřelectvo královských a křižáckých vojsk.",
            historicalNote: "Herní kategorie zjednodušuje různorodé kusy a jejich obsluhu. Neznamená, že všechna děla jedné strany byla stejná nebo horší než děla druhé."
        },
        tactics: {
            terrain: {
                forest: null,
                hill: 15,
                water: null,
                road: 5,
                village: 0
            },
            weaknesses: ['cavalry', 'close_combat'],
            zoc: false,
            canRetreat: true
        }
    },

    // Žoldnéři
    ZOLDNERI: {
        id: 'zoldneri',
        name: 'Žoldnéři',
        faction: 'crusaders',
        symbol: '⚔',
        maxHealth: 75,
        attack: 32,
        defense: 22,
        range: 1,
        movement: 2,
        cost: 80,
        description: 'Zkušení profesionální vojáci.',
        special: 'veteran', // +10% ke všemu
        unitClass: 'infantry',
        lore: {
            description: "Placený pěší oddíl. Ve hře představuje zkušenější bojovníky s různou výzbrojí, ne samostatný druh zbraně.",
            equipment: "Meče, kopí či jiné dostupné zbraně, přilby a ochranná výstroj.",
            origin: "Najatí ozbrojenci.",
            historicalNote: "Žoldnéř označuje způsob služby, nikoli jednotnou národnost, výzbroj nebo morálku. Herní typ tyto rozdíly zjednodušuje."
        },
        tactics: {
            terrain: {
                forest: 0,
                hill: 5,
                water: -5,
                road: 5,
                village: 10
            },
            weaknesses: ['cavalry_charge'],
            zoc: true,
            canRetreat: true
        }
    },

    // ==========================================
    // GENERÁLOVÉ / VELITELÉ
    // ==========================================

    // Jan Žižka z Trocnova - husitský hejtman
    JAN_ZIZKA: {
        id: 'jan_zizka',
        name: 'Jan Žižka',
        faction: 'hussites',
        symbol: '👁',  // Žižka ztratil oko
        maxHealth: 100,
        attack: 40,
        defense: 35,
        range: 1,
        movement: 3,
        cost: 500,
        description: 'Jan Žižka z Trocnova. Husitský hejtman, který velel polnímu vojsku i po ztrátě zraku.',
        special: 'commander',
        unitClass: 'commander',
        baseMorale: 100,
        lore: {
            description: "Jan Žižka z Trocnova patřil k hlavním husitským hejtmanům. Po ztrátě zraku dál vedl polní vojsko; zemřel během tažení roku 1424.",
            equipment: "Zbroj a osobní zbraň; velitelský palcát je známým dobovým symbolem pravomoci.",
            origin: "Trocnov v jižních Čechách.",
            historicalNote: "Jeho velitelská aura je herní způsob znázornění velení. Nedoložené výroky ani pověst o bubnu z jeho kůže zde nepoužíváme jako historický důkaz."
        },
        // Speciální schopnosti velitele
        commanderAbilities: {
            auraRange: 3,           // Dosah velitelské aury
            moraleBonus: 15,        // Bonus k morálce blízkých jednotek
            attackBonus: 5,         // Bonus k útoku
            defenseBonus: 5,        // Bonus k obraně
            wagonBonus: 10,         // Extra bonus pro vozovou hradbu
            rallyBonus: 30,         // Bonus na rally prchajících
            fearRange: 5,           // Dosah efektu strachu na nepřátele
            fearPenalty: 5          // Postih morálky nepřátel
        }
    },

    // Prokop Holý - pro pozdější bitvy
    PROKOP_HOLY: {
        id: 'prokop_holy',
        name: 'Prokop Holý',
        faction: 'hussites',
        symbol: '✝',  // Byl kněz
        maxHealth: 80,
        attack: 25,
        defense: 25,
        range: 1,
        movement: 3,
        cost: 400,
        description: 'Vrchní hejtman táborů. Diplomat a sjednotitel husitských frakcí.',
        special: 'commander',
        unitClass: 'commander',
        baseMorale: 95,
        lore: {
            description: 'Prokop Holý, zvaný též Prokop Veliký (asi 1380-1434), byl kněz a po Žižkově smrti nejvýznamnější husitský vojevůdce. Vedl slavné "spanilé jízdy" do Německa, Rakouska a Uher. Pod jeho vedením husité porazili čtvrtou i pátou křížovou výpravu.',
            equipment: 'Kněžský hábit pod lehkým brněním, meč, modlitební kniha.',
            origin: 'Praha nebo okolí',
            historicalNote: 'Prokop Holý padl v bitvě u Lipan 30. května 1434, kde se husité obrátili proti sobě. Umírnění kališníci porazili radikální tábority a sirotky. Lipany znamenaly konec husitské vojenské moci.'
        },
        commanderAbilities: {
            auraRange: 4,           // Větší dosah - diplomat
            moraleBonus: 20,        // Lepší morálka - charismatický
            attackBonus: 3,
            defenseBonus: 3,
            rallyBonus: 35,         // Výborný v rally
            fearRange: 3,
            fearPenalty: 3
        }
    },

    // Jan Želivský - radikální kněz, SLABÝ velitel
    JAN_ZELIVSKY: {
        id: 'jan_zelivsky',
        name: 'Jan Želivský',
        faction: 'hussites',
        symbol: '✟',  // Kněz
        maxHealth: 60,
        attack: 15,
        defense: 15,
        range: 1,
        movement: 2,
        cost: 200,
        description: 'Radikální pražský kazatel. Charismatický vůdce lidu, ale žádný voják.',
        special: 'commander',
        unitClass: 'commander',
        baseMorale: 85,
        lore: {
            description: 'Jan Želivský (?-1422) byl radikální husitský kněz a demagog. 30. července 1419 vedl průvod k Novoměstské radnici, kde došlo k první pražské defenestraci. Stal se vůdcem pražské chudiny a radikálů, ale nebyl voják.',
            equipment: 'Kněžský hábit, kříž, bible.',
            origin: 'Želiv (?)',
            historicalNote: 'Želivský byl popraven 9. března 1422 na Staroměstské radnici. Údajně ho zradili umírnění pražané, kteří se báli jeho rostoucí moci. Jeho smrt vyvolala lidové nepokoje.'
        },
        commanderAbilities: {
            auraRange: 2,           // Malý dosah - není voják
            moraleBonus: 10,        // Charismatický kazatel
            attackBonus: 0,         // Žádný vojenský bonus
            defenseBonus: 0,
            rallyBonus: 15,         // Slabé rally
            fearRange: 0,           // Nepůsobí strach
            fearPenalty: 0
        }
    },

    // Václav Koranda starší - radikální táborský kazatel (Živohošť 1419)
    VACLAV_KORANDA: {
        id: 'vaclav_koranda',
        name: 'Václav Koranda',
        faction: 'hussites',
        symbol: '☩',  // Kněz
        maxHealth: 60,
        attack: 12,
        defense: 15,
        range: 1,
        movement: 2,
        cost: 180,
        description: 'Radikální táborský kazatel. Kázáním drží i necvičené poutníky v řadách - sám ale žádný voják.',
        special: 'commander',
        unitClass: 'commander',
        baseMorale: 95,
        lore: {
            description: 'Václav Koranda starší byl jedním z nejradikálnějších husitských kazatelů a chiliastů. Roku 1419 vedl radikální obec v Plzni a svolával lid na hory ("tábory"). U Živohoště 4. listopadu 1419 spoluvelel jihočeským poutníkům po boku Břeňka Švihovského.',
            equipment: 'Kněžský hábit, kalich, bible. Žádná pořádná zbraň.',
            origin: 'Plzeňsko',
            historicalNote: 'Pozor na záměnu: Václav Koranda STARŠÍ (radikální kazatel raných válek) není Václav Koranda mladší (pozdější utrakvistický mistr). Staršímu se připisuje výrok z roku 1419, že nadešel čas vzít místo poutnické hole meč - symbol obratu od mírného poutnictví k ozbrojenému boji.'
        },
        commanderAbilities: {
            auraRange: 2,           // Malý dosah - kazatel, ne vojevůdce
            moraleBonus: 12,        // Žhavý kazatel drží zástup pohromadě
            attackBonus: 0,         // Žádný vojenský bonus
            defenseBonus: 0,
            rallyBonus: 20,         // Fanatická víra brání útěku
            fearRange: 0,
            fearPenalty: 0
        }
    },

    // Žatecký hejtman - obecný velitel obrany Žatce (jméno se nedochovalo)
    ZATECKY_HEJTMAN: {
        id: 'zatecky_hejtman',
        name: 'Žatecký hejtman',
        faction: 'hussites',
        symbol: '⚑',
        maxHealth: 90,
        attack: 28,
        defense: 30,
        range: 1,
        movement: 3,
        cost: 300,
        description: 'Velitel žatecké obrany. Jméno se nedochovalo - Žatec ubránila celá obec.',
        special: 'commander',
        unitClass: 'commander',
        baseMorale: 95,
        lore: {
            description: 'Obranu Žatce roku 1421 nevedl žádný doložený hrdina - město ubránila kolektivně jeho posádka a měšťané, na 6000 lidí. Tato bezejmennost je sama o sobě výmluvná: pevnost Slunce držela obec, ne jednotlivec.',
            equipment: 'Městská zbroj, meč, sudlice; obránci měli i kuše a hákovnice.',
            origin: 'Žatec, město Žatecko-lounského svazu',
            historicalNote: 'Žatec patřil k nejmohutnějším pevnostem v Čechách - na ostrožně obtékané ze tří stran Ohří. Posádka odrazila šest útoků 19. září 1421. Město bylo dobře předzásobené; hlad naopak udeřil v křižáckém táboře.'
        },
        commanderAbilities: {
            auraRange: 3,
            moraleBonus: 14,
            attackBonus: 3,
            defenseBonus: 6,        // Velitel obrany - bonus k obraně hradeb
            rallyBonus: 25,
            fearRange: 0,
            fearPenalty: 0
        }
    },

    // Jan Roháč z Dubé - poslední husitský odbojník
    JAN_ROHAC: {
        id: 'jan_rohac',
        name: 'Jan Roháč z Dubé',
        faction: 'hussites',
        symbol: '⚔',  // Válečník do posledního dechu
        maxHealth: 90,
        attack: 35,
        defense: 30,
        range: 1,
        movement: 3,
        cost: 450,
        description: 'Veterán husitských válek, spolubojovník Žižky. Poslední nepokořený husitský velitel.',
        special: 'commander',
        unitClass: 'commander',
        baseMorale: 100,  // Nezlomná vůle
        lore: {
            description: 'Jan Roháč z Dubé (asi 1400-1437) byl věrný Žižkův pobočník a jeden z nejschopnějších husitských hejtmanů. Po Lipanech odmítl přijmout kompaktáta a pokračoval v odporu z hradu Sion u Kutné Hory.',
            equipment: 'Plná zbroj, meč, štít s erbem rodu z Dubé.',
            origin: 'Rod pánů z Dubé, východní Čechy',
            historicalNote: 'Po pádu Sionu 6. září 1437 byl zajatý Roháč se svými druhy 9. září popraven v Praze. Počty popravených se v podáních liší; nelze jej označit za poslední oběť všech husitských bojů.'
        },
        commanderAbilities: {
            auraRange: 3,
            moraleBonus: 20,        // Inspiruje věrné k odporu
            attackBonus: 5,
            defenseBonus: 5,
            lastStandBonus: 15,     // Extra obrana při obraně hradu
            rallyBonus: 35,         // Výborný v rally - veterán
            fearRange: 2,
            fearPenalty: 3
        }
    },

    // Fridrich IV. Bojovný - míšeňský markrabě
    FRIDRICH_MISNENSKY: {
        id: 'fridrich_misnensky',
        name: 'Fridrich IV. Bojovný',
        faction: 'crusaders',
        symbol: '🦅',  // Saský orel
        maxHealth: 85,
        attack: 30,
        defense: 28,
        range: 1,
        movement: 4,
        cost: 400,
        description: 'Míšeňský markrabě. Za vítězství u Mostu povýšen na saského kurfiřta.',
        special: 'commander',
        unitClass: 'commander',
        baseMorale: 85,
        lore: {
            description: 'Fridrich IV. Bojovný (1370-1428) byl míšeňský markrabě a později saský kurfiřt. Jeden z mála velitelů, kteří proti husitům dosáhli úspěchu. Roku 1421 porazil husitský oddíl u Mostu.',
            equipment: 'Plná gotická zbroj, meč, kopí, korouhev se saským erbem.',
            origin: 'Wettinská dynastie, Míšeň',
            historicalNote: 'Za vítězství u Mostu získal roku 1423 od Zikmunda saské kurfiřtství. Titul saského kurfiřta pak Wettinové drželi až do roku 1918.'
        },
        commanderAbilities: {
            auraRange: 3,
            moraleBonus: 10,
            attackBonus: 4,
            defenseBonus: 3,
            cavalryBonus: true,
            rallyBonus: 20,
            fearRange: 3,
            fearPenalty: 4
        }
    },

    // Bohuslav ze Švamberka - katolický hejtman
    BOHUSLAV_SVAMBERK: {
        id: 'bohuslav_svamberk',
        name: 'Bohuslav ze Švamberka',
        faction: 'crusaders',
        symbol: '🦁',  // Šlechtický erb
        maxHealth: 90,
        attack: 35,
        defense: 30,
        range: 1,
        movement: 3,
        cost: 400,
        description: 'Bohuslav ze Švamberka. Katolický hejtman, ve hře velitel části vojska u Sudoměře.',
        special: 'commander',
        unitClass: 'commander',
        baseMorale: 90,
        lore: {
            description: "Bohuslav ze Švamberka byl katolický šlechtic a protivník raných husitských houfů. Ve hře vystupuje v čele části katolického vojska u Sudoměře.",
            equipment: "Zbroj, kopí, meč a štít; přesná osobní výstroj je herní rekonstrukce.",
            origin: "Rod pánů ze Švamberka, západní Čechy.",
            historicalNote: "Počet jezdců u Sudoměře je nejistý. Herní síly a velitelské role představují rekonstrukci, nikoli přesné rozdělení každého historického oddílu."
        },
        commanderAbilities: {
            auraRange: 3,
            moraleBonus: 10,
            attackBonus: 5,
            defenseBonus: 5,
            cavalryBonus: 10,       // Bonus pro jízdu
            rallyBonus: 20,
            fearRange: 3,
            fearPenalty: 3
        }
    },

    // Zikmund Lucemburský - pro pozdější bitvy
    ZIKMUND: {
        id: 'zikmund',
        name: 'Zikmund Lucemburský',
        faction: 'crusaders',
        symbol: '👑',  // Král/císař
        maxHealth: 70,
        attack: 20,
        defense: 25,
        range: 1,
        movement: 3,
        cost: 600,
        description: 'Římský král a pozdější císař. Organizátor křížových výprav proti husitům.',
        special: 'commander',
        unitClass: 'commander',
        baseMorale: 85,
        lore: {
            description: 'Zikmund Lucemburský (1368-1437) byl uherský a římský král, později císař Svaté říše římské. Syn Karla IV. a mladší bratr Václava IV. Hlavní protivník husitů, který proti nim organizoval pět křížových výprav.',
            equipment: 'Honosná zbroj zdobená zlatem, ceremoniální meč, říšská koruna.',
            origin: 'Lucemburská dynastie, Praha',
            historicalNote: 'Zikmund je v české historii kontroverzní postavou. Na jedné straně byl odpovědný za upálení Jana Husa v Kostnici (porušil vlastní glejt), na druhé straně byl schopný diplomat. Nakonec byl roku 1436 přijat za českého krále.'
        },
        commanderAbilities: {
            auraRange: 5,           // Velký dosah - císař
            moraleBonus: 15,
            attackBonus: 2,
            defenseBonus: 2,
            goldBonus: true,        // Může najímat žoldnéře
            rallyBonus: 15,
            fearRange: 4,
            fearPenalty: 2
        }
    },

    // Filippo Scolari (Pipo Spano) - italský kondotiér ve službách Zikmunda
    FILIPPO_SCOLARI: {
        id: 'filippo_scolari',
        name: 'Filippo Scolari',
        faction: 'crusaders',
        symbol: '🏛️',
        maxHealth: 85,
        attack: 35,
        defense: 28,
        range: 1,
        movement: 4,
        cost: 400,
        description: 'Italský kondotiér zvaný Pipo Spano. Velitel uherské jízdy, zkušený vojevůdce.',
        special: 'commander',
        unitClass: 'commander',
        baseMorale: 80,
        lore: {
            description: 'Filippo Scolari (1369-1426), zvaný Pipo Spano nebo Pipo z Ozory, byl florentský obchodník a kondotiér ve službách uherského krále Zikmunda. Stal se jedním z jeho nejschopnějších vojevůdců a správcem sedmihradských zlatých dolů.',
            equipment: 'Italská zbroj, kopí, meč, korouhev s uherským znakem.',
            origin: 'Florencie, Itálie',
            historicalNote: 'Pipo Spano vedl uherské vojsko při tažení do Čech roku 1420. Byl zkušeným válečníkem, který bojoval proti Turkům i v italských válkách. Proti husitské vozové hradbě však jeho jízdní taktika selhávala.'
        },
        commanderAbilities: {
            auraRange: 3,
            moraleBonus: 10,
            attackBonus: 3,
            defenseBonus: 1,
            rallyBonus: 10,
            cavalryBonus: true    // Bonus pro jízdu
        }
    },

    // Heinrich z Isenburgu - velitel míšeňských rytířů u Vítkova
    HEINRICH_ISENBURG: {
        id: 'heinrich_isenburg',
        name: 'Heinrich z Isenburgu',
        faction: 'crusaders',
        symbol: '🏇',  // Jízdní rytíř
        maxHealth: 95,
        attack: 38,
        defense: 32,
        range: 1,
        movement: 4,
        cost: 450,
        description: 'Míšeňský rytíř a velitel útoku na Vítkov. Zkušený válečník.',
        special: 'commander',
        unitClass: 'commander',
        baseMorale: 88,
        lore: {
            description: 'Heinrich z Isenburgu byl míšeňský rytíř a jeden z velitelů křižáckého vojska při obléhání Prahy roku 1420. Vedl osudný útok na Vítkov 14. července 1420.',
            equipment: 'Plná gotická zbroj, kopí, meč, erb rodu z Isenburgu.',
            origin: 'Rod hrabat z Isenburgu, Míšeňsko',
            historicalNote: 'Heinrich z Isenburgu vedl elitní míšeňské rytíře při útoku na Vítkov. Přestože křižáci zpočátku prolomili obranu, Žižkův protiútok je smetl. Mnoho rytířů zahynulo, včetně Heinricha, nebo byli zajati.'
        },
        commanderAbilities: {
            auraRange: 3,
            moraleBonus: 12,
            attackBonus: 6,         // Agresivní velitel
            defenseBonus: 3,
            cavalryBonus: 15,       // Velký bonus pro jízdu
            rallyBonus: 18,
            fearRange: 3,
            fearPenalty: 4
        }
    },

    // Erkinger ze Seinsheim - Zikmundův polní velitel u Žatce (1421)
    ERKINGER_SEINSHEIM: {
        id: 'erkinger_seinsheim',
        name: 'Erkinger ze Seinsheim',
        faction: 'crusaders',
        symbol: '🛡',
        maxHealth: 95,
        attack: 36,
        defense: 34,
        range: 1,
        movement: 3,
        cost: 450,
        description: 'Zikmundův polní velitel u Žatce. Vedl šest útoků na hradby.',
        special: 'commander',
        unitClass: 'commander',
        baseMorale: 85,
        lore: {
            description: 'Erkinger ze Seinsheimu byl franský šlechtic a Zikmundův žoldnéřský velitel. Za druhé křížové výpravy roku 1421 vedl útoky na žatecké hradby. Velel oddílu 300 kopí (glév) - reálně až 1500 mužů.',
            equipment: 'Plátová zbroj, kopí, meč; děla a hákovnice k obléhání.',
            origin: 'Rod ze Seinsheimu, Franky',
            historicalNote: 'Erkinger podnikl proti Žatci šest útoků za použití děl a hákovnic, ale neprorazil ani na předměstí. Za službu mu Zikmund zastavil hrady Žebrák, Točník a město Beroun - na hotovost neměl. Po neúspěchu a požáru ležení se výprava 2. října 1421 stáhla.'
        },
        commanderAbilities: {
            auraRange: 3,
            moraleBonus: 10,
            attackBonus: 5,
            defenseBonus: 4,
            rallyBonus: 15,
            fearRange: 2,
            fearPenalty: 3
        }
    },

    // Fridrich IV. Saský (Bojovný) - velitel u Ústí nad Labem
    FRIDRICH_SASKY: {
        id: 'fridrich_sasky',
        name: 'Fridrich Saský',
        faction: 'crusaders',
        symbol: '🦅',  // Saský orel
        maxHealth: 100,
        attack: 35,
        defense: 30,
        range: 1,
        movement: 4,
        cost: 500,
        description: 'Vévoda saský zvaný Bojovný. Zorganizoval velkou křížovou výpravu roku 1426; polní velení u Ústí ale svěřil kondotiérovi Bosovi z Vitzthumu.',
        special: 'commander',
        unitClass: 'commander',
        baseMorale: 90,
        lore: {
            description: 'Fridrich IV. Bojovný (1370-1428) byl míšeňský markrabě a od roku 1423 saský kurfiřt. Roku 1426 jeho saské vojsko podniklo velkou křížovou výpravu, která skončila katastrofální porážkou u Ústí nad Labem.',
            equipment: 'Honosná gotická zbroj, kopí, meč, korouhev se saským erbem.',
            origin: 'Wettinská dynastie, Sasko',
            historicalNote: 'Bitva u Ústí nad Labem (16. června 1426) byla jednou z největších porážek křižáků. Proti 70 000 křižáků stálo jen asi 25 000 husitů. Husité zabili nebo zajali až 15 000 nepřátel včetně mnoha říšských knížat.'
        },
        commanderAbilities: {
            auraRange: 4,
            moraleBonus: 15,
            attackBonus: 5,
            defenseBonus: 4,
            cavalryBonus: 12,       // Bonus pro jízdu
            rallyBonus: 20,
            fearRange: 3,
            fearPenalty: 5
        }
    },

    // Boso z Vitzthumu (v čes. pramenech „Boso z Fictuma") - kondotiér, vrchní polní velitel křižáků u Ústí 1426 (padl)
    BOSO_VITZTHUM: {
        id: 'boso_vitzthum',
        name: 'Boso z Vitzthumu',
        faction: 'crusaders',
        symbol: '🦅',  // Saská/míšeňská korouhev
        maxHealth: 100,
        attack: 36,
        defense: 30,
        range: 1,
        movement: 4,
        cost: 500,
        description: 'Proslulý kondotiér, jemuž bylo svěřeno vrchní velení křížové výpravy u Ústí nad Labem 1426. V bitvě padl.',
        special: 'commander',
        unitClass: 'commander',
        baseMorale: 90,
        lore: {
            description: 'Boso z Vitzthumu (v českých pramenech „Boso z Fictuma") byl zkušený žoldnéřský velitel — kondotiér. Vrchní velení na bojišti u Ústí mu svěřil saský kurfiřt Fridrich Bojovný, který výpravu zorganizoval, ale hlavní bitvy se osobně neúčastnil.',
            equipment: 'Plátová zbroj, kopí, meč; pod jeho korouhví stála hrabata z Weidy a Schwarzburku.',
            origin: 'Míšeňsko-saské (wettinské) vojsko',
            historicalNote: 'Bitva u Ústí (16. června 1426) byla podle kronik nejkrvavější bitvou husitských válek. Po porážce pokleklo pod německou korouhví 24 hrabat a korouhevních pánů s meči zabodnutými do země a prosilo o milost — protože si však obě strany před bojem slíbily nikoho nešetřit, byli všichni do jednoho pobiti. Sám Boso velení nepřežil.'
        },
        commanderAbilities: {
            auraRange: 4,
            moraleBonus: 15,
            attackBonus: 5,
            defenseBonus: 4,
            cavalryBonus: 12,
            rallyBonus: 20,
            fearRange: 3,
            fearPenalty: 5
        }
    },

    // Petr Konopišťský ze Šternberka - velitel katolíků u Živohoště
    PETR_STERNBERK: {
        id: 'petr_sternberk',
        name: 'Petr ze Šternberka',
        faction: 'crusaders',
        symbol: '⭐',  // Hvězda na erbu Šternberků
        maxHealth: 95,
        attack: 35,
        defense: 28,
        range: 1,
        movement: 4,
        cost: 400,
        description: 'Petr Konopišťský ze Šternberka. Vedl útok na jihočeské husitské poutníky u Živohoště.',
        special: 'commander',
        unitClass: 'commander',
        baseMorale: 85,
        lore: {
            description: "Petr Konopišťský ze Šternberka vedl roku 1419 útok na husitské poutníky u Živohoště. Ve hře představuje velitele útočící jízdy.",
            equipment: "Zbroj, kopí, meč a štít; přesná osobní výstroj je herní rekonstrukce.",
            origin: "Rod pánů ze Šternberka.",
            historicalNote: "Příchod posil u Živohoště pomohl části poutníků pokračovat v cestě. Herní vítězství není dokladem přesných historických ztrát ani úplného zničení útočníků."
        },
        commanderAbilities: {
            auraRange: 3,
            moraleBonus: 10,
            attackBonus: 6,
            defenseBonus: 4,
            cavalryBonus: 12,
            rallyBonus: 18,
            fearRange: 3,
            fearPenalty: 4
        }
    },

    // Vilém Švihovský z Rýzmberka - velitel obrany Plzně 1433-34
    VILEM_SVIHOVSKY: {
        id: 'vilem_svihovsky',
        name: 'Vilém Švihovský',
        faction: 'crusaders',
        symbol: '🏰',  // Obránce města
        maxHealth: 90,
        attack: 28,
        defense: 32,
        range: 1,
        movement: 3,
        cost: 380,
        description: 'Vilém Švihovský z Rýzmberka. Hejtman obrany Plzně během husitského obléhání 1433-34.',
        special: 'commander',
        unitClass: 'commander',
        baseMorale: 90,
        lore: {
            description: 'Vilém Švihovský z Rýzmberka byl katolický šlechtic a hejtman plzeňského landfrýdu. Vedl obranu Plzně během devítiměsíčního husitského obléhání v letech 1433-34.',
            equipment: 'Plná zbroj, meč, erb Švihovských z Rýzmberka.',
            origin: 'Rod pánů z Rýzmberka a Švihova, západní Čechy',
            historicalNote: 'Obležená Plzeň pod jeho velením odolala polním vojskům až do jejich odchodu k Lipanům. Město za statečnost získalo od Zikmunda velblouda do znaku - na památku zvířete ukořistěného obránci při výpadu do husitského tábora.'
        },
        commanderAbilities: {
            auraRange: 3,
            moraleBonus: 12,
            attackBonus: 4,
            defenseBonus: 6,
            rallyBonus: 22,         // Zkušený obránce - drží morálku posádky
            fearRange: 2,
            fearPenalty: 2
        }
    },

    // Břeněk Švihovský z Rýzmburka - husitský velitel posil u Živohoště
    BRENEK_SVIHOVSKY: {
        id: 'brenek_svihovsky',
        name: 'Břeněk Švihovský',
        faction: 'hussites',
        symbol: '🛡️',  // Obránce
        maxHealth: 85,
        attack: 30,
        defense: 25,
        range: 1,
        movement: 3,
        cost: 350,
        description: 'Břeněk Švihovský z Rýzmburka. Jeden z velitelů husitského houfu u Sudoměře.',
        special: 'commander',
        unitClass: 'commander',
        baseMorale: 85,
        lore: {
            description: "Břeněk Švihovský patřil k velitelům husitského houfu táhnoucího od Plzně. Padl u Sudoměře v březnu 1420.",
            equipment: "Zbroj, meč a štít; přesná osobní výstroj je herní rekonstrukce.",
            origin: "Česká šlechta na husitské straně.",
            historicalNote: "V raných bitvách není bezpečné připsat všechny posily a rozhodnutí jednomu veliteli. U Sudoměře bojovali v čele houfu Břeněk i Jan Žižka."
        },
        commanderAbilities: {
            auraRange: 3,
            moraleBonus: 12,
            attackBonus: 4,
            defenseBonus: 5,
            rallyBonus: 25,         // Výborný v posílení morálky
            fearRange: 2,
            fearPenalty: 2
        }
    },

    // Hynek z Nekmíře - majitel tvrze, zahyne v boji
    HYNEK_NEKMIRE: {
        id: 'hynek_nekmire',
        name: 'Hynek z Nekmíře',
        faction: 'crusaders',
        symbol: '🏰',  // Majitel tvrze
        maxHealth: 75,
        attack: 32,
        defense: 25,
        range: 1,
        movement: 4,
        cost: 300,
        description: 'Hynek z Nekmíře, majitel tvrze Nekmíř. Zahynul v boji proti Žižkovi.',
        special: 'commander',
        unitClass: 'commander',
        baseMorale: 80,
        lore: {
            description: 'Hynek z Nekmíře byl drobný katolický šlechtic a majitel tvrze Nekmíř v západních Čechách. Padl v jedné z raných bitev proti Žižkově táborskému vojsku.',
            equipment: 'Lehká zbroj, kopí, meč.',
            origin: 'Tvrz Nekmíř, Plzeňsko',
            historicalNote: 'Nekmíř byl jedním z mnoha drobných šlechticů, kteří se postavili proti husitům a zaplatili za to životem. Jeho tvrz byla husity dobyta a pobořena.'
        },
        commanderAbilities: {
            auraRange: 2,
            moraleBonus: 8,
            attackBonus: 5,
            defenseBonus: 3,
            cavalryBonus: 8,
            rallyBonus: 15,
            fearRange: 2,
            fearPenalty: 3
        }
    },

    // Hynek Krušina z Lichtenburka - velitel husitů u Vyšehradu
    HYNEK_KRUSINA: {
        id: 'hynek_krusina',
        name: 'Hynek Krušina',
        faction: 'hussites',
        symbol: '🦅',  // Orel
        maxHealth: 90,
        attack: 32,
        defense: 28,
        range: 1,
        movement: 3,
        cost: 400,
        description: 'Hynek Krušina z Lichtenburka, 25letý velitel husitů u Vyšehradu. Rozhodný a odvážný.',
        special: 'commander',
        unitClass: 'commander',
        baseMorale: 90,
        lore: {
            description: 'Hynek Krušina z Lichtenburka (asi 1395-1454) byl významný husitský hejtman z mocného rodu Lichtenburků. Jako mladý velitel vedl husitské vojsko k vítězství u Vyšehradu roku 1420.',
            equipment: 'Plná zbroj s erbem Lichtenburků, meč, štít.',
            origin: 'Rod pánů z Lichtenburka, východní Čechy',
            historicalNote: 'U Vyšehradu roku 1420 Hynek Krušina vedl rozhodující útok na královské vojsko. Po bitvě se stal jedním z nejvýznamnějších husitských velitelů. Později přešel k umírněným a bojoval u Lipan proti táborům.'
        },
        commanderAbilities: {
            auraRange: 4,
            moraleBonus: 15,
            attackBonus: 5,
            defenseBonus: 5,
            rallyBonus: 25,
            fearRange: 3,
            fearPenalty: 3
        }
    },

    // Jindřich z Plumlova - moravský hejtman, varoval před útokem
    JINDRICH_PLUMOV: {
        id: 'jindrich_plumov',
        name: 'Jindřich z Plumlova',
        faction: 'crusaders',
        symbol: '🏇',  // Jezdec
        maxHealth: 85,
        attack: 30,
        defense: 26,
        range: 1,
        movement: 4,
        cost: 350,
        description: 'Jindřich z Plumlova, moravský zemský hejtman. Varoval před útokem na Vyšehrad, byl obviněn ze zbabělosti.',
        special: 'commander',
        unitClass: 'commander',
        baseMorale: 75,
        lore: {
            description: 'Jindřich z Plumlova byl moravský zemský hejtman a opatrný velitel. U Vyšehradu varoval před unáhleným útokem na husitské pozice, ale jeho rada nebyla vyslyšena.',
            equipment: 'Zbroj s moravským erbem, meč, kopí.',
            origin: 'Morava',
            historicalNote: 'U Vyšehradu Jindřich z Plumlova správně předvídal, že přímý útok na husitské pozice selže. Jeho varování bylo ignorováno a po porážce byl nespravedlivě obviněn ze zbabělosti, ačkoli jeho opatrnost byla oprávněná.'
        },
        commanderAbilities: {
            auraRange: 3,
            moraleBonus: 8,
            attackBonus: 4,
            defenseBonus: 4,
            cavalryBonus: 10,
            rallyBonus: 15,
            fearRange: 2,
            fearPenalty: 2
        }
    },

    // Diviš Bořek z Miletínka - husitský hejtman orebité
    DIVIS_BOREK: {
        id: 'divis_borek',
        name: 'Diviš Bořek',
        faction: 'hussites',
        symbol: '🔱',  // Tři kopí na erbu
        maxHealth: 85,
        attack: 30,
        defense: 28,
        range: 1,
        movement: 3,
        cost: 380,
        description: 'Diviš Bořek z Miletínka, hejtman orebských husitů. Spolubojovník Žižky u Hořic.',
        special: 'commander',
        unitClass: 'commander',
        baseMorale: 85,
        lore: {
            description: "Diviš Bořek z Miletínka byl východočeský husitský hejtman. S Žižkou spolupracoval, ale později se jejich vojska střetla proti sobě.",
            equipment: "Zbroj, meč a štít; přesná osobní výstroj je herní rekonstrukce.",
            origin: "Miletínek ve východních Čechách.",
            historicalNote: "Spolupráce u Hořic roku 1423 neznamenala trvalé spojenectví. Téhož roku došlo ke střetu u Strauchova dvora; nelze jej popisovat jako celoživotně věrného Žižkova druha."
        },
        commanderAbilities: {
            auraRange: 3,
            moraleBonus: 12,
            attackBonus: 4,
            defenseBonus: 5,
            rallyBonus: 22,
            fearRange: 2,
            fearPenalty: 3
        }
    },

    // Čeněk z Vartenberka - katolický velitel u Hořic
    CENEK_VARTENBERK: {
        id: 'cenek_vartenberk',
        name: 'Čeněk z Vartenberka',
        faction: 'crusaders',
        symbol: '🦁',  // Lev na erbu
        maxHealth: 80,
        attack: 28,
        defense: 25,
        range: 1,
        movement: 4,
        cost: 400,
        description: 'Čeněk z Vartenberka, nejvyšší purkrabí pražský. Vůdce katolické šlechty u Hořic 1423.',
        special: 'commander',
        unitClass: 'commander',
        baseMorale: 80,
        lore: {
            description: 'Čeněk z Vartenberka (asi 1380-1425) byl nejvyšší purkrabí pražský a jedna z nejvlivnějších postav počátku husitských válek. Zpočátku sympatizoval s husity, ale po radikalizaci hnutí přešel ke katolíkům.',
            equipment: 'Honosná zbroj s erbem Vartenberků, meč, korouhev.',
            origin: 'Rod pánů z Vartenberka, severní Čechy',
            historicalNote: 'Čeněk z Vartenberka několikrát změnil strany. Roku 1419 pomohl husitům obsadit Pražský hrad, ale později se obrátil proti nim. U Hořic roku 1423 vedl katolickou šlechtu proti Žižkovi a utrpěl porážku.'
        },
        commanderAbilities: {
            auraRange: 4,
            moraleBonus: 10,
            attackBonus: 3,
            defenseBonus: 3,
            cavalryBonus: 10,
            rallyBonus: 15,
            fearRange: 3,
            fearPenalty: 3
        }
    },

    // Arnošt Flaška z Pardubic - katolický velitel, padl u Hořic
    ARNOST_FLASKA: {
        id: 'arnost_flaska',
        name: 'Arnošt Flaška',
        faction: 'crusaders',
        symbol: '🏇',  // Rytíř na koni
        maxHealth: 85,
        attack: 32,
        defense: 26,
        range: 1,
        movement: 4,
        cost: 350,
        description: 'Arnošt Flaška z Pardubic, katolický šlechtic. Padl v bitvě u Hořic 1423.',
        special: 'commander',
        unitClass: 'commander',
        baseMorale: 82,
        lore: {
            description: 'Arnošt Flaška z Pardubic byl katolický šlechtic a vzdálený příbuzný slavného arcibiskupa Arnošta z Pardubic. Bojoval proti husitům ve východních Čechách.',
            equipment: 'Plná zbroj s pardubickým erbem, kopí, meč.',
            origin: 'Rod Flašků z Pardubic, východní Čechy',
            historicalNote: 'Arnošt Flaška padl v bitvě u Hořic 20. dubna 1423. Byl jedním z mnoha katolických šlechticů, kteří zaplatili životem za odpor proti Žižkovi.'
        },
        commanderAbilities: {
            auraRange: 3,
            moraleBonus: 10,
            attackBonus: 5,
            defenseBonus: 3,
            cavalryBonus: 12,
            rallyBonus: 18,
            fearRange: 2,
            fearPenalty: 3
        }
    },

    // Jindřich Berka z Dubé - katolický velitel u Hořic
    JINDRICH_BERKA: {
        id: 'jindrich_berka',
        name: 'Jindřich Berka z Dubé',
        faction: 'crusaders',
        symbol: '🏰',  // Hrad
        maxHealth: 80,
        attack: 28,
        defense: 27,
        range: 1,
        movement: 4,
        cost: 350,
        description: 'Jindřich Berka z Dubé, severočeský šlechtic. Velitel u Hořic 1423.',
        special: 'commander',
        unitClass: 'commander',
        baseMorale: 78,
        lore: {
            description: 'Jindřich Berka z Dubé byl severočeský šlechtic z mocného rodu Berků z Dubé. Rod vlastnil rozsáhlé panství v severních Čechách včetně hradu Houska.',
            equipment: 'Zbroj s erbem Berků, kopí, meč.',
            origin: 'Rod Berků z Dubé, severní Čechy',
            historicalNote: 'Berkové z Dubé byli jedním z nejstarších a nejmocnějších českých šlechtických rodů. Jindřich se účastnil bitvy u Hořic na straně katolické koalice vedené Čeňkem z Vartenberka.'
        },
        commanderAbilities: {
            auraRange: 3,
            moraleBonus: 8,
            attackBonus: 4,
            defenseBonus: 4,
            cavalryBonus: 8,
            rallyBonus: 15,
            fearRange: 2,
            fearPenalty: 2
        }
    },

    // ==========================================
    // VELITELÉ PRO BITVU U MALEŠOVA 1424
    // ==========================================

    // Poznámka: Pro Malešov použijeme hlavní definici JAN_ROHAC výše

    // Jan Hvězda z Vícemilic (Bzdinka) - husitský hejtman
    JAN_HVEZDA: {
        id: 'jan_hvezda',
        name: 'Jan Hvězda z Vícemilic',
        faction: 'hussites',
        symbol: '⭐',  // Hvězda - podle jména
        maxHealth: 85,
        attack: 30,
        defense: 26,
        range: 1,
        movement: 3,
        cost: 370,
        description: 'Jan Hvězda z Vícemilic, zvaný Bzdinka. Znalec kraje kolem Malešova, Žižkův průvodce.',
        special: 'commander',
        unitClass: 'commander',
        baseMorale: 85,
        lore: {
            description: 'Jan Hvězda z Vícemilic, přezdívaný Bzdinka, byl husitský hejtman a znalec kraje kolem Kutné Hory a Malešova. Sloužil jako průvodce slepému Žižkovi.',
            equipment: 'Lehká zbroj, meč, štít.',
            origin: 'Vícemilice, střední Čechy',
            historicalNote: 'Jan Hvězda pomáhal slepému Žižkovi orientovat se v terénu u Malešova. Jeho znalost místního kraje byla klíčová pro úspěch husitské taktiky v bitvě 7. června 1424.'
        },
        commanderAbilities: {
            auraRange: 3,
            moraleBonus: 10,
            attackBonus: 4,
            defenseBonus: 4,
            rallyBonus: 18,
            fearRange: 2,
            fearPenalty: 3
        }
    },

    // Hynek z Poděbrad - spojenec husitů u Malešova
    HYNEK_PODEBRADY: {
        id: 'hynek_podebrady',
        name: 'Hynek z Poděbrad',
        faction: 'hussites',
        symbol: '🛡',  // Štít
        maxHealth: 85,
        attack: 28,
        defense: 30,
        range: 1,
        movement: 3,
        cost: 380,
        description: 'Hynek z Poděbrad a Kunštátu. Husitský šlechtic z východních Čech.',
        special: 'commander',
        unitClass: 'commander',
        baseMorale: 82,
        lore: {
            description: "Hynek z Poděbrad a Kunštátu byl husitský šlechtic. Ve hře vystupuje mezi veliteli východočeských oddílů.",
            equipment: "Zbroj, meč a štít; přesná osobní výstroj je herní rekonstrukce.",
            origin: "Rod pánů z Kunštátu a Poděbrad.",
            historicalNote: "Otcem budoucího krále Jiřího byl Viktorín Boček, nikoli tento Hynek. Při čtení o Poděbradech je třeba rozlišovat opakující se rodová jména."
        },
        commanderAbilities: {
            auraRange: 3,
            moraleBonus: 10,
            attackBonus: 3,
            defenseBonus: 5,
            rallyBonus: 18,
            fearRange: 2,
            fearPenalty: 3
        }
    },

    // Viktorin Boček z Poděbrad - další z Poděbradů
    VIKTORIN_BOCEK: {
        id: 'viktorin_bocek',
        name: 'Viktorín Boček',
        faction: 'hussites',
        symbol: '⚔',  // Meč
        maxHealth: 80,
        attack: 30,
        defense: 25,
        range: 1,
        movement: 4,
        cost: 350,
        description: 'Viktorín Boček z Kunštátu a Poděbrad. Husitský šlechtic a otec budoucího krále Jiřího.',
        special: 'commander',
        unitClass: 'commander',
        baseMorale: 80,
        lore: {
            description: "Viktorín Boček z Kunštátu a Poděbrad byl husitský šlechtic a otec pozdějšího krále Jiřího z Poděbrad.",
            equipment: "Zbroj, kopí, meč a štít; přesná osobní výstroj je herní rekonstrukce.",
            origin: "Rod pánů z Kunštátu a Poděbrad.",
            historicalNote: "Nezaměňovat s Hynkem z Poděbrad. Studie o Liticích připomíná Viktorínovy stavební úpravy hradu před pozdější přestavbou za vlády jeho syna Jiřího."
        },
        commanderAbilities: {
            auraRange: 3,
            moraleBonus: 8,
            attackBonus: 5,
            defenseBonus: 3,
            cavalryBonus: 10,
            rallyBonus: 16,
            fearRange: 2,
            fearPenalty: 3
        }
    },

    // ==========================================
    // UMÍRNĚNÍ HUSITÉ (pro Lipany) - modré jednotky
    // Kopie husitských jednotek s faction='crusaders'
    // ==========================================

    VOZOVA_HRADBA_PRASKY: {
        id: 'vozova_hradba_prasky',
        name: 'Pražské vozy',
        faction: 'crusaders',  // Modré pro umírněné
        symbol: '⚐',
        maxHealth: 120,
        attack: 15,
        defense: 40,
        range: 1,
        movement: 1,
        cost: 80,
        description: 'Vozová hradba umírněných kališníků z Prahy.',
        special: 'wagon',
        unitClass: 'wagon',
        baseMorale: 90,
        tactics: {
            terrain: { forest: -30, hill: -10, water: -50, road: 10, village: 5 },
            attackTerrain: { forest: -30, hill: -10, water: -50, road: 0, village: 0 },
            weaknesses: ['artillery', 'flanking'],
            zoc: true,
            canRetreat: false
        }
    },

    CEPNICI_PRASKY: {
        id: 'cepnici_prasky',
        name: 'Pražští cepníci',
        faction: 'crusaders',
        symbol: '⚔',
        maxHealth: 80,
        attack: 35,
        defense: 20,
        range: 1,
        movement: 2,
        cost: 40,
        description: 'Cepníci umírněných kališníků.',
        special: 'armorPiercing',
        unitClass: 'infantry',
        baseMorale: 85,
        tactics: {
            terrain: { forest: 10, hill: 0, water: -20, road: 0, village: 10 },
            attackTerrain: { forest: 15, hill: 10, water: -30, road: 0, village: 5 },
            weaknesses: ['ranged', 'cavalry_charge'],
            zoc: true,
            canRetreat: true
        }
    },

    KUSINICI_PRASKY: {
        id: 'kusinici_prasky',
        name: 'Pražští kušiníci',
        faction: 'crusaders',
        symbol: '➶',
        maxHealth: 60,
        attack: 30,
        defense: 12,
        range: 3,
        movement: 2,
        cost: 50,
        description: 'Kušiníci umírněných kališníků.',
        unitClass: 'ranged',
        baseMorale: 80,
        tactics: {
            terrain: { forest: 10, hill: 15, water: -15, road: 0, village: 10 },
            attackTerrain: { forest: 5, hill: 15, water: -20, road: 0, village: 10 },
            weaknesses: ['cavalry', 'close_combat'],
            zoc: false,
            canRetreat: true
        }
    },

    HOUFNICE_PRASKY: {
        id: 'houfnice_prasky',
        name: 'Pražské houfnice',
        faction: 'crusaders',
        symbol: '⚑',
        maxHealth: 40,
        attack: 50,
        defense: 8,
        range: 4,
        movement: 1,
        cost: 100,
        description: 'Děla umírněných kališníků.',
        special: 'siege',
        unitClass: 'artillery',
        baseMorale: 75,
        tactics: {
            terrain: { forest: -20, hill: 10, water: -40, road: 10, village: 0 },
            attackTerrain: { forest: -30, hill: 15, water: -50, road: 0, village: 0 },
            weaknesses: ['cavalry', 'close_combat', 'slow_reload'],
            zoc: false,
            canRetreat: false
        }
    },

    JIZDA_PRASKY: {
        id: 'jizda_prasky',
        name: 'Pražská jízda',
        faction: 'crusaders',
        symbol: '♞',
        maxHealth: 70,
        attack: 30,
        defense: 18,
        range: 1,
        movement: 4,
        cost: 70,
        description: 'Lehká jízda umírněných kališníků.',
        unitClass: 'cavalry',
        baseMorale: 85,
        tactics: {
            terrain: { forest: -20, hill: -10, water: -30, road: 20, village: -15 },
            attackTerrain: { forest: -30, hill: -20, water: -40, road: 30, village: -20 },
            weaknesses: ['spears', 'wagenburg'],
            zoc: true,
            canRetreat: true
        }
    }
};

// Třída jednotky
