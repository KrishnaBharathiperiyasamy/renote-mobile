import { describe, it } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

// Utilities & Logic to test
import { formatInvoiceID, getNextInvoiceSequenceID } from "../utilis/formatInvoice.js";
import { validateArrayField, validateRequiredFields, validatePosterInput } from "../utilis/validators.js";
import { resolveUploadPath, toPublicUploadPath, normalizeUploadPublicPath } from "../utils/uploadPaths.js";
import { resolveUserMongoId } from "../utils/resolveUser.js";

// Routes to test wiring
import quotationRoutes from "../routes/quotationRoutes.js";
import invoiceRoutes from "../routes/invoiceRoutes.js";
import companyRoutes from "../routes/companyRoutes.js";
import linkRoutes from "../routes/linkRoutes.js";
import marketplaceRoutes from "../routes/marketplaceRoutes.js";
import posterRoutes from "../routes/posterRoutes.js";
import userRoutes from "../routes/userRoutes.js";
import ShareableLink from "../models/shareableLinkSchema.js";
import Poster from "../models/Poster.js";
import User from "../models/User.js";
import Company from "../models/Company.js";
import jwt from "jsonwebtoken";
import authMiddleware from "../middleware/authMiddleware.js";
import userMiddleware from "../middleware/UserMiddleware.js";
import {
  getSession,
  refreshUserToken,
  logoutUser,
} from "../controllers/userController.js";
import { updatePoster, duplicatePoster } from "../controllers/posterController.js";
import {
  createShareableLink,
  revokeShareableLink,
  getSharedPosters,
  getUserSharedLinks,
  setCustomSlug,
  getLinkBySlug,
  redirectShortUrl,
} from "../controllers/linkController.js";

describe("1. Invoice ID & Sequencing Logic", () => {
  it("formatInvoiceID should trim and return string", () => {
    assert.equal(formatInvoiceID("  INV-001  "), "INV-001");
    assert.equal(formatInvoiceID(""), "");
    assert.equal(formatInvoiceID(null), "");
  });

  it("getNextInvoiceSequenceID should generate correct sequence format I/YY-YY/0001", () => {
    const nextId = getNextInvoiceSequenceID([]);
    assert.match(nextId, /^I\/\d{2}-\d{2}\/0001$/);
  });

  it("getNextInvoiceSequenceID should increment highest sequence number in list", () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const startYear = month >= 4 ? year : year - 1;
    const fyStr = `${String(startYear).slice(-2)}-${String(startYear + 1).slice(-2)}`;
    const currentList = [
      { invoiceID: `I/${fyStr}/0001` },
      { invoiceID: `I/${fyStr}/0005` },
      { invoiceID: `I/${fyStr}/0002` },
    ];
    const nextId = getNextInvoiceSequenceID(currentList);
    assert.equal(nextId, `I/${fyStr}/0006`);
  });
});

describe("2. Request Validators & Sanitizers", () => {
  it("validateArrayField should reject null, undefined, or empty arrays", () => {
    assert.ok(validateArrayField(null, "items"));
    assert.ok(validateArrayField([], "items"));
    assert.equal(validateArrayField([1, 2], "items"), null);
  });

  it("validateRequiredFields should catch missing fields in array of objects", () => {
    const valid = [{ name: "Item 1", price: 100 }];
    const invalid = [{ name: "Item 2" }]; // missing price
    assert.equal(validateRequiredFields(valid, ["name", "price"], "Item"), null);
    assert.match(validateRequiredFields(invalid, ["name", "price"], "Item"), /price is missing/i);
  });
});

describe("3. Upload Path Helpers", () => {
  it("toPublicUploadPath should format leading slashes properly", () => {
    assert.equal(toPublicUploadPath("sample.png"), "/uploads/sample.png");
    assert.equal(toPublicUploadPath("/sample.png"), "/uploads/sample.png");
  });

  it("normalizeUploadPublicPath should handle relative and absolute paths", () => {
    assert.equal(normalizeUploadPublicPath("uploads/image.jpg"), "/uploads/image.jpg");
    assert.equal(normalizeUploadPublicPath("/uploads/image.jpg"), "/uploads/image.jpg");
    assert.equal(normalizeUploadPublicPath(null), null);
  });
});

describe("4. User Resolution Logic (Multi-tier Identity)", () => {
  it("resolveUserMongoId should return ObjectId directly if already valid ObjectId", async () => {
    const validId = new mongoose.Types.ObjectId();
    const resolved = await resolveUserMongoId(validId);
    assert.equal(resolved?.toString(), validId.toString());
  });

  it("resolveUserMongoId should return null when given null/empty input without DB connection", async () => {
    const resolved = await resolveUserMongoId(null);
    assert.equal(resolved, null);
  });
});

