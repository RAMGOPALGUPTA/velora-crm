import mongoose from "mongoose";

const leadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ""
  },
  phone: {
    type: String,
    trim: true,
    default: ""
  },
  status: {
    type: String,
    enum: ["new", "contacted", "qualified", "negotiation", "closed"],
    default: "new"
  },
  source: {
    type: String,
    trim: true,
    default: ""
  },
  company: {
    type: String,
    trim: true,
    default: ""
  },
  dealValue: {
    type: Number,
    default: 0,
    min: 0
  },
  nextFollowUpAt: {
    type: Date,
    default: null
  },
  lastContactedAt: {
    type: Date,
    default: null
  },
  score: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  scoreBand: {
    type: String,
    enum: ["cold", "warm", "hot"],
    default: "cold"
  },
  activities: [{
    type: {
      type: String,
      enum: ["created", "note", "status_changed", "follow_up_completed", "updated"],
      default: "note"
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    createdByName: {
      type: String,
      default: "System"
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }]
}, { timestamps: true });

const Lead = mongoose.model("Lead", leadSchema);

export default Lead;
