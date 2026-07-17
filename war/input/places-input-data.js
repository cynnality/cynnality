"use strict";

window.WarPlaceData = (() => {
    const DATA_PATH = "../data/places.json";
    const SAVE_SERVER = "http://127.0.0.1:8787";

    const COUNTRY_SVG_IDS = Object.freeze({
        "Afghanistan": "AF",
        "Albania": "AL",
        "Algeria": "DZ",
        "American Samoa": "AS",
        "Andorra": "AD",
        "Angola": "AO",
        "Anguilla": "AI",
        "Antarctica": "AQ",
        "Antigua and Barbuda": "AG",
        "Arab Republic of Egypt": "EG",
        "Argentina": "AR",
        "Argentine Republic": "AR",
        "Armenia": "AM",
        "Aruba": "AW",
        "Australia": "AU",
        "Austria": "AT",
        "Azerbaijan": "AZ",
        "Bahamas": "BS",
        "Bahrain": "BH",
        "Bangladesh": "BD",
        "Barbados": "BB",
        "Belarus": "BY",
        "Belgium": "BE",
        "Belize": "BZ",
        "Benin": "BJ",
        "Bermuda": "BM",
        "Bhutan": "BT",
        "Bolivarian Republic of Venezuela": "VE",
        "Bolivia": "BO",
        "Bolivia, Plurinational State of": "BO",
        "Bonaire, Sint Eustatius and Saba": "BQ",
        "Bosnia and Herzegovina": "BA",
        "Botswana": "BW",
        "Bouvet Island": "BV",
        "Brazil": "BR",
        "British Indian Ocean Territory": "IO",
        "British Virgin Islands": "VG",
        "Brunei": "BN",
        "Brunei Darussalam": "BN",
        "Bulgaria": "BG",
        "Burkina Faso": "BF",
        "Burundi": "BI",
        "Cabo Verde": "CV",
        "Cambodia": "KH",
        "Cameroon": "CM",
        "Canada": "CA",
        "Cape Verde": "CV",
        "Cayman Islands": "KY",
        "Central African Republic": "CF",
        "Chad": "TD",
        "Chile": "CL",
        "China": "CN",
        "Christmas Island": "CX",
        "Cocos (Keeling) Islands": "CC",
        "Colombia": "CO",
        "Commonwealth of Dominica": "DM",
        "Commonwealth of the Bahamas": "BS",
        "Commonwealth of the Northern Mariana Islands": "MP",
        "Comoros": "KM",
        "Congo": "CG",
        "Congo, The Democratic Republic of the": "CD",
        "Cook Islands": "CK",
        "Costa Rica": "CR",
        "Croatia": "HR",
        "Cuba": "CU",
        "Curaçao": "CW",
        "Cyprus": "CY",
        "Czech Republic": "CZ",
        "Czechia": "CZ",
        "Côte d'Ivoire": "CI",
        "Democratic People's Republic of Korea": "KP",
        "Democratic Republic of Sao Tome and Principe": "ST",
        "Democratic Republic of the Congo": "CD",
        "Democratic Republic of Timor-Leste": "TL",
        "Democratic Socialist Republic of Sri Lanka": "LK",
        "Denmark": "DK",
        "Djibouti": "DJ",
        "Dominica": "DM",
        "Dominican Republic": "DO",
        "DR Congo": "CD",
        "East Timor": "TL",
        "Eastern Republic of Uruguay": "UY",
        "Ecuador": "EC",
        "Egypt": "EG",
        "El Salvador": "SV",
        "Equatorial Guinea": "GQ",
        "Eritrea": "ER",
        "Estonia": "EE",
        "Eswatini": "SZ",
        "Ethiopia": "ET",
        "Falkland Islands (Malvinas)": "FK",
        "Faroe Islands": "FO",
        "Federal Democratic Republic of Ethiopia": "ET",
        "Federal Democratic Republic of Nepal": "NP",
        "Federal Republic of Germany": "DE",
        "Federal Republic of Nigeria": "NG",
        "Federal Republic of Somalia": "SO",
        "Federated States of Micronesia": "FM",
        "Federative Republic of Brazil": "BR",
        "Fiji": "FJ",
        "Finland": "FI",
        "France": "FR",
        "French Guiana": "GF",
        "French Polynesia": "PF",
        "French Republic": "FR",
        "French Southern Territories": "TF",
        "Gabon": "GA",
        "Gabonese Republic": "GA",
        "Gambia": "GM",
        "Georgia": "GE",
        "Germany": "DE",
        "Ghana": "GH",
        "Gibraltar": "GI",
        "Grand Duchy of Luxembourg": "LU",
        "Greece": "GR",
        "Greenland": "GL",
        "Grenada": "GD",
        "Guadeloupe": "GP",
        "Guam": "GU",
        "Guatemala": "GT",
        "Guernsey": "GG",
        "Guinea": "GN",
        "Guinea-Bissau": "GW",
        "Guyana": "GY",
        "Haiti": "HT",
        "Hashemite Kingdom of Jordan": "JO",
        "Heard Island and McDonald Islands": "HM",
        "Hellenic Republic": "GR",
        "Holy See (Vatican City State)": "VA",
        "Honduras": "HN",
        "Hong Kong": "HK",
        "Hong Kong Special Administrative Region of China": "HK",
        "Hungary": "HU",
        "Iceland": "IS",
        "Independent State of Papua New Guinea": "PG",
        "Independent State of Samoa": "WS",
        "India": "IN",
        "Indonesia": "ID",
        "Iran": "IR",
        "Iran, Islamic Republic of": "IR",
        "Iraq": "IQ",
        "Ireland": "IE",
        "Islamic Republic of Afghanistan": "AF",
        "Islamic Republic of Iran": "IR",
        "Islamic Republic of Mauritania": "MR",
        "Islamic Republic of Pakistan": "PK",
        "Isle of Man": "IM",
        "Israel": "IL",
        "Italian Republic": "IT",
        "Italy": "IT",
        "Ivory Coast": "CI",
        "Jamaica": "JM",
        "Japan": "JP",
        "Jersey": "JE",
        "Jordan": "JO",
        "Kazakhstan": "KZ",
        "Kenya": "KE",
        "Kingdom of Bahrain": "BH",
        "Kingdom of Belgium": "BE",
        "Kingdom of Bhutan": "BT",
        "Kingdom of Cambodia": "KH",
        "Kingdom of Denmark": "DK",
        "Kingdom of Eswatini": "SZ",
        "Kingdom of Lesotho": "LS",
        "Kingdom of Morocco": "MA",
        "Kingdom of Norway": "NO",
        "Kingdom of Saudi Arabia": "SA",
        "Kingdom of Spain": "ES",
        "Kingdom of Sweden": "SE",
        "Kingdom of Thailand": "TH",
        "Kingdom of the Netherlands": "NL",
        "Kingdom of Tonga": "TO",
        "Kiribati": "KI",
        "Korea, Democratic People's Republic of": "KP",
        "Korea, Republic of": "KR",
        "Kosovo": "XK",
        "Kuwait": "KW",
        "Kyrgyz Republic": "KG",
        "Kyrgyzstan": "KG",
        "Lao People's Democratic Republic": "LA",
        "Laos": "LA",
        "Latvia": "LV",
        "Lebanese Republic": "LB",
        "Lebanon": "LB",
        "Lesotho": "LS",
        "Liberia": "LR",
        "Libya": "LY",
        "Liechtenstein": "LI",
        "Lithuania": "LT",
        "Luxembourg": "LU",
        "Macao": "MO",
        "Macao Special Administrative Region of China": "MO",
        "Madagascar": "MG",
        "Malawi": "MW",
        "Malaysia": "MY",
        "Maldives": "MV",
        "Mali": "ML",
        "Malta": "MT",
        "Marshall Islands": "MH",
        "Martinique": "MQ",
        "Mauritania": "MR",
        "Mauritius": "MU",
        "Mayotte": "YT",
        "Mexico": "MX",
        "Micronesia": "FM",
        "Micronesia, Federated States of": "FM",
        "Moldova": "MD",
        "Moldova, Republic of": "MD",
        "Monaco": "MC",
        "Mongolia": "MN",
        "Montenegro": "ME",
        "Montserrat": "MS",
        "Morocco": "MA",
        "Mozambique": "MZ",
        "Myanmar": "MM",
        "Namibia": "NA",
        "Nauru": "NR",
        "Nepal": "NP",
        "Netherlands": "NL",
        "New Caledonia": "NC",
        "New Zealand": "NZ",
        "Nicaragua": "NI",
        "Niger": "NE",
        "Nigeria": "NG",
        "Niue": "NU",
        "Norfolk Island": "NF",
        "North Korea": "KP",
        "North Macedonia": "MK",
        "Northern Mariana Islands": "MP",
        "Norway": "NO",
        "Oman": "OM",
        "Pakistan": "PK",
        "Palau": "PW",
        "Palestine": "PS",
        "Palestine, State of": "PS",
        "Panama": "PA",
        "Papua New Guinea": "PG",
        "Paraguay": "PY",
        "People's Democratic Republic of Algeria": "DZ",
        "People's Republic of Bangladesh": "BD",
        "People's Republic of China": "CN",
        "Peru": "PE",
        "Philippines": "PH",
        "Pitcairn": "PN",
        "Plurinational State of Bolivia": "BO",
        "Poland": "PL",
        "Portugal": "PT",
        "Portuguese Republic": "PT",
        "Principality of Andorra": "AD",
        "Principality of Liechtenstein": "LI",
        "Principality of Monaco": "MC",
        "Puerto Rico": "PR",
        "Qatar": "QA",
        "Republic of Albania": "AL",
        "Republic of Angola": "AO",
        "Republic of Armenia": "AM",
        "Republic of Austria": "AT",
        "Republic of Azerbaijan": "AZ",
        "Republic of Belarus": "BY",
        "Republic of Benin": "BJ",
        "Republic of Bosnia and Herzegovina": "BA",
        "Republic of Botswana": "BW",
        "Republic of Bulgaria": "BG",
        "Republic of Burundi": "BI",
        "Republic of Cabo Verde": "CV",
        "Republic of Cameroon": "CM",
        "Republic of Chad": "TD",
        "Republic of Chile": "CL",
        "Republic of Colombia": "CO",
        "Republic of Costa Rica": "CR",
        "Republic of Croatia": "HR",
        "Republic of Cuba": "CU",
        "Republic of Cyprus": "CY",
        "Republic of Côte d'Ivoire": "CI",
        "Republic of Djibouti": "DJ",
        "Republic of Ecuador": "EC",
        "Republic of El Salvador": "SV",
        "Republic of Equatorial Guinea": "GQ",
        "Republic of Estonia": "EE",
        "Republic of Fiji": "FJ",
        "Republic of Finland": "FI",
        "Republic of Ghana": "GH",
        "Republic of Guatemala": "GT",
        "Republic of Guinea": "GN",
        "Republic of Guinea-Bissau": "GW",
        "Republic of Guyana": "GY",
        "Republic of Haiti": "HT",
        "Republic of Honduras": "HN",
        "Republic of Iceland": "IS",
        "Republic of India": "IN",
        "Republic of Indonesia": "ID",
        "Republic of Iraq": "IQ",
        "Republic of Kazakhstan": "KZ",
        "Republic of Kenya": "KE",
        "Republic of Kiribati": "KI",
        "Republic of Latvia": "LV",
        "Republic of Liberia": "LR",
        "Republic of Lithuania": "LT",
        "Republic of Madagascar": "MG",
        "Republic of Malawi": "MW",
        "Republic of Maldives": "MV",
        "Republic of Mali": "ML",
        "Republic of Malta": "MT",
        "Republic of Mauritius": "MU",
        "Republic of Moldova": "MD",
        "Republic of Mozambique": "MZ",
        "Republic of Myanmar": "MM",
        "Republic of Namibia": "NA",
        "Republic of Nauru": "NR",
        "Republic of Nicaragua": "NI",
        "Republic of North Macedonia": "MK",
        "Republic of Palau": "PW",
        "Republic of Panama": "PA",
        "Republic of Paraguay": "PY",
        "Republic of Peru": "PE",
        "Republic of Poland": "PL",
        "Republic of San Marino": "SM",
        "Republic of Senegal": "SN",
        "Republic of Serbia": "RS",
        "Republic of Seychelles": "SC",
        "Republic of Sierra Leone": "SL",
        "Republic of Singapore": "SG",
        "Republic of Slovenia": "SI",
        "Republic of South Africa": "ZA",
        "Republic of South Sudan": "SS",
        "Republic of Suriname": "SR",
        "Republic of Tajikistan": "TJ",
        "Republic of the Congo": "CG",
        "Republic of the Gambia": "GM",
        "Republic of the Marshall Islands": "MH",
        "Republic of the Niger": "NE",
        "Republic of the Philippines": "PH",
        "Republic of the Sudan": "SD",
        "Republic of Trinidad and Tobago": "TT",
        "Republic of Tunisia": "TN",
        "Republic of Türkiye": "TR",
        "Republic of Uganda": "UG",
        "Republic of Uzbekistan": "UZ",
        "Republic of Vanuatu": "VU",
        "Republic of Yemen": "YE",
        "Republic of Zambia": "ZM",
        "Republic of Zimbabwe": "ZW",
        "Romania": "RO",
        "Russia": "RU",
        "Russian Federation": "RU",
        "Rwanda": "RW",
        "Rwandese Republic": "RW",
        "Réunion": "RE",
        "Saint Barthélemy": "BL",
        "Saint Helena, Ascension and Tristan da Cunha": "SH",
        "Saint Kitts and Nevis": "KN",
        "Saint Lucia": "LC",
        "Saint Martin (French part)": "MF",
        "Saint Pierre and Miquelon": "PM",
        "Saint Vincent and the Grenadines": "VC",
        "Samoa": "WS",
        "San Marino": "SM",
        "Sao Tome and Principe": "ST",
        "Saudi Arabia": "SA",
        "Senegal": "SN",
        "Serbia": "RS",
        "Seychelles": "SC",
        "Sierra Leone": "SL",
        "Singapore": "SG",
        "Sint Maarten (Dutch part)": "SX",
        "Slovak Republic": "SK",
        "Slovakia": "SK",
        "Slovenia": "SI",
        "Socialist Republic of Viet Nam": "VN",
        "Solomon Islands": "SB",
        "Somalia": "SO",
        "South Africa": "ZA",
        "South Georgia and the South Sandwich Islands": "GS",
        "South Korea": "KR",
        "South Sudan": "SS",
        "Spain": "ES",
        "Sri Lanka": "LK",
        "State of Israel": "IL",
        "State of Kuwait": "KW",
        "State of Qatar": "QA",
        "Sudan": "SD",
        "Sultanate of Oman": "OM",
        "Suriname": "SR",
        "Svalbard and Jan Mayen": "SJ",
        "Sweden": "SE",
        "Swiss Confederation": "CH",
        "Switzerland": "CH",
        "Syria": "SY",
        "Syrian Arab Republic": "SY",
        "Taiwan": "TW",
        "Taiwan, Province of China": "TW",
        "Tajikistan": "TJ",
        "Tanzania": "TZ",
        "Tanzania, United Republic of": "TZ",
        "Thailand": "TH",
        "the State of Eritrea": "ER",
        "the State of Palestine": "PS",
        "Timor-Leste": "TL",
        "Togo": "TG",
        "Togolese Republic": "TG",
        "Tokelau": "TK",
        "Tonga": "TO",
        "Trinidad and Tobago": "TT",
        "Tunisia": "TN",
        "Turkmenistan": "TM",
        "Turks and Caicos Islands": "TC",
        "Tuvalu": "TV",
        "Türkiye": "TR",
        "Uganda": "UG",
        "UK": "GB",
        "Ukraine": "UA",
        "Union of the Comoros": "KM",
        "United Arab Emirates": "AE",
        "United Kingdom": "GB",
        "United Kingdom of Great Britain and Northern Ireland": "GB",
        "United Mexican States": "MX",
        "United Republic of Tanzania": "TZ",
        "United States": "US",
        "United States Minor Outlying Islands": "UM",
        "United States of America": "US",
        "Uruguay": "UY",
        "USA": "US",
        "Uzbekistan": "UZ",
        "Vanuatu": "VU",
        "Venezuela": "VE",
        "Venezuela, Bolivarian Republic of": "VE",
        "Viet Nam": "VN",
        "Vietnam": "VN",
        "Virgin Islands of the United States": "VI",
        "Virgin Islands, British": "VG",
        "Virgin Islands, U.S.": "VI",
        "Wallis and Futuna": "WF",
        "Western Sahara": "EH",
        "Yemen": "YE",
        "Zambia": "ZM",
        "Zimbabwe": "ZW",
        "Åland Islands": "AX",
    });

    function normalizeCollection(data) {
        if (!data || typeof data !== "object") {
            return { places: {} };
        }

        if (Array.isArray(data.places)) {
            return {
                places: Object.fromEntries(
                    data.places
                        .filter(place => place?.placeId)
                        .map(place => [place.placeId, place])
                )
            };
        }

        return {
            places: data.places && typeof data.places === "object"
                ? data.places
                : {}
        };
    }

    async function loadPlaces() {
        const response = await fetch(`${DATA_PATH}?v=${Date.now()}`);

        if (!response.ok) {
            throw new Error(`Could not load places.json (${response.status})`);
        }

        return normalizeCollection(await response.json());
    }

    async function savePlace(place) {
        return postJson("/save-war-place", place);
    }

    async function saveMarkdown(markdownFile, content) {
        return postJson("/save-war-markdown", {
            markdownFile,
            content
        });
    }

    async function loadMarkdown(markdownFile) {
        if (!markdownFile) return "";

        const relativePath = markdownFile.replace(/^war\//, "../");
        const response = await fetch(`${relativePath}?v=${Date.now()}`);

        if (response.status === 404) return "";
        if (!response.ok) {
            throw new Error(`Could not load markdown (${response.status})`);
        }

        return response.text();
    }

    async function postJson(route, payload) {
        const response = await fetch(`${SAVE_SERVER}${route}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok || result.ok === false) {
            throw new Error(result.error || `Request failed (${response.status})`);
        }

        return result;
    }

    function slugify(value) {
        return String(value || "")
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/&/g, " and ")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .replace(/-{2,}/g, "-");
    }

    function linesToArray(value) {
        return String(value || "")
            .split(/[\n,]+/)
            .map(item => item.trim())
            .filter(Boolean);
    }

    function arrayToLines(value) {
        return Array.isArray(value) ? value.join(", ") : "";
    }

    function normalizeCountryName(value) {
        return String(value || "")
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .toLowerCase()
            .replace(/&/g, " and ")
            .replace(/[^a-z0-9]+/g, " ")
            .replace(/\s+/g, " ");
    }

    const COUNTRY_SVG_ID_LOOKUP = new Map(
        Object.entries(COUNTRY_SVG_IDS).map(([name, svgId]) => [
            normalizeCountryName(name),
            svgId
        ])
    );

    function getCountrySvgId(countryName) {
        return COUNTRY_SVG_ID_LOOKUP.get(normalizeCountryName(countryName)) || "";
    }

    return {
        loadPlaces,
        savePlace,
        saveMarkdown,
        loadMarkdown,
        slugify,
        linesToArray,
        arrayToLines,
        getCountrySvgId
    };
})();
