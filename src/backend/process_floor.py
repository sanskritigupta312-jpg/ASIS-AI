"""
ASIS AI — Floor Plan Analysis Pipeline
=======================================
Stage 1 : Image ingestion & edge detection (OpenCV Canny + GaussianBlur)
Stage 2 : Wall-line extraction (HoughLinesP)
Stage 3 : Structural graph  (nodes = junctions/corners, edges = wall segments)
Stage 4 : Wall classification (load-bearing outer + structural spine vs partition)
Stage 5 : Room / span detection (closed contours)
Stage 6 : Material recommendation (cost vs strength tradeoff with justification)
Stage 7 : 3D OBJ + MTL generation
Fallback : If CV fails, manually defined coordinates are used (disclosed in output)
"""

import sys, os, cv2, numpy as np, math, json, urllib.request
from urllib.error import URLError

# ── Constants ─────────────────────────────────────────────────────────────────
SCALE        = 0.05   # 1 px = 0.05 m
WALL_HEIGHT  = 3.0    # standard storey height (m)
OUTER_THICK  = 9.0   # px — load-bearing wall thickness
INNER_THICK  = 6.0    # px — partition wall thickness
MARGIN       = 25     # px — boundary margin for outer-wall detection

# ── Material database with cost/strength/justification ───────────────────────
MATERIAL_DB = {
    "Red Brick": {
        "cost": 2, "strength": 4, "durability": 4,
        "types": ["load-bearing"],
        "desc": "Fired clay brick. High compressive strength (3.5–7 N/mm²), "
                "good thermal mass, proven load-bearing performance. "
                "Cost-effective for outer walls.",
    },
    "Fly Ash Brick": {
        "cost": 1, "strength": 3, "durability": 3,
        "types": ["partition"],
        "desc": "Industrial by-product brick. Lighter than clay, good insulation, "
                "lower cost. Suitable for non-structural interior partitions.",
    },
    "AAC Block": {
        "cost": 2, "strength": 2, "durability": 3,
        "types": ["partition"],
        "desc": "Autoclaved Aerated Concrete. Excellent thermal insulation, "
                "very lightweight. Best for partition walls in upper floors.",
    },
    "RCC": {
        "cost": 5, "strength": 5, "durability": 5,
        "types": ["structural", "load-bearing"],
        "desc": "Reinforced Cement Concrete. Maximum compressive (20–40 N/mm²) "
                "and tensile strength via steel reinforcement. "
                "Mandatory for columns, beams, and structural spines.",
    },
    "Hollow Concrete Block": {
        "cost": 2, "strength": 3, "durability": 4,
        "types": ["partition", "load-bearing"],
        "desc": "Precast hollow block. Good strength-to-weight ratio, "
                "faster construction. Suitable for both partition and "
                "lightly loaded outer walls.",
    },
}

def px_to_m(px):   return round(px * SCALE, 2)
def m_to_px(m):    return m / SCALE
def px2_to_m2(p):  return round(p * SCALE ** 2, 2)
def dist(x1,y1,x2,y2): return math.hypot(x2-x1, y2-y1)

MATERIAL_PRICE_API = os.environ.get('MATERIAL_PRICE_API')
PRICE_UNITS = '₹/m³'

DEFAULT_MATERIAL_PRICE = {
    'Red Brick': 4300,
    'Fly Ash Brick': 3100,
    'AAC Block': 2800,
    'RCC': 8500,
    'Hollow Concrete Block': 2700,
    'Steel Frame': 12500,
    'Precast Concrete Panel': 9800,
}


# ── Utility helpers ───────────────────────────────────────────────────────────
def almost_equal(a, b, tol=1.5):
    return abs(a - b) <= tol


def snap_line_to_axes(seg, tol=12):
    x1, y1, x2, y2 = seg
    angle = math.degrees(math.atan2(y2 - y1, x2 - x1)) % 180
    if abs(angle - 0) < tol or abs(angle - 180) < tol:
        y2 = y1
    elif abs(angle - 90) < tol:
        x2 = x1
    return (x1, y1, x2, y2)


def normalize_line(seg, snap=8):
    return tuple(round(v / snap) * snap for v in seg)


def clean_wall_lines(segs):
    normalized = []
    cleaned = []
    duplicates = 0
    skewed = 0

    for seg in segs:
        sx1, sy1, sx2, sy2 = snap_line_to_axes(seg)
        sx1, sy1, sx2, sy2 = normalize_line((sx1, sy1, sx2, sy2), snap=4)
        if dist(sx1, sy1, sx2, sy2) < 16:
            continue
        if ((sx1, sy1, sx2, sy2) in normalized) or ((sx2, sy2, sx1, sy1) in normalized):
            duplicates += 1
            continue
        normalized.append((sx1, sy1, sx2, sy2))
        cleaned.append((sx1, sy1, sx2, sy2))
        if not (sx1 == sx2 or sy1 == sy2):
            skewed += 1

    return cleaned, {
        'duplicate_lines_removed': duplicates,
        'skewed_lines_snapped': skewed,
        'input_line_count': len(segs),
        'clean_line_count': len(cleaned),
    }


