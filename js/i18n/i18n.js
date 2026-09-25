// Lokalizační systém pro Husitské Války
// Podporuje načítání různých jazyků a dynamické přepínání

class I18n {
    constructor() {
        this.currentLanguage = 'cs'; // Výchozí jazyk
        this.translations = {};
        this.loadedLanguages = new Set();
        this.fallbackLanguage = 'cs';
    }

    /**
     * Načte jazykový soubor
     * @param {string} lang - Kód jazyka (cs, en)
     */
    async loadLanguage(lang) {
        if (!['cs', 'en'].includes(lang)) return false;
        if (this.loadedLanguages.has(lang)) {
            return true; // Už načteno
        }

        try {
            const response = await fetch(`js/i18n/locales/${lang}.json?v=8.36`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            if (!data || typeof data.menu?.newGame !== 'string' || typeof data.game?.endTurn !== 'string') {
                throw new Error('Invalid language file');
            }
            this.translations[lang] = data;
            this.loadedLanguages.add(lang);
            return true;
        } catch (error) {
            console.error(`✗ Error loading language ${lang}:`, error);
            console.error('Make sure you are running the game from a web server (not file://)');
            console.error('Try: python3 -m http.server 8000');
            return false;
        }
    }

    /**
     * Nastaví aktivní jazyk
     * @param {string} lang - Kód jazyka
     */
    async setLanguage(lang) {
        if (!['cs', 'en'].includes(lang)) return false;
        // Načti jazyk pokud ještě není načten
        if (!this.loadedLanguages.has(lang)) {
            await this.loadLanguage(lang);
        }

        // Pokud jazyk neexistuje, zůstaň u aktuálního
        if (!this.loadedLanguages.has(lang)) {
            console.warn(`Language ${lang} not available, staying on ${this.currentLanguage}`);
            return false;
        }

        this.currentLanguage = lang;

        // Ulož do localStorage
        try { GameStorage.setItem('gameLanguage', lang); }
        catch (error) { console.warn('Language preference could not be saved', error); }

        // Aktualizuj UI
        this.updateDOM();

        // Aktualizuj herní data (jednotky, scénáře, atd.)
        if (typeof updateGameDataLocalization === 'function') {
            updateGameDataLocalization();
        }

        this.notifyLanguageChanged();
        return true;
    }

    /**
     * Získá překlad pro daný klíč
     * @param {string} key - Klíč překladu (např. "menu.newGame")
     * @param {object} params - Parametry pro nahrazení v textu
     * @returns {string} Přeložený text
     */
    t(key, params = {}) {
        let translation = this.getNestedTranslation(this.currentLanguage, key);

        // Fallback na výchozí jazyk
        if (translation === undefined && this.currentLanguage !== this.fallbackLanguage) {
            translation = this.getNestedTranslation(this.fallbackLanguage, key);
        }

        // Pokud překlad neexistuje, vrať klíč
        if (translation === undefined) {
            console.warn(`Translation missing: ${key} (${this.currentLanguage})`);
            return key;
        }

        // Nahraď parametry
        return this.replaceParams(translation, params);
    }

    /**
     * Získá vnořený překlad z objektu
     * @param {string} lang - Jazyk
     * @param {string} key - Klíč (tečková notace)
     * @returns {string|undefined} Překlad
     */
    getNestedTranslation(lang, key) {
        const keys = key.split('.');
        let current = this.translations[lang];

        for (const k of keys) {
            if (current && typeof current === 'object' && k in current) {
                current = current[k];
            } else {
                return undefined;
            }
        }

        return current;
    }

    /**
     * Nahradí parametry v textu
     * @param {string} text - Text s placeholdery {param}
     * @param {object} params - Parametry
     * @returns {string} Text s nahrazenými parametry
     */
    replaceParams(text, params) {
        if (typeof text !== 'string') return text;

        return text.replace(/\{(\w+)\}/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match;
        });
    }

    /**
     * Kontroluje, zda existuje překlad pro daný klíč
     * @param {string} key - Klíč překladu
     * @returns {boolean}
     */
    hasTranslation(key) {
        return this.getNestedTranslation(this.currentLanguage, key) !== undefined;
    }

    /**
     * Aktualizuje DOM elementy s data-i18n atributem
     */
    updateDOM() {
        let updated = 0;
        // Aktualizuj elementy s data-i18n atributem
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);

