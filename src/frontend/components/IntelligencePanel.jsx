const IntelligencePanel = ({ visible }) => (
  <div className={`space-y-6 transition-opacity duration-700 ${visible ? 'opacity-100' : 'opacity-30'}`}>
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
      <h3 className="text-blue-500 font-bold uppercase text-xs tracking-[0.2em] mb-4">Material Selection</h3>
      <div className="space-y-4">
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
          <p className="text-slate-400 text-xs">Outer Walls [cite: 98]</p>
          <p className="font-bold text-white">Red Brick [cite: 99]</p>
          <p className="text-[10px] text-slate-500 mt-1 italic">High compressive strength, weather resistant [cite: 100]</p>
        </div>
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
          <p className="text-slate-400 text-xs">Inner Walls [cite: 101]</p>
          <p className="font-bold text-white">AAC Block [cite: 102]</p>
          <p className="text-[10px] text-slate-500 mt-1 italic">Lightweight, thermal insulation [cite: 103]</p>
        </div>
      </div>
    </div>

    <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-3xl">
      <h3 className="text-white font-bold text-sm mb-2">AI Explanation [cite: 105]</h3>
      <p className="text-xs text-slate-400 leading-relaxed italic">
        "Red brick selected for outer walls due to superior compressive strength... AAC blocks recommended for inner walls to optimize cost efficiency." [cite: 106]
      </p>
    </div>
  </div>
);

export default IntelligencePanel;
