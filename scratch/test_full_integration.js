async function testAuth() {
  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  const testPassword = 'Password@123';

  console.log(`1. Testing Registration for ${testEmail}...`);
  const regRes = await fetch('http://localhost:3005/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'app-code': 'RENOTE'
    },
    body: JSON.stringify({
      firstName: 'Integration',
      lastName: 'Tester',
      email: testEmail,
      phone: testPhone,
      password: testPassword,
      appCode: 'RENOTE',
      roleCode: 'USER'
    })
  });

  const regData = await regRes.json();
  console.log('Registration Status:', regRes.status, JSON.stringify(regData));

  console.log('\n2. Testing Login...');
  const loginRes = await fetch('http://localhost:3005/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'app-code': 'RENOTE'
    },
    body: JSON.stringify({
      emailOrPhone: testEmail,
      password: testPassword,
      appCode: 'RENOTE'
    })
  });

  const loginData = await loginRes.json();
  console.log('Login Status:', loginRes.status, JSON.stringify(loginData));

  const accessToken = loginData?.data?.accessToken;
  const user = loginData?.data?.user;
  console.log('\nAccess Token received:', !!accessToken);
  console.log('User ID:', user?.id);

  if (accessToken && user) {
    console.log('\n3. Testing Express Backend with Token...');
    // Test Express Backend /api/companies/getAllCompanies/:userId
    const compRes = await fetch(`http://localhost:6003/api/companies/getAllCompanies/${user.id}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('Companies Endpoint Status:', compRes.status);
    const compData = await compRes.json();
    console.log('Companies Data:', JSON.stringify(compData));

    // Test creating a Company
    console.log('\n4. Testing Creating a Vendor Company in MongoDB...');
    const createCompRes = await fetch(`http://localhost:6003/api/companies/createCompany/${user.id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test Enterprise Solutions',
        phone: '9876543210',
        email: 'info@testenterprise.com',
        city: 'Bangalore',
        state: 'Karnataka',
        companyType: 'IT Services',
        flag: 'vendor',
        gstNo: '29ABCDE1234F1Z5'
      })
    });
    console.log('Create Company Status:', createCompRes.status);
    const createdCompData = await createCompRes.json();
    console.log('Created Company:', JSON.stringify(createdCompData));

    const companyId = createdCompData?.company?._id;

    // Test creating a Customer
    console.log('\n5. Testing Creating a Customer in MongoDB...');
    const createCustRes = await fetch(`http://localhost:6003/api/companies/createCompany/${user.id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Apex Client Corp',
        phone: '9123456780',
        email: 'billing@apexclient.com',
        city: 'Mumbai',
        state: 'Maharashtra',
        companyType: 'Retail',
        flag: 'customer',
        gstNo: '27AAAAA0000A1Z5'
      })
    });
    console.log('Create Customer Status:', createCustRes.status);
    const createdCustData = await createCustRes.json();
    console.log('Created Customer:', JSON.stringify(createdCustData));

    // Test creating a Product
    console.log('\n6. Testing Creating a Product in MongoDB...');
    const createProdRes = await fetch(`http://localhost:6003/api/products/create/${user.id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        companyId: companyId,
        name: 'High Performance Server',
        price: 75000,
        qty: 10,
        unit: 'Pcs',
        gst: 18,
        hsn: '847150',
        description: 'Rackmount enterprise server'
      })
    });
    console.log('Create Product Status:', createProdRes.status);
    const createdProdData = await createProdRes.json();
    console.log('Created Product:', JSON.stringify(createdProdData));

    // Test next estimate ID
    console.log('\n7. Testing Next Quotation ID...');
    const nextEstRes = await fetch(`http://localhost:6003/api/quotations/next-id/${user.id}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    console.log('Next Estimate ID Status:', nextEstRes.status);
    const nextEstData = await nextEstRes.json();
    console.log('Next Estimate ID:', JSON.stringify(nextEstData));

    // Test creating a Quotation
    console.log('\n8. Testing Creating a Quotation in MongoDB...');
    const createEstRes = await fetch(`http://localhost:6003/api/quotations/createQuotation/${user.id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        estimateID: nextEstData.estimateID || 'E2611001',
        company_id: [companyId],
        customers: [{
          name: 'Apex Client Corp',
          phoneNumber: '9123456780',
          email: 'billing@apexclient.com',
          address: 'Mumbai, Maharashtra',
          gstNo: '27AAAAA0000A1Z5'
        }],
        products: [{
          name: 'High Performance Server',
          quantity: 2,
          price: 75000,
          unit: 'Pcs',
          gst: 18,
          hsn: '847150'
        }],
        total: 177000
      })
    });
    console.log('Create Quotation Status:', createEstRes.status);
    const createdEstData = await createEstRes.json();
    console.log('Created Quotation:', JSON.stringify(createdEstData));

    // Test next invoice ID
    console.log('\n9. Testing Next Invoice ID...');
    const nextInvRes = await fetch(`http://localhost:6003/api/invoice/next-id/${user.id}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    console.log('Next Invoice ID Status:', nextInvRes.status);
    const nextInvData = await nextInvRes.json();
    console.log('Next Invoice ID:', JSON.stringify(nextInvData));

    // Test creating an Invoice
    console.log('\n10. Testing Creating a Tax Invoice in MongoDB...');
    const createInvRes = await fetch(`http://localhost:6003/api/invoice/createInvoice/${user.id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        invoiceID: nextInvData.invoiceID || 'I/26-27/0001',
        company_id: [companyId],
        customers: [{
          name: 'Apex Client Corp',
          phoneNumber: '9123456780',
          email: 'billing@apexclient.com',
          address: 'Mumbai, Maharashtra',
          gstNo: '27AAAAA0000A1Z5'
        }],
        products: [{
          name: 'High Performance Server',
          quantity: 2,
          price: 75000,
          unit: 'Pcs',
          gst: 18,
          hsn: '847150'
        }],
        total: 177000,
        status: 'Paid',
        notes: 'Integration test invoice'
      })
    });
    console.log('Create Invoice Status:', createInvRes.status);
    const createdInvData = await createInvRes.json();
    console.log('Created Invoice:', JSON.stringify(createdInvData));

    // Test creating a Poster
    console.log('\n11. Testing Creating a Poster in MongoDB...');
    const nextPosterRes = await fetch(`http://localhost:6003/api/posters/next-poster-id/${user.id}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const nextPosterData = await nextPosterRes.json();
    console.log('Next Poster ID:', JSON.stringify(nextPosterData));

    const createPosterRes = await fetch(`http://localhost:6003/api/posters/createPoster/${user.id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        posterId: nextPosterData.posterId || 'P0001',
        posterTitle: 'Grand Festival Offer',
        productName: 'High Performance Server',
        productPrice: 75000,
        discountPercentage: 10,
        offerText: 'Special Weekend Deal',
        contactPhone: '9876543210',
        company_id: companyId
      })
    });
    console.log('Create Poster Status:', createPosterRes.status);
    const createdPosterData = await createPosterRes.json();
    console.log('Created Poster:', JSON.stringify(createdPosterData));
  }
}

testAuth().catch(console.error);

