// Encyclopedia content renderer
// Dynamicky generuje obsah encyklopedie na základě zvoleného jazyka

/**
 * Inicializuje obsah encyklopedie
 */
function initEncyclopediaContent() {
    // Historie se renderuje při otevření help modalu
    renderHistoryTab();
    renderCommandersTab();
    renderTacticsTab();
    renderTerrainTab();
    renderRulesTab();
    renderControlsTab();
    renderAboutTab();
    renderAboutModal();
}

/**
 * Aktualizuje obsah encyklopedie při změně jazyka
 */
function updateEncyclopediaContent() {
    initEncyclopediaContent();
}

/**
 * Renderuje záložku Historie
 */
function renderHistoryTab() {
    const container = document.getElementById('tab-history');
    if (!container) return;

    const lang = i18n.getCurrentLanguage();
    const isEnglish = lang === 'en';

    container.innerHTML = `
        <h3>${isEnglish ? 'The Hussite Wars (1419-1437)' : 'Husitské války (1419-1437)'}</h3>
        <div class="history-section">
            <h4>${isEnglish ? 'Causes of the Conflict' : 'Příčiny konfliktu'}</h4>
            <p>${isEnglish
                ? 'The Hussite Wars arose as a response to the burning of Master Jan Hus at the Council of Constance in 1415. Hus criticized the sale of indulgences, the wealth of the Church, and demanded reforms. His death triggered a wave of resistance in Bohemia against the Catholic Church and the Roman King Sigismund of Luxembourg.'
                : 'Husitské války vznikly jako reakce na upálení mistra Jana Husa na kostnickém koncilu roku 1415. Hus kritizoval prodej odpustků, bohatství církve a požadoval reformy. Jeho smrt vyvolala v Čechách vlnu odporu proti katolické církvi a římskému králi Zikmundovi Lucemburskému.'
            }</p>

            <h4>${isEnglish ? 'The Four Articles of Prague' : 'Čtyři pražské artikuly'}</h4>
            <p>${isEnglish
                ? 'The Hussites formulated their demands in four articles: free preaching of the word of God, communion under both kinds (the chalice), prohibition of secular dominion by priests, and punishment of mortal sins. The chalice became the symbol of the Hussite movement.'
                : 'Husité formulovali své požadavky ve čtyřech artikulech: svobodné kázání slova božího, přijímání pod obojí způsobou (kalich), zákaz světského panování kněží a trestání smrtelných hříchů. Kalich se stal symbolem husitského hnutí.'
            }</p>

            <h4>${isEnglish ? 'The Crusades' : 'Křížové výpravy'}</h4>
            <p>${isEnglish
                ? 'Five crusades were declared against the Hussites (1420, 1421, 1422, 1427, 1431). All ended in defeat for the crusaders. The Hussites, under the leadership of Jan Žižka and later Prokop the Great, developed revolutionary military tactics based on the wagon fort and firearms.'
                : 'Proti husitům bylo vyhlášeno celkem pět křížových výprav (1420, 1421, 1422, 1427, 1431). Všechny skončily porážkou křižáků. Husité pod vedením Jana Žižky a později Prokopa Holého vyvinuli revoluční vojenskou taktiku založenou na vozové hradbě a palných zbraních.'
            }</p>

            <h4>${isEnglish ? 'End of the Wars' : 'Konec válek'}</h4>
            <p>${isEnglish
                ? 'The Hussite movement gradually split into moderates (Utraquists) and radicals (Taborites, Orphans). In 1434, at the Battle of Lipany, the moderates defeated the radicals. The wars ended in 1436 with the Basel Compacts, which recognized communion under both kinds.'
                : 'Husitské hnutí se postupně rozštěpilo na umírněné (kališníky) a radikály (tábority, sirotky). Roku 1434 v bitvě u Lipan porazili umírnění radikály. Války skončily roku 1436 basilejskými kompaktáty, která uznala přijímání pod obojí.'
            }</p>
        </div>
    `;
}

/**
 * Renderuje záložku Osobnosti
 */
