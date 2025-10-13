const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin using the same configuration as your app
const privateKey = process.env.NEXT_PUBLIC_FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
  });
}

const db = admin.firestore();

// Collections to migrate
const collections = [
  'clients',
  'projects', 
  'suppliers',
  'employees',
  'users',
  'invites',
  'billsToPay',
  'billsToReceive',
  'notifications',
  'passwordRecoveryRequests'
];

async function migrateCollection(collectionName) {
  console.log(`Migrating collection: ${collectionName}`);
  
  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();
  
  let migratedCount = 0;
  let skippedCount = 0;
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const updates = {};
    let needsUpdate = false;
    
    // Add deletedAt = null if it doesn't exist
    if (data.deletedAt === undefined) {
      updates.deletedAt = null;
      needsUpdate = true;
    }
    
    // Add updatedAt = null if it doesn't exist
    if (data.updatedAt === undefined) {
      updates.updatedAt = null;
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      try {
        await doc.ref.update(updates);
        migratedCount++;
        const updatedFields = Object.keys(updates).join(', ');
        console.log(`  ✓ Added ${updatedFields} to document ${doc.id}`);
      } catch (error) {
        console.error(`  ✗ Error migrating document ${doc.id}:`, error);
      }
    } else {
      skippedCount++;
    }
  }
  
  console.log(`Collection ${collectionName}: ${migratedCount} migrated, ${skippedCount} skipped\n`);
}

async function migrateAllCollections() {
  console.log('Starting audit fields migration...\n');
  
  for (const collection of collections) {
    try {
      await migrateCollection(collection);
    } catch (error) {
      console.error(`Error migrating collection ${collection}:`, error);
    }
  }
  
  console.log('Audit fields migration completed!');
  process.exit(0);
}

// Run the migration
migrateAllCollections().catch(console.error);