describe("5. Backend Express Routes & API Contracts", () => {
  const getRoutePaths = (router) => {
    return router.stack
      .filter((layer) => layer.route)
      .map((layer) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));
  };

  it("quotationRoutes should include DELETE /deleteQuotation/:id and POST /deleteQuotation", () => {
    const routes = getRoutePaths(quotationRoutes);
    const deleteRoute = routes.find(
      (r) => r.path === "/deleteQuotation/:id" && r.methods.includes("delete")
    );
    const postDeleteRoute = routes.find(
      (r) => r.path === "/deleteQuotation" && r.methods.includes("post")
    );
    assert.ok(deleteRoute, "Expected quotationRoutes to have DELETE /deleteQuotation/:id");
    assert.ok(postDeleteRoute, "Expected quotationRoutes to have POST /deleteQuotation");
  });

  it("companyRoutes should support both PAN verification endpoint patterns including callbacks", () => {
    const routes = getRoutePaths(companyRoutes);
    const hasInitiateNew = routes.some(
      (r) => r.path === "/pan-verify/initiate/:companyId/:userId" && r.methods.includes("post")
    );
    const hasInitiateLegacy = routes.some(
      (r) => r.path === "/:companyId/pan/verify/initiate/:userId" && r.methods.includes("post")
    );
    const hasStatusNew = routes.some(
      (r) => r.path === "/pan-verify/status/:companyId/:userId" && r.methods.includes("get")
    );
    const hasCallbackNew = routes.some(
      (r) => r.path === "/pan-verify/callback" && r.methods.includes("post")
    );
    const hasPostbackNew = routes.some(
      (r) => r.path === "/pan-verify/postback" && r.methods.includes("post")
    );
    assert.ok(hasInitiateNew, "Expected companyRoutes to have POST /pan-verify/initiate/:companyId/:userId");
    assert.ok(hasInitiateLegacy, "Expected companyRoutes to retain POST /:companyId/pan/verify/initiate/:userId");
    assert.ok(hasStatusNew, "Expected companyRoutes to have GET /pan-verify/status/:companyId/:userId");
    assert.ok(hasCallbackNew, "Expected companyRoutes to have POST /pan-verify/callback");
    assert.ok(hasPostbackNew, "Expected companyRoutes to have POST /pan-verify/postback");
  });

  it("marketplaceRoutes should register public feed and protected link publishing", () => {
    const routes = getRoutePaths(marketplaceRoutes);
    const hasFeed = routes.some((r) => r.path === "/feed" && r.methods.includes("get"));
    const hasPublishLink = routes.some(
      (r) => r.path === "/publish-link/:token" && r.methods.includes("patch")
    );
    assert.ok(hasFeed, "Expected marketplaceRoutes to have GET /feed");
    assert.ok(hasPublishLink, "Expected marketplaceRoutes to have PATCH /publish-link/:token");
  });

  it("linkRoutes should register /share-poster, /shared/:token, /shared/:token/revoke, and /user/:userId", () => {
    const routes = getRoutePaths(linkRoutes);
    assert.ok(routes.some((r) => r.path === "/share-poster" && r.methods.includes("post")));
    assert.ok(routes.some((r) => r.path === "/shared/:token" && r.methods.includes("get")));
    assert.ok(routes.some((r) => r.path === "/user/:userId" && r.methods.includes("get")));
    assert.ok(routes.some((r) => r.path === "/shared/:token/revoke" && (r.methods.includes("patch") || r.methods.includes("post"))));
    assert.ok(routes.some((r) => r.path === "/revoke-multiple" && r.methods.includes("post")));
  });

  it("posterRoutes should register /getPoster/:userId, /createPoster/:userId, and deletion routes", () => {
    const routes = getRoutePaths(posterRoutes);
    assert.ok(routes.some((r) => r.path === "/getPoster/:userId" && r.methods.includes("get")));
    assert.ok(routes.some((r) => r.path === "/createPoster/:userId" && r.methods.includes("post")));
    assert.ok(routes.some((r) => r.path === "/duplicate/:id" && r.methods.includes("post")));
    assert.ok(routes.some((r) => r.path === "/updatePoster/:id" && r.methods.includes("put")));
    assert.ok(routes.some((r) => r.path === "/deletePoster/:id" && r.methods.includes("delete")));
    assert.ok(routes.some((r) => r.path === "/deletePoster" && (r.methods.includes("post") || r.methods.includes("delete"))));
  });

  it("invoiceRoutes should register invoice deletion routes and next-id", () => {
    const routes = getRoutePaths(invoiceRoutes);
    assert.ok(routes.some((r) => r.path === "/next-id/:userId" && r.methods.includes("get")));
    assert.ok(routes.some((r) => r.path === "/deleteInvoice/:id" && r.methods.includes("delete")));
    assert.ok(routes.some((r) => r.path === "/deleteInvoices" && (r.methods.includes("post") || r.methods.includes("delete"))));
  });

  it("userRoutes should register user update routes with POST, PUT, and PATCH", () => {
    const routes = getRoutePaths(userRoutes);
    assert.ok(routes.some((r) => r.path === "/update-user/:id" && r.methods.includes("post")));
    assert.ok(routes.some((r) => r.path === "/update-user/:id" && r.methods.includes("put")));
    assert.ok(routes.some((r) => r.path === "/update-user/:id" && r.methods.includes("patch")));
  });
});

