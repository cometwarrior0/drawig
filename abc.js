'use strict';

const canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d");

const pointerEvents = new Array(4);

let laste;
let curoff = 0;

let headsize = 32;
let headdist = 1;

function drawCircle() {
    if (pointerEvents.length > 4) {
        pointerEvents.splice(0, pointerEvents.length - 4);
    }

    const x0 = pointerEvents[0][0];
    const x1 = pointerEvents[1][0];
    const x2 = pointerEvents[2][0];
    const x3 = pointerEvents[3][0];

    const y0 = pointerEvents[0][1];
    const y1 = pointerEvents[1][1];
    const y2 = pointerEvents[2][1];
    const y3 = pointerEvents[3][1];

    const p0 = pointerEvents[0][2];
    const p1 = pointerEvents[1][2];
    const p2 = pointerEvents[2][2];
    const p3 = pointerEvents[3][2];

    const xl0 = x1 - x0;
    const yl0 = y1 - y0;
    const xl1 = x2 - x1;
    const yl1 = y2 - y1;
    const xl2 = x3 - x2;
    const dl2 = y3 - y2;

    const l0 = Math.sqrt(xl0 * xl0 + yl0 * yl0);
    const l1 = Math.sqrt(xl1 * xl1 + yl1 * yl1);
    const l2 = Math.sqrt(xl2 * xl2 + dl2 * dl2);

    const tl = Math.max((l0 + l1 + l2) | 0, 1);
    const itl = 1 / tl;

    let lx = cbs(0, x0, x1, x2, x3);
    let ly = cbs(0, y0, y1, y2, y3);

    for (let prog = itl; prog < 1.00001; prog += itl) {
        const cx = cbs(prog, x0, x1, x2, x3);
        const cy = cbs(prog, y0, y1, y2, y3);
        let cp = cbs(prog, p0, p1, p2, p3);
        cp *= headsize;

        const dx = cx - lx;
        const dy = cy - ly;
        const dlen = Math.sqrt(dx * dx + dy * dy);

        lx = cx;
        ly = cy;

        curoff -= dlen;
        if ((curoff + cp * headdist) < 0.1) {
            ctx.beginPath();
            ctx.arc(cx, cy, cp, 0, 6.2831853);
            ctx.fill();
            curoff = cp * headdist;
        }
    }
}

let animId = null;
function smooth() {
    if (pointerEvents[3][0] !== laste.offsetX || pointerEvents[3][1] !== laste.offsetY) {
        pointerEvents.push([laste.offsetX, laste.offsetY, laste.pressure]);
        drawCircle();
    }
}

function handlePointerMove(e) {
    laste = e;
    animId = requestAnimationFrame(smooth);
}

addEventListener("pointerdown", (e) => {
    curoff = Number.NEGATIVE_INFINITY;
    pointerEvents.fill([e.offsetX, e.offsetY, e.pressure]);
    handlePointerMove(e);

    if (animId === null) {
        animId = requestAnimationFrame(smooth);
    }

    addEventListener("pointermove", handlePointerMove);
});
addEventListener("pointerup", (e) => {
    cancelAnimationFrame(animId);
    animId = null;
    removeEventListener("pointermove", handlePointerMove);
    smooth();
});

function cbs(t, a, b = a, c = b, d = c) {
    let tt = t * t;
    return (a + 4 * b + c
        + 3 * (t * (-a + c)
            + tt * (a - b - b + c))
        + tt * t * (-a + 3 * (b - c) + d)) * 0.1666666666666666666666667;
}

function cubicBezier(t, a, b, c, d) {
    let tt = t * t;
    return a
        + t * 3 * (-a + b)
        + tt * 3 * (a - 2 * b + c)
        + tt * t * (-a + 3 * (b - c) + d);
}

function lerp(t, a, b) {
    return a + t * (b - a);
}

const fpsDiv = document.createElement('div');
fpsDiv.style.position = 'fixed';
fpsDiv.style.top = '0';
fpsDiv.style.left = '0';
fpsDiv.style.pointerEvents = 'none'; // Ensure it doesn't interact with other elements
fpsDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
fpsDiv.style.color = 'white';
fpsDiv.style.opacity = '0.75';
fpsDiv.style.fontSize = '2rem';
fpsDiv.style.padding = '5px';
fpsDiv.style.fontFamily = 'monospace';
fpsDiv.style.zIndex = '9999'; // Place it above all other elements
fpsDiv.innerText = 'FPS: 0';
document.body.appendChild(fpsDiv);

let lastTime = 0;
let frameCount = 0;
let fps = 0;

function updateFPS(timestamp) {
    if (!lastTime) lastTime = timestamp; // Initialize lastTime

    const deltaTime = timestamp - lastTime; // Time since last frame
    frameCount++;

    if (deltaTime >= 1000) { // Update FPS every second
        fps = frameCount;
        frameCount = 0;
        lastTime = timestamp;

        fpsDiv.innerText = `FPS: ${fps}`; // Update div content
    }

    requestAnimationFrame(updateFPS); // Request the next frame
}

requestAnimationFrame(updateFPS); // Start the loop