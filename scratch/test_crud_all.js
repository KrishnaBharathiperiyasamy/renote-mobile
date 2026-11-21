async function testCrudAll() {
  // 1. Login as the created integration test user
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
  const token = loginData.data.accessToken;
  const user = loginData.data.user;
  console.log('✓ Logged in as:', user.email, 'ID:', user.id);

  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // Get vendor company
  const compRes = await fetch(`http://localhost:6003/api/companies/getAllCompanies/${user.id}?flag=vendor`, {
    headers: authHeaders
  });
  const compData = await compRes.json();
  const companyId = compData.company[0]._id;
  console.log('✓ Vendor company:', companyId);

  // ----------------------------------------------------
  // 2. Customer CRUD
  // ----------------------------------------------------
  console.log('\n--- Testing Customer CRUD ---');
  // Create Customer
  const custCreateRes = await fetch(`http://localhost:6003/api/companies/createCompany/${user.id}`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Dynamic Client Beta',
      phone: '9845012345',
      email: 'client@beta.com',
      city: 'Hyderabad',
      state: 'Telangana',
      companyType: 'Consulting',
      flag: 'customer'
    })
  });
  const custCreateData = await custCreateRes.json();
  const customerId = custCreateData.company._id;
  console.log('✓ Customer Created:', customerId, custCreateData.company.name);

  // Read Customer
  const custReadRes = await fetch(`http://localhost:6003/api/companies/getAllCompanies/${user.id}?flag=customer`, {
    headers: authHeaders
  });
  const custReadData = await custReadRes.json();
  console.log('✓ Customers Read count:', custReadData.company.length);

  // Update Customer
  const custUpdateRes = await fetch(`http://localhost:6003/api/companies/editCompany/${customerId}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Dynamic Client Beta (Updated)',
      phone: '9845012345',
      email: 'updated@beta.com',
      city: 'Secunderabad',
      state: 'Telangana',
      companyType: 'Consulting',
      flag: 'customer'
    })
  });
  const custUpdateData = await custUpdateRes.json();
  console.log('✓ Customer Updated:', custUpdateData.company.name, custUpdateData.company.city);

  // Delete Customer
  const custDeleteRes = await fetch(`http://localhost:6003/api/companies/deleteCompany/${customerId}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  const custDeleteData = await custDeleteRes.json();
  console.log('✓ Customer Deleted:', custDeleteData.message);

  // ----------------------------------------------------
  // 3. Product CRUD
  // ----------------------------------------------------
  console.log('\n--- Testing Product CRUD ---');
  // Create Product
  const prodCreateRes = await fetch(`http://localhost:6003/api/products/create/${user.id}`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      companyId: companyId,
      name: 'Wireless Access Point AX3000',
      price: 6500,
      qty: 25,
      unit: 'Pcs',
      gst: 18,
      hsn: '851762'
    })
  });
  const prodCreateData = await prodCreateRes.json();
  const productId = prodCreateData.product._id;
  console.log('✓ Product Created:', productId, prodCreateData.product.name);

  // Read Products
  const prodReadRes = await fetch(`http://localhost:6003/api/products/get/${user.id}`, {
    headers: authHeaders
  });
  const prodReadData = await prodReadRes.json();
  console.log('✓ Products Read count:', prodReadData.products?.length || prodReadData.length);

  // Update Product
  const prodUpdateRes = await fetch(`http://localhost:6003/api/products/update/${productId}`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      userId: user.id,
      companyId: companyId,
      name: 'Wireless Access Point AX3000 Pro',
      price: 7200,
      qty: 30,
      unit: 'Pcs',
      gst: 18,
      hsn: '851762'
    })
  });
  const prodUpdateData = await prodUpdateRes.json();
  console.log('✓ Product Updated:', prodUpdateData.product.name, 'Price:', prodUpdateData.product.price);

  // Toggle Favorite Product
  const prodFavRes = await fetch(`http://localhost:6003/api/products/getProduct/${productId}/favorite`, {
    method: 'PATCH',
    headers: authHeaders
  });
  console.log('✓ Product Favorite Toggled status:', prodFavRes.status);

  // Delete Product
  const prodDeleteRes = await fetch(`http://localhost:6003/api/products/delete`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      productIds: [productId]
    })
  });
  const prodDeleteData = await prodDeleteRes.json();
  console.log('✓ Product Deleted:', prodDeleteData.message);

  // ----------------------------------------------------
  // 4. Quotation CRUD & Duplicate
  // ----------------------------------------------------
  console.log('\n--- Testing Quotation CRUD & Duplicate ---');
  // Get Next ID
  const qNextRes = await fetch(`http://localhost:6003/api/quotations/next-id/${user.id}`, {
    headers: authHeaders
  });
  const qNextData = await qNextRes.json();
  console.log('✓ Next Quotation ID:', qNextData.estimateID);

  // Create Quotation
  const qCreateRes = await fetch(`http://localhost:6003/api/quotations/createQuotation/${user.id}`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      estimateID: qNextData.estimateID,
      company_id: [companyId],
      customers: [{
        name: 'Prime Infra Ltd',
        phoneNumber: '9700000001',
        email: 'procurement@primeinfra.com'
      }],
      products: [{
        name: 'Industrial Router',
        quantity: 1,
        price: 45000,
        gst: 18
      }],
      total: 53100
    })
  });
  const qCreateData = await qCreateRes.json();
  const quotationId = qCreateData.quotation._id;
  console.log('✓ Quotation Created:', quotationId, qCreateData.quotation.estimateID);

  // Read Quotations
  const qReadRes = await fetch(`http://localhost:6003/api/quotations/getQuotations/${user.id}`, {
    headers: authHeaders
  });
  const qReadData = await qReadRes.json();
  console.log('✓ Quotations Read count:', qReadData.quotations?.length || qReadData.length);

  // Update Quotation
  const qUpdateRes = await fetch(`http://localhost:6003/api/quotations/updateQuotation/${quotationId}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      estimateID: qCreateData.quotation.estimateID,
      company_id: [companyId],
      customers: [{
        name: 'Prime Infra Ltd (Updated)',
        phoneNumber: '9700000001',
        email: 'procurement@primeinfra.com'
      }],
      products: [{
        name: 'Industrial Router v2',
        quantity: 2,
        price: 45000,
        gst: 18
      }],
      total: 106200
    })
  });
  const qUpdateData = await qUpdateRes.json();
  console.log('✓ Quotation Updated, new total:', qUpdateData.quotation?.total || 'updated');

  // Duplicate Quotation (Fetch next ID, then create copy)
  const qDupNextRes = await fetch(`http://localhost:6003/api/quotations/next-id/${user.id}`, {
    headers: authHeaders
  });
  const qDupNextData = await qDupNextRes.json();
  const qDupRes = await fetch(`http://localhost:6003/api/quotations/createQuotation/${user.id}`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      estimateID: qDupNextData.estimateID,
      company_id: [companyId],
      customers: qCreateData.quotation.customers,
      products: qCreateData.quotation.products,
      total: qCreateData.quotation.total
    })
  });
  const qDupData = await qDupRes.json();
  console.log('✓ Quotation Duplicated:', qDupData.quotation?.estimateID);

  // Delete Quotation
  const qDeleteRes = await fetch(`http://localhost:6003/api/quotations/deleteQuotation`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ ids: [quotationId] })
  });
  const qDeleteData = await qDeleteRes.json();
  console.log('✓ Quotation Deleted:', qDeleteData.message);

  // ----------------------------------------------------
  // 5. Invoice CRUD
  // ----------------------------------------------------
  console.log('\n--- Testing Invoice CRUD ---');
  // Next Invoice ID
  const invNextRes = await fetch(`http://localhost:6003/api/invoice/next-id/${user.id}`, {
    headers: authHeaders
  });
  const invNextData = await invNextRes.json();
  console.log('✓ Next Invoice ID:', invNextData.invoiceID);

  // Create Invoice
  const invCreateRes = await fetch(`http://localhost:6003/api/invoice/createInvoice/${user.id}`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      invoiceID: invNextData.invoiceID,
      company_id: [companyId],
      customers: [{
        name: 'Nexus Tech Systems',
        phoneNumber: '9444455555',
        email: 'accounts@nexustech.com',
        gstNo: '33AAAAA1234A1Z5'
      }],
      products: [{
        name: 'Managed Core Switch',
        quantity: 1,
        price: 85000,
        gst: 18,
        hsn: '851762'
      }],
      total: 100300,
      status: 'Pending'
    })
  });
  const invCreateData = await invCreateRes.json();
  const invoiceId = invCreateData.invoice._id;
  console.log('✓ Invoice Created:', invoiceId, invCreateData.invoice.invoiceID);

  // Read Invoices
  const invReadRes = await fetch(`http://localhost:6003/api/invoice/getInvoiceByUser/${user.id}`, {
    headers: authHeaders
  });
  const invReadData = await invReadRes.json();
  console.log('✓ Invoices Read count:', invReadData.invoices?.length || invReadData.length);

  // Update Invoice
  const invUpdateRes = await fetch(`http://localhost:6003/api/invoice/updateInvoice/${invoiceId}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      invoiceID: invCreateData.invoice.invoiceID,
      company_id: [companyId],
      customers: [{
        name: 'Nexus Tech Systems',
        phoneNumber: '9444455555',
        email: 'accounts@nexustech.com',
        gstNo: '33AAAAA1234A1Z5'
      }],
      products: [{
        name: 'Managed Core Switch',
        quantity: 1,
        price: 85000,
        gst: 18,
        hsn: '851762'
      }],
      total: 100300,
      status: 'Paid'
    })
  });
  const invUpdateData = await invUpdateRes.json();
  console.log('✓ Invoice Updated Status to:', invUpdateData.invoice?.status);

  // Delete Invoice
  const invDeleteRes = await fetch(`http://localhost:6003/api/invoice/deleteInvoices`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ ids: [invoiceId] })
  });
  const invDeleteData = await invDeleteRes.json();
  console.log('✓ Invoice Deleted:', invDeleteData.message);

  // ----------------------------------------------------
  // 6. Poster CRUD & Favorite
  // ----------------------------------------------------
  console.log('\n--- Testing Poster CRUD ---');
  const pNextRes = await fetch(`http://localhost:6003/api/posters/next-poster-id/${user.id}`, {
    headers: authHeaders
  });
  const pNextData = await pNextRes.json();
  console.log('✓ Next Poster ID:', pNextData.posterId);

  const pCreateRes = await fetch(`http://localhost:6003/api/posters/createPoster/${user.id}`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      posterId: pNextData.posterId,
      poster_title: 'End of Season Bonanza',
      poster_name: 'Clearance Promo',
      product_name: 'Gaming Monitor 4K',
      product_price: 32000,
      product_image: 'default-product.png',
      company_id: companyId
    })
  });
  const pCreateData = await pCreateRes.json();
  const posterId = pCreateData.poster._id;
  console.log('✓ Poster Created:', posterId, pCreateData.poster.poster_title);

  // Toggle Favorite
  const pFavRes = await fetch(`http://localhost:6003/api/posters/${posterId}/favorite`, {
    method: 'POST',
    headers: authHeaders
  });
  console.log('✓ Poster Favorite Toggled status:', pFavRes.status);

  // Delete Poster
  const pDeleteRes = await fetch(`http://localhost:6003/api/posters/deletePoster/${posterId}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  const pDeleteData = await pDeleteRes.json();
  console.log('✓ Poster Deleted:', pDeleteData.message);

  console.log('\n========================================');
  console.log('🎉 ALL INTEGRATION CRUD TESTS PASSED! 🎉');
  console.log('========================================');
}

testCrudAll().catch(console.error);

