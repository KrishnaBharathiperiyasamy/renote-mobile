import Subscription from '../models/Subscription.js';
import Payment from '../models/Payment.js';
import Plan from '../models/Plan.js';
import User from '../models/User.js';
import Company from '../models/Company.js';
import { getUserPlan } from '../utilis/getUserPlan.js';
import { getFolderSize, formatBytes } from '../utilis/folderSize.js';
import { resolveUploadPath } from '../utils/uploadPaths.js';
import fs from 'fs';
import { getIO } from '../utils/socket.js';
import { fetchAuthServiceUsers } from '../utils/authServiceHelper.js';

function emitSA(event, data) {
  const io = getIO();
  if (io) io.of('/superadmin').to('sa-room').emit(event, data);
}

// GET /api/superadmin/subscriptions — all subscriptions (including Free users, paginated, filterable)
export const getAllSubscriptions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const statusFilter = req.query.status;
    const planFilter = req.query.planSlug;
    const search = (req.query.search || "").toLowerCase().trim();

    // 1. Fetch all non-deleted users
    const allUsers = await User.find({ isDeleted: { $ne: true } }).lean();

    // Try to get auth service users for full names
    let authUsers = [];
    try {
      authUsers = await fetchAuthServiceUsers();
    } catch { /* ignore if auth service unavailable */ }

    const authMap = {};
    for (const au of authUsers) {
      authMap[String(au.id)] = au;
    }

    // 2. Fetch all subscription records populated with Plan & User
    const mongoSubs = await Subscription.find()
      .populate('planId')
      .populate('userId', 'authId firstName lastName email phoneNumber phone name username kycData')
      .sort({ createdAt: -1 })
      .lean();

    // Group subscriptions by user _id
    const userSubMap = new Map();
    for (const sub of mongoSubs) {
      const uid = sub.userId?._id?.toString() || sub.userId?.toString();
      if (!uid) continue;
      if (!userSubMap.has(uid)) {
        userSubMap.set(uid, []);
      }
      userSubMap.get(uid).push(sub);
    }

    // Fetch all active plans for fallback
    const allPlans = await Plan.find({ isActive: true }).lean();
    const freePlan = allPlans.find(p => p.slug === 'free' || /free/i.test(p.name)) || allPlans[0];

    // 3. Build unified list of subscription statuses for ALL users
    const unifiedList = [];

    for (const user of allUsers) {
      const uid = user._id.toString();
      const auth = authMap[String(user.authId)] || {};
      const userName = auth.fullName || auth.name || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name || user.username || user.kycData?.name || user.email || user.phoneNumber || user.phone || 'Unknown';
      const userEmail = auth.email || user.email || '';
      const userPhone = auth.phone || user.phoneNumber || user.phone || '';

      // Calculate storage for this user across all company folders
      const userCompanies = await Company.find({ userId: user._id, isDeleted: false }).lean();
      let totalBytes = 0;
      for (const comp of userCompanies) {
        const folder = resolveUploadPath(user._id.toString(), comp._id.toString());
        if (fs.existsSync(folder)) {
          totalBytes += getFolderSize(folder);
        }
      }

      const userPlanObj = await getUserPlan(user._id);
      const maxStorageMB = userPlanObj?.features?.maxVideoStorageMB ?? userPlanObj?.limits?.totalVideoStorageMB ?? 75;
      const usedBytesStr = formatBytes(totalBytes);
      const usedMB = parseFloat((totalBytes / (1024 * 1024)).toFixed(1));
      
      let storageLeftLabel = "";
      if (maxStorageMB === -1) {
        storageLeftLabel = "Unlimited";
      } else {
        const remainingMB = Math.max(0, maxStorageMB - usedMB);
        storageLeftLabel = `${remainingMB.toFixed(1)} MB left`;
      }

      const storageInfo = {
        usedBytes: totalBytes,
        usedFormatted: usedBytesStr,
        maxMB: maxStorageMB,
        maxFormatted: maxStorageMB === -1 ? "Unlimited" : `${maxStorageMB} MB`,
        leftFormatted: storageLeftLabel,
        isUnlimited: maxStorageMB === -1,
      };

      const userSubs = userSubMap.get(uid) || [];
      const activeSub = userSubs.find(s => s.status === 'active' || s.isActive === true);

      if (activeSub) {
        unifiedList.push({
          _id: activeSub._id.toString(),
          userId: {
            _id: user._id.toString(),
            name: userName,
            email: userEmail,
            phone: userPhone,
          },
          plan: activeSub.planId ? {
            _id: activeSub.planId._id,
            name: activeSub.planId.name,
            slug: activeSub.planId.slug || activeSub.planSlug,
            price: activeSub.planId.monthlyPrice || 0,
          } : {
            _id: null,
            name: activeSub.planSlug ? activeSub.planSlug.toUpperCase() : 'Custom Plan',
            slug: activeSub.planSlug || 'custom',
            price: 0,
          },
          planSlug: activeSub.planSlug || (activeSub.planId ? activeSub.planId.slug : 'custom'),
          status: activeSub.status || (activeSub.isActive ? 'active' : 'cancelled'),
          billing: activeSub.billing || (activeSub.isTrial ? 'trial' : 'monthly'),
          isTrial: !!activeSub.isTrial,
          trialDurationMonths: activeSub.trialDurationMonths || null,
          grantedBy: activeSub.grantedBy || null,
          currentPeriodStart: activeSub.currentPeriodStart || activeSub.createdAt || user.createdAt,
          currentPeriodEnd: activeSub.currentPeriodEnd || activeSub.endDate || null,
          createdAt: activeSub.createdAt || user.createdAt,
          isVirtualFree: false,
          storageInfo,
        });
      } else {
        // User is on the default Free Plan
        const latestSub = userSubs[0]; // Most recent sub if previous existed
        unifiedList.push({
          _id: `free_${user._id}`,
          userId: {
            _id: user._id.toString(),
            name: userName,
            email: userEmail,
            phone: userPhone,
          },
          plan: {
            _id: freePlan ? freePlan._id : null,
            name: freePlan ? freePlan.name : 'Free Plan',
            slug: freePlan ? freePlan.slug : 'free',
            price: 0,
          },
          planSlug: 'free',
          status: latestSub ? latestSub.status : 'active',
          billing: 'free',
          isTrial: false,
          trialDurationMonths: null,
          grantedBy: null,
          currentPeriodStart: user.createdAt,
          currentPeriodEnd: null,
          createdAt: user.createdAt,
          isVirtualFree: true,
          storageInfo,
        });
      }
    }

    // 4. Apply Filters & Search
    let filtered = unifiedList;

    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status.toLowerCase() === statusFilter.toLowerCase());
    }

    if (planFilter && planFilter !== 'all') {
      filtered = filtered.filter(item => item.planSlug.toLowerCase() === planFilter.toLowerCase());
    }

    if (search) {
      filtered = filtered.filter(item =>
        item.userId.name.toLowerCase().includes(search) ||
        item.userId.email.toLowerCase().includes(search) ||
        item.userId.phone.includes(search) ||
        item.plan.name.toLowerCase().includes(search)
      );
    }

    // Sort by createdAt descending
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = filtered.slice(skip, skip + limit);

    res.json({
      subscriptions: paginated,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subscriptions', error: error.message });
  }
};

