const axios = require('axios');
const mongoose = require('mongoose');

async function syncExistingMarketplaceData() {
  console.log("=== SYNCING EXISTING MARKETPLACE DATA TO LOCAL MONGODB ===");
  await mongoose.connect('mongodb://localhost:27017/Renote_DB');
  console.log("Connected to local MongoDB Renote_DB.");

  const db = mongoose.connection.db;

  // 1. Sync Categories
  try {
    const catRes = await axios.get('https://renote.co.in/api/categories');
    if (catRes.data?.categories?.length > 0) {
      console.log(`Fetched ${catRes.data.categories.length} categories from live API.`);
      for (const cat of catRes.data.categories) {
        const id = new mongoose.Types.ObjectId(cat._id);
        const doc = { ...cat, _id: id };
        await db.collection('categories').updateOne({ _id: id }, { $set: doc }, { upsert: true });
      }
      console.log("Categories synced successfully.");
    }
  } catch (err) {
    console.error("Categories sync warning:", err.message);
  }

  // 2. Sync Marketplace Posters, Companies, and Users
  try {
    const feedRes = await axios.get('https://renote.co.in/api/marketplace/feed?limit=100');
    const posters = feedRes.data?.posters || [];
    console.log(`Fetched ${posters.length} posters from live marketplace feed.`);

    for (const p of posters) {
      // Upsert Company if populated
      if (p.company_id && typeof p.company_id === 'object' && p.company_id._id) {
        const compId = new mongoose.Types.ObjectId(p.company_id._id);
        const compDoc = { ...p.company_id, _id: compId };
        await db.collection('companies').updateOne({ _id: compId }, { $set: compDoc }, { upsert: true });
      }

      // Upsert User if populated
      if (p.user_id && typeof p.user_id === 'object' && p.user_id._id) {
        const uId = new mongoose.Types.ObjectId(p.user_id._id);
        const uDoc = { ...p.user_id, _id: uId };
        await db.collection('users').updateOne({ _id: uId }, { $set: uDoc }, { upsert: true });
      }

      // Prepare Poster document
      const posterId = new mongoose.Types.ObjectId(p._id);
      const companyRef = p.company_id && typeof p.company_id === 'object' ? new mongoose.Types.ObjectId(p.company_id._id) : p.company_id;
      const userRef = p.user_id && typeof p.user_id === 'object' ? new mongoose.Types.ObjectId(p.user_id._id) : p.user_id;

      const posterDoc = {
        ...p,
        _id: posterId,
        company_id: companyRef,
        user_id: userRef,
      };

      await db.collection('posters').updateOne({ _id: posterId }, { $set: posterDoc }, { upsert: true });
    }
    console.log(`Successfully synced ${posters.length} posters into local MongoDB!`);

    const count = await db.collection('posters').countDocuments();
    console.log(`Total posters in local MongoDB now: ${count}`);
  } catch (err) {
    console.error("Posters sync error:", err.message);
  }

  await mongoose.disconnect();
  console.log("=== SYNC COMPLETED ===");
}

syncExistingMarketplaceData();
