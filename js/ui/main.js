// Hlavní vstupní bod - inicializace hry

function readLocalPreference(key) {
    try { return GameStorage.getItem(key); }
    catch (error) { console.warn('Preference nelze načíst', error); return null; }
}

// Starší/poškozené nastavení nesmí vyřadit celé menu. Převzít jen známé,
// platné hodnoty; výchozí volby zůstávají v inicializaci a původní JSON nemažeme.
function readGamePreferences() {
    try {
        const saved = JSON.parse(readLocalPreference('husitskeValky_settings'));
        if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {};
        const clean = {};
        for (const key of ['soundEnabled', 'showDamage']) {
            if (typeof saved[key] === 'boolean') clean[key] = saved[key];
        }
        if (Number.isFinite(saved.soundVolume) && saved.soundVolume >= 0 && saved.soundVolume <= 100) clean.soundVolume = saved.soundVolume;
        if (['fast', 'normal', 'slow'].includes(saved.aiSpeed)) clean.aiSpeed = saved.aiSpeed;
        if (['beginner', 'advanced'].includes(saved.difficultyLevel)) clean.difficultyLevel = saved.difficultyLevel;
        return clean;
    } catch (error) { console.warn('Poškozené nastavení, používám výchozí hodnoty', error); return {}; }
}

// Stejný účet pro rychlé hodnocení i srovnání s kronikou. Do celkového počtu
// patří také příchozí posily; ztráty zahrnují zničené i uprchlé jednotky.
function getBattleResultCounts(stats, activeGame) {
    const tally = (faction, counter, initialCounter) => {
        const lost = stats?.lossesByFaction
            ? (stats.lossesByFaction[faction] || 0) + (stats.fledByFaction?.[faction] || 0)
            : (stats?.[counter] ?? activeGame?.[counter] ?? 0);
        const alive = stats?.aliveByFaction?.[faction]
            ?? activeGame?.units?.filter(u => u.faction === faction && u.health > 0).length;
        const total = alive != null ? alive + lost : Math.max(activeGame?.[initialCounter] || 0, lost);
        return { lost, total };
    };
    return {
        player: tally('hussites', 'unitsLost', 'initialPlayerUnits'),
        enemy: tally('crusaders', 'enemiesKilled', 'initialEnemyUnits')
    };
}

// Browser chrome in embedded webviews is not always represented by the CSS
// safe-area inset. Prefer the measured visual viewport; known embedded-browser
// signals are only a fallback when the host draws a floating bar over it.
function calculateBrowserBottomClearance({ compact, standalone, innerHeight, viewportHeight, viewportOffsetTop = 0, embedded } = {}) {
    if (!compact || standalone) return 0;
    const occluded = Number.isFinite(innerHeight) && Number.isFinite(viewportHeight)
        ? Math.max(0, innerHeight - viewportHeight - viewportOffsetTop)
        : 0;
    if (occluded >= 20 && occluded <= 120) return Math.ceil(occluded);
    return embedded ? 68 : 0;
}

function isLikelyEmbeddedBrowser() {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
    const referrer = typeof document !== 'undefined' ? document.referrer || '' : '';
    return /Twitter|LinkedInApp|FBAN|FBAV|Instagram|Line\/|;\s*wv\)|\bwv\b|(?:x|t)\.co|linkedin\.com/i.test(`${ua} ${referrer}`);
}

function syncBrowserBottomClearance(gameContainer, compact) {
    if (!gameContainer || typeof window === 'undefined') return 0;
    const viewport = window.visualViewport;
    const standalone = Boolean(
        window.matchMedia?.('(display-mode: standalone)')?.matches ||
        (typeof navigator !== 'undefined' && navigator.standalone)
    );
    const clearance = calculateBrowserBottomClearance({
        compact,
        standalone,
        innerHeight: window.innerHeight,
        viewportHeight: viewport?.height,
        viewportOffsetTop: viewport?.offsetTop || 0,
        embedded: isLikelyEmbeddedBrowser()
    });
    if (gameContainer.style?.setProperty) {
        gameContainer.style.setProperty('--browser-bottom-clearance', `${clearance}px`);
    } else if (gameContainer.style) {
        gameContainer.style['--browser-bottom-clearance'] = `${clearance}px`;
    }
    // Notifikace jsou mimo #game-container, ale také musí zůstat nad lištou webview.
    document.documentElement?.style?.setProperty?.('--browser-bottom-clearance', `${clearance}px`);
    return clearance;
}