function renderCommandersTab() {
    const container = document.getElementById('tab-commanders');
    if (!container) return;

    const lang = i18n.getCurrentLanguage();
    const isEnglish = lang === 'en';

    const hussites = isEnglish ? [
        {name: 'Jan Žižka of Trocnov', years: 'ca. 1360 - 1424', desc: 'Brilliant military commander who never lost a battle. Born into minor nobility, he fought as a mercenary in Poland and, according to later legend, perhaps in the service of the English king. After going blind (first in one eye, later in both), he led the Hussite forces solely based on reports from his lieutenants. He created the wagon fort - a revolutionary tactic that changed warfare in Europe.'},
        {name: 'Prokop the Great (Prokop Holý)', years: 'ca. 1380 - 1434', desc: 'Priest and military commander, leader of the Taborite Hussites after Žižka\'s death. He led raids into neighboring lands and defeated subsequent crusades. He fell at the Battle of Lipany, where the Hussites turned against each other.'},
        {name: 'Jan Roháč of Dubá', years: 'ca. 1400 - 1437', desc: 'The last Hussite captain, a loyal lieutenant of Žižka. After Lipany, he refused to accept the Compacts and defended Sion Castle. After its capture, he was executed in Prague along with 52 companions - the last victims of the Hussite Wars.'},
        {name: 'Jan Želivský', years: '? - 1422', desc: 'Radical Prague preacher and demagogue. He led the procession to the New Town Hall, where the First Defenestration of Prague occurred. He became the leader of Prague\'s poor, but was not a soldier. Executed in 1422 at the Old Town Hall.'},
        {name: 'Hynek Krušina of Lichtenburg', years: 'ca. 1395 - 1454', desc: 'Young Hussite captain from the powerful Lichtenburg family. He led the Hussite army to victory at Vyšehrad in 1420. Later he joined the moderates and fought at Lipany against the Taborites.'},
        {name: 'Diviš Bořek of Miletínek', years: '? - 1438', desc: 'Captain of the Orebite Hussites and loyal companion-in-arms of Žižka. He fought in many battles including Hořice in 1423. After Žižka\'s death, the Orebites renamed themselves the Orphans in his honor.'},
        {name: 'Hynek of Poděbrady', years: '? - 1426', desc: 'Moravian nobleman and ally of the Orebites. Uncle of George of Poděbrady, future King of Bohemia - George\'s father was Hynek\'s brother Viktorin Boček of Kunštát. He was captured at Malešov in 1424.'}
    ] : [
        {name: 'Jan Žižka z Trocnova', years: 'asi 1360 - 1424', desc: 'Geniální vojevůdce, který nikdy neprohrál bitvu. Pocházel z drobné šlechty, bojoval jako žoldnéř v Polsku, podle pozdější tradice snad i ve službách anglického krále. Po oslepnutí (nejprve na jedno, později na obě oči) vedl husitská vojska jen podle hlášení pobočníků. Vytvořil vozovou hradbu - revoluční taktiku, která změnila způsob válčení v Evropě.'},
        {name: 'Prokop Holý (Veliký)', years: 'asi 1380 - 1434', desc: 'Kněz a vojevůdce, vůdce táborských husitů po Žižkově smrti. Vedl spanilé jízdy do okolních zemí a porazil další křížové výpravy. Padl v bitvě u Lipan, kde se husité obrátili proti sobě.'},
        {name: 'Jan Roháč z Dubé', years: 'asi 1400 - 1437', desc: 'Poslední husitský hejtman, věrný Žižkův pobočník. Po Lipanech odmítl přijmout kompaktáta a bránil hrad Sion. Po jeho dobytí byl s 52 druhy popraven v Praze - poslední oběť husitských válek.'},
        {name: 'Jan Želivský', years: '? - 1422', desc: 'Radikální pražský kazatel a demagog. Vedl průvod k Novoměstské radnici, kde došlo k první pražské defenestraci. Stal se vůdcem pražské chudiny, ale nebyl voják. Popraven roku 1422 na Staroměstské radnici.'},
        {name: 'Hynek Krušina z Lichtenburka', years: 'asi 1395 - 1454', desc: 'Mladý husitský hejtman z mocného rodu Lichtenburků. Vedl husitské vojsko k vítězství u Vyšehradu roku 1420. Později přešel k umírněným a bojoval u Lipan proti táborům.'},
        {name: 'Diviš Bořek z Miletínka', years: '? - 1438', desc: 'Hejtman orebských husitů a věrný Žižkův spolubojovník. Bojoval v mnoha bitvách včetně Hořic roku 1423. Po Žižkově smrti se orebité přejmenovali na sirotky na jeho počest.'},
        {name: 'Hynek z Poděbrad', years: '? - 1426', desc: 'Moravský šlechtic a spojenec orebitů. Strýc Jiřího z Poděbrad, budoucího českého krále - Jiříkovým otcem byl Hynkův bratr Viktorin Boček z Kunštátu. U Malešova roku 1424 padl do zajetí.'}
    ];

    const crusaders = isEnglish ? [
        {name: 'Sigismund of Luxembourg', years: '1368 - 1437', desc: 'Roman and Hungarian king, later Holy Roman Emperor. Son of Charles IV, responsible for the burning of Jan Hus. He organized five crusades against the Hussites. Eventually he was accepted as King of Bohemia in 1436 after the acceptance of the Compacts.'},
        {name: 'Cardinal Cesarini', years: '1398 - 1444', desc: 'Papal legate who led the fifth crusade in 1431. At Domažlice, his army fled without seeing the enemy - the sound of the Hussite choral was enough. He lost his cardinal\'s hat during the flight.'},
        {name: 'Frederick IV of Saxony (the Warlike)', years: '1370 - 1428', desc: 'Margrave of Meissen, from 1423 Elector of Saxony. In 1426, his army launched a great crusade that ended in catastrophic defeat at Ústí nad Labem - one of the greatest defeats of the crusaders. He did not take part in the main battle himself; field command he entrusted to the condottiere Boso of Vitzthum, who was killed.'},
        {name: 'Boso of Vitzthum', years: '? - 1426', desc: 'Renowned condottiere entrusted with supreme field command of the Saxon-Meissen crusade at Ústí nad Labem. After the defeat, 24 counts and bannerlords knelt under the German banner and begged for mercy, but by the mutual vow of both sides to spare no one, all were slain to the last. Boso fell in the battle.'},
        {name: 'Filippo Scolari (Pipo Spano)', years: '1369 - 1426', desc: 'Florentine merchant and condottiere in the service of King Sigismund. He became one of his most capable commanders. He led Hungarian forces during the campaign into Bohemia, but against the wagon fort, his cavalry tactics failed.'},
        {name: 'Bohuslav of Švamberk', years: '? - 1425', desc: 'South Bohemian Catholic nobleman and captain of the royal landfrieden. He led 2,000 cavalry against 400 Hussites at Sudoměř, where he suffered a crushing defeat. Captured by the Hussites at Krasíkov castle in 1421, he then converted to the Hussite cause and fell in 1425 as a Taborite captain at the siege of Retz.'},
        {name: 'Čeněk of Wartenberg', years: 'ca. 1380 - 1425', desc: 'Supreme Burgrave of Prague. Initially sympathetic to the Hussites and helped them occupy Prague Castle, but after the radicalization of the movement, he switched to the Catholics. At Hořice in 1423, he suffered defeat by Žižka.'}
    ] : [
        {name: 'Zikmund Lucemburský', years: '1368 - 1437', desc: 'Římský a uherský král, později císař Svaté říše římské. Syn Karla IV., odpovědný za upálení Jana Husa. Organizoval pět křížových výprav proti husitům. Nakonec byl roku 1436 přijat za českého krále po přijetí kompaktát.'},
        {name: 'Kardinál Cesarini', years: '1398 - 1444', desc: 'Papežský legát, který vedl pátou křížovou výpravu roku 1431. U Domažlic jeho vojsko uprchlo, aniž by spatřilo nepřítele - stačil zvuk husitského chorálu. Ztratil při útěku kardinálský klobouk.'},
        {name: 'Fridrich IV. Saský (Bojovný)', years: '1370 - 1428', desc: 'Míšeňský markrabě a od roku 1423 saský kurfiřt. Roku 1426 jeho vojsko podniklo velkou křížovou výpravu, která skončila katastrofální porážkou u Ústí nad Labem - jednou z největších porážek křižáků. Sám se hlavní bitvy neúčastnil; polní velení svěřil kondotiérovi Bosovi z Vitzthumu, který padl.'},
        {name: 'Boso z Vitzthumu', years: '? - 1426', desc: 'Proslulý kondotiér, jemuž bylo svěřeno vrchní polní velení sasko-míšeňské výpravy u Ústí nad Labem. Po porážce pokleklo pod německou korouhví 24 hrabat a korouhevních pánů a prosilo o milost, ale pro vzájemný slib obou stran nešetřit nikoho byli do jednoho pobiti. Boso v bitvě padl.'},
        {name: 'Filippo Scolari (Pipo Spano)', years: '1369 - 1426', desc: 'Florentský obchodník a kondotiér ve službách krále Zikmunda. Stal se jedním z jeho nejschopnějších vojevůdců. Vedl uherské vojsko při tažení do Čech, ale proti vozové hradbě jeho jízdní taktika selhávala.'},
        {name: 'Bohuslav ze Švamberka', years: '? - 1425', desc: 'Jihočeský katolický šlechtic a hejtman královského landfrýdu. Vedl 2000 jezdců proti 400 husitům u Sudoměře, kde utrpěl zdrcující porážku. Roku 1421 ho husité zajali na hradě Krasíkově - poté přestoupil ke kališnictví a padl roku 1425 jako táborský hejtman při obléhání Retzu.'},
        {name: 'Čeněk z Vartenberka', years: 'asi 1380 - 1425', desc: 'Nejvyšší purkrabí pražský. Zpočátku sympatizoval s husity a pomohl jim obsadit Pražský hrad, ale po radikalizaci hnutí přešel ke katolíkům. U Hořic roku 1423 utrpěl porážku od Žižky.'}
    ];

    let html = `<h3>${isEnglish ? 'Notable Personalities' : 'Významné osobnosti'}</h3>`;

    html += `<h4 class="faction-header hussite-header">${isEnglish ? 'Hussite Commanders' : 'Husitští velitelé'}</h4>`;
    html += '<div class="commanders-list">';
    hussites.forEach(cmd => {
        html += `
            <div class="commander-card hussite">
                <h4>${cmd.name}</h4>
                <p class="commander-years">${cmd.years}</p>
                <p>${cmd.desc}</p>
            </div>
        `;
    });
    html += '</div>';

    html += `<h4 class="faction-header crusader-header">${isEnglish ? 'Catholic and Crusader Commanders' : 'Katoličtí a křižáčtí velitelé'}</h4>`;
    html += '<div class="commanders-list">';
    crusaders.forEach(cmd => {
        html += `
            <div class="commander-card crusader">
                <h4>${cmd.name}</h4>
                <p class="commander-years">${cmd.years}</p>
                <p>${cmd.desc}</p>
            </div>
        `;
    });
    html += '</div>';

    container.innerHTML = html;
}

