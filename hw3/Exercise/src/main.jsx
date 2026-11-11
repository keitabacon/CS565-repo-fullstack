import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import PropTypes from 'prop-types';
import './styles.css';
// nav bar options
const pages = {
  home: 'Home',
  countries: 'Countries',
  populous: 'Populous countries',
  regions: 'Regions',
};
const countryType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  capitals: PropTypes.arrayOf(PropTypes.string).isRequired,
  population: PropTypes.number,
  flag: PropTypes.string.isRequired,
  flagAlt: PropTypes.string.isRequired,
});

// find flag for the country passed through
function Flag({ country }) {
  const [failed, setFailed] = useState(false);
  // if no flag
  if (!country.flag || failed) return <p>Flag unavailable</p>;
  return (
    <img
      src={country.flag}
      alt={country.flagAlt}
      width="80"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
Flag.propTypes = { country: countryType.isRequired };

// get country list
function CountryList({ countries, populous }) {
  // if no countries found
  if (!countries.length) return <p>No countries found.</p>;
  // map through countries and list country in country card
  return countries.map((country) => (
    <article key={country.id}>
      <h2>{country.name}</h2>
      {/* if populous page */}
      {populous ? (
        <>
          <Flag country={country} />
          <p>Population: {country.population.toLocaleString('en-US')}</p>
        </>
      ) : (
        <>
          <p>Capital: {country.capitals.join(', ') || 'Unavailable'}</p>
          <p>Currency: {country.currency || 'Unavailable'}</p>
        </>
      )}
    </article>
  ));
}
CountryList.propTypes = {
  countries: PropTypes.arrayOf(countryType).isRequired,
  populous: PropTypes.bool.isRequired,
};

// get data
function DataPage({ page }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  // use effect every page render or attempt
  useEffect(() => {
    // new controller
    const controller = new AbortController();
    // reset data and error
    setData(null);
    setError('');
    // fetch data
    fetch(`/api/${page}`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        // if failed response
        if (!response.ok) throw new Error(result.error || 'Unable to load countries.');
        return result;
      })
      // set data if all good
      .then(setData)
      .catch((failure) => {
        if (failure.name !== 'AbortError') setError(failure.message);
      });
    return () => controller.abort();
  }, [page, attempt]);
  // error page
  if (error) {
    return (
      <div role="alert">
        <p>{error}</p>
        <button type="button" onClick={() => setAttempt(attempt + 1)}>
          Try again
        </button>
      </div>
    );
  }
  // loading
  if (!data) return <p role="status">Loading countries...</p>;
  // if we are on the regions page
  if (page === 'regions') {
    return (
      <>
        <p>Total countries: {data.total}</p>
        {data.regions.map((region) => (
          <section key={region.name}>
            <h2>
              {region.name} ({region.count} countries)
            </h2>
            <ul>
              {region.countries.map((country) => (
                <li key={country.id}>{country.name}</li>
              ))}
            </ul>
          </section>
        ))}
      </>
    );
  }
  // Populous page
  return (
    <>
      <p>{data.countries.length} countries</p>
      {page === 'populous' && <p>Population of at least 50 million, highest first.</p>}
      <CountryList countries={data.countries} populous={page === 'populous'} />
    </>
  );
}
DataPage.propTypes = {
  page: PropTypes.oneOf(['countries', 'populous', 'regions']).isRequired,
};

// return nav bar and main section
function App() {
  const page = window.location.pathname.replace(/^\/|\/$/g, '') || 'home';
  let content = <a href="/home">Go home</a>;
  if (page === 'home') {
    content = <p>Welcome! Use the links above to view countries, populations, and regions.</p>;
  } else if (pages[page]) {
    content = <DataPage page={page} />;
  }
  return (
    <>
      <nav aria-label="Main navigation">
        {Object.entries(pages).map(([path, title]) => (
          <a key={path} href={`/${path}`} aria-current={page === path ? 'page' : undefined}>
            {title}
          </a>
        ))}
      </nav>
      <main>
        <h1>{pages[page] || 'Page not found'}</h1>
        {content}
      </main>
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