// Custom confirm dialog
function showConfirmDialog(message, title = null) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-modal');
        const titleEl = document.getElementById('confirm-title');
        const messageEl = document.getElementById('confirm-message');
        const okBtn = document.getElementById('confirm-ok');
        const cancelBtn = document.getElementById('confirm-cancel');
        if (!modal.classList.contains('hidden')) { resolve(false); return; }
        const previousFocus = document.activeElement;

        // Použij i18n pro výchozí titulek
        titleEl.textContent = title || (typeof i18n !== 'undefined' ? i18n.t('confirm.title') : 'Potvrzení');
        messageEl.textContent = message;
        modal.classList.remove('hidden');

        const finish = confirmed => {
            modal.classList.add('hidden');
            okBtn.removeEventListener('click', handleOk);
            cancelBtn.removeEventListener('click', handleCancel);
            document.removeEventListener('keydown', handleKey, true);
            previousFocus?.focus?.();
            resolve(confirmed);
        };
        const handleOk = () => finish(true);
        const handleCancel = () => finish(false);
        const handleKey = event => {
            if (event.key === 'Escape') {
                event.preventDefault(); event.stopImmediatePropagation(); handleCancel();
            } else if (event.key === 'Tab') {
                event.preventDefault(); event.stopImmediatePropagation();
                (document.activeElement === cancelBtn ? okBtn : cancelBtn).focus?.();
            }
        };

        okBtn.addEventListener('click', handleOk);
        cancelBtn.addEventListener('click', handleCancel);
        document.addEventListener('keydown', handleKey, true);
        cancelBtn.focus?.();
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    document.body.classList.toggle('test-build', GameStorage.isTest);
    // Veškeré dynamické UI se staví až po načtení locale. Tím odpadá závod,
    // kdy se menu a první seznam misí vykreslily dřív než překlady.
    document.getElementById('btn-startup-retry').addEventListener('click', () => window.location.reload());
    try {
        await i18n.init();
    } catch (error) {
        console.error('Hru nelze spustit:', error);
        document.getElementById('startup-loading').classList.add('hidden');
        document.getElementById('startup-error').classList.remove('hidden');
        document.getElementById('btn-startup-retry').focus();
        return;
    }
    document.getElementById('startup-status').classList.add('hidden');
    document.body.classList.remove('booting');
    // Reference na obrazovky
    const mainMenu = document.getElementById('main-menu');
    const gameContainer = document.getElementById('game-container');

    // Reference na modaly
    const missionModal = document.getElementById('mission-modal');
    const helpModal = document.getElementById('help-modal');
    const pauseModal = document.getElementById('pause-modal');
    const settingsModal = document.getElementById('settings-modal');
    const aboutModal = document.getElementById('about-modal');
    const gameoverModal = document.getElementById('gameover-modal');
    const objectivesPanel = document.getElementById('objectives-panel');

    // Získání canvasu
    const canvas = document.getElementById('game-canvas');

    // Herní proměnné
    let hexGrid = null;
    let game = null;
    let selectedScenario = null;
    const showResultsButton = document.getElementById('btn-show-results');

    function setPostBattleReview(active) {
        gameContainer.classList.toggle('post-battle-review', active);
        showResultsButton.classList.toggle('hidden', !active);
        showResultsButton.setAttribute('aria-hidden', String(!active));
    }

    function openGameOverResults() {
        gameoverModal.classList.remove('hidden');
        gameoverModal.setAttribute('aria-hidden', 'false');
        document.getElementById('gameover-scroll').scrollTop = 0;
        document.getElementById('gameover-title').focus({ preventScroll: true });
    }

    function reviewBattlefield() {
        gameoverModal.classList.add('hidden');
        gameoverModal.setAttribute('aria-hidden', 'true');
        game?.view?.orders?.cancel();
        game?.view?.panels?.updateGuidance();
        showResultsButton.focus({ preventScroll: true });
    }

    function resetPostBattleReview() {
        setPostBattleReview(false);
        gameoverModal.classList.add('hidden');
        gameoverModal.setAttribute('aria-hidden', 'true');
    }

    // Úklid staré instance hry - jinak její listenery a animační smyčka
    // zůstávají aktivní a každý klik na tlačítka se zpracuje vícekrát
    function destroyCurrentGame() {
        resetPostBattleReview();
        if (game && typeof game.destroy === 'function') {
            game.saveGame({ automatic: true });
            game.destroy();
        }
        game = null;
        window.game = null;
        window.hexGrid = null;
    }

    // Nastavení hry
    const gameSettings = {
        soundEnabled: true,
        soundVolume: 70,
        aiSpeed: 'normal',
        showDamage: true,
        difficultyLevel: 'beginner' // 'beginner' = bez mlhy, 'advanced' = s mlhou války
    };

    // Nastavení musí být dostupné i pro game.js / ai.js / CombatSystem
    // (aiSpeed, showDamage)
    window.gameSettings = gameSettings;

    // Načtení uložených nastavení
    loadSettings();

    // Aplikace hlasitosti z uložených nastavení
    applyVolumeSettings();

    function applyVolumeSettings() {
        const vol = (gameSettings.soundVolume !== undefined ? gameSettings.soundVolume : 70) / 100;
        Sound.setVolume(vol);
        Music.setVolume(vol);
        Music.setEnabled(gameSettings.soundEnabled);
    }

    // =============================================
    // HLAVNÍ MENU
    // =============================================

    // Tlačítko Nová hra
    document.getElementById('btn-new-campaign').addEventListener('click', () => {
        showMissionSelection();
    });
    document.getElementById('btn-first-battle').addEventListener('click', () => {
        showMissionSelection();
        showMissionDetails('zivohost_1419');
        document.getElementById('mission-controls').open = true;
    });

    // Tlačítko Pokračovat
    document.getElementById('btn-continue').addEventListener('click', () => {
        const savedGame = readLocalPreference('husitskeValky_save');
        if (savedGame) {
            startGameFromSave();
        }
    });
    document.getElementById('btn-resume-auto').addEventListener('click', () => startGameFromSave(true));

    // Kontrola zda existuje uložená hra
    checkSavedGame();

    // Tlačítko Rychlá bitva (spustí výchozí bitvu bez scénáře)
    document.getElementById('btn-quick-battle').addEventListener('click', () => {
        startQuickBattle();
    });

    // Tlačítko Encyklopedie
    document.getElementById('btn-encyclopedia').addEventListener('click', () => {
        showEncyclopedia();
    });

    // WP2b: Tlačítko Kronika
    const chronicleModal = document.getElementById('chronicle-modal');
    const btnChronicle = document.getElementById('btn-chronicle');
    if (btnChronicle) {
        btnChronicle.addEventListener('click', () => showChronicle());
    }
    const chronicleClose = document.getElementById('chronicle-close');
    if (chronicleClose) {
        chronicleClose.addEventListener('click', () => ChronicleView.close());
    }
    if (chronicleModal) {
        chronicleModal.addEventListener('click', (e) => {
            if (e.target === chronicleModal) ChronicleView.close();
        });
    }
    document.getElementById('chronicle-export').addEventListener('click', () => {
        const status = document.getElementById('chronicle-export-status');
        try {
            if (ChronicleView.download()) status.textContent = i18n.t('chronicle.exportStarted');
        } catch (error) {
            console.warn('Chronicle: export se nezdařil', error);
            status.textContent = i18n.t('chronicle.exportFailed');
        }
    });

    // Tlačítko Nastavení
    document.getElementById('btn-settings').addEventListener('click', () => {
        showSettings();
    });

    // Tlačítko O hře
    document.getElementById('btn-about').addEventListener('click', () => {
        showAbout();
    });

    // Tlačítko Hudba v hlavním menu
    const menuMusicBtn = document.getElementById('btn-menu-music');
    function updateMenuMusicButton(isPlaying = Boolean(Music.isPlaying)) {
        menuMusicBtn.textContent = i18n.t(!gameSettings.soundEnabled ? 'menu.musicMuted' : isPlaying ? 'menu.musicPlaying' : 'menu.music');
        menuMusicBtn.disabled = !gameSettings.soundEnabled;
        menuMusicBtn.classList.toggle('playing', isPlaying);
        menuMusicBtn.setAttribute('aria-pressed', String(isPlaying));
    }
    menuMusicBtn.addEventListener('click', () => {
        updateMenuMusicButton(Music.toggle());
    });
    window.addEventListener('musicstatechange', () => updateMenuMusicButton());
    updateMenuMusicButton();

    // Tlačítko přepínání jazyka v hlavním menu
    const languageToggleBtn = document.getElementById('btn-language-toggle');
    const languageTarget = document.getElementById('language-target');
    const changelogLink = document.getElementById('menu-changelog');

    // Značka říká, do kterého jazyka tlačítko přepne, ne který právě čteme.
    function updateLanguageToggle() {
        const currentLanguage = i18n.getCurrentLanguage();
        languageTarget.textContent = currentLanguage === 'cs' ? 'EN' : 'CS';
        const label = i18n.t('menu.switchLanguage');
        languageToggleBtn.setAttribute('title', label);
        languageToggleBtn.setAttribute('aria-label', label);
        // Stejný jazyk jako menu, včetně první návštěvy dle prohlížeče.
        if (changelogLink) {
            const file = currentLanguage === 'en' ? 'CHANGELOG.en.md' : 'CHANGELOG.md';
            changelogLink.setAttribute('href', `https://github.com/josefslerka/husitske-valky/blob/main/${file}`);
        }
    }

    languageToggleBtn.addEventListener('click', async () => {
        const currentLang = i18n.getCurrentLanguage();
        const newLang = currentLang === 'cs' ? 'en' : 'cs';
        await i18n.setLanguage(newLang);
        updateLanguageToggle();
    });

    // Nastav správnou značku jazyka při načtení.
    updateLanguageToggle();

    // =============================================
    // VÝBĚR MISÍ - KAMPAŇ S AKTY
    // =============================================

    let currentAct = 1;

    // Statické data-i18n uzly řeší i18n samo. Tady obnovujeme obsah, který
    // vzniká až za běhu (karty misí, detail, cíle a hlavička rychlé bitvy).
    document.addEventListener('languageChanged', () => {
        game?.view?.orders?.cancel();
        game?.view?.orders?.refresh();
        checkSavedGame();
        updateLanguageToggle();
        updateCampaignProgressUI();
        updateSoundButton();

        updateMenuMusicButton();

        const settingsLanguage = document.getElementById('language-select');
        if (settingsLanguage) settingsLanguage.value = i18n.getCurrentLanguage();

        if (selectedScenario?.id) {
            const baseScenario = ScenarioManager.getScenario(selectedScenario.id);
            if (baseScenario) selectedScenario = getLocalizedScenario(selectedScenario.id, baseScenario);
        }

        if (game?.currentScenario) {
            updateObjectivesPanel(game.currentScenario);
        } else if (game?.gameState === 'playing') {
            document.getElementById('battle-name').textContent = i18n.t('quickBattle.name');
            document.getElementById('battle-date').textContent = i18n.t('quickBattle.date');
        }

        if (!missionModal.classList.contains('hidden')) {
            const missionDetails = document.getElementById('mission-details');
            if (!missionDetails.classList.contains('hidden') && selectedScenario?.id) {
                showMissionDetails(selectedScenario.id);
            } else {
                showActBattles(currentAct);
            }
        }
        if (!chronicleModal.classList.contains('hidden')) ChronicleView.render();
        if (!gameoverModal.classList.contains('hidden')) {
            HistoricalNotesView.mount(document.getElementById('gameover-sources'), game?.currentScenario?.id || selectedScenario?.id);
        }
        game?.view?.panels?.updateGuidance();
    });

    function updateCampaignProgressUI() {
        if (typeof CampaignProgressSystem === 'undefined') return;
        const progress = CampaignProgressSystem.load();
        const value = document.getElementById('campaign-reputation-value');
        const fill = document.getElementById('campaign-reputation-fill');
        const tier = document.getElementById('campaign-reputation-tier');
        if (value) value.textContent = progress.reputation;
        if (fill) fill.style.width = `${progress.reputation}%`;
        if (tier) tier.textContent = i18n.t(`campaign.reputation.${CampaignProgressSystem.getReputationTier(progress.reputation)}`);
    }

    function showMissionSelection() {
        mainMenu.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        missionModal.classList.remove('hidden');

        // Než je vybrána konkrétní bitva, nenechávej za modalem český
        // placeholder ze statického HTML.
        document.getElementById('battle-name').textContent = i18n.t('campaign.title');
        document.getElementById('battle-date').textContent = i18n.t('campaign.subtitle');

        const missionList = document.getElementById('mission-list');
        const missionDetails = document.getElementById('mission-details');
        const campaignActs = document.getElementById('campaign-acts');

        // Zobrazení seznamu, skrytí detailů
        missionList.classList.remove('hidden');
        missionDetails.classList.add('hidden');
        if (campaignActs) campaignActs.classList.remove('hidden');

        // Při prvním otevření ukaž nejzazší odemčený akt;
        // zamčený dříve zvolený akt se nikdy nezobrazí napůl.
        if (typeof CampaignProgressSystem !== 'undefined'
            && !CampaignProgressSystem.isActUnlocked(currentAct)) {
            currentAct = CampaignProgressSystem.getHighestUnlockedAct();
        }

        updateCampaignProgressUI();

        // Inicializace záložek aktů
        initActTabs();

        // Zobrazení bitev aktuálního aktu
        showActBattles(currentAct);
    }

    function initActTabs() {
        const tabs = document.querySelectorAll('.act-tab');
        tabs.forEach(tab => {
            const actId = parseInt(tab.dataset.act);
            const unlocked = typeof CampaignProgressSystem === 'undefined'
                || CampaignProgressSystem.isActUnlocked(actId);
            tab.classList.toggle('locked', !unlocked);
            tab.classList.toggle('active', unlocked && actId === currentAct);
            tab.setAttribute('aria-disabled', String(!unlocked));

            // Volá se při každém otevření výběru misí - bez guardu se
            // listenery hromadí a klik se zpracuje vícekrát
            if (tab.dataset.listenerAdded) return;
            tab.dataset.listenerAdded = 'true';
            tab.addEventListener('click', () => {
                const actId = parseInt(tab.dataset.act);
                if (typeof CampaignProgressSystem !== 'undefined'
                    && !CampaignProgressSystem.isActUnlocked(actId)) return;

                // Aktivace záložky
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                currentAct = actId;
                showActBattles(actId);
            });
        });
    }

    function showActBattles(actId) {
        const act = Campaign.getAct(actId);
        if (!act) return;
        if (typeof CampaignProgressSystem !== 'undefined'
            && !CampaignProgressSystem.isActUnlocked(actId)) return;

        const missionList = document.getElementById('mission-list');
        const actDescription = document.getElementById('act-description');

        // Aktualizace popisu aktu
        if (actDescription) {
            const descKey = `campaign.act${actId}.description`;
            const description = typeof i18n !== 'undefined' ? i18n.t(descKey) : act.description;
            actDescription.innerHTML = `<p data-i18n="${descKey}">${description}</p>`;
        }

        // Naplnění seznamu bitev
        missionList.innerHTML = '';

        let battleNumber = 1;
        act.battles.forEach((battleRef) => {
            const baseScenario = ScenarioManager.getScenario(battleRef.id);
            const scenario = baseScenario && typeof getLocalizedScenario === 'function'
                ? getLocalizedScenario(battleRef.id, baseScenario)
                : baseScenario;
            const isLocked = battleRef.locked || !battleRef.available
                || (typeof CampaignProgressSystem !== 'undefined'
                    && !CampaignProgressSystem.isBattleUnlocked(battleRef.id));
            const battleRecord = typeof CampaignProgressSystem !== 'undefined'
                ? CampaignProgressSystem.getBattleRecord(battleRef.id)
                : null;
            const completed = battleRecord?.result === 'victory';

            const card = document.createElement('div');
            card.className = 'mission-card' + (isLocked ? ' locked' : '') + (completed ? ' completed' : '');
            card.dataset.scenarioId = battleRef.id;

            if (scenario) {
                // Hvězdičky obtížnosti s popiskem
                const difficultyLabels = ['', i18n.t('difficulty.veryEasy'), i18n.t('difficulty.easy'), i18n.t('difficulty.medium'), i18n.t('difficulty.hard'), i18n.t('difficulty.veryHard')];
                let starsHtml = '';
                for (let i = 1; i <= 5; i++) {
                    starsHtml += `<span class="star ${i <= scenario.difficulty ? 'filled' : ''}">★</span>`;
                }
                const difficultyTooltip = difficultyLabels[scenario.difficulty] || '';

                // Tutorial marker
                const tutorialMarker = scenario.tutorial ? `<span class="tutorial-marker">${i18n.t('mission.tutorial')}</span>` : '';

                card.innerHTML = `
                    <div class="mission-card-number">${isLocked ? '🔒' : (completed ? '✓' : battleNumber)}</div>
                    <div class="mission-card-info">
                        <div class="mission-card-title">${scenario.name}${tutorialMarker}</div>
                        <div class="mission-card-date">${scenario.date}</div>
                        <div class="mission-card-desc">${isLocked ? i18n.t('mission.locked') : scenario.description}</div>
                    </div>
                    <div class="mission-card-difficulty" title="${i18n.t('mission.difficulty')}: ${difficultyTooltip}">${starsHtml}</div>
                `;

                if (!isLocked) {
                    card.tabIndex = 0;
                    card.setAttribute('role', 'button');
                    card.addEventListener('click', () => showMissionDetails(battleRef.id));
                    card.addEventListener('keydown', event => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault(); showMissionDetails(battleRef.id);
                        }
                    });
                    battleNumber++;
                }
            } else {
                // Scénář zatím neexistuje - zobrazíme placeholder
                const placeholderNames = {
                    'kutna_hora_1421': 'Bitva u Kutné Hory',
                    'nemecky_brod_1422': 'Bitva u Německého Brodu',
                    'most_1421': 'Bitva u Mostu',
                    'horice_1423': 'Bitva u Hořic',
                    'malesov_1424': 'Bitva u Malešova',
                    'tachov_1427': 'Bitva u Tachova',
                    'spanila_jizda_1428': 'Spanilá jízda',
                    'oblehani_plzne_1433': 'Obléhání Plzně',
                    'sion_1437': 'Obléhání Sionu'
                };

                const placeholderDates = {
                    'kutna_hora_1421': 'prosinec 1421',
                    'nemecky_brod_1422': 'leden 1422',
                    'most_1421': 'srpen 1421',
                    'horice_1423': 'duben 1423',
                    'malesov_1424': 'červen 1424',
                    'tachov_1427': 'srpen 1427',
                    'spanila_jizda_1428': '1428-1430',
                    'oblehani_plzne_1433': '1433-1434',
                    'sion_1437': 'únor 1437'
                };

                card.innerHTML = `
                    <div class="mission-card-number">🔒</div>
                    <div class="mission-card-info">
                        <div class="mission-card-title">${placeholderNames[battleRef.id] || i18n.t('mission.unknown')}</div>
                        <div class="mission-card-date">${placeholderDates[battleRef.id] || '???'}</div>
                        <div class="mission-card-desc">${i18n.t('mission.preparing')}</div>
                    </div>
                    <div class="mission-card-difficulty">
                        <span class="star">★</span>
                        <span class="star">★</span>
                        <span class="star">★</span>
                    </div>
                `;
            }

            missionList.appendChild(card);
        });
    }

    function showMissionDetails(scenarioId) {
        let scenario = ScenarioManager.getScenario(scenarioId);
        if (!scenario) return;

        // Použij lokalizovanou verzi scénáře
        if (typeof getLocalizedScenario === 'function') {
            scenario = getLocalizedScenario(scenarioId, scenario);
        }

        selectedScenario = scenario;

        const missionList = document.getElementById('mission-list');
        const missionDetails = document.getElementById('mission-details');
        const campaignActs = document.getElementById('campaign-acts');
        const actDescription = document.getElementById('act-description');
        const tutorialBadge = document.getElementById('mission-tutorial-badge');

        // Skrytí seznamu a záložek, zobrazení detailů
        missionList.classList.add('hidden');
        missionDetails.classList.remove('hidden');
        if (campaignActs) campaignActs.classList.add('hidden');
        if (actDescription) actDescription.classList.add('hidden');

        // Naplnění detailů
        document.getElementById('mission-title').textContent = scenario.name;
        document.getElementById('mission-date').textContent = scenario.date;
        document.getElementById('mission-description').textContent = scenario.description;
        document.getElementById('mission-briefing').textContent = scenario.briefing.hussites;

        // Tutorial badge
        if (tutorialBadge) {
            if (scenario.tutorial) {
                tutorialBadge.classList.remove('hidden');
            } else {
                tutorialBadge.classList.add('hidden');
            }
        }

        // Cíle mise
        const objectivesList = document.getElementById('mission-objectives-list');
        objectivesList.innerHTML = '';

        // Hlavní cíl
        const primaryLi = document.createElement('li');
        primaryLi.className = 'primary';
        primaryLi.textContent = scenario.victoryConditions.primary.description;
        objectivesList.appendChild(primaryLi);

        // Sekundární cíle
        if (scenario.victoryConditions.secondary) {
            for (const secondary of scenario.victoryConditions.secondary) {
                const li = document.createElement('li');
                li.className = 'secondary';
                li.textContent = `${i18n.t('onboarding.optionalGoal')} ${secondary.description}`;
                objectivesList.appendChild(li);
            }
        }

        // Historické poznámky z battleLore
        const historySection = document.getElementById('mission-history');

        if (historySection && typeof getBattleLore === 'function') {
            let lore = getBattleLore(scenarioId);

            // Použij lokalizovanou verzi lore
            if (lore && typeof getLocalizedBattleLore === 'function') {
                lore = getLocalizedBattleLore(scenarioId, lore);
            }

            if (lore) {
                historySection.classList.remove('hidden');

                // Husitská strana
                const hussiteCommanders = document.getElementById('history-hussite-commanders');
                const hussiteStrength = document.getElementById('history-hussite-strength');
                if (lore.hussiteSide) {
                    hussiteCommanders.textContent = lore.hussiteSide.commanders.join(', ');
                    hussiteStrength.textContent = lore.hussiteSide.strength;
                }

                // Nepřátelská strana
                const enemyCommanders = document.getElementById('history-enemy-commanders');
                const enemyStrength = document.getElementById('history-enemy-strength');
                if (lore.enemySide) {
                    enemyCommanders.textContent = lore.enemySide.commanders.join(', ');
                    enemyStrength.textContent = lore.enemySide.strength;
                }

                // Citát
                const quoteSection = document.getElementById('history-quote');
                const quoteText = document.getElementById('history-quote-text');
                const quoteSource = document.getElementById('history-quote-source');
                if (lore.quotes && lore.quotes.length > 0) {
                    const quote = lore.quotes[0];
                    quoteText.textContent = quote.text;
                    quoteSource.textContent = `— ${quote.source}`;
                    quoteSection.classList.remove('hidden');
                } else {
                    quoteSection.classList.add('hidden');
                }

                // Spolehlivost pramenů
                const reliabilityEl = document.getElementById('history-reliability');
                if (reliabilityEl && lore.reliability) {
                    reliabilityEl.textContent = `${i18n.t('mission.reliabilityLabel')} ${lore.reliability}`;
                }
            } else {
                historySection.classList.add('hidden');
            }
        }
        HistoricalNotesView.mount(document.getElementById('mission-sources'), scenarioId);
        // Only the briefing body scrolls; the action rail stays outside it.
        document.getElementById('mission-detail-body').scrollTop = 0;
        document.getElementById('mission-title').focus({ preventScroll: true });
    }

    // Tlačítko zpět na seznam
    document.getElementById('btn-back-to-list').addEventListener('click', () => {
        const missionList = document.getElementById('mission-list');
        const missionDetails = document.getElementById('mission-details');
        const campaignActs = document.getElementById('campaign-acts');
        const actDescription = document.getElementById('act-description');

        missionDetails.classList.add('hidden');
        missionList.classList.remove('hidden');
        if (campaignActs) campaignActs.classList.remove('hidden');
        if (actDescription) actDescription.classList.remove('hidden');
        selectedScenario = null;
    });

    // Tlačítko zahájit bitvu
    document.getElementById('btn-start-mission').addEventListener('click', () => {
        if (!selectedScenario) return;
        startMission(selectedScenario);
    });

    function startMission(scenario) {
        // Zastavení hudby z hlavního menu
        Music.stop();
        updateMenuMusicButton();

        // Skrytí modalu
        missionModal.classList.add('hidden');

        // Aktualizace headeru s názvem bitvy a datem
        document.getElementById('battle-name').textContent = scenario.name;
        document.getElementById('battle-date').textContent = scenario.date;

        // Vytvoření nové hexové mapy podle velikosti scénáře
        const mapSize = scenario.mapSize;
        hexGrid = new HexGrid(canvas, mapSize.width, mapSize.height, 40);

        // Vytvoření nové instance hry s novým gridem
        destroyCurrentGame();
        game = new Game(hexGrid);
        game.currentScenario = scenario;

        // Nastavení mlhy války podle obtížnosti (pokud scénář nemá noFogOfWar)
        if (scenario.specialMechanics && scenario.specialMechanics.noFogOfWar) {
            game.fogOfWar = false;
        } else {
            game.fogOfWar = (gameSettings.difficultyLevel === 'advanced');
        }

        // Inicializace hry se scénářem
        game.initGameWithScenario(scenario);
        game.saveGame({ automatic: true });

        // Aktualizace cílů mise v panelu
        updateObjectivesPanel(scenario);

        // Cíle jsou dostupné v dolní liště; na startu nekolidují s úvodní
        // událostí/tipem, aby první pohled zůstal čistý.
        if (objectivesPanel) {
            objectivesPanel.classList.add('hidden');
        }

        // Export pro debugging
        window.game = game;
        window.hexGrid = hexGrid;

        // Kamera až po dokončení UI startu mise, jinak se rámování počítá
        // proti přechodnému layoutu modalu/panelů.
        const startedGame = game;
        startedGame.actions.wait(120).then(active => {
            if (active) startedGame.centerOnPlayerForces();
        });
    }

    function startQuickBattle() {
        // Zastavení hudby z hlavního menu
        Music.stop();
        updateMenuMusicButton();

        mainMenu.classList.add('hidden');
        gameContainer.classList.remove('hidden');

        // Aktualizace headeru pro rychlou bitvu
        document.getElementById('battle-name').textContent = i18n.t('quickBattle.name');
        document.getElementById('battle-date').textContent = i18n.t('quickBattle.date');

        // Vytvoření výchozí hexové mapy
        hexGrid = new HexGrid(canvas, 16, 10, 40);

        // Vytvoření instance hry
        destroyCurrentGame();
        game = new Game(hexGrid);

        // Nastavení mlhy války podle obtížnosti
        // Pro quick battle není scenario, takže vždy používáme nastavení
        game.fogOfWar = (gameSettings.difficultyLevel === 'advanced');

        // Inicializace bez scénáře (výchozí armády)
        game.initGame();
        game.saveGame({ automatic: true });
        updateObjectivesPanel(null);

        // Export pro debugging
        window.game = game;
        window.hexGrid = hexGrid;
    }

    function startGameFromSave(automatic = false) {
        try {
            const restored = SaveGameSystem.load(canvas, game, { automatic });
            game = restored;
            hexGrid = restored.hexGrid;
            game.saveGame({ automatic: true });
        } catch (e) {
            const key = ['gameLog.noSaveFound', 'gameLog.saveIncompatible', 'gameLog.scenarioUpdated'].includes(e.message)
                ? e.message : 'gameLog.loadError';
            if (game) game.showEventNotification(i18n.t('messages.messageTitle'), i18n.t(key));
            else {
                const error = document.getElementById('save-load-error');
                error.textContent = i18n.t(key);
                error.classList.remove('hidden');
            }
            return false;
        }
        Music.stop();
        mainMenu.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        pauseModal.classList.add('hidden');
        gameoverModal.classList.add('hidden');
        resetPostBattleReview();
        missionModal.classList.add('hidden');
        objectivesPanel.classList.add('hidden');
        document.getElementById('save-load-error').classList.add('hidden');
        const scenario = game.currentScenario;
        selectedScenario = scenario;
        if (scenario) {
            document.getElementById('battle-name').textContent = scenario.name;
            document.getElementById('battle-date').textContent = scenario.date;
        } else {
            document.getElementById('battle-name').textContent = i18n.t('quickBattle.name');
            document.getElementById('battle-date').textContent = i18n.t('quickBattle.date');
        }
        updateObjectivesPanel(scenario);
        window.game = game;
        window.hexGrid = hexGrid;
        game.centerOnPlayerForces();
        return true;
    }

    // =============================================
    // CÍLE MISE - IN GAME
    // =============================================

    function updateObjectivesPanel(scenario) {
        const primaryObjective = document.getElementById('primary-objective');
        const secondaryObjectives = document.getElementById('secondary-objectives');
        const objectiveHud = document.getElementById('objective-hud');
        const objectiveHudText = document.getElementById('objective-hud-text');

        if (!scenario || !scenario.victoryConditions) {
            primaryObjective.textContent = '';
            secondaryObjectives.innerHTML = '';
            if (objectiveHudText) objectiveHudText.textContent = '';
            if (objectiveHud) objectiveHud.classList.add('hidden');
            if (objectivesPanel) objectivesPanel.classList.add('hidden');
            return;
        }

        primaryObjective.textContent = scenario.victoryConditions.primary.description;

        // Trvalý cíl v hlavičce - vždy viditelný během hry (ne jen v skrytém panelu)
        if (objectiveHud && objectiveHudText) {
            objectiveHudText.textContent = scenario.victoryConditions.primary.description;
            objectiveHud.classList.remove('hidden');
        }

        secondaryObjectives.innerHTML = '';
        if (scenario.victoryConditions.secondary) {
            for (const secondary of scenario.victoryConditions.secondary) {
                const div = document.createElement('div');
                div.className = 'objective secondary';
                div.innerHTML = `
                    <span class="objective-status">◇</span>
                    <span class="objective-text">${secondary.description}</span>
                `;
                secondaryObjectives.appendChild(div);
            }
        }
        if (game?.currentScenario === scenario) game.view?.panels?.updateObjectiveProgress();
    }

    // Tlačítko Cíle
    const btnObjectives = document.getElementById('btn-objectives');
    const btnCloseObjectives = document.getElementById('btn-close-objectives');

    if (btnObjectives) {
        btnObjectives.addEventListener('click', () => {
            if (objectivesPanel) objectivesPanel.classList.toggle('hidden');
        });
    }

    // Zavření panelu cílů
    if (btnCloseObjectives) {
        btnCloseObjectives.addEventListener('click', () => {
            if (objectivesPanel) objectivesPanel.classList.add('hidden');
        });
    }

    // =============================================
    // SBALOVACÍ PANELY
    // =============================================

    const unitPanel = document.getElementById('unit-panel');
    const infoPanel = document.getElementById('info-panel');
    const toggleLeft = document.getElementById('toggle-left');
    const toggleRight = document.getElementById('toggle-right');
    const unitSheetButton = document.getElementById('btn-unit-sheet');
    const armySheetButton = document.getElementById('btn-army-sheet');

    function closeCompactPanels() {
        BattlePanels.closeCompactPanels();
    }
    function syncPanelButtons() {
        BattlePanels.syncCompactButtons();
    }
    function openCompactPanel(panel) {
        const wasOpen = panel.classList.contains('expanded');
        closeCompactPanels();
        game?.view.orders.cancel();
        if (!wasOpen) {
            panel.classList.add('expanded'); panel.classList.remove('collapsed');
        }
        syncPanelButtons();
    }
    unitSheetButton.addEventListener('click', () => openCompactPanel(unitPanel));
    armySheetButton.addEventListener('click', () => openCompactPanel(infoPanel));
    const minimapButton = document.getElementById('btn-minimap');
    minimapButton.addEventListener('click', () => {
        const open = document.getElementById('minimap').classList.toggle('map-open');
        minimapButton.setAttribute('aria-expanded', String(open));
    });

    // Na dotyku panel překrývá mapu; na desktopu si ponechává boční sloupec.
    if (toggleLeft && unitPanel) {
        toggleLeft.addEventListener('click', () => {
            if (gameContainer.classList.contains('compact-battle')) {
                openCompactPanel(unitPanel);
            } else {
                unitPanel.classList.toggle('collapsed');
                toggleLeft.textContent = unitPanel.classList.contains('collapsed') ? '▶' : '◀';
            }
            syncPanelButtons();
        });
    }

    // Toggle pravého panelu (zrcadlově k levému)
    if (toggleRight && infoPanel) {
        toggleRight.addEventListener('click', () => {
            if (gameContainer.classList.contains('compact-battle')) {
                openCompactPanel(infoPanel);
            } else {
                infoPanel.classList.toggle('collapsed');
                toggleRight.textContent = infoPanel.classList.contains('collapsed') ? '◀' : '▶';
            }
            syncPanelButtons();
        });
    }

    // Responzivita - automatické sbíhání/rozbalení na menších obrazovkách
    const touchQuery = window.matchMedia?.('(any-pointer: coarse)');
    let layoutWidth = null;
    function handleResize() {
        if (!unitPanel || !infoPanel || !toggleLeft || !toggleRight) return;

        const width = window.innerWidth;
        const compact = width <= 1200 || Boolean(touchQuery?.matches);
        const reframe = width !== layoutWidth || compact !== gameContainer.classList.contains('compact-battle');
        layoutWidth = width;
        gameContainer.classList.toggle('compact-battle', compact);
        document.body.classList.toggle('compact-interface', compact);
        syncBrowserBottomClearance(gameContainer, compact);
        if (reframe) {
            game?.view.mapInput.cancel(); game?.view.orders.cancel();
        }
        if (compact) {
            // Při změně výšky lišty prohlížeče neměnit otevřenou kartu ani kameru.
            const leftExpanded = unitPanel.classList.contains('expanded');
            const rightExpanded = infoPanel.classList.contains('expanded');
            unitPanel.classList.toggle('collapsed', !leftExpanded);
            infoPanel.classList.toggle('collapsed', !rightExpanded);
        } else {
            // Na velkých obrazovkách - normální stav (expanded už není potřeba)
            unitPanel.classList.remove('collapsed', 'expanded');
            infoPanel.classList.remove('collapsed', 'expanded');
            toggleLeft.textContent = '◀';
            toggleRight.textContent = '▶';
        }
        syncPanelButtons();
        if (reframe && game?.selectedUnit) game.centerOnUnit(game.selectedUnit);
    }

    window.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('scroll', handleResize);
    touchQuery?.addEventListener('change', handleResize);
    handleResize();

    // =============================================
    // PAUSE MENU
    // =============================================

    // Tlačítko Menu ve footeru - otevře dropdown nebo pause menu
    const footerMenu = document.querySelector('.footer-menu');
    const menuBtn = document.getElementById('btn-menu');

    // Klik na tlačítko Menu přepne dropdown
    if (menuBtn && footerMenu) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            footerMenu.classList.toggle('open');
        });
    }

    // Zavření dropdown menu při kliku mimo
    document.addEventListener('click', (e) => {
        if (footerMenu && !footerMenu.contains(e.target)) {
            footerMenu.classList.remove('open');
        }
    });

    // Položky v dropdown menu
    const btnSave = document.getElementById('btn-save');
    const btnLoad = document.getElementById('btn-load');
    const btnRetryBattle = document.getElementById('btn-retry-battle');
    const btnSound = document.getElementById('btn-sound');
    const btnHelp = document.getElementById('btn-help');

    function updateSoundButton() {
        if (!btnSound) return;
        const icon = btnSound.querySelector('.btn-icon');
        const label = btnSound.querySelector('[data-i18n]');
        if (icon) icon.textContent = gameSettings.soundEnabled ? '🔊' : '🔇';
        if (label) label.textContent = i18n.t(gameSettings.soundEnabled ? 'game.sound' : 'game.soundOff');
    }

    if (btnSave) {
        btnSave.addEventListener('click', () => {
            if (game) game.saveGame();
            if (footerMenu) footerMenu.classList.remove('open');
        });
    }

    if (btnLoad) {
        btnLoad.addEventListener('click', () => {
            startGameFromSave();
            if (footerMenu) footerMenu.classList.remove('open');
        });
    }

    if (btnSound) {
        btnSound.addEventListener('click', () => {
            gameSettings.soundEnabled = !gameSettings.soundEnabled;
            if (gameSettings.soundEnabled) {
                Sound.unmute();
            } else {
                Sound.mute();
            }
            Music.setEnabled(gameSettings.soundEnabled);
            updateSoundButton();
            if (footerMenu) footerMenu.classList.remove('open');
        });
    }

    if (btnHelp) {
        btnHelp.addEventListener('click', () => {
            if (game) populateHelpUnits(game);
            openHelpModal();
            if (footerMenu) footerMenu.classList.remove('open');
        });
    }

    function showPauseMenu() {
        pauseModal.classList.remove('hidden');
        if (game) {
            game.setPaused(true);
        }
    }

    function hidePauseMenu() {
        pauseModal.classList.add('hidden');
        if (game) {
            game.setPaused(false);
        }
    }

    // Restart je destruktivní i tehdy, když hra průběžně ukládá checkpoint.
    // Během potvrzení se bitva zastaví; při zrušení se obnoví přesně původní
    // stav pauzy a případně i otevřené pauzovací menu.
    async function restartCurrentBattle() {
        const currentGame = game;
        if (!currentGame) return false;

        const pauseWasOpen = !pauseModal.classList.contains('hidden');
        const wasPaused = currentGame.isPaused;
        footerMenu?.classList.remove('open');
        pauseModal.classList.add('hidden');
        if (!wasPaused) currentGame.setPaused(true);

        const confirmed = await showConfirmDialog(
            i18n.t('pause.confirmRetry'),
            i18n.t('pause.retry')
        );
        if (!confirmed) {
            if (game === currentGame) {
                currentGame.setPaused(wasPaused);
                if (pauseWasOpen) pauseModal.classList.remove('hidden');
            }
            return false;
        }
        if (game !== currentGame) return false;

        const scenario = currentGame.currentScenario;
        if (scenario) {
            selectedScenario = scenario;
            startMission(scenario);
        } else {
            selectedScenario = null;
            startQuickBattle();
        }
        return true;
    }

    if (btnRetryBattle) {
        btnRetryBattle.addEventListener('click', () => restartCurrentBattle());
    }

    // Tlačítko Pokračovat
    document.getElementById('btn-resume').addEventListener('click', () => {
        hidePauseMenu();
    });

    // Tlačítko Cíle mise v pause menu
    document.getElementById('btn-pause-objectives').addEventListener('click', () => {
        hidePauseMenu();
        objectivesPanel.classList.remove('hidden');
    });

    // Tlačítko Uložit v pause menu
    document.getElementById('btn-pause-save').addEventListener('click', () => {
        if (game) {
            game.saveGame();
        }
        hidePauseMenu();
    });

    // Tlačítko Načíst v pause menu
    document.getElementById('btn-pause-load').addEventListener('click', () => {
        startGameFromSave();
        hidePauseMenu();
    });

    // Tlačítko Zkusit znovu v pauze
    document.getElementById('btn-pause-retry').addEventListener('click', () => {
        restartCurrentBattle();
    });

    // Tlačítko Nastavení v pause menu
    document.getElementById('btn-pause-settings').addEventListener('click', () => {
        hidePauseMenu();
        showSettings();
    });

    // Tlačítko Nápověda v pause menu
    document.getElementById('btn-pause-help').addEventListener('click', () => {
        hidePauseMenu();
        if (game) {
            populateHelpUnits(game);
        }
        openHelpModal();
    });

    // Tlačítko Hlavní menu
    document.getElementById('btn-quit-to-menu').addEventListener('click', () => {
        hidePauseMenu();
        returnToMainMenu();
    });

    // Značka v záhlaví slouží jako návrat do hlavního menu.
    const logoHomeBtn = document.getElementById('logo-home-btn');
    if (logoHomeBtn) {
        logoHomeBtn.addEventListener('click', async () => {
            const confirmed = await showConfirmDialog(
                typeof i18n !== 'undefined' ? i18n.t('game.confirmReturn') : 'Opravdu chcete opustit bitvu a vrátit se do hlavního menu?',
                typeof i18n !== 'undefined' ? i18n.t('game.returnToMenu') : 'Návrat do menu'
            );
            if (confirmed) {
                returnToMainMenu();
            }
        });
    }

    function returnToMainMenu() {
        // Zastavení hry (listenery + animační smyčka)
        destroyCurrentGame();

        // Skrytí všech modalů a herní obrazovky
        missionModal.classList.add('hidden');
        pauseModal.classList.add('hidden');
        gameoverModal.classList.add('hidden');
        objectivesPanel.classList.add('hidden');
        gameContainer.classList.add('hidden');

        // Skrýt i starý victory modal
        const oldVictoryModal = document.getElementById('victory-modal');
        if (oldVictoryModal) {
            oldVictoryModal.classList.add('hidden');
        }

        // Zobrazení hlavního menu
        mainMenu.classList.remove('hidden');

        // Reset herních proměnných
        game = null;
        hexGrid = null;
        selectedScenario = null;

        // Kontrola uložené hry
        checkSavedGame();
    }

    // Expozice funkce pro globální přístup (např. z game.js)
    window.returnToMainMenu = returnToMainMenu;

    // =============================================
    // NASTAVENÍ
    // =============================================

    function showSettings() {
        // Naplnění hodnot z aktuálního nastavení
        document.getElementById('sound-enabled').checked = gameSettings.soundEnabled;
        document.getElementById('sound-volume').value = gameSettings.soundVolume;
        document.getElementById('ai-speed').value = gameSettings.aiSpeed;
        document.getElementById('show-damage').checked = gameSettings.showDamage;
        document.getElementById('difficulty-level').value = gameSettings.difficultyLevel;

        // Nastavení aktuálního jazyka
        const languageSelect = document.getElementById('language-select');
        if (languageSelect && typeof i18n !== 'undefined') {
            languageSelect.value = i18n.getCurrentLanguage();
        }

        settingsModal.classList.remove('hidden');
    }

    function hideSettings() {
        settingsModal.classList.add('hidden');
    }

    const aboutClose = document.getElementById('about-close');
    let aboutPreviousFocus = null;

    function showAbout() {
        aboutPreviousFocus = document.activeElement;
        if (typeof renderAboutModal === 'function') renderAboutModal();
        aboutModal.classList.remove('hidden');
        document.getElementById('about-content-scroll').scrollTop = 0;
        aboutClose.focus();
    }

    function hideAbout() {
        aboutModal.classList.add('hidden');
        aboutPreviousFocus?.focus?.();
    }

    // Zavření about modalu
    aboutClose.addEventListener('click', hideAbout);
    aboutModal.addEventListener('click', event => {
        if (event.target === aboutModal) hideAbout();
    });

    // Tlačítko Uložit nastavení
    document.getElementById('btn-settings-save').addEventListener('click', async () => {
        gameSettings.soundEnabled = document.getElementById('sound-enabled').checked;
        gameSettings.soundVolume = parseInt(document.getElementById('sound-volume').value);
        gameSettings.aiSpeed = document.getElementById('ai-speed').value;
        gameSettings.showDamage = document.getElementById('show-damage').checked;
        gameSettings.difficultyLevel = document.getElementById('difficulty-level').value;

        // Aplikace jazyka
        const languageSelect = document.getElementById('language-select');
        if (languageSelect && typeof i18n !== 'undefined') {
            const selectedLanguage = languageSelect.value;
            if (selectedLanguage !== i18n.getCurrentLanguage()) {
                await i18n.setLanguage(selectedLanguage);
            }
        }

        // Aplikace nastavení
        if (gameSettings.soundEnabled) {
            Sound.enable();
        } else {
            Sound.disable();
        }

        // Aplikace hlasitosti (posuvník dosud neměl žádný efekt)
        applyVolumeSettings();

        // Aplikace obtížnosti na běžící hru
        if (game) {
            game.fogOfWar = (gameSettings.difficultyLevel === 'advanced');
            game.render();
        }

        // Uložení do localStorage
        saveSettings();

        hideSettings();
    });

    // Tlačítko Zrušit nastavení
    document.getElementById('btn-settings-cancel').addEventListener('click', () => {
        hideSettings();
    });

    // Zavření nastavení tlačítkem X
    document.getElementById('settings-close').addEventListener('click', () => {
        hideSettings();
    });

    // Zavření mission modalu tlačítkem X
    const missionCloseBtn = document.getElementById('mission-close');
    if (missionCloseBtn) {
        missionCloseBtn.addEventListener('click', () => {
            missionModal.classList.add('hidden');
            returnToMainMenu();
        });
    }

    // Zavření pause modalu tlačítkem X
    const pauseCloseBtn = document.getElementById('pause-close');
    if (pauseCloseBtn) {
        pauseCloseBtn.addEventListener('click', () => {
            hidePauseMenu();
        });
    }

    // Zavření tutorial modalu tlačítkem X
    const tutorialCloseBtn = document.getElementById('tutorial-close');
    if (tutorialCloseBtn) {
        tutorialCloseBtn.addEventListener('click', () => {
            const tutorialModal = document.getElementById('tutorial-modal');
            if (tutorialModal) tutorialModal.classList.add('hidden');
        });
    }

    function saveSettings() {
        try { GameStorage.setItem('husitskeValky_settings', JSON.stringify(gameSettings)); }
        catch (error) { console.warn('Nastavení se nepodařilo uložit', error); }
    }

    function loadSettings() {
        Object.assign(gameSettings, readGamePreferences());
        if (!gameSettings.soundEnabled) Sound.disable();
    }

    function checkSavedGame() {
        const savedGame = readLocalPreference(SaveGameSystem.STORAGE_KEY);
        const continueBtn = document.getElementById('btn-continue');
        continueBtn.disabled = !savedGame;
        continueBtn.classList.toggle('hidden', !savedGame);

        // Zkušenost odvozujeme z existujících dat: dokončené bitvy nemají autosave.
        // Pouhé otevření menu nebo změna nastavení z nováčka veterána nedělá.
        const progress = CampaignProgressSystem.load();
        let hasPlayed = ScenarioManager.getScenarioList().some(scenario =>
            ['victory', 'defeat'].includes(progress.battles[scenario.id]?.result))
            || ChronicleSystem.getEntries().length > 0;
        if (savedGame && !hasPlayed) {
            try { hasPlayed = Boolean(SaveGameSystem.read()); }
            catch (_) { /* Nečitelný ruční save zůstává dostupný s vysvětlením při načtení. */ }
        }

        const autoButton = document.getElementById('btn-resume-auto');
        autoButton.classList.add('hidden');
        mainMenu.classList.remove('has-autosave');
        let canResume = false;
        try {
            const prepared = SaveGameSystem.read({ automatic: true });
            hasPlayed = true;
            if (prepared.data.gameState === 'playing') {
                document.getElementById('autosave-summary').textContent = i18n.t('touch.savedSummary', {
                    battle: prepared.scenario?.name || i18n.t('quickBattle.name'), turn: prepared.data.turnNumber
                });
                autoButton.classList.remove('hidden');
                mainMenu.classList.add('has-autosave');
                canResume = true;
            }
        } catch (error) {
            // U změněné mapy nezamlčet, proč tlačítko pokračování chybí.
            if (error.message === 'gameLog.scenarioUpdated') {
                const notice = document.getElementById('save-load-error');
                notice.textContent = i18n.t(error.message);
                notice.classList.remove('hidden');
            }
            // Nečitelný checkpoint neblokuje menu a sám se nepřepisuje.
        }

        document.getElementById('btn-first-battle').classList.toggle('hidden', hasPlayed);
        const chooseBattle = document.getElementById('btn-new-campaign');
        chooseBattle.classList.toggle('menu-featured', hasPlayed && !canResume);
        chooseBattle.classList.toggle('primary', hasPlayed && !canResume);
    }

    // =============================================
    // ENCYKLOPEDIE (z hlavního menu)
    // =============================================

    function showEncyclopedia() {
        // Bez instance hry vypíše populateHelpUnits všechny typy jednotek,
        // což je pro encyklopedii přesně to, co chceme (a nevzniká temp hra
        // s vlastní animační smyčkou a listenery na živém canvasu)
        populateHelpUnits(null);

        openHelpModal();
    }

    // Prezentace i offline export sdílejí jediný pohled a bezpečné escapování.
    function showChronicle() {
        ChronicleView.open();
    }

    // =============================================
    // GAME OVER
    // =============================================

    // Expozice funkce pro zobrazení game over (volána z game.js)
    window.showGameOver = function(isVictory, message, stats) {
        const gameoverModal = document.getElementById('gameover-modal');
        try {
        const banner = document.getElementById('gameover-banner');
        const title = document.getElementById('gameover-title');
        const msgEl = document.getElementById('gameover-message');
        const nextBtn = document.getElementById('btn-next-mission');

        // Spočítej statistiky
        const turns = stats?.turns || game?.turnNumber || 0;
        const counts = getBattleResultCounts(stats, game);
        const unitsLost = counts.player.lost;

        // Procenta
        const enemyWipeout = counts.enemy.total > 0 ? counts.enemy.lost / counts.enemy.total : 0;
        const lossRatio = counts.player.total > 0 ? unitsLost / counts.player.total : 0;

        banner.className = isVictory ? 'victory' : 'defeat';
        banner.innerHTML = WoodcutRenderer.icon(isVictory ? { special: 'commander', faction: 'hussites' } : { type: 'PAVEZNICI' });
        const resultBattle = document.getElementById('gameover-battle');
        resultBattle.textContent = game?.currentScenario
            ? `${game.currentScenario.name} · ${game.currentScenario.date}`
            : i18n.t('quickBattle.name');

        // Konkrétní důvod výsledku ("Přežilo jen 36 % jednotek (potřeba 50 %)")
        // - dosud byl jen v herním logu, kde si ho hráč nevšiml
        const reasonEl = document.getElementById('gameover-reason');
        if (reasonEl) {
            if (stats?.reason) {
                reasonEl.textContent = stats.reason;
                reasonEl.classList.remove('hidden');
            } else {
                reasonEl.classList.add('hidden');
            }
            document.getElementById('gameover-reason-heading').classList.toggle('hidden', !stats?.reason);
        }

        // Dynamický titulek podle výsledku
        let titleText = isVictory ? i18n.t('gameover.victory') : i18n.t('gameover.defeat');
        if (isVictory) {
            if (enemyWipeout >= 1) {
                titleText = i18n.t('gameover.totalVictory');
            } else if (lossRatio <= 0.1) {
                titleText = i18n.t('gameover.gloriousVictory');
            } else if (lossRatio >= 0.6) {
                titleText = i18n.t('gameover.pyrrhicVictory');
            }
        }
        title.textContent = titleText;
        title.className = isVictory ? 'victory' : 'defeat';

        // Dynamická hláška podle stavu bitvy
        let dynamicMessage = message;
        if (!dynamicMessage && isVictory) {
            if (enemyWipeout >= 1 && lossRatio <= 0.2) {
                dynamicMessage = i18n.t('victory.totalWipeout');
            } else if (enemyWipeout >= 1) {
                dynamicMessage = i18n.t('victory.enemyDestroyed');
            } else if (lossRatio <= 0.1) {
                dynamicMessage = i18n.t('victory.flawless');
            } else if (lossRatio >= 0.6) {
                dynamicMessage = i18n.t('victory.costly');
            } else if (lossRatio >= 0.4) {
                dynamicMessage = i18n.t('victory.hardFought');
            } else {
                dynamicMessage = i18n.t('victory.standard');
            }
        } else if (!dynamicMessage) {
            dynamicMessage = i18n.t('victory.defeat');
        }
        msgEl.textContent = dynamicMessage;

        const actSummaryEl = document.getElementById('gameover-act-summary');
        if (actSummaryEl && stats?.campaignProgress) {
            const campaignResult = stats.campaignProgress;
            const reputationLine = i18n.t('campaign.reputation.result', {
                value: campaignResult.reputation,
                delta: campaignResult.reputationDelta > 0
                    ? `+${campaignResult.reputationDelta}`
                    : campaignResult.reputationDelta
            });
            if (campaignResult.actCompleted) {
                actSummaryEl.textContent = `${i18n.t(`chronicle.actSummaries.${campaignResult.actCompleted}`)} ${reputationLine}`;
            } else {
                actSummaryEl.textContent = reputationLine;
            }
            actSummaryEl.classList.remove('hidden');
        } else if (actSummaryEl) {
            actSummaryEl.classList.add('hidden');
        }

        // Rychlé hodnocení
        const ratingEnemies = document.getElementById('rating-enemies');
        const ratingLosses = document.getElementById('rating-losses');
        const ratingTurns = document.getElementById('rating-turns');

        if (ratingEnemies) {
            ratingEnemies.textContent = `${counts.enemy.lost}/${counts.enemy.total}`;
            ratingEnemies.className = 'rating-value ' + (enemyWipeout >= 1 ? 'good' : '');
        }
        if (ratingLosses) {
            ratingLosses.textContent = unitsLost.toString();
            ratingLosses.className = 'rating-value ' + (lossRatio >= 0.5 ? 'bad' : lossRatio <= 0.2 ? 'good' : '');
        }
        if (ratingTurns) {
            ratingTurns.textContent = turns.toString();
        }

        // Rozšířené statistiky
        // Doba hry
        const duration = stats?.duration || (game?.gameDuration ? Math.floor((Date.now() - game.gameDuration) / 1000) : 0);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        document.getElementById('stat-duration').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Bojové statistiky
        document.getElementById('stat-total-damage').textContent = stats?.totalDamage || game?.stats?.totalDamage || 0;
        document.getElementById('stat-damage-taken').textContent = stats?.damageTaken || game?.stats?.damageTaken || 0;

        // Průměrné zdraví přeživších
        const survivingUnits = game ? game.units.filter(u => u.faction === 'hussites' && u.health > 0) : [];
        if (survivingUnits.length > 0) {
            const avgHealth = Math.round(survivingUnits.reduce((sum, u) => sum + (u.health / u.maxHealth * 100), 0) / survivingUnits.length);
            document.getElementById('stat-avg-health').textContent = `${avgHealth}%`;
        } else {
            document.getElementById('stat-avg-health').textContent = '0%';
        }

        // MVP - hrdina bitvy
        const mvpSection = document.getElementById('stats-mvp');
        const mvpIcon = document.getElementById('stat-mvp-icon');
        const mvpName = document.getElementById('stat-mvp-name');
        const mvpStats = document.getElementById('stat-mvp-stats');

        if (game?.stats?.unitKills && Object.keys(game.stats.unitKills).length > 0) {
            // Najdi jednotku s nejvíce zabití
            let maxKills = 0;
            let mvpUnit = null;
            for (const [unitId, kills] of Object.entries(game.stats.unitKills)) {
                if (kills > maxKills) {
                    maxKills = kills;
                    const unit = game.units.find(u => u.id === unitId);
                    if (unit && unit.faction === 'hussites') {
                        mvpUnit = unit;
                    }
                }
            }

            if (mvpUnit && maxKills > 0) {
                mvpSection.classList.remove('hidden');
                mvpIcon.innerHTML = WoodcutRenderer.icon(mvpUnit);
                mvpName.textContent = mvpUnit.name;
                const damage = game.stats.unitDamage?.[mvpUnit.id] || 0;
                mvpStats.textContent = `${maxKills} ${i18n.t('gameover.kills')} • ${damage} ${i18n.t('gameover.damage')}`;
            } else {
                mvpSection.classList.add('hidden');
            }
        } else {
            mvpSection.classList.add('hidden');
        }

        // Sekundární cíle
        const objectivesContainer = document.getElementById('gameover-secondary-objectives');
        if (objectivesContainer && stats?.secondaryObjectives && stats.secondaryObjectives.length > 0) {
            let html = `<div class="secondary-objectives-header">${i18n.t('gameover.bonusObjectives')}:</div>`;
            for (const obj of stats.secondaryObjectives) {
                const icon = obj.achieved ? '✓' : '✗';
                const statusClass = obj.achieved ? 'achieved' : 'failed';
                html += `<div class="secondary-objective ${statusClass}">${icon} ${obj.description}</div>`;
            }
            objectivesContainer.innerHTML = html;
            objectivesContainer.classList.remove('hidden');
        } else if (objectivesContainer) {
            objectivesContainer.innerHTML = '';
            objectivesContainer.classList.add('hidden');
        }

        // Tlačítko další mise (pouze při vítězství a pokud existuje další mise)
        if (isVictory && selectedScenario) {
            const nextScenarioId = typeof CampaignProgressSystem !== 'undefined'
                ? CampaignProgressSystem.getNextBattle(selectedScenario.id)
                : null;
            if (nextScenarioId) {
                nextBtn.classList.remove('hidden');
            } else {
                nextBtn.classList.add('hidden');
            }
        } else {
            nextBtn.classList.add('hidden');
        }
        document.getElementById('btn-review-battlefield').classList.toggle('primary', nextBtn.classList.contains('hidden'));

        // Trivia - "Věděli jste, že...?" (pouze při vítězství)
        const triviaSection = document.getElementById('gameover-trivia');
        const triviaText = document.getElementById('gameover-trivia-text');
        if (triviaSection && triviaText && isVictory && selectedScenario) {
            const trivia = typeof getRandomTrivia === 'function' ? getRandomTrivia(selectedScenario.id) : null;
            if (trivia) {
                triviaText.textContent = trivia;
                triviaSection.classList.remove('hidden');
            } else {
                triviaSection.classList.add('hidden');
            }
        } else if (triviaSection) {
            triviaSection.classList.add('hidden');
        }

        // WP2a: Vy vs. kronika - srovnání tvého výsledku s údaji kronik
        const chronicleEl = document.getElementById('gameover-chronicle');
        if (chronicleEl) {
            const sid = stats?.scenarioId || selectedScenario?.id;
            let lore = (sid && typeof getBattleLore === 'function') ? getBattleLore(sid) : null;
            if (lore && typeof getLocalizedBattleLore === 'function') lore = getLocalizedBattleLore(sid, lore);
            if (lore && lore.casualties) {
                document.getElementById('chronicle-yours').textContent =
                    i18n.t('gameover.yourLosses', { x: counts.player.lost, y: counts.player.total,
                        a: counts.enemy.lost, b: counts.enemy.total, n: turns });
                document.getElementById('chronicle-says').textContent =
                    i18n.t('gameover.chronicleSays', { h: lore.casualties.hussites, e: lore.casualties.enemy });
                document.getElementById('chronicle-note').textContent = i18n.t('gameover.chronicleNote');
                chronicleEl.classList.remove('hidden');
            } else {
                chronicleEl.classList.add('hidden');
            }
        }

        HistoricalNotesView.mount(document.getElementById('gameover-sources'), stats?.scenarioId || selectedScenario?.id);
        } catch (e) {
            console.error('Chyba v showGameOver:', e);
        }
        // Modal zobrazíme vždy, i pokud nastala chyba ve statistikách
        setPostBattleReview(true);
        openGameOverResults();
        document.getElementById('btn-gameover-chronicle').classList.toggle('hidden', !stats?.scenarioId || !game?.chronicleRecorded);
    };

    document.getElementById('btn-gameover-chronicle').addEventListener('click', () => ChronicleView.open());
    document.getElementById('btn-review-battlefield').addEventListener('click', reviewBattlefield);
    showResultsButton.addEventListener('click', openGameOverResults);

    // Tlačítko Zkusit znovu
    document.getElementById('btn-retry').addEventListener('click', () => {
        resetPostBattleReview();
        if (selectedScenario) {
            startMission(selectedScenario);
        } else {
            startQuickBattle();
        }
    });

    // Tlačítko Další mise
    document.getElementById('btn-next-mission').addEventListener('click', () => {
        resetPostBattleReview();
        if (!selectedScenario) return;

        const nextScenarioId = typeof CampaignProgressSystem !== 'undefined'
            ? CampaignProgressSystem.getNextBattle(selectedScenario.id)
            : null;
        if (!nextScenarioId) return;
        if (!ScenarioManager.getScenario(nextScenarioId)) return;
        const nextAct = CampaignProgressSystem.getActForBattle(nextScenarioId);
        if (nextAct) currentAct = nextAct.id;
        // „Další mise“ otevírá i její prameny a rozkazy; bitva začne až
        // vědomým kliknutím na Zahájit bitvu v detailu mise.
        showMissionSelection();
        showMissionDetails(nextScenarioId);
    });

    // Tlačítko Hlavní menu z game over
    document.getElementById('btn-gameover-menu').addEventListener('click', () => {
        resetPostBattleReview();
        returnToMainMenu();
    });

    // =============================================
    // HELP MODAL
    // =============================================

    const helpClose = document.getElementById('help-close');
    const helpTabs = document.querySelectorAll('.help-tab');
    let helpPreviousFocus = null;

    function openHelpModal() {
        helpPreviousFocus = document.activeElement;
        // Stejný obsah a náhledy i při prvním otevření přímo z bitvy nebo pauzy.
        if (typeof initEncyclopediaContent === 'function') {
            initEncyclopediaContent();
        }
        helpModal.classList.remove('hidden');
        document.getElementById('help-content').scrollTop = 0;
        helpTabs.forEach(tab => tab.setAttribute('aria-pressed', String(tab.classList.contains('active'))));
        helpClose.focus();
    }

    function closeHelpModal() {
        helpModal.classList.add('hidden');
        const target = helpPreviousFocus?.getClientRects().length && getComputedStyle(helpPreviousFocus).visibility === 'visible' ? helpPreviousFocus
            : document.getElementById(game ? 'btn-menu' : 'btn-encyclopedia');
        target?.focus();
    }

    // Zavření help modalu
    if (helpClose) {
        helpClose.addEventListener('click', closeHelpModal);
    }

    // Zavření kliknutím mimo modal
    if (helpModal) {
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                closeHelpModal();
            }
        });
    }

    // Přepínání záložek
    helpTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            helpTabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-pressed', String(t === tab));
            });
            document.querySelectorAll('.help-tab-content').forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById('tab-' + tabId).classList.add('active');
            document.getElementById('help-content').scrollTop = 0;
        });
    });

    // =============================================
    // KLÁVESOVÉ ZKRATKY
    // =============================================

    document.addEventListener('keydown', (e) => {
        if (!aboutModal.classList.contains('hidden')) {
            if (e.key === 'Escape') { e.preventDefault(); hideAbout(); }
            else if (e.key === 'Tab') {
                const controls = Array.from(aboutModal.querySelectorAll('button:not(:disabled), a[href]'))
                    .filter(el => el.getClientRects().length && getComputedStyle(el).visibility === 'visible');
                const first = controls[0], last = controls.at(-1);
                if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
            }
            return;
        }
        if (!helpModal.classList.contains('hidden')) {
            if (e.key === 'Escape') { e.preventDefault(); closeHelpModal(); }
            else if (e.key === 'Tab') {
                const controls = Array.from(helpModal.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'))
                    .filter(el => el.getClientRects().length && getComputedStyle(el).visibility === 'visible');
                const first = controls[0], last = controls.at(-1);
                if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
            }
            return;
        }
        if (!chronicleModal.classList.contains('hidden')) {
            if (e.key === 'Escape') { e.preventDefault(); ChronicleView.close(); }
            else if (e.key === 'Tab') ChronicleView.trapFocus(e);
            return;
        }
        if (!gameoverModal.classList.contains('hidden')) {
            // Výsledky nejsou bojový vstup: Tab/Enter mají ovládat tlačítka.
            if (e.key === 'Escape') {
                e.preventDefault();
                reviewBattlefield();
            } else if (e.key === 'Tab') {
                const controls = Array.from(gameoverModal.querySelectorAll('button:not(.hidden):not(:disabled), summary, a[href]'))
                    .filter(el => el.getClientRects().length && getComputedStyle(el).visibility === 'visible');
                const first = controls[0], last = controls.at(-1);
                if (e.shiftKey && (document.activeElement === first || document.activeElement.id === 'gameover-title')) {
                    e.preventDefault(); last?.focus();
                } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
            }
            return;
        }
        if (e.key === 'Escape' && gameContainer.classList.contains('post-battle-review')) {
            e.preventDefault();
            openGameOverResults();
            return;
        }
        // Klávesnice formuláře/tlačítka patří ovládacímu prvku, ne zkratce tahu.
        if (e.key !== 'Escape' && e.target.closest?.('button, input, select, textarea, summary, a, [role="button"]')) return;
        // Escape - zavření modalů nebo pause menu
        if (e.key === 'Escape') {
            if (game?.view.orders.inspectedHex) {
                game.view.orders.cancel();
            } else if (gameContainer.classList.contains('compact-battle') &&
                (unitPanel.classList.contains('expanded') || infoPanel.classList.contains('expanded'))) {
                closeCompactPanels();
            } else if (settingsModal && !settingsModal.classList.contains('hidden')) {
                settingsModal.classList.add('hidden');
            } else if (pauseModal && !pauseModal.classList.contains('hidden')) {
                hidePauseMenu();
            } else if (objectivesPanel && !objectivesPanel.classList.contains('hidden')) {
                objectivesPanel.classList.add('hidden');
            } else if (game && gameContainer && !gameContainer.classList.contains('hidden')) {
                // Pokud jsme ve hře, zobrazíme pause menu
                showPauseMenu();
            }
        }

        // Tab - výběr další jednotky která může jednat
        if (e.key === 'Tab' && game && gameContainer && !gameContainer.classList.contains('hidden')) {
            // Pouze pokud nejsou otevřené modaly
            if ((helpModal && !helpModal.classList.contains('hidden')) ||
                (settingsModal && !settingsModal.classList.contains('hidden')) ||
                (pauseModal && !pauseModal.classList.contains('hidden')) ||
                (missionModal && !missionModal.classList.contains('hidden'))) {
                return;
            }

            e.preventDefault(); // Zabraň přepínání focusu

            if (game.currentFaction === 'hussites') {
                game.selectNextUnit();
            }
        }

        // Space/Enter - ukončení tahu
        if ((e.key === ' ' || e.key === 'Enter') && game && gameContainer && !gameContainer.classList.contains('hidden')) {
            // Pouze pokud nejsou otevřené modaly
            if ((helpModal && !helpModal.classList.contains('hidden')) ||
                (settingsModal && !settingsModal.classList.contains('hidden')) ||
                (pauseModal && !pauseModal.classList.contains('hidden')) ||
                (missionModal && !missionModal.classList.contains('hidden'))) {
                return;
            }

            // Stejná přímá cesta jako tlačítko; nevyužité oddíly se podle
            // pravidel buď brání, nebo připraví krycí palbu.
            const endTurnButton = document.getElementById('btn-end-turn');
            if (game.currentFaction === 'hussites' && endTurnButton && !endTurnButton.disabled) {
                e.preventDefault();
                endTurnButton.click();
            }
        }
    });

    // =============================================
    // TUTORIÁL - Event listener pro "Pokračovat"
    // =============================================
    const tutorialContinueBtn = document.getElementById('tutorial-continue');
    if (tutorialContinueBtn) {
        tutorialContinueBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (window.game && window.game.isTutorial) {
                window.game.tutorialSystem.closeTutorialDialog();
            } else {
                // Zavřít dialog i když není tutoriál aktivní
                const modal = document.getElementById('tutorial-modal');
                if (modal) modal.classList.add('hidden');
            }
        });
    }

    // Expozice returnToMainMenu pro tutorial
    window.returnToMainMenu = returnToMainMenu;
});

