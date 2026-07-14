const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../../../../data/db.json');
const personasDir = path.resolve(__dirname, '../../../../data/personas');

const initialData = {
  users: {
    1: { id: 1, name: 'Arjun Mehta', email: 'arjun.mehta@demo.com', password: '1234', persona: 'arjun_38', health_score: 78, savings_rate: 0.22, risk_appetite: 'moderate', kyc_verified: true, monthly_income: 120000 },
    2: { id: 2, name: 'Priya Sharma', email: 'priya.sharma@demo.com', password: '1234', persona: 'priya_27', health_score: 85, savings_rate: 0.30, risk_appetite: 'conservative', kyc_verified: true, monthly_income: 95000 },
    3: { id: 3, name: 'Ramesh Kumar', email: 'ramesh.kumar@demo.com', password: '1234', persona: 'ramesh_45', health_score: 62, savings_rate: 0.12, risk_appetite: 'aggressive', kyc_verified: false, monthly_income: 150000 },
    4: { id: 4, name: 'Neha Sharma', email: 'neha.sharma@demo.com', password: '1234', persona: 'neha_33', health_score: 91, savings_rate: 0.35, risk_appetite: 'conservative', kyc_verified: true, monthly_income: 80000 },
  },
  trustedDevices: {
    1: ['device-arjun-phone'],
    2: ['device-priya-laptop'],
    3: ['device-ramesh-phone'],
    4: ['device-neha-tablet'],
  },
  otps: {} // userId -> { code, expiresAt }
};

function readDb() {
  try {
    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }
    const content = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('[DB] Failed to read database:', err);
    return initialData;
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Failed to write database:', err);
  }
}

// Directly updates the corresponding static persona json file so aggregator/engines pull updated values
function updatePersonaFile(personaName, key, value) {
  try {
    const filePath = path.join(personasDir, `${personaName}.json`);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const personaData = JSON.parse(content);
      personaData[key] = value;
      fs.writeFileSync(filePath, JSON.stringify(personaData, null, 2), 'utf-8');
      console.log(`[DB] Successfully updated persona file: ${personaName}.json [key: ${key}]`);
    } else {
      console.warn(`[DB] Persona file not found to update: ${personaName}.json`);
    }
  } catch (err) {
    console.error(`[DB] Failed to update persona file ${personaName}.json:`, err);
  }
}

module.exports = {
  readDb,
  writeDb,
  updatePersonaFile
};
