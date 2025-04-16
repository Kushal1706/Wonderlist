const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const listingSchema = new Schema({
    title: {
        type: String,
        required: [true, "Title is required"],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    image: {
        url: {
            type: String,
            required: true
        },
        filename: {
            type: String,
            required: true
        }
    },
    price: {
        type: Number,
        required: true,
        min: [0, "Price cannot be negative"]
    },
    location: {
        type: String,
        required: [true, "Location is required"],
        trim: true
    },
    lat: {
        type: Number,
        required: [true, "Latitude is required"],
        validate: {
            validator: v => v >= -90 && v <= 90,
            message: "Latitude must be between -90 and 90"
        }
    },
    lng: {
        type: Number,
        required: [true, "Longitude is required"],
        validate: {
            validator: v => v >= -180 && v <= 180,
            message: "Longitude must be between -180 and 180"
        }
    },
    country: {
        type: String,
        trim: true
    },
    reviews: [{
        type: Schema.Types.ObjectId,
        ref: "Review"
    }],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
}, { timestamps: true }); // Adds createdAt and updatedAt fields

// Middleware for cascading delete
listingSchema.post("findOneAndDelete", async (listing) => {
    if (listing?.reviews?.length) {
        await Review.deleteMany({ _id: { $in: listing.reviews } });
    }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;