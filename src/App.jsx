import { useState } from 'react';
import FirecrawlApp from "@mendable/firecrawl-js";
import Fuse from 'fuse.js';

function App() {
  const [loading, setLoading] = useState(false);
  const [spiritData, setSpiritData] = useState(null);
  const [error, setError] = useState(null);
  const [baxusMatches, setBaxusMatches] = useState(null);

  const normalizeBottleName = (name) => {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')   // remove punctuation
      .replace(/\b(the|a|an)\b/g, '') // remove stopwords
      .replace(/\btwelve\b/g, '12')
      .replace(/\s+/g, ' ')          // normalize whitespace
      .trim();
  };

  const fetchBaxusListings = async () => {
    try {
      const response = await fetch('https://services.baxus.co/api/search/listings?from=0&size=1500&listed=true');
      if (!response.ok) {
        throw new Error('Failed to fetch BAXUS listings');
      }
      const data = await response.json();
      // Extract the _source field from each listing in the array
      return data.map(listing => listing._source);
    } catch (err) {
      throw new Error(`Error fetching BAXUS listings: ${err.message}`);
    }
  };

  const findMatchingListings = (scrapedData, baxusListings) => {
    if (!scrapedData || !scrapedData.name || !baxusListings) return [];

    const options = {
      keys: [
        {
          name: 'name',
          weight: 0.70
        },
        {
          name: 'attributes.Size',
          weight: 0.15
        },
        {
          name: 'price',
          weight: 0.10
        },
        {
          name: 'spiritType',
          weight: 0.05
        }
      ],
      threshold: 0.4,
      includeScore: true,
      minMatchCharLength: 3,
      shouldSort: true
    };

    const fuse = new Fuse(baxusListings, options);
    
    // Search using normalized scraped data
    const normalizedName = normalizeBottleName(scrapedData.name);
    const results = fuse.search(normalizedName);
    
    // Sort by match score and return top matches
    return results
      .map(result => ({
        ...result.item,
        matchScore: result.score
      }))
      .sort((a, b) => a.matchScore - b.matchScore)
      .slice(0, 5);
  };

  const extractSpiritData = async () => {
    try {
      setLoading(true);
      setError(null);
      setBaxusMatches(null);
      
      // Get the current tab URL
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Initialize Firecrawl with the API key from environment variable
      const app = new FirecrawlApp({
        apiKey: import.meta.env.VITE_FIRECRAWL_API_KEY
      });

      // Extract data using Firecrawl with detailed prompt
      const scrapeResult = await app.extract([tab.url], {
        prompt: `Extract spirit information from this page. Look for:

1. Name: The full name of the spirit/bottle. This could be in:
   - Product title
   - Heading (h1, h2)
   - Product name field
   - Meta title
   - Any prominent text that appears to be the bottle name

2. Price: The current price of the bottle. Look for:
   - Price tags
   - Currency symbols ($, €, £)
   - Numbers that appear to be prices
   - Sale prices
   - Regular prices
   - Any price-related text

3. Size: The bottle size/volume. Look for:
   - ml, cl, L measurements
   - Volume indicators
   - Size specifications
   - Common sizes like 700ml, 750ml, 1L

4. Type: The type of spirit. Look for:
   - Whisky/Whiskey
   - Bourbon
   - Scotch
   - Rum
   - Gin
   - Vodka
   - Tequila
   - Liqueur
   - Cognac
   - Brandy
   - Other spirit categories

Return the data in this exact JSON format:
{
  "name": "extracted name",
  "price": "extracted price",
  "size": "extracted size",
  "type": "extracted type"
}

If any field cannot be found, use "unknown" as the value.`
      });

      if (!scrapeResult.success) {
        throw new Error(`Failed to scrape: ${scrapeResult.error}`);
      }

      setSpiritData(scrapeResult.data);

      // Fetch and match with BAXUS listings
      const baxusListings = await fetchBaxusListings();
      const matches = findMatchingListings(scrapeResult.data, baxusListings);
      setBaxusMatches(matches);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-[400px] min-h-screen p-4 bg-[#f8f6f1]">
      <h1 className="text-xl font-bold mb-4 text-gray-800">Baxus Spirit Comparator</h1>
      
      <button
        onClick={extractSpiritData}
        disabled={loading}
        className="w-full bg-[#1c6d72] hover:bg-[#165256] text-white font-bold py-2 px-4 rounded disabled:opacity-50 mb-6"
      >
        {loading ? 'Extracting...' : 'Compare with Baxus'}
      </button>

      {error && (
        <div className="mt-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {spiritData && (
        <div className="mt-4 p-4 bg-white rounded shadow-sm">
          <h2 className="font-bold mb-2 text-gray-800">Extracted Data:</h2>
          <p><span className="font-semibold">Name:</span> {spiritData.name}</p>
          <p><span className="font-semibold">Price:</span> {spiritData.price}</p>
          <p><span className="font-semibold">Type:</span> {spiritData.type}</p>
          <p><span className="font-semibold">Size:</span> {spiritData.size}</p>
        </div>
      )}

      {baxusMatches && baxusMatches.length > 0 && (
        <div className="mt-6 space-y-4">
          <h2 className="font-bold text-gray-800">BAXUS Matches:</h2>
          {baxusMatches.map((match, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="aspect-w-1 aspect-h-1 w-full">
                <img 
                  src={match.imageUrl} 
                  alt={match.name}
                  className="w-full h-[300px] object-contain bg-white p-4"
                />
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-800 mb-2">{match.name}</h3>
                <p className="text-2xl font-bold text-gray-900 mb-3">${match.price}</p>
                <div className="space-y-1 text-sm text-gray-600 mb-4">
                  <p><span className="font-medium">Type:</span> {match.spiritType}</p>
                  <p><span className="font-medium">Size:</span> {match.attributes?.Size}</p>
                  <p className="text-xs text-gray-500">Match Score: {(1 - match.matchScore).toFixed(2)}</p>
                </div>
                <a 
                  href={`https://baxus.co/asset/${match.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-[#1c6d72] hover:bg-[#165256] text-white text-center font-bold py-2 px-4 rounded"
                >
                  Buy Now
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {baxusMatches && baxusMatches.length === 0 && (
        <div className="mt-4 p-4 bg-white rounded shadow-sm">
          <p className="text-gray-600">No matching listings found on BAXUS.</p>
        </div>
      )}
    </div>
  );
}

export default App;
