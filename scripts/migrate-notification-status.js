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

/**
 * Calculate notification status based on bill payment status and expire date
 * @param {string} paymentStatus - Current payment status (P, PEN, ATR)
 * @param {number} expireDate - Expire date in milliseconds
 * @returns {string} Notification status (null, green, yellow, red)
 */
function calculateNotificationStatus(paymentStatus, expireDate) {
  // Status null: Bill is already paid
  if (paymentStatus === 'P') {
    return 'null';
  }

  const now = Date.now();
  const dueDate = new Date(expireDate);
  const timeDiff = dueDate.getTime() - now;
  
  // Calculate days until due date
  const daysUntilDue = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

  // Status red: Bill is due today or overdue
  if (daysUntilDue <= 0) {
    return 'red';
  }
  
  // Status yellow: 1 week or less to pay (1-7 days)
  if (daysUntilDue <= 7) {
    return 'yellow';
  }
  
  // Status green: more than 1 week to pay
  return 'green';
}

async function migrateBillsToPay() {
  console.log('Starting migration: Adding notificationStatus to billsToPay');
  
  const collectionRef = db.collection('billsToPay');
  const snapshot = await collectionRef.get();
  
  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  console.log(`Found ${snapshot.size} bills to process`);
  
  for (const doc of snapshot.docs) {
    try {
      const data = doc.data();
      
      // Skip if notificationStatus already exists
      if (data.notificationStatus !== undefined) {
        console.log(`Skipping bill ${doc.id}: notificationStatus already exists`);
        skippedCount++;
        continue;
      }
      
      // Calculate notification status
      const notificationStatus = calculateNotificationStatus(
        data.paymentStatus,
        data.expireDate
      );
      
      // Update the document
      await collectionRef.doc(doc.id).update({
        notificationStatus: notificationStatus
      });
      
      migratedCount++;
      console.log(`Migrated bill ${doc.id}: status=${notificationStatus} (paymentStatus=${data.paymentStatus}, expireDate=${new Date(data.expireDate).toISOString()})`);
      
    } catch (error) {
      errorCount++;
      console.error(`Error migrating bill ${doc.id}:`, error.message);
    }
  }
  
  console.log('\n=== Migration Summary ===');
  console.log(`Total bills processed: ${snapshot.size}`);
  console.log(`Successfully migrated: ${migratedCount}`);
  console.log(`Skipped (already migrated): ${skippedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log('Migration completed!');
}

// Run the migration
migrateBillsToPay()
  .then(() => {
    console.log('\nMigration script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nMigration script failed:', error);
    process.exit(1);
  });