            // Speciální zpracování pro různé typy elementů
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                if (element.hasAttribute('placeholder')) {
                    element.placeholder = translation;
                } else {
                    element.value = translation;
                }
            } else {
                element.textContent = translation;
                updated++;
            }
        });

        // Aktualizuj elementy s data-i18n-placeholder
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.t(key);
        });

        // Aktualizuj elementy s data-i18n-title (tooltip)
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.t(key);
        });
        document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
            element.setAttribute('aria-label', this.t(element.getAttribute('data-i18n-aria-label')));
        });

        // Aktualizuj HTML lang atribut
        document.documentElement.lang = this.currentLanguage;

        // Aktualizuj page title a meta tagy
        this.updateMetaTags();
    }

    /**
     * Oznámí dynamickým částem rozhraní, že statické data-i18n uzly už
     * byly přeloženy. Událost drží main.js oddělený od interního loaderu.
     */
    notifyLanguageChanged() {
        if (typeof document === 'undefined' || typeof CustomEvent === 'undefined') return;
        document.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: this.currentLanguage }
        }));
    }

    /**
     * Aktualizuje meta tagy podle jazyka
     */
    updateMetaTags() {
        const metaData = {
            cs: {
                title: 'Husitské války — historická tahová strategie',
                description: 'Historická tahová strategie o husitských válkách. Veďte husitská vojska Jana Žižky v bitvách 15. století.'
            },
            en: {
                title: 'Hussite Wars — historical turn-based strategy',
                description: 'Historical turn-based strategy about Hussite Wars. Lead Jan Žižka\'s armies in 15th century battles.'
            }
        };

        const data = metaData[this.currentLanguage] || metaData.cs;

        // Aktualizuj page title
        document.title = (GameStorage.isTest ? '[TEST] ' : '') + data.title;

        // Aktualizuj meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.content = data.description;
        }

        // Sociální crawlery čtou statické HTML bez přepnutí jazyka. Open Graph
        // a Twitter metadata proto zůstávají záměrně dvojjazyčná pro jedinou URL.
    }

    /**
     * Získá aktuální jazyk
     * @returns {string}
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    /**
     * Získá seznam dostupných jazyků
     * @returns {string[]}
     */
    getAvailableLanguages() {
        return Array.from(this.loadedLanguages);
    }

    /**
     * Detekuje jazyk prohlížeče
     * @returns {string} Detekovaný jazyk (cs/en) nebo fallback
     */
    detectBrowserLanguage() {
        // Respektuj pořadí preferencí, například de-DE → en-GB → cs-CZ.
        const browserLanguages = [
            ...(Array.isArray(navigator.languages) ? navigator.languages : []),
            navigator.language || navigator.userLanguage
        ];
        for (const language of browserLanguages) {
            const langCode = typeof language === 'string' ? language.split('-')[0].toLowerCase() : '';
            if (['cs', 'en'].includes(langCode)) return langCode;
        }

        // Jinak vrať fallback
        return this.fallbackLanguage;
    }

    /**
     * Inicializace - načte výchozí jazyk
     */
    async init() {
        // Načti uložený jazyk z localStorage
        let savedLanguage = null;
        try { savedLanguage = GameStorage.getItem('gameLanguage'); }
        catch (error) { console.warn('Language preference unavailable', error); }
        if (!['cs', 'en'].includes(savedLanguage)) savedLanguage = null;

        // Načti výchozí jazyk (čeština)
        await this.loadLanguage(this.fallbackLanguage);
        if (!this.loadedLanguages.has(this.fallbackLanguage)) throw new Error('Translations unavailable');

        // Pokud máme uložený jazyk, použij ho
        if (savedLanguage) {
            if (savedLanguage !== this.fallbackLanguage) {
                await this.setLanguage(savedLanguage);
            } else {
                this.currentLanguage = this.fallbackLanguage;
            }
        } else {
            // Jinak detekuj jazyk prohlížeče
            const detectedLang = this.detectBrowserLanguage();

            if (detectedLang !== this.fallbackLanguage) {
                await this.setLanguage(detectedLang);
            } else {
                this.currentLanguage = this.fallbackLanguage;
            }
        }

        // Aktualizuj DOM. setLanguage už událost vyslal; pro výchozí češtinu
        // ji vyšleme tady, aby oba iniciační směry měly stejný kontrakt.
        this.updateDOM();
        this.notifyLanguageChanged();
    }
}

// Vytvoř globální instanci
const i18n = new I18n();

// Export pro případné použití v modulech
if (typeof module !== 'undefined' && module.exports) {
    module.exports = i18n;
}
