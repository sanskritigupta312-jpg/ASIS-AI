import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

// Setup for ES Modules to get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the uploads directory exists before starting
const uploadDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'outputs');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 4000; //

// Middleware
app.use(cors()); // Allows your Vite frontend to talk to this backend without getting blocked
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadDir));
app.use('/outputs', express.static(outputDir));

// Health check endpoint
app.get('/api/ping', (req, res) => {
  res.status(200).json({ message: 'pong' });
});

// Set up Multer for robust file saving
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename to prevent overwriting
    cb(null, `${uuidv4()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Match the steps from your PipelineTracker
const steps = [
  'Upload',
  'Edge Detection',
  'Layout Reconstruction',
  '3D Generation',
  'Material Logic',
  'Final Output',
];

const tools = {
  frontend: ['React', 'Vite', 'Tailwind CSS', 'React Router'],
  backend: ['Express', 'Multer', 'CORS', 'Node.js'],
  ai: ['OpenCV', 'Image Processing', 'Pipeline Simulation'],
  rendering: ['Three.js', 'OBJ Export', 'Browser Preview'],
};

const MATERIAL_PRICE_API = process.env.MATERIAL_PRICE_API || null;
const DEFAULT_MATERIAL_PRICES = {
  'Red Brick': 4300,
  'Fly Ash Brick': 3100,
  'AAC Block': 2800,
  'RCC': 8500,
  'Hollow Concrete Block': 2700,
  'Steel Frame': 12500,
  'Precast Concrete Panel': 9800,
};

const fetchMaterialPrices = async () => {
  if (!MATERIAL_PRICE_API) {
    return { source: 'fallback', prices: DEFAULT_MATERIAL_PRICES, units: '₹/m³' };
  }
  try {
    const response = await fetch(MATERIAL_PRICE_API, { method: 'GET' });
    if (!response.ok) throw new Error('Non-200 status');
    const data = await response.json();
    const prices = {};
    for (const [material, def] of Object.entries(DEFAULT_MATERIAL_PRICES)) {
      if (data[material] && typeof data[material] === 'number') prices[material] = data[material];
      else if (data[material.toLowerCase().replace(/\s+/g, '_')] && typeof data[material.toLowerCase().replace(/\s+/g, '_')] === 'number') {
        prices[material] = data[material.toLowerCase().replace(/\s+/g, '_')];
      } else {
        prices[material] = def;
      }
    }
    return { source: 'api', prices, units: '₹/m³' };
  } catch (err) {
    return { source: 'fallback', prices: DEFAULT_MATERIAL_PRICES, units: '₹/m³' };
  }
};

const executePython = (cmd, scriptPath, inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(cmd, [scriptPath, inputPath, outputPath]);
    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    pythonProcess.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    pythonProcess.on('error', (err) => reject(err));

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const analysis = JSON.parse(stdout.trim());
          if (analysis && typeof analysis === 'object' && analysis.error) {
            return reject(new Error(analysis.error));
          }
          resolve(analysis);
        } catch (err) {
          reject(new Error(`Invalid JSON from Python (${cmd}): ${stdout.slice(0, 120)}`));
        }
      } else {
        reject(new Error(`Python (${cmd}) exited ${code}: ${stderr || stdout || 'unknown'}`));
      }
    });
  });
};

const runPythonModelGenerator = async (inputPath, outputPath) => {
  const scriptPath = path.join(__dirname, 'process_floor.py');
  const venvPython = path.join(__dirname, '..', '..', '.venv', 'Scripts', 'python.exe');
  const candidates = [];
  if (process.env.PYTHON_PATH) candidates.push(process.env.PYTHON_PATH);
  if (fs.existsSync(venvPython)) candidates.push(venvPython);
  candidates.push('python');

  let lastErr = null;
  for (const cmd of candidates) {
    try {
      return await executePython(cmd, scriptPath, inputPath, outputPath);
    } catch (err) {
      lastErr = err;
      console.warn(`Execution with ${cmd} failed: ${err.message}. Trying next candidate...`);
    }
  }
  throw lastErr || new Error('All Python runner candidates failed');
};

const createFallbackOBJ = (task, outputPath) => {
  const mtlName = path.basename(outputPath).replace(/\.obj$/i, '.mtl');
  const mtlPath = path.join(path.dirname(outputPath), mtlName);

  const mtlContent = `newmtl outer_wall\nKd 0.18 0.42 0.86\nKa 0.05 0.10 0.20\nKs 0.3 0.3 0.3\nNs 40\n\n` +
    `newmtl structural_wall\nKd 0.10 0.25 0.60\nKa 0.03 0.08 0.18\nKs 0.4 0.4 0.4\nNs 60\n\n` +
    `newmtl inner_wall\nKd 0.55 0.75 0.98\nKa 0.10 0.15 0.25\nKs 0.2 0.2 0.2\nNs 20\n\n` +
    `newmtl floor_slab\nKd 0.08 0.14 0.24\nKa 0.04 0.07 0.12\nKs 0.05 0.05 0.05\nNs 10\n`;
  fs.writeFileSync(mtlPath, mtlContent, 'utf8');

  // Realistic architectural floor plan: 14m x 10m, H=3.0m
  const W = 14.0, D = 10.0, H = 3.0, T_OUT = 0.25, T_IN = 0.15;
  const verts = [];
  const facesOuter = [], facesInner = [], facesFloor = [];
  let vo = 1;

  const addWallBox = (x1, y1, x2, y2, thick, isOuter) => {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const dx = (thick / 2.0) * Math.sin(angle);
    const dy = (thick / 2.0) * Math.cos(angle);
    const baseIdx = vo;

    // 8 box vertices (Z-up coordinate system for OBJ)
    verts.push([x1 - dx, y1 + dy, 0]);
    verts.push([x1 + dx, y1 - dy, 0]);
    verts.push([x2 + dx, y2 - dy, 0]);
    verts.push([x2 - dx, y2 + dy, 0]);
    verts.push([x1 - dx, y1 + dy, H]);
    verts.push([x1 + dx, y1 - dy, H]);
    verts.push([x2 + dx, y2 - dy, H]);
    verts.push([x2 - dx, y2 + dy, H]);

    const o = baseIdx;
    const boxF = [
      [o, o+1, o+2], [o, o+2, o+3],
      [o+4, o+7, o+6], [o+4, o+6, o+5],
      [o, o+4, o+5], [o, o+5, o+1],
      [o+1, o+5, o+6], [o+1, o+6, o+2],
      [o+2, o+6, o+7], [o+2, o+7, o+3],
      [o+3, o+7, o+4], [o+3, o+4, o],
    ];

    if (isOuter) facesOuter.push(...boxF);
    else facesInner.push(...boxF);
    vo += 8;
  };

  // Outer boundary walls
  addWallBox(0, 0, W, 0, T_OUT, true);
  addWallBox(W, 0, W, D, T_OUT, true);
  addWallBox(W, D, 0, D, T_OUT, true);
  addWallBox(0, D, 0, 0, T_OUT, true);

  // Interior partition walls
  addWallBox(8.0, 0, 8.0, D, T_OUT, true); // Structural spine
  addWallBox(0, 5.5, 8.0, 5.5, T_IN, false); // Living / Bedroom divider
  addWallBox(8.0, 4.5, W, 4.5, T_IN, false); // Kitchen / Bath divider
  addWallBox(11.0, 4.5, 11.0, D, T_IN, false); // Bath / Utility divider

  // Floor slab
  const fo = vo;
  verts.push([-0.5, -0.5, -0.05]);
  verts.push([W + 0.5, -0.5, -0.05]);
  verts.push([W + 0.5, D + 0.5, -0.05]);
  verts.push([-0.5, D + 0.5, -0.05]);
  facesFloor.push([fo, fo+1, fo+2], [fo, fo+2, fo+3]);

  let objText = `mtllib ${mtlName}\n# ASIS AI — Architectural Floor Plan Model\n`;
  for (const [vx, vy, vz] of verts) {
    objText += `v ${vx.toFixed(4)} ${vy.toFixed(4)} ${vz.toFixed(4)}\n`;
  }
  objText += `\nusemtl outer_wall\n`;
  for (const [a, b, c] of facesOuter) objText += `f ${a} ${b} ${c}\n`;
  objText += `\nusemtl inner_wall\n`;
  for (const [a, b, c] of facesInner) objText += `f ${a} ${b} ${c}\n`;
  objText += `\nusemtl floor_slab\n`;
  for (const [a, b, c] of facesFloor) objText += `f ${a} ${b} ${c}\n`;

  fs.writeFileSync(outputPath, objText, 'utf8');
};

