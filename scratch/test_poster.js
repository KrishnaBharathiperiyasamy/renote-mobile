async function testPoster() {
  const loginRes = await fetch('http://localhost:3005/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'app-code': 'RENOTE' },
    body: JSON.stringify({
      emailOrPhone: 'testuser_1794919209779@example.com',
      password: 'Password@123',
      appCode: 'RENOTE'
    })
  });
  const loginData = await loginRes.json();
  const token = loginData?.data?.accessToken;
  const user = loginData?.data?.user;
  console.log('Login status:', loginRes.status, 'User:', user.id);

  // Get companies for user
  const compRes = await fetch(`http://localhost:6003/api/companies/getAllCompanies/${user.id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const compData = await compRes.json();
  const companyId = compData.company[0]?._id;
  console.log('Company ID:', companyId);

  // Next poster ID
  const nextRes = await fetch(`http://localhost:6003/api/posters/next-poster-id/${user.id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const nextData = await nextRes.json();
  console.log('Next Poster ID:', nextData);

  // Create Poster
  const posterRes = await fetch(`http://localhost:6003/api/posters/createPoster/${user.id}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      posterId: nextData.posterId || 'POS-1',
      poster_title: 'Weekend Super Sale',
      poster_name: 'Summer Promo',
      product_name: 'Dell XPS 15',
      product_description: 'High performance laptop',
      product_price: 125000,
      product_image: 'default-product.png',
      company_id: companyId,
      template: 'frame1',
      templateCategory: 'Classic',
      colorThemeId: 'flame-orange',
      bgTypeId: 'clean-white',
      aspect_ratio: '3:4',
      logo_zoom: 1.0,
      product_zoom: 1.0,
      logo_position: { x: 0, y: 0 },
      product_position: { x: 0, y: 0 },
      stickers: []
    })
  });
  console.log('Create Poster status:', posterRes.status);
  const posterData = await posterRes.json();
  console.log('Poster Data:', JSON.stringify(posterData));

  // Fetch Posters
  const fetchRes = await fetch(`http://localhost:6003/api/posters/getPoster/${user.id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Fetch Posters status:', fetchRes.status);
  const fetchedPosters = await fetchRes.json();
  console.log('Fetched Posters count:', fetchedPosters?.posters?.length || fetchedPosters?.length || 0);
}

testPoster().catch(console.error);
