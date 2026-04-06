import requests

api_key = "0e51de0e74e3a96084f8210439af5ba4"
location = "Hyderabad,IN"
geo_url = "http://api.openweathermap.org/geo/1.0/direct"
geo_params = {"q": location, "limit": 1, "appid": api_key}

try:
    geo_resp = requests.get(geo_url, params=geo_params, timeout=10)
    geo_resp.raise_for_status()
    geo_data = geo_resp.json()
    print("Geo response:", geo_data)
    if not geo_data:
        print(f"Location '{location}' not found.")
    else:
        lat = geo_data[0]["lat"]
        lon = geo_data[0]["lon"]
        url = "https://api.openweathermap.org/data/2.5/onecall"
        params = {
            "lat": lat,
            "lon": lon,
            "exclude": "current,minutely,hourly,alerts",
            "appid": api_key,
            "units": "metric"
        }
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        print("Forecast response:", data)
        if "daily" not in data or len(data["daily"]) < 2:
            print("Weather data unavailable.")
        else:
            tomorrow = data["daily"][1]
            desc = tomorrow["weather"][0]["description"].capitalize()
            temp = tomorrow["temp"]["day"]
            rain = tomorrow.get("rain", 0)
            msg = f"Tomorrow in {location}: {desc}, Temp: {temp}°C, Rain: {rain}mm."
            print(msg)
except requests.Timeout:
    print("Weather service timed out. Please try again later.")
except requests.RequestException as e:
    print(f"Weather service error: {str(e)}")
except Exception as e:
    print(f"Unexpected error: {str(e)}")