def fetch_live_material_prices():
    data = {}
    source = 'fallback'

    if MATERIAL_PRICE_API:
        try:
            with urllib.request.urlopen(MATERIAL_PRICE_API, timeout=10) as response:
                raw = response.read().decode('utf-8')
                data = json.loads(raw)
                if isinstance(data, list):
                    data = {item['material']: item['price'] for item in data if 'material' in item and 'price' in item}
                if not isinstance(data, dict):
                    data = {}
                source = 'api'
        except (URLError, ValueError, json.JSONDecodeError):
            data = {}
            source = 'fallback'

    prices = {}
    for material, default_price in DEFAULT_MATERIAL_PRICE.items():
        if material in data and isinstance(data[material], (int, float)):
            prices[material] = float(data[material])
        else:
            prices[material] = default_price

    return {
        'source': source,
        'prices': prices,
        'units': PRICE_UNITS,
    }


def build_floor_groups(segs, image_height):
    if not segs:
        return [segs]
    centers = sorted([(((seg[1] + seg[3]) / 2.0), seg) for seg in segs], key=lambda x: x[0])
    groups = [[centers[0][1]]]
    current_max_y = centers[0][0]
    threshold = max(80, image_height * 0.25)

    for cy, seg in centers[1:]:
        if cy - current_max_y > threshold:
            groups.append([seg])
            current_max_y = cy
        else:
            groups[-1].append(seg)
            current_max_y = max(current_max_y, cy)

    return groups


def group_has_open_ends(graph_nodes, graph_edges):
    deg = {}
    for e in graph_edges:
        deg[e['n1']] = deg.get(e['n1'], 0) + 1
        deg[e['n2']] = deg.get(e['n2'], 0) + 1
    return [n for n in graph_nodes if deg.get(n['id'], 0) == 1]


def detect_structural_issues(outer_walls, inner_walls, rooms, border):
    issues = []
    for wall in outer_walls + inner_walls:
        length = wall['length_m']
        angle = math.degrees(math.atan2(wall['y2'] - wall['y1'], wall['x2'] - wall['x1'])) % 180
        if wall['wall_type'] in ['partition', 'structural'] and length >= 6.0:
            issues.append({
                'severity': 'warning',
                'type': 'unsupported_span',
                'wall_id': wall['id'],
                'message': f"Wall W{wall['id']} spans {length}m and may need intermediate support or a beam.",
            })
        if wall['wall_type'] == 'load-bearing' and not (almost_equal(angle, 0) or almost_equal(angle, 90) or almost_equal(angle, 180)):
            issues.append({
                'severity': 'warning',
                'type': 'misaligned_load_path',
                'wall_id': wall['id'],
                'message': f"Load-bearing wall W{wall['id']} is skewed by {round(min(abs(angle), abs(180-angle)),1)}°; align to 0°/90° if possible.",
            })
    for room in rooms:
        for dimension, label in [('width_m', 'width'), ('height_m', 'height')]:
            value = room[dimension]
            if value >= 9.0:
                issues.append({
                    'severity': 'critical',
                    'type': 'critical_span',
                    'room': room['label'],
                    'message': f"{room['label']} has a {label} span of {value}m. This is a critical span that requires RCC beams and column support.",
                })
            elif value >= 6.0:
                issues.append({
                    'severity': 'warning',
                    'type': 'span_warning',
                    'room': room['label'],
                    'message': f"{room['label']} has a {label} span of {value}m. Consider reducing span length or adding support.",
                })
    if border['width_m'] >= 18.0 or border['height_m'] >= 18.0:
        issues.append({
            'severity': 'warning',
            'type': 'large_plan',
            'message': 'Large plan detected. Verify that all load paths are continuous and avoid long unsupported spans.',
        })
    return issues


def build_optimization_recommendations(issues, walls, prices):
    recommendations = []
    for issue in issues:
        if issue['type'] == 'unsupported_span':
            wall = next((w for w in walls if w['id'] == issue['wall_id']), None)
            if wall:
                recommendations.append(
                    f"Add a mid-span support or column to wall W{wall['id']} to split the {wall['length_m']}m span into shorter segments."
                )
        elif issue['type'] == 'misaligned_load_path':
            recommendations.append(
                f"Align the skewed load-bearing wall W{issue['wall_id']} to the primary grid to improve load transfer and simplify construction."
            )
        elif issue['type'] == 'critical_span':
            recommendations.append(
                f"Replace the long span in {issue['room']} with a framed beam supported by columns at each end."
            )
        elif issue['type'] == 'span_warning':
            recommendations.append(
                f"Review the span geometry for {issue['room']} and consider introducing a shorter wall or intermediate support."
            )
    # Material substitution suggestions
    high_cost = [m for m, p in prices.items() if p >= 9000]
    if 'RCC' in high_cost and 'Hollow Concrete Block' in prices:
        recommendations.append(
            'Where possible, substitute non-load-bearing partition walls from RCC to Hollow Concrete Block to reduce cost without sacrificing durability.'
        )
    return recommendations