// Pro stručnost - ostatní funkce budou následovat podobný pattern
// Nyní jen zkrácená verze pro ukázku

function renderTacticsTab() {
    const container = document.getElementById('tab-tactics');
    if (!container) return;

    const lang = i18n.getCurrentLanguage();
    const isEnglish = lang === 'en';

    container.innerHTML = `
        <h3>${isEnglish ? 'Hussite Military Tactics' : 'Husitská vojenská taktika'}</h3>
        <div class="tactics-section">
            <h4>${isEnglish ? 'Wagon Fort' : 'Vozová hradba'}</h4>
            <p>${isEnglish
                ? 'A revolutionary tactic that changed warfare. Heavy peasant wagons were modified for combat - reinforced with iron, equipped with wooden shields, firing ports, and hooks for connecting. In battle, they formed a mobile fortress from which shooters decimated attacking cavalry. The wagons could be quickly linked into a circle or square.'
                : 'Revoluční taktika, která změnila válečnictví. Těžké selské vozy byly upraveny pro boj - okované, s dřevěnými štíty, střílnami a háky na spojování. V bitvě vytvořily mobilní pevnost, ze které střelci decimovali útočící jízdu. Vozy se daly rychle spojit do kruhu nebo čtverce.'
            }</p>

            <h4>${isEnglish ? 'Firearms' : 'Palné zbraně'}</h4>
            <p>${isEnglish
                ? 'The Hussites were pioneers in the mass use of firearms in field battles. Hook guns, handgonnes, howitzers, and tarasnice gave their army devastating firepower. The noise and smoke also terrified the horses of enemy cavalry.'
                : 'Husité byli průkopníky v masovém použití palných zbraní v polních bitvách. Hákovnice, píšťaly, houfnice a tarasnice dávaly jejich vojsku devastující palebnou sílu. Hluk a kouř také děsil koně nepřátelské jízdy.'
            }</p>

            <h4>${isEnglish ? 'Combined Arms' : 'Kombinace zbraní'}</h4>
            <p>${isEnglish
                ? 'The Hussite army combined different types of units: shooters behind wagons conducted fire, flail-wielders and pike-wielders defended gaps between wagons, cavalry conducted sorties and pursued fleeing enemies.'
                : 'Husitské vojsko kombinovalo různé typy jednotek: střelci za vozy vedli palbu, cepníci a sudličníci bránili mezery mezi vozy, jízda prováděla výpady a pronásledovala prchající nepřátele.'
            }</p>

            <h4>${isEnglish ? 'Terrain Exploitation' : 'Využití terénu'}</h4>
            <p>${isEnglish
                ? 'Žižka masterfully exploited terrain. At Sudoměř, he positioned wagons on a dam between ponds; at Vítkov, he defended a steep hill. The Hussites always sought advantageous positions and forced the enemy to attack uphill or across obstacles.'
                : 'Žižka mistrně využíval terén. U Sudoměře postavil vozy na hrázi mezi rybníky, u Vítkova bránil strmý kopec. Husité vždy hledali výhodnou pozici a nutili nepřítele útočit do kopce nebo přes překážky.'
            }</p>

            <h4>${isEnglish ? 'Psychological Warfare' : 'Psychologická válka'}</h4>
            <p>${isEnglish
                ? 'The Hussite chorale "Ye Who Are Warriors of God" was sung before battle and during marches. Its sound terrified enemies so much that at Domažlice, the crusader army fled without seeing a single Hussite.'
                : 'Husitský chorál "Ktož jsú boží bojovníci" byl zpíván před bitvou a během pochodu. Jeho zvuk děsil nepřátele natolik, že u Domažlic křižácké vojsko uprchlo, aniž by spatřilo jediného husitu.'
            }</p>
        </div>
    `;
}