describe("6. Poster Sharing & Link Lifecycle Logic", () => {
  const createMockRes = () => {
    const res = {
      statusCode: 200,
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      },
    };
    return res;
  };

  it("createShareableLink should reject empty posterIds array with 400", async () => {
    const req = { body: { posterIds: [], userId: "user-123" }, get: () => "http://localhost:6001" };
    const res = createMockRes();
    await createShareableLink(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.jsonData?.message, /posterIds\[\] and userId required/i);
  });

  it("createShareableLink should reject missing userId with 400", async () => {
    const req = { body: { posterIds: ["69d362ca7421b5bc1882903d"] }, get: () => "http://localhost:6001" };
    const res = createMockRes();
    await createShareableLink(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.jsonData?.message, /posterIds\[\] and userId required/i);
  });

  it("revokeShareableLink should return 404 when link token does not exist", async () => {
    const origFindOne = ShareableLink.findOne;
    ShareableLink.findOne = () => Promise.resolve(null);
    try {
      const req = {
        params: { token: "nonexistent_token_999" },
        body: { userId: "some-user" },
        user: { _id: new mongoose.Types.ObjectId() }
      };
      const res = createMockRes();
      await revokeShareableLink(req, res);
      assert.equal(res.statusCode, 404);
      assert.equal(res.jsonData?.success, false);
    } finally {
      ShareableLink.findOne = origFindOne;
    }
  });

  it("revokeShareableLink should revoke link and return 200 with revoked status", async () => {
    const origFindOne = ShareableLink.findOne;
    const origPosterUpdateMany = Poster.updateMany;
    const testUserId = new mongoose.Types.ObjectId();
    const mockLink = {
      _id: new mongoose.Types.ObjectId(),
      token: "active_token_123",
      createdBy: testUserId,
      posterIds: [new mongoose.Types.ObjectId()],
      isRevoked: false,
      save: async function () { this.isRevoked = true; this.revokedAt = new Date(); return this; }
    };
    ShareableLink.findOne = () => Promise.resolve(mockLink);
    Poster.updateMany = () => Promise.resolve({ modifiedCount: 1 });
    try {
      const req = {
        params: { token: "active_token_123" },
        body: { userId: testUserId.toString() },
        user: { _id: testUserId }
      };
      const res = createMockRes();
      await revokeShareableLink(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData?.success, true);
      assert.equal(res.jsonData?.link?.isRevoked, true);
      assert.equal(res.jsonData?.link?.status, "revoked");
    } finally {
      ShareableLink.findOne = origFindOne;
      Poster.updateMany = origPosterUpdateMany;
    }
  });

  it("getSharedPosters should return 404 for nonexistent token", async () => {
    const origFindOne = ShareableLink.findOne;
    ShareableLink.findOne = () => ({ populate: () => Promise.resolve(null) });
    try {
      const req = { params: { token: "nonexistent_token_999" } };
      const res = createMockRes();
      await getSharedPosters(req, res);
      assert.equal(res.statusCode, 404);
    } finally {
      ShareableLink.findOne = origFindOne;
    }
  });

  it("getSharedPosters should return 410 when link is marked revoked", async () => {
    const origFindOne = ShareableLink.findOne;
    const mockRevokedLink = {
      token: "revoked_token_123",
      isRevoked: true,
      posterIds: [new mongoose.Types.ObjectId()],
    };
    ShareableLink.findOne = () => ({ populate: () => Promise.resolve(mockRevokedLink) });
    try {
      const req = { params: { token: "revoked_token_123" } };
      const res = createMockRes();
      await getSharedPosters(req, res);
      assert.equal(res.statusCode, 410);
      assert.equal(res.jsonData?.isRevoked, true);
      assert.match(res.jsonData?.message, /revoked/i);
    } finally {
      ShareableLink.findOne = origFindOne;
    }
  });

  it("getSharedPosters should return 410 when link is expired", async () => {
    const origFindOne = ShareableLink.findOne;
    const mockExpiredLink = {
      token: "expired_token_123",
      isRevoked: false,
      expiresAt: new Date(Date.now() - 60000), // 1 minute in the past
      posterIds: [new mongoose.Types.ObjectId()],
    };
    ShareableLink.findOne = () => ({ populate: () => Promise.resolve(mockExpiredLink) });
    try {
      const req = { params: { token: "expired_token_123" } };
      const res = createMockRes();
      await getSharedPosters(req, res);
      assert.equal(res.statusCode, 410);
      assert.equal(res.jsonData?.isExpired, true);
      assert.match(res.jsonData?.message, /expired/i);
    } finally {
      ShareableLink.findOne = origFindOne;
    }
  });

  it("ShareableLink schema should default isRevoked to false and default 7-day expiry", () => {
    const token = "tok_" + Math.random().toString(36).substring(7);
    const link = new ShareableLink({
      token,
      name: "Test Share Link",
      posterIds: [new mongoose.Types.ObjectId()],
      createdBy: new mongoose.Types.ObjectId(),
    });
    assert.equal(link.isRevoked, false);
    assert.ok(link.expiresAt);
    const diffDays = (new Date(link.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    assert.ok(diffDays >= 6.9 && diffDays <= 7.1, "Default expiry should be ~7 days in the future");
  });

  it("Status computation correctly categorizes active, expired, and revoked states", () => {
    const resolveStatus = (link) => {
      if (link.isRevoked) return "revoked";
      if (link.expiresAt && new Date(link.expiresAt) < new Date()) return "expired";
      return "active";
    };

    assert.equal(resolveStatus({ isRevoked: true, expiresAt: new Date(Date.now() + 100000) }), "revoked");
    assert.equal(resolveStatus({ isRevoked: false, expiresAt: new Date(Date.now() - 100000) }), "expired");
    assert.equal(resolveStatus({ isRevoked: false, expiresAt: new Date(Date.now() + 100000) }), "active");
    assert.equal(resolveStatus({ isRevoked: false, expiresAt: null }), "active");
  });

  it("createShareableLink should reuse active link with exact size matching and return isExisting: true", async () => {
    const origPosterFind = Poster.find;
    const origShareableLinkFindOne = ShareableLink.findOne;
    const origPosterUpdateMany = Poster.updateMany;

    const testUserId = new mongoose.Types.ObjectId();
    const poster1Id = new mongoose.Types.ObjectId();
    const mockPoster = {
      _id: poster1Id,
      user_id: testUserId,
      company_id: null,
      poster_name: "Poster 1"
    };

    const mockExistingLink = {
      _id: new mongoose.Types.ObjectId(),
      token: "existing_token_xyz",
      name: "Existing Active Link",
      posterIds: [poster1Id],
      createdBy: testUserId,
      isRevoked: false,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      save: async function () { return this; }
    };

    let queryCaptured = null;
    Poster.find = () => Promise.resolve([mockPoster]);
    Poster.updateMany = () => Promise.resolve({ modifiedCount: 1 });
    ShareableLink.findOne = (q) => {
      queryCaptured = q;
      return Promise.resolve(mockExistingLink);
    };

    try {
      const req = {
        body: { posterIds: [poster1Id.toString()], userId: testUserId.toString() },
        get: () => "http://localhost:6001",
        user: { _id: testUserId }
      };
      const res = createMockRes();
      await createShareableLink(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData?.success, true);
      assert.equal(res.jsonData?.isExisting, true);
      assert.equal(res.jsonData?.token, "existing_token_xyz");
      assert.equal(res.jsonData?.status, "active");
      // Check query: must match exact size 1 and createdBy of the user
      assert.deepEqual(queryCaptured.posterIds, { $size: 1, $all: [poster1Id] });
      assert.ok(queryCaptured.createdBy);
    } finally {
      Poster.find = origPosterFind;
      ShareableLink.findOne = origShareableLinkFindOne;
      Poster.updateMany = origPosterUpdateMany;
    }
  });

  it("createShareableLink should allow generating shareable links freely without plan limit restrictions", async () => {
    const origPosterFind = Poster.find;
    const origShareableLinkFindOne = ShareableLink.findOne;
    const origShareableLinkCount = ShareableLink.countDocuments;
    const origPosterUpdateMany = Poster.updateMany;
    const origSave = ShareableLink.prototype.save;

    const testUserId = new mongoose.Types.ObjectId();
    const poster1Id = new mongoose.Types.ObjectId();
    const mockPoster = {
      _id: poster1Id,
      user_id: testUserId,
      company_id: null,
      poster_name: "Poster Free Share",
    };

    Poster.find = () => Promise.resolve([mockPoster]);
    ShareableLink.findOne = () => Promise.resolve(null);
    ShareableLink.countDocuments = () => Promise.resolve(999);
    Poster.updateMany = () => Promise.resolve({ modifiedCount: 1 });
    ShareableLink.prototype.save = async function () { return this; };

    try {
      const req = {
        body: { posterIds: [poster1Id.toString()], userId: testUserId.toString() },
        get: () => "http://localhost:6001",
        user: { _id: testUserId }
      };
      const res = createMockRes();
      await createShareableLink(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData?.success, true);
      assert.ok(res.jsonData?.token);
      assert.ok(res.jsonData?.link);
      assert.equal(res.jsonData?.status, "active");
    } finally {
      Poster.find = origPosterFind;
      ShareableLink.findOne = origShareableLinkFindOne;
      ShareableLink.countDocuments = origShareableLinkCount;
      Poster.updateMany = origPosterUpdateMany;
      ShareableLink.prototype.save = origSave;
    }
  });

  it("createShareableLink should allow creating bundle shareable links for multiple posters freely", async () => {
    const origPosterFind = Poster.find;
    const origShareableLinkFindOne = ShareableLink.findOne;
    const origShareableLinkCount = ShareableLink.countDocuments;
    const origPosterUpdateMany = Poster.updateMany;
    const origSave = ShareableLink.prototype.save;

    const testUserId = new mongoose.Types.ObjectId();
    const posterIds = [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()];
    const mockPosters = posterIds.map((id, index) => ({
      _id: id,
      user_id: testUserId,
      company_id: null,
      poster_name: `Poster Bundle ${index + 1}`,
    }));

    Poster.find = () => Promise.resolve(mockPosters);
    ShareableLink.findOne = () => Promise.resolve(null);
    ShareableLink.countDocuments = () => Promise.resolve(50);
    Poster.updateMany = () => Promise.resolve({ modifiedCount: 3 });
    ShareableLink.prototype.save = async function () { return this; };

    try {
      const req = {
        body: {
          posterIds: posterIds.map(String),
          userId: testUserId.toString(),
          name: "Spring Sale Bundle",
        },
        get: () => "https://renote.co.in",
        user: { _id: testUserId }
      };
      const res = createMockRes();
      await createShareableLink(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData?.success, true);
      assert.equal(res.jsonData?.name, "Spring Sale Bundle");
      assert.ok(res.jsonData?.token);
      assert.match(res.jsonData?.link, /https:\/\/renote\.co\.in\/pages\/view\?token=/);
      assert.equal(res.jsonData?.isExisting, false);
    } finally {
      Poster.find = origPosterFind;
      ShareableLink.findOne = origShareableLinkFindOne;
      ShareableLink.countDocuments = origShareableLinkCount;
      Poster.updateMany = origPosterUpdateMany;
      ShareableLink.prototype.save = origSave;
    }
  });

  it("createShareableLink should allow force regeneration of links without plan limit", async () => {
    const origPosterFind = Poster.find;
    const origShareableLinkFindOne = ShareableLink.findOne;
    const origShareableLinkFind = ShareableLink.find;
    const origShareableLinkUpdateMany = ShareableLink.updateMany;
    const origPosterUpdateMany = Poster.updateMany;
    const origSave = ShareableLink.prototype.save;

    const testUserId = new mongoose.Types.ObjectId();
    const posterId = new mongoose.Types.ObjectId();
    const mockPoster = {
      _id: posterId,
      user_id: testUserId,
      company_id: null,
      poster_name: "Poster Regenerate",
    };

    Poster.find = () => Promise.resolve([mockPoster]);
    ShareableLink.find = () => Promise.resolve([{ _id: new mongoose.Types.ObjectId() }]);
    ShareableLink.updateMany = () => Promise.resolve({ modifiedCount: 1 });
    Poster.updateMany = () => Promise.resolve({ modifiedCount: 1 });
    ShareableLink.prototype.save = async function () { return this; };

    try {
      const req = {
        body: {
          posterIds: [posterId.toString()],
          userId: testUserId.toString(),
          force: true,
        },
        get: () => "https://renote.co.in",
        user: { _id: testUserId }
      };
      const res = createMockRes();
      await createShareableLink(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData?.success, true);
      assert.ok(res.jsonData?.token);
      assert.equal(res.jsonData?.isExisting, false);
    } finally {
      Poster.find = origPosterFind;
      ShareableLink.findOne = origShareableLinkFindOne;
      ShareableLink.find = origShareableLinkFind;
      ShareableLink.updateMany = origShareableLinkUpdateMany;
      Poster.updateMany = origPosterUpdateMany;
      ShareableLink.prototype.save = origSave;
    }
  });

  it("getUserSharedLinks should return formatted links with url, status, and posterCount", async () => {
    const origShareableLinkFind = ShareableLink.find;
    const testUserId = new mongoose.Types.ObjectId();
    const mockLinks = [
      {
        _id: new mongoose.Types.ObjectId(),
        name: "Test Link 1",
        token: "tok_123",
        posterIds: [new mongoose.Types.ObjectId()],
        interactions: [{ likes: [1, 2], comments: ["a"] }],
        isRevoked: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 100000),
      }
    ];

    ShareableLink.find = () => ({
      populate: () => ({
        sort: () => Promise.resolve(mockLinks)
      })
    });

    try {
      const req = {
        params: { userId: testUserId.toString() },
        user: { _id: testUserId },
        get: () => "http://localhost:6001"
      };
      const res = createMockRes();
      await getUserSharedLinks(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData?.success, true);
      assert.equal(res.jsonData?.count, 1);
      const first = res.jsonData?.links[0];
      assert.equal(first.token, "tok_123");
      assert.equal(first.status, "active");
      assert.equal(first.likes, 2);
      assert.equal(first.comments, 1);
      assert.ok(first.url.includes("/pages/view?token=tok_123"));
    } finally {
      ShareableLink.find = origShareableLinkFind;
    }
  });

  it("setCustomSlug should reject invalid slug format and reserved keywords", async () => {
    const req1 = { params: { token: "tok_123" }, body: { slug: "ab" }, user: {} };
    const res1 = createMockRes();
    await setCustomSlug(req1, res1);
    assert.equal(res1.statusCode, 400);

    const req2 = { params: { token: "tok_123" }, body: { slug: "admin" }, user: {} };
    const res2 = createMockRes();
    await setCustomSlug(req2, res2);
    assert.equal(res2.statusCode, 400);
    assert.ok(res2.jsonData?.message?.includes("reserved"));
  });

  it("setCustomSlug should save valid slug and prevent duplicates", async () => {
    const origFindOne = ShareableLink.findOne;
    const testUserId = new mongoose.Types.ObjectId();
    const mockLink = {
      token: "tok_abc",
      createdBy: testUserId,
      save: async function () { return this; }
    };

    let findCount = 0;
    ShareableLink.findOne = (q) => {
      findCount++;
      if (q.token === "tok_abc") return Promise.resolve(mockLink);
      if (q.customSlug === "existing-slug") return Promise.resolve({ token: "other_tok" });
      return Promise.resolve(null);
    };

    try {
      // 1. Conflict test
      const reqConflict = {
        params: { token: "tok_abc" },
        body: { slug: "existing-slug", userId: testUserId.toString() },
        user: { _id: testUserId },
        get: () => "http://localhost:6001"
      };
      const resConflict = createMockRes();
      await setCustomSlug(reqConflict, resConflict);
      assert.equal(resConflict.statusCode, 409);

      // 2. Success test
      const reqSuccess = {
        params: { token: "tok_abc" },
        body: { slug: "my-brand-poster", userId: testUserId.toString() },
        user: { _id: testUserId },
        get: () => "http://localhost:6001"
      };
      const resSuccess = createMockRes();
      await setCustomSlug(reqSuccess, resSuccess);
      assert.equal(resSuccess.statusCode, 200);
      assert.equal(resSuccess.jsonData?.success, true);
      assert.equal(resSuccess.jsonData?.customSlug, "my-brand-poster");
      assert.equal(mockLink.customSlug, "my-brand-poster");
    } finally {
      ShareableLink.findOne = origFindOne;
    }
  });

  it("getLinkBySlug should resolve active link and redirectShortUrl should redirect to view page", async () => {
    const origFindOne = ShareableLink.findOne;
    const mockLink = {
      token: "tok_target",
      name: "Target Poster",
      customSlug: "summer-deals",
      isRevoked: false,
      expiresAt: null
    };

    ShareableLink.findOne = (q) => {
      if (q.customSlug === "summer-deals") return Promise.resolve(mockLink);
      return Promise.resolve(null);
    };

    try {
      const reqGet = { params: { slug: "summer-deals" }, get: () => "http://localhost:6001" };
      const resGet = createMockRes();
      await getLinkBySlug(reqGet, resGet);
      assert.equal(resGet.statusCode, 200);
      assert.equal(resGet.jsonData?.token, "tok_target");
      assert.ok(resGet.jsonData?.shortUrl?.includes("/s/summer-deals"));

      let redirectUrl = "";
      const reqRedir = { params: { slug: "summer-deals" }, get: () => "http://localhost:6001" };
      const resRedir = {
        redirect: (url) => { redirectUrl = url; }
      };
      await redirectShortUrl(reqRedir, resRedir);
      assert.equal(redirectUrl, "http://localhost:6001/pages/view?token=tok_target");
    } finally {
      ShareableLink.findOne = origFindOne;
    }
  });
});

