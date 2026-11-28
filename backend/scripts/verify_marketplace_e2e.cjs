const axios = require('axios');

async function verifyAllFlows() {
  console.log("==================================================");
  console.log("       RENOTE E2E FLOW & MARKETPLACE TEST         ");
  console.log("==================================================\n");

  let allPassed = true;

  // 1. Marketplace Feed
  try {
    const t0 = Date.now();
    const res = await axios.get('http://localhost:6003/api/marketplace/feed');
    const elapsed = Date.now() - t0;
    console.log(`[PASS] 1. Marketplace Feed: Status ${res.status} in ${elapsed}ms`);
    console.log(`       Total posters: ${res.data?.total}, Returned: ${res.data?.posters?.length}`);
    if (!res.data?.posters || res.data.posters.length === 0) {
      console.error("       [FAIL] No posters returned!");
      allPassed = false;
    } else {
      const p1 = res.data.posters[0];
      console.log(`       Sample Item: "${p1.product_name || p1.poster_name}" | Company: "${p1.company_id?.name}" | City: "${p1.company_id?.city || p1.marketplaceCity}"`);
    }
  } catch (err) {
    console.error("[FAIL] 1. Marketplace Feed error:", err.message);
    allPassed = false;
  }

  // 2. Categories Feed
  try {
    const t0 = Date.now();
    const res = await axios.get('http://localhost:6003/api/categories');
    const elapsed = Date.now() - t0;
    console.log(`\n[PASS] 2. Categories: Status ${res.status} in ${elapsed}ms`);
    console.log(`       Categories count: ${res.data?.categories?.length}`);
  } catch (err) {
    console.error("\n[FAIL] 2. Categories error:", err.message);
    allPassed = false;
  }

  // 3. Image & Static Asset Serving
  try {
    const t0 = Date.now();
    const sampleImgPath = "/uploads/69d362ca7421b5bc1882903d/6970798adb7d61d4120954bb/1787308337379-638866324.png";
    const res = await axios.get(`http://localhost:6003${sampleImgPath}`, { responseType: 'arraybuffer' });
    const elapsed = Date.now() - t0;
    console.log(`\n[PASS] 3. Asset Serving: Status ${res.status} in ${elapsed}ms`);
    console.log(`       Content-Type: ${res.headers['content-type']}, Size: ${res.data.length} bytes`);
  } catch (err) {
    console.error("\n[FAIL] 3. Asset Serving error:", err.message);
    allPassed = false;
  }

  // 4. Frontend Root & Marketplace Routes
  try {
    const t0 = Date.now();
    const res = await axios.get('http://localhost:6001/pages/marketplace');
    const elapsed = Date.now() - t0;
    console.log(`\n[PASS] 4. Frontend /pages/marketplace: Status ${res.status} in ${elapsed}ms`);
  } catch (err) {
    console.error("\n[FAIL] 4. Frontend /pages/marketplace error:", err.message);
    allPassed = false;
  }

  try {
    const t0 = Date.now();
    const res = await axios.get('http://localhost:6001/pages/home');
    const elapsed = Date.now() - t0;
    console.log(`\n[PASS] 5. Frontend /pages/home: Status ${res.status} in ${elapsed}ms`);
  } catch (err) {
    console.error("\n[FAIL] 5. Frontend /pages/home error:", err.message);
    allPassed = false;
  }

  try {
    const t0 = Date.now();
    const res = await axios.get('http://localhost:6001/');
    const elapsed = Date.now() - t0;
    console.log(`\n[PASS] 6. Frontend Root (/): Status ${res.status} in ${elapsed}ms`);
  } catch (err) {
    console.error("\n[FAIL] 6. Frontend Root (/) error:", err.message);
    allPassed = false;
  }

  console.log("\n==================================================");
  if (allPassed) {
    console.log("   ALL E2E VERIFICATIONS PASSED SUCCESSFULLY!    ");
  } else {
    console.log("   SOME VERIFICATIONS FAILED!                    ");
  }
  console.log("==================================================");
}

verifyAllFlows();
