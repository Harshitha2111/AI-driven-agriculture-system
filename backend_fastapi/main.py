from fastapi import FastAPI, Request
app = FastAPI()

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

# POST: Weather Advisory
@app.post("/api/weather-advisory")
async def weather_advisory_post(input: WeatherAdvisoryInput):
    # Example: return a simple advisory string
    return {"advisory": f"Weather advisory for {input.location} on {input.date}: Light rain expected."}

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
