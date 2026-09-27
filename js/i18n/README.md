# Lokalizační systém - Dokumentace

## 📖 Přehled

Hra "Husitské Války" používá vlastní lokalizační systém založený na JSON souborech. Systém umožňuje snadné přidávání nových jazyků a přepínání mezi nimi za běhu.

Při startu má přednost platná uložená volba `gameLanguage`. Bez ní hra vezme první podporovaný jazyk (`cs` nebo `en`) z preferencí prohlížeče, včetně regionálních variant. Pokud žádný nenajde, použije češtinu. Přepínač v menu ukazuje **cílový** jazyk: `EN` v češtině a `CS` v angličtině; ruční volba se uloží i pro další návštěvu.

Verzi zobrazovanou v menu i obou obrazovkách O hře určuje společný klíč `menu.version`. Obsah obou obrazovek O hře generuje jediná šablona z klíčů `about.*`; v HTML nejsou její kopie. Při změně verze aktualizujte oba locale a stav vývoje v README; jejich shodu hlídá regresní test.

Odkaz `Změny` / `Changelog` v titulním menu vede podle aktivního jazyka na `CHANGELOG.md` nebo `CHANGELOG.en.md`. Přepíná se při prvním načtení i při změně jazyka; aktualizaci URL vlastní `updateLanguageToggle()` v `js/ui/main.js`.

### Texty scénářových událostí

Mechanika událostí zůstává v `js/data/scenarios.js`; jejich české a anglické texty jsou v `locales/cs.json` a `locales/en.json`. Události jsou zatím párované podle pořadí ve fázi. Pole `sourceHash` v každém překladu není text pro hráče: validátor jím hlídá, že překlad stále patří ke stejné zdrojové události. Kontroluje také shodu polí `message`, `text` a `title`, takže překlep v názvu pole už neprojde.

Po změně zdrojové události nejprve zkontrolujte oba překlady a jejich pořadí. Teprve pak spusťte `node scripts/validate-locales.js --stamp-event-sources`, prohlédněte diff a spusťte `node scripts/check.js`. Otisky neaktualizujte naslepo. Pořadí událostí v herní bázi také souvisí s identifikátory v uložených hrách; jeho změna vyžaduje samostatnou migraci savu. Samostatné skupiny posil mají texty pod `scenarios.<id>.reinforcementGroups.<group>`.

## 🏗️ Struktura

```
js/i18n/
├── i18n.js              # Hlavní lokalizační engine
└── locales/
    ├── cs.json          # Čeština (výchozí)
    └── en.json          # Angličtina
```

## 🚀 Použití

### V HTML (statické texty)

Použijte atribut `data-i18n` pro textový obsah:

```html
<button data-i18n="menu.newGame"></button>
<!-- Zobrazí: "Nová hra" (cs) nebo "New Game" (en) -->
```

Pro placeholdery:
```html
<input data-i18n-placeholder="search.placeholder" />
```

Pro title (tooltip):
```html
<button data-i18n-title="help.tooltip">?</button>
```

### V JavaScriptu (dynamické texty)

```javascript
// Jednoduchý překlad
const text = i18n.t('menu.newGame');

// Překlad s parametry
const msg = i18n.t('messages.unitMoved', { unit: 'Cepníci' });
// Zobrazí: "Cepníci se přesunula"

// Změna jazyka
await i18n.setLanguage('en');

// Získání aktuálního jazyka
const lang = i18n.getCurrentLanguage(); // 'cs' nebo 'en'
```

## 📝 Formát překladů (JSON)

```json
{
  "menu": {
    "newGame": "Nová hra",
    "settings": "Nastavení"
  },
  "messages": {
    "unitMoved": "{unit} se přesunula",
    "roundNumber": "Kolo {round}"
  }
}
```

### Hierarchická struktura

Klíče jsou organizované hierarchicky pomocí tečkové notace:
- `menu.newGame` → menu → newGame
- `game.turn` → game → turn
- `settings.soundEnabled` → settings → soundEnabled

### Parametry v textech

Použijte `{parametr}` pro dynamické hodnoty:
```json
{
  "messages": {
    "greeting": "Dobrý den, {name}!",
    "score": "Skóre: {points} bodů"
  }
}
```

V kódu:
```javascript
i18n.t('messages.greeting', { name: 'Josef' });
// Výsledek: "Dobrý den, Josef!"
```