const createFallbackAnalysis = (task) => {
  const outerWallDesc = 'Fired clay brick. High compressive strength, good thermal mass, proven load-bearing performance.';
  const innerWallDesc = 'Industrial by-product brick. Lighter than clay, good insulation, lower cost.';
  const structuralDesc = 'Reinforced Cement Concrete. Maximum compressive and tensile strength.';

  return {
    fallback_used: true,
    image: { width_px: 1600, height_px: 1100 },
    border: { width_m: 14.0, height_m: 10.0, total_area_m2: 140.0 },
    graph: { nodes: [], edges: [], node_count: 8, edge_count: 7 },
    walls: {
      outer: [
        { id: 1, x1: 0, y1: 0, x2: 14.0, y2: 0, length_m: 14.0, wall_type: 'load-bearing', material: 'Red Brick' },
        { id: 2, x1: 14.0, y1: 0, x2: 14.0, y2: 10.0, length_m: 10.0, wall_type: 'load-bearing', material: 'Red Brick' },
        { id: 3, x1: 14.0, y1: 10.0, x2: 0, y2: 10.0, length_m: 14.0, wall_type: 'load-bearing', material: 'Red Brick' },
        { id: 4, x1: 0, y1: 10.0, x2: 0, y2: 0, length_m: 10.0, wall_type: 'load-bearing', material: 'Red Brick' },
        { id: 5, x1: 8.0, y1: 0, x2: 8.0, y2: 10.0, length_m: 10.0, wall_type: 'structural', material: 'RCC' },
      ],
      inner: [
        { id: 6, x1: 0, y1: 5.5, x2: 8.0, y2: 5.5, length_m: 8.0, wall_type: 'partition', material: 'Fly Ash Brick' },
        { id: 7, x1: 8.0, y1: 4.5, x2: 14.0, y2: 4.5, length_m: 6.0, wall_type: 'partition', material: 'Fly Ash Brick' },
        { id: 8, x1: 11.0, y1: 4.5, x2: 11.0, y2: 10.0, length_m: 5.5, wall_type: 'partition', material: 'Fly Ash Brick' },
      ],
      outer_count: 5,
      inner_count: 3,
      load_bearing_count: 4,
      structural_spine_count: 1,
      partition_count: 3,
      total_length_m: 77.5,
    },
    rooms: [
      { id: 1, label: 'Living / Hall', width_m: 8.0, height_m: 5.5, area_m2: 44.0, perimeter_m: 27.0, span_x_m: 8.0, span_y_m: 5.5 },
      { id: 2, label: 'Master Bedroom', width_m: 8.0, height_m: 4.5, area_m2: 36.0, perimeter_m: 25.0, span_x_m: 8.0, span_y_m: 4.5 },
      { id: 3, label: 'Kitchen & Dining', width_m: 6.0, height_m: 4.5, area_m2: 27.0, perimeter_m: 21.0, span_x_m: 6.0, span_y_m: 4.5 },
      { id: 4, label: 'Bathroom / WC', width_m: 3.0, height_m: 5.5, area_m2: 16.5, perimeter_m: 17.0, span_x_m: 3.0, span_y_m: 5.5 },
    ],
    material_recommendations: [],
    explainability: {
      narrative: 'Architectural reconstruction generated with load-bearing outer walls and interior partitions.',
      concerns: [],
      formula: 'Score = (0.5×Strength + 0.3×Durability) / (0.2×Cost)',
      weights: { strength: 0.5, durability: 0.3, cost: 0.2 },
      span_thresholds: { warning_m: 6.0, critical_m: 9.0 },
    },
    summary: {
      total_rooms: 4,
      total_room_area_m2: 123.5,
      total_wall_length_m: 77.5,
      floor_area_m2: 140.0,
      wall_height_m: 3.0,
      scale: '1 px = 0.05 m',
      fallback_used: true,
      material_cost_estimate: 285000,
      storeys: 1,
    },
    materials: {
      outer_wall: outerWallDesc,
      inner_wall: innerWallDesc,
      structural: structuralDesc,
      outer_wall_name: 'Red Brick',
      inner_wall_name: 'Fly Ash Brick',
      structural_name: 'RCC',
    },
    validation: { issues: [] },
    optimization_recommendations: [
      'Structure complies with standard span thresholds. Main structural spine provides continuous load path.',
    ],
    material_prices: { source: 'fallback', prices: DEFAULT_MATERIAL_PRICES, units: '₹/m³' },
    cost_breakdown: [
      { wall_id: 1, type: 'load-bearing', material: 'Red Brick', length_m: 14.0, volume_m3: 10.5, cost: 45150 },
      { wall_id: 'slab', type: 'floor_slab', material: 'RCC', volume_m3: 21.0, cost: 178500 },
    ],
    robustness: { duplicate_lines_removed: 0, skewed_lines_snapped: 0 },
    multistorey: { is_multistorey: false, floor_count: 1, floors: [] },
  };
};

