const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  sectionReference: { type: String, required: true },
  content: { type: String, required: true },
  css: { type: String },
  logicalName: { type: String } // Added logicalName field as per instructions
});

const pageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true },
  seoTitle: { type: String },
  seoDescription: { type: String },
  sections: [sectionSchema],
  website: { type: mongoose.Schema.Types.ObjectId, ref: 'Website', required: true }
}, { timestamps: true });

// Remove any existing index on slug field
pageSchema.index({ slug: 1 }, { unique: false });

// Add a compound index for slug and website
pageSchema.index({ slug: 1, website: 1 }, { unique: true });

module.exports = mongoose.model('Page', pageSchema);