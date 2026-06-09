import { useState } from 'react';
import { Calendar, RefreshCw, Layers, Sparkles } from 'lucide-react';
import { OffsetCalculator } from './components/OffsetCalculator';
import { IntervalCalculator } from './components/IntervalCalculator';
import { LunarCalculator } from './components/LunarCalculator';
import { PrivacyBanner } from './components/PrivacyBanner';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<'offset' | 'interval' | 'lunar'>('offset');

  return (
    <div className="app-container fade-in">
      {/* Header */}
      <header className="app-header">
        <div className="logo-container">
          <Calendar className="logo-icon" size={36} />
          <h1 className="app-title">ChronoSphere</h1>
        </div>
        <p className="app-subtitle">
          时区与夏令时审计感知的高精度日期计算器，支持跨国家/地区时区计算、DST 变更审计与中国农历计算。
        </p>
      </header>

      {/* Tabs */}
      <div className="tabs-container" style={{ maxWidth: '600px' }}>
        <button
          className={`tab-btn ${activeTab === 'offset' ? 'active' : ''}`}
          onClick={() => setActiveTab('offset')}
        >
          <RefreshCw size={16} />
          日期偏移计算
        </button>
        <button
          className={`tab-btn ${activeTab === 'interval' ? 'active' : ''}`}
          onClick={() => setActiveTab('interval')}
        >
          <Layers size={16} />
          日期区间计算
        </button>
        <button
          className={`tab-btn ${activeTab === 'lunar' ? 'active' : ''}`}
          onClick={() => setActiveTab('lunar')}
        >
          <Sparkles size={16} />
          农历日期计算
        </button>
      </div>

      {/* Calculator Body */}
      <main className="main-card">
        {activeTab === 'offset' && <OffsetCalculator />}
        {activeTab === 'interval' && <IntervalCalculator />}
        {activeTab === 'lunar' && <LunarCalculator />}
      </main>

      {/* Privacy Guarantee */}
      <PrivacyBanner />

      {/* Footer */}
      <footer className="app-footer">
        <div>
          © {new Date().getFullYear()} ChronoSphere. All calculations computed locally.
        </div>
        <div>
          Deployable on <a href="https://vercel.com" target="_blank" rel="noreferrer" className="footer-link">Vercel</a>.
        </div>
      </footer>
    </div>
  );
}

export default App;
