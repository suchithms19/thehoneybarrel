import { useState } from 'react';
import FirecrawlApp from "@mendable/firecrawl-js";
import Fuse from 'fuse.js';
import logo from '/logo.svg';
import loadingGif from '/loading.gif';

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
          weight: 0.8
        },
        {
          name: 'attributes.Size',
          weight: 0.1
        },
        {
          name: 'price',
          weight: 0.05
        },
        {
          name: 'spiritType',
          weight: 0.05
        },
        {
          name: 'attributes.ABV',
          weight: 0.1
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
      .slice(0, 3);
  };

  const calculateSavings = (scrapedPrice, baxusPrice) => {
    const scraped = parseFloat(scrapedPrice.replace(/[^0-9.]/g, ''));
    const baxus = parseFloat(baxusPrice);
    if (isNaN(scraped) || isNaN(baxus)) return null;
    return scraped - baxus;
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

5. ABV: The alcohol by volume percentage. Look for:
   - % ABV
   - Alcohol percentage
   - Proof (divide by 2 to get ABV)
   - Numbers followed by % that appear to be alcohol content

Return the data in this exact JSON format:
{
  "name": "extracted name",
  "price": "extracted price",
  "size": "extracted size",
  "type": "extracted type",
  "abv": "extracted abv"
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
    <div className="w-[400px] min-h-screen p-6 bg-[#f8f6f1]">
      <div className="flex justify-center mb-6 ">
        <img src={logo} alt="Baxus Logo" className="h-4" />
      </div>
      
      <button
        onClick={extractSpiritData}
        disabled={loading}
        className="w-full bg-[#1c6d72] hover:bg-[#165256] text-white font-bold py-2 px-4 rounded disabled:opacity-50 mb-6"
      >
        {loading ? 'Extracting...' : 'Compare with Baxus'}
      </button>

      {loading && (
        <div className="flex justify-center my-8">
          <img src={loadingGif} alt="Loading..." className="w-[200px] h-[200px]" />
        </div>
      )}

      {error && (
        <div className="mt-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {!loading && spiritData && (
        <div className="mt-4 p-4 bg-white rounded shadow-sm">
          <h2 className="font-bold mb-2 text-gray-800">Extracted Data:</h2>
          <p><span className="font-semibold">Name:</span> {spiritData.name}</p>
          <p><span className="font-semibold">Price:</span> {spiritData.price}</p>
          <p><span className="font-semibold">Type:</span> {spiritData.type}</p>
          <p><span className="font-semibold">Size:</span> {spiritData.size}</p>
          <p><span className="font-semibold">ABV:</span> {spiritData.abv}</p>
        </div>
      )}

      {!loading && baxusMatches && baxusMatches.length > 0 && (
        <div className="mt-6 space-y-4">
          {baxusMatches.map((match, index) => {
            const savings = calculateSavings(spiritData.price, match.price);
            return (
              <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden p-4">
                <div className="flex items-start space-x-4">
                  <div className="w-1/3">
                    <img 
                      src={match.imageUrl} 
                      alt={match.name}
                      className="w-full h-[140px] object-contain bg-white"
                    />
                  </div>
                  <div className="w-2/3">
                    <h3 className="font-['DM_Serif_Text'] text-lg text-gray-800">{match.name}</h3>
                    <div className="text-[10px] text-gray-600 mb-1">
                      {match.spiritType} | {match.attributes?.Size}{match.attributes?.ABV && ` | ${match.attributes?.ABV * 2} Proof`}
                    </div>
                    <div className="font-['DM_Sans']">
                      <div className="flex items-baseline gap-2">
                        <p className="text-xl font-bold text-gray-900">${match.price}</p>
                        {savings > 0 && (
                          <span className="text-lg text-green-600">Save ${savings.toFixed(2)}</span>
                        )}
                      </div>
                      <div className="mt-3">
                        <a 
                          href={`https://baxus.co/asset/${match.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full bg-[#1c6d72] hover:bg-[#165256] text-white text-center font-bold py-2 px-4 rounded text-sm"
                        >
                          Buy Now
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && baxusMatches && baxusMatches.length === 0 && (
        <div className="mt-4 p-4 bg-white rounded shadow-sm">
          <p className="text-gray-600">No matching listings found on BAXUS.</p>
        </div>
      )}
    </div>
  );
}

export default App;
