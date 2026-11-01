const express = require('express');
const path = require('path');
const { loadCountries, groupRegions } = require('./countries');

const app = express();
const port = process.env.PORT || 3001;

// await loadCountries
app.use('/api', async (req, res, next) => {
  try {
    req.countryData = await loadCountries();
    return next();
  } catch {
    return res.status(502).json({ error: 'Unable to load countries. Please try again.' });
  }
});

// regular countries page data
app.get('/api/countries', (req, res) => res.json(req.countryData));
// populous but filter and sort data
app.get('/api/populous', (req, res) => {
  const countries = req.countryData.countries
    .filter((country) => country.population >= 50000000)
    .sort((a, b) => b.population - a.population);
  res.json({ countries });
});
// regions function
app.get('/api/regions', (req, res) => {
  const { countries } = req.countryData;
  res.json({ regions: groupRegions(countries), total: countries.length });
});
// 404 handling
app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found.' }));

app.use(express.static(path.join(__dirname, 'dist')));
app.get('/', (req, res) => res.redirect('/home'));
app.get(['/home', '/countries', '/populous', '/regions'], (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

app.listen(port, () => {
  process.stdout.write(`Open http://localhost:${port}/home\n`);
});
