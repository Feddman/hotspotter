// State management
const state = {
    image: null,
    hotspots: [],
    isDrawing: false,
    currentPolygon: [],
    editingHotspotId: null
};

// DOM elements
const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
const imageUpload = document.getElementById('imageUpload');
const clearCanvasBtn = document.getElementById('clearCanvas');
const toggleDrawingBtn = document.getElementById('toggleDrawing');
const drawingStatus = document.getElementById('drawingStatus');
const hotspotForm = document.getElementById('hotspotForm');
const hotspotNameInput = document.getElementById('hotspotName');
const hotspotDescInput = document.getElementById('hotspotDescription');
const hotspotColorInput = document.getElementById('hotspotColor');
const cancelHotspotBtn = document.getElementById('cancelHotspot');
const hotspotsContainer = document.getElementById('hotspotsContainer');
const instructions = document.getElementById('instructions');
const downloadImageBtn = document.getElementById('downloadImage');
const exportEmbedBtn = document.getElementById('exportEmbed');
const embedModal = document.getElementById('embedModal');
const closeModalBtn = document.getElementById('closeModal');
const embedCodeTextarea = document.getElementById('embedCode');
const copyCodeBtn = document.getElementById('copyCode');
const embedPreview = document.getElementById('embedPreview');
const tabButtons = document.querySelectorAll('.tab-btn');

// Initialize
loadFromLocalStorage();

// Event listeners
imageUpload.addEventListener('change', handleImageUpload);
clearCanvasBtn.addEventListener('click', clearCanvas);
toggleDrawingBtn.addEventListener('click', toggleDrawing);
hotspotForm.addEventListener('submit', saveHotspot);
cancelHotspotBtn.addEventListener('click', cancelHotspot);
canvas.addEventListener('click', handleCanvasClick);
canvas.addEventListener('mousemove', handleCanvasMouseMove);
downloadImageBtn.addEventListener('click', downloadImage);
exportEmbedBtn.addEventListener('click', showEmbedModal);
closeModalBtn.addEventListener('click', closeEmbedModal);
copyCodeBtn.addEventListener('click', copyEmbedCode);
tabButtons.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// Close modal when clicking outside
embedModal.addEventListener('click', (e) => {
    if (e.target === embedModal) {
        closeEmbedModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && embedModal.classList.contains('show')) {
        closeEmbedModal();
    }
});

// Image upload handler
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            state.image = img;
            resizeCanvas();
            drawCanvas();
            instructions.style.display = 'none';
            saveToLocalStorage();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// Canvas management
function resizeCanvas() {
    if (!state.image) return;

    const maxWidth = canvas.parentElement.clientWidth - 40;
    const maxHeight = window.innerHeight * 0.8;

    let width = state.image.width;
    let height = state.image.height;

    if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
    }
    if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
    }

    canvas.width = width;
    canvas.height = height;
}

function drawCanvas() {
    if (!state.image) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(state.image, 0, 0, canvas.width, canvas.height);

    // Draw all hotspots
    state.hotspots.forEach((hotspot, index) => {
        drawPolygon(hotspot.points, hotspot.color, index === state.editingHotspotId);
    });

    // Draw current polygon being drawn
    if (state.currentPolygon.length > 0) {
        drawPolygon(state.currentPolygon, hotspotColorInput.value, false, true);
    }
}

