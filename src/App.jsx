import { useState } from 'react';
import FirecrawlApp from "@mendable/firecrawl-js";

function App() {
  const [loading, setLoading] = useState(false);
  const [spiritData, setSpiritData] = useState(null);
  const [error, setError] = useState(null);

  const extractSpiritData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the current tab URL
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Initialize Firecrawl with the API key from environment variable
      const app = new FirecrawlApp({
        apiKey: import.meta.env.VITE_FIRECRAWL_API_KEY
      });

      // Extract data using Firecrawl
      const scrapeResult = await app.extract([tab.url], {
        prompt: "Extract the spirit name, price, and type (if available) from this page. Return in JSON format with these fields: name, price, and type."
      });

      if (!scrapeResult.success) {
        throw new Error(`Failed to scrape: ${scrapeResult.error}`);
      }

      setSpiritData(scrapeResult.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-80 p-4 bg-white">
      <h1 className="text-xl font-bold mb-4">Baxus Spirit Comparator</h1>
      
      <button
        onClick={extractSpiritData}
        disabled={loading}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
      >
        {loading ? 'Extracting...' : 'Compare with Baxus'}
      </button>

      {error && (
        <div className="mt-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {spiritData && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <h2 className="font-bold mb-2">Extracted Data:</h2>
          <p><span className="font-semibold">Name:</span> {spiritData.name}</p>
          <p><span className="font-semibold">Price:</span> {spiritData.price}</p>
          {spiritData.type && (
            <p><span className="font-semibold">Type:</span> {spiritData.type}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
