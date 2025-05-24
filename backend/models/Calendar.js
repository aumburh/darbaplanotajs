const mongoose = require('mongoose');

const CalendarSchema = new mongoose.Schema({
    name: String,
    color: String,
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sharedWith: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    permissions: {
        edit: Boolean,
        delete: Boolean,
        rename: Boolean,
        addEvent: Boolean,
        deleteEvent: Boolean,
        editEvent: Boolean
    }
}],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Calendar', CalendarSchema);