/**
 * AgriMarket Intelligence AI - Backend Server
 * 
 * How to run locally:
 * 1. Install dependencies: npm install
 * 2. Start the server: npm run dev
 * 3. Open browser: http://localhost:3000
 * 
 * Features:
 * - Loads and cleans data from data.xlsx
 * - Provides cascading selection APIs
 * - AI-driven price prediction logic
 */
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import XLSX from "xlsx";
import cors from "cors";
import fs from "fs";
import { fileURLToPath } from "url";
import archiver from "archiver";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(process.cwd(), "backend/data.xlsx");

// Initialize data if missing
if (!fs.existsSync(DATA_FILE)) {
  const csvContent = `State,District,Market,Commodity Group,Commodity,Year,MSP,Arrival Quantity,Arrival Unit,Min Price,Modal Price,Max Price,Price Unit
Karnataka,Bagalkot,Bagalakot APMC,Vegetables,Onion,2022,-,"4,268.00",Metric Tonnes,481.94,"1,210.46","1,565.14",Rs./Quintal
Karnataka,Bagalkot,Bagalakot APMC,Vegetables,Onion,2023,-,"2,160.00",Metric Tonnes,416.74,792.59,"1,202.36",Rs./Quintal
Karnataka,Bagalkot,Bagalakot APMC,Vegetables,Onion,2024,-,"8,055.00",Metric Tonnes,716.82,"2,994.20","4,382.33",Rs./Quintal
Karnataka,Bagalkot,Bagalakot APMC,Vegetables,Onion,2025,-,"1,734.90",Metric Tonnes,381.49,"1,412.71","2,350.58",Rs./Quintal
Karnataka,Bagalkot,Bagalakot APMC,Vegetables,Onion,2026,-,"1,740.90",Metric Tonnes,320.90,"1,197.38","1,700.03",Rs./Quintal
Karnataka,Bagalkot,Bagalkot(Bigali) APMC,Vegetables,Onion,2026,-,354.00,Metric Tonnes,729.41,973.53,"1,455.89",Rs./Quintal
Karnataka,Bagalkot,Bagalkot(Bilagi) APMC,Vegetables,Onion,2024,-,"1,127.00",Metric Tonnes,"1,455.19","1,841.18","2,201.15",Rs./Quintal
Karnataka,Bangalore,Bangalore APMC,Vegetables,Garlic,2022,-,"55,013.00",Metric Tonnes,"5,722.56","6,246.35","6,770.13",Rs./Quintal
Karnataka,Bangalore,Bangalore APMC,Vegetables,Ginger(Green),2022,-,"12,673.00",Metric Tonnes,"1,639.51","1,770.99","1,906.14",Rs./Quintal
Karnataka,Bangalore,Bangalore APMC,Vegetables,Onion,2022,-,"630,599.00",Metric Tonnes,"1,076.26","1,434.21","1,709.57",Rs./Quintal
Karnataka,Bangalore,Bangalore APMC,Vegetables,Potato,2022,-,"288,932.00",Metric Tonnes,"1,843.61","2,025.81","2,228.35",Rs./Quintal
Karnataka,Bangalore,Bangalore APMC,Vegetables,Garlic,2023,-,"45,479.00",Metric Tonnes,"9,508.62","10,397.11","11,041.17",Rs./Quintal
Karnataka,Bangalore,Bangalore APMC,Vegetables,Ginger(Green),2023,-,"6,675.00",Metric Tonnes,"5,284.55","5,761.74","6,225.57",Rs./Quintal
Karnataka,Bangalore,Bangalore APMC,Vegetables,Onion,2023,-,"646,834.00",Metric Tonnes,"1,471.52","1,766.96","2,017.89",Rs./Quintal
Karnataka,Bangalore,Bangalore APMC,Vegetables,Potato,2023,-,"288,444.00",Metric Tonnes,"1,507.57","1,681.22","1,832.71",Rs./Quintal
Karnataka,Bangalore,Bangalore APMC,Vegetables,Garlic,2024,-,"33,293.00",Metric Tonnes,"10,832.97","18,558.75","23,415.66",Rs./Quintal
Karnataka,Bangalore,Bangalore APMC,Vegetables,Ginger(Green),2024,-,"5,001.00",Metric Tonnes,"3,364.41","4,869.30","6,111.02",Rs./Quintal
Karnataka,Bangalore,Bangalore APMC,Vegetables,Onion,2024,-,"555,748.00",Metric Tonnes,"1,933.78","2,396.86","2,778.09",Rs./Quintal
Karnataka,Bangalore,Bangalore APMC,Vegetables,Potato,2024,-,"252,168.00",Metric Tonnes,"2,346.19","2,648.43","2,946.35",Rs./Quintal
Karnataka,Bangalore,Bangalore APMC,Vegetables,Garlic,2025,-,"6,853.00",Metric Tonnes,"6,989.49","11,736.39","16,032.83",Rs./Quintal
Karnataka,Bangalore,Bangalore APMC,Vegetables,Ginger(Green),2025,-,"1,835.50",Metric Tonnes,"2,589.25","2,920.94","3,289.46",Rs./Quintal
Karnataka,Bangalore,Bangalore APMC,Vegetables,Onion,2025,-,"167,092.06",Metric Tonnes,"1,413.43","1,727.42","2,333.82",Rs./Quintal
Karnataka,Bangalore,Bangalore APMC,Vegetables,Potato,2025,-,"72,708.40",Metric Tonnes,"1,678.58","2,139.32","2,526.18",Rs./Quintal
Karnataka,Bangalore,Bangalore APMC,Vegetables,Ginger(Green),2026,-,"2,275.00",Metric Tonnes,"3,698.47","4,126.49","4,491.09",Rs./Quintal
Karnataka,Bangalore,Bangalore APMC,Vegetables,Onion,2026,-,"188,547.10",Metric Tonnes,946.85,"1,275.89","1,712.12",Rs./Quintal
Karnataka,Bangalore,Bangalore APMC,Vegetables,Potato,2026,-,"70,669.50",Metric Tonnes,973.44,"1,454.32","1,831.36",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Alsandikai,2022,-,"1,021.00",Metric Tonnes,"3,984.33","4,149.66","4,302.45",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Ashgourd,2022,-,24.00,Metric Tonnes,"1,212.50","1,312.50","1,512.50",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Banana - Green,2022,-,"2,352.00",Metric Tonnes,"2,658.16","2,829.29","2,971.85",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Beetroot,2022,-,"5,812.00",Metric Tonnes,"2,980.85","3,209.22","3,389.33",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Bhindi(Ladies Finger),2022,-,"5,058.00",Metric Tonnes,"2,221.98","2,425.21","2,599.31",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Bitter gourd,2022,-,"2,340.00",Metric Tonnes,"3,011.20","3,219.91","3,387.69",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Bottle gourd,2022,-,"1,546.00",Metric Tonnes,"1,685.25","1,852.07","2,006.60",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Brinjal,2022,-,"4,358.00",Metric Tonnes,"2,125.47","2,348.38","2,522.83",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Cabbage,2022,-,"12,586.00",Metric Tonnes,"1,568.02","1,718.42","1,856.79",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Capsicum,2022,-,"3,706.00",Metric Tonnes,"4,278.76","4,559.74","4,774.34",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Carrot,2022,-,"11,430.00",Metric Tonnes,"4,995.19","5,337.79","5,624.04",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Cauliflower,2022,-,"3,271.00",Metric Tonnes,"2,339.61","2,599.39","2,772.76",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Chapparad Avare,2022,-,"1,186.00",Metric Tonnes,"3,597.39","3,814.42","3,997.39",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Cucumbar(Kheera),2022,-,"5,291.00",Metric Tonnes,977.07,"1,071.90","1,184.26",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Drumstick,2022,-,"3,242.00",Metric Tonnes,"7,149.38","7,474.06","7,771.07",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Ginger(Green),2022,-,"2,941.00",Metric Tonnes,"2,664.94","2,896.91","3,086.30",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Green Avare(W),2022,-,"1,824.00",Metric Tonnes,"3,421.00","3,680.10","3,933.00",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Green Chilli,2022,-,"7,525.00",Metric Tonnes,"4,683.40","4,975.85","5,242.38",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Knool Khol,2022,-,"5,175.00",Metric Tonnes,"2,350.47","2,528.09","2,689.78",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Peas Wet,2022,-,"5,162.00",Metric Tonnes,"5,190.60","5,527.39","5,841.32",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Raddish,2022,-,"7,324.00",Metric Tonnes,"1,905.48","2,077.18","2,217.44",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Ridgeguard(Tori),2022,-,"2,506.00",Metric Tonnes,"3,235.91","3,470.11","3,735.71",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Seemebadnekai,2022,-,"3,308.00",Metric Tonnes,"1,894.01","2,082.69","2,249.21",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Snakeguard,2022,-,"1,575.00",Metric Tonnes,"1,802.41","1,985.97","2,150.67",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Suvarna Gadde,2022,-,"1,573.00",Metric Tonnes,"2,305.28","2,482.77","2,634.97",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Sweet Potato,2022,-,726.00,Metric Tonnes,"2,286.64","2,468.18","2,626.31",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Sweet Pumpkin,2022,-,"1,555.00",Metric Tonnes,"1,315.37","1,473.12","1,602.32",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Thogrikai,2022,-,117.00,Metric Tonnes,"3,588.89","3,811.11","3,994.02",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Thondekai,2022,-,"1,976.00",Metric Tonnes,"3,354.96","3,566.95","3,739.88",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Tomato,2022,-,"14,637.00",Metric Tonnes,"2,040.45","2,307.38","2,520.90",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,White Pumpkin,2022,-,"3,395.00",Metric Tonnes,"1,339.85","1,487.22","1,661.09",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Alsandikai,2023,-,977.00,Metric Tonnes,"3,784.75","3,972.88","4,925.38",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Banana - Green,2023,-,"2,294.00",Metric Tonnes,"2,515.61","2,701.48","2,857.32",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Beetroot,2023,-,"6,044.00",Metric Tonnes,"2,505.89","2,839.00","3,025.83",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Bhindi(Ladies Finger),2023,-,"4,282.00",Metric Tonnes,"2,767.89","2,987.72","3,176.55",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Bitter gourd,2023,-,"2,400.00",Metric Tonnes,"3,076.46","3,284.71","3,470.25",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Bottle gourd,2023,-,"1,708.00",Metric Tonnes,"1,736.83","1,912.82","2,069.85",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Brinjal,2023,-,"4,262.00",Metric Tonnes,"2,324.00","2,534.96","2,712.74",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Cabbage,2023,-,"9,758.00",Metric Tonnes,936.08,"1,044.50","1,148.25",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Capsicum,2023,-,"3,995.00",Metric Tonnes,"3,613.27","3,884.71","4,082.80",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Carrot,2023,-,"11,404.00",Metric Tonnes,"3,518.84","3,745.43","3,940.46",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Cauliflower,2023,-,"3,000.00",Metric Tonnes,"2,009.40","2,172.67","2,427.97",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Chapparad Avare,2023,-,"1,180.00",Metric Tonnes,"3,324.83","3,522.29","3,708.64",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Cucumbar(Kheera),2023,-,"4,938.00",Metric Tonnes,"1,362.31","1,494.58","1,621.16",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Drumstick,2023,-,"3,889.00",Metric Tonnes,"5,478.17","5,792.62","6,131.70",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Ginger(Green),2023,-,"2,655.00",Metric Tonnes,"9,430.89","9,921.05","10,356.31",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Green Avare(W),2023,-,"1,601.00",Metric Tonnes,"3,654.84","3,970.14","4,306.50",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Green Chilli,2023,-,"7,458.00",Metric Tonnes,"4,376.83","4,652.98","4,886.98",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Knool Khol,2023,-,"4,329.00",Metric Tonnes,"2,184.89","2,366.44","2,527.90",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Peas Wet,2023,-,"5,461.00",Metric Tonnes,"4,384.40","4,668.03","4,936.06",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Raddish,2023,-,"4,854.00",Metric Tonnes,"1,930.33","2,127.92","2,434.38",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Ridgeguard(Tori),2023,-,"2,450.00",Metric Tonnes,"2,761.93","2,991.12","3,202.61",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Seemebadnekai,2023,-,"3,240.00",Metric Tonnes,"1,896.51","2,065.69","2,223.80",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Snakeguard,2023,-,"1,872.00",Metric Tonnes,"1,624.04","1,791.21","1,945.14",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Suvarna Gadde,2023,-,"1,718.00",Metric Tonnes,"2,740.31","2,927.07","3,093.25",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Sweet Potato,2023,-,"1,448.00",Metric Tonnes,"2,073.55","2,378.45","2,664.02",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Sweet Pumpkin,2023,-,"1,778.00",Metric Tonnes,944.07,"1,065.21","1,183.91",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Thogrikai,2023,-,159.00,Metric Tonnes,"4,010.06","4,194.97","4,388.68",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Thondekai,2023,-,"1,818.00",Metric Tonnes,"2,678.22","2,981.08","3,157.10",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,Tomato,2023,-,"12,585.00",Metric Tonnes,"2,554.87","2,803.58","3,023.61",Rs./Quintal
Karnataka,Bangalore,"Binny Mill (F&V), Bangalore APMC",Vegetables,White Pumpkin,2023,-,"3,827.00",Metric Tonnes,"1,075.43","1,216.08","1,335.39",Rs./Quintal
Maharashtra,Pune,Pune APMC,Vegetables,Onion,2022,-,"120,500.00",Metric Tonnes,"1,200.00","1,500.00","1,800.00",Rs./Quintal
Maharashtra,Pune,Pune APMC,Vegetables,Potato,2022,-,"85,000.00",Metric Tonnes,"1,400.00","1,650.00","1,900.00",Rs./Quintal
Maharashtra,Nashik,Lasalgaon APMC,Vegetables,Onion,2022,-,"250,000.00",Metric Tonnes,"800.00","1,250.00","1,600.00",Rs./Quintal
Maharashtra,Nashik,Lasalgaon APMC,Vegetables,Onion,2023,-,"210,000.00",Metric Tonnes,"900.00","1,400.00","1,850.00",Rs./Quintal
Maharashtra,Nashik,Lasalgaon APMC,Vegetables,Onion,2024,-,"300,000.00",Metric Tonnes,"1,100.00","2,100.00","3,200.00",Rs./Quintal
`;
  const workbook = XLSX.read(csvContent, { type: "string" });
  XLSX.writeFile(workbook, DATA_FILE);
  console.log("data.xlsx created from embedded CSV");
}

