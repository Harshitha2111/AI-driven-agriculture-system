import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, User, RefreshCcw, TrendingUp, Table as TableIcon, ChartLine, Send, Download, FileSpreadsheet } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  id: string;
  type: 'bot' | 'user';
  text: string;
  component?: React.ReactNode;
}

interface Selection {
  flow?: 'market' | 'predict' | 'recommend' | 'weather' | 'info';
  state?: string;
  district?: string;
  market?: string;
  group?: string;
  commodity?: string;
  year?: string;
  soil?: string;
  region?: string;
  season?: string;
  water?: string;
  location?: string;
  crop?: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selection, setSelection] = useState<Selection>({});
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    // Initial message
    const welcome = async () => {
      addBotMessage("Welcome to Agri AI System 🌾\nI'm your professional agricultural assistant. How can I help you today?");
      
      showMainMenu();
    };
    welcome();
  }, []);

  const showMainMenu = () => {
    addBotMessage("What would you like to do?", (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
        {[
          { id: 'market', label: '📊 Market Analysis', color: 'bg-blue-50 text-blue-700 border-blue-100' },
          { id: 'predict', label: '📈 Price Prediction', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
          { id: 'recommend', label: '🌱 Crop Recommendation', color: 'bg-amber-50 text-amber-700 border-amber-100' },
          { id: 'weather', label: '☁️ Weather Advisory', color: 'bg-sky-50 text-sky-700 border-sky-100' },
          { id: 'info', label: 'ℹ️ Crop Information', color: 'bg-purple-50 text-purple-700 border-purple-100' },
          { id: 'download', label: '💾 Download Application', color: 'bg-gray-50 text-gray-700 border-gray-100' }
        ].map(opt => (
          <button
            key={opt.id}
            onClick={() => startFlow(opt.id as any, opt.label)}
            className={cn(
              "px-4 py-3 border rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-left flex items-center justify-between",
              opt.color
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    ));
  };

  const startFlow = (flow: Selection['flow'], label: string) => {
    addUserMessage(label);
    const newSelection = { flow };
    setSelection(newSelection);
    
    if (flow === 'market') {
      fetchOptions(newSelection);
    } else if (flow === 'predict') {
      promptForPredict(newSelection);
    } else if (flow === 'recommend') {
      promptForRecommend(newSelection);
    } else if (flow === 'weather') {
      promptForWeather(newSelection);
    } else if (flow === 'info') {
      promptForInfo(newSelection);
    } else if (flow === 'download' as any) {
      handleDownloadApp();
      addBotMessage("Starting your application download... 🚀\nThis ZIP file contains the full source code (React + Express) for you to run locally.");
      showPostFlowOptions();
    }
  };

  const addBotMessage = (text: string, component?: React.ReactNode) => {
    setMessages(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), type: 'bot', text, component }]);
  };

  const addUserMessage = (text: string) => {
    setMessages(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), type: 'user', text }]);
  };

  /**
   * MARKET ANALYSIS FLOW
   */
  const fetchOptions = async (currentSelection: Selection) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentSelection.state) params.append('state', currentSelection.state);
      if (currentSelection.district) params.append('district', currentSelection.district);
      if (currentSelection.market) params.append('market', currentSelection.market);
      if (currentSelection.group) params.append('group', currentSelection.group);
      if (currentSelection.commodity) params.append('commodity', currentSelection.commodity);
      if (currentSelection.year) params.append('year', currentSelection.year);

      const res = await fetch(`/api/options?${params.toString()}`);
      const data = await res.json();

      if (data.type === 'done') {
        await fetchFinalData(currentSelection);
      } else if (data.options && data.options.length > 0) {
        const promptText = getPromptForType(data.type);
        
        addBotMessage(promptText, (
          <div className="mt-2 w-full max-w-xs">
            <select
              onChange={(e) => handleMarketSelect(data.type, e.target.value)}
              defaultValue=""
              className="w-full px-4 py-2 bg-white border border-emerald-200 text-emerald-700 rounded-xl hover:bg-emerald-50 transition-colors text-sm font-medium shadow-sm cursor-pointer outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="" disabled>Select {data.type}...</option>
              {data.options.map((opt: string) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        ));
      }
    } catch (error) {
      console.error("Error fetching options:", error);
      addBotMessage("Sorry, I encountered an error fetching options. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getPromptForType = (type: string) => {
    switch (type) {
      case 'state': return "Select State:";
      case 'district': return "Select District:";
      case 'market': return "Select Market:";
      case 'group': return "Select Commodity Group:";
      case 'commodity': return "Select Commodity:";
      case 'year': return "Select Year:";
      default: return "Please select an option:";
    }
  };

  const handleMarketSelect = (type: string, value: string) => {
    addUserMessage(value);
    const newSelection = { ...selection, [type]: value };
    setSelection(newSelection);
    fetchOptions(newSelection);
  };

  const fetchFinalData = async (sel: Selection) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(sel).forEach(([k, v]) => {
        // Omit year to fetch all historical data for the trend
        if (v && k !== 'year') params.append(k, v as string);
      });
      
      const res = await fetch(`/api/result?${params.toString()}`);
      const allData = await res.json();

      if (allData.length === 0) {
        addBotMessage("No data found for this selection.");
      } else {
        // Sort data by year
        const sortedData = allData.sort((a: any, b: any) => parseInt(a.Year) - parseInt(b.Year));
        
        // Filter for the specifically selected year for the table
        const tableData = sel.year ? sortedData.filter((d: any) => d.Year === sel.year) : [sortedData[sortedData.length - 1]];

        addBotMessage(`Here is the market analysis for ${sel.commodity} in ${sel.market}.`, (
          <div className="mt-4 space-y-6">
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Market Data Table</span>
                <button 
                  onClick={() => handleDownloadCSV(sortedData, `${sel.commodity}_${sel.market}_data.csv`)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 hover:bg-gray-50 transition-all cursor-pointer shadow-sm"
                >
                  <FileSpreadsheet size={12} className="text-emerald-600" />
                  Download CSV
                </button>
              </div>
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Year</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Arrival Qty</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Min Price</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Modal Price</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Max Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tableData.map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900 font-bold">{row.Year}</td>
                      <td className="px-4 py-3 text-gray-700 font-medium">
                        {row["Arrival Quantity"]} <span className="text-[10px] text-gray-400">{row["Arrival Unit"]}</span>
                      </td>
                      <td className="px-4 py-3 text-emerald-600">₹{row["Min Price"]}</td>
                      <td className="px-4 py-3 font-bold text-gray-900">₹{row["Modal Price"]}</td>
                      <td className="px-4 py-3 text-rose-600">₹{row["Max Price"]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Enhanced Price Trend Chart */}
            <TrendChart data={sortedData} commodity={sel.commodity!} />
          </div>
        ));
      }

      showPostFlowOptions();
    } catch (error) {
      console.error("Error fetching final data:", error);
    } finally {
      setLoading(false);
    }
  };

  const TrendChart = ({ data, commodity }: { data: any[], commodity: string }) => {
    const years = [...new Set(data.map(d => parseInt(d.Year)))].sort((a, b) => a - b);
    const [startYear, setStartYear] = useState(years[0]);
    const [endYear, setEndYear] = useState(years[years.length - 1]);

    const chartData = data
      .filter(d => parseInt(d.Year) >= startYear && parseInt(d.Year) <= endYear)
      .map(d => ({
        year: d.Year,
        modal: parseFloat(d["Modal Price"].replace(/,/g, '')) || 0,
        min: parseFloat(d["Min Price"].replace(/,/g, '')) || 0,
        max: parseFloat(d["Max Price"].replace(/,/g, '')) || 0,
        qty: parseFloat(d["Arrival Quantity"].replace(/,/g, '')) || 0,
      }));

    return (
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <ChartLine size={18} className="text-emerald-600" />
              Historical Price Trend: {commodity}
            </h4>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Interactive Analysis</p>
          </div>
          
          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
            <select 
              value={startYear} 
              onChange={(e) => setStartYear(parseInt(e.target.value))}
              className="bg-transparent text-xs font-bold text-gray-600 outline-none cursor-pointer px-2"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <span className="text-gray-300 text-xs">—</span>
            <select 
              value={endYear} 
              onChange={(e) => setEndYear(parseInt(e.target.value))}
              className="bg-transparent text-xs font-bold text-gray-600 outline-none cursor-pointer px-2"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="year" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={(val) => `₹${val}`}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-xl text-xs">
                        <p className="font-bold text-gray-900 mb-2">Year: {label}</p>
                        <div className="space-y-1">
                          <p className="text-emerald-600 flex justify-between gap-4">
                            <span>Modal Price:</span> <b>₹{payload[0].value}</b>
                          </p>
                          <p className="text-blue-600 flex justify-between gap-4">
                            <span>Min Price:</span> <b>₹{payload[1].value}</b>
                          </p>
                          <p className="text-rose-600 flex justify-between gap-4">
                            <span>Max Price:</span> <b>₹{payload[2].value}</b>
                          </p>
                          <div className="mt-2 pt-2 border-t border-gray-50 text-gray-400">
                            Arrival Qty: <span className="text-gray-900 font-medium">{data.find(d => d.Year === label)?.["Arrival Quantity"]}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ stroke: '#10b981', strokeWidth: 2, strokeDasharray: '5 5' }}
              />
              <Legend 
                verticalAlign="top" 
                align="right" 
                iconType="circle"
                wrapperStyle={{ fontSize: '10px', paddingBottom: '20px' }}
              />
              <Line 
                type="monotone" 
                dataKey="modal" 
                name="Modal Price" 
                stroke="#10b981" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Line 
                type="monotone" 
                dataKey="min" 
                name="Min Price" 
                stroke="#3b82f6" 
                strokeWidth={2} 
                strokeDasharray="5 5"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="max" 
                name="Max Price" 
                stroke="#f43f5e" 
                strokeWidth={2} 
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-50">
          <div className="text-center">
            <div className="text-[10px] text-gray-400 uppercase mb-1">Avg Price</div>
            <div className="text-sm font-bold text-gray-900">
              ₹{Math.round(chartData.reduce((acc, curr) => acc + curr.modal, 0) / chartData.length || 0)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-gray-400 uppercase mb-1">Max Peak</div>
            <div className="text-sm font-bold text-rose-600">
              ₹{Math.max(...chartData.map(d => d.max), 0)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-gray-400 uppercase mb-1">Min Floor</div>
            <div className="text-sm font-bold text-blue-600">
              ₹{Math.min(...chartData.map(d => d.min), Infinity) === Infinity ? 0 : Math.min(...chartData.map(d => d.min))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /**
   * PRICE PREDICTION FLOW
   */
  const promptForPredict = async (sel: Selection) => {
    // First, get available commodities
    setLoading(true);
    try {
      const res = await fetch('/api/options');
      const data = await res.json();
      // We need to drill down to commodities. For simplicity, let's just show a few common ones or ask user to type.
      addBotMessage("Select Commodity for prediction:", (
        <div className="flex flex-wrap gap-2 mt-2">
          {["Onion", "Potato", "Garlic", "Tomato"].map(c => (
            <button
              key={c}
              onClick={() => handlePredictSelect('commodity', c)}
              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-xs font-medium hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              {c}
            </button>
          ))}
        </div>
      ));
    } catch (e) {
      addBotMessage("Error fetching commodities. Please type the commodity name.");
    } finally {
      setLoading(false);
    }
  };

  const handlePredictSelect = (type: string, value: string) => {
    addUserMessage(value);
    const newSelection = { ...selection, [type]: value };
    setSelection(newSelection);
    
    if (type === 'commodity') {
      addBotMessage("Select Market or State for context:", (
        <div className="flex flex-wrap gap-2 mt-2">
          {["Bangalore", "Pune", "Nashik", "Karnataka", "Maharashtra"].map(m => (
            <button
              key={m}
              onClick={() => fetchPrediction(value, m)}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs font-medium hover:bg-blue-100 transition-colors cursor-pointer"
            >
              {m}
            </button>
          ))}
        </div>
      ));
    }
  };

  const fetchPrediction = async (commodity: string, context: string) => {
    addUserMessage(context);
    setLoading(true);
    try {
      const res = await fetch(`/api/predict?commodity=${encodeURIComponent(commodity)}`);
      const data = await res.json();

      const isIncrease = parseFloat(data.predictedPrice) > data.lastPrice;

      addBotMessage(`Price prediction for ${commodity} in ${context}:`, (
        <div className="mt-4 p-4 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold">
              <TrendingUp size={20} />
              <span>AI Forecast</span>
            </div>
            <div className={cn(
              "text-xs font-bold px-2 py-1 rounded-full",
              isIncrease ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            )}>
              {isIncrease ? "Likely to Increase" : "Likely to Decrease"}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded-lg border border-emerald-50">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Last Price</div>
              <div className="text-xl font-bold text-gray-900">₹{data.lastPrice}</div>
              <div className="text-[10px] text-gray-400">{data.unit}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-50">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Predicted</div>
              <div className="text-xl font-bold text-blue-600">₹{data.predictedPrice}</div>
              <div className="text-[10px] text-gray-400">{data.unit}</div>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600 leading-relaxed">
            Historical trends for {commodity} show seasonal variations. Based on recent data from {data.lastYear}, we expect a {isIncrease ? 'slight rise' : 'small dip'} in the coming weeks.
          </p>
        </div>
      ));

      showPostFlowOptions();
    } catch (error) {
      console.error("Error fetching prediction:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * CROP RECOMMENDATION FLOW
   */
  const promptForRecommend = (sel: Selection) => {
    addBotMessage("Enter Soil Type:", (
      <div className="flex flex-wrap gap-2 mt-2">
        {["Sandy", "Clay", "Loamy"].map(s => (
          <button
            key={s}
            onClick={() => handleRecommendSelect('soil', s)}
            className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-full text-xs font-medium hover:bg-amber-100 transition-colors cursor-pointer"
          >
            {s}
          </button>
        ))}
      </div>
    ));
  };

  const handleRecommendSelect = (type: string, value: string) => {
    addUserMessage(value);
    const newSelection = { ...selection, [type]: value };
    setSelection(newSelection);

    if (type === 'soil') {
      addBotMessage("Select Region / State:", (
        <div className="flex flex-wrap gap-2 mt-2">
          {["Karnataka", "Maharashtra", "North India", "South India"].map(r => (
            <button
              key={r}
              onClick={() => handleRecommendSelect('region', r)}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs font-medium hover:bg-blue-100 transition-colors cursor-pointer"
            >
              {r}
            </button>
          ))}
        </div>
      ));
    } else if (type === 'region') {
      addBotMessage("Enter Season:", (
        <div className="flex flex-wrap gap-2 mt-2">
          {["Kharif", "Rabi", "Zaid"].map(s => (
            <button
              key={s}
              onClick={() => handleRecommendSelect('season', s)}
              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-xs font-medium hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      ));
    } else if (type === 'season') {
      addBotMessage("Optional: Enter Water Availability:", (
        <div className="flex flex-wrap gap-2 mt-2">
          {["Low", "Medium", "High"].map(w => (
            <button
              key={w}
              onClick={() => fetchRecommendations({ ...newSelection, water: w })}
              className="px-3 py-1.5 bg-sky-50 text-sky-700 border-sky-100 rounded-full text-xs font-medium hover:bg-sky-100 transition-colors cursor-pointer"
            >
              {w}
            </button>
          ))}
        </div>
      ));
    }
  };

  const fetchRecommendations = async (sel: Selection) => {
    addUserMessage(sel.water!);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (sel.soil) params.append('soil', sel.soil);
      if (sel.region) params.append('region', sel.region);
      if (sel.season) params.append('season', sel.season);
      if (sel.water) params.append('water', sel.water);

      const res = await fetch(`/api/recommend-crop?${params.toString()}`);
      const data = await res.json();

      addBotMessage(`Based on your inputs, here are the suggested crops for ${sel.region}:`, (
        <div className="mt-4 space-y-3">
          {data.map((r: any, i: number) => (
            <div key={i} className="p-4 bg-white border border-amber-100 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-amber-800 flex items-center gap-2">
                  <Bot size={16} />
                  {r.crop}
                </h4>
                <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-bold">
                  Demand: {r.demand}
                </span>
              </div>
              <p className="text-xs text-gray-600 mb-3">{r.reason}</p>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-400 block uppercase">Expected Yield</span>
                  <span className="font-semibold">{r.yield}</span>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-400 block uppercase">Season</span>
                  <span className="font-semibold">{r.season}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ));

      showPostFlowOptions();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  /**
   * WEATHER ADVISORY FLOW
   */
  const promptForWeather = (sel: Selection) => {
    addBotMessage("Enter Location (State/District) for weather advisory:");
  };

  const fetchWeather = async (location: string) => {
    setLoading(true);
    try {
      // Use Gemini with Google Search for real-time weather and professional advice
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Provide a detailed professional weather advisory for farmers in ${location}. 
        Include:
        1. Current typical weather conditions for this time of year.
        2. Specific farming advice (planting, harvesting, etc.).
        3. Irrigation suggestions.
        4. Risk alerts (pests, rain, drought).
        
        Return the data in a clear, structured JSON format.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              location: { type: Type.STRING },
              temp: { type: Type.STRING },
              condition: { type: Type.STRING },
              humidity: { type: Type.STRING },
              wind: { type: Type.STRING },
              farmingAdvice: { type: Type.STRING },
              irrigationAdvice: { type: Type.STRING },
              riskAlerts: { type: Type.STRING }
            },
            required: ["location", "temp", "condition", "farmingAdvice", "irrigationAdvice", "riskAlerts"]
          }
        }
      });

      const data = JSON.parse(response.text);

      addBotMessage(`Weather Advisory for ${data.location}:`, (
        <div className="mt-4 p-4 bg-sky-50 border border-sky-100 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-2xl font-bold text-sky-900">{data.temp}</div>
              <div className="text-sm text-sky-700">{data.condition}</div>
            </div>
            <div className="text-right text-[10px] text-sky-600">
              {data.humidity && <div>Humidity: {data.humidity}</div>}
              {data.wind && <div>Wind: {data.wind}</div>}
            </div>
          </div>
          <div className="space-y-3">
            <div className="bg-white p-3 rounded-lg border border-sky-50">
              <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Farming Advice</div>
              <p className="text-xs text-gray-700">{data.farmingAdvice}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-sky-50">
              <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Irrigation</div>
              <p className="text-xs text-gray-700">{data.irrigationAdvice}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-sky-50">
              <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Risk Alerts</div>
              <p className="text-xs text-rose-600 font-medium">{data.riskAlerts}</p>
            </div>
          </div>
        </div>
      ));

      showPostFlowOptions();
    } catch (e) {
      console.error(e);
      addBotMessage("I couldn't fetch the real-time weather data right now. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * CROP INFORMATION FLOW
   */
  const promptForInfo = (sel: Selection) => {
    addBotMessage("Select Crop for detailed information:", (
      <div className="flex flex-wrap gap-2 mt-2">
        {["Onion", "Potato", "Garlic", "Tomato", "Wheat", "Rice", "Cotton", "Maize"].map(c => (
          <button
            key={c}
            onClick={() => fetchCropInfo(c)}
            className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-full text-xs font-medium hover:bg-purple-100 transition-colors cursor-pointer"
          >
            {c}
          </button>
        ))}
      </div>
    ));
  };

  const fetchCropInfo = async (crop: string) => {
    addUserMessage(crop);
    setLoading(true);
    try {
      // Use Gemini with Google Search for detailed, real, and health-focused crop info
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Provide comprehensive and real information about the crop: ${crop}. 
        Include:
        1. Best growing season.
        2. Soil and water requirements.
        3. Average yield per hectare.
        4. Market demand and price trends.
        5. Detailed health benefits and nutritional value.
        
        Ensure the information is accurate and professional. Return in JSON format.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              crop: { type: Type.STRING },
              season: { type: Type.STRING },
              soil: { type: Type.STRING },
              water: { type: Type.STRING },
              yield: { type: Type.STRING },
              demand: { type: Type.STRING },
              trends: { type: Type.STRING },
              healthBenefits: { type: Type.STRING }
            },
            required: ["crop", "season", "soil", "water", "yield", "demand", "trends", "healthBenefits"]
          }
        }
      });

      const data = JSON.parse(response.text);

      addBotMessage(`Detailed Information for ${crop}:`, (
        <div className="mt-4 p-4 bg-white border border-purple-100 rounded-xl shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="text-[10px] text-purple-400 uppercase font-bold mb-1">Best Season</div>
              <div className="text-xs font-semibold text-purple-900">{data.season}</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="text-[10px] text-purple-400 uppercase font-bold mb-1">Soil Type</div>
              <div className="text-xs font-semibold text-purple-900">{data.soil}</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="text-[10px] text-purple-400 uppercase font-bold mb-1">Water Need</div>
              <div className="text-xs font-semibold text-purple-900">{data.water}</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="text-[10px] text-purple-400 uppercase font-bold mb-1">Avg Yield</div>
              <div className="text-xs font-semibold text-purple-900">{data.yield}</div>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
            <div className="text-[10px] text-emerald-600 uppercase font-bold mb-1 flex items-center gap-1">
              <Bot size={12} /> Health Benefits & Nutrition
            </div>
            <p className="text-xs text-emerald-900 leading-relaxed">{data.healthBenefits}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Market Demand & Trends</div>
            <p className="text-xs text-gray-700">{data.demand}. {data.trends}</p>
          </div>
        </div>
      ));

      showPostFlowOptions();
    } catch (e) {
      console.error(e);
      addBotMessage("I couldn't retrieve the detailed crop info right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const showPostFlowOptions = () => {
    addBotMessage("What would you like to do next?", (
      <div className="flex gap-2 mt-2">
        <button
          onClick={resetSelection}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors text-sm font-medium shadow-md cursor-pointer"
        >
          <RefreshCcw size={16} />
          Main Menu
        </button>
      </div>
    ));
  };

  const handleSendMessage = async (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    const text = (overrideText || inputValue).trim();
    if (!text || loading) return;

    setInputValue('');
    addUserMessage(text);

    // If we are in weather flow and waiting for location
    if (selection.flow === 'weather' && !selection.location) {
      setSelection({ ...selection, location: text });
      fetchWeather(text);
      return;
    }

    setLoading(true);

    try {
      // Use Gemini to understand the user's intent if they are typing freely
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are an Agricultural Market Intelligence Expert. 
        The user said: "${text}". 
        Current selection state: ${JSON.stringify(selection)}.
        
        Available flows: market, predict, recommend, weather, info.
        
        Extract any agricultural market parameters mentioned: district, market, commodity, year.
        If the user wants to start a specific flow, identify it.
        
        Return a JSON object with:
        - "reply": A natural language response to the user.
        - "updates": An object containing any extracted parameters.
        - "intent": One of ["query", "greeting", "reset", "unknown"].
        - "flow": The identified flow if the user wants to switch or start one.
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING },
              updates: { 
                type: Type.OBJECT,
                properties: {
                  state: { type: Type.STRING },
                  district: { type: Type.STRING },
                  market: { type: Type.STRING },
                  commodity: { type: Type.STRING },
                  year: { type: Type.STRING },
                }
              },
              intent: { type: Type.STRING, enum: ["query", "greeting", "reset", "unknown"] },
              flow: { type: Type.STRING, enum: ["market", "predict", "recommend", "weather", "info"] }
            },
            required: ["reply", "intent"]
          }
        }
      });

      const result = JSON.parse(response.text);
      
      if (result.intent === 'reset') {
        resetSelection();
        return;
      }

      if (result.flow && result.flow !== selection.flow) {
        startFlow(result.flow, result.reply);
        return;
      }

      addBotMessage(result.reply);

      if (result.updates && Object.keys(result.updates).length > 0) {
        const newSelection = { ...selection, ...result.updates };
        setSelection(newSelection);
        if (newSelection.flow === 'market') fetchOptions(newSelection);
      }
    } catch (error) {
      console.error("Gemini error:", error);
      addBotMessage("I'm here to help! You can select options from the menu or ask me about specific agricultural topics.");
    } finally {
      setLoading(false);
    }
  };

  const resetSelection = () => {
    setSelection({});
    addUserMessage("Main Menu");
    showMainMenu();
  };

  const handleDownloadApp = async () => {
    try {
      const response = await fetch('/api/download-app');
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'agri-ai-system.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error('Error downloading app:', error);
      alert('Failed to download app source code.');
    }
  };

  const handleDownloadCSV = async (data: any[], fileName: string) => {
    try {
      const response = await fetch('/api/download-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, fileName }),
      });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error('Error downloading CSV:', error);
      alert('Failed to download CSV data.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 rounded-lg text-white">
              <Bot size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">Agri AI System 🌾</h1>
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Professional Farming Assistant
              </p>
            </div>
          </div>
          <button 
            onClick={resetSelection}
            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all cursor-pointer"
            title="Reset Chat"
          >
            <RefreshCcw size={20} />
          </button>
          <button 
            onClick={handleDownloadApp}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-all cursor-pointer"
            title="Download App Source Code"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export App</span>
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  "flex gap-3",
                  msg.type === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm",
                  msg.type === 'user' ? "bg-blue-600 text-white" : "bg-emerald-100 text-emerald-700"
                )}>
                  {msg.type === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={cn(
                  "max-w-[85%] flex flex-col",
                  msg.type === 'user' ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "px-4 py-3 rounded-2xl shadow-sm",
                    msg.type === 'user' 
                      ? "bg-blue-600 text-white rounded-tr-none" 
                      : "bg-white border border-gray-100 text-gray-800 rounded-tl-none"
                  )}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  {msg.component && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="w-full"
                    >
                      {msg.component}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <Bot size={16} />
              </div>
              <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message or select an option..."
            className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      {/* Footer Info */}
      <footer className="bg-white border-t border-gray-200 p-4 text-center text-xs text-gray-400">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-6">
          <div className="flex items-center gap-1">
            <TableIcon size={14} />
            <span>Market Data</span>
          </div>
          <div className="flex items-center gap-1">
            <ChartLine size={14} />
            <span>AI Predictions</span>
          </div>
          <div className="flex items-center gap-1">
            <Bot size={14} />
            <span>Intelligent Advisory</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
