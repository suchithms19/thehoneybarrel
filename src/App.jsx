import { useState, useEffect } from 'react';
import FirecrawlApp from "@mendable/firecrawl-js";
import Fuse from 'fuse.js';
import { extractionPrompt } from './utils/extractionPrompt';

// Import components
import Header from './components/Header';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import SearchResults from './components/SearchResults';
import NoResults from './components/NoResults';

function App() {
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Finding fine & rare spirits...');
  const [spiritData, setSpiritData] = useState(null);
  const [error, setError] = useState(null);
  const [baxusMatches, setBaxusMatches] = useState(null);

  const loadingMessages = [
    'Loading exclusive bottles...',
    'Finding rare spirits...',
    'Gathering luxury collections...',
    'Searching for limited-edition bottles...',
    'Uncovering the finest distillations...'
  ];
  

  useEffect(() => {
    if (loading) {
      let messageIndex = 0;
      const interval = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[messageIndex]);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [loading]);

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
      threshold: 0.5,
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
        prompt: extractionPrompt
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
      <Header showDescription={!loading && !spiritData} />
      
      {loading && <LoadingSpinner loadingMessage={loadingMessage} />}

      {!loading && !spiritData && (
        <button
          onClick={extractSpiritData}
          className="w-full bg-[#1c6d72] hover:bg-[#165256] text-white font-bold py-1 px-4 rounded disabled:opacity-50 mb-4"
        >
          Find on Baxus
        </button>
      )}

      {error && <ErrorMessage message={error} />}

      {!loading && baxusMatches && baxusMatches.length > 0 && (
        <SearchResults matches={baxusMatches} spiritData={spiritData} />
      )}

      {!loading && baxusMatches && baxusMatches.length === 0 && <NoResults />}
    </div>
  );
}

export default App;