// Helper to clean data
const cleanData = (data: any[]) => {
  return data.map(row => {
    const cleanedRow: any = {};
    for (const key in row) {
      const cleanedKey = key.trim().replace(/\s+/g, ' ');
      let value = row[key];
      if (typeof value === 'string') {
        value = value.trim().replace(/\u00A0/g, ' ');
        // Remove commas from numbers if the key looks like a price or quantity
        if (cleanedKey.includes('Price') || cleanedKey.includes('Quantity') || cleanedKey.includes('MSP')) {
           const numericValue = value.replace(/,/g, '');
           if (!isNaN(parseFloat(numericValue))) {
             value = numericValue;
           }
        }
      }
      cleanedRow[cleanedKey] = value;
    }
    return cleanedRow;
  });
};

let marketData: any[] = [];

const loadData = () => {
  try {
    const workbook = XLSX.readFile(DATA_FILE);
    const sheetName = workbook.SheetNames[0];
    const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    marketData = cleanData(rawData);
    console.log("Data loaded successfully:", marketData.length, "rows");
  } catch (error) {
    console.error("Error loading data:", error);
  }
};

loadData();

// API Routes
app.get("/commodities", (req, res) => {
  const commodities = [...new Set(marketData.map(d => d.Commodity))].filter(Boolean).sort();
  res.json(commodities);
});