const createDummy3DModel = (task, outputPath) => {
  createFallbackOBJ(task, outputPath);
};

// In-memory store for tasks
const tasks = new Map();

const blockchain = [];

const sha256 = (data) => {
  const { hash, ...pureData } = data; // Don't include hash in its own hash calculation
  return createHash('sha256').update(JSON.stringify(pureData)).digest('hex');
};

const mineBlock = (taskId, analysis) => {
  const prevHash = blockchain.length > 0
    ? blockchain[blockchain.length - 1].hash
    : '0000000000000000000000000000000000000000000000000000000000000000';

  const blockData = {
    index:     blockchain.length,
    taskId,
    timestamp: new Date().toISOString(),
    prevHash,
    summary:   analysis?.summary ?? {},
    walls:     { outer: analysis?.walls?.outer_count ?? 0, inner: analysis?.walls?.inner_count ?? 0 },
    rooms:     analysis?.rooms?.length ?? 0,
    floorArea: analysis?.border?.total_area_m2 ?? 0,
  };

  const hash = sha256(blockData);
  const block = { ...blockData, hash };
  blockchain.push(block);
  return block;
};

// Create Genesis Block
blockchain.push({
  index: 0,
  taskId: 'genesis',
  timestamp: new Date().toISOString(),
  prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
  hash: sha256({ genesis: true }),
  summary: {}, walls: { outer: 0, inner: 0 }, rooms: 0, floorArea: 0,
});