## ➕ Přidání nového jazyka

### 1. Vytvořte nový JSON soubor

Vytvořte `js/i18n/locales/XX.json` (kde XX je kód jazyka):
```bash
cp js/i18n/locales/cs.json js/i18n/locales/de.json
```

### 2. Přeložte texty

Otevřete nový soubor a přeložte všechny hodnoty:
```json
{
  "menu": {
    "newGame": "Neues Spiel",    // přeloženo
    "settings": "Einstellungen"   // přeloženo
  }
}
```

⚠️ **NIKDY neměňte klíče** (např. `newGame`), měňte pouze hodnoty!

### 3. Přidejte jazyk do nastavení

V `index.html` přidejte option do language select:
```html
<select id="language-select">
    <option value="cs">Čeština</option>
    <option value="en">English</option>
    <option value="de">Deutsch</option>  <!-- Nový jazyk -->
</select>
```

### 4. Přidejte překlad do cs.json a en.json

```json
{
  "settings": {
    "languageGerman": "Deutsch"
  }
}
```

### 5. Přidejte data-i18n do HTML

```html
<option value="de" data-i18n="settings.languageGerman"></option>
```

## 🔍 Testování

### 1. Otevřete konzoli prohlížeče

```javascript
// Zkontrolujte načtené jazyky
i18n.getAvailableLanguages()

// Zkuste přeložit klíč
i18n.t('menu.newGame')

// Změňte jazyk
await i18n.setLanguage('en')
```

### 2. Chybějící překlady

Pokud překlad chybí, konzole zobrazí varování:
```
⚠️ Translation missing: menu.someKey (en)
```

A na stránce se zobrazí původní klíč: `menu.someKey`

## 📋 Checklist pro překlad

- [ ] Vytvořen soubor `XX.json` ve složce `locales/`
- [ ] Přeloženy všechny klíče ze `cs.json`
- [ ] Přidán jazyk do `<select id="language-select">` v HTML
- [ ] Přidán překlad názvu jazyka do `cs.json` a `en.json`
- [ ] Otestováno přepínání jazyka v nastavení
- [ ] Zkontrolovány chybějící překlady v konzoli

## 🎯 Kategorie textů

### Vysoká priorita (UI)
- `menu.*` - Hlavní menu
- `game.*` - Herní rozhraní
- `settings.*` - Nastavení
- `messages.*` - Herní zprávy

### Střední priorita
- `campaign.*` - Kampaň a akty
- `mission.*` - Mise a cíle
- `gameover.*` - Konec hry

### Nižší priorita
- `help.*` - Nápověda a encyklopedie
- `terrain.*` - Typy terénu
- `special.*` - Speciální schopnosti

## 🛠️ Tipy pro překladatele

1. **Zachovejte délku textu** - Některé UI elementy mají omezený prostor
2. **Používejte konzistentní terminologii** - Např. "unit" = vždy "jednotka"
3. **Respektujte formátování** - Zachovejte HTML entity jako `&times;`
4. **Testujte v kontextu** - Některé texty dávají smysl jen v UI
5. **Parametry nechte beze změny** - `{unit}`, `{round}` apod.

## 🐛 Řešení problémů

### Texty se nezobrazují

1. Zkontrolujte konzoli - jsou tam chyby?
2. Ověřte, že `i18n.js` se načítá jako první skript
3. Zkontrolujte, že `data-i18n` atribut má správný klíč

### Jazyk se nepřepnul

1. Ověřte, že soubor `XX.json` existuje
2. Zkontrolujte konzoli - načetl se soubor úspěšně?
3. Zkuste F5 (refresh) stránky

### Překlad chybí

1. Najděte klíč v konzoli (varování)
2. Přidejte překlad do příslušného `XX.json`
3. Refresh stránky

## 📚 Další informace

- **Fallback**: Pokud překlad chybí, použije se čeština
- **Cache**: Překlady se cachují v proměnné `i18n.translations`
- **Persistence**: Vybraný jazyk se ukládá do `localStorage`

## 🤝 Přispění

Pokud chcete přispět překladem do dalšího jazyka:

1. Fork repozitáře
2. Vytvořte nový `.json` soubor
3. Přeložte všechny klíče
4. Otevřete Pull Request

Děkujeme za pomoc s lokalizací! 🙏