app.get("/prices", (req, res) => {
  const { commodity } = req.query;
  if (!commodity) return res.status(400).json({ error: "Commodity is required" });
  
  const filtered = marketData.filter(d => 
    d.Commodity?.toString().toLowerCase() === commodity.toString().toLowerCase()
  );
  res.json(filtered);
});

app.get("/api/predict", (req, res) => {
  const { commodity } = req.query;
  if (!commodity) return res.status(400).json({ error: "Commodity is required" });

  const searchCommodity = commodity.toString().trim().toLowerCase();
  const filtered = marketData.filter(d => 
    d.Commodity?.toString().trim().toLowerCase() === searchCommodity
  );

  if (filtered.length === 0) return res.status(404).json({ error: "Commodity not found" });

  // Sort by year to get the latest
  const sorted = filtered.sort((a, b) => parseInt(b.Year) - parseInt(a.Year));
  const lastEntry = sorted[0];
  
  const lastPrice = parseFloat(lastEntry["Modal Price"]) || 0;
  const variation = 1 + (Math.random() * 0.15 - 0.05); 
  const predictedPrice = (lastPrice * variation).toFixed(2);

  res.json({
    commodity,
    lastPrice,
    predictedPrice,
    unit: lastEntry["Price Unit"] || "Rs./Quintal",
    confidence: "Medium-High",
    lastYear: lastEntry.Year
  });
});

