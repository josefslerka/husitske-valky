#!/usr/bin/env node

/**
 * Kontrola indexově zarovnaných lokalizačních dat.
 *
 * Použití:
 *   node scripts/validate-locales.js
 *   node scripts/validate-locales.js --fix-dead-events
 *   node scripts/validate-locales.js --stamp-event-sources  # až po revizi obou překladů
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const localePaths = {
    cs: path.join(root, 'js/i18n/locales/cs.json'),
    en: path.join(root, 'js/i18n/locales/en.json')
};

function loadConst(filePath, names) {
    const source = fs.readFileSync(filePath, 'utf8');
    const exportsExpression = names.map(name => `${name}: typeof ${name} === 'undefined' ? undefined : ${name}`).join(',');
    const context = { console };
    vm.createContext(context);
    vm.runInContext(`${source}\n;globalThis.__validationExports = {${exportsExpression}};`, context, {
        filename: filePath
    });
    return context.__validationExports;
}

function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object || {}, key);
}

// Otisk celého zdrojového eventu hlídá i prohození dvou stejně strukturovaných
// událostí. Seřazení klíčů ignoruje čistě formátovací změny objektového literálu.
function eventSourceHash(event) {
    const canonical = value => {
        if (Array.isArray(value)) return value.map(canonical);
        if (value && typeof value === 'object') {
            return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
        }
        return value;
    };
    return crypto.createHash('sha256').update(JSON.stringify(canonical(event))).digest('hex').slice(0, 16);
}

function stripDeadScenarioEvents(source) {
    const lines = source.split(/(?<=\n)/);
    const output = [];
    let removed = 0;

    for (let i = 0; i < lines.length; i++) {
        // Jen vlastnost přímo pod konkrétním scénářem. Vnořené phase.events
        // mají hlubší odsazení a nesmí se jich automatická oprava dotknout.
        if (!/^      "events": \[/.test(lines[i])) {
            output.push(lines[i]);
            continue;
        }

        let depth = 0;
        let inString = false;
        let escaped = false;
        let finished = false;

        for (; i < lines.length; i++) {
            const line = lines[i];
            for (const char of line) {
                if (escaped) {
                    escaped = false;
                    continue;
                }
                if (char === '\\' && inString) {
                    escaped = true;
                    continue;
                }
                if (char === '"') {
                    inString = !inString;
                    continue;
                }
                if (!inString && char === '[') depth++;
                if (!inString && char === ']') depth--;
            }

            if (!inString && depth === 0 && /\],?\s*$/.test(line)) {
                finished = true;
                removed++;
                break;
            }
        }

        if (!finished) {
            throw new Error('Nedokončený blok scenarios.*.events – soubor nebyl změněn.');
        }
    }

    return { source: output.join(''), removed };
}

function fixDeadEvents() {
    let total = 0;
    for (const [language, filePath] of Object.entries(localePaths)) {
        const source = fs.readFileSync(filePath, 'utf8');
        const result = stripDeadScenarioEvents(source);
        if (result.removed > 0) {
            // Ověř, že mechanická úprava vytvořila platný JSON, ještě před zápisem.
            JSON.parse(result.source);
            fs.writeFileSync(filePath, result.source);
        }
        total += result.removed;
        console.log(`${language}: odstraněno mrtvých scenarios.*.events: ${result.removed}`);
    }
    return total;
}

if (process.argv.includes('--fix-dead-events')) {
    fixDeadEvents();
}

const { Scenarios } = loadConst(path.join(root, 'js/data/scenarios.js'), ['Scenarios']);
const { BattleLore, ScenarioToBattleLore } = loadConst(
    path.join(root, 'js/data/battleLore.js'),
    ['BattleLore', 'ScenarioToBattleLore']
);
const locales = Object.fromEntries(
    Object.entries(localePaths).map(([language, filePath]) => [language, JSON.parse(fs.readFileSync(filePath, 'utf8'))])
);
const errors = [];
const warnings = [];

function error(message) {
    errors.push(message);
}

function warning(message) {
    warnings.push(message);
}

// Nové narativní větve nesmí potichu spadnout z angličtiny do české báze.
function validateTextVariants(base, overlay, location) {
    for (const key of Object.keys(base || {})) {
        if (typeof overlay?.[key] !== 'string' || !overlay[key].trim()) {
            error(`${location}.${key}: chybí neprázdný překlad narativní varianty.`);
        }
    }
}

const scenarioEntries = Object.entries(Scenarios).filter(([, value]) => value && typeof value === 'object' && value.id);
if (scenarioEntries.length !== 18) {
    error(`Báze má ${scenarioEntries.length} scénářů, očekáváno 18.`);
}

// Použít až po ručním porovnání změněných zdrojových událostí s oběma překlady.
// Stávající event.id se tím nemění, takže uložené hry zůstávají kompatibilní.
const stampEventSources = process.argv.includes('--stamp-event-sources');
if (stampEventSources) {
    for (const language of Object.keys(localePaths)) {
        const locale = locales[language];
        for (const [scenarioId, scenario] of scenarioEntries) {
            const phases = locale.scenarios?.[scenarioId]?.phases;
            if (!phases || phases.length !== (scenario.phases || []).length) {
                throw new Error(`${language}: ${scenarioId} má jiný počet fází; otisky nebyly zapsány.`);
            }
            scenario.phases.forEach((phase, phaseIndex) => {
                const events = phases[phaseIndex]?.events;
                if (!events || events.length !== (phase.events || []).length) {
                    throw new Error(`${language}: ${scenarioId}, fáze ${phaseIndex + 1} má jiný počet eventů; otisky nebyly zapsány.`);
                }
                phase.events.forEach((event, eventIndex) => {
                    events[eventIndex].sourceHash = eventSourceHash(event);
                });
            });
        }
    }
}

for (const [scenarioId, scenario] of scenarioEntries) {
    for (const language of ['cs', 'en']) {
        // Globální mapLabels jsou nezávislé na tom, zda scénář používá
        // český overlay, proto je ověřujeme ještě před případným fallbackem.
        for (const label of scenario.mapLabels || []) {
            if (label.i18nKey && !hasOwn(locales[language].mapLabels, label.i18nKey)) {
                error(`${language.toUpperCase()}: chybí mapLabels.${label.i18nKey} pro ${scenarioId}.`);
            }
        }

        const zoneLabelKey = scenario.victoryConditions?.primary?.zoneLabelKey;
        if (zoneLabelKey && !hasOwn(locales[language].mapLabels, zoneLabelKey)) {
            error(`${language.toUpperCase()}: chybí mapLabels.${zoneLabelKey} pro cílovou zónu ${scenarioId}.`);
        }

        const overlay = locales[language].scenarios?.[scenarioId];
        if (!overlay) {
            if (language === 'en') error(`EN: chybí scenarios.${scenarioId}.`);
            else warning(`CS: chybí scenarios.${scenarioId}; použije se česká báze.`);
            continue;
        }

        if (hasOwn(overlay, 'events')) {
            error(`${language.toUpperCase()}: scenarios.${scenarioId}.events je mrtvá flat vlastnost; eventy patří do phases.*.events.`);
        }

        const location = `${language.toUpperCase()}: scenarios.${scenarioId}`;
        for (const side of ['hussites', 'crusaders']) {
            if (scenario.forces?.[side]?.reinforcements?.message &&
                (typeof overlay.reinforcements?.[side] !== 'string' || !overlay.reinforcements[side].trim())) {
                error(`${location}.reinforcements.${side}: chybí zpráva o posilách.`);
            }
        }
        for (const group of Object.keys(scenario.reinforcements || {})) {
            if (typeof overlay.reinforcementGroups?.[group] !== 'string' || !overlay.reinforcementGroups[group].trim()) {
                error(`${location}.reinforcementGroups.${group}: chybí zpráva o posilách.`);
            }
        }
        for (const group of Object.keys(overlay.reinforcementGroups || {})) {
            if (!hasOwn(scenario.reinforcements, group)) {
                error(`${location}.reinforcementGroups.${group}: skupina posil ve scénáři neexistuje.`);
            }
        }
        validateTextVariants(scenario.debriefing?.victoryVariants, overlay.debriefing?.victoryVariants,
            `${location}.debriefing.victoryVariants`);
        validateTextVariants(scenario.debriefing?.unitStatus?.texts, overlay.debriefing?.unitStatus?.texts,
            `${location}.debriefing.unitStatus.texts`);

        const basePhases = scenario.phases || [];
        const localizedPhases = overlay.phases || [];
        if (localizedPhases.length !== basePhases.length) {
            error(`${language.toUpperCase()}: ${scenarioId} má ${localizedPhases.length} fází, báze ${basePhases.length}.`);
            continue;
        }

        basePhases.forEach((phase, phaseIndex) => {
            const baseEvents = phase.events || [];
            const localizedEvents = localizedPhases[phaseIndex]?.events || [];
            if (localizedEvents.length !== baseEvents.length) {
                error(`${language.toUpperCase()}: ${scenarioId}, fáze ${phaseIndex + 1} má ${localizedEvents.length} eventů, báze ${baseEvents.length}.`);
                return;
            }

            for (const field of ['name', 'description']) {
                if (hasOwn(phase, field) && !hasOwn(localizedPhases[phaseIndex], field)) {
                    error(`${language.toUpperCase()}: ${scenarioId}, fáze ${phaseIndex + 1}: chybí ${field}.`);
                }
            }

            baseEvents.forEach((event, eventIndex) => {
                const localizedEvent = localizedEvents[eventIndex] || {};
                const eventLocation = `${language.toUpperCase()}: ${scenarioId}, fáze ${phaseIndex + 1}, event ${eventIndex + 1}`;
                validateTextVariants(event.unitStatus?.texts, localizedEvent.unitStatus?.texts,
                    `${location}.phases.${phaseIndex}.events.${eventIndex}.unitStatus.texts`);
                validateTextVariants(event.forceStatus?.texts, localizedEvent.forceStatus?.texts,
                    `${location}.phases.${phaseIndex}.events.${eventIndex}.forceStatus.texts`);
                for (const field of ['message', 'text', 'title']) {
                    if (hasOwn(event, field) && (typeof localizedEvent[field] !== 'string' || !localizedEvent[field].trim())) {
                        error(`${eventLocation}: chybí neprázdné ${field}.`);
                    }
                    if (!hasOwn(event, field) && hasOwn(localizedEvent, field)) {
                        error(`${eventLocation}: nadbytečné ${field} se v herní bázi nepoužije.`);
                    }
                }
                if (localizedEvent.sourceHash !== eventSourceHash(event)) {
                    error(`${eventLocation}: nesouhlasí sourceHash; ověř pořadí a obsah překladu proti zdroji.`);
                }
            });
        });

    }
}

// České obsahové uvozovky mají být typografické. Rovné uvozovky jsou
// povolené jen uvnitř HTML atributů v několika legacy překladech tlačítek.
function validateCzechQuotes(value, pathParts = []) {
    if (typeof value === 'string') {
        if (value.includes('"') && !/<[^>]+=["']/.test(value)) {
            error(`CS: ${pathParts.join('.')} obsahuje rovné obsahové uvozovky.`);
        }
        return;
    }
    if (Array.isArray(value)) {
        value.forEach((item, index) => validateCzechQuotes(item, [...pathParts, index]));
        return;
    }
    if (value && typeof value === 'object') {
        Object.entries(value).forEach(([key, item]) => validateCzechQuotes(item, [...pathParts, key]));
    }
}

validateCzechQuotes(locales.cs);

const mappedLoreIds = new Set(Object.values(ScenarioToBattleLore));
for (const [scenarioId] of scenarioEntries) {
    const mappingKey = Object.keys(ScenarioToBattleLore).find(key => scenarioId.includes(key));
    if (!mappingKey) error(`Scénář ${scenarioId} nemá záznam v ScenarioToBattleLore.`);
}
for (const loreId of Object.keys(BattleLore)) {
    if (!mappedLoreIds.has(loreId)) warning(`BattleLore.${loreId} není použité v ScenarioToBattleLore.`);

    const baseLore = BattleLore[loreId];
    if (!baseLore.enemyChronicle?.text || !baseLore.enemyChronicle?.source) {
        error(`BattleLore.${loreId} nemá úplnou enemyChronicle.`);
    }
    for (const language of ['cs', 'en']) {
        const enemyChronicle = locales[language].enemyChronicles?.[loreId];
        if (!enemyChronicle?.text || !enemyChronicle?.source) {
            error(`${language.toUpperCase()}: chybí enemyChronicles.${loreId}.text/source.`);
        }
        if (loreId === 'sion' && (!enemyChronicle?.counterText || !enemyChronicle?.counterSource)) {
            error(`${language.toUpperCase()}: Sion musí mít kronikářskou i archeologickou verzi.`);
        }

        const overlay = locales[language].battleLore?.[loreId];
        if (!overlay) {
            if (language === 'en') error(`EN: chybí battleLore.${loreId}.`);
            else warning(`CS: chybí battleLore.${loreId}; použije se česká báze.`);
            continue;
        }

        for (const field of ['quotes', 'trivia']) {
            const baseLength = baseLore[field]?.length || 0;
            const localizedLength = overlay[field]?.length || 0;
            if (language === 'cs' && localizedLength < baseLength) {
                // Čeština má kanonickou bázi; chybějící koncové položky bezpečně
                // doplní getLocalizedBattleLore() právě z ní.
                warning(`CS: battleLore.${loreId}.${field} má ${localizedLength} položek, báze ${baseLength}; zbytek se převezme z báze.`);
            } else if (localizedLength !== baseLength) {
                error(`${language.toUpperCase()}: battleLore.${loreId}.${field} má ${localizedLength} položek, báze ${baseLength}.`);
            }
        }
    }
}

for (const loreId of Object.keys(locales.en.battleLore || {})) {
    if (!BattleLore[loreId]) error(`EN: osiřelý battleLore.${loreId}, který není v bázi.`);
}

if (warnings.length) {
    console.log('\nVarování:');
    warnings.forEach(message => console.log(`  - ${message}`));
}

if (errors.length) {
    console.error('\nChyby lokalizace:');
    errors.forEach(message => console.error(`  - ${message}`));
    process.exit(1);
}

if (stampEventSources) {
    for (const [language, filePath] of Object.entries(localePaths)) {
        fs.writeFileSync(filePath, `${JSON.stringify(locales[language], null, 2)}\n`);
        console.log(`${language}: aktualizovány otisky zdrojových událostí po revizi překladů.`);
    }
}

console.log(`\nOK: ${scenarioEntries.length} scénářů a ${Object.keys(BattleLore).length} kronikářských záznamů je indexově zarovnáno.`);
