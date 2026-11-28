import mongoose from "mongoose";
import Poster from "../models/Poster.js";

// Pre-multer middleware for the updatePoster route.
//
// Multer's `destination` callback only sees what's already in `req.body`
// at the moment a file is parsed, so the frontend would otherwise have to
// re-send `userId` and `company_id` as text fields *before* the file fields.
// To avoid that fragility, we look the poster up by id and stamp
// `req.body.userId` (always) and `req.body.company_id` (only as a default)
// so files land in `uploads/{userId}/{companyId}/`.
//
// We also stash the loaded poster on `req.posterDoc` so the controller can
// reuse it without a second query.
const attachPosterUpdateContext = async (req, res, next) => {
  try {
    const { id } = req.params || {};
    if (!id) return next();

    let poster = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      poster = await Poster.findById(id);
    }
    if (!poster) {
      poster = await Poster.findOne({ posterId: id });
    }
    if (!poster) return next();

    req.posterDoc = poster;

    if (!req.body) req.body = {};

    // Multer replaces `req.body` with a fresh object when it starts parsing
    // multipart data, which would wipe out anything we set here. Stash the
    // resolved ids on `req` itself so the multer storage destination can
    // read them regardless of body-parse order.
    req.posterUploadContext = req.posterUploadContext || {};

    // Always force userId to the poster's owner — clients can't redirect
    // uploads into someone else's folder via this route.
    if (poster.user_id) {
      const ownerId = String(poster.user_id);
      req.body.userId = ownerId;
      req.posterUploadContext.userId = ownerId;
    }

    // company_id: prefer the value the client sent (so a change of company
    // routes new uploads to the new folder), otherwise default to the
    // poster's existing company.
    const clientCompanyId =
      req.body.company_id !== undefined && req.body.company_id !== ""
        ? String(req.body.company_id)
        : "";
    if (clientCompanyId) {
      req.posterUploadContext.companyId = clientCompanyId;
    } else if (poster.company_id) {
      const fallbackCompanyId = String(poster.company_id);
      req.body.company_id = fallbackCompanyId;
      req.posterUploadContext.companyId = fallbackCompanyId;
    }

    return next();
  } catch (err) {
    return next(err);
  }
};

export default attachPosterUpdateContext;