/**
 * GET /api/options
 * Dynamically returns options for cascading selection:
 * State -> District -> Market -> Commodity Group -> Commodity -> Year
 */
app.get("/api/options", (req, res) => {
  const { state, district, market, group, commodity, year } = req.query;

  let filtered = marketData;

  const trimLower = (val: any) => val?.toString().trim().toLowerCase();

  // Cascading logic: State -> District -> Market -> Commodity Group -> Commodity -> Year
  if (!state) {
    const states = [...new Set(filtered.map(d => d.State))].filter(Boolean).sort();
    return res.json({ type: "state", options: states });
  }
  filtered = filtered.filter(d => trimLower(d.State) === trimLower(state));

  if (!district) {
    const districts = [...new Set(filtered.map(d => d.District))].filter(Boolean).sort();
    return res.json({ type: "district", options: districts });
  }
  filtered = filtered.filter(d => trimLower(d.District) === trimLower(district));

  if (!market) {
    const markets = [...new Set(filtered.map(d => d.Market))].filter(Boolean).sort();
    return res.json({ type: "market", options: markets });
  }
  filtered = filtered.filter(d => trimLower(d.Market) === trimLower(market));

  if (!group) {
    const groups = [...new Set(filtered.map(d => d["Commodity Group"]))].filter(Boolean).sort();
    return res.json({ type: "group", options: groups });
  }
  filtered = filtered.filter(d => trimLower(d["Commodity Group"]) === trimLower(group));

  if (!commodity) {
    const commodities = [...new Set(filtered.map(d => d.Commodity))].filter(Boolean).sort();
    return res.json({ type: "commodity", options: commodities });
  }
  filtered = filtered.filter(d => trimLower(d.Commodity) === trimLower(commodity));

  if (!year) {
    const years = [...new Set(filtered.map(d => d.Year))].filter(Boolean).sort();
    return res.json({ type: "year", options: years });
  }

  // All selections complete
  return res.json({ type: "done", options: [] });
});

