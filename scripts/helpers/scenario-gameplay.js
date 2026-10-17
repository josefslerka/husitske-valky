// Narativní metadata jsou jen výběr textu. Otisk dál hlídá jednotky, terén,
// cíle, podmínky, efekty, ID, pořadí, kola i rozkazy AI všech scénářů.
const keys = ['mapSize', 'terrain', 'forces', 'victoryConditions', 'phases',
    'specialMechanics', 'defeatConditions', 'turnLimit', 'playerFaction', 'reinforcements'];
const strip = value => Array.isArray(value) ? value.map(strip) : value && typeof value === 'object'
    ? Object.fromEntries(Object.entries(value)
        .filter(([key]) => !['name', 'description', 'message', 'text', 'title', 'commander', 'unitStatus', 'forceStatus'].includes(key))
        .map(([key, item]) => [key, strip(item)])) : value;
const scenarioGameplay = scenarios => Object.fromEntries(Object.entries(scenarios).map(([id, scenario]) =>
    [id, strip(Object.fromEntries(keys.filter(key => scenario[key] !== undefined).map(key => [key, scenario[key]])))]));
module.exports = { scenarioGameplay };
