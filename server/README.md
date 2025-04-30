# Server Setup Guide

This is the backend server for the Honey Barrel chrome extension. Follow these steps to set up and run the server locally.

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

## Installation

1. Clone the repository
2. Navigate to the server directory:
   ```bash
   cd server
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Environment Setup

1. Create a `.env` file in the server directory
2. Add the following environment variables to your `.env` file:
   ```
   # Server Configuration
   PORT=3001

   # API Authentication
   # Replace with your own secure API key (32+ characters)
   # Examples:
   # API_KEY=ef9fda3b87c6b7b9e13fc124e5b5c9d1a0b9b55c417445b1a0599a9ac23b5eb7
   API_KEY=your_secure_api_key_here

   # Firecrawl Configuration
   FIRECRAWL_API_KEY=your_firecrawl_api_key_here
   ```

## Running the Server

### Development Mode
```bash
npm run dev
```
This will start the server with nodemon for development (auto-reloads on file changes).

### Production Mode
```bash
npm start
```
This will start the server in production mode.

## Available Scripts

- `npm start`: Runs the server in production mode
- `npm run dev`: Runs the server in development mode with nodemon

## Dependencies

- express: Web framework
- cors: Cross-Origin Resource Sharing middleware
- dotenv: Environment variable management
- @mendable/firecrawl-js: Mendable API integration
- express-rate-limit: Rate limiting middleware
- compression: Response compression middleware
- nodemon (dev): Development auto-reloader

## Notes

- Make sure to never commit your `.env` file
- The server runs on port 3001 by default, but this can be configured through the PORT environment variable
- Rate limiting is enabled to protect the API from abuse

