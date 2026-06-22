// Shared geo SEO/GEO configuration.
// Imported by both the React GeoKeywordPage component and scripts/generate-seo.mjs
// so the live pages and the generated sitemaps always stay in sync.

export const SITE_URL = "https://pdfshuffl.com";

// PDF tool actions used to build geo-targeted long-tail keyword pages.
// Keep phrases free of the standalone word "in" so slug parsing stays unambiguous.
export const geoTools = [
  "PDF Converter",
  "Convert PDF to Word",
  "Convert Word to PDF",
  "Convert PDF to Excel",
  "Convert Excel to PDF",
  "Convert PDF to JPG",
  "Convert JPG to PDF",
  "Convert PDF to PNG",
  "Convert PDF to PowerPoint",
  "Convert PowerPoint to PDF",
  "Compress PDF",
  "Merge PDF",
  "Split PDF",
  "Edit PDF",
  "Sign PDF",
  "Rotate PDF",
  "Crop PDF",
  "Unlock PDF",
  "Protect PDF",
  "PDF to Text",
  "Text to PDF",
  "PDF to HTML",
  "HTML to PDF",
  "PDF to CSV",
  "CSV to PDF",
  "Scan to PDF",
  "Fill PDF Forms",
  "Annotate PDF",
  "Add Watermark to PDF",
  "Remove Watermark from PDF",
  "Delete PDF Pages",
  "Reorder PDF Pages",
  "Extract PDF Pages",
  "OCR PDF",
  "Flatten PDF",
  "Reduce PDF Size",
  "Combine PDF Files",
  "PDF to Editable PDF",
  "ODT to PDF",
  "ODS to PDF",
  "ODP to PDF",
  "PDF to ODT",
  "eSign PDF",
  "Redact PDF",
  "Number PDF Pages",
  "Convert Scanned PDF",
  "PDF Page Organizer",
  "Make PDF Searchable",
  "PDF Form Filler",
  "Online PDF Editor",
];

// 250 locations (countries + major world cities).
export const geoLocations = [
  "United States", "United Kingdom", "Canada", "Australia", "India", "Germany",
  "France", "Spain", "Italy", "Netherlands", "Belgium", "Switzerland", "Austria",
  "Sweden", "Norway", "Denmark", "Finland", "Ireland", "Portugal", "Poland",
  "Greece", "Turkey", "Russia", "Ukraine", "Romania", "Hungary", "Czechia",
  "Slovakia", "Bulgaria", "Croatia", "Serbia", "Brazil", "Mexico", "Argentina",
  "Chile", "Colombia", "Peru", "Venezuela", "Ecuador", "Uruguay", "Japan",
  "China", "South Korea", "Singapore", "Malaysia", "Indonesia", "Thailand",
  "Vietnam", "Philippines", "Pakistan", "Bangladesh", "Sri Lanka", "Nepal",
  "Saudi Arabia", "United Arab Emirates", "Qatar", "Kuwait", "Bahrain", "Oman",
  "Israel", "Jordan", "Lebanon", "Egypt", "Morocco", "Algeria", "Tunisia",
  "Nigeria", "Kenya", "Ghana", "South Africa", "Ethiopia", "Tanzania", "Uganda",
  "New Zealand", "Iceland", "Luxembourg", "Estonia", "Latvia", "Lithuania",
  "Slovenia",
  "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia",
  "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville",
  "San Francisco", "Seattle", "Denver", "Boston", "Washington", "Las Vegas",
  "Miami", "Atlanta", "Sacramento", "Portland", "Detroit", "Minneapolis",
  "Charlotte", "Columbus", "Indianapolis", "Nashville", "Memphis", "Baltimore",
  "Milwaukee", "Tampa", "Orlando", "Pittsburgh", "Cincinnati",
  "London", "Manchester", "Birmingham", "Liverpool", "Leeds", "Glasgow",
  "Edinburgh", "Bristol", "Toronto", "Montreal", "Vancouver", "Calgary",
  "Ottawa", "Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Auckland",
  "Wellington", "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai",
  "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Surat", "Berlin", "Munich",
  "Hamburg", "Frankfurt", "Cologne", "Stuttgart", "Paris", "Marseille", "Lyon",
  "Toulouse", "Nice", "Madrid", "Barcelona", "Valencia", "Seville", "Rome",
  "Milan", "Naples", "Turin", "Amsterdam", "Rotterdam", "Brussels", "Zurich",
  "Geneva", "Vienna", "Stockholm", "Oslo", "Copenhagen", "Helsinki", "Dublin",
  "Lisbon", "Warsaw", "Krakow", "Athens", "Istanbul", "Ankara", "Moscow",
  "Saint Petersburg", "Kyiv", "Bucharest", "Budapest", "Prague", "Sao Paulo",
  "Rio de Janeiro", "Brasilia", "Mexico City", "Guadalajara", "Monterrey",
  "Buenos Aires", "Santiago", "Bogota", "Lima", "Tokyo", "Osaka", "Yokohama",
  "Nagoya", "Beijing", "Shanghai", "Shenzhen", "Guangzhou", "Seoul", "Busan",
  "Kuala Lumpur", "Jakarta", "Surabaya", "Bangkok", "Hanoi",
  "Ho Chi Minh City", "Manila", "Cebu", "Karachi", "Lahore", "Islamabad",
  "Dhaka", "Colombo", "Kathmandu", "Riyadh", "Jeddah", "Dubai", "Abu Dhabi",
  "Doha", "Kuwait City", "Manama", "Muscat", "Tel Aviv", "Jerusalem", "Amman",
  "Beirut", "Cairo", "Alexandria", "Casablanca", "Rabat", "Algiers", "Tunis",
  "Lagos", "Abuja", "Nairobi", "Accra", "Johannesburg", "Cape Town", "Durban",
  "Pretoria", "Addis Ababa", "Dar es Salaam", "Kampala",
];

