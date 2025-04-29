import { useState, useEffect } from 'react';
import Fuse from 'fuse.js';

// Import components
import Header from './components/Header';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import SearchResults from './components/SearchResults';
import NoResults from './components/NoResults';

// Backend API URL and key
const API_URL = 'http://localhost:3001';
const API_KEY = import.meta.env.VITE_FIRECRAWL_API_KEY;

// Common headers for API requests
const API_HEADERS = {
  'Content-Type': 'application/json',
  'X-API-Key': API_KEY
};

function App() {
  // State management for app data and UI
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Finding fine & rare spirits...');
  const [spiritData, setSpiritData] = useState(null);
  const [error, setError] = useState(null);
  const [baxusMatches, setBaxusMatches] = useState(null);
  const [loadingStartTime, setLoadingStartTime] = useState(null);

  // Loading messages to display during data fetch
  const loadingMessages = [
    'Loading exclusive bottles...',
    'Gathering luxury collections...',
    'Searching for limited-edition bottles...',
    'Uncovering the finest distillations...'
  ];
  

  // Effect to handle rotating loading messages
  useEffect(() => {
    if (loading) {
      setLoadingStartTime(Date.now());
      // Only start rotating messages after 2 seconds of loading
      const initialDelay = setTimeout(() => {
        let messageIndex = 0;
        const interval = setInterval(() => {
          messageIndex = (messageIndex + 1) % loadingMessages.length;
          setLoadingMessage(loadingMessages[messageIndex]);
        }, 5000);

        return () => {
          clearInterval(interval);
          clearTimeout(initialDelay);
        };
      }, 2000);

      return () => clearTimeout(initialDelay);
    }
  }, [loading]);

  // Helper function to standardize bottle names for better matching
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

  // API call to fetch BAXUS listings
  const fetchBaxusListings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/baxus-listings`, {
        headers: API_HEADERS
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch BAXUS listings: HTTP ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      throw new Error(`Error fetching BAXUS listings: ${err.message}`);
    }
  };

  // API call to extract data from provided URL
  const extractDataFromUrl = async (url) => {
    const response = await fetch(`${API_URL}/api/extract`, {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      throw new Error(`Failed to extract data: HTTP ${response.status}`);
    }

    return response.json();
  };

  // Core matching logic using fuzzy search
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

  // Main function to handle data extraction and matching
  const extractSpiritData = async () => {
    try {
      setLoading(true);
      setError(null);
      setBaxusMatches(null);
      
      /** @type {chrome.tabs.Tab} */
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // Make both API calls in parallel
      const [scrapedData, baxusListings] = await Promise.all([
        extractDataFromUrl(tab.url),
        fetchBaxusListings()
      ]);

      setSpiritData(scrapedData);

      // Find matches once both API calls complete
      const matches = findMatchingListings(scrapedData, baxusListings);
      setBaxusMatches(matches);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Main app UI render
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

      <div className="mt-1 text-center">
        <a 
          href="https://honeybarrel.netlify.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-[#165256] text-xs font-['DM_Sans'] underline"
        >
          Privacy Policy
        </a>
      </div>
    </div>
  );
}

export default App;