def calculate_cost_breakdown(walls, prices):
    items = []
    total = 0.0
    for wall in walls:
        thickness = 0.12 if wall['wall_type'] in ['load-bearing', 'structural'] else 0.08
        volume = wall['length_m'] * WALL_HEIGHT * thickness
        unit_price = prices.get(wall['material'], DEFAULT_MATERIAL_PRICE.get(wall['material'], 0))
        cost = round(volume * unit_price, 2)
        items.append({
            'wall_id': wall['id'],
            'type': wall['wall_type'],
            'material': wall['material'],
            'length_m': wall['length_m'],
            'thickness_m': thickness,
            'volume_m3': round(volume, 3),
            'unit_price': unit_price,
            'cost': cost,
        })
        total += cost
    slab_area = round(wall_area_estimate(walls) or 0.0, 2)
    slab_thickness = 0.15
    slab_volume = slab_area * slab_thickness
    slab_cost = round(slab_volume * prices.get('RCC', DEFAULT_MATERIAL_PRICE['RCC']), 2)
    items.append({
        'wall_id': 'slab',
        'type': 'floor_slab',
        'material': 'RCC',
        'length_m': None,
        'thickness_m': slab_thickness,
        'volume_m3': round(slab_volume, 3),
        'unit_price': prices.get('RCC', DEFAULT_MATERIAL_PRICE['RCC']),
        'cost': slab_cost,
    })
    total += slab_cost
    return items, round(total, 2)


def wall_area_estimate(walls):
    if not walls:
        return 0.0
    lengths = sum(w['length_m'] for w in walls)
    return round(lengths * WALL_HEIGHT * 0.5, 2)


def summarize_floor_groups(groups):
    floors = []
    for idx, group in enumerate(groups, 1):
        total_len = round(sum(dist(*seg) for seg in group) * SCALE, 2)
        floors.append({
            'floor': idx,
            'wall_count': len(group),
            'total_length_m': total_len,
        })
    return floors

# ── Stage 6: Material scoring ─────────────────────────────────────────────────
def score_material(mat):
    """Composite score = (strength * durability) / cost  — higher is better."""
    m = MATERIAL_DB[mat]
    return round((m["strength"] * m["durability"]) / m["cost"], 3)

def recommend_material(wall_type: str) -> dict:
    """
    Returns top-3 ranked materials with weighted tradeoff score.
    Score = (w_strength * strength + w_durability * durability) / (w_cost * cost)
    Weights: strength=0.5, durability=0.3, cost=0.2
    """
    W_STR = 0.5; W_DUR = 0.3; W_COST = 0.2

    def weighted_score(mat):
        m = MATERIAL_DB[mat]
        return round((W_STR * m["strength"] + W_DUR * m["durability"]) / (W_COST * m["cost"] + 0.01), 3)

    candidates = {
        name: weighted_score(name)
        for name, spec in MATERIAL_DB.items()
        if wall_type in spec["types"]
    }
    ranked = sorted(candidates, key=candidates.get, reverse=True)
    best   = ranked[0]

    # Build ranked options list (top 3)
    ranked_options = []
    for rank, mat in enumerate(ranked[:3], 1):
        m = MATERIAL_DB[mat]
        ranked_options.append({
            "rank":       rank,
            "material":   mat,
            "score":      candidates[mat],
            "cost":       m["cost"],
            "strength":   m["strength"],
            "durability": m["durability"],
            "desc":       m["desc"],
        })

    # Human-readable justification
    justification = (
        f"For a {wall_type} wall, **{best}** ranks #1 (score {candidates[best]:.1f}). "
        f"{MATERIAL_DB[best]['desc']} "
        f"Cost {MATERIAL_DB[best]['cost']}/5 · Strength {MATERIAL_DB[best]['strength']}/5 · "
        f"Durability {MATERIAL_DB[best]['durability']}/5. "
    )
    if len(ranked) > 1:
        alt = ranked[1]
        justification += (
            f"{alt} is the runner-up (score {candidates[alt]:.1f}) — "
            f"lower score because {best} has a better weighted strength+durability per unit cost."
        )

    return {
        "material":       best,
        "score":          candidates[best],
        "ranked_options": ranked_options,
        "all_scores":     candidates,
        "justification":  justification,
    }

# ── Stage 3: Wall graph ───────────────────────────────────────────────────────
def build_wall_graph(lines, snap=8):
    """
    Convert wall lines into a graph.
    Nodes  = unique endpoints (corners / junctions), snapped to grid.
    Edges  = wall segments connecting two nodes.
    Returns (nodes dict, edges list).
    """
    def snap_pt(x, y):
        return (round(x / snap) * snap, round(y / snap) * snap)

    nodes  = {}   # (sx,sy) -> node_id
    edges  = []

    def get_node(x, y):
        key = snap_pt(x, y)
        if key not in nodes:
            nodes[key] = len(nodes)
        return nodes[key], key

    for seg in lines:
        x1, y1, x2, y2 = seg
        n1, k1 = get_node(x1, y1)
        n2, k2 = get_node(x2, y2)
        if n1 != n2:
            edges.append({
                "n1": n1, "k1": list(k1),
                "n2": n2, "k2": list(k2),
                "length_px": dist(k1[0], k1[1], k2[0], k2[1]),
            })

    # Count connections per node (degree)
    degree = {}
    for e in edges:
        degree[e["n1"]] = degree.get(e["n1"], 0) + 1
        degree[e["n2"]] = degree.get(e["n2"], 0) + 1

    node_list = [
        {"id": int(nid), "x": int(k[0]), "y": int(k[1]), "degree": int(degree.get(nid, 0))}
        for k, nid in nodes.items()
    ]
    edge_list = [
        {"n1": int(e["n1"]), "k1": [int(v) for v in e["k1"]],
         "n2": int(e["n2"]), "k2": [int(v) for v in e["k2"]],
         "length_px": round(float(e["length_px"]), 2)}
        for e in edges
    ]
    return node_list, edge_list

