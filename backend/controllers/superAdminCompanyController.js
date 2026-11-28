import Company from '../models/Company.js';
import User from '../models/User.js';
import Quotation from '../models/Quotation.js';
import Invoice from '../models/Invoice.js';
import Poster from '../models/Poster.js';
import Product from '../models/Product.js';
import axios from 'axios';
import { getIO } from '../utils/socket.js';
import { fetchAuthServiceUsers } from '../utils/authServiceHelper.js';

function emitSA(event, data) {
  const io = getIO();
  if (io) io.of('/superadmin').to('sa-room').emit(event, data);
}

// GET /api/superadmin/companies
export const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find()
      .populate('userId', 'authId firstName lastName email phoneNumber phone name username kycData')
      .sort({ createdAt: -1 });

    // Merge owner names from auth-service-be
    let authUsers = [];
    try {
      authUsers = await fetchAuthServiceUsers();
    } catch { /* auth service may be down */ }

    const authMap = {};
    for (const au of authUsers) {
      authMap[String(au.id)] = au;
    }

    const enriched = companies.map((c) => {
      const co = c.toObject();
      const userObj = co.userId;
      const authId = userObj?.authId;
      const auth = authId ? authMap[String(authId)] : null;
      const mongoName = userObj ? ([userObj.firstName, userObj.lastName].filter(Boolean).join(' ') || userObj.name || userObj.username || userObj.kycData?.name || userObj.email || userObj.phoneNumber || userObj.phone) : '';
      co.ownerName = auth?.fullName || auth?.name || mongoName || 'Unknown';
      co.ownerEmail = auth?.email || userObj?.email || '';
      co.ownerPhone = auth?.phone || userObj?.phoneNumber || userObj?.phone || '';
      return co;
    });

    // Build per-user counts by querying each collection directly
    const users = await User.find({}, '_id authId');
    const userCountMap = {};
    await Promise.all(users.map(async (u) => {
      const uid = u._id;
      const [invoices, estimations, posters, products] = await Promise.all([
        Invoice.countDocuments({ user_id: uid }),
        Quotation.countDocuments({ user_id: uid }),
        Poster.countDocuments({ user_id: uid }),
        Product.countDocuments({ user_id: uid }),
      ]);
      userCountMap[String(u.authId)] = { invoices, estimations, posters, products };
    }));

    // Attach counts to each company based on owner's authId
    for (const co of enriched) {
      const authId = co.userId?.authId;
      co.ownerCounts = authId ? (userCountMap[String(authId)] || { invoices: 0, estimations: 0, posters: 0, products: 0 }) : { invoices: 0, estimations: 0, posters: 0, products: 0 };
    }

    res.json({ companies: enriched });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching companies', error: error.message });
  }
};

// PUT /api/superadmin/companies/:id/block
export const blockCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!company) return res.status(404).json({ message: 'Company not found' });
    emitSA('company:blocked', { companyId: company._id, name: company.name });
    res.json({ message: 'Company blocked', company });
  } catch (error) {
    res.status(500).json({ message: 'Error blocking company', error: error.message });
  }
};

// PUT /api/superadmin/companies/:id/unblock
export const unblockCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { isDeleted: false },
      { new: true }
    );
    if (!company) return res.status(404).json({ message: 'Company not found' });
    emitSA('company:unblocked', { companyId: company._id, name: company.name });
    res.json({ message: 'Company unblocked', company });
  } catch (error) {
    res.status(500).json({ message: 'Error unblocking company', error: error.message });
  }
};

// DELETE /api/superadmin/companies/:id
export const deleteCompany = async (req, res) => {
  try {
    const companyId = req.params.id;
    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ message: 'Company not found' });

    // Cascade delete related data
    await Promise.all([
      Quotation.deleteMany({ company_id: companyId }),
      Invoice.deleteMany({ company_id: companyId }),
      Poster.deleteMany({ company_id: companyId }),
      Product.deleteMany({ company_id: companyId }),
    ]);

    await Company.findByIdAndDelete(companyId);

    emitSA('company:deleted', { companyId, name: company.name });
    res.json({ message: 'Company and related data deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting company', error: error.message });
  }
};

// PUT /api/superadmin/companies/:id
export const editCompany = async (req, res) => {
  try {
    const { name, phone, email, city, companyType, address, state, zipCode, gstNo, upiId, description } = req.body;
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { name, phone, email, city, companyType, address, state, zipCode, gstNo, upiId, description },
      { new: true, runValidators: true }
    );
    if (!company) return res.status(404).json({ message: 'Company not found' });
    emitSA('company:updated', { companyId: company._id, name: company.name });
    res.json({ message: 'Company updated', company });
  } catch (error) {
    res.status(500).json({ message: 'Error updating company', error: error.message });
  }
};

// POST /api/superadmin/companies/:id/reset-password
export const resetOwnerPassword = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id).populate('userId', 'authId');
    if (!company) return res.status(404).json({ message: 'Company not found' });

    const authId = company.userId?.authId;
    if (!authId) return res.status(400).json({ message: 'No owner linked to this company' });

    const authUrl = process.env.AUTH_SERVICE_BE_URL || 'http://localhost:3004/api/v1';

    // Get owner email from auth-service-be
    let email = '';
    try {
      const allAuthUsers = await fetchAuthServiceUsers();
      const found = allAuthUsers.find(au => au.id === authId);
      email = found?.email || '';
    } catch { /* ignore */ }
    if (!email) return res.status(400).json({ message: 'Owner has no email address' });

    // Trigger password reset email
    await axios.post(`${authUrl}/auth/request-reset-email`, { email });

    res.json({ message: `Password reset email sent to ${email}` });
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({ message: 'Owner not found in auth service' });
    }
    res.status(500).json({ message: 'Error resetting owner password', error: error.message });
  }
};