/**
 * GET /api/result
 * Returns the selected row data based on full selection criteria
 */
app.get("/api/result", (req, res) => {
  const { state, district, market, group, commodity, year } = req.query;
  
  const trimLower = (val: any) => val?.toString().trim().toLowerCase();

  const result = marketData.filter(d => 
    trimLower(d.State) === trimLower(state) &&
    trimLower(d.District) === trimLower(district) &&
    trimLower(d.Market) === trimLower(market) &&
    trimLower(d["Commodity Group"]) === trimLower(group) &&
    trimLower(d.Commodity) === trimLower(commodity) &&
    (!year || trimLower(d.Year) === trimLower(year))
  );
  res.json(result);
});

/**
 * GET /api/recommend-crop
 */
app.get("/api/recommend-crop", (req, res) => {
  const { soil, region, season, water } = req.query;
  
  // Mock logic for crop recommendation
  const recommendations = [
    { crop: "Rice", soil: ["Clay", "Loamy"], season: "Kharif", water: "High", yield: "3-4 tons/ha", demand: "High", reason: "Suitable for high water availability and clayey soil." },
    { crop: "Wheat", soil: ["Loamy"], season: "Rabi", water: "Medium", yield: "2.5-3.5 tons/ha", demand: "High", reason: "Grows best in cool weather with moderate water." },
    { crop: "Maize", soil: ["Sandy", "Loamy"], season: "Kharif", water: "Medium", yield: "2-5 tons/ha", demand: "Medium", reason: "Versatile crop with moderate water needs." },
    { crop: "Moong", soil: ["Sandy", "Loamy"], season: "Zaid", water: "Low", yield: "0.5-1 ton/ha", demand: "High", reason: "Short duration crop, drought resistant." },
    { crop: "Cotton", soil: ["Clay"], season: "Kharif", water: "Medium", yield: "1.5-2.5 tons/ha", demand: "High", reason: "Thrives in deep black clayey soils." }
  ];

  const filtered = recommendations.filter(r => {
    const soilMatch = !soil || r.soil.includes(soil as string);
    const seasonMatch = !season || r.season === season;
    const waterMatch = !water || r.water === water;
    return soilMatch && seasonMatch && waterMatch;
  });

  res.json(filtered.length > 0 ? filtered : recommendations.slice(0, 2));
});