describe("7. Session Handling, Auth Middleware & Synchronization", () => {
  const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_access_key_change_in_production";

  const createMockRes = () => {
    const res = {
      statusCode: 200,
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      },
    };
    return res;
  };

  it("authMiddleware should reject request with no token with 401 Unauthorized", async () => {
    const req = { headers: {} };
    const res = createMockRes();
    let nextCalled = false;
    await authMiddleware(req, res, () => { nextCalled = true; });
    assert.equal(res.statusCode, 401);
    assert.equal(res.jsonData?.message, "No token provided");
    assert.equal(nextCalled, false);
  });

  it("authMiddleware should reject expired JWT token with 401 and Token expired", async () => {
    const expiredToken = jwt.sign({ authId: "test-user-1" }, JWT_SECRET, { expiresIn: -10 });
    const req = { headers: { authorization: `Bearer ${expiredToken}` } };
    const res = createMockRes();
    let nextCalled = false;
    await authMiddleware(req, res, () => { nextCalled = true; });
    assert.equal(res.statusCode, 401);
    assert.equal(res.jsonData?.message, "Token expired");
    assert.equal(nextCalled, false);
  });

  it("authMiddleware should reject invalid signature with 401 Unauthorized", async () => {
    const invalidToken = jwt.sign({ authId: "test-user-1" }, "wrong_secret");
    const req = { headers: { authorization: `Bearer ${invalidToken}` } };
    const res = createMockRes();
    let nextCalled = false;
    await authMiddleware(req, res, () => { nextCalled = true; });
    assert.equal(res.statusCode, 401);
    assert.equal(res.jsonData?.message, "Unauthorized");
    assert.equal(nextCalled, false);
  });

  it("authMiddleware should reject token without any user identifier with 401", async () => {
    const tokenNoId = jwt.sign({ foo: "bar" }, JWT_SECRET, { expiresIn: "1h" });
    const req = { headers: { authorization: `Bearer ${tokenNoId}` } };
    const res = createMockRes();
    let nextCalled = false;
    await authMiddleware(req, res, () => { nextCalled = true; });
    assert.equal(res.statusCode, 401);
    assert.match(res.jsonData?.message, /invalid token/i);
    assert.equal(nextCalled, false);
  });

  it("authMiddleware should accept valid token and populate req.user with authId and _id", async () => {
    const origFindOne = User.findOne;
    const testUserId = new mongoose.Types.ObjectId();
    const mockUser = {
      _id: testUserId,
      authId: "auth-uuid-12345",
      email: "test@renote.com",
      isDeleted: false,
    };
    User.findOne = () => Promise.resolve(mockUser);

    try {
      const validToken = jwt.sign({ authId: "auth-uuid-12345", roleCode: "USER" }, JWT_SECRET, { expiresIn: "1h" });
      const req = { headers: { authorization: `Bearer ${validToken}` } };
      const res = createMockRes();
      let nextCalled = false;
      await authMiddleware(req, res, () => { nextCalled = true; });
      assert.equal(nextCalled, true);
      assert.equal(req.user?.authId, "auth-uuid-12345");
      assert.equal(req.user?._id?.toString(), testUserId.toString());
    } finally {
      User.findOne = origFindOne;
    }
  });

  it("authMiddleware should support sub as user identifier from auth-service", async () => {
    const origFindOne = User.findOne;
    const testUserId = new mongoose.Types.ObjectId();
    const mockUser = {
      _id: testUserId,
      authId: "sub-uuid-9999",
      isDeleted: false,
    };
    User.findOne = () => Promise.resolve(mockUser);

    try {
      const validToken = jwt.sign({ sub: "sub-uuid-9999" }, JWT_SECRET, { expiresIn: "1h" });
      const req = { headers: { authorization: `Bearer ${validToken}` } };
      const res = createMockRes();
      let nextCalled = false;
      await authMiddleware(req, res, () => { nextCalled = true; });
      assert.equal(nextCalled, true);
      assert.equal(req.user?.authId, "sub-uuid-9999");
    } finally {
      User.findOne = origFindOne;
    }
  });

  it("userMiddleware should reject missing token with 401", async () => {
    const req = { headers: {} };
    const res = createMockRes();
    let nextCalled = false;
    await userMiddleware(req, res, () => { nextCalled = true; });
    assert.equal(res.statusCode, 401);
    assert.equal(res.jsonData?.message, "No token provided");
    assert.equal(nextCalled, false);
  });

  it("userMiddleware should decode valid token and set req.user without DB lookup", async () => {
    const token = jwt.sign({ authId: "test-fast", role: "USER" }, JWT_SECRET, { expiresIn: "1h" });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createMockRes();
    let nextCalled = false;
    await userMiddleware(req, res, () => { nextCalled = true; });
    assert.equal(nextCalled, true);
    assert.equal(req.user?.authId, "test-fast");
    assert.equal(req.user?.role, "USER");
  });

  it("userRoutes should register /session, /refresh-token, and /logout endpoints", () => {
    const routes = userRoutes.stack
      .filter((layer) => layer.route)
      .map((layer) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));

    assert.ok(routes.some((r) => r.path === "/session" && r.methods.includes("get")), "Expected GET /session");
    assert.ok(routes.some((r) => r.path === "/refresh-token" && r.methods.includes("post")), "Expected POST /refresh-token");
    assert.ok(routes.some((r) => r.path === "/logout" && r.methods.includes("post")), "Expected POST /logout");
  });

  it("getSession should return session details for authenticated user", async () => {
    const origFindById = User.findById;
    const testUserId = new mongoose.Types.ObjectId();
    const mockUser = { _id: testUserId, authId: "user-session-123", email: "sess@renote.com" };
    User.findById = () => ({ select: () => Promise.resolve(mockUser) });

    try {
      const req = {
        user: { _id: testUserId, authId: "user-session-123", roleCode: "USER", exp: 1234567890 },
      };
      const res = createMockRes();
      await getSession(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData?.success, true);
      assert.equal(res.jsonData?.session?.valid, true);
      assert.equal(res.jsonData?.session?.authId, "user-session-123");
    } finally {
      User.findById = origFindById;
    }
  });

  it("getSession should reject with 401 when req.user is missing", async () => {
    const req = {};
    const res = createMockRes();
    await getSession(req, res);
    assert.equal(res.statusCode, 401);
    assert.equal(res.jsonData?.success, false);
    assert.match(res.jsonData?.message, /no active session/i);
  });

  it("getSession should return 404 when user is marked deleted", async () => {
    const origFindById = User.findById;
    const testUserId = new mongoose.Types.ObjectId();
    const mockDeletedUser = { _id: testUserId, authId: "del-user-123", isDeleted: true };
    User.findById = () => ({ select: () => Promise.resolve(mockDeletedUser) });

    try {
      const req = { user: { _id: testUserId, authId: "del-user-123" } };
      const res = createMockRes();
      await getSession(req, res);
      assert.equal(res.statusCode, 404);
      assert.equal(res.jsonData?.success, false);
      assert.match(res.jsonData?.message, /user account not found/i);
    } finally {
      User.findById = origFindById;
    }
  });

  it("getSession should resolve user when req.user contains sub or userId", async () => {
    const origFindOne = User.findOne;
    const mockUser = { authId: "sub-claim-user-456", firstName: "SubUser", isDeleted: false };
    User.findOne = () => ({ select: () => Promise.resolve(mockUser) });

    try {
      const req = { user: { sub: "sub-claim-user-456", role: "ADMIN" } };
      const res = createMockRes();
      await getSession(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData?.success, true);
      assert.equal(res.jsonData?.session?.authId, "sub-claim-user-456");
      assert.equal(res.jsonData?.session?.role, "ADMIN");
    } finally {
      User.findOne = origFindOne;
    }
  });

  it("refreshUserToken should reject request when refreshToken is missing", async () => {
    const req = { body: {} };
    const res = createMockRes();
    await refreshUserToken(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.jsonData?.success, false);
    assert.match(res.jsonData?.message, /refresh token is required/i);
  });

  it("logoutUser should return 200 and success status", async () => {
    const req = { body: { refreshToken: "mock_refresh_token" } };
    const res = createMockRes();
    await logoutUser(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.jsonData?.success, true);
    assert.match(res.jsonData?.message, /logged out/i);
  });
});