function renderTerrainTab() {
    const container = document.getElementById('tab-terrain');
    if (!container) return;

    const lang = i18n.getCurrentLanguage();
    const isEnglish = lang === 'en';

    container.innerHTML = `
        <h3>${isEnglish ? 'Terrain Types' : 'Typy terénu'}</h3>
        <div class="terrain-list">
            <div class="terrain-item">
                <canvas class="terrain-icon" data-terrain="plains" width="144" height="128" aria-hidden="true"></canvas>
                <div class="terrain-info">
                    <strong>${isEnglish ? 'Plains' : 'Pláně'}</strong>
                    <p>${isEnglish ? 'Basic terrain with no bonuses. Easy movement.' : 'Základní terén bez bonusů. Snadný pohyb.'}</p>
                </div>
            </div>
            <div class="terrain-item">
                <canvas class="terrain-icon" data-terrain="forest" width="144" height="128" aria-hidden="true"></canvas>
                <div class="terrain-info">
                    <strong>${isEnglish ? 'Forest' : 'Les'}</strong>
                    <p>${isEnglish ? '+2 defense. Slows movement.' : '+2 obrana. Zpomaluje pohyb.'}</p>
                </div>
            </div>
            <div class="terrain-item">
                <canvas class="terrain-icon" data-terrain="hills" width="144" height="128" aria-hidden="true"></canvas>
                <div class="terrain-info">
                    <strong>${isEnglish ? 'Hills' : 'Kopce'}</strong>
                    <p>${isEnglish ? '+3 defense. Slows movement.' : '+3 obrana. Zpomaluje pohyb.'}</p>
                </div>
            </div>
            <div class="terrain-item">
                <canvas class="terrain-icon" data-terrain="water" width="144" height="128" aria-hidden="true"></canvas>
                <div class="terrain-info">
                    <strong>${isEnglish ? 'Water' : 'Voda'}</strong>
                    <p>${isEnglish ? 'Impassable. Forms natural obstacles.' : 'Neprůchodná. Tvoří přirozené překážky.'}</p>
                </div>
            </div>
            <div class="terrain-item">
                <canvas class="terrain-icon" data-terrain="town" width="144" height="128" aria-hidden="true"></canvas>
                <div class="terrain-info">
                    <strong>${isEnglish ? 'Town' : 'Město'}</strong>
                    <p>${isEnglish ? '+4 defense. Strategic position.' : '+4 obrana. Strategická pozice.'}</p>
                </div>
            </div>
            <div class="terrain-item">
                <canvas class="terrain-icon" data-terrain="road" width="144" height="128" aria-hidden="true"></canvas>
                <div class="terrain-info">
                    <strong>${isEnglish ? 'Road' : 'Cesta'}</strong>
                    <p>${isEnglish ? 'Faster movement. No defensive bonuses.' : 'Rychlejší pohyb. Bez obranných bonusů.'}</p>
                </div>
            </div>
            <div class="terrain-item">
                <canvas class="terrain-icon" data-terrain="dam" width="144" height="128" aria-hidden="true"></canvas>
                <div class="terrain-info">
                    <strong>${isEnglish ? 'Dam' : 'Hráz'}</strong>
                    <p>${isEnglish ? '+2 defense. Narrow passage between ponds.' : '+2 obrana. Úzký průchod mezi rybníky.'}</p>
                </div>
            </div>
            <div class="terrain-item">
                <canvas class="terrain-icon" data-terrain="mud" width="144" height="128" aria-hidden="true"></canvas>
                <div class="terrain-info">
                    <strong>${isEnglish ? 'Mud' : 'Bahno'}</strong>
                    <p>${isEnglish ? 'Slows movement. Difficult terrain for cavalry.' : 'Zpomaluje pohyb. Obtížný terén pro jízdu.'}</p>
                </div>
            </div>
            <div class="terrain-item">
                <canvas class="terrain-icon" data-terrain="slope" width="144" height="128" aria-hidden="true"></canvas>
                <div class="terrain-info">
                    <strong>${isEnglish ? 'Slope' : 'Svah'}</strong>
                    <p>${isEnglish ? '+1 defense when defending. Bonus for attacker from above.' : '+1 obrana při obraně. Bonus pro útočníka shora.'}</p>
                </div>
            </div>
        </div>
    `;
    container.querySelectorAll('canvas[data-terrain]').forEach(canvas => {
        WoodcutRenderer.drawTerrainPreview(canvas, canvas.dataset.terrain);
    });
}