// =============================================
// POMOCNÉ FUNKCE
// =============================================

// Funkce pro naplnění seznamu jednotek v helpu
function populateHelpUnits(game) {
    const container = document.getElementById('help-units-list');
    container.innerHTML = '';

    // Získání unikátních typů jednotek
    const unitTypesInBattle = new Map();

    // Pokud máme hru s jednotkami, použijeme je
    if (game && game.units && game.units.length > 0) {
        for (const unit of game.units) {
            const key = `${unit.faction}:${unit.type}`;
            if (!unitTypesInBattle.has(key)) {
                // Použij lokalizovanou verzi jednotky
                const localizedUnit = typeof getLocalizedUnit === 'function'
                    ? getLocalizedUnit(unit.type, UnitTypes[unit.type])
                    : UnitTypes[unit.type];
                unitTypesInBattle.set(key, { ...localizedUnit, type: unit.type, faction: unit.faction });
            }
        }
    } else {
        // Jinak zobrazíme všechny typy jednotek
        for (const [key, value] of Object.entries(UnitTypes)) {
            // Použij lokalizovanou verzi jednotky
            const localizedUnit = typeof getLocalizedUnit === 'function'
                ? getLocalizedUnit(key, value)
                : value;
            unitTypesInBattle.set(key, { ...localizedUnit, type: key });
        }
    }

    // Popis speciálních schopností - použij i18n pokud je dostupné
    const getSpecialDescription = (special) => {
        if (typeof i18n !== 'undefined' && i18n.hasTranslation(`special.${special}`)) {
            return i18n.t(`special.${special}`);
        }
        // Fallback na české texty
        const specialDescriptions = {
            armorPiercing: 'Drtivý úder (+30% vs obrněné)',
            reach: 'Dosah (útok přes spojence)',
            shieldWall: 'Štítová zeď (+20% obrana střelcům)',
            antiCavalry: 'Proti jízdě (+50% poškození)',
            wagenburg: 'Vozová hradba (+15% obrana/vůz)',
            terror: 'Děsivý (-10% útok nepříteli)',
            pursuit: 'Pronásledování (+30% vs oslabené)',
            charge: 'Náraz (+50% po pohybu)',
            scout: 'Průzkum (+1 dohled)',
            dismount: 'Sesazení (30% šance zpomalit jízdu)',
            elite: 'Elitní (+10% ke všemu)',
            veteran: 'Veterán (+10% ke všemu)',
            rapidFire: 'Rychlostřelba (2 útoky, 75% poškození)',
            siege: 'Obléhání (+100% vs vozy)',
            areaAttack: 'Plošný útok (50% sousedům)',
            mobile: 'Mobilní (střelba po pohybu)'
        };
        return specialDescriptions[special] || special;
    };

    // Třídy jednotek - popis
    const getClassName = (unitClass) => {
        if (unitClass === 'commander') return typeof i18n !== 'undefined' ? i18n.t('tooltip.commander') : 'Velitel';
        if (typeof i18n !== 'undefined' && i18n.hasTranslation(`unitClass.${unitClass}`)) {
            return i18n.t(`unitClass.${unitClass}`);
        }
        // Fallback na české texty
        const classNames = {
            infantry: 'Pěchota',
            ranged: 'Střelci',
            artillery: 'Dělostřelectvo',
            cavalry: 'Lehká jízda',
            heavyCavalry: 'Těžká jízda',
            wagon: 'Vozy'
        };
        return classNames[unitClass] || unitClass;
    };

    // Seřazení podle frakce a typu
    const sortedTypes = Array.from(unitTypesInBattle.values()).sort((a, b) => {
        if (a.faction !== b.faction) {
            return a.faction === 'hussites' ? -1 : 1;
        }
        return a.name.localeCompare(b.name, 'cs');
    });

    let currentFaction = null;

    for (const unitType of sortedTypes) {
        // Přidání nadpisu frakce
        if (unitType.faction !== currentFaction) {
            currentFaction = unitType.faction;
            const header = document.createElement('h4');
            header.className = 'help-faction-header';
            header.textContent = typeof i18n !== 'undefined'
                ? i18n.t('factions.' + currentFaction)
                : (currentFaction === 'hussites' ? 'Husité' : 'Křižáci');
            header.classList.add(currentFaction);
            container.appendChild(header);
        }

        const card = document.createElement('div');
        const commander = WoodcutRenderer.isCommander(unitType);
        card.className = `help-unit-card ${unitType.faction}${commander ? ' commander-unit' : ''}`;

        // Header s ikonou a základními info
        const cardHeader = document.createElement('div');
        cardHeader.className = 'help-unit-header';

        const icon = document.createElement('div');
        icon.className = `help-unit-icon ${unitType.faction}${commander ? ' commander-mark' : ''}`;
        icon.innerHTML = WoodcutRenderer.icon(unitType);

        const headerInfo = document.createElement('div');
        headerInfo.className = 'help-unit-header-info';

        const name = document.createElement('h4');
        name.className = 'help-unit-name';
        name.textContent = unitType.name;

        const classLabel = document.createElement('span');
        classLabel.className = 'help-unit-class';
        classLabel.textContent = getClassName(unitType.unitClass);

        headerInfo.appendChild(name);
        headerInfo.appendChild(classLabel);
        cardHeader.appendChild(icon);
        cardHeader.appendChild(headerInfo);

        // Statistiky v gridu
        const stats = document.createElement('div');
        stats.className = 'help-unit-stats-grid';
        const healthLabel = typeof i18n !== 'undefined' ? i18n.t('help.unitStats.health') : 'Zdraví';
        const attackLabel = typeof i18n !== 'undefined' ? i18n.t('help.unitStats.attack') : 'Útok';
        const defenseLabel = typeof i18n !== 'undefined' ? i18n.t('help.unitStats.defense') : 'Obrana';
        const rangeLabel = typeof i18n !== 'undefined' ? i18n.t('help.unitStats.range') : 'Dosah';
        const movementLabel = typeof i18n !== 'undefined' ? i18n.t('help.unitStats.movement') : 'Pohyb';
        stats.innerHTML = `
            <div class="stat-item"><span class="stat-value">${unitType.maxHealth}</span><span class="stat-label">${healthLabel}</span></div>
            <div class="stat-item"><span class="stat-value">${unitType.attack}</span><span class="stat-label">${attackLabel}</span></div>
            <div class="stat-item"><span class="stat-value">${unitType.defense}</span><span class="stat-label">${defenseLabel}</span></div>
            <div class="stat-item"><span class="stat-value">${unitType.range}</span><span class="stat-label">${rangeLabel}</span></div>
            <div class="stat-item"><span class="stat-value">${unitType.movement}</span><span class="stat-label">${movementLabel}</span></div>
        `;

        // Speciální schopnost
        let specialHtml = '';
        if (unitType.special && unitType.special !== 'commander') {
            const specialName = getSpecialDescription(unitType.special);
            specialHtml = `<div class="help-unit-special">${specialName}</div>`;
        }

        // Popis jednotky
        let descHtml = '';
        if (unitType.description) {
            descHtml = `<p class="help-unit-description">${unitType.description}</p>`;
        }

        // Rozšířené informace (lore) - vždy zobrazené
        let loreHtml = '';
        if (unitType.lore) {
            loreHtml = '<div class="help-unit-lore">';

            if (unitType.lore.description) {
                loreHtml += `<p class="lore-description">${unitType.lore.description}</p>`;
            }

            if (unitType.lore.equipment) {
                const equipmentLabel = typeof i18n !== 'undefined' ? i18n.t('help.equipment') : 'Výzbroj';
                loreHtml += `<div class="lore-item"><span class="lore-label">${equipmentLabel}:</span> ${unitType.lore.equipment}</div>`;
            }

            if (unitType.lore.origin) {
                const originLabel = typeof i18n !== 'undefined' ? i18n.t('help.origin') : 'Původ';
                loreHtml += `<div class="lore-item"><span class="lore-label">${originLabel}:</span> ${unitType.lore.origin}</div>`;
            }

            if (unitType.lore.historicalNote) {
                // Odstranit uvozovky na začátku pokud tam jsou
                let quote = unitType.lore.historicalNote;
                if (!quote.startsWith('"')) {
                    quote = '"' + quote;
                }
                if (!quote.endsWith('"') && !quote.includes('" -')) {
                    quote = quote + '"';
                }
                loreHtml += `<blockquote class="lore-quote">${quote}</blockquote>`;
            }

            loreHtml += '</div>';
        }

        // Sestavení karty
        card.appendChild(cardHeader);
        card.innerHTML += stats.outerHTML;
        card.innerHTML += specialHtml;
        card.innerHTML += descHtml;
        card.innerHTML += loreHtml;

        container.appendChild(card);
    }
}
