import { spawn } from 'child_process';
import path from 'path';
const scriptPath = path.join('src','backend','process_floor.py');
const p = spawn('python', [scriptPath, 'README.md', 'src/backend/outputs/test2.obj']);
let out = '';
let err = '';
p.stdout.on('data', c => out += c.toString());
p.stderr.on('data', c => err += c.toString());
p.on('close', code => { console.log('CLOSE', code); console.log('STDOUT:' + JSON.stringify(out)); console.log('STDERR:' + JSON.stringify(err)); });
