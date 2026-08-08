const { spawn } = require('child_process');
const fs = require('fs');

const out = fs.openSync('push_output.txt', 'w');
const err = fs.openSync('push_error.txt', 'w');

const p = spawn('npx', ['supabase', 'db', 'push', '--debug'], {
  stdio: ['pipe', out, err],
  shell: true
});

setTimeout(() => {
  p.stdin.write("y\n");
}, 2000);

p.on('close', (code) => {
  console.log('Exited with code', code);
});