// --- API ROUTES ---

// Metadata endpoints for frontend dashboard and documentation
app.get('/api/pipeline', (req, res) => {
  res.status(200).json({ steps });
});

app.get('/api/tools', (req, res) => {
  res.status(200).json({ tools });
});

app.get('/api/material-prices', async (req, res) => {
  try {
    const prices = await fetchMaterialPrices();
    res.status(200).json(prices);
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch material prices.' });
  }
});

// 1. Analyze Endpoint: Handles the file upload and starts the task
app.post('/api/analyze', upload.single('file'), (req, res) => {
  try {
    console.log('Upload request:', {
      originalName: req.file?.originalname,
      fieldName: req.file?.fieldname,
      hasFile: Boolean(req.file),
    });
    const taskId = uuidv4();
    
    // Fallback if no file is uploaded, just to keep the pipeline moving if needed
    const fileName = req.file ? req.file.originalname : 'unknown_plan.png'; 

    const task = {
      id: taskId,
      status: 'processing',
      currentStep: 0,
      fileName: fileName,
      uploadFilename: req.file ? req.file.filename : null,
      createdAt: Date.now(),
      modelFilename: null,
      analysis: null,
    };
    
    tasks.set(taskId, task);

    const uploadedFilePath = req.file ? path.join(uploadDir, req.file.filename) : null;
    const modelFilename = `${taskId}.obj`;
    const outputModelPath = path.join(outputDir, modelFilename);

    // Advance pipeline steps visually
    const advanceTask = () => {
      if (task.currentStep < steps.length - 1) {
        task.currentStep += 1;
        setTimeout(advanceTask, 1500);
      }
      // Don't set completed here — wait for Python to finish
    };
    setTimeout(advanceTask, 1500);

    const finishTask = (analysis = {}) => {
      task.modelFilename = modelFilename;
      task.currentStep = steps.length - 1;
      task.analysis = analysis;
      task.block = mineBlock(taskId, analysis);
      task.status = 'completed';
    };

    if (uploadedFilePath) {
      runPythonModelGenerator(uploadedFilePath, outputModelPath)
        .then((analysis) => finishTask(analysis))
        .catch((error) => {
          console.error('Python generation failed:', error.message);
          createDummy3DModel(task, outputModelPath);
          finishTask(createFallbackAnalysis(task));
        });
    } else {
      createDummy3DModel(task, outputModelPath);
      finishTask(createFallbackAnalysis(task));
    }

    res.status(200).json({ 
      taskId, 
      status: 'started', 
      steps: steps.length 
    });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: 'Failed to process upload.' });
  }
});

