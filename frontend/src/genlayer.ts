import { createClient } from 'genlayer-js';
import { studioDevnet } from 'genlayer-js/chains';
import type { CalldataEncodable } from 'genlayer-js/types';

// Environment variables
const env = (import.meta.env || {}) as Record<string, string | undefined>;
export const CONTRACT_ADDRESS = (env.VITE_CONTRACT_ADDRESS || '0x2647C6fb4337E422ad32e12A55D87A4DFe26a0D4').trim();
export const isConfigured = /^0x[a-fA-F0-9]{40}$/.test(CONTRACT_ADDRESS);

export const CHARTER_GUARD_CHAIN = {
  ...studioDevnet,
  id: 61997,
  name: 'GenLayer Studio Next',
  rpcUrls: {
    default: {
      http: ['https://studio-next.genlayer.com/api'],
    },
  },
};

// Global read-only client
const rpcReader = createClient({ chain: CHARTER_GUARD_CHAIN });

export async function connectWallet(): Promise<string> {
  const provider = window.ethereum;
  if (!provider?.request) {
    throw new Error('Please install a compatible Web3 wallet (MetaMask, Rabby, etc.).');
  }

  const accounts = (await provider.request({ method: 'eth_requestAccounts' })) as string[];
  const account = accounts?.[0] || '';
  if (!/^0x[a-fA-F0-9]{40}$/.test(account)) {
    throw new Error('Wallet did not return a valid Ethereum address.');
  }

  const chainIdHex = (await provider.request({ method: 'eth_chainId' })) as string;
  if (BigInt(chainIdHex) !== 61997n) {
    throw new Error('Please switch your wallet to GenLayer Studio Next (Chain ID 61997).');
  }

  return account;
}

export async function readContract<T = unknown>(
  functionName: string,
  args: CalldataEncodable[] = []
): Promise<T> {
  if (!isConfigured) {
    throw new Error('Contract address is not configured. Set VITE_CONTRACT_ADDRESS.');
  }

  return rpcReader.readContract({
    address: CONTRACT_ADDRESS,
    functionName,
    args,
    jsonSafeReturn: true,
    stateStatus: 'finalized',
  } as never) as Promise<T>;
}

export async function writeContract(
  account: string,
  functionName: string,
  args: CalldataEncodable[]
): Promise<string> {
  if (!isConfigured) {
    throw new Error('Contract address is not configured. Set VITE_CONTRACT_ADDRESS.');
  }

  const provider = window.ethereum;
  if (!provider) {
    throw new Error('Injected wallet provider unavailable.');
  }

  const currentAccount = await connectWallet();
  if (currentAccount.toLowerCase() !== account.toLowerCase()) {
    throw new Error('Active wallet account changed. Please reconnect.');
  }

  const client = createClient({
    chain: CHARTER_GUARD_CHAIN,
    provider,
    account: account as `0x${string}`,
  });

  // Estimate transaction fee parameters
  const fees = await client.estimateTransactionFees({
    leaderTimeunitsAllocation: 300n,
    validatorTimeunitsAllocation: 600n,
  });

  const rawTx: any = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName,
    args,
    fees: {
      distribution: fees.distribution,
      feeValue: fees.feeValue,
    },
  } as never);

  const hash = typeof rawTx === 'string' ? rawTx : rawTx?.hash || rawTx?.txId || '';
  if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
    throw new Error('Wallet returned an invalid transaction hash.');
  }

  // Await consensus finalization on GenLayer
  const receipt: any = await rpcReader.waitForTransactionReceipt({
    hash,
    waitUntil: 'finalized',
    interval: 3500,
    retries: 400,
  });

  if (receipt?.txExecutionResultName && receipt.txExecutionResultName !== 'FINISHED_WITH_RETURN') {
    throw new Error(`Transaction execution failed: ${receipt.txExecutionResultName}`);
  }

  const txDetails: any = await rpcReader.getTransaction({ hash });
  const consensus = String(txDetails?.result_name || txDetails?.result || '');
  if (consensus && !['AGREE', 'MAJORITY_AGREE'].includes(consensus)) {
    throw new Error(`Validator consensus rejected execution: ${consensus}`);
  }

  return hash;
}

export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address || '—';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function getExplorerTxUrl(hash: string): string {
  return `https://explorer-studio-dev.genlayer.com/transactions/${hash}`;
}

export function getExplorerAddressUrl(): string {
  return `https://explorer-studio-dev.genlayer.com/address/${CONTRACT_ADDRESS}`;
}
