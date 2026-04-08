import os
from fastapi import FastAPI, Request
import requests
from dotenv import load_dotenv
import pathlib
app = FastAPI()
load_dotenv(dotenv_path=pathlib.Path(__file__).parent.parent / ".env")

from pydantic import BaseModel
# --- Input Models for POST endpoints ---
class MarketAnalysisInput(BaseModel):
    commodity: str
    market: str

class PricePredictionInput(BaseModel):
    commodity: str
    market: str

class WeatherAdvisoryInput(BaseModel):
    location: str
    date: str

class CropInfoInput(BaseModel):
    crop: str
# POST: Market Analysis

import pandas as pd
import numpy as np


# Load commodity price dataset
DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "commodity_price.csv")
df_price = pd.read_csv(DATA_PATH)

# Clean up column names for easier access
df_price.columns = [c.strip().replace(" ", "_").replace("-", "_").replace("(", "").replace(")", "") for c in df_price.columns]

# Get available commodities and markets
available_commodities = sorted(df_price['Commodity'].dropna().unique())
available_markets = sorted(df_price['Market'].dropna().unique())
available_states = sorted(df_price['State'].dropna().unique())
available_districts = sorted(df_price['District'].dropna().unique())

# ML model for price prediction (train on Modal_Price)
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

# Prepare features: Commodity, Market, State, Variety, Date (as ordinal)
df_model = df_price.dropna(subset=["Commodity", "Market", "Modal_x0020_Price"])
le_commodity = LabelEncoder()
le_market = LabelEncoder()
le_state = LabelEncoder()
le_variety = LabelEncoder()
le_district = LabelEncoder()
df_model = df_model.copy()
df_model["Commodity_enc"] = le_commodity.fit_transform(df_model["Commodity"].astype(str))
df_model["Market_enc"] = le_market.fit_transform(df_model["Market"].astype(str))
df_model["State_enc"] = le_state.fit_transform(df_model["State"].astype(str))
df_model["Variety_enc"] = le_variety.fit_transform(df_model["Variety"].astype(str))
df_model["District_enc"] = le_district.fit_transform(df_model["District"].astype(str))
import datetime
def parse_date(d):
    try:
        return datetime.datetime.strptime(str(d), "%d/%m/%Y").toordinal()
    except:
        return 0
df_model["Date_ordinal"] = df_model["Arrival_Date"].apply(parse_date)
X = df_model[["Commodity_enc", "Market_enc", "State_enc", "Variety_enc", "District_enc", "Date_ordinal"]]
y = df_model["Modal_x0020_Price"]
model = RandomForestRegressor(n_estimators=50, random_state=42)
model.fit(X, y)

# Endpoint to get area-wise commodities, districts, and markets
@app.get("/api/area-commodities")
def get_area_commodities(state: str = None, district: str = None, market: str = None):
    df = df_price.copy()
    if state:
        df = df[df['State'] == state]
    districts = sorted(df['District'].dropna().unique())
    if district:
        df = df[df['District'] == district]
    markets = sorted(df['Market'].dropna().unique())
    if market:
        df = df[df['Market'] == market]
    commodities = sorted(df['Commodity'].dropna().unique())
    return {"commodities": commodities, "districts": districts, "markets": markets}

@app.post("/api/market-analysis")
async def market_analysis_post(input: MarketAnalysisInput):
    # Filter by commodity and market
    df = df_price[(df_price['Commodity'] == input.commodity) & (df_price['Market'] == input.market)]
    if df.empty:
        return {"analysis": f"No data available for {input.commodity} in {input.market}."}
    min_price = df['Min_x0020_Price'].mean()
    max_price = df['Max_x0020_Price'].mean()
    modal_price = df['Modal_x0020_Price'].mean()
    count = len(df)
    analysis = (
        f"Market analysis for {input.commodity} in {input.market}: "
        f"Avg Min Price ₹{min_price:.0f}, Avg Max Price ₹{max_price:.0f}, Avg Modal Price ₹{modal_price:.0f} (per quintal)"
    )
    return {"analysis": analysis}

# Endpoint to get available commodities and markets
@app.get("/api/available-areas")
def get_areas():
    return {
        "commodities": available_commodities,
        "markets": available_markets,
        "states": available_states,
        "districts": available_districts
    }

# POST: Price Prediction
@app.post("/api/price-prediction")
async def price_prediction_post(input: PricePredictionInput):
    # Encode features for prediction
    try:
        c = input.commodity
        m = input.market
        df_row = df_price[(df_price['Commodity'] == c) & (df_price['Market'] == m)]
        if df_row.empty:
            return {"prediction": f"No data available for {c} in {m}."}
        # Use first matching row for encoding
        state = df_row.iloc[0]['State']
        variety = df_row.iloc[0]['Variety']
        district = df_row.iloc[0]['District']
        date_ord = 0
        X_pred = np.array([
            le_commodity.transform([c])[0],
            le_market.transform([m])[0],
            le_state.transform([state])[0],
            le_variety.transform([variety])[0],
            le_district.transform([district])[0],
            date_ord
        ]).reshape(1, -1)
        pred_price = model.predict(X_pred)[0]
        return {"prediction": f"Predicted modal price for {c} in {m}: ₹{int(pred_price)}/quintal."}
    except Exception as e:
        return {"prediction": f"Prediction error: {str(e)}"}

