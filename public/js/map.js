    // Wait for DOM to be fully loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize the small map
        const map = L.map('small-map').setView([51.505, -0.09], 13);
        
        // Add tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);
        
        // Add marker
        L.marker([51.505, -0.09]).addTo(map)
            .bindPopup("Location of this listing");
            
        // Optional: Disable dragging and zoom on small map
        map.touchZoom.disable();
        map.doubleClickZoom.disable();
        map.scrollWheelZoom.disable();
        map.dragging.disable();
    });