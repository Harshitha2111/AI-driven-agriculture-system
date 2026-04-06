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
    date: str

class PricePredictionInput(BaseModel):
    commodity: str
    market: str
    date: str

class WeatherAdvisoryInput(BaseModel):
    location: str
    date: str

class CropInfoInput(BaseModel):
    crop: str
# POST: Market Analysis
@app.post("/api/market-analysis")
async def market_analysis_post(input: MarketAnalysisInput):
    # Example: return a simple analysis string
    return {"analysis": f"Market analysis for {input.commodity} in {input.market} on {input.date}: Stable."}

# POST: Price Prediction
@app.post("/api/price-prediction")
async def price_prediction_post(input: PricePredictionInput):
    # Example: return a simple prediction string
    return {"prediction": f"Predicted price for {input.commodity} in {input.market} on {input.date}: ₹2000/quintal."}

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