// Intent modifiers appended to each tool + location combination.
export const geoModifiers = [
  "online",
  "free",
  "for free",
  "online free",
  "for students",
  "for business",
  "for lawyers",
  "for teachers",
  "without signup",
  "no watermark",
  "securely",
  "fast",
  "in seconds",
  "on mobile",
  "for windows",
  "for mac",
  "high quality",
  "2026",
  "bulk",
  "best tool",
];

// Cap so the geo set always fills exactly sitemaps 7-11 (5 x 50,000).
export const GEO_MAX = 250000;
export const GEO_SITEMAP_START = 7;
export const URLS_PER_SITEMAP = 50000;

export function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function titleCase(value) {
  return String(value)
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function buildGeoKeyword(tool, location, modifier) {
  return `${tool} in ${location} ${modifier}`;
}

export function buildGeoSlug(tool, location, modifier) {
  return slugify(buildGeoKeyword(tool, location, modifier));
}

// Lazily-built lookup maps (slug -> original phrase) for fast slug parsing.
let toolMap = null;
let locationMap = null;
let modifierMap = null;

function ensureMaps() {
  if (toolMap) return;
  toolMap = new Map(geoTools.map((t) => [slugify(t), t]));
  locationMap = new Map(geoLocations.map((l) => [slugify(l), l]));
  modifierMap = new Map(geoModifiers.map((m) => [slugify(m), m]));
}

// Parse a geo slug back into its tool / location / modifier parts.
// Returns null when the slug is not a valid geo combination.
export function parseGeoSlug(slug) {
  ensureMaps();
  if (!slug) return null;

  // Find the tool by matching "<toolSlug>-in-" prefix, preferring the longest.
  let tool = null;
  let toolSlug = "";
  for (const [tSlug, tName] of toolMap) {
    const prefix = `${tSlug}-in-`;
    if (slug.startsWith(prefix) && tSlug.length > toolSlug.length) {
      tool = tName;
      toolSlug = tSlug;
    }
  }
  if (!tool) return null;

  const rest = slug.slice(toolSlug.length + 4); // strip "<toolSlug>-in-"

  // Find the modifier by matching the longest "-<modifierSlug>" suffix.
  let modifier = null;
  let modifierSlug = "";
  for (const [mSlug, mName] of modifierMap) {
    if (
      (rest === mSlug || rest.endsWith(`-${mSlug}`)) &&
      mSlug.length > modifierSlug.length
    ) {
      modifier = mName;
      modifierSlug = mSlug;
    }
  }
  if (!modifier) return null;

  const locationSlug =
    rest === modifierSlug ? "" : rest.slice(0, rest.length - modifierSlug.length - 1);
  const location = locationMap.get(locationSlug);
  if (!location) return null;

  return {
    tool,
    location,
    modifier,
    keyword: buildGeoKeyword(tool, location, modifier),
    slug,
  };
}

// Build related geo links: same tool in other locations + same location with other tools.
export function relatedGeoLinks(tool, location, modifier, limit = 10) {
  const links = [];
  const half = Math.ceil(limit / 2);

  for (const l of geoLocations) {
    if (l === location) continue;
    links.push({
      keyword: buildGeoKeyword(tool, l, modifier),
      slug: buildGeoSlug(tool, l, modifier),
    });
    if (links.length >= half) break;
  }

  for (const t of geoTools) {
    if (t === tool) continue;
    links.push({
      keyword: buildGeoKeyword(t, location, modifier),
      slug: buildGeoSlug(t, location, modifier),
    });
    if (links.length >= limit) break;
  }

  return links.slice(0, limit);
}

// Generator helper: yields every geo entry up to GEO_MAX in stable order.
export function* iterateGeoEntries(max = GEO_MAX) {
  let count = 0;
  for (const tool of geoTools) {
    for (const location of geoLocations) {
      for (const modifier of geoModifiers) {
        if (count >= max) return;
        yield {
          tool,
          location,
          modifier,
          slug: buildGeoSlug(tool, location, modifier),
        };
        count++;
      }
    }
  }
}
