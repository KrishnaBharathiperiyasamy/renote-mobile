import Notification from "../models/Notification.js";
import Invoice from "../models/Invoice.js";
import Poster from "../models/Poster.js";
import Product from "../models/Product.js";
import Quotation from "../models/Quotation.js";
import { resolveUserMongoId } from "../utils/resolveUser.js";

export const getUserNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        const targetUserId = await resolveUserMongoId(userId, req.user);
        if (!targetUserId) {
            return res.json({ success: true, notifications: [] });
        }

        const notifications = await Notification.find({ userId: targetUserId })
            .sort({ createdAt: -1 })
            .populate("fromUser", "name")
            .populate("posterId");
        res.json({ success: true, notifications });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await Notification.findByIdAndUpdate(id, { isRead: true });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

export const clearNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        const targetUserId = await resolveUserMongoId(userId, req.user);
        if (!targetUserId) {
            return res.json({ success: true });
        }
        await Notification.deleteMany({ userId: targetUserId });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

export const checkSystemNotifications = async (req, res) => {
    const { userId } = req.params;
    if (!userId)
        return res.status(400).json({ error: "User ID is required" });

    try {
        const targetUserId = await resolveUserMongoId(userId, req.user);
        if (!targetUserId) {
            return res.json({ success: true, message: "User not found", createdNotifications: [] });
        }

        const checks = [];
        const hasInvoice = await Invoice.findOne({ user_id: targetUserId });
        if (!hasInvoice) {
            checks.push({
                identifier: "NO_INVOICE",
                title: "No Invoices Found",
                message: "You haven’t created any invoices yet.",
                link: "https://renote.co.in/pages/invoice",
            });
        } else {
            // Delete existing notification if issue is fixed
            await Notification.deleteOne({ userId: targetUserId, identifier: "NO_INVOICE" });
        }

        // 2️⃣ Check posters
        const hasPoster = await Poster.findOne({ user_id: targetUserId });
        if (!hasPoster) {
            checks.push({
                identifier: "NO_POSTERS",
                title: "No Posters Found",
                message: "Create your first poster to share with customers!",
                link: "https://renote.co.in/pages/poster",
            });
        } else {
            await Notification.deleteOne({ userId: targetUserId, identifier: "NO_POSTERS" });
        }

        // 3️⃣ Check estimations
        const hasEstimation = await Quotation.findOne({ user_id: targetUserId });
        if (!hasEstimation) {
            checks.push({
                identifier: "NO_ESTIMATIONS",
                title: "No Estimations Found",
                message: "You have not created any estimations yet.",
                link: "https://renote.co.in/pages/home",
            });
        } else {
            await Notification.deleteOne({ userId: targetUserId, identifier: "NO_ESTIMATIONS" });
        }

        // 4️⃣ Consolidated check for bad products
        const badProducts = await Product.find({
            user_id: targetUserId,
            $or: [
                { price: { $lt: 0 } },
                { qty: { $lte: 0 } },
                { name: "" },
                { name: null },
            ],
        });

        if (badProducts.length > 0) {
            const productNames = badProducts.map(p => p.name || "Unnamed");
            let displayNames = productNames.slice(0, 2).join(", ");
            if (productNames.length > 2) {
                displayNames += `, and ${productNames.length - 2} more`;
            }

            const reasonsSet = new Set();
            badProducts.forEach(p => {
                if (p.price < 0) reasonsSet.add("negative price");
                if (p.qty <= 0) reasonsSet.add("zero/negative quantity");
                if (!p.name) reasonsSet.add("missing name");
            });
            const reasons = Array.from(reasonsSet).join(", ");

            checks.push({
                identifier: "INVALID_PRODUCTS",
                title: "Invalid Product Data",
                message: `Products "${displayNames}" have invalid values: ${reasons}. Please review them.`,
                link: "https://renote.co.in/pages/productWareHouse",
            });

        } else {
            // Delete existing invalid product notification if all products are valid
            await Notification.deleteOne({ userId: targetUserId, identifier: "INVALID_PRODUCTS" });
        }

        // 5️⃣ Save or update notifications
        for (const check of checks) {
            const exists = await Notification.findOne({
                userId: targetUserId,
                identifier: check.identifier,
            });

            if (!exists) {
                await Notification.create({
                    userId: targetUserId,
                    ...check,
                    type: "system",
                    isRead: false,
                    createdAt: new Date(),
                });
            } else {
                await Notification.updateOne(
                    { _id: exists._id },
                    { $set: { title: check.title, message: check.message, link: check.link } }
                );
            }
        }

        return res.json({
            success: true,
            message: "Notifications checked/created successfully",
            createdNotifications: checks.map(c => c.identifier),
        });
    } catch (err) {
        console.error("Error checking system notifications:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};