# POST: Weather Advisory (real data)
@app.post("/api/weather-advisory")
async def weather_advisory_post(input: WeatherAdvisoryInput):
    """
    Fetch tomorrow's weather forecast for the given location using OpenWeatherMap API.
    input.location: city name (e.g., 'London,uk' or 'Hyderabad,IN')
    input.date: not used (always returns tomorrow)
    """
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        return {"advisory": "API key not set on server."}
    # Get city coordinates
    geo_url = f"http://api.openweathermap.org/geo/1.0/direct"
    geo_params = {"q": input.location, "limit": 1, "appid": api_key}
    try:
        geo_resp = requests.get(geo_url, params=geo_params, timeout=10)
        geo_resp.raise_for_status()
        geo_data = geo_resp.json()
        if not geo_data:
            return {"advisory": f"Location '{input.location}' not found."}
        lat = geo_data[0]["lat"]
        lon = geo_data[0]["lon"]
        # Use 5-day/3-hour forecast API
        url = f"https://api.openweathermap.org/data/2.5/forecast"
        params = {
            "lat": lat,
            "lon": lon,
            "appid": api_key,
            "units": "metric"
        }
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        from datetime import datetime, timedelta
        # Parse the requested date from input (format: YYYY-MM-DD)
        try:
            req_date = datetime.strptime(input.date, "%Y-%m-%d")
        except Exception:
            return {"advisory": "Invalid date format. Use YYYY-MM-DD."}
        # Find the forecast closest to requested date at 12:00:00
        target_time = datetime(req_date.year, req_date.month, req_date.day, 12, 0, 0)
        closest = None
        min_diff = timedelta(days=6)
        for entry in data.get("list", []):
            dt = datetime.utcfromtimestamp(entry["dt"])
            diff = abs(dt - target_time)
            if diff < min_diff:
                min_diff = diff
                closest = entry
        if not closest or min_diff > timedelta(days=1):
            return {"advisory": f"Weather data unavailable for {input.date}. (Only next 5 days supported)"}
        desc = closest["weather"][0]["description"].capitalize()
        temp = closest["main"]["temp"]
        rain = closest.get("rain", {}).get("3h", 0)
        dt_txt = closest["dt_txt"]
        msg = f"Forecast for {input.location} on {dt_txt}: {desc}, Temp: {temp}°C, Rain: {rain}mm."
        return {"advisory": msg}
    except requests.Timeout:
        return {"advisory": "Weather service timed out. Please try again later."}
    except requests.RequestException as e:
        return {"advisory": f"Weather service error: {str(e)}"}
    except Exception as e:
        return {"advisory": f"Unexpected error: {str(e)}"}

# POST: Crop Info
@app.post("/api/crop-info")
async def crop_info_post(input: CropInfoInput):
    # Example: return a simple info string
    return {"info": f"Info for {input.crop}: High yield, moderate water requirement."}
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
# Crop Recommendation Input Model
class CropRecInput(BaseModel):
    soilType: str
    rainfall: str
    temperature: str

from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
import os
import joblib
import numpy as np


# Load ML models
MODEL_CROP_REC_PATH = os.path.join(os.path.dirname(__file__), "models", "crop_recommendation.pkl")
crop_rec_model = joblib.load(MODEL_CROP_REC_PATH)

# Allow CORS for frontend dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb+srv://bingumallagreeshmitha_db_user:Blg270206@mongo-cluster.mm65oeb.mongodb.net/agri_db")
client = MongoClient(MONGO_URL)
db = client["agri_db"]
@app.get("/api/health")
def health():
    return {"status": "ok"}


# --- MongoDB-based endpoints ---
@app.get("/api/market-analysis")
def market_analysis():
    data = list(db.market_analysis.find({}, {"_id": 0}))
    return {"data": data}

@app.get("/api/price-prediction")
def price_prediction():
    data = list(db.price_prediction.find({}, {"_id": 0}))
    return {"data": data}


# GET: List all recommendations (existing)
@app.get("/api/crop-recommendation")
def crop_recommendation():
    data = list(db.crop_recommendation.find({}, {"_id": 0}))
    return {"data": data}

# POST: Predict crop recommendation (ML model)
@app.post("/api/crop-recommendation")
async def crop_recommendation_predict(input: CropRecInput):
    # Map soilType to numeric if needed (the Kaggle dataset uses numbers, but UI uses names)
    soil_map = {"Sandy": 0, "Loamy": 1, "Black": 2, "Red": 3, "Clay": 4, "Silty": 5}
    soil_val = soil_map.get(input.soilType, 1)  # Default to Loamy if not found
    try:
        features = np.array([[float(input.rainfall), float(input.temperature), soil_val]])
        # The Kaggle dataset expects: N, P, K, temperature, humidity, ph, rainfall
        # But our UI only provides rainfall, temperature, soilType. We'll fill others with mean values.
        # Load means from the training data
        df = None
        try:
            import pandas as pd
            df = pd.read_csv(os.path.join(os.path.dirname(__file__), "data", "crop_recommendation.csv"))
        except Exception:
            pass
        if df is not None:
            N = df["N"].mean()
            P = df["P"].mean()
            K = df["K"].mean()
            humidity = df["humidity"].mean()
            ph = df["ph"].mean()
        else:
            N = 80
            P = 50
            K = 40
            humidity = 60
            ph = 6.5
        # Compose feature vector
        X = np.array([[N, P, K, float(input.temperature), humidity, ph, float(input.rainfall)]])
        pred = crop_rec_model.predict(X)[0]
        return {"recommendation": pred}
    except Exception as e:
        return {"recommendation": f"Error: {str(e)}"}

@app.get("/api/weather-advisory")
def weather_advisory():
    data = list(db.weather_advisory.find({}, {"_id": 0}))
    return {"data": data}

@app.get("/api/crop-info")
def crop_info():
    data = list(db.crop_info.find({}, {"_id": 0}))
    return {"data": data}
