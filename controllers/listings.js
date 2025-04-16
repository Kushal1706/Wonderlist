const axios = require('axios');

const Listing = require("../models/listing");

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
}

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
}

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
    .populate({
        path: "reviews", 
        populate: {
            path: "author",
            select:"username"
        }
    })
    .populate("owner");
    if(!listing){
        req.flash("error", "Listing you requested for does not exist!");
        res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing });
    console.log(listing);
}

module.exports.createListing = async (req, res) => {
    try {
        // 1. Validate location exists
        if (!req.body.listing?.location) {
            req.flash("error", "Location is required");
            return res.redirect("/listings/new");
        }

        // 2. Geocode with error handling
        const response = await axios.get(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(req.body.listing.location)}`,
            {
                headers: { 'User-Agent': 'YourApp (contact@yourapp.com)' },
                timeout: 5000
            }
        );

        // 3. Validate coordinates
        if (!response.data?.[0]?.lat || !response.data?.[0]?.lon) {
            throw new Error("Invalid geocoding response");
        }

        const lat = parseFloat(response.data[0].lat);
        const lng = parseFloat(response.data[0].lon);

        // 4. Verify numbers are valid
        if (isNaN(lat) || isNaN(lng)) {
            throw new Error("Invalid coordinate values");
        }

        // 5. Create listing with validated data
        const newListing = new Listing({
            ...req.body.listing,
            lat: lat,
            lng: lng,
            owner: req.user._id,
            image: {
                url: req.file.path,
                filename: req.file.filename
            }
        });

        await newListing.save();
        req.flash("success", "New Listing Created!");
        res.redirect("/listings");

    } catch (err) {
        console.error("Create Listing Error:", err);
        req.flash("error", err.message || "Failed to create listing");
        res.redirect("/listings/new");
    }
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
        req.flash("error", "Listing you requested for does not exist!");
        res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload","/upload/w_250");
    res.render("listings/edit.ejs", { listing, originalImageUrl});
}

module.exports.updateListing = async (req, res) => {
    try {
        const { id } = req.params;
        const { location } = req.body.listing;

        // 1. Initialize update data with existing values
        const updateData = { ...req.body.listing };

        // 2. Only geocode if location changed
        if (location) {
            const response = await axios.get(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`,
                {
                    headers: { 'User-Agent': 'YourApp (contact@yourapp.com)' },
                    timeout: 5000
                }
            );

            // 3. Validate coordinates
            if (response.data && response.data.length > 0) {
                updateData.lat = parseFloat(response.data[0].lat);
                updateData.lng = parseFloat(response.data[0].lon);
                
                // Additional validation
                if (isNaN(updateData.lat) || isNaN(updateData.lng)) {
                    throw new Error('Invalid coordinates received from geocoding');
                }
            } else {
                throw new Error('Location not found');
            }
        }

        // 4. Handle image update if present
        if (req.file) {
            updateData.image = {
                url: req.file.path,
                filename: req.file.filename
            };
        }

        // 5. Perform the update with validated data
        const updatedListing = await Listing.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true } // Important!
        );

        if (!updatedListing) {
            throw new Error('Listing not found');
        }

        req.flash('success', 'Listing updated successfully!');
        res.redirect(`/listings/${id}`);
        
    } catch (err) {
        console.error('Update error:', err);
        req.flash('error', err.message || 'Failed to update listing');
        res.redirect(`/listings/${req.params.id}/edit`);
    }
};

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "Listing Deleted");
    res.redirect("/listings");
}