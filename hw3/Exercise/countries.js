const COUNTRIES_API = 'https://api.restcountries.com/countries/v5';
const CACHE_MS = 10 * 60 * 1000;

function nonEmptyString(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function normalizeCountry(record, index) {
  const country = record && typeof record === 'object' ? record : {};

  const flagUrl = nonEmptyString(country.flag?.url_svg || country.flag?.url_png);

  const name = nonEmptyString(country.names?.common, nonEmptyString(country.names?.official, 'Unknown country'));

  return {
    id: nonEmptyString(country.codes?.alpha_3, `unknown-${index}`),
    name,
    capitals: Array.isArray(country.capitals)
      ? country.capitals.map((capital) => nonEmptyString(capital?.name)).filter(Boolean)
      : [],
    region: nonEmptyString(country.region, 'Unspecified region'),
    population:
      typeof country.population === 'number' &&
        Number.isFinite(country.population) &&
        country.population >= 0
        ? country.population
        : null,
    flag: flagUrl.startsWith('https://') ? flagUrl : '',
    flagAlt: nonEmptyString(country.flag?.description, `Flag of ${name}`),
    currencies: Array.isArray(country.currencies)
      ? country.currencies
          .filter((currency) => currency && typeof currency === 'object')
          .map((currency) => ({
            code: nonEmptyString(currency.code),
            name: nonEmptyString(currency.name, nonEmptyString(currency.code, 'Unknown currency')),
            symbol: nonEmptyString(currency.symbol),
          }))
      : [],
  };
}

function groupRegions(countries) {
  const regions = new Map();
  countries.forEach((country) => {
    if (!regions.has(country.region)) regions.set(country.region, []);
    regions.get(country.region).push(country);
  });
  return [...regions]
    .sort(([a], [b]) => a.localeCompare(b, 'en'))
    .map(([name, members]) => ({
      name,
      count: members.length,
      countries: members.slice().sort((a, b) => a.name.localeCompare(b.name, 'en')),
    }));
}

async function getCountryRecords(apiKey) {
  const records = [];
  async function page(offset) {
    const url = new URL(COUNTRIES_API);
    url.search = new URLSearchParams({
      limit: '100',
      offset: String(offset),
      response_fields: 'names.common,names.official,codes.alpha_3,capitals,population,flag,region,currencies',
    });
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`Country data service returned HTTP ${response.status}.`);
    const payload = await response.json();
    const objects = payload?.data?.objects;
    if (
      !Array.isArray(objects) ||
      Object.prototype.hasOwnProperty.call(payload?.data || {}, '_demo')
    )
      throw new Error('The API did not return a complete country dataset.');
    records.push(...objects);
    if (objects.length === 100) {
      if (offset >= 1000) throw new Error('Unexpected pagination from the country service.');
      await page(offset + 100);
    }
  }
  await page(0);
  if (!records.length) throw new Error('The country service returned an empty dataset.');
  return records;
}

let cached;
let pending;
async function loadCountries() {
  if (cached && Date.now() - cached.time < CACHE_MS) return cached.data;
  if (!process.env.REST_COUNTRIES_API_KEY)
    throw new Error('Configure REST_COUNTRIES_API_KEY in the server .env file.');
  if (!pending) {
    pending = (async () => {
      const payload = await getCountryRecords(process.env.REST_COUNTRIES_API_KEY);
      const countries = payload
        .map(normalizeCountry)
        .sort((a, b) => a.name.localeCompare(b.name, 'en'));
      const data = {
        countries,
        updatedAt: new Date().toISOString(),
      };
      cached = { time: Date.now(), data };
      return data;
    })().finally(() => {
      pending = undefined;
    });
  }
  return pending;
}

module.exports = { normalizeCountry, groupRegions, loadCountries, getCountryRecords };
