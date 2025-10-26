import fs from 'fs';

// Create a simple SVG icon
const createSVG = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#4A90E2"/>
  <text x="${size/2}" y="${size/2}" text-anchor="middle" dominant-baseline="central" 
        fill="white" font-family="Arial, sans-serif" font-weight="bold" font-size="${size * 0.6}">H</text>
</svg>`;

// Generate SVG files
const sizes = [16, 32, 48, 128];
sizes.forEach(size => {
  const svg = createSVG(size);
  fs.writeFileSync(`./icons/icon${size}.svg`, svg);
});

console.log('SVG icons generated!');