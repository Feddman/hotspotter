# Image Hotspot Editor

A web application for creating interactive polygon hotspots on images. Upload an image, draw polygon shapes to mark areas of interest, and add metadata (name, description, color) to each hotspot.

## Features

- 📁 **Image Upload**: Upload any image file (PNG, JPG, etc.)
- ✏️ **Polygon Drawing**: Click to create polygon points on the image
- 🎨 **Customizable Hotspots**: Add name, description, and color to each hotspot
- 📝 **Hotspot Management**: View, edit, and delete hotspots
- 💾 **Auto-save**: All data is automatically saved to browser's localStorage
- 💾 **Download Image**: Save the image with hotspots as a PNG file
- 📤 **Export Embed Code**: Generate embeddable HTML code for use on other websites
- 📱 **Responsive Design**: Works on desktop and mobile devices

## How to Use

1. **Upload an Image**: Click the "Upload Image" button and select an image file
2. **Start Drawing**: Click "Start Drawing" to enter drawing mode
3. **Create Polygon**: Click on the image to add points. Click near the first point to close the polygon
4. **Add Hotspot Info**: Fill in the form with:
   - Name (required)
   - Description (optional)
   - Color (pick a color for the polygon)
5. **Save Hotspot**: Click "Save Hotspot" to add it to your list
6. **Manage Hotspots**: 
   - View all hotspots in the sidebar
   - Click "Edit" to modify a hotspot
   - Click "Delete" to remove a hotspot
7. **Clear Canvas**: Use "Clear Canvas" to remove all hotspots
8. **Download & Export**: 
   - Click "Download Image" to save the image with hotspots as a PNG file
   - Click "Export Embed Code" to generate embeddable code
   - Choose from multiple embedding options:
     - **JS Widget**: Self-contained JavaScript widget (recommended - best integration)
     - **Web Component**: Modern custom HTML element (encapsulated, reusable)
     - **Direct Embed**: Inline script that renders directly (no iframe)
     - **iFrame**: Traditional iframe embedding
     - **Download HTML File**: Standalone HTML file
   - Copy the code and paste it into your website

## Technical Details

- Pure HTML, CSS, and JavaScript (no dependencies)
- Uses HTML5 Canvas for image rendering and polygon drawing
- LocalStorage for data persistence
- Responsive grid layout
- Modern UI with gradient backgrounds and smooth animations

## Browser Compatibility

Works in all modern browsers that support:
- HTML5 Canvas
- FileReader API
- LocalStorage

## File Structure

```
hotspotter/
├── index.html    # Main HTML structure
├── styles.css    # Styling and layout
├── app.js        # Application logic
└── README.md     # This file
```

## Usage Tips

- Draw at least 3 points to create a valid polygon
- Click near the first point (within 10 pixels) to close the polygon
- Hotspots are automatically saved as you create them
- The image and hotspots persist even after closing the browser
- **Export & Download**: 
  - The downloaded image maintains the original image resolution
  - Embed codes include interactive tooltips that appear on hover
  - **JS Widget** is the recommended option - it integrates seamlessly with your page's CSS and doesn't require iframes
  - **Web Component** provides encapsulation and can be reused multiple times on the same page
  - **Direct Embed** renders inline without iframe sandboxing, perfect for better performance
  - The standalone HTML file is self-contained and can be hosted anywhere
