const recommendations = [
  {
    type: 'Outer Walls',
    material: 'Red Brick',
    logic: 'High compressive strength and weather resistance for structural stability.',
  },
  {
    type: 'Inner Walls',
    material: 'AAC Block',
    logic: 'Lightweight and thermally efficient for interior partitioning.',
  },
  {
    type: 'Roof',
    material: 'Insulated Metal Deck',
    logic: 'Durable with superior thermal performance and low maintenance.',
  },
];

const MaterialIntelligence = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-4">
      <div className="h-4 w-1 bg-blue-600 rounded-full" />
      <h2 className="text-xs font-black tracking-[0.15em] text-slate-400 uppercase">
        Material Logic
      </h2>
    </div>
    
    {recommendations.map((item) => (
      <div key={item.type} className="bg-white border border-slate-200 p-5 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all">
        <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1">{item.type}</p>
        <p className="text-base font-bold text-slate-900">{item.material}</p>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed italic">{item.logic}</p>
      </div>
    ))}

    <div className="mt-6 p-5 rounded-2xl bg-blue-50/50 border border-blue-100">
      <p className="text-[10px] font-bold text-blue-700 uppercase mb-2">Automated Insight</p>
      <p className="text-xs text-slate-600 leading-relaxed">
        Wall selections optimized for structural fidelity and thermal efficiency.
      </p>
    </div>
  </div>
);

export default MaterialIntelligence;
