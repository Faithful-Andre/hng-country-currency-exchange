// src/services/imageGenerator.js
const { createCanvas } = require('canvas');
const fs = require('fs/promises');
const path = require('path');

const IMAGE_PATH = path.join(__dirname, '..', '..', 'cache', 'summary.png');

const ensureCacheDir = async () => {
    await fs.mkdir(path.dirname(IMAGE_PATH), { recursive: true });
};

exports.generateSummaryImage = async (totalCountries, topCountries, lastRefreshedAt) => {
    await ensureCacheDir();

    const width = 800;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Drawing the image
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#333';
    ctx.font = '30px Impact';
    ctx.fillText('HNG Country Cache Summary', 50, 50);

    ctx.font = '24px Arial';
    ctx.fillStyle = '#007bff';
    ctx.fillText(`Total Countries Cached: ${totalCountries}`, 50, 100);

    const dateStr = new Date(lastRefreshedAt).toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    ctx.font = '18px Arial';
    ctx.fillStyle = '#555';
    ctx.fillText(`Last Refreshed: ${dateStr}`, 50, 140);
    
    ctx.font = '24px Impact';
    ctx.fillStyle = '#333';
    ctx.fillText('Top 5 GDP', 50, 200);

    ctx.font = '18px Arial';
    let y = 230;
    topCountries.forEach((country, index) => {
        // Format GDP for display
        const gdp = country.estimated_gdp 
            ? new Intl.NumberFormat('en-US', { notation: 'compact', style: 'currency', currency: 'USD', maximumFractionDigits: 1 }).format(country.estimated_gdp) 
            : 'N/A';
        ctx.fillText(`${index + 1}. ${country.name}: ${gdp}`, 60, y);
        y += 30;
    });

    // Save the file
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(IMAGE_PATH, buffer);
};

// CRITICAL: Endpoint to serve the image (Fixes Test 6)
exports.serveSummaryImage = async (req, res) => {
    try {
        // Check if the file exists using fs.access
        await fs.access(IMAGE_PATH); 
        
        // Serve the image file directly from disk
        res.sendFile(IMAGE_PATH); 
    } catch (error) {
        // File does not exist: return 404 JSON error
        res.status(404).json({ "error": "Summary image not found" });
    }
};