// PUT /api/superadmin/subscriptions/user/:userId — Modify a user's subscription
export const modifyUserSubscription = async (req, res) => {
  try {
    const { userId } = req.params;
    const { planSlug, status, billing, durationMonths, isUnlimited } = req.body;

    let user = null;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId);
    }
    if (!user) {
      user = await User.findOne({ authId: String(userId) });
    }
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 1. Deactivate all current active subscriptions for this user
    await Subscription.updateMany(
      { userId: user._id },
      { isActive: false, status: 'cancelled', cancelledAt: new Date() }
    );

    // 2. If changing to 'free' and not creating a custom record
    if (planSlug === 'free' && !isUnlimited && status !== 'active') {
      emitSA('subscription:cancelled', { userId: user._id });
      return res.json({ message: 'User subscription updated to Free Plan' });
    }

    // 3. Find matching plan in database if available
    let targetPlan = await Plan.findOne({ slug: planSlug, isActive: true });
    if (!targetPlan) {
      targetPlan = await Plan.findOne({ name: new RegExp(planSlug, 'i') });
    }

    const startDate = new Date();
    let endDate = new Date();

    if (isUnlimited || planSlug === 'unlimited' || durationMonths >= 999) {
      endDate = new Date("2099-12-31T23:59:59.999Z");
    } else if (durationMonths) {
      endDate.setMonth(endDate.getMonth() + Number(durationMonths));
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const newSub = await Subscription.create({
      userId: user._id,
      planId: targetPlan ? targetPlan._id : null,
      planSlug: planSlug || (targetPlan ? targetPlan.slug : 'custom'),
      billing: isUnlimited ? 'unlimited' : (billing || 'granted'),
      isTrial: !!durationMonths,
      trialDurationMonths: durationMonths || null,
      grantedBy: 'superadmin',
      status: status || 'active',
      isActive: (status || 'active') === 'active',
      startDate,
      endDate,
      currentPeriodStart: startDate,
      currentPeriodEnd: endDate,
    });

    emitSA('subscription:created', { userId: user._id, planSlug });
    res.json({ message: 'Subscription updated successfully', subscription: newSub });
  } catch (error) {
    res.status(500).json({ message: 'Error modifying subscription', error: error.message });
  }
};

// GET /api/superadmin/payments — all payments (paginated, filterable)
export const getAllPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status) query.status = req.query.status;

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('userId', 'authId firstName lastName email phoneNumber phone name username')
        .populate('planId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(query),
    ]);

    res.json({
      payments,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payments', error: error.message });
  }
};

// GET /api/superadmin/subscription-stats — revenue & subscriber stats
export const getSubscriptionStats = async (req, res) => {
  try {
    const [activeSubscriptions, totalUsers, planStats] = await Promise.all([
      Subscription.countDocuments({ status: 'active', isActive: true }),
      User.countDocuments({ isDeleted: { $ne: true } }),
      Subscription.aggregate([
        { $match: { status: 'active', isActive: true } },
        { $group: { _id: '$planSlug', count: { $sum: 1 } } },
      ]),
    ]);

    const planCounts = {};
    for (const p of planStats) {
      planCounts[p._id || 'other'] = p.count;
    }
    // Free plan users count = total users - active paid/custom subs
    const activePaidCount = Object.values(planCounts).reduce((a, b) => a + b, 0);
    planCounts['free'] = Math.max(0, totalUsers - activePaidCount);

    res.json({
      activeSubscriptions,
      totalUsers,
      planCounts,
      totalRevenue: 0,
      mrr: 0,
      churnLast30Days: 0,
      recentPayments: [],
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subscription stats', error: error.message });
  }
};

// POST /api/superadmin/users/:id/grant-plan — grant any plan to a user
export const grantPlan = async (req, res) => {
  req.params.userId = req.params.id;
  return modifyUserSubscription(req, res);
};

export const grantProTrial = grantPlan;
