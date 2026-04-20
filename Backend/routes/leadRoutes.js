import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  addLeadNote,
  completeLeadFollowUp,
  createLead,
  getLeads,
  getLeadStats,
  updateLead,
  deleteLead
} from "../controllers/leadController.js";

const router = express.Router();

router.post("/", authMiddleware, createLead);
router.get("/", authMiddleware, getLeads);
router.get("/stats", authMiddleware, getLeadStats);
router.post("/:id/notes", authMiddleware, addLeadNote);
router.post("/:id/follow-up-complete", authMiddleware, completeLeadFollowUp);
router.put("/:id", authMiddleware, updateLead);
router.delete("/:id", authMiddleware, deleteLead);

export default router;
