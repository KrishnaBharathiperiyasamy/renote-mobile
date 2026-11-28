import mongoose from "mongoose";
import Poster from "../models/Poster.js";
import ShareableLink from "../models/shareableLinkSchema.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import Company from "../models/Company.js";
import { getUserPlan } from "../utilis/getUserPlan.js";
import { nanoid } from "nanoid";
import { resolveUserMongoId } from "../utils/resolveUser.js";

const getFrontendBase = (req) => {
  const origin = req.get("origin");
  if (origin) return origin.replace(/\/$/, "");
  const referer = req.get("referer");
  if (referer) {
    try {
      const u = new URL(referer);
      return `${u.protocol}//${u.host}`;
    } catch {
      // ignore
    }
  }
  return (process.env.FRONTEND_URL || "https://renote.co.in").replace(/\/$/, "");
};

const createShareableLink = async (req, res) => {
  try {
    const { posterIds, userId, force, name: customName, expiresAt: customExpiresAt, isPublishedToMarketplace } = req.body;
    const effectiveUserId = userId || req.user?._id?.toString() || req.user?.authId;
    if (!posterIds?.length || !effectiveUserId)
      return res.status(400).json({ message: "posterIds[] and userId required" });
    const resolvedUserId = (await resolveUserMongoId(effectiveUserId, req.user)) || effectiveUserId;

    // Support querying posters by either valid Mongo ObjectId or posterId string (e.g. POS-1)
    const validMongoIds = posterIds.filter((id) => id && mongoose.Types.ObjectId.isValid(String(id)));
    const stringIds = posterIds.filter((id) => id && !mongoose.Types.ObjectId.isValid(String(id))).map(String);
    const queryConditions = [];
    if (validMongoIds.length > 0) queryConditions.push({ _id: { $in: validMongoIds } });
    if (stringIds.length > 0) queryConditions.push({ posterId: { $in: stringIds } });

    const posters = queryConditions.length > 0
      ? await Poster.find({ $or: queryConditions })
      : [];

    if (posters.length !== posterIds.length)
      return res.status(404).json({ message: "Some posters not found" });

    const canonicalPosterIds = posters.map((p) => p._id);

    const DEFAULT_POSTER_USER_ID = "69d362ca7421b5bc1882903d";
    const userCandidates = [
      userId?.toString(),
      resolvedUserId?.toString(),
      req.user?._id?.toString(),
      req.user?.authId?.toString(),
    ].filter(Boolean);

    const isSuperAdmin = req.user?.role === "SUPER_ADMIN" || req.user?.role === "ADMIN";

    if (!isSuperAdmin) {
      const unauthorized = posters.find((p) => {
        const pUserId = p.user_id ? p.user_id.toString() : "";
        return !userCandidates.includes(pUserId) && pUserId !== DEFAULT_POSTER_USER_ID;
      });
      if (unauthorized)
        return res.status(403).json({ message: "Not authorized to share one or more posters" });
    }

    // Determine candidate MongoDB user ObjectIds for ownership matching
    const candidateMongoIds = userCandidates
      .filter((id) => id && mongoose.Types.ObjectId.isValid(id.toString()))
      .map((id) => new mongoose.Types.ObjectId(id.toString()));

    // 🔹 Prevent duplicate active links for the exact same poster(s) unless regeneration (force) is requested
    if (!force) {
      const existingQuery = {
        posterIds: { $size: canonicalPosterIds.length, $all: canonicalPosterIds },
        isRevoked: { $ne: true },
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } }
        ]
      };
      if (candidateMongoIds.length > 0) {
        existingQuery.createdBy = { $in: candidateMongoIds };
      }
      let existingLink = await ShareableLink.findOne(existingQuery);

      if (!existingLink && canonicalPosterIds.length === 1) {
        const p = posters[0];
        if (p.shareableLinkToken) {
          existingLink = await ShareableLink.findOne({
            token: p.shareableLinkToken,
            isRevoked: { $ne: true },
            $or: [
              { expiresAt: { $exists: false } },
              { expiresAt: null },
              { expiresAt: { $gt: new Date() } }
            ]
          });
        }
        if (!existingLink && p.shareableLinkId) {
          existingLink = await ShareableLink.findOne({
            _id: p.shareableLinkId,
            isRevoked: { $ne: true },
            $or: [
              { expiresAt: { $exists: false } },
              { expiresAt: null },
              { expiresAt: { $gt: new Date() } }
            ]
          });
        }
      }

      if (!existingLink) {
        delete existingQuery.createdBy;
        existingLink = await ShareableLink.findOne(existingQuery);
      }

      if (existingLink) {
        let updated = false;
        if (customName && customName.trim() && customName.trim() !== existingLink.name) {
          existingLink.name = customName.trim();
          updated = true;
        }
        if (customExpiresAt !== undefined) {
          const newExp = customExpiresAt ? new Date(customExpiresAt) : null;
          existingLink.expiresAt = newExp;
          updated = true;
        }
        if (isPublishedToMarketplace !== undefined && existingLink.isPublishedToMarketplace !== Boolean(isPublishedToMarketplace)) {
          existingLink.isPublishedToMarketplace = Boolean(isPublishedToMarketplace);
          updated = true;
        }
        if (updated) {
          await existingLink.save();
        }
        if (canonicalPosterIds.length > 0) {
          await Poster.updateMany(
            { _id: { $in: canonicalPosterIds } },
            {
              $set: {
                shareableLinkToken: existingLink.token,
                shareableLinkId: existingLink._id,
                publishedAt: new Date(),
                ...(isPublishedToMarketplace !== undefined ? { isPublishedToMarketplace: Boolean(isPublishedToMarketplace) } : {})
              }
            }
          );
        }

        const frontendBase = getFrontendBase(req);
        return res.json({
          success: true,
          message: updated ? "Share link updated successfully" : "Existing active share link returned",
          link: `${frontendBase}/pages/view?token=${existingLink.token}`,
          token: existingLink.token,
          name: existingLink.name,
          expiresAt: existingLink.expiresAt,
          isPublishedToMarketplace: existingLink.isPublishedToMarketplace,
          isExisting: true,
          status: "active"
        });
      }
    }

    // 🔹 Invalidate previous links if explicit regeneration (force) is requested
    if (force) {
      const revokeUserIds = [userId, resolvedUserId, req.user?._id].filter(
        (id) => id && mongoose.Types.ObjectId.isValid(id.toString())
      );
      const isSuperAdmin = req.user?.role === "SUPER_ADMIN" || req.user?.role === "ADMIN";
      const revokeQuery = {
        posterIds: { $size: canonicalPosterIds.length, $all: canonicalPosterIds },
        isRevoked: { $ne: true }
      };
      if (revokeUserIds.length > 0 && !isSuperAdmin) {
        revokeQuery.createdBy = { $in: revokeUserIds };
      }
      const linksToRevoke = await ShareableLink.find(revokeQuery);
      const revokedLinkIds = linksToRevoke.map((l) => l._id);
      if (revokedLinkIds.length > 0) {
        await ShareableLink.updateMany(
          { _id: { $in: revokedLinkIds } },
          {
            $set: { isRevoked: true, revokedAt: new Date() }
          }
        );
        await Poster.updateMany(
          { _id: { $in: canonicalPosterIds }, shareableLinkId: { $in: revokedLinkIds } },
          { $set: { shareableLinkToken: null, shareableLinkId: null } }
        );
      }
    }

    // 🔹 Enforce single-company rule: all selected posters with a company assigned
    //    must belong to the same company. Mixing posters from distinct companies is not allowed.
    const nonNullCompanyIds = [
      ...new Set(posters.map((p) => p.company_id ? p.company_id.toString() : null).filter(Boolean)),
    ];
    if (nonNullCompanyIds.length > 1) {
      return res.status(400).json({
        message:
          "All selected posters must belong to the same company. Please select posters from a single company to create a share link.",
      });
    }

    // Allow users to generate and share poster links freely without plan limit restrictions
    let plan;
    if (mongoose.connection.readyState === 1) {
      try {
        // Lazy import to avoid circular dependency
        const imported = await import("../utilis/getUserPlan.js");
        plan = await imported.getUserPlan(resolvedUserId || userId);
      } catch (e) {
        console.warn("[Plan] Warning fetching plan:", e?.message);
      }
    }

    const validMongoUserIds = userCandidates.filter(
      (id) => id && mongoose.Types.ObjectId.isValid(id.toString())
    );

    // 🔹 Count existing links of this user for default naming fallback
    let userLinksCount = 0;
    if (validMongoUserIds.length > 0 && mongoose.connection.readyState === 1) {
      try {
        userLinksCount = await ShareableLink.countDocuments({ createdBy: { $in: validMongoUserIds } });
      } catch (e) {
        console.warn("[Link] Warning counting user links:", e?.message);
      }
    }
    const name = customName?.trim() || `Link ${userLinksCount + 1}`;
    // 🔹 Generate unique token
    const token = nanoid(10);

    // Set expiresAt based on custom input or plan (default 7 days, null if never)
    let expiresAt;
    if (customExpiresAt !== undefined) {
      expiresAt = customExpiresAt ? new Date(customExpiresAt) : null;
    } else {
      const posterLinkExpiryDays = plan?.features?.posterLinkExpiryDays ?? 7;
      if (posterLinkExpiryDays === -1) {
        expiresAt = null; // never expires
      } else {
        expiresAt = new Date(Date.now() + posterLinkExpiryDays * 24 * 60 * 60 * 1000);
      }
    }

    let assignedCreatedBy = null;
    if (resolvedUserId && mongoose.Types.ObjectId.isValid(resolvedUserId.toString())) {
      assignedCreatedBy = resolvedUserId;
    } else if (req.user?._id && mongoose.Types.ObjectId.isValid(req.user._id.toString())) {
      assignedCreatedBy = req.user._id;
    } else if (userId && mongoose.Types.ObjectId.isValid(userId.toString())) {
      assignedCreatedBy = userId;
    } else {
      const foundUser = await User.findOne({
        $or: [
          { authId: String(effectiveUserId) },
          { email: String(effectiveUserId).toLowerCase() },
          { phoneNumber: String(effectiveUserId) },
        ],
      });
      if (foundUser) {
        assignedCreatedBy = foundUser._id;
      }
    }

    if (!assignedCreatedBy) {
      return res.status(400).json({ message: "Could not resolve valid user identity to create share link" });
    }

    const link = new ShareableLink({
      token,
      name,
      posterIds: canonicalPosterIds,
      createdBy: assignedCreatedBy,
      interactions: canonicalPosterIds.map((id) => ({ posterId: id, likes: [], comments: [] })),
      isPublishedToMarketplace: Boolean(isPublishedToMarketplace),
      expiresAt,
    });
    await link.save();

    if (canonicalPosterIds.length > 0) {
      await Poster.updateMany(
        { _id: { $in: canonicalPosterIds } },
        {
          $set: {
            shareableLinkToken: token,
            shareableLinkId: link._id,
            publishedAt: new Date(),
            ...(isPublishedToMarketplace !== undefined ? { isPublishedToMarketplace: Boolean(isPublishedToMarketplace) } : {})
          }
        }
      );
    }
    const frontendBase = getFrontendBase(req);
    return res.json({
      success: true,
      message: "Share link created successfully",
      link: `${frontendBase}/pages/view?token=${token}`,
      token,
      name,
      expiresAt,
      isPublishedToMarketplace: Boolean(isPublishedToMarketplace),
      isExisting: false,
      status: "active"
    });
  } catch (err) {
    console.error("Error in createShareableLink:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const toggleLike = async (req, res) => {
  try {
    const { token, posterId } = req.params;
    const { userId, name } = req.body;
    const shared = await ShareableLink.findOne({ token });
    if (!shared) return res.status(404).json({ message: "Invalid link" });
    const interaction = shared.interactions.find((i) => i.posterId.toString() === posterId);
    if (!interaction)
      return res.status(404).json({ message: "Poster not part of this link" });
    const alreadyLiked = interaction.likes.some((like) => like.user.toString() === userId);
    if (alreadyLiked)
      interaction.likes = interaction.likes.filter((like) => like.user.toString() !== userId);
    else {
      interaction.likes.push({ user: userId, name });
      if (userId.toString() !== shared.createdBy.toString()) {
        await Notification.create({
          userId: shared.createdBy, // receiver
          fromUser: userId, // actor
          fromName: name, // store actor's name
          posterId,
          token,
          type: "like",
          message: `${name} liked your poster`,
        });
      }
    }
    await shared.save();
    res.json({ success: true, liked: !alreadyLiked, totalLikes: interaction.likes.length, likes: interaction.likes, });
  } catch (err) {
    console.error("🔥 ERROR in toggleLike:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

const addComment = async (req, res) => {
  try {
    const { token, posterId } = req.params;
    const { userId, name, text } = req.body;
    if (!text?.trim())
      return res.status(400).json({ message: "Comment text required" });
    const shared = await ShareableLink.findOne({ token });
    if (!shared) return res.status(404).json({ message: "Invalid link" });
    const interaction = shared.interactions.find((i) => i.posterId.toString() === posterId);
    if (!interaction)
      return res.status(404).json({ message: "Poster not part of this link" });
    const newComment = { user: userId, name, text };
    interaction.comments.push(newComment);
    await shared.save();
    const addedComment = interaction.comments[interaction.comments.length - 1];
    // 👉 Send notification
    if (shared.createdBy.toString() !== userId.toString()) {
      const actor = await User.findById(userId);
      await Notification.create({
        userId: shared.createdBy,
        fromUser: userId,
        fromName: name,
        posterId,
        token,
        type: "comment",
        message: `${actor?.name ?? "Someone"} commented: "${text.slice(0, 50)}"`,
      });
    }
    res.json({ success: true, message: "Comment added", commentId: addedComment._id, });
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Internal server error" });
  }
};

const getPosterInteractions = async (req, res) => {
  try {
    const { token, posterId } = req.params;
    const shared = await ShareableLink.findOne({ token });
    if (!shared) return res.status(404).json({ success: false, message: "Invalid link" });
    const interaction = shared.interactions.find((i) => i.posterId.toString() === posterId);
    if (!interaction)
      return res.status(404).json({ success: false, message: "Poster not found in this shared link" });
    // Format likes with both ID + name
    const formattedLikes = interaction.likes.map((like) => ({ userId: like.user.toString(), name: like.name }));
    res.json({
      success: true,
      likesCount: interaction.likes.length,
      likedUsers: formattedLikes,  // <-- NEW full_like detail
      likes: formattedLikes.map((l) => l.userId), // for frontend matching logic
      comments: interaction.comments, // untouched
    });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getSharedPosters = async (req, res) => {
  try {
    const { token } = req.params;
    const shared = await ShareableLink.findOne({ token }).populate("posterIds");
    if (!shared)
      return res.status(404).json({ message: "Invalid or expired link" });

    if (shared.isRevoked) {
      return res.status(410).json({ success: false, isRevoked: true, message: "This shareable link has been revoked" });
    }
    if (shared.expiresAt && new Date(shared.expiresAt) < new Date()) {
      return res.status(410).json({ success: false, isExpired: true, message: "This shareable link has expired" });
    }

    const validPosters = (shared.posterIds || []).filter(Boolean);
    if (validPosters.length === 0) {
      return res.status(404).json({ message: "No active posters found for this link" });
    }

    // Gather company IDs from posters that have company_id, and user IDs for fallback
    const postersWithCompany = validPosters.filter(p => p && p.company_id);
    const postersWithoutCompany = validPosters.filter(p => p && !p.company_id && p.user_id);

    const companyIds = [...new Set(postersWithCompany.map(p => p.company_id.toString()))];
    const userIds = [...new Set(postersWithoutCompany.map(p => p.user_id ? p.user_id.toString() : "").filter(Boolean))];

    // Fetch companies by ID (for posters with company_id)
    const companiesById = companyIds.length > 0 ? await Company.find({
      _id: { $in: companyIds },
      isDeleted: false,
    }).select('userId upiId name phone') : [];

    // Fallback: fetch first vendor company per user (for old posters without company_id)
    const companiesByUser = userIds.length > 0 ? await Company.find({
      userId: { $in: userIds },
      flag: "vendor",
      isDeleted: false,
    }).select('userId upiId name phone').sort({ createdAt: 1 }) : [];

    const companyByIdMap = {};
    for (const c of companiesById) {
      companyByIdMap[c._id.toString()] = { upiId: c.upiId || '', companyName: c.name, companyPhone: c.phone || '' };
    }

    const companyByUserMap = {};
    for (const c of companiesByUser) {
      if (!companyByUserMap[c.userId.toString()]) {
        companyByUserMap[c.userId.toString()] = { upiId: c.upiId || '', companyName: c.name, companyPhone: c.phone || '' };
      }
    }

    // Attach company info to each poster
    const postersWithUpi = validPosters.map(p => {
      const poster = typeof p.toObject === "function" ? p.toObject() : { ...p };
      const cId = poster.company_id ? poster.company_id.toString() : null;
      const uId = poster.user_id ? poster.user_id.toString() : null;
      const companyInfo = cId
        ? companyByIdMap[cId]
        : (uId ? companyByUserMap[uId] : null);
      if (companyInfo) {
        if (companyInfo.upiId) poster.upiId = companyInfo.upiId;
        poster.companyName = companyInfo.companyName;
        if (companyInfo.companyPhone) poster.companyPhone = companyInfo.companyPhone;
      }
      return poster;
    });

    return res.json({
      success: true,
      name: shared.name,
      posters: postersWithUpi,
      total: postersWithUpi.length
    });

  } catch (err) {
    console.error("Error in getSharedPosters:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

const toggleCommentLike = async (req, res) => {
  try {
    const { token, posterId, commentId } = req.params;
    const { userId, name } = req.body;
    const shared = await ShareableLink.findOne({ token });
    if (!shared) return res.status(404).json({ message: "Invalid link" });
    const interaction = shared.interactions.find((i) => i.posterId.toString() === posterId);
    const comment = interaction.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    const alreadyLiked = comment.likes.some((id) => id.toString() === userId);
    if (alreadyLiked) {
      comment.likes.pull(userId);
    } else {
      comment.likes.push(userId);
      // Notify comment author (if liker is not author)
      if (comment.user.toString() !== userId.toString()) {
        await Notification.create({
          userId: comment.user,
          fromUser: userId,
          fromName: name, // <-- store name directly
          posterId,
          token,
          type: "comment-like",
          message: `${name} liked your comment`,
        });
      }
    }
    await shared.save();
    res.json({ success: true, liked: !alreadyLiked, totalLikes: comment.likes.length, });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateShareableLink = async (req, res) => {
  try {
    const { token } = req.params;
    const {
      userId,
      name,
      posterIds,        // optional — full replace of the poster list
      addPosterIds,     // optional — posters to append
      removePosterIds,  // optional — posters to drop
      expiresAt,
    } = req.body;

    const link = await ShareableLink.findOne({ token });
    if (!link) return res.status(404).json({ message: "Link not found" });
    const resolvedUserId = (await resolveUserMongoId(userId, req.user)) || userId;
    const userCandidates = [
      userId?.toString(),
      resolvedUserId?.toString(),
      req.user?._id?.toString(),
      req.user?.authId?.toString(),
    ].filter(Boolean);

    const isSuperAdmin = req.user?.role === "SUPER_ADMIN" || req.user?.role === "ADMIN";
    const DEFAULT_POSTER_USER_ID = "69d362ca7421b5bc1882903d";
    if (
      userCandidates.length > 0 &&
      !isSuperAdmin &&
      !userCandidates.includes(link.createdBy.toString()) &&
      link.createdBy.toString() !== DEFAULT_POSTER_USER_ID
    ) {
      return res.status(403).json({ message: "Unauthorized to edit this link" });
    }

    if (name) {
      link.name = name.trim();
      if (link.posterIds && link.posterIds.length === 1) {
        await Poster.updateOne(
          { _id: link.posterIds[0] },
          { $set: { poster_name: link.name } }
        ).catch(() => { });
      }
    }

    // --- Poster list update -------------------------------------------------
    // Supports three input styles:
    //   1. posterIds: ["a","b","c"]            → full replace (also accepts [] to clear)
    //   2. addPosterIds / removePosterIds      → patch the current list
    //   3. Any combination of the above        → replace first, then patch
    const toStringArray = (value) =>
      Array.isArray(value) ? value.map((id) => String(id)).filter(Boolean) : [];

    const hasReplace = Array.isArray(posterIds);
    const addIds = toStringArray(addPosterIds);
    const removeIds = toStringArray(removePosterIds);

    if (hasReplace || addIds.length > 0 || removeIds.length > 0) {
      // Start from either the replacement list or the current list.
      let nextIds = hasReplace
        ? toStringArray(posterIds)
        : link.posterIds.map((id) => id.toString());

      // Apply remove then add so a poster present in both lists ends up kept.
      if (removeIds.length > 0) {
        const removeSet = new Set(removeIds);
        nextIds = nextIds.filter((id) => !removeSet.has(id));
      }
      if (addIds.length > 0) {
        nextIds = [...nextIds, ...addIds];
      }

      // Dedupe while preserving order.
      nextIds = [...new Set(nextIds)];

      // Validate only the ids that aren't already on the link — existing
      // posters were validated when first attached, so re-checking them
      // wastes a DB round-trip.
      const currentSet = new Set(link.posterIds.map((id) => id.toString()));
      const idsToValidate = nextIds.filter((id) => !currentSet.has(id));
      if (idsToValidate.length > 0) {
        const posters = await Poster.find({ _id: { $in: idsToValidate } });
        if (posters.length !== idsToValidate.length)
          return res.status(404).json({ message: "Some posters not found" });
        const unauthorized = posters.find(
          (p) => p.user_id.toString() !== userId.toString()
        );
        if (unauthorized)
          return res
            .status(403)
            .json({ message: "Not authorized to include one or more posters" });
      }

      // Enforce single-company rule across the *final* poster list. We
      // must check every poster (not just the newly added ones) because
      // a link created before this rule existed might already contain
      // posters from multiple companies.
      if (nextIds.length > 0) {
        const finalPosters = await Poster.find(
          { _id: { $in: nextIds } },
          { company_id: 1 }
        ).lean();
        const companyKeys = finalPosters.map((p) =>
          p.company_id ? p.company_id.toString() : "__none__"
        );
        const uniqueCompanyKeys = [...new Set(companyKeys)];
        if (uniqueCompanyKeys.length > 1) {
          return res.status(400).json({
            message:
              "All posters in a share link must belong to the same company. Please remove posters from other companies before updating this link.",
          });
        }
      }

      link.posterIds = nextIds;

      // Sync interactions to match the new list:
      //  - drop rows for posters that were removed,
      //  - add empty rows for newly attached posters,
      //  - keep existing interactions for posters that stay.
      const finalSet = new Set(nextIds);
      link.interactions = link.interactions.filter((i) =>
        finalSet.has(i.posterId.toString())
      );
      const remainingInteractionIds = new Set(
        link.interactions.map((i) => i.posterId.toString())
      );
      nextIds.forEach((pid) => {
        if (!remainingInteractionIds.has(pid)) {
          link.interactions.push({ posterId: pid, likes: [], comments: [] });
        }
      });
    }

    if (expiresAt !== undefined) {
      link.expiresAt = expiresAt ? new Date(expiresAt) : undefined;
    }
    await link.save();
    return res.json({ success: true, message: "Shareable link updated successfully", link, });
  } catch (err) {
    console.error("Error updating link:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getUserSharedLinks = async (req, res) => {
  try {
    const { userId } = req.params;
    const resolvedUserId = await resolveUserMongoId(userId, req.user);
    const candidateIds = [resolvedUserId, req.user?._id, req.user?.id, userId].filter(Boolean);
    const validUserIds = candidateIds.filter(
      (id) => id && mongoose.Types.ObjectId.isValid(id.toString())
    );
    const uniqueUserIds = [...new Set(validUserIds.map((id) => id.toString()))];
    if (uniqueUserIds.length === 0) {
      return res.status(200).json({ success: true, count: 0, links: [] });
    }
    const links = await ShareableLink.find({ createdBy: { $in: uniqueUserIds } })
      .populate({
        path: "posterIds",
        populate: { path: "company_id", select: "name logo phone email city" }
      })
      .sort({ createdAt: -1 });
    if (!links.length)
      return res.status(200).json({ success: true, count: 0, links: [] });

    const frontendBase = getFrontendBase(req);

    // Format response data
    const formatted = links.map((link) => {
      const validPosterList = (link.posterIds || []).filter(Boolean);
      const totalLikes = link.interactions?.reduce((sum, inter) => sum + (inter.likes?.length || 0), 0);
      const totalComments = link.interactions?.reduce((sum, inter) => sum + (inter.comments?.length || 0), 0);
      const isPublishedToMarketplace = Boolean(
        link.isPublishedToMarketplace ||
        validPosterList.some((p) => p && p.isPublishedToMarketplace)
      );

      return {
        _id: link._id,
        name: link.name,
        token: link.token,
        url: `${frontendBase}/pages/view?token=${link.token}`,
        link: `${frontendBase}/pages/view?token=${link.token}`,
        posterIds: validPosterList,
        posterCount: validPosterList.length,
        isPublishedToMarketplace,
        likes: totalLikes,
        comments: totalComments,
        createdAt: link.createdAt,
        expiresAt: link.expiresAt,
        isRevoked: Boolean(link.isRevoked),
        revokedAt: link.revokedAt,
        isExpired: !link.isRevoked && link.expiresAt ? new Date(link.expiresAt) < new Date() : false,
        status: link.isRevoked ? "revoked" : (link.expiresAt && new Date(link.expiresAt) < new Date() ? "expired" : "active"),
      };
    });

    return res.json({ success: true, count: formatted.length, links: formatted });
  } catch (err) {
    console.error("Error fetching user shared links:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const deleteMultipleShareableLinks = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ success: false, message: "No link IDs provided" });

    const linksToDelete = await ShareableLink.find({ _id: { $in: ids } });
    const allPosterIds = linksToDelete.flatMap((l) => l.posterIds || []).filter(Boolean);
    if (allPosterIds.length > 0) {
      await Poster.updateMany(
        { _id: { $in: allPosterIds } },
        { $set: { shareableLinkToken: null, shareableLinkId: null } }
      );
    }

    const result = await ShareableLink.deleteMany({ _id: { $in: ids } });
    if (result.deletedCount === 0)
      return res.status(404).json({ success: false, message: "No matching links found to delete" });
    return res.status(200).json({ success: true, message: `${result.deletedCount} link(s) deleted successfully` });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const replyToComment = async (req, res) => {
  try {
    const { token, posterId, commentId } = req.params;
    const { userId, name, text } = req.body;
    if (!text?.trim())
      return res.status(400).json({ message: "Reply text required" });
    const shared = await ShareableLink.findOne({ token });
    if (!shared) return res.status(404).json({ message: "Invalid token" });

    // Find the poster interaction
    const interaction = shared.interactions.find(
      (i) => i.posterId.toString() === posterId
    );
    if (!interaction)
      return res.status(404).json({ message: "Poster not found in this link" });

    // Find the parent comment
    const parentComment = interaction.comments.find(
      (c) => c._id.toString() === commentId
    );
    if (!parentComment)
      return res.status(404).json({ message: "Comment not found" });

    // Create the reply
    const reply = { user: userId, name, text };
    parentComment.replies.push(reply);

    // Save the shared document
    await shared.save();

    // Collect users to notify (Set ensures uniqueness)
    const usersToNotify = new Set();

    // Notify original comment author if not replying to self
    if (parentComment.user.toString() !== userId.toString()) {
      usersToNotify.add(parentComment.user.toString());
    }

    // Notify all previous repliers except the current user
    parentComment.replies.forEach((r) => {
      if (r.user.toString() !== userId.toString()) {
        usersToNotify.add(r.user.toString());
      }
    });

    // Create notifications
    for (const notifyUserId of usersToNotify) {
      await Notification.create({
        userId: notifyUserId, // Receiver
        fromUser: userId,     // Actor
        fromName: name,       // Actor's name
        posterId,
        token,
        type: "reply",
        message: `${name} replied: "${text.slice(0, 50)}"`,
      });
    }

    // Return success
    res.json({
      success: true,
      message: "Reply added successfully",
      reply,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};


const revokeShareableLink = async (req, res) => {
  try {
    const { token } = req.params;
    const effectiveUserId = req.body?.userId || req.user?._id?.toString() || req.user?.authId;
    const resolvedUserId = (await resolveUserMongoId(effectiveUserId, req.user)) || effectiveUserId;

    const link = await ShareableLink.findOne({ token });
    if (!link) return res.status(404).json({ success: false, message: "Link not found" });

    const candidateIds = [
      req.user?._id?.toString(),
      req.user?.authId?.toString(),
      req.user?.id?.toString(),
      effectiveUserId?.toString(),
      resolvedUserId?.toString(),
    ].filter(Boolean);

    const isSuperAdmin = req.user?.role === "SUPER_ADMIN" || req.user?.role === "ADMIN";
    const isOwner = candidateIds.includes(link.createdBy.toString());

    if (!isSuperAdmin && !isOwner) {
      // Check if user owns the posters in this link
      const validCandidateMongoIds = candidateIds.filter(id => mongoose.Types.ObjectId.isValid(id));
      const ownedPosters = validCandidateMongoIds.length > 0 && link.posterIds?.length > 0
        ? await Poster.countDocuments({
          _id: { $in: link.posterIds },
          user_id: { $in: validCandidateMongoIds }
        })
        : 0;
      if (ownedPosters === 0) {
        return res.status(403).json({ success: false, message: "Unauthorized to revoke this link" });
      }
    }

    link.isRevoked = true;
    link.revokedAt = new Date();
    await link.save();

    if (link.posterIds && link.posterIds.length > 0) {
      await Poster.updateMany(
        { _id: { $in: link.posterIds }, shareableLinkId: link._id },
        { $set: { shareableLinkToken: null, shareableLinkId: null } }
      );
    }

    return res.json({
      success: true,
      message: "Shareable link revoked successfully",
      link: {
        _id: link._id,
        token: link.token,
        isRevoked: true,
        revokedAt: link.revokedAt,
        status: "revoked"
      }
    });
  } catch (err) {
    console.error("Error revoking shareable link:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const revokeMultipleShareableLinks = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ success: false, message: "No link IDs provided" });
    const linksToRevoke = await ShareableLink.find({ _id: { $in: ids } });
    const allPosterIds = linksToRevoke.flatMap((l) => l.posterIds || []);
    if (allPosterIds.length > 0) {
      await Poster.updateMany(
        { _id: { $in: allPosterIds }, shareableLinkId: { $in: ids } },
        { $set: { shareableLinkToken: null, shareableLinkId: null } }
      );
    }

    const result = await ShareableLink.updateMany(
      { _id: { $in: ids } },
      { $set: { isRevoked: true, revokedAt: new Date() } }
    );
    return res.status(200).json({
      success: true,
      message: `${result.modifiedCount} link(s) revoked successfully`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const RESERVED_SLUGS = new Set([
  "api", "admin", "auth", "login", "register", "pages", "view", "marketplace",
  "subscription", "settings", "terms", "privacy", "about", "contact", "home",
  "s", "p", "qr", "short", "invoice", "quotation", "poster", "posters", "create"
]);

const setCustomSlug = async (req, res) => {
  try {
    const { token } = req.params;
    let { slug, userId } = req.body;
    if (!slug || typeof slug !== "string") {
      return res.status(400).json({ message: "Custom slug is required" });
    }
    const cleanSlug = slug.trim().toLowerCase();

    // Slug validation: 3 to 40 characters, letters, numbers, hyphens and underscores
    if (!/^[a-z0-9_-]{3,40}$/.test(cleanSlug)) {
      return res.status(400).json({
        message: "Slug must be 3-40 characters long and contain only letters, numbers, hyphens, or underscores"
      });
    }

    if (RESERVED_SLUGS.has(cleanSlug)) {
      return res.status(400).json({
        message: `"${cleanSlug}" is a reserved system keyword. Please choose another slug.`
      });
    }

    const link = await ShareableLink.findOne({ token, isRevoked: { $ne: true } });
    if (!link) {
      return res.status(404).json({ message: "Shareable link not found or revoked" });
    }

    // Check ownership / admin authorization
    const resolvedUserId = (await resolveUserMongoId(userId, req.user)) || userId;
    const userCandidates = [
      userId?.toString(),
      resolvedUserId?.toString(),
      req.user?._id?.toString(),
      req.user?.authId?.toString(),
    ].filter(Boolean);
    const isSuperAdmin = req.user?.role === "SUPER_ADMIN" || req.user?.role === "ADMIN";
    const DEFAULT_POSTER_USER_ID = "69d362ca7421b5bc1882903d";
    if (
      userCandidates.length > 0 &&
      !isSuperAdmin &&
      !userCandidates.includes(link.createdBy.toString()) &&
      link.createdBy.toString() !== DEFAULT_POSTER_USER_ID
    ) {
      return res.status(403).json({ message: "Unauthorized to edit this link" });
    }

    // Check if slug is already used by another active link
    const existingSlugLink = await ShareableLink.findOne({
      customSlug: cleanSlug,
      token: { $ne: token },
      isRevoked: { $ne: true }
    });
    if (existingSlugLink) {
      return res.status(409).json({
        message: `The short URL slug "${cleanSlug}" is already taken. Please choose a different one.`
      });
    }

    link.customSlug = cleanSlug;
    await link.save();

    const frontendBase = getFrontendBase(req);
    const shortUrl = `${frontendBase}/s/${cleanSlug}`;

    return res.json({
      success: true,
      message: "Custom short URL saved successfully",
      customSlug: cleanSlug,
      shortUrl,
      token: link.token,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "This short URL slug is already taken" });
    }
    console.error("Error setting custom slug:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getLinkBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    if (!slug) return res.status(400).json({ message: "Slug is required" });
    const cleanSlug = slug.trim().toLowerCase();

    const link = await ShareableLink.findOne({ customSlug: cleanSlug });
    if (!link) {
      return res.status(404).json({ message: "Short URL not found" });
    }
    if (link.isRevoked) {
      return res.status(410).json({ success: false, isRevoked: true, message: "This link has been revoked" });
    }
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return res.status(410).json({ success: false, isExpired: true, message: "This link has expired" });
    }

    const frontendBase = getFrontendBase(req);
    return res.json({
      success: true,
      token: link.token,
      name: link.name,
      customSlug: link.customSlug,
      url: `${frontendBase}/pages/view?token=${link.token}`,
      shortUrl: `${frontendBase}/s/${link.customSlug}`,
      expiresAt: link.expiresAt,
    });
  } catch (err) {
    console.error("Error in getLinkBySlug:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const redirectShortUrl = async (req, res) => {
  try {
    const { slug } = req.params;
    if (!slug) return res.status(400).send("Slug required");
    const cleanSlug = slug.trim().toLowerCase();

    const link = await ShareableLink.findOne({ customSlug: cleanSlug });
    const frontendBase = getFrontendBase(req);
    if (!link) {
      return res.redirect(`${frontendBase}/pages/view?error=not_found`);
    }
    if (link.isRevoked) {
      return res.redirect(`${frontendBase}/pages/view?token=${link.token}&error=revoked`);
    }
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return res.redirect(`${frontendBase}/pages/view?token=${link.token}&error=expired`);
    }

    return res.redirect(`${frontendBase}/pages/view?token=${link.token}`);
  } catch (err) {
    console.error("Error redirecting short URL:", err);
    const frontendBase = getFrontendBase(req);
    return res.redirect(frontendBase);
  }
};

export {
  createShareableLink,
  toggleLike,
  addComment,
  getPosterInteractions,
  getSharedPosters,
  deleteMultipleShareableLinks,
  toggleCommentLike,
  updateShareableLink,
  getUserSharedLinks,
  replyToComment,
  revokeShareableLink,
  revokeMultipleShareableLinks,
  setCustomSlug,
  getLinkBySlug,
  redirectShortUrl,
};
