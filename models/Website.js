const mongoose = require('mongoose');

const websiteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  context: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Page' }],
  customization: {
    targetAudience: String,
    mainGoal: String,
    uniqueSellingPoint: String,
    brandPersonality: String
  },
  header: {
    content: String,
    css: String
  },
  footer: {
    content: String,
    css: String
  }
}, { timestamps: true });

websiteSchema.methods.updateDetails = function(name, context) {
  this.name = name;
  this.context = context;
  return this.save();
};

const Website = mongoose.model('Website', websiteSchema);

module.exports = Website;