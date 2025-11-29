/**
 * Migration Script: Assign Ownership to Existing Data
 * 
 * This script helps assign existing data to users.
 * Run this manually to assign orphaned data to specific users.
 * 
 * WARNING: This is a one-time migration script.
 * After running, all data should have proper userId.
 */

import { readData, writeData } from '../utils/storage.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateOwnership() {
  try {
    console.log('Starting ownership migration...');
    const data = await readData();
    
    const users = data.users || [];
    const clients = data.clients || [];
    const products = data.products || [];
    const documents = data.documents || [];
    
    // Count items without userId
    const clientsWithoutOwner = clients.filter(c => !c.userId);
    const productsWithoutOwner = products.filter(p => !p.userId);
    const documentsWithoutOwner = documents.filter(d => !d.userId);
    
    console.log(`\nFound items without userId:`);
    console.log(`- Clients: ${clientsWithoutOwner.length}`);
    console.log(`- Products: ${productsWithoutOwner.length}`);
    console.log(`- Documents: ${documentsWithoutOwner.length}`);
    
    if (clientsWithoutOwner.length === 0 && 
        productsWithoutOwner.length === 0 && 
        documentsWithoutOwner.length === 0) {
      console.log('\n✓ All items already have userId assigned!');
      return;
    }
    
    // Option 1: Assign all orphaned items to the first regular user (if exists)
    const regularUsers = users.filter(u => u.role !== 'admin');
    
    if (regularUsers.length === 0) {
      console.log('\n⚠️  No regular users found. Orphaned items will remain unassigned.');
      console.log('   Create a user first, then run this script again.');
      return;
    }
    
    // For safety, we'll create a backup first
    const backupPath = path.join(__dirname, '../data.backup.json');
    await fs.writeFile(backupPath, JSON.stringify(data, null, 2));
    console.log(`\n✓ Backup created at: ${backupPath}`);
    
    // Assign to first user (you can modify this logic)
    const targetUserId = regularUsers[0].id;
    console.log(`\nAssigning orphaned items to user: ${regularUsers[0].email} (${targetUserId})`);
    
    let assignedCount = 0;
    
    // Assign clients
    clients.forEach(client => {
      if (!client.userId) {
        client.userId = targetUserId;
        assignedCount++;
      }
    });
    
    // Assign products
    products.forEach(product => {
      if (!product.userId) {
        product.userId = targetUserId;
        assignedCount++;
      }
    });
    
    // Assign documents
    documents.forEach(doc => {
      if (!doc.userId) {
        doc.userId = targetUserId;
        assignedCount++;
      }
    });
    
    // Save updated data
    data.clients = clients;
    data.products = products;
    data.documents = documents;
    await writeData(data);
    
    console.log(`\n✓ Migration complete!`);
    console.log(`  - Assigned ${assignedCount} items to user ${regularUsers[0].email}`);
    console.log(`  - Backup saved at: ${backupPath}`);
    console.log(`\n⚠️  IMPORTANT: Review the assignment and manually reassign if needed.`);
    
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

// Run migration
migrateOwnership()
  .then(() => {
    console.log('\n✓ Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  });

