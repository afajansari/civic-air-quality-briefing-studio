/**
 * Civic Air Quality Briefing Studio - Storage Service
 * Handles persistence of generated briefs and previous comparisons
 * Fully compatible with Vercel serverless functions, containerized environments, and local development.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { CivicBrief } from '../types';

// In serverless (Vercel), process.cwd() is read-only at runtime.
// Use os.tmpdir() for write operations in serverless or fallback.
const IS_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const PRIMARY_DIR = IS_SERVERLESS ? path.join(os.tmpdir(), 'civic-briefs') : path.join(process.cwd(), 'data');
const STORE_PATH = path.join(PRIMARY_DIR, 'briefs-store.json');

// In-memory persistent cache
let memoryBriefs: CivicBrief[] = [];

function ensureDataDir() {
  try {
    if (!fs.existsSync(PRIMARY_DIR)) {
      fs.mkdirSync(PRIMARY_DIR, { recursive: true });
    }
  } catch {
    // Non-blocking in read-only / restricted environments
  }
}

export function getSavedBriefs(): CivicBrief[] {
  ensureDataDir();
  try {
    if (fs.existsSync(STORE_PATH)) {
      const data = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryBriefs = parsed;
        return parsed;
      }
    }
  } catch {
    // Graceful fallback to memory store
  }
  return memoryBriefs;
}

export function saveBrief(brief: CivicBrief): CivicBrief {
  ensureDataDir();
  const briefs = getSavedBriefs();
  const updated = [brief, ...briefs.filter(b => b.id !== brief.id)].slice(0, 50);
  memoryBriefs = updated;

  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(updated, null, 2), 'utf-8');
  } catch {
    // In serverless where /tmp might be constrained, in-memory cache holds it
  }
  return brief;
}

export function getLatestBrief(): CivicBrief | null {
  const briefs = getSavedBriefs();
  return briefs.length > 0 ? briefs[0] : null;
}

export function getBriefById(id: string): CivicBrief | null {
  const briefs = getSavedBriefs();
  return briefs.find(b => b.id === id) || null;
}
