const primaryInput = document.getElementById("primaryColor");
const schemeSelect = document.getElementById("schemeSelect");
const paletteDiv = document.getElementById("palette");
const canvas = document.getElementById("colorWheel");
const ctx = canvas.getContext("2d");

canvas.width = 350;
canvas.height = 350;

let currentHSL = hexToHSL(primaryInput.value);
let generatedColors = [];

drawWheel();
generatePalette();

primaryInput.addEventListener("input", () => {
    currentHSL = hexToHSL(primaryInput.value);
    generatePalette();
});

schemeSelect.addEventListener("change", generatePalette);


function drawWheel() {
    const radius = canvas.width / 2;
    ctx.clearRect(0,0,canvas.width,canvas.height);

    for (let angle = 0; angle < 360; angle++) {
        ctx.beginPath();
        ctx.moveTo(radius, radius);
        ctx.arc(radius, radius, radius,
            (angle - 1) * Math.PI / 180,
            angle * Math.PI / 180);
        ctx.closePath();
        ctx.fillStyle = `hsl(${angle},100%,50%)`;
        ctx.fill();
    }

    drawMarkers();
}


function drawMarkers() {
    const radius = canvas.width / 2;
    const markerRadius = radius - 10;

    // Draw base color marker (white ring)
    drawMarker(currentHSL.h, markerRadius, "white", 6);

    generatedColors.forEach(hsl => {
        drawMarker(hsl.h, markerRadius, "black", 4);
    });
}

function drawMarker(hue, distance, color, size) {
    const radius = canvas.width / 2;
    const angleRad = hue * Math.PI / 180;

    const x = radius + distance * Math.cos(angleRad);
    const y = radius + distance * Math.sin(angleRad);

    ctx.beginPath();
    ctx.arc(x, y, size, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
}


canvas.addEventListener("click", function(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const center = canvas.width / 2;

    const dx = x - center;
    const dy = y - center;

    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > center) return; // outside circle

    let angle = Math.atan2(dy, dx) * 180 / Math.PI;
    if (angle < 0) angle += 360;

    currentHSL.h = Math.round(angle);

    const newHex = hslToHex(currentHSL.h, currentHSL.s, currentHSL.l);
    primaryInput.value = newHex;

    generatePalette();
});


function generatePalette() {
    paletteDiv.innerHTML = "";
    generatedColors = [];

    const base = currentHSL;
    let hues = [];

    switch (schemeSelect.value) {
        case "monochromatic":
            for (let i = 20; i <= 80; i += 15)
                hues.push({ h: base.h, s: base.s, l: i });
            break;

        case "complementary":
            hues = [base,
                { h: (base.h + 180) % 360, s: base.s, l: base.l }];
            break;

        case "analogous":
            hues = [
                { h: (base.h + 330) % 360, s: base.s, l: base.l },
                base,
                { h: (base.h + 30) % 360, s: base.s, l: base.l }
            ];
            break;

        case "triadic":
            hues = [
                base,
                { h: (base.h + 120) % 360, s: base.s, l: base.l },
                { h: (base.h + 240) % 360, s: base.s, l: base.l }
            ];
            break;

        case "tetradic":
            hues = [
                base,
                { h: (base.h + 90) % 360, s: base.s, l: base.l },
                { h: (base.h + 180) % 360, s: base.s, l: base.l },
                { h: (base.h + 270) % 360, s: base.s, l: base.l }
            ];
            break;
    }

    hues.forEach(c => {
        generatedColors.push(c);

        const hex = hslToHex(c.h, c.s, c.l);

        const card = document.createElement("div");
        card.className = "color-card";
        card.style.background = hex;
        card.innerHTML = hex;

        card.onclick = () => {
            navigator.clipboard.writeText(hex);
        };

        paletteDiv.appendChild(card);
    });

    drawWheel();
}


function hexToHSL(H) {
    let r = parseInt(H.substring(1, 3), 16) / 255;
    let g = parseInt(H.substring(3, 5), 16) / 255;
    let b = parseInt(H.substring(5, 7), 16) / 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }

        h /= 6;
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}

function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;

    let c = (1 - Math.abs(2 * l - 1)) * s;
    let x = c * (1 - Math.abs((h / 60) % 2 - 1));
    let m = l - c / 2;

    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) { r = c; g = x; b = 0; }
    else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
    else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
    else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
    else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }

    r = Math.round((r + m) * 255).toString(16).padStart(2, "0");
    g = Math.round((g + m) * 255).toString(16).padStart(2, "0");
    b = Math.round((b + m) * 255).toString(16).padStart(2, "0");

    return `#${r}${g}${b}`;
}