function drawPolygon(points, color, isEditing = false, isDrawing = false) {
    if (points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }

    if (isDrawing && points.length > 2) {
        ctx.closePath();
    }

    // Fill
    ctx.fillStyle = color + '40'; // 40 = 25% opacity in hex
    ctx.fill();

    // Stroke
    ctx.strokeStyle = color;
    ctx.lineWidth = isEditing ? 3 : 2;
    ctx.stroke();

    // Draw points
    points.forEach((point, index) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
}

// Drawing mode
function toggleDrawing() {
    state.isDrawing = !state.isDrawing;
    
    if (state.isDrawing) {
        state.currentPolygon = [];
        state.editingHotspotId = null;
        toggleDrawingBtn.textContent = 'Stop met Tekenen';
        toggleDrawingBtn.classList.remove('btn-primary');
        toggleDrawingBtn.classList.add('btn-danger');
        drawingStatus.textContent = 'Tekenen modus: Klik om punten toe te voegen';
        drawingStatus.style.background = '#d4edda';
        drawingStatus.style.color = '#155724';
        canvas.style.cursor = 'crosshair';
        hotspotForm.style.display = 'none';
    } else {
        toggleDrawingBtn.textContent = 'Start met Tekenen';
        toggleDrawingBtn.classList.remove('btn-danger');
        toggleDrawingBtn.classList.add('btn-primary');
        drawingStatus.textContent = 'Niet aan het tekenen';
        drawingStatus.style.background = '#e9ecef';
        drawingStatus.style.color = '#495057';
        canvas.style.cursor = 'default';
        state.currentPolygon = [];
        drawCanvas();
    }
}

// Canvas interaction
function handleCanvasClick(e) {
    if (!state.isDrawing || !state.image) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    state.currentPolygon.push({ x, y });
    drawCanvas();

    // If polygon is closed (clicked near first point), show form
    if (state.currentPolygon.length > 2) {
        const firstPoint = state.currentPolygon[0];
        const distance = Math.sqrt(
            Math.pow(x - firstPoint.x, 2) + Math.pow(y - firstPoint.y, 2)
        );
        if (distance < 10) {
            // Close polygon
            hotspotForm.style.display = 'block';
            hotspotNameInput.focus();
        }
    }
}

function handleCanvasMouseMove(e) {
    if (!state.isDrawing || !state.image || state.currentPolygon.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Redraw with preview line
    drawCanvas();
    
    if (state.currentPolygon.length > 0) {
        const lastPoint = state.currentPolygon[state.currentPolygon.length - 1];
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(x, y);
        ctx.strokeStyle = hotspotColorInput.value;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

// Hotspot management
function saveHotspot(e) {
    e.preventDefault();

    if (state.currentPolygon.length < 3) {
        alert('Teken minimaal 3 punten om een hotspot te maken');
        return;
    }

    const hotspot = {
        id: state.editingHotspotId !== null ? state.editingHotspotId : Date.now(),
        name: hotspotNameInput.value,
        description: hotspotDescInput.value,
        color: hotspotColorInput.value,
        points: [...state.currentPolygon]
    };

    if (state.editingHotspotId !== null) {
        // Update existing
        const index = state.hotspots.findIndex(h => h.id === state.editingHotspotId);
        if (index !== -1) {
            state.hotspots[index] = hotspot;
        }
        state.editingHotspotId = null;
    } else {
        // Add new
        state.hotspots.push(hotspot);
    }

    // Reset form
    state.currentPolygon = [];
    hotspotForm.reset();
    hotspotColorInput.value = '#ff0000';
    hotspotForm.style.display = 'none';
    state.isDrawing = false;
    toggleDrawingBtn.textContent = 'Start Drawing';
    toggleDrawingBtn.classList.remove('btn-danger');
    toggleDrawingBtn.classList.add('btn-primary');
    drawingStatus.textContent = 'Not drawing';
    drawingStatus.style.background = '#e9ecef';
    drawingStatus.style.color = '#495057';
    canvas.style.cursor = 'default';

    drawCanvas();
    renderHotspots();
    saveToLocalStorage();
}

function cancelHotspot() {
    state.currentPolygon = [];
    state.editingHotspotId = null;
    hotspotForm.reset();
    hotspotColorInput.value = '#ff0000';
    hotspotForm.style.display = 'none';
    state.isDrawing = false;
    toggleDrawingBtn.textContent = 'Start Drawing';
    toggleDrawingBtn.classList.remove('btn-danger');
    toggleDrawingBtn.classList.add('btn-primary');
    drawingStatus.textContent = 'Not drawing';
    drawingStatus.style.background = '#e9ecef';
    drawingStatus.style.color = '#495057';
    canvas.style.cursor = 'default';
    drawCanvas();
}

function editHotspot(id) {
    const hotspot = state.hotspots.find(h => h.id === id);
    if (!hotspot) return;

    state.editingHotspotId = id;
    state.currentPolygon = [...hotspot.points];
    hotspotNameInput.value = hotspot.name;
    hotspotDescInput.value = hotspot.description || '';
    hotspotColorInput.value = hotspot.color;
    hotspotForm.style.display = 'block';
    drawCanvas();
}

function deleteHotspot(id) {
    if (confirm('Weet je zeker dat je deze hotspot wilt verwijderen?')) {
        state.hotspots = state.hotspots.filter(h => h.id !== id);
        drawCanvas();
        renderHotspots();
        saveToLocalStorage();
    }
}

function renderHotspots() {
    if (state.hotspots.length === 0) {
        hotspotsContainer.innerHTML = '<p class="empty-state">Nog geen hotspots. Begin met tekenen om er een te maken!</p>';
        return;
    }

    hotspotsContainer.innerHTML = state.hotspots.map(hotspot => `
        <div class="hotspot-item" style="border-left-color: ${hotspot.color}">
            <h3>${escapeHtml(hotspot.name)}</h3>
            ${hotspot.description ? `<p>${escapeHtml(hotspot.description)}</p>` : ''}
            <div class="hotspot-actions">
                <button class="btn btn-primary" onclick="editHotspot(${hotspot.id})">✏️ Bewerken</button>
                <button class="btn btn-danger" onclick="deleteHotspot(${hotspot.id})">🗑️ Verwijderen</button>
            </div>
        </div>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Canvas clearing
function clearCanvas() {
    if (confirm('Weet je zeker dat je alle hotspots wilt wissen?')) {
        state.hotspots = [];
        state.currentPolygon = [];
        state.editingHotspotId = null;
        state.isDrawing = false;
        state.image = null;
        toggleDrawingBtn.textContent = 'Start met Tekenen';
        toggleDrawingBtn.classList.remove('btn-danger');
        toggleDrawingBtn.classList.add('btn-primary');
        drawingStatus.textContent = 'Niet aan het tekenen';
        drawingStatus.style.background = '#e9ecef';
        drawingStatus.style.color = '#495057';
        canvas.style.cursor = 'default';
        hotspotForm.style.display = 'none';
        imageUpload.value = ''; // Clear the file input
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
        instructions.style.display = 'block'; // Show instructions again
        renderHotspots();
        saveToLocalStorage();
    }
}

// LocalStorage persistence
function saveToLocalStorage() {
    try {
        const data = {
            hotspots: state.hotspots,
            imageData: state.image ? state.image.src : null
        };
        localStorage.setItem('hotspotAppData', JSON.stringify(data));
    } catch (e) {
        console.error('Failed to save to localStorage:', e);
    }
}

function loadFromLocalStorage() {
    try {
        const data = localStorage.getItem('hotspotAppData');
        if (!data) return;

        const parsed = JSON.parse(data);
        
        if (parsed.hotspots) {
            state.hotspots = parsed.hotspots;
            renderHotspots();
        }

        if (parsed.imageData) {
            const img = new Image();
            img.onload = () => {
                state.image = img;
                resizeCanvas();
                drawCanvas();
                instructions.style.display = 'none';
            };
            img.src = parsed.imageData;
        }
    } catch (e) {
        console.error('Failed to load from localStorage:', e);
    }
}

// Download image with hotspots
function downloadImage() {
    if (!state.image || state.hotspots.length === 0) {
        alert('Upload eerst een afbeelding en maak minimaal één hotspot.');
        return;
    }

    // Create a temporary canvas with original image dimensions
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = state.image.width;
    tempCanvas.height = state.image.height;
    const tempCtx = tempCanvas.getContext('2d');

    // Draw the original image
    tempCtx.drawImage(state.image, 0, 0);

    // Calculate scale factors
    const scaleX = state.image.width / canvas.width;
    const scaleY = state.image.height / canvas.height;

    // Draw all hotspots scaled to original image size
    state.hotspots.forEach(hotspot => {
        drawPolygonOnCanvas(tempCtx, hotspot.points, hotspot.color, scaleX, scaleY);
    });

    // Download the image
    tempCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hotspot-image-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 'image/png');
}

function drawPolygonOnCanvas(ctx, points, color, scaleX, scaleY) {
    if (points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x * scaleX, points[0].y * scaleY);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x * scaleX, points[i].y * scaleY);
    }
    ctx.closePath();

    // Fill
    ctx.fillStyle = color + '40';
    ctx.fill();

    // Stroke
    ctx.strokeStyle = color;
    ctx.lineWidth = 2 * Math.max(scaleX, scaleY);
    ctx.stroke();
}

// Embed code generation
function showEmbedModal() {
    if (!state.image || state.hotspots.length === 0) {
        alert('Upload eerst een afbeelding en maak minimaal één hotspot.');
        return;
    }
    embedModal.classList.add('show');
    switchTab('direct');
}

function closeEmbedModal() {
    embedModal.classList.remove('show');
}

function switchTab(tabName) {
    // Update tab buttons
    tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Generate direct embed code
    const code = generateDirectEmbedCode();
    embedCodeTextarea.value = code;
}

function generateEmbedHTML() {
    // Get image as data URL
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = state.image.width;
    tempCanvas.height = state.image.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(state.image, 0, 0);
    const imageData = tempCanvas.toDataURL('image/png');

    // Calculate scale factors
    const scaleX = state.image.width / canvas.width;
    const scaleY = state.image.height / canvas.height;

    // Generate SVG with hotspots
    let svgContent = `<svg width="${state.image.width}" height="${state.image.height}" xmlns="http://www.w3.org/2000/svg">
        <image href="${imageData}" width="${state.image.width}" height="${state.image.height}"/>
    `;

    state.hotspots.forEach((hotspot, index) => {
        const scaledPoints = hotspot.points.map(p => `${p.x * scaleX},${p.y * scaleY}`).join(' ');
        const escapedName = escapeHtml(hotspot.name);
        const escapedDesc = escapeHtml(hotspot.description || '');
        svgContent += `        <polygon points="${scaledPoints}" fill="${hotspot.color}40" stroke="${hotspot.color}" stroke-width="2" data-hotspot-id="${index}" data-hotspot-name="${escapedName}" data-hotspot-desc="${escapedDesc}"/>
    `;
    });

    svgContent += `    </svg>`;

    // Generate interactive HTML
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hotspot Image</title>
    <style>
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background: #f5f5f5; }
        .hotspot-container { display: inline-block; max-width: 100%; }
        .hotspot-container svg { max-width: 100%; height: auto; display: block; }
        .hotspot-container polygon { cursor: pointer; transition: opacity 0.3s; }
        .hotspot-container polygon:hover { opacity: 0.7; }
        .hotspot-tooltip { position: absolute; background: rgba(0,0,0,0.8); color: white; padding: 10px 15px; border-radius: 6px; pointer-events: none; display: none; font-size: 14px; z-index: 1000; }
        .hotspot-tooltip.show { display: block; }
        .hotspot-tooltip h4 { margin: 0 0 5px 0; font-size: 16px; }
        .hotspot-tooltip p { margin: 0; font-size: 12px; opacity: 0.9; }
    </style>
</head>
<body>
    <div class="hotspot-container" id="hotspotContainer">
        ${svgContent}
        <div class="hotspot-tooltip" id="tooltip"></div>
    </div>
    <script>
        const tooltip = document.getElementById('tooltip');
        const polygons = document.querySelectorAll('polygon[data-hotspot-id]');

        polygons.forEach(poly => {
            poly.addEventListener('mouseenter', (e) => {
                const name = e.target.getAttribute('data-hotspot-name');
                const desc = e.target.getAttribute('data-hotspot-desc');
                tooltip.innerHTML = '<h4>' + name + '</h4>' + (desc ? '<p>' + desc + '</p>' : '');
                tooltip.classList.add('show');
            });

            poly.addEventListener('mousemove', (e) => {
                tooltip.style.left = (e.pageX + 10) + 'px';
                tooltip.style.top = (e.pageY + 10) + 'px';
            });

            poly.addEventListener('mouseleave', () => {
                tooltip.classList.remove('show');
            });
        });
    </script>
</body>
</html>`;

    return html;
}

function generateIframeCode() {
    const embedHtml = generateEmbedHTML();
    // Escape quotes for HTML attribute
    const escapedHtml = embedHtml.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    return `<iframe 
    srcdoc="${escapedHtml}" 
    width="100%" 
    height="600" 
    frameborder="0" 
    style="border: 1px solid #ddd; border-radius: 8px;">
</iframe>`;
}

function generateStandaloneHTML() {
    return generateEmbedHTML();
}

// JavaScript Widget - Most common approach for modern hotspot apps
function generateWidgetCode() {
    const hotspotData = getHotspotData();
    const imageData = getImageDataURL();
    
    const widgetScript = `<!-- Hotspot Widget - Add this to your HTML -->
<div id="hotspot-widget-${Date.now()}"></div>
<script>
(function() {
    const container = document.getElementById('hotspot-widget-${Date.now()}');
    const data = ${JSON.stringify(hotspotData)};
    const imageSrc = ${JSON.stringify(imageData)};
    
    // Create SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', data.imageWidth);
    svg.setAttribute('height', data.imageHeight);
    svg.setAttribute('viewBox', \`0 0 \${data.imageWidth} \${data.imageHeight}\`);
    svg.style.maxWidth = '100%';
    svg.style.height = 'auto';
    svg.style.display = 'block';
    
    // Add image
    const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    img.setAttribute('href', imageSrc);
    img.setAttribute('width', data.imageWidth);
    img.setAttribute('height', data.imageHeight);
    svg.appendChild(img);
    
    // Add hotspots
    const tooltip = document.createElement('div');
    tooltip.className = 'hotspot-tooltip';
    tooltip.style.cssText = 'position: absolute; background: rgba(0,0,0,0.8); color: white; padding: 10px 15px; border-radius: 6px; pointer-events: none; display: none; font-size: 14px; z-index: 1000;';
    
    data.hotspots.forEach((hotspot, index) => {
        const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const points = hotspot.points.map(p => \`\${p.x},\${p.y}\`).join(' ');
        poly.setAttribute('points', points);
        poly.setAttribute('fill', hotspot.color + '40');
        poly.setAttribute('stroke', hotspot.color);
        poly.setAttribute('stroke-width', '2');
        poly.style.cursor = 'pointer';
        poly.style.transition = 'opacity 0.3s';
        
        poly.addEventListener('mouseenter', (e) => {
            tooltip.innerHTML = '<h4 style="margin: 0 0 5px 0; font-size: 16px;">' + hotspot.name + '</h4>' + 
                (hotspot.description ? '<p style="margin: 0; font-size: 12px; opacity: 0.9;">' + hotspot.description + '</p>' : '');
            tooltip.style.display = 'block';
            poly.style.opacity = '0.7';
        });
        
        poly.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            tooltip.style.left = (e.clientX - rect.left + 10) + 'px';
            tooltip.style.top = (e.clientY - rect.top + 10) + 'px';
        });
        
        poly.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
            poly.style.opacity = '1';
        });
        
        svg.appendChild(poly);
    });
    
    container.style.position = 'relative';
    container.style.display = 'inline-block';
    container.style.maxWidth = '100%';
    container.appendChild(svg);
    container.appendChild(tooltip);
})();
</script>`;

    return widgetScript;
}

function generateWidgetPreview() {
    const hotspotData = getHotspotData();
    const imageData = getImageDataURL();
    const containerId = `hotspot-widget-preview-${Date.now()}`;
    
    // Create preview container HTML
    let html = `<div id="${containerId}" style="position: relative; display: inline-block; max-width: 100%;"></div>`;
    
    // Render preview directly using DOM (not innerHTML script)
    setTimeout(() => {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', hotspotData.imageWidth);
        svg.setAttribute('height', hotspotData.imageHeight);
        svg.setAttribute('viewBox', `0 0 ${hotspotData.imageWidth} ${hotspotData.imageHeight}`);
        svg.style.maxWidth = '100%';
        svg.style.height = 'auto';
        svg.style.display = 'block';
        
        const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        img.setAttribute('href', imageData);
        img.setAttribute('width', hotspotData.imageWidth);
        img.setAttribute('height', hotspotData.imageHeight);
        svg.appendChild(img);
        
        const tooltip = document.createElement('div');
        tooltip.style.cssText = 'position: absolute; background: rgba(0,0,0,0.8); color: white; padding: 10px 15px; border-radius: 6px; pointer-events: none; display: none; font-size: 14px; z-index: 1000;';
        
        hotspotData.hotspots.forEach((hotspot) => {
            const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            const points = hotspot.points.map(p => `${p.x},${p.y}`).join(' ');
            poly.setAttribute('points', points);
            poly.setAttribute('fill', hotspot.color + '40');
            poly.setAttribute('stroke', hotspot.color);
            poly.setAttribute('stroke-width', '2');
            poly.style.cursor = 'pointer';
            poly.style.transition = 'opacity 0.3s';
            
            poly.addEventListener('mouseenter', (e) => {
                tooltip.innerHTML = '<h4 style="margin: 0 0 5px 0; font-size: 16px;">' + escapeHtml(hotspot.name) + '</h4>' + 
                    (hotspot.description ? '<p style="margin: 0; font-size: 12px; opacity: 0.9;">' + escapeHtml(hotspot.description) + '</p>' : '');
                tooltip.style.display = 'block';
                poly.style.opacity = '0.7';
            });
            
            poly.addEventListener('mousemove', (e) => {
                const rect = container.getBoundingClientRect();
                tooltip.style.left = (e.clientX - rect.left + 10) + 'px';
                tooltip.style.top = (e.clientY - rect.top + 10) + 'px';
            });
            
            poly.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
                poly.style.opacity = '1';
            });
            
            svg.appendChild(poly);
        });
        
        container.appendChild(svg);
        container.appendChild(tooltip);
    }, 50);
    
    return html;
}

// Web Component - Modern, encapsulated approach
function generateWebComponentCode() {
    const hotspotData = getHotspotData();
    const imageData = getImageDataURL();
    
    const componentCode = `<!-- Hotspot Web Component - Add this to your HTML -->
<script>
class HotspotImage extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    
    connectedCallback() {
        const data = ${JSON.stringify(hotspotData)};
        const imageSrc = ${JSON.stringify(imageData)};
        
        this.shadowRoot.innerHTML = \`
            <style>
                :host {
                    display: inline-block;
                    position: relative;
                    max-width: 100%;
                }
                svg {
                    max-width: 100%;
                    height: auto;
                    display: block;
                }
                polygon {
                    cursor: pointer;
                    transition: opacity 0.3s;
                }
                polygon:hover {
                    opacity: 0.7;
                }
                .tooltip {
                    position: absolute;
                    background: rgba(0,0,0,0.8);
                    color: white;
                    padding: 10px 15px;
                    border-radius: 6px;
                    pointer-events: none;
                    display: none;
                    font-size: 14px;
                    z-index: 1000;
                }
                .tooltip.show {
                    display: block;
                }
                .tooltip h4 {
                    margin: 0 0 5px 0;
                    font-size: 16px;
                }
                .tooltip p {
                    margin: 0;
                    font-size: 12px;
                    opacity: 0.9;
                }
            </style>
            <div class="container">
                <svg width="\${data.imageWidth}" height="\${data.imageHeight}" viewBox="0 0 \${data.imageWidth} \${data.imageHeight}">
                    <image href="\${imageSrc}" width="\${data.imageWidth}" height="\${data.imageHeight}"/>
                    \${data.hotspots.map((h, i) => \`
                        <polygon points="\${h.points.map(p => \`\${p.x},\${p.y}\`).join(' ')}" 
                                 fill="\${h.color}40" 
                                 stroke="\${h.color}" 
                                 stroke-width="2"
                                 data-index="\${i}"/>
                    \`).join('')}
                </svg>
                <div class="tooltip" id="tooltip"></div>
            </div>
        \`;
        
        const tooltip = this.shadowRoot.getElementById('tooltip');
        const polygons = this.shadowRoot.querySelectorAll('polygon');
        
        polygons.forEach((poly, index) => {
            const hotspot = data.hotspots[index];
            poly.addEventListener('mouseenter', (e) => {
                tooltip.innerHTML = '<h4>' + hotspot.name + '</h4>' + 
                    (hotspot.description ? '<p>' + hotspot.description + '</p>' : '');
                tooltip.classList.add('show');
            });
            
            poly.addEventListener('mousemove', (e) => {
                const rect = this.getBoundingClientRect();
                tooltip.style.left = (e.clientX - rect.left + 10) + 'px';
                tooltip.style.top = (e.clientY - rect.top + 10) + 'px';
            });
            
            poly.addEventListener('mouseleave', () => {
                tooltip.classList.remove('show');
            });
        });
    }
}

customElements.define('hotspot-image', HotspotImage);
</script>

<!-- Use the component -->
<hotspot-image></hotspot-image>`;

    return componentCode;
}

function generateWebComponentPreview() {
    const hotspotData = getHotspotData();
    const imageData = getImageDataURL();
    
    // Create and register component for preview
    if (!customElements.get('hotspot-image-preview')) {
        class HotspotImagePreview extends HTMLElement {
            constructor() {
                super();
                this.attachShadow({ mode: 'open' });
            }
            
            connectedCallback() {
                const data = hotspotData;
                const imageSrc = imageData;
                
                this.shadowRoot.innerHTML = `
                    <style>
                        :host {
                            display: inline-block;
                            position: relative;
                            max-width: 100%;
                        }
                        svg {
                            max-width: 100%;
                            height: auto;
                            display: block;
                        }
                        polygon {
                            cursor: pointer;
                            transition: opacity 0.3s;
                        }
                        polygon:hover {
                            opacity: 0.7;
                        }
                        .tooltip {
                            position: absolute;
                            background: rgba(0,0,0,0.8);
                            color: white;
                            padding: 10px 15px;
                            border-radius: 6px;
                            pointer-events: none;
                            display: none;
                            font-size: 14px;
                            z-index: 1000;
                        }
                        .tooltip.show {
                            display: block;
                        }
                        .tooltip h4 {
                            margin: 0 0 5px 0;
                            font-size: 16px;
                        }
                        .tooltip p {
                            margin: 0;
                            font-size: 12px;
                            opacity: 0.9;
                        }
                    </style>
                    <div class="container">
                        <svg width="${data.imageWidth}" height="${data.imageHeight}" viewBox="0 0 ${data.imageWidth} ${data.imageHeight}">
                            <image href="${imageSrc}" width="${data.imageWidth}" height="${data.imageHeight}"/>
                            ${data.hotspots.map((h, i) => `
                                <polygon points="${h.points.map(p => `${p.x},${p.y}`).join(' ')}" 
                                         fill="${h.color}40" 
                                         stroke="${h.color}" 
                                         stroke-width="2"
                                         data-index="${i}"/>
                            `).join('')}
                        </svg>
                        <div class="tooltip" id="tooltip"></div>
                    </div>
                `;
                
                const tooltip = this.shadowRoot.getElementById('tooltip');
                const polygons = this.shadowRoot.querySelectorAll('polygon');
                
                polygons.forEach((poly, index) => {
                    const hotspot = data.hotspots[index];
                    poly.addEventListener('mouseenter', (e) => {
                        tooltip.innerHTML = '<h4>' + escapeHtml(hotspot.name) + '</h4>' + 
                            (hotspot.description ? '<p>' + escapeHtml(hotspot.description) + '</p>' : '');
                        tooltip.classList.add('show');
                    });
                    
                    poly.addEventListener('mousemove', (e) => {
                        const rect = this.getBoundingClientRect();
                        tooltip.style.left = (e.clientX - rect.left + 10) + 'px';
                        tooltip.style.top = (e.clientY - rect.top + 10) + 'px';
                    });
                    
                    poly.addEventListener('mouseleave', () => {
                        tooltip.classList.remove('show');
                    });
                });
            }
        }
        customElements.define('hotspot-image-preview', HotspotImagePreview);
    }
    
    return '<hotspot-image-preview></hotspot-image-preview>';
}

// Direct Embed - Inline script, no iframe
function generateDirectEmbedCode() {
    const hotspotData = getHotspotData();
    const imageData = getImageDataURL();
    const embedId = Date.now();
    
    const directCode = `<!-- Direct Hotspot Insluiten - Plak dit direct in je HTML -->
<div id="hotspot-direct-embed-${embedId}" style="position: relative; display: inline-block; max-width: 100%;"></div>
<script>
(function() {
    const container = document.getElementById('hotspot-direct-embed-${embedId}');
    // Prevent double rendering
    if (!container || container.hasAttribute('data-rendered')) {
        return;
    }
    container.setAttribute('data-rendered', 'true');
    
    const data = ${JSON.stringify(hotspotData)};
    const imageSrc = ${JSON.stringify(imageData)};
    // Construct SVG namespace URL to avoid auto-linking
    const svgNS = String.fromCharCode(104, 116, 116, 112) + '://' + 'www' + String.fromCharCode(46) + 'w3' + String.fromCharCode(46) + 'org' + '/2000/svg';
    
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', data.imageWidth);
    svg.setAttribute('height', data.imageHeight);
    svg.setAttribute('viewBox', '0 0 ' + data.imageWidth + ' ' + data.imageHeight);
    svg.style.maxWidth = '100%';
    svg.style.height = 'auto';
    svg.style.display = 'block';
    
    const img = document.createElementNS(svgNS, 'image');
    img.setAttribute('href', imageSrc);
    img.setAttribute('width', data.imageWidth);
    img.setAttribute('height', data.imageHeight);
    svg.appendChild(img);
    
    const tooltip = document.createElement('div');
    tooltip.style.cssText = 'position: absolute; background: rgba(0,0,0,0.85); color: #ffffff; padding: 10px 15px; border-radius: 6px; pointer-events: none; display: none; font-size: 14px; z-index: 1000; box-shadow: 0 2px 8px rgba(0,0,0,0.3);';
    
    data.hotspots.forEach(function(hotspot) {
        const poly = document.createElementNS(svgNS, 'polygon');
        const points = hotspot.points.map(function(p) { return p.x + ',' + p.y; }).join(' ');
        poly.setAttribute('points', points);
        poly.setAttribute('fill', hotspot.color + '40');
        poly.setAttribute('stroke', hotspot.color);
        poly.setAttribute('stroke-width', '2');
        poly.style.cursor = 'pointer';
        poly.style.transition = 'opacity 0.3s';
        
        poly.addEventListener('mouseenter', function(e) {
            tooltip.innerHTML = '<h4 style="margin: 0 0 5px 0; font-size: 16px; color: #ffffff; font-weight: 600;">' + hotspot.name + '</h4>' + 
                (hotspot.description ? '<p style="margin: 0; font-size: 12px; color: #f0f0f0; opacity: 1;">' + hotspot.description + '</p>' : '');
            tooltip.style.display = 'block';
            poly.style.opacity = '0.7';
        });
        
        poly.addEventListener('mousemove', function(e) {
            const rect = container.getBoundingClientRect();
            tooltip.style.left = (e.clientX - rect.left + 10) + 'px';
            tooltip.style.top = (e.clientY - rect.top + 10) + 'px';
        });
        
        poly.addEventListener('mouseleave', function() {
            tooltip.style.display = 'none';
            poly.style.opacity = '1';
        });
        
        svg.appendChild(poly);
    });
    
    container.appendChild(svg);
    container.appendChild(tooltip);
})();
</script>`;

    return directCode;
}

function generateDirectEmbedPreview() {
    // Same as widget preview
    return generateWidgetPreview();
}

// Helper functions
function getHotspotData() {
    const scaleX = state.image.width / canvas.width;
    const scaleY = state.image.height / canvas.height;
    
    return {
        imageWidth: state.image.width,
        imageHeight: state.image.height,
        hotspots: state.hotspots.map(hotspot => ({
            name: hotspot.name,
            description: hotspot.description || '',
            color: hotspot.color,
            points: hotspot.points.map(p => ({
                x: p.x * scaleX,
                y: p.y * scaleY
            }))
        }))
    };
}

function getImageDataURL() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = state.image.width;
    tempCanvas.height = state.image.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(state.image, 0, 0);
    return tempCanvas.toDataURL('image/png');
}

function copyEmbedCode() {
    embedCodeTextarea.select();
    embedCodeTextarea.setSelectionRange(0, 99999); // For mobile devices

    try {
        document.execCommand('copy');
        const originalText = copyCodeBtn.textContent;
        copyCodeBtn.textContent = '✅ Gekopieerd!';
        copyCodeBtn.style.background = '#28a745';
        setTimeout(() => {
            copyCodeBtn.textContent = originalText;
            copyCodeBtn.style.background = '';
        }, 2000);
    } catch (err) {
        // Fallback for modern browsers
        navigator.clipboard.writeText(embedCodeTextarea.value).then(() => {
            const originalText = copyCodeBtn.textContent;
            copyCodeBtn.textContent = '✅ Gekopieerd!';
            copyCodeBtn.style.background = '#28a745';
            setTimeout(() => {
                copyCodeBtn.textContent = originalText;
                copyCodeBtn.style.background = '';
            }, 2000);
        }).catch(() => {
            alert('Kopiëren mislukt. Selecteer en kopieer handmatig.');
        });
    }
}

// Make functions available globally for onclick handlers
window.editHotspot = editHotspot;
window.deleteHotspot = deleteHotspot;
