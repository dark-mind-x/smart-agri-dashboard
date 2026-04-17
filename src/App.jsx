import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";
import { getAnalytics } from "firebase/analytics";
import './App.css';

// Your live Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBAnm3fun_s3wm88Rmu7KPP4T00wjauvic",
  authDomain: "smartagri-25418.firebaseapp.com",
  databaseURL: "https://smartagri-25418-default-rtdb.firebaseio.com",
  projectId: "smartagri-25418",
  storageBucket: "smartagri-25418.firebasestorage.app",
  messagingSenderId: "1055934372092",
  appId: "1:1055934372092:web:d4efb3f76b4bfd8a439f79",
  measurementId: "G-3T41E3088M"
};

// Initialize Firebase App, Analytics, and Realtime Database
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);

function App() {
  const [history, setHistory] = useState([]);
  
  // Added phValue to the initial state
  const [currentData, setCurrentData] = useState({
    temperature: 0, humidity: 0, soilMoisture: 0, rainIntensity: 0, phValue: 0, nitrogen: 0, phosphorus: 0, potassium: 0
  });

  useEffect(() => {
    const dataRef = ref(database, 'agriData');
    
    const unsubscribe = onValue(dataRef, (snapshot) => {
      const data = snapshot.val();
      
      if (data) {
        const newData = {
          time: new Date().toLocaleTimeString(),
          temperature: data.temperature || 0,
          humidity: data.humidity || 0,
          soilMoisture: data.soilMoisture || 0,
          rainIntensity: data.rainIntensity || 0,
          phValue: data.phValue || 0, // Mapping the new pH data
          nitrogen: data.nitrogen || 0,
          phosphorus: data.phosphorus || 0,
          potassium: data.potassium || 0
        };

        setCurrentData(newData);
        
        setHistory(prevHistory => {
          const updatedHistory = [...prevHistory, newData];
          if (updatedHistory.length > 7) {
            updatedHistory.shift(); 
          }
          return updatedHistory;
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Updated Recommendation Engine Logic to include pH
  const getRecommendations = () => {
    const suggestions = [];
    
    if (currentData.soilMoisture < 30 && currentData.rainIntensity < 20) {
      suggestions.push("💧 Soil is dry and no rain detected. Turn on the water pump.");
    }
    
    // pH Recommendations
    if (currentData.phValue > 0) { // Ensure we have a real reading before recommending
      if (currentData.phValue < 6.0) {
        suggestions.push("🧪 Soil is too Acidic: Add agricultural lime or wood ash to raise the pH.");
      } else if (currentData.phValue > 7.5) {
        suggestions.push("🧪 Soil is too Alkaline: Add elemental sulfur, peat moss, or pine needles to lower the pH.");
      }
    }

    if (currentData.nitrogen < 40) {
      suggestions.push("🌱 Low Nitrogen: Add Cow Dung Compost or Urea to promote leaf growth.");
    }
    if (currentData.phosphorus < 30) {
      suggestions.push("🌸 Low Phosphorus: Add Bone Meal or Rock Phosphate to strengthen roots.");
    }
    if (currentData.potassium < 80) {
      suggestions.push("🍌 Low Potassium: Add Banana Peel Fertilizer or Wood Ash to boost immunity.");
    }
    
    if (suggestions.length === 0 && currentData.temperature !== 0) {
      suggestions.push("✅ Soil health is optimal! No action needed right now.");
    } else if (currentData.temperature === 0) {
      suggestions.push("⏳ Waiting for sensor data from the ESP32...");
    }
    
    return suggestions;
  };

  return (
    <div className="dashboard-container">
      <header className="header">
        <h1>Smart Agriculture Monitor</h1>
        <p>Real-time Soil & Weather Stats</p>
      </header>

      <div className="layout-grid">
        
        <div className="left-column">
          <div className="card chart-card">
            <h3>📈 Live NPK Trends</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="time" tick={{fontSize: 12}} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="nitrogen" stroke="#3498db" strokeWidth={3} name="Nitrogen" />
                  <Line type="monotone" dataKey="phosphorus" stroke="#9b59b6" strokeWidth={3} name="Phosphorus" />
                  <Line type="monotone" dataKey="potassium" stroke="#e67e22" strokeWidth={3} name="Potassium" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="right-column">
          <div className="card">
            <h3>🌡️ Environment</h3>
            <div className="stat-row"><span>Temperature:</span> <strong>{currentData.temperature} °C</strong></div>
            <div className="stat-row"><span>Humidity:</span> <strong>{currentData.humidity} %</strong></div>
            <div className="stat-row"><span>Rain Intensity:</span> <strong>{currentData.rainIntensity} %</strong></div>
          </div>

          <div className="card">
            <h3>🌍 Soil Health</h3>
            <div className="stat-row"><span>Soil Moisture:</span> <strong>{currentData.soilMoisture} %</strong></div>
            {/* New pH Value display row */}
            <div className="stat-row"><span>Soil pH Level:</span> <strong>{typeof currentData.phValue === 'number' ? currentData.phValue.toFixed(1) : currentData.phValue}</strong></div>
            <div className="stat-row"><span>Nitrogen (N):</span> <strong>{currentData.nitrogen} mg/kg</strong></div>
            <div className="stat-row"><span>Phosphorus (P):</span> <strong>{currentData.phosphorus} mg/kg</strong></div>
            <div className="stat-row"><span>Potassium (K):</span> <strong>{currentData.potassium} mg/kg</strong></div>
          </div>

          <div className="recommendation-panel">
            <h2>🛠️ Action Center</h2>
            <ul className="suggestion-list">
              {getRecommendations().map((rec, index) => (
                <li key={index} className="suggestion-item">{rec}</li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  )
}

export default App;
