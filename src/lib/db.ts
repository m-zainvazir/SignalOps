import fs from 'fs';
import path from 'path';

export interface Product {
  id: string;
  name: string;
  stock: number;
  dailyBurnRate: number;
  nextShipmentDate: string;
  status: string;
}

export interface ActionLog {
  timestamp: string;
  action: string;
  details: string;
}

export interface DatabaseSchema {
  inventory: Product[];
  logs: ActionLog[];
}

const dbPath = path.join(process.cwd(), 'data.json');

export function getDb(): DatabaseSchema {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to read DB", error);
    return { inventory: [], logs: [] };
  }
}

export function saveDb(data: DatabaseSchema) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error("Failed to write DB", error);
  }
}

export function logAction(action: string, details: string) {
  const db = getDb();
  db.logs.push({
    timestamp: new Date().toISOString(),
    action,
    details,
  });
  saveDb(db);
}
