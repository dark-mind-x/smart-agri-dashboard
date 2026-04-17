import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";
import { getAnalytics } from "firebase/analytics";
import './App.css';

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

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);

function App() {
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard'); // New Tab State
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
          phValue: data.phValue || 0,
          nitrogen: data.nitrogen || 0,
          phosphorus: data.phosphorus || 0,
          potassium: data.potassium || 0
        };

        setCurrentData(newData);
        setHistory(prevHistory => {
          const updatedHistory = [newData, ...prevHistory];
          // Keep the last 50 readings for the history table
          if (updatedHistory.length > 50) updatedHistory.pop(); 
          return updatedHistory;
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const getRecommendations = () => {
    const suggestions = [];
    if (currentData.soilMoisture < 30 && currentData.rainIntensity < 20) suggestions.push("💧 Soil is dry. Turn on the water pump.");
    if (currentData.phValue > 0) {
      if (currentData.phValue < 6.0) suggestions.push("🧪 Acidic Soil: Add agricultural lime.");
      else if (currentData.phValue > 7.5) suggestions.push("🧪 Alkaline Soil: Add elemental sulfur.");
    }
    if (currentData.nitrogen < 40) suggestions.push("🌱 Low Nitrogen: Add Urea or Compost.");
    if (currentData.phosphorus < 30) suggestions.push("🌸 Low Phosphorus: Add Bone Meal.");
    if (currentData.potassium < 80) suggestions.push("🍌 Low Potassium: Add Wood Ash.");
    
    if (suggestions.length === 0 && currentData.temperature !== 0) suggestions.push("✅ Soil health is optimal!");
    else if (currentData.temperature === 0) suggestions.push("⏳ Waiting for sensor data...");
    
    return suggestions;
  };

  return (
    <div className="dashboard-container">
      <header className="header">
        <div>
          <h1>SmartAgri</h1>
          <p>Real-time Monitoring</p>
        </div>
        <nav className="nav-tabs">
          <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
          <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>History</button>
        </nav>
      </header>

      {activeTab === 'dashboard' ? (
        <div className="layout-grid">
          <div className="main-panel">
            <div className="card chart-card">
              <h3>📈 Live NPK Trends</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[...history].reverse()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="time" stroke="#888" tick={{fontSize: 12}} />
                    <YAxis stroke="#888" />
                    <Tooltip contentStyle={{backgroundColor: '#1e1e1e', borderColor: '#333'}} />
                    <Legend />
                    <Line type="monotone" dataKey="nitrogen" stroke="#00d2ff" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="phosphorus" stroke="#b14bf4" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="potassium" stroke="#ff512f" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="recommendation-panel">
              <h2>⚡ Action Center</h2>
              <ul className="suggestion-list">
                {getRecommendations().map((rec, index) => (
                  <li key={index} className="suggestion-item">{rec}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="side-panel">
            <div className="card stat-card">
              <h3>🌡️ Environment</h3>
              <div className="stat-row"><span>Temp</span> <strong>{currentData.temperature}°C</strong></div>
              <div className="stat-row"><span>Humidity</span> <strong>{currentData.humidity}%</strong></div>
              <div className="stat-row"><span>Rain</span> <strong>{currentData.rainIntensity}%</strong></div>
            </div>

            <div className="card stat-card">
              <h3>🌍 Soil Health</h3>
              <div className="stat-row"><span>Moisture</span> <strong>{currentData.soilMoisture}%</strong></div>
              <div className="stat-row"><span>pH Level</span> <strong>{typeof currentData.phValue === 'number' ? currentData.phValue.toFixed(1) : currentData.phValue}</strong></div>
              <div className="stat-row"><span>Nitrogen</span> <strong className="text-blue">{currentData.nitrogen} mg</strong></div>
              <div className="stat-row"><span>Phosphorus</span> <strong className="text-purple">{currentData.phosphorus} mg</strong></div>
              <div className="stat-row"><span>Potassium</span> <strong className="text-orange">{currentData.potassium} mg</strong></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card history-card">
          <h3>🕒 Recent Readings</h3>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Temp</th>
                  <th>Hum</th>
                  <th>Moist</th>
                  <th>pH</th>
                  <th>N-P-K</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row, i) => (
                  <tr key={i}>
                    <td>{row.time}</td>
                    <td>{row.temperature}°C</td>
                    <td>{row.humidity}%</td>
                    <td>{row.soilMoisture}%</td>
                    <td>{typeof row.phValue === 'number' ? row.phValue.toFixed(1) : row.phValue}</td>
                    <td>{row.nitrogen}-{row.phosphorus}-{row.potassium}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default App;
