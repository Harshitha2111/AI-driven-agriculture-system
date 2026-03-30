# AgriMarket Intelligence AI

A professional AI-driven agricultural market intelligence platform with a chat-based interface.

## Features
- **Cascading Selection**: Step-by-step selection of State, District, Market, Commodity Group, Commodity, and Year.
- **Real-time Data**: Displays arrival quantities and price ranges (Min, Modal, Max).
- **AI Price Prediction**: Predicts future modal prices based on historical data and market trends.
- **Conversational UI**: Guided experience with auto-scrolling chat interface.

## How to Run Locally

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation
1. Clone or download the project files.
2. Open your terminal in the project root directory.
3. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application
1. Start the development server:
   ```bash
   npm run dev
   ```
2. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Data Source
The application loads data from `data.xlsx`. If the file is missing, it automatically creates a sample dataset with Karnataka market information.

## API Endpoints
- `GET /api/options`: Returns cascading selection options.
- `GET /api/result`: Returns detailed market data for the selected criteria.
- `GET /api/predict`: Returns AI-generated price predictions.
