import React, { useState, useEffect } from "react";
import { INDIAN_CITIES } from "./indianCities";

// Types for all feature forms

const API = "http://localhost:8000/api";

const FEATURES = [
  { key: "market", label: "Market Analysis" },
  { key: "price", label: "Price Prediction" },
  { key: "crop", label: "Crop Recommendation" },
  { key: "weather", label: "Weather Advisory" },
  { key: "info", label: "Crop Info" },
];

type FeatureCardProps = {
  title: string;
  data: any[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
};

type CropRecInput = {
  soilType: string;
  rainfall: string;
  temperature: string;
};

function FeatureCard({ title, data, loading, error, onRefresh }: FeatureCardProps) {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, margin: "16px 0", padding: 16, background: "#fafafa" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <button onClick={onRefresh} style={{ padding: "4px 12px", borderRadius: 4, border: "1px solid #aaa", background: "#fff", cursor: "pointer" }}>Refresh</button>
      </div>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
      {!loading && !error && Array.isArray(data) && data.length > 0 && (
        <table style={{ width: "100%", marginTop: 12, borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {Object.keys(data[0]).map((key) => (
                <th key={key} style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: 4 }}>{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                {Object.values(row).map((val, j) => (
                  <td key={j} style={{ borderBottom: "1px solid #eee", padding: 4 }}>{val+""}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!loading && !error && Array.isArray(data) && data.length === 0 && <div>No data available.</div>}
    </div>
  );
}

function App() {
  // Market Analysis Form
  const [marketInput, setMarketInput] = useState<MarketAnalysisInput>({ commodity: "", market: "" });
  const [stateOptions, setStateOptions] = useState<string[]>([]);
  const [districtOptions, setDistrictOptions] = useState<string[]>([]);
  const [marketOptions, setMarketOptions] = useState<string[]>([]);
  const [commodityOptions, setCommodityOptions] = useState<string[]>([]);
  // Crop options for Crop Info should be all available crops from the dataset, not just those filtered by market analysis
  const [cropOptions, setCropOptions] = useState<string[]>([]);

  // Fetch all crops for Crop Info on mount
  useEffect(() => {
    fetch(`${API}/available-areas`)
      .then(res => res.json())
      .then(data => {
        setCropOptions(data.commodities || []);
      });
  }, []);

  // Area selection state
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedMarket, setSelectedMarket] = useState("");


  // Fetch all states on mount
  useEffect(() => {
    fetch(`${API}/available-areas`)
      .then(res => res.json())
      .then(data => {
        setStateOptions(data.states || []);
      });
  }, []);

  // Update districts when state changes
  useEffect(() => {
    if (selectedState) {
      fetch(`${API}/area-commodities?state=${encodeURIComponent(selectedState)}`)
        .then(res => res.json())
        .then(data => {
          setDistrictOptions(data.districts || []);
          setSelectedDistrict("");
          setMarketOptions([]);
          setSelectedMarket("");
          setCommodityOptions([]);
        });
    } else {
      setDistrictOptions([]);
      setSelectedDistrict("");
      setMarketOptions([]);
      setSelectedMarket("");
      setCommodityOptions([]);
    }
  }, [selectedState]);

  // Update markets when district changes
  useEffect(() => {
    if (selectedState && selectedDistrict) {
      fetch(`${API}/area-commodities?state=${encodeURIComponent(selectedState)}&district=${encodeURIComponent(selectedDistrict)}`)
        .then(res => res.json())
        .then(data => {
          setMarketOptions(data.markets || []);
          setSelectedMarket("");
          setCommodityOptions([]);
        });
    } else {
      setMarketOptions([]);
      setSelectedMarket("");
      setCommodityOptions([]);
    }
  }, [selectedDistrict, selectedState]);

  // Update commodities when market changes
  useEffect(() => {
    if (selectedState && selectedDistrict && selectedMarket) {
      fetch(`${API}/area-commodities?state=${encodeURIComponent(selectedState)}&district=${encodeURIComponent(selectedDistrict)}&market=${encodeURIComponent(selectedMarket)}`)
        .then(res => res.json())
        .then(data => setCommodityOptions(data.commodities || []));
    } else {
      setCommodityOptions([]);
    }
  }, [selectedMarket, selectedDistrict, selectedState]);
  // Remove old locationOptions, use INDIAN_CITIES for autocomplete
  const [cityQuery, setCityQuery] = useState("");
  const [cityDropdown, setCityDropdown] = useState<string[]>(INDIAN_CITIES);
  const [marketResult, setMarketResult] = useState<string>("");
  const [marketPredicting, setMarketPredicting] = useState(false);
  const [marketPredictError, setMarketPredictError] = useState("");
  const handleMarketInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setMarketInput({ ...marketInput, [e.target.name]: e.target.value });
  };
  const handleMarketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMarketPredicting(true);
    setMarketPredictError("");
    setMarketResult("");
    try {
      const res = await fetch(`${API}/market-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(marketInput)
      });
      const data = await res.json();
      if (data && data.analysis) setMarketResult(data.analysis);
      else setMarketResult("No analysis returned.");
    } catch {
      setMarketPredictError("Analysis failed. Try again.");
    } finally {
      setMarketPredicting(false);
    }
  };

  // Price Prediction Form (area-wise selection)
  const [priceInput, setPriceInput] = useState<PricePredictionInput>({ state: "", district: "", market: "", commodity: "" });
  const [priceResult, setPriceResult] = useState<string>("");
  const [pricePredicting, setPricePredicting] = useState(false);
  const [pricePredictError, setPricePredictError] = useState("");
  const [priceSelectedState, setPriceSelectedState] = useState("");
  const [priceSelectedDistrict, setPriceSelectedDistrict] = useState("");
  const [priceSelectedMarket, setPriceSelectedMarket] = useState("");
  const [priceStateOptions, setPriceStateOptions] = useState<string[]>([]);
  const [priceDistrictOptions, setPriceDistrictOptions] = useState<string[]>([]);
  const [priceMarketOptions, setPriceMarketOptions] = useState<string[]>([]);
  const [priceCommodityOptions, setPriceCommodityOptions] = useState<string[]>([]);

  // Fetch all states for price prediction on mount
  useEffect(() => {
    fetch(`${API}/available-areas`)
      .then(res => res.json())
      .then(data => {
        setPriceStateOptions(data.states || []);
      });
  }, []);

  // Update districts when state changes
  useEffect(() => {
    if (priceSelectedState) {
      fetch(`${API}/area-commodities?state=${encodeURIComponent(priceSelectedState)}`)
        .then(res => res.json())
        .then(data => {
          setPriceDistrictOptions(data.districts || []);
          setPriceSelectedDistrict("");
          setPriceMarketOptions([]);
          setPriceSelectedMarket("");
          setPriceCommodityOptions([]);
          setPriceInput({ ...priceInput, state: priceSelectedState, district: "", market: "", commodity: "" });
        });
    } else {
      setPriceDistrictOptions([]);
      setPriceSelectedDistrict("");
      setPriceMarketOptions([]);
      setPriceSelectedMarket("");
      setPriceCommodityOptions([]);
      setPriceInput({ ...priceInput, state: "", district: "", market: "", commodity: "" });
    }
  }, [priceSelectedState]);

  // Update markets when district changes
  useEffect(() => {
    if (priceSelectedState && priceSelectedDistrict) {
      fetch(`${API}/area-commodities?state=${encodeURIComponent(priceSelectedState)}&district=${encodeURIComponent(priceSelectedDistrict)}`)
        .then(res => res.json())
        .then(data => {
          setPriceMarketOptions(data.markets || []);
          setPriceSelectedMarket("");
          setPriceCommodityOptions([]);
          setPriceInput({ ...priceInput, district: priceSelectedDistrict, market: "", commodity: "" });
        });
    } else {
      setPriceMarketOptions([]);
      setPriceSelectedMarket("");
      setPriceCommodityOptions([]);
      setPriceInput({ ...priceInput, district: "", market: "", commodity: "" });
    }
  }, [priceSelectedDistrict, priceSelectedState]);

  // Update commodities when market changes
  useEffect(() => {
    if (priceSelectedState && priceSelectedDistrict && priceSelectedMarket) {
      fetch(`${API}/area-commodities?state=${encodeURIComponent(priceSelectedState)}&district=${encodeURIComponent(priceSelectedDistrict)}&market=${encodeURIComponent(priceSelectedMarket)}`)
        .then(res => res.json())
        .then(data => {
          setPriceCommodityOptions(data.commodities || []);
          setPriceInput({ ...priceInput, market: priceSelectedMarket, commodity: "" });
        });
    } else {
      setPriceCommodityOptions([]);
      setPriceInput({ ...priceInput, market: "", commodity: "" });
    }
  }, [priceSelectedMarket, priceSelectedDistrict, priceSelectedState]);

  const handlePriceInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setPriceInput({ ...priceInput, [e.target.name]: e.target.value });
  };

  const handlePriceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPricePredicting(true);
    setPricePredictError("");
    setPriceResult("");
    try {
      const res = await fetch(`${API}/price-prediction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(priceInput)
      });
      const data = await res.json();
      if (data && data.prediction) setPriceResult(data.prediction);
      else setPriceResult("No prediction returned.");
    } catch {
      setPricePredictError("Prediction failed. Try again.");
    } finally {
      setPricePredicting(false);
    }
  };

  // Weather Advisory Form
  const [weatherInput, setWeatherInput] = useState<WeatherAdvisoryInput>({ location: "", date: "" });
  const [weatherResult, setWeatherResult] = useState<string>("");
  const [weatherPredicting, setWeatherPredicting] = useState(false);
  const [weatherPredictError, setWeatherPredictError] = useState("");
  // Autocomplete handler for city input
  const handleWeatherInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setWeatherInput({ ...weatherInput, [name]: value });
    if (name === "location") {
      setCityQuery(value);
      setCityDropdown(
        INDIAN_CITIES.filter(city => city.toLowerCase().includes(value.toLowerCase()))
      );
    }
  };
  const handleWeatherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWeatherPredicting(true);
    setWeatherPredictError("");
    setWeatherResult("");
    try {
      const res = await fetch(`${API}/weather-advisory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(weatherInput)
      });
      const data = await res.json();
      if (data && data.advisory) setWeatherResult(data.advisory);
      else setWeatherResult("No advisory returned.");
    } catch {
      setWeatherPredictError("Advisory failed. Try again.");
    } finally {
      setWeatherPredicting(false);
    }
  };

  // Crop Info Form
  const [infoInput, setInfoInput] = useState<CropInfoInput>({ crop: "" });
  const [infoResult, setInfoResult] = useState<string>("");
  const [infoPredicting, setInfoPredicting] = useState(false);
  const [infoPredictError, setInfoPredictError] = useState("");
  const handleInfoInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setInfoInput({ ...infoInput, [e.target.name]: e.target.value });
  };
  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoPredicting(true);
    setInfoPredictError("");
    setInfoResult("");
    try {
      const res = await fetch(`${API}/crop-info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(infoInput)
      });
      const data = await res.json();
      if (data && data.info) setInfoResult(data.info);
      else setInfoResult("No info returned.");
    } catch {
      setInfoPredictError("Info fetch failed. Try again.");
    } finally {
      setInfoPredicting(false);
    }
  };
  const [selectedFeature, setSelectedFeature] = useState("market");
  // Crop Recommendation Form State
  const [cropRecInput, setCropRecInput] = useState<CropRecInput>({
    soilType: "",
    rainfall: "",
    temperature: ""
  });
  const [cropRecResult, setCropRecResult] = useState<string>("");
  const [cropRecPredicting, setCropRecPredicting] = useState(false);
  const [cropRecPredictError, setCropRecPredictError] = useState("");

  const handleCropRecInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setCropRecInput({ ...cropRecInput, [e.target.name]: e.target.value });
  };

  const handleCropRecSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCropRecPredicting(true);
    setCropRecPredictError("");
    setCropRecResult("");
    try {
      const res = await fetch(`${API}/crop-recommendation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cropRecInput)
      });
      const data = await res.json();
      if (data && data.recommendation) setCropRecResult(data.recommendation);
      else setCropRecResult("No recommendation returned.");
    } catch {
      setCropRecPredictError("Prediction failed. Try again.");
    } finally {
      setCropRecPredicting(false);
    }
  };
  // State for each feature
  const [marketAnalysis, setMarketAnalysis] = useState([]);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState("");

  const [pricePrediction, setPricePrediction] = useState([]);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState("");

  const [cropRecommendation, setCropRecommendation] = useState([]);
  const [cropRecLoading, setCropRecLoading] = useState(false);
  const [cropRecError, setCropRecError] = useState("");

  const [weatherAdvisory, setWeatherAdvisory] = useState([]);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");

  const [cropInfo, setCropInfo] = useState([]);
  const [cropInfoLoading, setCropInfoLoading] = useState(false);
  const [cropInfoError, setCropInfoError] = useState("");

  // Fetch functions
  const fetchMarketAnalysis = () => {
    setMarketLoading(true); setMarketError("");
    fetch(`${API}/market-analysis`)
      .then((res) => res.json())
      .then((data) => setMarketAnalysis(data.data || []))
      .catch(() => setMarketError("Failed to fetch market analysis."))
      .finally(() => setMarketLoading(false));
  };
  const fetchPricePrediction = () => {
    setPriceLoading(true); setPriceError("");
    fetch(`${API}/price-prediction`)
      .then((res) => res.json())
      .then((data) => setPricePrediction(data.data || []))
      .catch(() => setPriceError("Failed to fetch price prediction."))
      .finally(() => setPriceLoading(false));
  };
  const fetchCropRecommendation = () => {
    setCropRecLoading(true); setCropRecError("");
    fetch(`${API}/crop-recommendation`)
      .then((res) => res.json())
      .then((data) => setCropRecommendation(data.data || []))
      .catch(() => setCropRecError("Failed to fetch crop recommendation."))
      .finally(() => setCropRecLoading(false));
  };
  const fetchWeatherAdvisory = () => {
    setWeatherLoading(true); setWeatherError("");
    fetch(`${API}/weather-advisory`)
      .then((res) => res.json())
      .then((data) => setWeatherAdvisory(data.data || []))
      .catch(() => setWeatherError("Failed to fetch weather advisory."))
      .finally(() => setWeatherLoading(false));
  };
  const fetchCropInfo = () => {
    setCropInfoLoading(true); setCropInfoError("");
    fetch(`${API}/crop-info`)
      .then((res) => res.json())
      .then((data) => setCropInfo(data.data || []))
      .catch(() => setCropInfoError("Failed to fetch crop info."))
      .finally(() => setCropInfoLoading(false));
  };

  useEffect(() => {
    fetchMarketAnalysis();
    fetchPricePrediction();
    fetchCropRecommendation();
    fetchWeatherAdvisory();
    fetchCropInfo();
    // eslint-disable-next-line
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f6f8", fontFamily: "Segoe UI, Arial, sans-serif" }}>
      <aside style={{ width: 260, background: "#222", color: "#fff", padding: 0, display: "flex", flexDirection: "column", alignItems: "stretch", boxShadow: "2px 0 8px rgba(0,0,0,0.04)" }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, textAlign: "center", margin: "32px 0 24px 0", letterSpacing: 0.5 }}>Agri AI System</h1>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {FEATURES.map(f => (
            <button
              key={f.key}
              onClick={() => setSelectedFeature(f.key)}
              style={{
                background: selectedFeature === f.key ? "#fff" : "#222",
                color: selectedFeature === f.key ? "#222" : "#fff",
                border: "none",
                borderLeft: selectedFeature === f.key ? "6px solid #4caf50" : "6px solid transparent",
                padding: "16px 24px",
                fontSize: 18,
                fontWeight: 500,
                textAlign: "left",
                cursor: "pointer",
                outline: "none",
                transition: "background 0.2s, color 0.2s"
              }}
            >
              {f.label}
            </button>
          ))}
        </nav>
      </aside>
      <main style={{ flex: 1, padding: "40px 5vw", maxWidth: 900, margin: "0 auto" }}>
        {selectedFeature === "market" && (
          <div className="feature-card" style={{ background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: 24 }}>
            <h2 style={{ marginTop: 0 }}>Market Analysis</h2>
            <form onSubmit={handleMarketSubmit} style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
              <label>
                State:
                <select value={selectedState} onChange={e => { setSelectedState(e.target.value); setSelectedDistrict(""); setSelectedMarket(""); setMarketInput({ ...marketInput, market: "", commodity: "" }); }} required style={{ marginLeft: 4 }}>
                  <option value="">Select</option>
                  {stateOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </label>
              <label>
                District:
                <select value={selectedDistrict} onChange={e => { setSelectedDistrict(e.target.value); setSelectedMarket(""); setMarketInput({ ...marketInput, market: "", commodity: "" }); }} required style={{ marginLeft: 4 }}>
                  <option value="">Select</option>
                  {districtOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </label>
              <label>
                Market:
                <select name="market" value={marketInput.market} onChange={e => { handleMarketInput(e); setSelectedMarket(e.target.value); setMarketInput({ ...marketInput, market: e.target.value, commodity: "" }); }} required style={{ marginLeft: 4 }}>
                  <option value="">Select</option>
                  {marketOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </label>
              <label>
                Commodity:
                <select name="commodity" value={marketInput.commodity} onChange={handleMarketInput} required style={{ marginLeft: 4 }}>
                  <option value="">Select</option>
                  {commodityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </label>
              {/* Date field removed */}
              <button type="submit" disabled={marketPredicting} style={{ padding: "4px 12px", background: "#4caf50", color: "#fff", border: "none", borderRadius: 4, fontWeight: 500 }}>
                {marketPredicting ? "Analysing..." : "Analyse"}
              </button>
            </form>
            {marketPredictError && <div style={{ color: "red" }}>{marketPredictError}</div>}
            {marketResult && <div style={{ color: "green", fontWeight: 500, marginTop: 8 }}>Analysis: {marketResult}</div>}
          </div>
        )}
        {selectedFeature === "price" && (
          <div className="feature-card" style={{ background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: 24 }}>
            <h2 style={{ marginTop: 0 }}>Price Prediction</h2>
            <form onSubmit={handlePriceSubmit} style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
              <label>
                State:
                <select value={priceSelectedState} onChange={e => { setPriceSelectedState(e.target.value); setPriceSelectedDistrict(""); setPriceSelectedMarket(""); setPriceInput({ ...priceInput, state: e.target.value, district: "", market: "", commodity: "" }); }} required style={{ marginLeft: 4 }}>
                  <option value="">Select</option>
                  {priceStateOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </label>
              <label>
                District:
                <select value={priceSelectedDistrict} onChange={e => { setPriceSelectedDistrict(e.target.value); setPriceSelectedMarket(""); setPriceInput({ ...priceInput, district: e.target.value, market: "", commodity: "" }); }} required style={{ marginLeft: 4 }}>
                  <option value="">Select</option>
                  {priceDistrictOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </label>
              <label>
                Market:
                <select value={priceSelectedMarket} onChange={e => { setPriceSelectedMarket(e.target.value); setPriceInput({ ...priceInput, market: e.target.value, commodity: "" }); }} required style={{ marginLeft: 4 }}>
                  <option value="">Select</option>
                  {priceMarketOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </label>
              <label>
                Commodity:
                <select name="commodity" value={priceInput.commodity} onChange={handlePriceInput} required style={{ marginLeft: 4 }}>
                  <option value="">Select</option>
                  {priceCommodityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </label>
              <button type="submit" disabled={pricePredicting} style={{ padding: "4px 12px", background: "#4caf50", color: "#fff", border: "none", borderRadius: 4, fontWeight: 500 }}>
                {pricePredicting ? "Predicting..." : "Predict"}
              </button>
            </form>
            {pricePredictError && <div style={{ color: "red" }}>{pricePredictError}</div>}
            {priceResult && <div style={{ color: "green", fontWeight: 500, marginTop: 8 }}>Predicted Price: {priceResult}</div>}
          </div>
        )}
        {selectedFeature === "crop" && (
          <div className="feature-card" style={{ background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: 24 }}>
            <h2 style={{ marginTop: 0 }}>Crop Recommendation</h2>
            <form onSubmit={handleCropRecSubmit} style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
              <label>
                Soil Type:
                <select name="soilType" value={cropRecInput.soilType} onChange={handleCropRecInput} required style={{ marginLeft: 4 }}>
                  <option value="">Select</option>
                  <option value="Loamy">Loamy</option>
                  <option value="Sandy">Sandy</option>
                  <option value="Clay">Clay</option>
                  <option value="Silty">Silty</option>
                </select>
              </label>
              <label>
                Rainfall (mm):
                <input name="rainfall" type="number" value={cropRecInput.rainfall} onChange={handleCropRecInput} required style={{ marginLeft: 4, width: 80 }} />
              </label>
              <label>
                Temperature (°C):
                <input name="temperature" type="number" value={cropRecInput.temperature} onChange={handleCropRecInput} required style={{ marginLeft: 4, width: 80 }} />
              </label>
              <button type="submit" disabled={cropRecPredicting} style={{ padding: "4px 12px", background: "#4caf50", color: "#fff", border: "none", borderRadius: 4, fontWeight: 500 }}>
                {cropRecPredicting ? "Predicting..." : "Predict"}
              </button>
            </form>
            {cropRecPredictError && <div style={{ color: "red" }}>{cropRecPredictError}</div>}
            {cropRecResult && <div style={{ color: "green", fontWeight: 500, marginTop: 8 }}>Recommended Crop: {cropRecResult}</div>}
          </div>
        )}
        {selectedFeature === "weather" && (
          <div className="feature-card" style={{ background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: 24 }}>
            <h2 style={{ marginTop: 0 }}>Weather Advisory</h2>
            <form onSubmit={handleWeatherSubmit} style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 12, position: "relative" }} autoComplete="off">
              <label style={{ position: "relative" }}>
                Location:
                <input
                  name="location"
                  type="text"
                  value={weatherInput.location}
                  onChange={handleWeatherInput}
                  autoComplete="off"
                  required
                  style={{ marginLeft: 4, width: 220 }}
                  onFocus={() => setCityDropdown(INDIAN_CITIES.filter(city => city.toLowerCase().includes(weatherInput.location.toLowerCase())))}
                />
                {cityQuery && cityDropdown.length > 0 && (
                  <ul style={{
                    position: "absolute",
                    zIndex: 10,
                    background: "#fff",
                    border: "1px solid #ccc",
                    borderRadius: 4,
                    margin: 0,
                    padding: 0,
                    listStyle: "none",
                    width: 220,
                    maxHeight: 180,
                    overflowY: "auto"
                  }}>
                    {cityDropdown.map(city => (
                      <li
                        key={city}
                        style={{ padding: "6px 12px", cursor: "pointer" }}
                        onMouseDown={() => {
                          setWeatherInput({ ...weatherInput, location: city });
                          setCityQuery("");
                          setCityDropdown([]);
                        }}
                      >
                        {city}
                      </li>
                    ))}
                  </ul>
                )}
              </label>
              <label>
                Date:
                <input name="date" type="date" value={weatherInput.date} onChange={handleWeatherInput} required style={{ marginLeft: 4 }} />
              </label>
              <button type="submit" disabled={weatherPredicting} style={{ padding: "4px 12px", background: "#4caf50", color: "#fff", border: "none", borderRadius: 4, fontWeight: 500 }}>
                {weatherPredicting ? "Fetching..." : "Get Advisory"}
              </button>
            </form>
            {weatherPredictError && <div style={{ color: "red" }}>{weatherPredictError}</div>}
            {weatherResult && <div style={{ color: "green", fontWeight: 500, marginTop: 8 }}>Advisory: {weatherResult}</div>}
          </div>
        )}
        {selectedFeature === "info" && (
          <div className="feature-card" style={{ background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: 24 }}>
            <h2 style={{ marginTop: 0 }}>Crop Info</h2>
            <form onSubmit={handleInfoSubmit} style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
              <label>
                Crop Name:
                <select name="crop" value={infoInput.crop} onChange={handleInfoInput} required style={{ marginLeft: 4 }}>
                  <option value="">Select</option>
                  {cropOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </label>
              <button type="submit" disabled={infoPredicting} style={{ padding: "4px 12px", background: "#4caf50", color: "#fff", border: "none", borderRadius: 4, fontWeight: 500 }}>
                {infoPredicting ? "Fetching..." : "Get Info"}
              </button>
            </form>
            {infoPredictError && <div style={{ color: "red" }}>{infoPredictError}</div>}
            {infoResult && <div style={{ color: "green", fontWeight: 500, marginTop: 8 }}>Info: {infoResult}</div>}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;


// Types for all feature forms
type MarketAnalysisInput = {
  commodity: string;
  market: string;
};
type PricePredictionInput = {
  state?: string;
  district?: string;
  market: string;
  commodity: string;
};
type WeatherAdvisoryInput = {
  location: string;
  date: string;
};
type CropInfoInput = {
  crop: string;
};

// No login page or authentication is required for this application. All features are public and do not require user accounts.