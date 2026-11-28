import axios from 'axios';

// Cached admin token for auth-service-be
let adminToken = null;
let adminTokenExp = 0;

export function invalidateAdminToken() {
  adminToken = null;
  adminTokenExp = 0;
}

export async function getAuthServiceAdminToken(forceRefresh = false) {
  if (!forceRefresh && adminToken && Date.now() < adminTokenExp - 60_000) return adminToken;
  const url = `${process.env.AUTH_SERVICE_BE_URL || 'http://localhost:3004/api/v1'}/auth-service-admin/login`;
  const res = await axios.post(url, {
    email: process.env.AUTH_SERVICE_ADMIN_EMAIL,
    password: process.env.AUTH_SERVICE_ADMIN_PASSWORD,
  });
  adminToken = res.data?.data?.accessToken;
  try {
    const payload = JSON.parse(Buffer.from(adminToken.split('.')[1], 'base64').toString());
    adminTokenExp = payload.exp * 1000;
  } catch {
    adminTokenExp = Date.now() + 3600_000;
  }
  return adminToken;
}

export async function fetchAuthServiceUsers() {
  let token = await getAuthServiceAdminToken();
  const url = `${process.env.AUTH_SERVICE_BE_URL || 'http://localhost:3004/api/v1'}/admin/users`;

  async function fetchAll(authToken) {
    const allUsers = [];
    let cursor = undefined;
    const limit = 100;
    while (true) {
      const params = { appCode: 'RENOTE', limit };
      if (cursor) params.cursor = cursor;
      const res = await axios.get(url, {
        params,
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = res.data?.data;
      const items = data?.items || [];
      allUsers.push(...items);
      cursor = data?.nextCursor;
      if (!cursor || items.length === 0) break;
    }
    return allUsers;
  }

  try {
    return await fetchAll(token);
  } catch (err) {
    // If 401/403, token may be stale — refresh and retry once
    if (err.response?.status === 401 || err.response?.status === 403) {
      token = await getAuthServiceAdminToken(true);
      return await fetchAll(token);
    }
    throw err;
  }
}