function renderRulesTab() {
    const container = document.getElementById('tab-rules');
    if (!container) return;

    const lang = i18n.getCurrentLanguage();
    const isEnglish = lang === 'en';

    container.innerHTML = `
        <h3>${isEnglish ? 'Combat Rules' : 'Pravidla boje'}</h3>
        <div class="rules-section">
            <h4>${isEnglish ? 'Turn Sequence' : 'Průběh tahu'}</h4>
            <p>${isEnglish
                ? 'Each unit can move and attack (or only one of those) in one turn. Defend spends its remaining actions and reduces incoming damage by 30%. At End Turn, unused units defend automatically, except stationary units with range 2 or more and a shot left: they prepare covering fire instead, without the defense bonus. A shooter can choose Take Cover for protection, forfeiting that reaction shot. Its card shows covering-fire readiness or the reason it is unavailable.'
                : 'Každá jednotka může v jednom tahu provést pohyb a útok (nebo pouze jedno z toho). Bránit spotřebuje zbývající akce a sníží příchozí poškození o 30 %. Na konci tahu se nevyužité oddíly brání automaticky, kromě stojících oddílů s dostřelem 2+ a zbývajícím výstřelem: ty připraví krycí palbu bez bonusu obrany. Střelec může zvolit Krýt se: získá ochranu, ale přijde o reakční výstřel. Jeho karta ukazuje připravenost krycí palby nebo důvod její nedostupnosti.'
            }</p>
        </div>
        <div class="rules-section">
            <h4>${isEnglish ? 'Damage Calculation' : 'Výpočet poškození'}</h4>
            <p>${isEnglish
                ? 'Damage = Unit Attack - Target Defense. Minimum damage is 5. Terrain adds bonuses to defense.'
                : 'Poškození = Útok jednotky - Obrana cíle. Minimální poškození je 5. Terén přidává bonus k obraně.'
            }</p>
        </div>
        <div class="rules-section">
            <h4>${isEnglish ? 'Striking Back' : 'Opětování útoku'}</h4>
            <p>${isEnglish
                ? 'In melee, only surviving infantry with Attack 28 or more counterattacks. Shooters do not return fire when hit: a stationary unit with range 2 or more and a shot left can instead fire at an enemy moving within range. That covering fire gives no defense bonus.'
                : 'V boji zblízka protiútočí jen přeživší pěchota s útokem alespoň 28. Střelci při zásahu neopětují palbu: stojící oddíl s dostřelem 2+ a volným výstřelem může místo toho vystřelit na nepřítele pohybujícího se v dostřelu. Krycí palba nedává bonus obrany.'
            }</p>
        </div>
        <div class="rules-section">
            <h4>${isEnglish ? 'Special Abilities' : 'Speciální schopnosti'}</h4>
            <ul>
                <li><strong>${isEnglish ? 'Charge' : 'Náraz (Charge)'}</strong>: ${isEnglish ? '+50% damage when attacking after moving' : '+50% poškození při útoku po pohybu'}</li>
                <li><strong>${isEnglish ? 'Anti-Cavalry' : 'Proti jízdě'}</strong>: ${isEnglish ? '+50% damage against cavalry' : '+50% poškození proti kavalerii'}</li>
                <li><strong>${isEnglish ? 'Crushing Blow' : 'Drtivý úder'}</strong>: ${isEnglish ? '+30% damage against armored units' : '+30% poškození proti obrněným'}</li>
                <li><strong>${isEnglish ? 'Wagon Fort' : 'Vozová hradba'}</strong>: ${isEnglish ? '+3 defense for each adjacent wagon' : '+3 obrana za každý sousední vůz'}</li>
                <li><strong>${isEnglish ? 'Range' : 'Dosah'}</strong>: ${isEnglish ? 'Attack over allied units' : 'Útok přes spojeneckou jednotku'}</li>
                <li><strong>${isEnglish ? 'Area Attack' : 'Plošný útok'}</strong>: ${isEnglish ? 'Hits all enemies in range' : 'Zasáhne všechny nepřátele v dosahu'}</li>
                <li><strong>${isEnglish ? 'Rapid Fire' : 'Rychlá palba'}</strong>: ${isEnglish ? '2 attacks per turn (75% damage)' : '2 útoky za tah (75% poškození)'}</li>
                <li><strong>${isEnglish ? 'Terrifying' : 'Děsivý'}</strong>: ${isEnglish ? 'Can frighten enemy (-2 attack)' : 'Může vyděsit nepřítele (-2 útok)'}</li>
            </ul>
        </div>
        <div class="rules-section">
            <h4>${isEnglish ? 'Victory Conditions' : 'Podmínky vítězství'}</h4>
            <p>${isEnglish
                ? 'Destroy all enemy units or achieve the mission objective.'
                : 'Zničte všechny nepřátelské jednotky nebo dosáhněte cíle mise.'
            }</p>
        </div>
        <div class="rules-section">
            <h4>${isEnglish ? 'Chorale "Ye Who Are Warriors of God"' : 'Chorál "Ktož jsú boží bojovníci"'}</h4>
            <p>${isEnglish
                ? 'One-time ability activated by button. Provides all Hussite units <strong>+50% attack</strong>, but <strong>-20% defense</strong> for 2 turns. Use at the right moment for a decisive attack!'
                : 'Jednorázová schopnost aktivovaná tlačítkem. Poskytuje všem husitským jednotkám <strong>+50% útok</strong>, ale <strong>-20% obrana</strong> na 2 kola. Použijte ve správný okamžik pro rozhodující útok!'
            }</p>
        </div>
        <div class="rules-section">
            <h4>${isEnglish ? 'Passive Regeneration' : 'Pasivní regenerace'}</h4>
            <p>${isEnglish
                ? 'Units next to a wagon fort or in a town heal <strong>+10 HP</strong> at the end of turn. Maximum up to 50% of original health. Each unit can regenerate only once per battle.'
                : 'Jednotky vedle vozové hradby nebo v městě se na konci tahu léčí o <strong>+10 HP</strong>. Maximálně do 50% původního zdraví. Každá jednotka může regenerovat pouze jednou za bitvu.'
            }</p>
        </div>
        <div class="rules-section">
            <h4>${isEnglish ? 'Wagon Fort Formation' : 'Formace vozové hradby'}</h4>
            <ul>
                <li><strong>${isEnglish ? 'Wagon Line' : 'Linie vozů'}</strong>: ${isEnglish ? '3+ wagons side by side get +10% defense extra' : '3+ vozy vedle sebe dostávají +10% obrana navíc'}</li>
                <li><strong>${isEnglish ? 'Firing Ports' : 'Střílny'}</strong>: ${isEnglish ? 'Shooters next to a wagon get +5 attack and +10% defense' : 'Střelci vedle vozu dostávají +5 útok a +10% obrana'}</li>
                <li><strong>${isEnglish ? 'Breakthrough' : 'Průlom'}</strong>: ${isEnglish ? 'When a wagon is destroyed, adjacent wagons lose formation bonus for 1 turn' : 'Při zničení vozu sousední vozy ztratí formační bonus na 1 kolo'}</li>
            </ul>
        </div>
        <div class="rules-section">
            <h4>${isEnglish ? 'Fog of War' : 'Mlha války'}</h4>
            <p>${isEnglish
                ? 'You only see the area around your units. Unexplored areas are dark, explored but not visible are gray.'
                : 'Vidíte pouze oblast kolem svých jednotek. Neprozkoumané oblasti jsou tmavé, prozkoumané ale neviditelné jsou šedé.'
            }</p>
            <ul>
                <li><strong>${isEnglish ? 'Scout' : 'Zvěd'}</strong>: ${isEnglish ? 'Sees 6 hexes - best scout' : 'Vidí na 6 hexů - nejlepší průzkumník'}</li>
                <li><strong>${isEnglish ? 'Shooters' : 'Střelci'}</strong>: ${isEnglish ? 'See 4 hexes' : 'Vidí na 4 hexy'}</li>
                <li><strong>${isEnglish ? 'Cavalry (light)' : 'Jízda (lehká)'}</strong>: ${isEnglish ? 'See 4 hexes' : 'Vidí na 4 hexy'}</li>
                <li><strong>${isEnglish ? 'Infantry' : 'Pěchota'}</strong>: ${isEnglish ? 'See 3 hexes' : 'Vidí na 3 hexy'}</li>
                <li><strong>${isEnglish ? 'Heavy Cavalry' : 'Těžká jízda'}</strong>: ${isEnglish ? 'See 3 hexes (helmet limitation)' : 'Vidí na 3 hexy (omezení helmy)'}</li>
                <li><strong>${isEnglish ? 'Artillery and wagons' : 'Dělostřelectvo a vozy'}</strong>: ${isEnglish ? 'See 3 hexes' : 'Vidí na 3 hexy'}</li>
                <li><strong>${isEnglish ? 'Commander' : 'Velitel'}</strong>: ${isEnglish ? 'Sees 4 hexes' : 'Vidí na 4 hexy'}</li>
            </ul>
            <p><strong>${isEnglish ? 'Terrain Modifiers' : 'Terénní modifikátory'}</strong>:</p>
            <ul>
                <li><strong>${isEnglish ? 'On a hill' : 'Na kopci'}</strong>: ${isEnglish ? '+1 to visibility' : '+1 k viditelnosti'}</li>
                <li><strong>${isEnglish ? 'In forest' : 'V lese'}</strong>: ${isEnglish ? '-1 to visibility' : '-1 k viditelnosti'}</li>
                <li><strong>${isEnglish ? 'Seeing into forest' : 'Vidění do lesa'}</strong>: ${isEnglish ? 'Only 2 hexes (unless you are in forest yourself)' : 'Pouze na 2 hexy (pokud nejste sami v lese)'}</li>
            </ul>
        </div>
        <div class="rules-section">
            <h4>${isEnglish ? 'Scout - Special Unit' : 'Zvěd - speciální jednotka'}</h4>
            <p>${isEnglish
                ? 'Light cavalry specialized in battlefield reconnaissance.'
                : 'Lehký jezdec specializovaný na průzkum bojiště.'
            }</p>
            <ul>
                <li><strong>${isEnglish ? 'Reconnaissance' : 'Průzkum'}</strong>: ${isEnglish ? 'Sees 6 hexes - best visibility of all units' : 'Vidí na 6 hexů - nejlepší viditelnost ze všech jednotek'}</li>
                <li><strong>${isEnglish ? 'Quick Escape' : 'Rychlý únik'}</strong>: ${isEnglish ? 'After surviving an attack, can move 2 hexes away for free' : 'Po přežití útoku se může zdarma přesunout o 2 hexy pryč'}</li>
                <li><strong>${isEnglish ? 'Hidden Movement' : 'Skrytý pohyb'}</strong>: ${isEnglish ? 'In forest or on hills, enemy sees only 2 hexes away' : 'V lese nebo na kopci ho nepřítel vidí jen na 2 hexy'}</li>
                <li><strong>${isEnglish ? 'Detection' : 'Odhalení'}</strong>: ${isEnglish ? 'Can reveal hidden enemy units' : 'Může odhalit skryté nepřátelské jednotky'}</li>
            </ul>
            <p><strong>${isEnglish ? 'Limitations' : 'Omezení'}</strong>: ${isEnglish ? 'Weak in combat (-50% attack against infantry in defensive position), max 2 scouts per battle.' : 'Slabý v boji (-50% útoku proti pěchotě v obranné pozici), max 2 zvědi na bitvu.'}</p>
        </div>
        <div class="rules-section">
            <h4>${isEnglish ? 'Morale Break' : 'Morální zlom'}</h4>
            <p>${isEnglish
                ? 'When an army suffers critical losses, its morale collapses and units begin to flee the battlefield.'
                : 'Když armáda utrpí kritické ztráty, její morálka se zhroutí a jednotky začnou prchat z bojiště.'
            }</p>
            <ul>
                <li><strong>${isEnglish ? 'Commander Fall' : 'Pád velitele'}</strong>: ${isEnglish ? 'Death of commander causes immediate morale break' : 'Smrt velitele způsobí okamžitý morální zlom'}</li>
                <li><strong>${isEnglish ? 'Heavy Losses' : 'Těžké ztráty'}</strong>: ${isEnglish ? 'Loss of 60%+ of army triggers morale break' : 'Ztráta 60%+ armády spustí morální zlom'}</li>
                <li><strong>${isEnglish ? 'Panic' : 'Panika'}</strong>: ${isEnglish ? 'When more than half of units are fleeing' : 'Když prchá více než polovina jednotek'}</li>
                <li><strong>${isEnglish ? 'Escape' : 'Útěk'}</strong>: ${isEnglish ? 'Fleeing units at map edge escape from battlefield' : 'Prchající jednotky na okraji mapy uprchnou z bojiště'}</li>
            </ul>
        </div>
    `;
}

