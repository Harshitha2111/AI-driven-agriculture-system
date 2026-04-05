# FastAPI backend for AI-driven Agriculture System
#
# How to run (development):
#
# 1. Open a terminal in backend_fastapi/
# 2. Create a virtual environment:
#    python -m venv venv
# 3. Activate the virtual environment:
#    - On Windows: venv\Scripts\activate
#    - On Mac/Linux: source venv/bin/activate
# 4. Install dependencies:
#    pip install -r requirements.txt
# 5. Copy .env.example to .env and set your MongoDB connection string (already set)
# 6. Run the server:
#    uvicorn main:app --reload --port 8000
#
# The API will be available at http://localhost:8000
#
# Frontend (React):
# 1. Open a new terminal in frontend/
# 2. Run:
#    npm install
#    npm run dev
# 3. The frontend will run at http://localhost:5173
#
# Make sure the frontend is configured to call the backend at http://localhost:8000
