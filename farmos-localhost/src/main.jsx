import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/500.css';
import '@fontsource/barlow/600.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/vt323/400.css';
import './index.css';
import App from './App.jsx';

// Jika antara muka ranap, tunjuk mesej dan butang muat semula, bukan halaman kosong.
class Guard extends React.Component {
  constructor(props) { super(props); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div role="alert" className="mx-auto mt-24 max-w-md rounded-lg border border-warn bg-panel p-5 text-center">
        <h1 className="font-display text-2xl font-semibold">FarmOS terhenti</h1>
        <p className="mt-2 text-[14px] text-mute">Berlaku ralat paparan: {String(this.state.err?.message || this.state.err)}. Data anda selamat dalam pangkalan data.</p>
        <button onClick={() => window.location.reload()} className="mt-4 rounded-md bg-hivis px-4 py-2 font-semibold text-hivis-ink">Muat semula halaman</button>
      </div>
    );
  }
}

createRoot(document.getElementById('root')).render(<Guard><App /></Guard>);