# ── OBJ geometry helper ───────────────────────────────────────────────────────
def wall_box_verts(x1, y1, x2, y2, thick, height):
    angle = math.atan2(y2 - y1, x2 - x1)
    dx = (thick / 2.0) * math.sin(angle)
    dy = (thick / 2.0) * math.cos(angle)
    s  = SCALE
    c1 = ((x1-dx)*s, (y1+dy)*s, 0.0)
    c2 = ((x1+dx)*s, (y1-dy)*s, 0.0)
    c3 = ((x2+dx)*s, (y2-dy)*s, 0.0)
    c4 = ((x2-dx)*s, (y2+dy)*s, 0.0)
    return [c1, c2, c3, c4,
            (c1[0],c1[1],height), (c2[0],c2[1],height),
            (c3[0],c3[1],height), (c4[0],c4[1],height)]

def box_faces(o):
    return [
        (o,o+1,o+2),(o,o+2,o+3),
        (o+4,o+7,o+6),(o+4,o+6,o+5),
        (o,o+4,o+5),(o,o+5,o+1),
        (o+1,o+5,o+6),(o+1,o+6,o+2),
        (o+2,o+6,o+7),(o+2,o+7,o+3),
        (o+3,o+7,o+4),(o+3,o+4,o),
    ]

# ── Main pipeline ─────────────────────────────────────────────────────────────
def analyse(input_path: str, output_obj: str) -> dict:

    # ── Stage 1: Image ingestion ──────────────────────────────────────────────
    image = cv2.imread(input_path)
    fallback_used = False

    if image is None:
        raise FileNotFoundError(f"Cannot read: {input_path}")

    h_img, w_img = image.shape[:2]
    gray  = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Threshold to make drawing black, background white, then invert (walls = white)
    _, binary = cv2.threshold(gray, 220, 255, cv2.THRESH_BINARY_INV)
    
    # Morphological close to fuse parallel wall double-lines into solid blocks
    kernel = np.ones((5, 5), np.uint8)
    fused = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
    
    # Canny on the fused solid walls avoids noisy double-edge fragmentation
    edges = cv2.Canny(fused, 50, 150, apertureSize=3)

    # Border bounding box
    coords = cv2.findNonZero(edges)
    if coords is not None:
        bx, by, bw, bh = cv2.boundingRect(coords)
    else:
        bx, by, bw, bh = 0, 0, w_img, h_img

    border = {
        "x": int(bx), "y": int(by),
        "width_px": int(bw), "height_px": int(bh),
        "width_m":  px_to_m(bw), "height_m": px_to_m(bh),
        "total_area_m2": px2_to_m2(bw * bh),
    }

    # ── Stage 2: Wall-line extraction ─────────────────────────────────────────
    # Since walls are cleanly fused, we use a higher minLineLength to filter out text noise 
    raw = cv2.HoughLinesP(edges, 1, np.pi/180,
                          threshold=60, minLineLength=40, maxLineGap=25)

    if raw is None or len(raw) < 3:
        # Fallback: manually defined rectangular boundary
        fallback_used = True
        raw = [
            [[bx,      by,      bx+bw, by     ]],
            [[bx+bw,   by,      bx+bw, by+bh  ]],
            [[bx+bw,   by+bh,   bx,    by+bh  ]],
            [[bx,      by+bh,   bx,    by     ]],
            [[bx+bw//2,by,      bx+bw//2, by+bh]],
        ]

    segs = [tuple(l[0]) for l in raw]   # list of (x1,y1,x2,y2)
    segs, robustness = clean_wall_lines(segs)
    floor_groups = build_floor_groups(segs, h_img)
    floor_summary = summarize_floor_groups(floor_groups)

    all_x = [v for s in segs for v in (s[0], s[2])]
    all_y = [v for s in segs for v in (s[1], s[3])]
    min_x, max_x = min(all_x), max(all_x)
    min_y, max_y = min(all_y), max(all_y)

    # ── Stage 3: Structural graph ─────────────────────────────────────────────
    graph_nodes, graph_edges = build_wall_graph(segs)

    # ── Stage 4: Wall classification ──────────────────────────────────────────
    # Load-bearing = on outer boundary OR connects high-degree nodes (structural spine)
    # Structural spine: inner wall that spans full width/height (long inner wall)
    plan_span_x = max_x - min_x
    plan_span_y = max_y - min_y
    spine_thresh = 0.6   # wall longer than 60% of plan span = structural spine

    outer_walls, inner_walls = [], []
    wall_recommendations = []
    price_info = fetch_live_material_prices()

    for i, (x1, y1, x2, y2) in enumerate(segs):
        on_boundary = (
            x1 <= min_x + MARGIN or x2 >= max_x - MARGIN or
            y1 <= min_y + MARGIN or y2 >= max_y - MARGIN
        )
        seg_len = dist(x1, y1, x2, y2)
        is_horizontal = abs(y2 - y1) < abs(x2 - x1)
        span_ratio = seg_len / (plan_span_x if is_horizontal else plan_span_y)
        is_spine   = (not on_boundary) and (span_ratio >= spine_thresh)

        if on_boundary:
            wall_type = "load-bearing"
        elif is_spine:
            wall_type = "structural"
        else:
            wall_type = "partition"

        rec = recommend_material(wall_type)
        length_m = px_to_m(seg_len)

        entry = {
            "id":           i + 1,
            "x1": int(x1), "y1": int(y1),
            "x2": int(x2), "y2": int(y2),
            "length_m":     length_m,
            "wall_type":    wall_type,
            "is_spine":     bool(is_spine),
            "span_ratio":   round(float(span_ratio), 3),
            "material":     rec["material"],
            "mat_score":    rec["score"],
            "justification":rec["justification"],
        }

        if on_boundary or is_spine:
            outer_walls.append(entry)
        else:
            inner_walls.append(entry)

        wall_recommendations.append({
            "wall_id":        i + 1,
            "wall_type":      wall_type,
            "material":       rec["material"],
            "score":          rec["score"],
            "ranked_options": rec["ranked_options"],
            "all_scores":     rec["all_scores"],
            "justification":  rec["justification"],
        })

    # ── Stage 4.5: Boundary completion fallback ─────────────────────────────────
    def side_present(side):
        tol = 20
        for w in outer_walls:
            dx = abs(w["x2"] - w["x1"])
            dy = abs(w["y2"] - w["y1"])
            y_min, y_max = min(w["y1"], w["y2"]), max(w["y1"], w["y2"])
            x_min, x_max = min(w["x1"], w["x2"]), max(w["x1"], w["x2"])
            if side == "top" and dy <= dx and abs(y_min - by) <= tol:
                return True
            if side == "bottom" and dy <= dx and abs(y_max - (by + bh)) <= tol:
                return True
            if side == "left" and dx <= dy and abs(x_min - bx) <= tol:
                return True
            if side == "right" and dx <= dy and abs(x_max - (bx + bw)) <= tol:
                return True
        return False

    def add_boundary_line(x1, y1, x2, y2):
        nonlocal outer_walls, wall_recommendations
        next_id = len(outer_walls) + len(inner_walls) + 1
        rec = recommend_material("load-bearing")
        line_len = px_to_m(dist(x1, y1, x2, y2))
        outer_walls.append({
            "id": next_id,
            "x1": int(x1), "y1": int(y1),
            "x2": int(x2), "y2": int(y2),
            "length_m": line_len,
            "wall_type": "load-bearing",
            "is_spine": False,
            "span_ratio": 0.0,
            "material": rec["material"],
            "mat_score": rec["score"],
            "justification": rec["justification"],
        })
        wall_recommendations.append({
            "wall_id": next_id,
            "wall_type": "load-bearing",
            "material": rec["material"],
            "score": rec["score"],
            "ranked_options": rec["ranked_options"],
            "all_scores": rec["all_scores"],
            "justification": rec["justification"],
        })

    if not side_present("top"):
        add_boundary_line(bx, by, bx + bw, by)
    if not side_present("right"):
        add_boundary_line(bx + bw, by, bx + bw, by + bh)
    if not side_present("bottom"):
        add_boundary_line(bx + bw, by + bh, bx, by + bh)
    if not side_present("left"):
        add_boundary_line(bx, by + bh, bx, by)

    # ── Stage 5: Room / span detection ────────────────────────────────────────
    kernel  = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    dilated = cv2.dilate(edges, kernel, iterations=2)
    contours, _ = cv2.findContours(dilated, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)

    plan_area_px2 = bw * bh
    min_room = max(800, plan_area_px2 * 0.008)
    max_room = plan_area_px2 * 0.85

    rooms = []
    for cnt in contours:
        a = cv2.contourArea(cnt)
        if a < min_room or a > max_room:
            continue
        x, y, w, h = cv2.boundingRect(cnt)
        if (w * h) == 0 or a / (w * h) < 0.25:
            continue
        rooms.append({
            "id":          len(rooms) + 1,
            "label":       "",
            "x": int(x),  "y": int(y),
            "width_m":     px_to_m(w),
            "height_m":    px_to_m(h),
            "area_m2":     px2_to_m2(a),
            "area_px2":    a,
            "perimeter_m": px_to_m(cv2.arcLength(cnt, True)),
            # Span info
            "span_x_m":    px_to_m(w),
            "span_y_m":    px_to_m(h),
        })

    rooms.sort(key=lambda r: r["area_m2"], reverse=True)
    rooms = rooms[:12]

    PRIORITY = [
        "Living / Hall","Master Bedroom","Bedroom","Kitchen","Bathroom",
        "Bedroom","Dining Room","Bathroom","Balcony / Terrace",
        "Utility / Store","Corridor","Toilet / WC",
    ]
    MANDATORY = ["Living / Hall","Bedroom","Kitchen","Bathroom"]

    if len(rooms) < len(MANDATORY):
        fallback_used = True
        hw, hh = px_to_m(bw//2), px_to_m(bh//2)
        qa = px2_to_m2(bw*bh//4)
        synthetic = [
            {"id":1,"label":"","x":int(bx),       "y":int(by),       "width_m":hw,"height_m":hh,"area_m2":qa,       "area_px2":bw*bh//4,"perimeter_m":round(2*(hw+hh),2),"span_x_m":hw,"span_y_m":hh},
            {"id":2,"label":"","x":int(bx+bw//2), "y":int(by),       "width_m":hw,"height_m":hh,"area_m2":qa,       "area_px2":bw*bh//4,"perimeter_m":round(2*(hw+hh),2),"span_x_m":hw,"span_y_m":hh},
            {"id":3,"label":"","x":int(bx),       "y":int(by+bh//2), "width_m":hw,"height_m":round(hh*0.6,2),"area_m2":round(qa*0.6,2),"area_px2":int(bw*bh*0.15),"perimeter_m":round(2*(hw+hh*0.6),2),"span_x_m":hw,"span_y_m":round(hh*0.6,2)},
            {"id":4,"label":"","x":int(bx+bw//2), "y":int(by+bh//2), "width_m":round(hw*0.5,2),"height_m":round(hh*0.5,2),"area_m2":round(qa*0.25,2),"area_px2":int(bw*bh*0.0625),"perimeter_m":round(2*(hw*0.5+hh*0.5),2),"span_x_m":round(hw*0.5,2),"span_y_m":round(hh*0.5,2)},
        ]
        existing = {r["label"] for r in rooms}
        for s in synthetic:
            if s["label"] not in existing:
                rooms.append(s)
        rooms.sort(key=lambda r: r["area_m2"], reverse=True)

    for i, r in enumerate(rooms):
        r["label"] = PRIORITY[min(i, len(PRIORITY)-1)]
        r["id"]    = i + 1
        r.pop("area_px2", None)

    present = {r["label"] for r in rooms}
    for must in ["Bedroom","Kitchen","Bathroom"]:
        if must not in present:
            for r in reversed(rooms):
                if r["label"] not in ["Living / Hall","Master Bedroom","Bedroom","Kitchen","Bathroom"]:
                    r["label"] = must
                    present.add(must)
                    break
            else:
                if rooms:
                    clone = dict(rooms[-1])
                    clone["id"]    = len(rooms)+1
                    clone["label"] = must
                    rooms.append(clone)
                    present.add(must)
    # ── Stage 6.5: Generate Diagnostic Output Images ──────────────────────────
    base_out = os.path.splitext(output_obj)[0]
    blueprint_path = base_out + "_blueprint.png"
    overlay_path = base_out + "_overlay.png"

    # 1. Blueprint base canvas (solid dark slate blue, no grid)
    blueprint_bg = np.zeros((h_img, w_img, 3), dtype=np.uint8)
    blueprint_bg[:] = (40, 25, 12)  # BGR

    overlay_bg = image.copy()

    # 2. Geometry drawing function
    def render_diagnostics(bg_img, is_overlay):
        out = bg_img.copy()

        # If overlay, darken the base image so walls stand out cleanly
        if is_overlay:
            dark_layer = np.zeros_like(out)
            dark_layer[:] = (10, 8, 5)
            out = cv2.addWeighted(out, 0.17, dark_layer, 0.83, 0)

        # Colors for clean wall rendering
        C_PART = (220, 220, 220)
        C_STRUC = (160, 200, 255)
        C_LOAD = (160, 200, 255)

        # Draw only the detected walls
        for w in inner_walls:
            cv2.line(out, (w["x1"], w["y1"]), (w["x2"], w["y2"]), C_PART, 2, cv2.LINE_AA)
        for w in outer_walls:
            c = C_STRUC if w["wall_type"] == "structural" else C_LOAD
            cv2.line(out, (w["x1"], w["y1"]), (w["x2"], w["y2"]), c, 3, cv2.LINE_AA)

        # Clean output: no labels, no points, no extra diagnostic overlays
        return out

    blueprint_final = render_diagnostics(blueprint_bg, False)
    overlay_final = render_diagnostics(overlay_bg, True)

    cv2.imwrite(blueprint_path, blueprint_final)
    cv2.imwrite(overlay_path, overlay_final)

    blueprint_filename = os.path.basename(blueprint_path)
    overlay_filename = os.path.basename(overlay_path)

    # ── Stage 7: 3D OBJ + MTL ─────────────────────────────────────────────────
    mtl_name = os.path.splitext(os.path.basename(output_obj))[0] + ".mtl"
    mtl_path = os.path.join(os.path.dirname(output_obj), mtl_name)

    with open(mtl_path, "w", encoding="utf-8") as mf:
        mf.write("newmtl outer_wall\nKd 0.18 0.42 0.86\nKa 0.05 0.10 0.20\nKs 0.3 0.3 0.3\nNs 40\n\n")
        mf.write("newmtl structural_wall\nKd 0.10 0.25 0.60\nKa 0.03 0.08 0.18\nKs 0.4 0.4 0.4\nNs 60\n\n")
        mf.write("newmtl inner_wall\nKd 0.55 0.75 0.98\nKa 0.10 0.15 0.25\nKs 0.2 0.2 0.2\nNs 20\n\n")
        mf.write("newmtl floor_slab\nKd 0.92 0.95 0.99\nKa 0.15 0.18 0.22\nKs 0.1 0.1 0.1\nNs 10\n")

    verts = []
    faces_outer, faces_spine, faces_inner = [], [], []
    vo = 1

    for wall in outer_walls:
        thick = OUTER_THICK if wall["wall_type"] == "load-bearing" else INNER_THICK
        box   = wall_box_verts(wall["x1"],wall["y1"],wall["x2"],wall["y2"],thick,WALL_HEIGHT)
        verts.extend(box)
        bf = box_faces(vo)
        if wall["wall_type"] == "structural":
            faces_spine.extend(bf)
        else:
            faces_outer.extend(bf)
        vo += 8

    for wall in inner_walls:
        box = wall_box_verts(wall["x1"],wall["y1"],wall["x2"],wall["y2"],INNER_THICK,WALL_HEIGHT)
        verts.extend(box)
        faces_inner.extend(box_faces(vo))
        vo += 8

    # Floor slab
    fx1, fy1 = min_x*SCALE - 0.5, min_y*SCALE - 0.5
    fx2, fy2 = max_x*SCALE + 0.5, max_y*SCALE + 0.5
    verts += [(fx1,fy1,-0.05),(fx2,fy1,-0.05),(fx2,fy2,-0.05),(fx1,fy2,-0.05)]
    fo = vo
    floor_faces = [(fo,fo+1,fo+2),(fo,fo+2,fo+3)]

    with open(output_obj, "w", encoding="utf-8") as f:
        f.write(f"mtllib {mtl_name}\n")
        f.write(f"# ASIS AI — {len(outer_walls)+len(inner_walls)} walls | fallback={fallback_used}\n")
        for vx,vy,vz in verts:
            f.write(f"v {vx:.6f} {vy:.6f} {vz:.6f}\n")
        f.write("\nusemtl outer_wall\n")
        for a,b,c in faces_outer:
            f.write(f"f {a} {b} {c}\n")
        f.write("\nusemtl structural_wall\n")
        for a,b,c in faces_spine:
            f.write(f"f {a} {b} {c}\n")
        f.write("\nusemtl inner_wall\n")
        for a,b,c in faces_inner:
            f.write(f"f {a} {b} {c}\n")
        f.write("\nusemtl floor_slab\n")
        for a,b,c in floor_faces:
            f.write(f"f {a} {b} {c}\n")

    fallback_used = bool(fallback_used)
    total_wall_len   = round(sum(w["length_m"] for w in outer_walls+inner_walls), 2)
    total_room_area  = round(sum(r["area_m2"]  for r in rooms), 2)
    load_bearing_cnt = sum(1 for w in outer_walls if w["wall_type"]=="load-bearing")
    spine_cnt        = sum(1 for w in outer_walls if w["wall_type"]=="structural")
    partition_cnt    = len(inner_walls)
    structural_issues = detect_structural_issues(outer_walls, inner_walls, rooms, border)
    all_walls = outer_walls + inner_walls
    optimization_recommendations = build_optimization_recommendations(structural_issues, all_walls, price_info['prices'])
    cost_breakdown, cost_estimate = calculate_cost_breakdown(all_walls, price_info['prices'])
    multistorey_summary = {
        'is_multistorey': len(floor_groups) > 1,
        'floor_count': len(floor_groups),
        'floors': floor_summary,
    }

    # ── Stage 05: Structural concerns + plain-language explainability ────────────
    SPAN_WARN  = 6.0   # m — spans > 6m need beam/column support
    SPAN_CRIT  = 9.0   # m — spans > 9m are critical

    concerns = []
    for r in rooms:
        for dim, label in [(r["span_x_m"], "width"), (r["span_y_m"], "height")]:
            if dim >= SPAN_CRIT:
                concerns.append({
                    "severity": "critical",
                    "room":     r["label"],
                    "span_m":   dim,
                    "axis":     label,
                    "message":  (
                        f"CRITICAL: {r['label']} has a {dim}m unsupported {label} span. "
                        f"Spans over {SPAN_CRIT}m require RCC beams and intermediate columns. "
                        f"Without support, deflection and cracking are likely."
                    ),
                })
            elif dim >= SPAN_WARN:
                concerns.append({
                    "severity": "warning",
                    "room":     r["label"],
                    "span_m":   dim,
                    "axis":     label,
                    "message":  (
                        f"WARNING: {r['label']} has a {dim}m {label} span. "
                        f"Spans over {SPAN_WARN}m should be reviewed for beam support. "
                        f"Consider adding a lintel or RCC beam."
                    ),
                })

    # Plain-language summary narrative
    total_walls = load_bearing_cnt + spine_cnt + partition_cnt
    narrative_parts = [
        f"This floor plan covers {border['total_area_m2']} m\u00b2 with {len(rooms)} rooms "
        f"across a {border['width_m']}m \u00d7 {border['height_m']}m footprint.",

        f"The structural system uses {load_bearing_cnt} load-bearing outer walls "
        f"(recommended material: Red Brick — best cost-strength tradeoff for boundary walls), "
        f"{spine_cnt} structural spine wall{'s' if spine_cnt != 1 else ''} "
        f"(recommended: RCC for maximum strength), and "
        f"{partition_cnt} partition wall{'s' if partition_cnt != 1 else ''} "
        f"(recommended: Fly Ash Brick — lightweight and economical).",

        f"The floor slab is modelled as a flat RCC plate at ground level, "
        f"extruded to the standard {WALL_HEIGHT}m storey height.",
    ]

    if concerns:
        crit = [c for c in concerns if c["severity"] == "critical"]
        warn = [c for c in concerns if c["severity"] == "warning"]
        if crit:
            narrative_parts.append(
                f"\u26a0\ufe0f {len(crit)} critical span issue{'s' if len(crit)>1 else ''} detected: "
                + "; ".join(c['message'] for c in crit)
            )
        if warn:
            narrative_parts.append(
                f"\u26a0\ufe0f {len(warn)} span warning{'s' if len(warn)>1 else ''}: "
                + "; ".join(c['message'] for c in warn)
            )
    else:
        narrative_parts.append(
            "\u2705 No structural span concerns detected. All room dimensions are within safe limits."
        )

    narrative_parts.append(
        "Material selection uses a weighted tradeoff formula: "
        "Score = (0.5\u00d7Strength + 0.3\u00d7Durability) / (0.2\u00d7Cost). "
        "Higher scores indicate better value. "
        "Load-bearing elements prioritise strength; partitions prioritise cost savings."
    )

    explainability = {
        "narrative":  " ".join(narrative_parts),
        "concerns":   concerns,
        "formula":    "Score = (0.5×Strength + 0.3×Durability) / (0.2×Cost)",
        "weights":    {"strength": 0.5, "durability": 0.3, "cost": 0.2},
        "span_thresholds": {"warning_m": SPAN_WARN, "critical_m": SPAN_CRIT},
    }

    return {
        "fallback_used": fallback_used,
        "image":  {"width_px": w_img, "height_px": h_img},
        "border": border,
        "graph": {
            "nodes":       graph_nodes,
            "edges":       graph_edges,
            "node_count":  len(graph_nodes),
            "edge_count":  len(graph_edges),
        },
        "walls": {
            "outer":            outer_walls,
            "inner":            inner_walls,
            "outer_count":      len(outer_walls),
            "inner_count":      len(inner_walls),
            "load_bearing_count": load_bearing_cnt,
            "structural_spine_count": spine_cnt,
            "partition_count":  partition_cnt,
            "total_length_m":   total_wall_len,
        },
        "rooms": rooms,
        "material_recommendations": wall_recommendations,
        "explainability": explainability,
        "summary": {
            "total_rooms":         len(rooms),
            "total_room_area_m2":  total_room_area,
            "total_wall_length_m": total_wall_len,
            "floor_area_m2":       border["total_area_m2"],
            "wall_height_m":       WALL_HEIGHT,
            "scale":               f"1 px = {SCALE} m",
            "fallback_used":       fallback_used,
            "material_cost_estimate": cost_estimate,
            "storeys":              len(floor_groups),
        },
        "materials": {
            "outer_wall":  MATERIAL_DB["Red Brick"]["desc"],
            "inner_wall":  MATERIAL_DB["Fly Ash Brick"]["desc"],
            "structural":  MATERIAL_DB["RCC"]["desc"],
            "outer_wall_name":  "Red Brick",
            "inner_wall_name":  "Fly Ash Brick",
            "structural_name":  "RCC",
        },
        "validation": {
            "issues": structural_issues,
            "issue_count": len(structural_issues),
        },
        "optimization_recommendations": optimization_recommendations,
        "material_prices": price_info,
        "cost_breakdown": cost_breakdown,
        "robustness": robustness,
        "multistorey": multistorey_summary,
        "blueprint_filename": blueprint_filename,
        "overlay_filename": overlay_filename,
    }


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python process_floor.py <input_image> <output_obj>", file=sys.stderr)
        sys.exit(1)
    in_img, out_obj = sys.argv[1], sys.argv[2]
    os.makedirs(os.path.dirname(out_obj), exist_ok=True)
    try:
        print(json.dumps(analyse(in_img, out_obj)))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(2)
