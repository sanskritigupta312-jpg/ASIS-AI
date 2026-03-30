import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
// import { createHash } from 'crypto'; // blockchain commented out

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

const runPythonModelGenerator = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'process_floor.py');
    const pythonCmd = process.env.PYTHON_PATH || 'python';
    const pythonProcess = spawn(pythonCmd, [scriptPath, inputPath, outputPath]);
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
          reject(new Error('Invalid JSON from Python analysis script.'));
        }
      } else {
        reject(new Error(`Python exited ${code}: ${stderr || 'without output'}`));
      }
    });
  });
};

const createFallbackOBJ = (task, outputPath) => {
  const x = 0;
  const y = 0;
  const w = 120;
  const h = 80;
  const scale = 0.01;

  const vertices = [
    [x * scale, y * scale, 0],
    [(x + w) * scale, y * scale, 0],
    [(x + w) * scale, (y + h) * scale, 0],
    [x * scale, (y + h) * scale, 0],
    [x * scale, y * scale, 0.4],
    [(x + w) * scale, y * scale, 0.4],
    [(x + w) * scale, (y + h) * scale, 0.4],
    [x * scale, (y + h) * scale, 0.4],
  ];

  const faces = [
    [1, 2, 3],
    [1, 3, 4],
    [5, 8, 7],
    [5, 7, 6],
    [1, 2, 6],
    [1, 6, 5],
    [2, 3, 7],
    [2, 7, 6],
    [3, 4, 8],
    [3, 8, 7],
    [4, 1, 5],
    [4, 5, 8],
  ];

  const lines = [
    '# fallback floor plan OBJ generated by backend',
    ...vertices.map((v) => `v ${v[0]} ${v[1]} ${v[2]}`),
    ...faces.map((f) => `f ${f[0]} ${f[1]} ${f[2]}`),
  ];

  fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');
};

const createFallbackAnalysis = (task) => {
  const outerWallDesc = 'Fired clay brick. High compressive strength, good thermal mass, proven load-bearing performance.';
  const innerWallDesc = 'Industrial by-product brick. Lighter than clay, good insulation, lower cost.';
  const structuralDesc = 'Reinforced Cement Concrete. Maximum compressive and tensile strength.';
  const rccCost = 8500;

  return {
    fallback_used: true,
    image: { width_px: 2048, height_px: 1536 },
    border: { width_m: 6.0, height_m: 4.75, total_area_m2: 28.5 },
    graph: { nodes: [], edges: [], node_count: 0, edge_count: 0 },
    walls: {
      outer: [
        { id: 1, x1: 0, y1: 0, x2: 6.0, y2: 0, length_m: 6.0, wall_type: 'load-bearing', material: 'Red Brick' },
      ],
      inner: [],
      outer_count: 1,
      inner_count: 0,
      load_bearing_count: 1,
      structural_spine_count: 0,
      partition_count: 0,
      total_length_m: 24.0,
    },
    rooms: [
      { id: 'R1', label: 'Living Area', width_m: 6.0, height_m: 4.75, area_m2: 28.5, perimeter_m: 21.5 },
    ],
    material_recommendations: [],
    explainability: {
      narrative: 'Fallback analysis generated because the image processing pipeline could not complete. Upload a clear, high-contrast floor plan for better automatic detection.',
      concerns: [],
      formula: 'Score = (0.5×Strength + 0.3×Durability) / (0.2×Cost)',
      weights: { strength: 0.5, durability: 0.3, cost: 0.2 },
      span_thresholds: { warning_m: 6, critical_m: 9 },
    },
    summary: {
      total_rooms: 1,
      total_room_area_m2: 28.5,
      total_wall_length_m: 24.0,
      floor_area_m2: 28.5,
      wall_height_m: 3.0,
      scale: '1 px = 0.05 m',
      fallback_used: true,
      material_cost_estimate: 45000,
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
      'Fallback analysis used. For more accurate results, upload a clean line-art blueprint with clearly defined walls.',
    ],
    material_prices: { source: 'fallback', prices: DEFAULT_MATERIAL_PRICES, units: '₹/m³' },
    cost_breakdown: [
      { wall_id: 'slab', material: 'RCC', volume_m3: 8.5, cost: Math.round(rccCost * 8.5) },
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

// ── Blockchain (commented out) ───────────────────────────────────────────────
/*
const blockchain = [];

const sha256 = (data) =>
  createHash('sha256').update(JSON.stringify(data)).digest('hex');

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

  const hash = sha256({ ...blockData, prevHash });
  const block = { ...blockData, hash };
  blockchain.push(block);
  return block;
};

blockchain.push({
  index: 0,
  taskId: 'genesis',
  timestamp: new Date().toISOString(),
  prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
  hash: sha256({ genesis: true }),
  summary: {}, walls: { outer: 0, inner: 0 }, rooms: 0, floorArea: 0,
});
*/

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
      // task.block = mineBlock(taskId, analysis); // blockchain commented out
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
  
  const task = tasks.get(taskId);
  
  const uploadUrl = task.uploadFilename ? `/uploads/${task.uploadFilename}` : null;
  const modelUrl = task.modelFilename ? `/outputs/${task.modelFilename}` : null;
  const blueprintUrl = task.analysis?.blueprint_filename ? `/outputs/${task.analysis.blueprint_filename}` : null;
  const overlayUrl = task.analysis?.overlay_filename ? `/outputs/${task.analysis.overlay_filename}` : null;

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
    // block: task.block ?? null, // blockchain commented out
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

// 4. Blockchain endpoint (commented out)
/*
app.get('/api/blockchain', (req, res) => {
  let valid = true;
  for (let i = 1; i < blockchain.length; i++) {
    const b = blockchain[i];
    const expectedHash = sha256({
      index: b.index, taskId: b.taskId, timestamp: b.timestamp,
      prevHash: b.prevHash, summary: b.summary, walls: b.walls,
      rooms: b.rooms, floorArea: b.floorArea,
    });
    if (b.hash !== expectedHash || b.prevHash !== blockchain[i - 1].hash) {
      valid = false;
      break;
    }
  }
  res.status(200).json({ chain: blockchain, length: blockchain.length, valid });
});
*/

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 ASIS AI Backend running reliably on http://localhost:${PORT}`);
});