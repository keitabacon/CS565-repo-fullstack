const COUNTRIES_API = 'https://api.restcountries.com/countries/v5';
const CACHE_MS = 10 * 60 * 1000;

function text(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function normalizeCountry(record, index) {
  const country = record && typeof record === 'object' ? record : {};
  const flagUrl = text(country.flag?.url_svg || country.flag?.url_png);
  const name = text(country.names?.common, text(country.names?.official, 'Unknown country'));
  return {
    id: text(country.codes?.alpha_3, `unknown-${index}`),
    name,
    capitals: Array.isArray(country.capitals)
      ? country.capitals.map((capital) => text(capital?.name)).filter(Boolean)
      : [],
    region: text(country.region, 'Unspecified region'),
    population:
      typeof country.population === 'number' &&
      Number.isFinite(country.population) &&
      country.population >= 0
        ? country.population
        : null,
    flag: flagUrl.startsWith('https://') ? flagUrl : '',
    flagAlt: text(country.flag?.description, `Flag of ${name}`),
    leaders: [],
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
      response_fields: 'names.common,names.official,codes.alpha_3,capitals,population,flag,region',
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
        leaderNotice:
          'Leader information is unavailable in this exercise. All other available country records are included.',
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
