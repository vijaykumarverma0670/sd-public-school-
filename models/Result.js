const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
    studentName: { type: String, required: true },
    rollNo: { type: String, required: true },
    className: { type: String, required: true },
    section: { type: String, default: 'A' },
    fatherName: { type: String },
    dob: { type: String },
    session: { type: String, default: '2025-2026' },
    subjects: [{
        name: String,
        total: Number,
        obtained: Number
    }],
    totalMarks: Number,
    percentage: Number,
    grade: String,
    status: { type: String, default: 'PASS' }
});

module.exports = mongoose.model('Result', resultSchema);