import { useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import ThreeDViewer from './ThreeDViewer';
import BlockchainPanel from './BlockchainPanel';

/* ── tiny helpers ─────────────────────────────────────────────────────────── */
const Chip = ({ children, color = 'default' }) => {
  const colors = {
    default: { bg: '#f1f5f9', text: '#475569' },
    red:     { bg: '#fef2f2', text: '#dc2626' },
    yellow:  { bg: '#fffbeb', text: '#d97706' },
    blue:    { bg: '#eff6ff', text: '#2563eb' },
    green:   { bg: '#f0fdf4', text: '#16a34a' },
  };
  const c = colors[color] || colors.default;
  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.text }}
    >
      {children}
    </span>
  );
};

const Card = ({ title, children, className = '' }) => (
  <div className={`card p-5 space-y-3 ${className}`}>
    {title && <p className="label" style={{ color: 'var(--text-3)' }}>{title}</p>}
    {children}
  </div>
);

const KV = ({ label, value, valueStyle }) => (
  <div className="flex justify-between items-center py-1.5 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
    <span className="text-sm" style={{ color: 'var(--text-2)' }}>{label}</span>
    <span className="text-sm font-semibold" style={{ color: 'var(--text-1)', ...valueStyle }}>{value ?? '—'}</span>
  </div>
);

