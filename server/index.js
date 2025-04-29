import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import FirecrawlApp from "@mendable/firecrawl-js";
import { extractionPrompt } from './extractionPrompt.js';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
dotenv.config();

// Initialize Express application
const app = express();
const port = process.env.PORT || 3001;
const API_KEY = process.env.API_KEY;

// Cache configuration
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes 
let baxusListingsCache = {
  data: null,
  timestamp: null
};

// Configure rate limiter: maximum 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, 
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// API Key authentication middleware
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }
  
  next();
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(compression()); // Enable compression
app.use(limiter);

// Initialize Firecrawl with API key from environment variables
const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY
});

/**
 * Fetch fresh BAXUS listings from the API
 * @returns {Promise<Array>} Array of BAXUS listings
 */
const fetchFreshBaxusListings = async () => {
  const response = await fetch('https://services.baxus.co/api/search/listings?from=0&size=1500&listed=true');
  if (!response.ok) {
    throw new Error(`Failed to fetch BAXUS listings: HTTP ${response.status}`);
  }
  const data = await response.json();
  return data.map(listing => listing._source);
};

/**
 * Get BAXUS listings with caching
 * @returns {Promise<Array>} Array of BAXUS listings
 */
const getCachedBaxusListings = async () => {
  const now = Date.now();
  
  // Return cached data if it exists and hasn't expired
  if (baxusListingsCache.data && baxusListingsCache.timestamp && 
      (now - baxusListingsCache.timestamp) < CACHE_DURATION) {
    return baxusListingsCache.data;
  }

  // Fetch fresh data if cache is expired or doesn't exist
  const freshData = await fetchFreshBaxusListings();
  
  // Update cache
  baxusListingsCache = {
    data: freshData,
    timestamp: now
  };

  return freshData;
};

/**
 * @route GET /api/baxus-listings
 * @desc Fetch BAXUS listings from their API with caching
 * @access Private
 * @returns {Array} List of BAXUS listings
 */
app.get('/api/baxus-listings', authenticateApiKey, async (_req, res) => {
  try {
    const listings = await getCachedBaxusListings();
    res.json(listings);
  } catch (error) {
    console.error('Error fetching BAXUS listings:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/extract
 * @desc Extract data from a given URL using Firecrawl
 * @access Private
 * @param {string} url - The URL to extract data from
 * @returns {Object} Extracted data from the URL
 */
app.post('/api/extract', authenticateApiKey, async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const scrapeResult = await firecrawl.extract([url], {
      prompt: extractionPrompt
    });

    if (!scrapeResult.success) {
      throw new Error(`Failed to scrape: ${scrapeResult.error}`);
    }

    res.json(scrapeResult.data);
  } catch (error) {
    console.error('Error in Firecrawl extraction:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /health
 * @desc Health check endpoint for monitoring
 * @access Public
 * @returns {Object} Server status
 */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});