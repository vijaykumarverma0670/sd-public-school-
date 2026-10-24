const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
    studentName: { type: String, required: true },
    parentName: { type: String, required: true },
    phone: { type: String, required: true },
    targetClass: { type: String, required: true },
    message: { type: String },
    status: { type: String, default: 'New' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Inquiry', inquirySchema);