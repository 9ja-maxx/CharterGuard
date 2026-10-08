#!/usr/bin/env node
import { createAccount, createClient, chains, generatePrivateKey } from '../frontend/node_modules/genlayer-js/dist/index.js';

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x2647C6fb4337E422ad32e12A55D87A4DFe26a0D4';
const PRIVATE_KEY = process.env.PRIVATE_KEY || process.argv[2];

if (!PRIVATE_KEY || !/^0x[0-9a-fA-F]{64}$/.test(PRIVATE_KEY)) {
  console.error('Usage: PRIVATE_KEY=0x... node scripts/simulate_lifecycle.mjs');
  console.error('Or: node scripts/simulate_lifecycle.mjs 0x<64-hex-private-key>');
  process.exit(1);
}

const chain = {
  ...chains.studioDevnet,
  id: 61997,
  name: 'GenLayer Studio Next',
  rpcUrls: { default: { http: ['https://studio-next.genlayer.com/api'] } },
};

const account = createAccount(PRIVATE_KEY);
const client = createClient({ chain, account });

console.log('Running CharterGuard on-chain lifecycle simulation...');
console.log('Operator Address:', account.address);
console.log('Contract Address:', CONTRACT_ADDRESS);

const balance = await client.getBalance({ address: account.address });
console.log('Operator Balance:', balance.toString(), 'wei');

const read = (name, args = []) =>
  client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: name,
    args,
    stateStatus: 'finalized',
    jsonSafeReturn: true,
  });

const counts = await read('get_charter_counts');
console.log('Current Protocol Telemetry:', counts);
