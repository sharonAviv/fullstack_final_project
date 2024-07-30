const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Ticket schema
const ticketSchema = new Schema({
    game_id: {
        type: Schema.Types.ObjectId,
        ref: 'Game',
        required: true
    },
    seat_number: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['available', 'sold'],
        default: 'available'
    },
    purchaser: {
        type: String,
        required: false
    }
}, { timestamps: true });

// Create the Ticket model from the schema
const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
