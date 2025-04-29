# BAXUS Spirit Finder

A React-based Chrome extension for finding and matching spirits on BAXUS.

## Setup

### Frontend Setup

1. Clone the repository
2. In the root directory, Install dependencies:
```bash
npm install
```
3. Copy `.env.example` to `.env` and add your API key:
```bash
cp .env.example .env
```
4. Build the extension:
```bash
npm run build
```

### Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `dist` folder from your build

### Backend Setup

1. Navigate to the backend directory
2. Install backend dependencies:
```bash
npm install
```
3. Start the backend server:
```bash
npm run dev
```

The backend runs on `http://localhost:3001` by default. If you need to change the port:

1. Update the port in your backend configuration
2. Update `API_URL` in `src/App.jsx` to match your new port:
```javascript
const API_URL = 'http://localhost:YOUR_PORT';
```
3. Rebuild the extension:
```bash
npm run build
```
4. Reload the extension in Chrome

## Environment Variables

- `VITE_FIRECRAWL_API_KEY`: Your API key for accessing the BAXUS API

