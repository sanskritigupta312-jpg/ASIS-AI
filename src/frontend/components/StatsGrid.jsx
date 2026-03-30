const StatsGrid = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2">
    {[
      { label: 'Accuracy', value: '95%+', sub: 'Structural Fidelity' },
      { label: 'Processing', value: 'Instant', sub: '2D to 3D Conversion [cite: 31]' },
      { label: 'Interface', value: 'React', sub: 'Scalable UI [cite: 48]' },
      { label: 'Engine', value: 'OpenCV', sub: 'Edge Detection [cite: 56]' },
    ].map((stat) => (
      <div key={stat.label} className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl text-center">
        <p className="text-blue-500 text-xl font-black">{stat.value}</p>
        <p className="text-[10px] font-bold text-slate-300 uppercase mt-1">{stat.label}</p>
        <p className="text-[9px] text-slate-600 mt-1">{stat.sub}</p>
      </div>
    ))}
  </div>
);

export default StatsGrid;
