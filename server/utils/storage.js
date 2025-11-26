import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFile = path.join(__dirname, '../data.json');

export async function readData() {
  try {
    const data = await fs.readFile(dataFile, 'utf8');
    const parsed = JSON.parse(data);
    console.log('Data file read successfully from:', dataFile);
    return parsed;
  } catch (error) {
    console.log('Data file not found or invalid, using empty data:', error.message);
    return { products: [], clients: [] };
  }
}

export async function writeData(data) {
  try {
    console.log('writeData called');
    console.log('Data file path:', dataFile);
    
    // Ensure directory exists
    const dir = path.dirname(dataFile);
    console.log('Directory path:', dir);
    await fs.mkdir(dir, { recursive: true });
    console.log('Directory ensured');
    
    // Write file
    const jsonString = JSON.stringify(data, null, 2);
    console.log('JSON string length:', jsonString.length);
    await fs.writeFile(dataFile, jsonString, 'utf8');
    console.log('✓ Data file written successfully');
    return true;
  } catch (error) {
    console.error('✗ ERROR IN writeData ✗');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Data file path:', dataFile);
    console.error('Full error:', error);
    throw new Error(`Failed to save data: ${error.message}`);
  }
}

export async function getProducts() {
  const data = await readData();
  return data.products || [];
}

export async function saveProducts(products) {
  const data = await readData();
  data.products = products;
  await writeData(data);
}

export async function getClients() {
  const data = await readData();
  return data.clients || [];
}

export async function saveClients(clients) {
  const data = await readData();
  data.clients = clients;
  await writeData(data);
}