function renderControlsTab() {
    const container = document.getElementById('tab-controls');
    if (!container) return;

    const lang = i18n.getCurrentLanguage();
    const isEnglish = lang === 'en';

    container.innerHTML = `
        <h3>${isEnglish ? 'Controls' : 'Ovládání'}</h3>
        <div class="controls-list">
            <div class="control-item">
                <span class="control-key">${isEnglish ? 'Left Mouse Button' : 'Levé tlačítko myši'}</span>
                <span class="control-desc">${isEnglish ? 'Select unit / Move / Attack' : 'Výběr jednotky / Pohyb / Útok'}</span>
            </div>
            <div class="control-item">
                <span class="control-key">${isEnglish ? 'Right Mouse Button' : 'Pravé tlačítko myši'}</span>
                <span class="control-desc">${isEnglish ? 'Cancel selection' : 'Zrušení výběru'}</span>
            </div>
            <div class="control-item">
                <span class="control-key">${isEnglish ? 'Mouse Wheel' : 'Kolečko myši'}</span>
                <span class="control-desc">${isEnglish ? 'Zoom in / Zoom out map' : 'Přiblížení / Oddálení mapy'}</span>
            </div>
            <div class="control-item">
                <span class="control-key">${isEnglish ? 'Mouse Drag' : 'Tažení myší'}</span>
                <span class="control-desc">${isEnglish ? 'Pan map' : 'Posun mapy'}</span>
            </div>
            <div class="control-item">
                <span class="control-key">${isEnglish ? 'Minimap' : 'Minimapa'}</span>
                <span class="control-desc">${isEnglish ? 'Click to quickly move view' : 'Kliknutím rychle přesunete pohled'}</span>
            </div>
            <div class="control-item">
                <span class="control-key">Tab</span>
                <span class="control-desc">${isEnglish ? 'Next unit (that can act)' : 'Další jednotka (která může jednat)'}</span>
            </div>
            <div class="control-item">
                <span class="control-key">${isEnglish ? 'Enter / Space' : 'Enter / Mezerník'}</span>
                <span class="control-desc">${isEnglish ? 'End turn; unused units defend or prepare covering fire' : 'Ukončit tah; nevyužité oddíly se brání či kryjí palbou'}</span>
            </div>
            <div class="control-item">
                <span class="control-key">D</span>
                <span class="control-desc">${isEnglish ? 'Defensive stance: −30% incoming damage' : 'Obranný postoj: −30 % příchozího poškození'}</span>
            </div>
            <div class="control-item">
                <span class="control-key">Escape</span>
                <span class="control-desc">${isEnglish ? 'Cancel action / Close menu' : 'Zrušit akci / Zavřít menu'}</span>
            </div>
        </div>
    `;
}

