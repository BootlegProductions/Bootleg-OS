(() => {
  const svg = document.querySelector('#world-time-map');
  if (!svg) return;

  const countrySelect = document.querySelector('#world-country');
  const zoneSelect = document.querySelector('#world-zone');
  const place = document.querySelector('#world-place');
  const clock = document.querySelector('#world-now');
  const date = document.querySelector('#world-date');
  const NS = 'http://www.w3.org/2000/svg';
  const WIDTH = 1000;
  const HEIGHT = 500;
  const bandWidth = WIDTH / 24;
  const paths = new Map();
  let zonesByCountry = {};
  let selectedName = '';
  let bands = [];

  function svgElement(tag, attributes) {
    const node = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
    return node;
  }

  // Equirectangular projection keeps longitude bands straight and readable.
  function position(point) {
    return [((point[0] + 180) / 360) * WIDTH, ((90 - point[1]) / 180) * HEIGHT];
  }

  function ringPath(ring) {
    return ring.map((point, index) => {
      const [x, y] = position(point);
      return `${index ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(' ') + ' Z';
  }

  function countryPath(geometry) {
    const polygons = geometry.type === 'MultiPolygon' ? geometry.coordinates : [geometry.coordinates];
    return polygons.flatMap(polygon => polygon.map(ringPath)).join(' ');
  }

  function updateBands() {
    const utcHour = new Date().getUTCHours();
    bands.forEach((band, index) => {
      const hour = (utcHour + index - 12 + 24) % 24;
      band.setAttribute('class', hour >= 7 && hour < 17 ? 'map-band map-band-day' :
        hour >= 17 && hour < 21 ? 'map-band map-band-evening' : 'map-band map-band-night');
    });
  }

  function addBands() {
    const layer = svgElement('g', { class: 'map-bands', 'aria-hidden': 'true' });
    for (let i = 0; i < 24; i++) {
      const band = svgElement('rect', { x: (i * bandWidth).toFixed(2), y: 0,
        width: bandWidth.toFixed(2), height: HEIGHT });
      layer.append(band);
      bands.push(band);
    }
    svg.append(layer);
    updateBands();

    const lines = svgElement('g', { class: 'map-zone-lines', 'aria-hidden': 'true' });
    for (let i = 0; i <= 24; i++) {
      const x = (i * bandWidth).toFixed(2);
      lines.append(svgElement('line', { x1: x, y1: 0, x2: x, y2: HEIGHT }));
      if (i < 24 && i % 3 === 0) {
        const offset = i - 12;
        const text = svgElement('text', { x: (i * bandWidth + 5).toFixed(2), y: 20 });
        text.textContent = `UTC${offset >= 0 ? '+' : ''}${offset}`;
        lines.append(text);
      }
    }
    svg.append(lines);
  }

  function selectCountry(name) {
    selectedName = name;
    countrySelect.value = name;
    for (const [country, path] of paths) path.classList.toggle('is-selected', country === name);
    const zones = zonesByCountry[name] || [];
    zoneSelect.replaceChildren();
    for (const zone of zones) {
      const option = document.createElement('option');
      option.value = zone;
      option.textContent = zone.replaceAll('_', ' ').replaceAll('/', ' / ');
      zoneSelect.append(option);
    }
    zoneSelect.disabled = !zones.length;
    place.textContent = name;
    updateTime();
  }

  function updateTime() {
    const zone = zoneSelect.value;
    if (!zone) return;
    const now = new Date();
    try {
      clock.textContent = new Intl.DateTimeFormat('en-GB', {
        timeZone: zone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      }).format(now);
      date.textContent = new Intl.DateTimeFormat('en-GB', {
        timeZone: zone, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        timeZoneName: 'short'
      }).format(now);
    } catch {
      clock.textContent = '--:--:--';
      date.textContent = 'Time unavailable for this zone';
    }
  }

  function renderMap(geo) {
    addBands();
    const countries = svgElement('g', { class: 'map-countries' });
    const names = [];
    for (const feature of geo.features) {
      const name = feature.properties.name;
      const path = svgElement('path', {
        d: countryPath(feature.geometry), tabindex: 0, role: 'button',
        'aria-label': `${name}, show local time`
      });
      const title = svgElement('title', {});
      title.textContent = name;
      path.append(title);
      path.addEventListener('click', () => selectCountry(name));
      path.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectCountry(name);
        }
      });
      countries.append(path);
      paths.set(name, path);
      names.push(name);
    }
    svg.append(countries);
    names.sort((a, b) => a.localeCompare(b));
    for (const name of names) {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      countrySelect.append(option);
    }
    selectCountry('United Kingdom');
  }

  countrySelect.addEventListener('change', () => {
    if (countrySelect.value) selectCountry(countrySelect.value);
  });
  zoneSelect.addEventListener('change', updateTime);

  Promise.all([
    fetch('assets/data/world-countries.geojson').then(response => {
      if (!response.ok) throw new Error('Map data unavailable');
      return response.json();
    }),
    fetch('assets/data/country-timezones.json').then(response => {
      if (!response.ok) throw new Error('Time zone data unavailable');
      return response.json();
    })
  ]).then(([geo, zones]) => {
    zonesByCountry = zones;
    renderMap(geo);
    setInterval(() => { updateTime(); updateBands(); }, 1000);
  }).catch(() => {
    place.textContent = 'Map unavailable';
    date.textContent = 'Please reload the page to try again.';
  });
})();
