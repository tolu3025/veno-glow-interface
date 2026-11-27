import readline from 'readline';

// Mock stdin and setRawMode for ink
process.stdin.isTTY = true;
process.stdin.setRawMode = function (val) {
  console.log('[Mock setRawMode]', val);
  return this;
};

// Enable keypress events on stdin
readline.emitKeypressEvents(process.stdin);

// Simulate pressing Enter periodically (every 2.5 seconds) to select "Continue"
const interval = setInterval(() => {
  console.log('[Simulating Enter key...]');
  try {
    process.stdin.emit('keypress', '\r', {
      name: 'return',
      ctrl: false,
      meta: false,
      shift: false
    });
    process.stdin.emit('data', '\r');
  } catch (err) {
    console.error('Failed to emit keypress:', err);
    clearInterval(interval);
  }
}, 2500);

// Setup arguments
process.argv = [
  process.argv[0],
  'node_modules/@posthog/wizard/dist/bin.js',
  'mcp-analytics',
  '--project-id=490427'
];

console.log('Spawning @posthog/wizard with mocked stdin...');
import('../node_modules/@posthog/wizard/dist/bin.js').catch((err) => {
  console.error('Error importing @posthog/wizard:', err);
});
