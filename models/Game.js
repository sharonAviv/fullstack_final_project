const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Game schema
const gameSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    venue: {
        type: String,
        required: true
    },
    teams: {
        home: {
            type: String,
            required: true
        },
        away: {
            type: String,
            required: true
        }
    },
    score: {
        home: {
            type: Number,
            default: 0
        },
        away: {
            type: Number,
            default: 0
        }
    },
    status: {
        type: String,
        enum: ['scheduled', 'ongoing', 'completed'],
        default: 'scheduled'
    }
}, { timestamps: true });

// Create the Game model from the schema
const Game = mongoose.model('Game', gameSchema);

module.exports = Game;
