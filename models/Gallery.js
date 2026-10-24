const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
    category: { type: String, default: 'General' }, // Sports, Cultural, Exam, Lab etc.
    uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Gallery', gallerySchema);