/* ── main component ───────────────────────────────────────────────────────── */
export default function Dashboard({ uploadUrl, modelUrl, blueprintUrl, overlayUrl, analysis, block }) {
  const s       = analysis?.summary;
  const walls    = analysis?.walls;
  const rooms    = analysis?.rooms ?? [];
  const border   = analysis?.border;
  const mats     = analysis?.materials;
  const graph    = analysis?.graph;
  const recs     = analysis?.material_recommendations ?? [];
  const expl     = analysis?.explainability;
  const validation = analysis?.validation ?? { issues: [] };
  const optimization = analysis?.optimization_recommendations ?? [];
  const pricing = analysis?.material_prices ?? { source: 'fallback', prices: {} };
  const costBreakdown = analysis?.cost_breakdown ?? [];
  const multistorey = analysis?.multistorey ?? { is_multistorey: false, floor_count: 1, floors: [] };
  const robustness = analysis?.robustness ?? {};

  const [pdfLoading, setPdfLoading] = useState(false);
  const [activeView, setActiveView] = useState('3d');
  const glCanvasRef = useRef(null);

  const getViewUrl = () => {
    switch (activeView) {
      case 'input': return uploadUrl;
      case 'blueprint': return blueprintUrl;
      case 'overlay': return overlayUrl;
      case '3d':
      default: return modelUrl;
    }
  };

  /* ── PDF ──────────────────────────────────────────────────────────────── */
  const downloadPDF = async () => {
    setPdfLoading(true);
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const PW = 210, PH = 297, M = 14, UW = PW - M * 2;
      let y = 0;

      const newPage = () => { doc.addPage(); y = M; };
      const checkY  = (n) => { if (y + n > PH - M) newPage(); };

      const heading = (text) => {
        checkY(14);
        doc.setFillColor(15, 23, 42);
        doc.rect(M, y, UW, 8, 'F');
        doc.setFontSize(10); doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(text, M + 3, y + 5.5);
        y += 12;
      };

      const kv = (label, value) => {
        checkY(7);
        doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139);
        doc.text(label, M + 2, y);
        doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42);
        doc.text(String(value ?? '—'), M + 72, y);
        y += 6.5;
      };

      const tHead = (cols) => {
        checkY(8);
        doc.setFillColor(241, 245, 249);
        doc.rect(M, y - 1, UW, 7, 'F');
        doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(71, 85, 105);
        cols.forEach(({ t, x }) => doc.text(t, M + x, y + 4));
        y += 8;
      };

      const tRow = (cols, i) => {
        checkY(7);
        if (i % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(M, y - 1, UW, 6.5, 'F'); }
        doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 30, 30);
        cols.forEach(({ t, x }) => doc.text(String(t ?? '—'), M + x, y + 4));
        y += 6.5;
      };

      /* Page 1 — cover + 3D */
      doc.setFillColor(15, 23, 42); doc.rect(0, 0, PW, PH, 'F');
      doc.setFillColor(37, 99, 235); doc.rect(0, 0, PW, 36, 'F');
      doc.setFontSize(20); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
      doc.text('ASIS AI', M, 16);
      doc.setFontSize(11); doc.setFont('helvetica', 'normal');
      doc.text('Floor Plan Analysis Report', M, 25);
      doc.setFontSize(8); doc.setTextColor(147, 197, 253);
      doc.text(`Generated: ${new Date().toLocaleString()}`, M, 32);

      const glCanvas = glCanvasRef.current;
      if (glCanvas) {
        try {
          const img = glCanvas.toDataURL('image/jpeg', 0.95);
          const ratio = glCanvas.height / glCanvas.width;
          const ih = Math.min(UW * ratio, 110);
          doc.addImage(img, 'JPEG', M, 42, UW, ih);
          y = 42 + ih + 8;
        } catch { y = 42; }
      } else { y = 42; }

      if (s) {
        const stats = [['Floor Area', `${s.floor_area_m2} m²`], ['Rooms', s.total_rooms], ['Wall Length', `${s.total_wall_length_m} m`], ['Wall Height', `${s.wall_height_m} m`]];
        const bw = UW / 4;
        stats.forEach(([label, val], i) => {
          const bx = M + i * bw;
          doc.setFillColor(22, 33, 55); doc.setDrawColor(37, 55, 90);
          doc.roundedRect(bx + 1, y, bw - 2, 18, 2, 2, 'FD');
          doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139);
          doc.text(label.toUpperCase(), bx + bw / 2, y + 6, { align: 'center' });
          doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(96, 165, 250);
          doc.text(String(val), bx + bw / 2, y + 14, { align: 'center' });
        });
        y += 22;
      }

      /* Page 2 — analysis */
      newPage();
      doc.setFillColor(255, 255, 255); doc.rect(0, 0, PW, PH, 'F');

      heading('1. Border Detection');
      if (border) {
        kv('Image Dimensions', `${analysis?.image?.width_px} × ${analysis?.image?.height_px} px`);
        kv('Plan Width', `${border.width_m} m`);
        kv('Plan Height', `${border.height_m} m`);
        kv('Total Plan Area', `${border.total_area_m2} m²`);
      }
      y += 4;

      heading('2. Wall Analysis');
      if (walls) {
        kv('Outer Walls (Load-Bearing)', walls.outer_count);
        kv('Inner Walls (Partition)', walls.inner_count);
        kv('Total Wall Length', `${walls.total_length_m} m`);
        kv('Outer Material', mats?.outer_wall);
        kv('Inner Material', mats?.inner_wall);
        kv('Structural Material', mats?.structural);
      }
      y += 4;

      heading('3. Outer Walls');
      tHead([{ t: '#', x: 0 }, { t: 'Length', x: 12 }, { t: 'Material', x: 38 }, { t: 'From', x: 80 }, { t: 'To', x: 128 }]);
      walls?.outer?.forEach((w, i) => tRow([{ t: w.id, x: 0 }, { t: `${w.length_m} m`, x: 12 }, { t: w.material, x: 38 }, { t: `(${w.x1},${w.y1})`, x: 80 }, { t: `(${w.x2},${w.y2})`, x: 128 }], i));
      y += 4;

      heading('4. Inner Walls');
      if (walls?.inner?.length) {
        tHead([{ t: '#', x: 0 }, { t: 'Length', x: 12 }, { t: 'Material', x: 38 }, { t: 'From', x: 80 }, { t: 'To', x: 128 }]);
        walls.inner.forEach((w, i) => tRow([{ t: w.id, x: 0 }, { t: `${w.length_m} m`, x: 12 }, { t: w.material, x: 38 }, { t: `(${w.x1},${w.y1})`, x: 80 }, { t: `(${w.x2},${w.y2})`, x: 128 }], i));
      } else { doc.setFontSize(9); doc.setTextColor(150, 150, 150); doc.text('No inner walls detected.', M + 2, y); y += 7; }
      y += 4;

      heading('5. Rooms');
      if (rooms.length) {
        tHead([{ t: '#', x: 0 }, { t: 'Type', x: 10 }, { t: 'W (m)', x: 68 }, { t: 'H (m)', x: 88 }, { t: 'Area (m²)', x: 108 }, { t: 'Perim.', x: 138 }]);
        rooms.forEach((r, i) => tRow([{ t: r.id, x: 0 }, { t: r.label, x: 10 }, { t: r.width_m, x: 68 }, { t: r.height_m, x: 88 }, { t: r.area_m2, x: 108 }, { t: r.perimeter_m, x: 138 }], i));
      } else { doc.setFontSize(9); doc.setTextColor(150, 150, 150); doc.text('No rooms detected.', M + 2, y); y += 7; }
      y += 4;

      heading('6. Materials');
      kv('Outer / Load-Bearing', mats?.outer_wall_name);
      kv('Inner / Partition', mats?.inner_wall_name);
      kv('Structural', mats?.structural_name);
      y += 4;

      heading('7. Cost Breakdown');
      if (costBreakdown.length) {
        tHead([{ t: 'Item', x: 0 }, { t: 'Material', x: 36 }, { t: 'Volume', x: 92 }, { t: 'Cost', x: 124 }]);
        costBreakdown.forEach((item, i) => {
          tRow([
            { t: item.wall_id === 'slab' ? 'Slab' : `W${item.wall_id}`, x: 0 },
            { t: item.material, x: 36 },
            { t: `${item.volume_m3} m³`, x: 92 },
            { t: `₹ ${item.cost}`, x: 124 },
          ], i);
        });
        y += 4;
      } else {
        doc.setFontSize(9); doc.setTextColor(150, 150, 150); doc.text('No cost breakdown available.', M + 2, y); y += 7;
      }

      heading('8. Optimization Recommendations');
      if (optimization.length) {
        optimization.slice(0, 6).forEach((text, i) => {
          checkY(8);
          doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 30, 30);
          const lines = doc.splitTextToSize(text, UW - 4);
          doc.text(lines, M + 2, y); y += lines.length * 4 + 2;
        });
      } else {
        doc.setFontSize(9); doc.setTextColor(150, 150, 150); doc.text('No optimization recommendations were generated.', M + 2, y); y += 7;
      }
      y += 4;

      // Stage 05: Explainability
      if (expl) {
        heading('7. AI Structural Analysis');
        if (expl.narrative) {
          const lines = doc.splitTextToSize(expl.narrative, UW - 4);
          checkY(lines.length * 4.5 + 4);
          doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 30, 30);
          doc.text(lines, M + 2, y); y += lines.length * 4.5 + 4;
        }
        if (expl.formula) {
          checkY(8);
          doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(29, 78, 216);
          doc.text('Formula: ', M + 2, y);
          doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 30, 30);
          doc.text(expl.formula, M + 22, y); y += 7;
        }
        if (expl.concerns?.length) {
          y += 2;
          heading('8. Structural Concerns');
          expl.concerns.forEach((c, i) => {
            checkY(12);
            doc.setFontSize(8); doc.setFont('helvetica', 'bold');
            doc.setTextColor(c.severity === 'critical' ? 220 : 180, c.severity === 'critical' ? 38 : 120, 38);
            doc.text(`${c.severity.toUpperCase()} — ${c.room} (${c.span_m}m ${c.axis} span)`, M + 2, y); y += 5;
            doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60);
            const ml = doc.splitTextToSize(c.message, UW - 4);
            doc.text(ml, M + 2, y); y += ml.length * 4 + 3;
          });
        }
        // Ranked options table
        y += 2;
        heading('9. Ranked Material Options');
        recs.slice(0, 6).forEach((r) => {
          checkY(10);
          doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(29, 78, 216);
          doc.text(`W${r.wall_id} — ${r.wall_type}`, M + 2, y); y += 5;
          (r.ranked_options ?? []).forEach((opt) => {
            checkY(6);
            doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 30, 30);
            doc.text(`  #${opt.rank} ${opt.material} — Score ${opt.score} (Cost ${opt.cost}/5, Str ${opt.strength}/5, Dur ${opt.durability}/5)`, M + 2, y); y += 5;
          });
          y += 2;
        });
      }

      if (block) {
        y += 4;
        heading('7. Blockchain Record');
        kv('Block #', block.index);
        kv('Timestamp', new Date(block.timestamp).toLocaleString());
        kv('Floor Area Encoded', `${block.floorArea} m²`);
        kv('Rooms Encoded', block.rooms);
        y += 3;
        doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(5, 150, 105);
        doc.text('Block Hash:', M + 2, y); y += 5;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(30, 30, 30);
        const hl = doc.splitTextToSize(block.hash, UW - 4);
        doc.text(hl, M + 2, y); y += hl.length * 4 + 2;
        doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(5, 150, 105);
        doc.text('Previous Hash:', M + 2, y); y += 5;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(30, 30, 30);
        const pl = doc.splitTextToSize(block.prevHash, UW - 4);
        doc.text(pl, M + 2, y);
      }

      /* Footer */
      const total = doc.getNumberOfPages();
      for (let p = 1; p <= total; p++) {
        doc.setPage(p);
        doc.setDrawColor(226, 232, 240); doc.line(M, PH - 10, PW - M, PH - 10);
        doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(148, 163, 184);
        doc.text(`ASIS AI Floor Plan Report  ·  Page ${p} of ${total}`, M, PH - 5);
        doc.text(new Date().toLocaleDateString(), PW - M, PH - 5, { align: 'right' });
      }

      doc.save('asis-floor-plan-report.pdf');
    } catch (err) {
      alert('PDF error: ' + err.message);
    } finally {
      setPdfLoading(false);
    }
  };

  /* ── render ───────────────────────────────────────────────────────────── */
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* Top bar */}
      <div
        className="sticky top-0 z-30 px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2"
        style={{ background: 'rgba(238,244,251,.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
          <span className="font-semibold text-sm truncate" style={{ color: 'var(--text-1)' }}>Analysis Complete</span>
          {s && (
            <span className="text-xs hidden md:inline flex-shrink-0" style={{ color: 'var(--text-3)' }}>
              {s.total_rooms} rooms &middot; {s.floor_area_m2} m&sup2;
            </span>
          )}
        </div>
        <button
          onClick={downloadPDF}
          disabled={pdfLoading}
          className="btn-primary flex-shrink-0"
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', opacity: pdfLoading ? 0.6 : 1 }}
        >
          {pdfLoading ? (
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20" strokeDashoffset="10"/>
            </svg>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 2v7M4 7l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="hidden sm:inline">Download PDF</span>
            </>
          )}
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* View Tabs */}
        <div className="flex flex-col gap-2 anim-fade-up">
          <div className="tabs-scroll flex gap-2 pb-1" style={{ WebkitOverflowScrolling: 'touch' }}>
            {[
              { id: 'input',     label: '2D Input',   icon: '📎' },
              { id: 'blueprint', label: 'Blueprint',   icon: '📐' },
              { id: 'overlay',   label: 'Overlay',     icon: '🎯' },
              { id: '3d',        label: '3D Model',    icon: '🧊' }
            ].map(({ id, label, icon }) => {
              const isActive = activeView === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveView(id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.85rem',
                    borderRadius: '0.75rem',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    transition: 'all .15s',
                    background: isActive ? 'var(--accent)' : 'white',
                    color: isActive ? 'white' : 'var(--text-2)',
                    border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                    boxShadow: isActive ? '0 2px 8px rgba(37,99,235,0.2)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: '0.9rem' }}>{icon}</span>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-xs hidden sm:block" style={{ color: 'var(--text-3)' }}>
            2D Input is your original upload. Blueprint shows the detected walls. Overlay shows those walls on top of the plan.
          </p>
        </div>

        {/* 3D / 2D Viewer */}
        <div className="dark-panel overflow-hidden viewer-auto anim-fade-in">
          <ThreeDViewer isLoading={false} previewUrl={getViewUrl()} canvasRef={glCanvasRef} rooms={rooms} />
        </div>

        {/* Stats */}
        {s && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 anim-fade-up">
            {[
              { label: 'Floor Area',   value: `${s.floor_area_m2} m²`,     color: 'var(--accent)' },
              { label: 'Rooms',        value: s.total_rooms,                color: '#0369a1' },
              { label: 'Wall Length',  value: `${s.total_wall_length_m} m`, color: '#1d4ed8' },
              { label: 'Wall Height',  value: `${s.wall_height_m} m`,       color: '#2563eb' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card p-5 text-center" style={{ background: 'white' }}>
                <p className="label mb-1">{label}</p>
                <p className="text-2xl font-black" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Operational summary */}
        {analysis && (
          <div className="grid gap-5 lg:grid-cols-2 anim-fade-up anim-delay-1">
            <Card title="Structural Validation">
              {validation.issues.length ? (
                <div className="space-y-3">
                  {validation.issues.slice(0, 4).map((issue, idx) => (
                    <div key={idx} className="rounded-xl p-3" style={{ background: issue.severity === 'critical' ? '#fef2f2' : '#eff6ff', border: `1px solid ${issue.severity === 'critical' ? '#fecaca' : '#bfdbfe'}` }}>
                      <p className="text-xs font-semibold" style={{ color: issue.severity === 'critical' ? '#b91c1c' : '#1d4ed8' }}>{issue.message}</p>
                    </div>
                  ))}
                  {!validation.issues.length && <p className="text-sm" style={{ color: 'var(--text-3)' }}>No structural validation issues detected.</p>}
                </div>
              ) : <p className="text-sm" style={{ color: 'var(--text-3)' }}>No structural validation issues detected.</p>}
            </Card>

            <Card title="Optimization & Pricing">
              <div className="space-y-3 text-sm" style={{ color: 'var(--text-3)' }}>
                <div>
                  <span className="font-semibold">Pricing source:</span> {pricing.source}
                </div>
                <div>
                  <span className="font-semibold">Storeys detected:</span> {multistorey.floor_count}
                </div>
                <div>
                  <span className="font-semibold">Duplicate lines removed:</span> {robustness.duplicate_lines_removed ?? 0}
                </div>
                <div>
                  <span className="font-semibold">Skewed lines snapped:</span> {robustness.skewed_lines_snapped ?? 0}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Fallback notice */}
        {s?.fallback_used && (
          <div className="card p-4 flex items-center gap-3" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#92400e' }}>Fallback Mode Active</p>
              <p className="text-xs" style={{ color: '#78350f' }}>CV detection produced insufficient lines. Manually defined coordinates were used. 3D model and material analysis are fully evaluated.</p>
            </div>
          </div>
        )}

        {/* 3-col analysis */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 anim-fade-up anim-delay-1">

          {/* Col 1 */}
          <div className="space-y-4">
            <Card title="Border Detection">
              {border ? (
                <>
                  <KV label="Plan Width"  value={`${border.width_m} m`} />
                  <KV label="Plan Height" value={`${border.height_m} m`} />
                  <KV label="Total Area"  value={`${border.total_area_m2} m²`} valueStyle={{ color: '#2563eb' }} />
                  <KV label="Image Size"  value={`${analysis?.image?.width_px} × ${analysis?.image?.height_px} px`} />
                </>
              ) : <p className="text-sm" style={{ color: 'var(--text-3)' }}>No data</p>}
            </Card>

            <Card title="Materials">
              {mats ? (
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: 'var(--text-2)' }}>Outer Walls</span>
                    <Chip color="red">{mats.outer_wall}</Chip>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: 'var(--text-2)' }}>Inner Walls</span>
                    <Chip color="yellow">{mats.inner_wall}</Chip>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: 'var(--text-2)' }}>Structural</span>
                    <Chip color="blue">{mats.structural}</Chip>
                  </div>
                </div>
              ) : <p className="text-sm" style={{ color: 'var(--text-3)' }}>No data</p>}
            </Card>

            <BlockchainPanel block={block} />
          </div>

          {/* Col 2 — walls */}
          <div className="space-y-4">
            <Card title={`Outer Walls — ${walls?.outer_count ?? 0}`}>
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {walls?.outer?.map(w => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs"
                    style={{ background: 'var(--bg)' }}
                  >
                    <span className="font-mono font-semibold" style={{ color: 'var(--text-3)' }}>W{w.id}</span>
                    <span style={{ color: 'var(--text-1)' }}>{w.length_m} m</span>
                    <Chip color="red">{w.material}</Chip>
                  </div>
                ))}
                {!walls?.outer?.length && <p className="text-xs" style={{ color: 'var(--text-3)' }}>None detected</p>}
              </div>
            </Card>

            <Card title={`Inner Walls — ${walls?.inner_count ?? 0}`}>
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {walls?.inner?.map(w => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs"
                    style={{ background: 'var(--bg)' }}
                  >
                    <span className="font-mono font-semibold" style={{ color: 'var(--text-3)' }}>W{w.id}</span>
                    <span style={{ color: 'var(--text-1)' }}>{w.length_m} m</span>
                    <Chip color="yellow">{w.material}</Chip>
                  </div>
                ))}
                {!walls?.inner?.length && <p className="text-xs" style={{ color: 'var(--text-3)' }}>None detected</p>}
              </div>
            </Card>
          </div>

          {/* Col 3 — rooms */}
          <div>
            <Card title={`Rooms — ${rooms.length}`} className="h-full">
              <div className="space-y-2 overflow-y-auto" style={{ maxHeight: '480px' }}>
                {rooms.map(r => (
                  <div
                    key={r.id}
                    className="rounded-2xl p-4"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{r.label}</span>
                      <span className="font-bold text-sm" style={{ color: '#16a34a' }}>{r.area_m2} m²</span>
                    </div>
                    <div className="flex gap-3 text-xs" style={{ color: 'var(--text-3)' }}>
                      <span>{r.width_m} × {r.height_m} m</span>
                      <span>·</span>
                      <span>P: {r.perimeter_m} m</span>
                    </div>
                  </div>
                ))}
                {!rooms.length && <p className="text-sm" style={{ color: 'var(--text-3)' }}>No rooms detected</p>}
              </div>
            </Card>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-5 anim-fade-up anim-delay-2">
          <Card title="Cost Breakdown">
            {costBreakdown.length ? (
              <div className="space-y-2 text-xs">
                {costBreakdown.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex justify-between items-center rounded-xl px-3 py-2" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                    <span>{item.wall_id === 'slab' ? 'Floor Slab' : `W${item.wall_id}`}</span>
                    <span className="font-semibold">₹ {item.cost.toLocaleString()}</span>
                  </div>
                ))}
                {costBreakdown.length > 5 && (
                  <div className="text-xs text-slate-500">+ {costBreakdown.length - 5} more line items</div>
                )}
                <div className="mt-3 rounded-xl px-3 py-2" style={{ background: 'white', border: '1px solid var(--border)' }}>
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Total Estimate</span>
                    <span>₹ {analysis?.summary?.material_cost_estimate?.toLocaleString() ?? '0'}</span>
                  </div>
                </div>
              </div>
            ) : <p className="text-sm" style={{ color: 'var(--text-3)' }}>No cost breakdown available.</p>}
          </Card>

          <Card title="Optimization Suggestions">
            {optimization.length ? (
              <ul className="space-y-2 text-sm" style={{ color: 'var(--text-2)' }}>
                {optimization.slice(0, 5).map((text, idx) => (
                  <li key={idx} className="rounded-xl px-3 py-2" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                    {text}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm" style={{ color: 'var(--text-3)' }}>No optimization recommendations were generated.</p>}
          </Card>
        </div>

        {/* Graph + Wall Classification + Material Justifications */}
        <div className="grid lg:grid-cols-2 gap-5 anim-fade-up anim-delay-2">

          {/* Structural Graph */}
          <Card title="Structural Graph">
            {graph ? (
              <>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {[['Nodes (junctions)', graph.node_count], ['Edges (wall segments)', graph.edge_count],
                    ['Load-Bearing', walls?.load_bearing_count ?? 0], ['Structural Spine', walls?.structural_spine_count ?? 0],
                    ['Partition', walls?.partition_count ?? 0], ['Total Wall Length', `${walls?.total_length_m} m`]
                  ].map(([l, v]) => (
                    <div key={l} className="rounded-xl px-3 py-2" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                      <p className="label" style={{ fontSize: '0.55rem' }}>{l}</p>
                      <p className="font-bold text-sm" style={{ color: 'var(--accent)' }}>{v}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>
                  Nodes are snapped junction points where walls meet. Edges represent individual wall segments.
                  Load-bearing walls are on the outer boundary. Structural spine walls span &gt;60% of the plan.
                </p>
              </>
            ) : <p className="text-sm" style={{ color: 'var(--text-3)' }}>No graph data</p>}
          </Card>

          {/* Wall Classification */}
          <Card title="Wall Classification">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {[...(walls?.outer ?? []), ...(walls?.inner ?? [])].map(w => (
                <div key={w.id} className="rounded-xl px-3 py-2.5" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-semibold" style={{ color: 'var(--text-3)' }}>W{w.id}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{
                        background: w.wall_type === 'load-bearing' ? '#fef2f2' : w.wall_type === 'structural' ? '#eff6ff' : '#fffbeb',
                        color:      w.wall_type === 'load-bearing' ? '#dc2626' : w.wall_type === 'structural' ? '#1d4ed8' : '#d97706',
                      }}>{w.wall_type}</span>
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>{w.length_m} m</span>
                    </div>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                    {w.material} &nbsp;&middot;&nbsp; score {w.mat_score}
                    {w.is_spine && <span style={{ color: '#1d4ed8' }}> &nbsp;&middot;&nbsp; structural spine ({Math.round(w.span_ratio * 100)}% span)</span>}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Material Justifications */}
        {recs.length > 0 && (
          <Card title="Material Recommendations — Full Justification" className="anim-fade-up anim-delay-3">
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recs.map((r, i) => (
                <div key={i} className="rounded-xl p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-xs font-semibold" style={{ color: 'var(--text-3)' }}>W{r.wall_id}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{
                      background: r.wall_type === 'load-bearing' ? '#fef2f2' : r.wall_type === 'structural' ? '#eff6ff' : '#fffbeb',
                      color:      r.wall_type === 'load-bearing' ? '#dc2626' : r.wall_type === 'structural' ? '#1d4ed8' : '#d97706',
                    }}>{r.wall_type}</span>
                    <span className="font-semibold text-xs" style={{ color: 'var(--text-1)' }}>{r.material}</span>
                    <span className="text-xs" style={{ color: 'var(--text-3)' }}>score {r.score}</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
                    {r.justification}
                  </p>
                  {r.all_scores && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {Object.entries(r.all_scores).map(([mat, sc]) => (
                        <span key={mat} className="text-xs px-2 py-0.5 rounded-full" style={{
                          background: mat === r.material ? 'var(--accent)' : 'var(--bg-2)',
                          color:      mat === r.material ? 'white' : 'var(--text-2)',
                          border: '1px solid var(--border)',
                        }}>{mat}: {sc}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── Stage 05: Explainability ── */}
        {expl && (
          <div className="space-y-4 anim-fade-up anim-delay-3">

            {/* Narrative */}
            <Card title="🧠 AI Structural Analysis — Plain Language Summary">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)', lineHeight: 1.8 }}>
                {expl.narrative}
              </p>
              <div className="mt-3 p-3 rounded-xl text-xs" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
                <span className="font-semibold" style={{ color: 'var(--accent)' }}>Scoring formula: </span>
                <span className="font-mono" style={{ color: 'var(--text-2)' }}>{expl.formula}</span>
              </div>
            </Card>

            {/* Structural concerns */}
            {expl.concerns?.length > 0 && (
              <Card title="⚠️ Structural Concerns">
                <div className="space-y-2">
                  {expl.concerns.map((c, i) => (
                    <div key={i} className="rounded-xl p-3 flex gap-3"
                      style={{
                        background: c.severity === 'critical' ? '#fef2f2' : '#fffbeb',
                        border: `1px solid ${c.severity === 'critical' ? '#fecaca' : '#fde68a'}`,
                      }}>
                      <span style={{ fontSize: '1rem', flexShrink: 0 }}>
                        {c.severity === 'critical' ? '🔴' : '🟡'}
                      </span>
                      <div>
                        <p className="text-xs font-bold mb-0.5"
                          style={{ color: c.severity === 'critical' ? '#dc2626' : '#d97706' }}>
                          {c.severity.toUpperCase()} — {c.room} ({c.span_m}m {c.axis} span)
                        </p>
                        <p className="text-xs" style={{ color: c.severity === 'critical' ? '#7f1d1d' : '#78350f' }}>
                          {c.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Ranked material options per wall */}
            <Card title="🏆 Ranked Material Options (Top 3 per Wall)">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {recs.map((r) => (
                  <div key={r.wall_id} className="rounded-xl p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-mono text-xs font-bold" style={{ color: 'var(--text-3)' }}>W{r.wall_id}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{
                        background: r.wall_type === 'load-bearing' ? '#fef2f2' : r.wall_type === 'structural' ? '#eff6ff' : '#fffbeb',
                        color:      r.wall_type === 'load-bearing' ? '#dc2626' : r.wall_type === 'structural' ? '#1d4ed8' : '#d97706',
                      }}>{r.wall_type}</span>
                    </div>
                    <div className="space-y-2">
                      {(r.ranked_options ?? []).map((opt) => (
                        <div key={opt.rank} className="flex items-center gap-3 rounded-lg px-3 py-2"
                          style={{
                            background: opt.rank === 1 ? 'var(--accent-lt)' : 'white',
                            border: `1px solid ${opt.rank === 1 ? 'var(--border-2)' : 'var(--border)'}`,
                          }}>
                          <span className="text-xs font-black w-5 text-center rounded-full"
                            style={{ color: opt.rank === 1 ? 'var(--accent)' : 'var(--text-3)' }}>
                            #{opt.rank}
                          </span>
                          <div className="flex-1">
                            <p className="text-xs font-semibold" style={{ color: 'var(--text-1)' }}>{opt.material}</p>
                            <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                              Cost {opt.cost}/5 · Strength {opt.strength}/5 · Durability {opt.durability}/5
                            </p>
                          </div>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background: opt.rank === 1 ? 'var(--accent)' : 'var(--bg-2)', color: opt.rank === 1 ? 'white' : 'var(--text-2)' }}>
                            {opt.score}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--text-3)' }}>
                      {r.justification}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* OBJ download */}
        {modelUrl && (
          <div
            className="card p-4 flex items-center justify-between anim-fade-up anim-delay-2"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#eff6ff' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2v8M5 8l3 3 3-3M2 13h12" stroke="#2563eb" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>3D Model</p>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>Wavefront OBJ format</p>
              </div>
            </div>
            <a
              href={modelUrl}
              download
              className="btn-ghost text-xs"
              style={{ padding: '0.4rem 1rem' }}
            >
              Download OBJ
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
