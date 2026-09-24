// Browser-local progress and portable, anonymous playtest summaries.
const DefenseSession = (() => {
    const STEPS = ['build', 'hill', 'barricade'];
    function keyFor(pathname) {
        const folder = pathname.replace(/index\.html$/i, '').replace(/\/$/, '');
        return 'wagonDefense:9:' + folder;
    }
    function read(storage, pathname) {
        const empty = { language: null, seen: [], attempts: 0, best: null, recent: [] };
        try {
            const data = JSON.parse(storage.getItem(keyFor(pathname)) || 'null');
            if (!data || typeof data !== 'object') return empty;
            return {
                language: ['cs', 'en'].includes(data.language) ? data.language : null,
                seen: Array.isArray(data.seen) ? STEPS.filter(step => data.seen.includes(step)) : [],
                attempts: Number.isInteger(data.attempts) ? Math.max(0, Math.min(1000000, data.attempts)) : 0,
                best: validResult(data.best) ? data.best : null,
                recent: Array.isArray(data.recent) ? data.recent.filter(validResult).slice(-10) : []
            };
        } catch (_) { return empty; }
    }
    function validResult(value) {
        return value && ['won', 'lost'].includes(value.outcome)
            && Number.isInteger(value.cleared) && value.cleared >= 0 && value.cleared <= 8
            && Number.isInteger(value.camp) && value.camp >= 0 && value.camp <= 20
            && Number.isInteger(value.kills) && value.kills >= 0 && value.kills <= 1000;
    }
    function save(storage, pathname, profile) {
        try { storage.setItem(keyFor(pathname), JSON.stringify(profile)); return true; }
        catch (_) { return false; }
    }
    function isBetter(result, best) {
        if (result.outcome !== best.outcome) return result.outcome === 'won';
        for (const field of ['cleared', 'camp', 'kills']) {
            if (result[field] !== best[field]) return result[field] > best[field];
        }
        return false;
    }
    function record(profile, result) {
        if (!validResult(result)) return false;
        const improved = !profile.best || isBetter(result, profile.best);
        const compact = { outcome: result.outcome, cleared: result.cleared, camp: result.camp, kills: result.kills };
        if (improved) profile.best = compact;
        profile.recent = [...profile.recent, compact].slice(-10);
        return improved;
    }
    function report(result, feedback = {}) {
        // Only game data and answers entered for this report; no identity,
        // saved campaign, browser fingerprint or automatic network request.
        return JSON.stringify({ game: 'Vozová hradba', ...result,
            feedback: {
                clarity: ['clear', 'mixed', 'lost'].includes(feedback.clarity) ? feedback.clarity : '',
                difficulty: ['easy', 'fair', 'hard'].includes(feedback.difficulty) ? feedback.difficulty : '',
                replay: ['yes', 'maybe', 'no'].includes(feedback.replay) ? feedback.replay : '',
                note: String(feedback.note || '').slice(0, 1200)
            }
        }, null, 2);
    }
    return Object.freeze({ STEPS, keyFor, read, save, record, report });
})();
if (typeof module !== 'undefined' && module.exports) module.exports = DefenseSession;