const ABOUT_LINKS = Object.freeze({
    issues: 'https://github.com/josefslerka/husitske-valky/issues',
    source: 'https://github.com/josefslerka/husitske-valky',
    license: 'https://github.com/josefslerka/husitske-valky/blob/main/LICENSE',
    support: 'https://buymeacoffee.com/josefslerka'
});

function getAboutContentMarkup() {
    const text = key => i18n.t(`about.${key}`);

    return `
        <article class="about-content">
            <header class="about-intro">
                <p class="about-kicker">${text('tagline')}</p>
                <h3>${text('gameTitle')}</h3>
                <p class="about-version" data-i18n="menu.version">${i18n.t('menu.version')}</p>
                <p class="about-lede">${text('description')}</p>
            </header>

            <div class="about-columns">
                <section class="about-section about-panel">
                    <div class="about-section-heading">
                        <span class="about-section-index" aria-hidden="true">I.</span>
                        <h4>${text('authorshipTitle')}</h4>
                    </div>
                    <dl class="about-facts">
                        <div>
                            <dt>${text('authorLabel')}</dt>
                            <dd>${text('author')}</dd>
                        </div>
                        <div>
                            <dt>${text('developmentLabel')}</dt>
                            <dd>${text('development')}</dd>
                        </div>
                        <div>
                            <dt>${text('researchLabel')}</dt>
                            <dd>${text('research')}</dd>
                        </div>
                        <div>
                            <dt>${text('thanksLabel')}</dt>
                            <dd>${text('thanks')}</dd>
                        </div>
                    </dl>
                </section>

                <section class="about-section about-panel">
                    <div class="about-section-heading">
                        <span class="about-section-index" aria-hidden="true">II.</span>
                        <h4>${text('projectTitle')}</h4>
                    </div>
                    <nav class="about-links" aria-label="${text('projectLinksLabel')}">
                        <a href="${ABOUT_LINKS.issues}" target="_blank" rel="noopener noreferrer">
                            <span>${text('feedback')}</span><span aria-hidden="true">↗</span>
                        </a>
                        <a href="${ABOUT_LINKS.source}" target="_blank" rel="noopener noreferrer">
                            <span>${text('source')}</span><span aria-hidden="true">↗</span>
                        </a>
                    </nav>
                    <p class="about-license">
                        <a href="${ABOUT_LINKS.license}" target="_blank" rel="noopener noreferrer">${text('license')}</a>
                    </p>
                </section>
            </div>

            <section class="about-support">
                <div>
                    <h4>${text('supportTitle')}</h4>
                    <p>${text('supportText')}</p>
                </div>
                <a href="${ABOUT_LINKS.support}" target="_blank" rel="noopener noreferrer" class="coffee-button">
                    <span aria-hidden="true">☕</span> ${i18n.t('menu.support')}
                </a>
            </section>
        </article>
    `;
}

function renderAboutTab() {
    const container = document.getElementById('tab-about');
    if (container) container.innerHTML = getAboutContentMarkup();
}

function renderAboutModal() {
    const container = document.getElementById('about-content');
    if (container) container.innerHTML = getAboutContentMarkup();
}