// 2. Task Polling Endpoint: Frontend calls this to get pipeline updates
app.get('/api/task', (req, res) => {
  const taskId = req.query.id;
  
  if (!taskId || !tasks.has(taskId)) {
    return res.status(404).json({ message: 'Task not found.' });
  }
  
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const uploadUrl = task.uploadFilename ? `${baseUrl}/uploads/${task.uploadFilename}` : null;
  const modelUrl = task.modelFilename ? `${baseUrl}/outputs/${task.modelFilename}` : null;
  const blueprintUrl = task.analysis?.blueprint_filename ? `${baseUrl}/outputs/${task.analysis.blueprint_filename}` : null;
  const overlayUrl = task.analysis?.overlay_filename ? `${baseUrl}/outputs/${task.analysis.overlay_filename}` : null;

  res.status(200).json({
    id: task.id,
    status: task.status,
    currentStep: task.currentStep,
    fileName: task.fileName,
    steps,
    uploadUrl,
    modelUrl,
    blueprintUrl,
    overlayUrl,
    analysis: task.analysis,
    block: task.block ?? null,
  });
});

// 3. Model endpoint
app.get('/api/model', (req, res) => {
  const taskId = req.query.id;
  if (!taskId || !tasks.has(taskId)) {
    return res.status(404).json({ message: 'Task not found.' });
  }

  const task = tasks.get(taskId);
  if (!task.modelFilename) {
    return res.status(202).json({
      message: 'Model generation still in progress.',
      uploadUrl: task.uploadFilename ? `${req.protocol}://${req.get('host')}/uploads/${task.uploadFilename}` : null,
    });
  }

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.status(200).json({
    modelUrl: `${baseUrl}/outputs/${task.modelFilename}`,
    modelFilename: task.modelFilename,
    uploadUrl: task.uploadFilename ? `${baseUrl}/uploads/${task.uploadFilename}` : null,
    blueprintUrl: task.analysis?.blueprint_filename ? `${baseUrl}/outputs/${task.analysis.blueprint_filename}` : null,
    overlayUrl: task.analysis?.overlay_filename ? `${baseUrl}/outputs/${task.analysis.overlay_filename}` : null,
  });
});

app.get('/api/blockchain', (req, res) => {
  let valid = true;
  for (let i = 1; i < blockchain.length; i++) {
    const b = blockchain[i];
    const expectedHash = sha256(b);
    if (b.hash !== expectedHash || b.prevHash !== blockchain[i - 1].hash) {
      valid = false;
      break;
    }
  }
  res.status(200).json({ chain: blockchain, length: blockchain.length, valid });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 ASIS AI Backend running reliably on http://localhost:${PORT}`);
});