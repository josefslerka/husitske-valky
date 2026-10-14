// Scenario references: 2026-09-11 audit; selected unit profiles: 2026-10-14.
// These are not all primary chronicles: the UI identifies research and secondary accounts.
const HistoricalSources = {
    reviewed: '2026-09-11',
    unitProfilesReviewed: '2026-10-14',
    catalog: {
        warFlail: { kind: 'institutional', title: 'VHÚ: Bojový cep, Čechy, 15. století – sbírkový předmět', url: 'https://www.vhu.cz/exhibit/06-bojovy-cep-cechy-15-stoleti/' },
        sionHandgun: { kind: 'institutional', title: 'VHÚ: Železná střela v olověném plášti a ručnice, Sion, kolem 1437', url: 'https://www.vhu.cz/exhibit/zelezna-strela-v-olovenem-plasti-sion-kolem-1437/' },
        crossbowHook: { kind: 'institutional', title: 'VHÚ: Opaskový hák k napínání kuše, Sion, před 1437', url: 'https://www.vhu.cz/exhibit/opaskovy-hak-k-napinani-kuse-sion-pred-1437/' },
        sionShot: { kind: 'institutional', title: 'VHÚ: Torzo kamenné dělové koule, Sion, před 1437', url: 'https://www.vhu.cz/exhibit/torzo-kamenne-delove-koule-sion-pred-1437/' },
        mountedMen: { kind: 'institutional', title: 'VHÚ: Jízdní ozbrojenci, první polovina 15. století – rekonstrukce výstroje', url: 'https://www.vhu.cz/exhibit/jizdni-ozbrojenci-prvni-polovina-15-stoleti/' },
        commandMace: { kind: 'institutional', title: 'VHÚ: Palcát, střední Evropa, 15. století', url: 'https://www.vhu.cz/exhibit/04-palcat-stredni-evropa-15-stoleti/' },
        trocnovStudy: { kind: 'scholarship', title: 'Jihočeské muzeum: podklady expozice Jana Žižky – Hořice a střet u Strauchova dvora, PDF s. 23', url: 'https://www.muzeumcb.cz/files/files/souteze/trocnov/03_Priloha_2_ZD.pdf#page=23' },
        viktorinFather: { kind: 'research', title: 'František Musil: studie o Liticích, Mediaevalia Historica Bohemica 17/2 (2014), s. 116', url: 'https://www.hiu.cas.cz/user_uploads/vydavatelska_cinnost/periodika/mediaevalia_historica_bohemica/mhb_17_2_2014_fin.pdf#page=116' },
        earlyBattles: { kind: 'scholarship', title: 'VHÚ: Bitva u Sudoměře – s vozy proti železným pánům (2015)', url: 'https://www.vhu.cz/bitva-u-sudomere-s-vozy-proti-zeleznym-panum/' },
        zivohost: { kind: 'secondary', title: 'Bitva u Živohoště (4. nebo 6. 11. 1419), s přepisem zprávy Vavřince z Březové', url: 'https://www.e-stredovek.cz/post/bitva-u-zivohoste/' },
        nekmir: { kind: 'institutional', title: 'Obec Nekmíř: Historie', url: 'https://www.nekmir.cz/obec-nekmir/historie/' },
        vitkov: { kind: 'scholarship', title: 'Aleš Binar: Bitva na Vítkově, Univerzita obrany (2013)', url: 'https://lib.unob.cz/INFO_ARCHIV/INFO/info.unob.cz/Stranky/2013/07/20130711.html' },
        vysehrad: { kind: 'research', title: 'F. Kašička – B. Nechvátal: Vyšehrad v době husitské, Staletá Praha (1984), s. 121–140', url: 'https://staletapraha.cz/pdfs/pha/1984/01/12.pdf' },
        most: { kind: 'institutional', title: 'Oblastní muzeum v Děčíně: Česká listina z Děčína a Zikmund z Vartenberka', url: 'https://www.muzeumdc.cz/index.php/en/node/383' },
        zatec: { kind: 'secondary', title: 'Husitství.cz: II. křížová výprava (1421)', url: 'https://husitstvi.cz/vojenstvi/bitvy-a-tazeni/ii-krizova-vyprava-1421/' },
        kutna: { kind: 'institutional', title: 'VHÚ: Halapartníci, cca 1421 – výklad tažení u Kutné Hory', url: 'https://www.vhu.cz/exhibit/halapartnici-cca-1421/' },
        brod: { kind: 'institutional', title: 'Město Havlíčkův Brod: 770 let Havlíčkova Brodu', url: 'https://www.muhb.cz/770-let-havlickova-brodu/' },
        horice: { kind: 'institutional', title: 'Městské informační centrum Hořice: Historie města', url: 'https://infocentrum.horice.org/o-meste/historie' },
        malesov: { kind: 'scholarship', title: 'Jan Biederman: Žižkovo vítězství u Malešova a legenda o vozech naplněných kamením, VHÚ (2015)', url: 'https://www.vhu.cz/zizkovo-vitezstvi-u-malesova-a-vozy-naplnene-kamenim/' },
        usti: { kind: 'institutional', title: 'Muzeum města Ústí nad Labem: Bitva na Běhání', url: 'https://ucebnice.muzeumusti.cz/bitva-na-behani-2/' },
        tachov: { kind: 'institutional', title: 'Město Tachov: Husitství', url: 'https://www.tachov.cz/husitstvi.html' },
        nisa: { kind: 'institutional', title: 'Muzeum Powiatowe w Nysie: Świat biskupów – katalog', url: 'https://www.muzeum.nysa.pl/data/files/katalog__wiat_biskupow.pdf' },
        domazlice: { kind: 'scholarship', title: 'Aleš Binar: Bitva u Domažlic 14. srpna 1431, Univerzita obrany (2016)', url: 'https://lib.unob.cz/INFO_ARCHIV/INFO/info.unob.cz/Stranky/2016/08/20160810.html' },
        plzen: { kind: 'institutional', title: 'Západočeské muzeum: Plzeňská městská zbrojnice – obléhání 1433–1434', url: 'https://zcm.cz/en/visit/expositions/municipal-armoury-of-pilsen' },
        plzenArms: { kind: 'institutional', title: 'Encyklopedie města Plzně: Historie městského znaku', url: 'https://encyklopedie.plzen.eu/home-mup/?acc=profil_udalosti&load=23' },
        lipany: { kind: 'research', title: 'L. Militká – Z. Šámal: Archeologická prospekce bojiště u Lipan, Archaeologia historica 44/2 (2019), s. 699–713', url: 'https://journals.phil.muni.cz/archaeologia-historica/article/view/35158' },
        sionAtlas: { kind: 'research', title: 'Archeologický atlas ČR: Chlístovice – hrad Sion, plán lokality a obléhacích prací', url: 'https://www.archeologickyatlas.cz/cs/lokace/chlistovice_kh_hrad_sion' },
        sionReview: { kind: 'scholarship', title: 'VHÚ: Jan Roháč na Sióně – starší a novější archeologické výklady', url: 'https://www.vhu.cz/exhibit/janska-eva-jan-rohac-na-sione/' }
    },
    // These links support the specific context in the revised card, not its
    // game statistics or the deployment of every type in every scenario.
    units: {
        CEPNICI: ['warFlail'], SUDLICNICI: ['kutna'], HALAPARTNICI: ['kutna'],
        KUSINICI_HUSITI: ['crossbowHook'], KUSNICI: ['crossbowHook'],
        RUCNICARI: ['sionHandgun'], HOUFNICE: ['sionShot'],
        VOZOVA_HRADBA: ['trocnovStudy'], POLNI_OPEVNENI: ['vitkov'],
        JIZDA_HUSITI: ['mountedMen'], TEZKY_RYTIR: ['mountedMen'],
        SLECHTICKA_JIZDA_HUSITI: ['usti'],
        JAN_ZIZKA: ['trocnovStudy', 'commandMace'], DIVIS_BOREK: ['trocnovStudy'],
        HYNEK_PODEBRADY: ['viktorinFather'], VIKTORIN_BOCEK: ['viktorinFather'],
        BRENEK_SVIHOVSKY: ['earlyBattles'], BOHUSLAV_SVAMBERK: ['earlyBattles']
    },
    scenarios: {
        zivohost_1419: ['zivohost', 'earlyBattles'], nekmir_1419: ['earlyBattles', 'nekmir'],
        sudomere_1420: ['earlyBattles'], vitkov_1420: ['vitkov'], vysehrad_1420: ['vysehrad'],
        most_1421: ['most'], zatec_1421: ['zatec'], kutna_hora_1421: ['kutna'],
        nemecky_brod_1422: ['kutna', 'brod'], horice_1423: ['horice'], malesov_1424: ['malesov'],
        usti_1426: ['usti'], tachov_1427: ['tachov'], nisa_1428: ['nisa'], domazlice_1431: ['domazlice'],
        oblehani_plzne_1433: ['plzen', 'plzenArms'], lipany_1434: ['lipany'], sion_1437: ['sionAtlas', 'sionReview']
    }
};