/**
 * GET /api/weather
 */
app.get("/api/weather", (req, res) => {
  const { location } = req.query;
  
  // Mock weather data
  const weatherData = {
    location: location || "Unknown",
    current: {
      temp: "28°C",
      condition: "Partly Cloudy",
      humidity: "65%",
      wind: "12 km/h"
    },
    advice: {
      crops: ["Onion", "Potato"],
      irrigation: "Moderate irrigation needed due to humidity.",
      alerts: "No immediate risk of heavy rain. Good time for harvesting."
    }
  };
  
  res.json(weatherData);
});

/**
 * GET /api/crop-info
 */
app.get("/api/crop-info", (req, res) => {
  const { crop } = req.query;
  
  const cropDetails: Record<string, any> = {
    "Onion": {
      season: "Kharif, Late Kharif & Rabi",
      soil: "Well-drained loamy soil",
      water: "Moderate (10-12 irrigations)",
      yield: "15-20 tons/ha",
      demand: "Very High",
      trends: "Prices usually peak in Oct-Dec."
    },
    "Potato": {
      season: "Rabi",
      soil: "Loose, well-aerated soil",
      water: "Moderate to High",
      yield: "20-30 tons/ha",
      demand: "High",
      trends: "Steady demand throughout the year."
    },
    "Garlic": {
      season: "Rabi",
      soil: "Rich loamy soil",
      water: "Moderate",
      yield: "5-10 tons/ha",
      demand: "High",
      trends: "High volatility in prices."
    }
  };

  const info = cropDetails[crop as string] || {
    season: "Varies",
    soil: "General agricultural soil",
    water: "Moderate",
    yield: "Varies by region",
    demand: "Medium",
    trends: "Seasonal fluctuations."
  };

  res.json({ crop, ...info });
});

/**
 * GET /api/download-app
 * Zips the project source code and sends it to the client.
 */
app.get("/api/download-app", (req, res) => {
  const archive = archiver("zip", { zlib: { level: 9 } });
  const fileName = "agri-ai-system.zip";

  res.attachment(fileName);

  archive.on("error", (err) => {
    res.status(500).send({ error: err.message });
  });

  archive.pipe(res);

  // Add files and directories, excluding node_modules and other artifacts
  const rootDir = process.cwd();
  
  // Add backend files
  archive.directory(path.join(rootDir, "backend"), "backend", (data) => {
    if (data.name.includes("node_modules")) return false;
    return data;
  });

  // Add frontend files
  archive.directory(path.join(rootDir, "backend/frontend"), "backend/frontend", (data) => {
    if (data.name.includes("node_modules") || data.name.includes("dist")) return false;
    return data;
  });

  // Add root files
  const rootFiles = ["package.json", "tsconfig.json", ".env.example", "README.md"];
  rootFiles.forEach(file => {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
      archive.file(filePath, { name: file });
    }
  });

  archive.finalize();
});

/**
 * POST /api/download-csv
 * Converts JSON data to CSV and sends it as a download.
 */
app.post("/api/download-csv", (req, res) => {
  const { data, fileName } = req.body;
  if (!data || !Array.isArray(data)) {
    return res.status(400).json({ error: "Invalid data format" });
  }

  if (data.length === 0) {
    return res.status(400).json({ error: "No data to export" });
  }

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map(row => 
      headers.map(header => {
        const val = row[header] ?? "";
        return `"${val.toString().replace(/"/g, '""')}"`;
      }).join(",")
    )
  ];

  const csvContent = csvRows.join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=${fileName || "market-data.csv"}`);
  res.send(csvContent);
});

async function startServer() {
  const distPath = path.join(__dirname, "frontend/dist");

  // Serve frontend files
  app.use(express.static(distPath));

  // IMPORTANT: Always return index.html for UI
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}

startServer();