describe("8. Poster Update & Editing Lifecycle", () => {
  const createMockRes = () => {
    const res = {
      statusCode: 200,
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      },
    };
    return res;
  };

  it("updatePoster should return 404 when poster is not found", async () => {
    const origFindById = Poster.findById;
    const origFindOne = Poster.findOne;
    Poster.findById = async () => null;
    Poster.findOne = async () => null;
    try {
      const req = {
        params: { id: "nonexistent-poster-id" },
        body: { poster_title: "My Updated Poster", product_name: "Sneakers" },
      };
      const res = createMockRes();
      await updatePoster(req, res);
      assert.equal(res.statusCode, 404);
      assert.match(res.jsonData?.error, /not found/i);
    } finally {
      Poster.findById = origFindById;
      Poster.findOne = origFindOne;
    }
  });

  it("updatePoster should return 400 when validation fails (missing title or name)", async () => {
    const mockPoster = {
      _id: new mongoose.Types.ObjectId(),
      posterId: "POS-100",
      product_image: "/uploads/img.png",
      user_id: new mongoose.Types.ObjectId(),
    };
    const req = {
      params: { id: mockPoster._id.toString() },
      posterDoc: mockPoster,
      body: { poster_title: "", product_name: "" },
    };
    const res = createMockRes();
    await updatePoster(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.jsonData?.error, /validation failed/i);
  });

  it("updatePoster should successfully save text, images, pricing, stickers, and template", async () => {
    const mockPosterId = new mongoose.Types.ObjectId();
    const mockPoster = {
      _id: mockPosterId,
      posterId: "POS-100",
      poster_title: "Original Title",
      product_name: "Original Name",
      product_description: "Old description",
      product_price: 100,
      product_image: "/uploads/old-image.png",
      company_logo: "/uploads/old-logo.png",
      template: "frame1",
      templateCategory: "Classic",
      colorThemeId: "flame-orange",
      bgTypeId: "clean-white",
      user_id: new mongoose.Types.ObjectId(),
      stickers: [],
    };

    const stickersPayload = [
      { id: "stk-1", stickerId: "sale-50", x: 20, y: 30, width: 105, rotation: 10 },
    ];

    let capturedUpdateId = null;
    let capturedUpdateData = null;
    const origFindByIdAndUpdate = Poster.findByIdAndUpdate;
    Poster.findByIdAndUpdate = async (id, data, options) => {
      capturedUpdateId = id;
      capturedUpdateData = data;
      return {
        ...mockPoster,
        ...data,
      };
    };

    try {
      const req = {
        params: { id: "POS-100" },
        posterDoc: mockPoster,
        body: {
          poster_title: "Updated Spring Collection",
          product_name: "Running Shoes",
          product_description: "Lightweight and comfortable",
          product_price: 199,
          product_image: "/uploads/new-shoe.png",
          company_logo: "/uploads/new-logo.png",
          template: "frame15",
          templateCategory: "Premium",
          colorThemeId: "electric-blue",
          bgTypeId: "dark-mesh",
          customBgColor: "#112233",
          fontFamilyId: "sans",
          borderThickness: 6,
          stickers: stickersPayload,
        },
      };
      const res = createMockRes();
      await updatePoster(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData?.message, "Poster updated successfully");
      assert.equal(String(capturedUpdateId), String(mockPosterId));
      assert.equal(capturedUpdateData.poster_title, "Updated Spring Collection");
      assert.equal(capturedUpdateData.product_name, "Running Shoes");
      assert.equal(capturedUpdateData.product_price, 199);
      assert.equal(capturedUpdateData.product_image, "/uploads/new-shoe.png");
      assert.equal(capturedUpdateData.company_logo, "/uploads/new-logo.png");
      assert.equal(capturedUpdateData.template, "frame15");
      assert.equal(capturedUpdateData.templateCategory, "Premium");
      assert.equal(capturedUpdateData.colorThemeId, "electric-blue");
      assert.equal(capturedUpdateData.bgTypeId, "dark-mesh");
      assert.equal(capturedUpdateData.customBgColor, "#112233");
      assert.equal(capturedUpdateData.borderThickness, 6);
      assert.deepEqual(capturedUpdateData.stickers, stickersPayload);
      assert.ok(capturedUpdateData.updatedAt instanceof Date, "Expected updatedAt to be updated to a Date instance");
      assert.equal(capturedUpdateData.createdAt, undefined, "Expected original createdAt to remain untouched in updateData");
    } finally {
      Poster.findByIdAndUpdate = origFindByIdAndUpdate;
    }
  });

  it("duplicatePoster should return 404 when original poster is not found", async () => {
    const origFindById = Poster.findById;
    const origFindOne = Poster.findOne;
    Poster.findById = async () => null;
    Poster.findOne = async () => null;

    try {
      const req = {
        params: { id: "nonexistent-id" },
      };
      const res = createMockRes();
      await duplicatePoster(req, res);
      assert.equal(res.statusCode, 404);
      assert.match(res.jsonData?.error, /not found/i);
    } finally {
      Poster.findById = origFindById;
      Poster.findOne = origFindOne;
    }
  });

  it("duplicatePoster should create an isolated copy with unique ID, reset marketplace, and retain content", async () => {
    const origPosterId = new mongoose.Types.ObjectId();
    const origUserId = new mongoose.Types.ObjectId();
    const targetUserId = new mongoose.Types.ObjectId();
    const originalDoc = {
      _id: origPosterId,
      posterId: "POS-5",
      poster_title: "Summer Collection",
      poster_name: "Summer Collection",
      product_name: "Leather Sandals",
      product_description: "Comfortable footwear",
      product_price: 150,
      product_image: "/uploads/sandals.png",
      company_logo: "/uploads/brand.png",
      template: "frame2",
      user_id: origUserId,
      company_id: new mongoose.Types.ObjectId(),
      isPublishedToMarketplace: true,
      shareableLinkToken: "active-token-123",
      viewsCount: 42,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-01T00:00:00Z"),
      toObject: function () { return { ...this }; },
    };

    const origFindById = Poster.findById;
    const origFind = Poster.find;
    const origPrototypeSave = Poster.prototype.save;
    const origCompanyFindOne = Company.findOne;

    let savedPosterDoc = null;
    Poster.findById = async () => originalDoc;
    Poster.find = async () => [{ posterId: "POS-10" }]; // max is 10, so duplicate should be POS-11
    Poster.prototype.save = async function () {
      savedPosterDoc = this;
      return this;
    };
    Company.findOne = () => ({
      sort: () => Promise.resolve(null),
      then: (fn) => Promise.resolve(null).then(fn),
    });

    try {
      const req = {
        params: { id: origPosterId.toString() },
        user: { _id: targetUserId },
      };
      const res = createMockRes();
      await duplicatePoster(req, res);

      assert.equal(res.statusCode, 201);
      assert.equal(res.jsonData?.message, "Poster duplicated successfully");
      const duplicated = res.jsonData?.poster;
      assert.ok(duplicated);
      assert.equal(duplicated.posterId, "POS-11");
      assert.equal(duplicated.product_name, "Leather Sandals");
      assert.equal(duplicated.product_price, 150);
      assert.equal(duplicated.product_image, "/uploads/sandals.png");
      assert.equal(duplicated.poster_title, "Summer Collection (Copy)");
      assert.equal(String(duplicated.user_id), String(targetUserId));
      assert.equal(duplicated.isPublishedToMarketplace, false);
      assert.equal(duplicated.shareableLinkToken, null);
      assert.equal(duplicated.viewsCount, 0);
      assert.ok(duplicated.createdAt instanceof Date || typeof duplicated.createdAt === "string");
      assert.ok(duplicated.updatedAt instanceof Date || typeof duplicated.updatedAt === "string");
    } finally {
      Poster.findById = origFindById;
      Poster.find = origFind;
      Poster.prototype.save = origPrototypeSave;
      Company.findOne = origCompanyFindOne;
    }
  });

  it("validatePosterInput should reject negative prices and unnecessary leading zeros", () => {
    const baseBody = {
      poster_title: "Valid Title",
      product_name: "Valid Product",
      product_image: "/uploads/img.png",
    };

    // Negative price
    const negRes = validatePosterInput({ ...baseBody, product_price: -50 }, null);
    assert.ok(negRes.errors.includes("Price cannot be negative"));

    // Leading zeros
    const zeroRes = validatePosterInput({ ...baseBody, product_price: "000500" }, null);
    assert.ok(zeroRes.errors.includes("Price cannot have leading zeros"));

    const zeroRes2 = validatePosterInput({ ...baseBody, product_price: "050" }, null);
    assert.ok(zeroRes2.errors.includes("Price cannot have leading zeros"));

    // Exceeding max price
    const maxRes = validatePosterInput({ ...baseBody, product_price: 100000000 }, null);
    assert.ok(maxRes.errors.some(e => e.includes("Maximum price limit")));

    // Valid price
    const validRes = validatePosterInput({ ...baseBody, product_price: 499 }, null);
    assert.equal(validRes.errors.length, 0);
  });
});


