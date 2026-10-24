const mongoose = require('mongoose');

const deskSchema = new mongoose.Schema({
    role: { type: String, required: true, unique: true }, // 'director' or 'principal'
    name: { type: String, required: true },
    title: { type: String },
    photo: { type: String },
    message: { type: String, required: true }
});

module.exports = mongoose.model('Desk', deskSchema);