import type { SQLiteDatabase } from 'expo-sqlite';

export const STATION_ID = 'bancada-01';

export type ReadingInput = {
  currentA: number;
  voltageV: number;
  activePowerW: number;
  panelTempC: number;
};

export type Reading = ReadingInput & {
  id: number;
  stationId: string;
  measuredAt: string;
  source: 'demo' | 'manual';
};

const demoValues: ReadingInput[] = [
  { currentA: 15.1, voltageV: 220.4, activePowerW: 3170, panelTempC: 30.8 },
  { currentA: 15.6, voltageV: 220.1, activePowerW: 3260, panelTempC: 31.2 },
  { currentA: 15.9, voltageV: 219.8, activePowerW: 3310, panelTempC: 31.6 },
  { currentA: 16.2, voltageV: 220.2, activePowerW: 3420, panelTempC: 32.4 },
];

function validateReading(input: ReadingInput): void {
  const values = Object.values(input);
  if (values.some((value) => !Number.isFinite(value))) {
    throw new Error('Preencha todas as grandezas com números válidos.');
  }
  if (input.currentA < 0 || input.voltageV < 0 || input.activePowerW < 0) {
    throw new Error('Corrente, tensão e potência não podem ser negativas.');
  }
}

export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      station_id TEXT NOT NULL,
      measured_at TEXT NOT NULL,
      current_a REAL NOT NULL CHECK (current_a >= 0),
      voltage_v REAL NOT NULL CHECK (voltage_v >= 0),
      active_power_w REAL NOT NULL CHECK (active_power_w >= 0),
      panel_temp_c REAL NOT NULL,
      source TEXT NOT NULL CHECK (source IN ('demo', 'manual'))
    );
    CREATE INDEX IF NOT EXISTS idx_readings_station_time
      ON readings(station_id, measured_at DESC);
  `);

  const row = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM readings WHERE station_id = ?',
    STATION_ID,
  );
  if ((row?.total ?? 0) === 0) {
    const start = Date.now() - (demoValues.length - 1) * 60_000;
    for (const [index, value] of demoValues.entries()) {
      await insertReading(db, value, 'demo', new Date(start + index * 60_000).toISOString());
    }
  }
}

export async function insertReading(
  db: SQLiteDatabase,
  input: ReadingInput,
  source: Reading['source'] = 'manual',
  measuredAt = new Date().toISOString(),
): Promise<void> {
  validateReading(input);
  await db.runAsync(
    `INSERT INTO readings
      (station_id, measured_at, current_a, voltage_v, active_power_w, panel_temp_c, source)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    STATION_ID,
    measuredAt,
    input.currentA,
    input.voltageV,
    input.activePowerW,
    input.panelTempC,
    source,
  );
}

export async function listReadings(db: SQLiteDatabase, limit = 20): Promise<Reading[]> {
  return db.getAllAsync<Reading>(
    `SELECT id, station_id AS stationId, measured_at AS measuredAt,
            current_a AS currentA, voltage_v AS voltageV,
            active_power_w AS activePowerW, panel_temp_c AS panelTempC, source
       FROM readings
      WHERE station_id = ?
      ORDER BY measured_at DESC, id DESC
      LIMIT ?`,
    STATION_ID,
    limit,
  );
}
