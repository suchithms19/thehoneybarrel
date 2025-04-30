# Honey Barrel Comparator

Honey Barrel Comparator is a Chrome Extension that helps users compare prices of spirits on various retail websites with listings available on the BAXUS marketplace.

## Technical Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Search Algorithm**: Fuse.js for fuzzy matching
- **API Integration**: REST API with custom headers
- **Backend**: Express.js with Firecrawl integration

## Matching Algorithm

The application uses a sophisticated matching algorithm powered by Fuse.js with the following features:

1. **Name Normalization**:
   - Removes punctuation
   - Converts to lowercase
   - Removes stop words (the, a, an)
   - Standardizes number formats (e.g., "twelve" to "12")
   - Normalizes whitespace
   - Trims leading and trailing spaces

2. **Weighted Multi-Field Search**:
   - Name (weight: 0.8)
   - Size (weight: 0.1)
   - Price (weight: 0.05)
   - Spirit Type (weight: 0.05)
   - ABV (weight: 0.1)

3. **Match Configuration**:
   - Threshold: 0.5 (balance between precision and recall)
   - Minimum match length: 3 characters
   - Includes match scoring for result ranking
   - Returns top 5 matches sorted by match score

## Frontend Performance Features

1. **Parallel API Calls**:
   ```javascript
   const [scrapedData, baxusListings] = await Promise.all([
     extractDataFromUrl(tab.url),
     fetchBaxusListings()
   ]);
   ```

2. **Loading State Management**:
   - Rotating loading messages
   - Error handling for failed requests
   - Loading spinner for visual feedback

## Backend Setup

The backend server is built with Express.js and provides two main endpoints for spirit data extraction and BAXUS listings.

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firecrawl API key
- BAXUS API access

### Backend Dependencies

```json
{
  "express": "^4.18.3",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "@mendable/firecrawl-js": "^1.24.0",
  "express-rate-limit": "^7.1.5",
  "compression": "^1.7.4"
}
```

### Setting Up the Backend

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the server directory:
   ```env
   PORT=3001
   API_KEY=your_api_key_here
   FIRECRAWL_API_KEY=your_firecrawl_api_key
   ```

4. Start the server:
   - For development (with auto-reload):
     ```bash
     npm run dev
     ```
   - For production:
     ```bash
     npm start
     ```

### Backend Features

1. **API Endpoints**:
   - `GET /api/baxus-listings`: Fetch BAXUS marketplace listings
   - `POST /api/extract`: Extract spirit data from retail websites
   - `GET /health`: Health check endpoint

2. **Performance Optimizations**:
   - Response compression
   - 10-minute caching for BAXUS listings
   - Rate limiting (100 requests per 15 minutes)

3. **Security Features**:
   - API key authentication
   - CORS protection
   - Rate limiting
   - Input validation

4. **Error Handling**:
   - Invalid API keys
   - Rate limit exceeded
   - Malformed requests
   - Failed extractions
   - Network errors

### Running the Full Stack

1. Start the backend server:
   ```bash
   cd server
   npm run dev
   ```

2. Build the Chrome extension:
   ```bash
   cd ..  # Return to root directory
   npm run build
   ```

### Loading the Chrome Extension

After building the extension, follow these steps to load it in Chrome:

1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle switch in top right)
4. Click "Load unpacked"
5. Navigate to your project's `dist` directory and select it
   ```
   path/to/project/dist
   ```

The extension should now appear in your Chrome toolbar. To use it:

1. Make sure the backend server is running (`npm run dev` in server directory)
2. Visit any supported spirit retail website
3. Click the extension icon in your Chrome toolbar
4. Click "Find on Baxus" to compare prices

### Development Tips

- After making changes to the extension code:
  1. Run `npm run build` again
  2. Go to `chrome://extensions/`
  3. Click the refresh icon on your extension card

- To view extension logs:
  1. Right-click the extension icon
  2. Click "Inspect popup"
  3. View the console for logs and debugging

- If the extension isn't working:
  1. Check that the backend server is running on port 3001
  2. Verify your API keys in both frontend and backend `.env` files
  3. Check the browser console for any error messages
  4. Ensure you're on a supported retail website

### Supported Retail Websites

The extension currently works on all spirit retail websites. The Firecrawl extraction service automatically detects and extracts product information from supported sites.

