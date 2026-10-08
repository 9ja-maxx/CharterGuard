#!/usr/bin/env node
import { createClient } from '../frontend/node_modules/genlayer-js/dist/index.js';
import { studioDevnet } from '../frontend/node_modules/genlayer-js/dist/chains/index.js';

const address = process.argv[2];
if (!/^0x[0-9a-fA-F]{40}$/.test(address || '')) {
  console.error('Usage: node scripts/inspect_charter.mjs <0xContractAddress>');
  process.exit(1);
}

const chain = {
  ...studioDevnet,
  id: 61997,
  name: 'GenLayer Studio Next',
  rpcUrls: { default: { http: ['https://studio-next.genlayer.com/api'] } },
};

const client = createClient({ chain });
const read = (name, args = []) =>
  client.readContract({
    address,
    functionName: name,
    args,
    stateStatus: 'finalized',
    jsonSafeReturn: true,
  });

console.log('Inspecting CharterGuard at:', address);
const meta = await read('get_protocol_metadata');
console.log('Protocol metadata:', JSON.stringify(meta, null, 2));

const counts = await read('get_charter_counts');
console.log('Telemetry counts:', JSON.stringify(counts));

for (let i = 1; i <= Number(counts.charters); i++) {
  console.log(`Charter #${i}:`, JSON.stringify(await read('get_charter', [i]), null, 2));
}

for (let i = 1; i <= Number(counts.amendments); i++) {
  console.log(`Amendment #${i}:`, JSON.stringify(await read('get_amendment', [i]), null, 2));
}

for (let i = 1; i <= Number(counts.audits); i++) {
  console.log(`Audit #${i}:`, JSON.stringify(await read('get_audit', [i]), null, 2));
}
