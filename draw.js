"use strict";
const canvas = document.createElement('canvas');
canvas.style.position = "absolute";
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const canvascomp = document.createElement('canvas');
canvascomp.style.position = "absolute";
canvascomp.width = window.innerWidth;
;
canvascomp.height = window.innerHeight;
document.body.appendChild(canvascomp);
const ctxcomp = canvascomp.getContext("2d", { willReadFrequently: true });
const canvasol = document.createElement('canvas');
canvasol.style.position = "absolute";
canvasol.width = window.innerWidth;
;
canvasol.height = window.innerHeight;
document.body.appendChild(canvasol);
const ctxol = canvasol.getContext("2d", { willReadFrequently: true });
const activePointers = new Set();
const pointerEvents = [];
let laste;
let curoff = 0.0;
let headsize = 10.0;
let headdist = 0.1;
function alphaComparison(curCTX, x, y, r, color = "rgb(0,0,0)") {
    ctxcomp.fillStyle = color;
    ctxcomp.globalAlpha = r / 10;
    ctxcomp.beginPath();
    ctxcomp.arc(x, y, r, 0, 6.2831853);
    ctxcomp.fill();
    const x0 = Math.round(x - r) - 1;
    const y0 = Math.round(y - r) - 1;
    const rxy = Math.round(r * 2) + 1;
    const cmpdata = ctxcomp.getImageData(x0, y0, rxy, rxy);
    const newdata = cmpdata.data;
    let curdata = curCTX.getImageData(x0, y0, rxy, rxy);
    let olddata = curdata.data;
    for (let i = 3; i < olddata.length; i += 4) {
        // overwrite the old data if new data's alpha value is bigger
        if (olddata[i] > newdata[i])
            continue;
        olddata[i - 3] = newdata[i - 3];
        olddata[i - 2] = newdata[i - 2];
        olddata[i - 1] = newdata[i - 1];
        olddata[i] = newdata[i];
    }
    curCTX.putImageData(curdata, x0, y0);
    ctxcomp.clearRect(0, 0, canvascomp.width, canvascomp.height);
}
function drawCircle(pointEvts, curCTX, coff = curoff, color = "rgb(0,0,0)") {
    curCTX.fillStyle = color;
    if (pointEvts.length > 4) {
        pointEvts.splice(0, pointEvts.length - 4);
    }
    else if (pointEvts.length < 4) {
        while (pointEvts.length < 4)
            pointEvts.push(pointEvts[pointEvts.length - 1]);
    }
    const x0 = pointEvts[0][0];
    const x1 = pointEvts[1][0];
    const x2 = pointEvts[2][0];
    const x3 = pointEvts[3][0];
    const y0 = pointEvts[0][1];
    const y1 = pointEvts[1][1];
    const y2 = pointEvts[2][1];
    const y3 = pointEvts[3][1];
    const p0 = pointEvts[0][2];
    const p1 = pointEvts[1][2];
    const p2 = pointEvts[2][2];
    const p3 = pointEvts[3][2];
    const xl0 = x1 - x0;
    const xl1 = x2 - x1;
    const xl2 = x3 - x2;
    const yl0 = y1 - y0;
    const yl1 = y2 - y1;
    const yl2 = y3 - y2;
    const l0 = Math.sqrt(xl0 * xl0 + yl0 * yl0);
    const l1 = Math.sqrt(xl1 * xl1 + yl1 * yl1);
    const l2 = Math.sqrt(xl2 * xl2 + yl2 * yl2);
    // const avgPrs = (p0 + p1 + p2+ p3);
    // const testmultipler = clamp(2/(avgPrs*headsize*headdist), 0.25, 4);
    // console.log(testmultipler)
    const tl = (((l0 + l1 + l2) * 2 + 1) | 0);
    const itl = 1 / tl;
    let lx = cbs(0, x0, x1, x2, x3);
    let ly = cbs(0, y0, y1, y2, y3);
    // ct.strokeStyle = "red";
    // ct.beginPath();
    // ct.arc(x3, y3, 50, 0, 2 * Math.PI);
    // ct.stroke();
    // ct.fillStyle = "black";
    for (let prog = itl; prog < 1.00001; prog += itl) {
        const cx = cbs(prog, x0, x1, x2, x3);
        const cy = cbs(prog, y0, y1, y2, y3);
        let cp = cbs(prog, p0, p1, p2, p3);
        cp *= headsize;
        const dx = cx - lx;
        const dy = cy - ly;
        const dlen = Math.hypot(dx, dy);
        lx = cx;
        ly = cy;
        coff -= dlen;
        if (cp <= 0)
            continue;
        if ((coff + cp * headdist) <= 0) {
            // curCTX.globalCompositeOperation = "destination-over";
            curCTX.globalAlpha = cp / headsize * 0.125;
            curCTX.beginPath();
            curCTX.arc(cx, cy, cp, 0, 6.2831853);
            curCTX.fill();
            // alphaComparison(curCTX, cx, cy, cp, color);
            coff += Math.max(2 * cp * headdist, dlen); // add dlen if bigger than headsize
        }
    }
    return coff;
}
function smooth() {
    const coalescedEvents = laste.getCoalescedEvents();
    for (const e of coalescedEvents) {
        if (pointerUp)
            break;
        const prs = pressureMap.mapXToY(e.pressure);
        if (prs === -1) {
            pointerUp = true;
            break;
        }
        pointerEvents.push([e.clientX, e.clientY, prs]);
        curoff = drawCircle(pointerEvents, ctx);
    }
    if (pointerEvents.length > 1) {
        ctxol.clearRect(0, 0, canvas.width, canvas.height);
        const tctx = (pointerUp) ? ctx : ctxol;
        const tpe = pointerEvents.slice(0);
        let toff = curoff;
        let latest = pointerEvents[pointerEvents.length - 1];
        for (let i = 0; i < 2; ++i) {
            tpe.push(latest);
            toff = drawCircle(tpe, tctx, toff);
        }
    }
    pointerUp = false;
    // // old code
    // if (prs === -1) {
    //     pointerEvents.length = 0;
    //     return;
    // }
    // if (pointerEvents.length < 4) {
    //     while (pointerEvents.length < 4) pointerEvents.push([laste.clientX, laste.clientY, prs]);
    //     curoff = drawCircle(pointerEvents, ctx);
    // }
    // else if (
    //     pointerEvents[3][0] !== laste.clientX
    //     || pointerEvents[3][1] !== laste.clientY
    //     || pointerEvents[2][0] !== pointerEvents[3][0]
    //     || pointerEvents[2][1] !== pointerEvents[3][1]
    //     || pointerEvents[1][0] !== pointerEvents[2][0]
    //     || pointerEvents[1][1] !== pointerEvents[2][1]
    // ) {
    //     pointerEvents.push([laste.clientX, laste.clientY, prs]);
    //     curoff = drawCircle(pointerEvents, ctx);
    //     ctxol.clearRect(0, 0, canvas.width, canvas.height);
    //     const tctx = (pointerUp) ? ctx : ctxol;
    //     const tpe = pointerEvents.slice();
    //     let toff = curoff;
    //     let latest = pointerEvents[3];
    //     for (let i = 0; i < 2; ++i) {
    //         tpe.push(latest);
    //         toff = drawCircle(tpe, tctx, toff);
    //     }
    // }
}
let touchData = null;
let lockedGesture = null;
let touchTmp = null;
let startSize = headsize;
let startDist = headdist;
function handlePointerMove(e) {
    laste = e;
    if (e.pointerType !== 'touch') {
        smooth();
        return;
    }
    else if ((touchTmp === null || touchTmp === void 0 ? void 0 : touchTmp.pointerId) === e.pointerId) {
        if (activePointers.size > 1) {
            touchTmp = null;
            return;
        }
        touchTmp = e;
        smooth();
        return;
    }
    if (activePointers.size !== 3) {
        ctxol.clearRect(0, 0, canvas.width, canvas.height);
        touchData = null;
        lockedGesture = null;
        return;
    }
    if (touchData === null) {
        touchData = { id: e.pointerId, x: e.clientX, y: e.clientY };
        return;
    }
    if (touchData.id !== e.pointerId)
        return;
    const dx = (e.clientX - touchData.x);
    const dy = (touchData.y - e.clientY);
    if (lockedGesture === null) {
        if (Math.abs(dx) > 20)
            lockedGesture = 1, startSize = headsize;
        else if (Math.abs(dy) > 20)
            lockedGesture = 2, startDist = headdist;
        else
            return;
    }
    if (lockedGesture === 1) {
        headsize = clamp(startSize + dx * 0.1, 1, 100);
        headsizeDiv.textContent = "Size: " + headsize.toFixed(1);
    }
    else if (lockedGesture === 2) {
        headdist = clamp(startDist + dy * 0.01, 0.1, 10);
        headdistDiv.textContent = "Dist: " + headdist.toFixed(2);
    }
    if (lockedGesture != null) {
        ctxol.clearRect(0, 0, canvas.width, canvas.height);
        ctxol.strokeStyle = "red";
        ctxol.beginPath();
        ctxol.arc(touchData.x, touchData.y, headsize, 0, 2 * Math.PI);
        ctxol.stroke();
        ctxol.beginPath();
        ctxol.strokeStyle = "blue";
        ctxol.arc(touchData.x, touchData.y, startSize, 0, 2 * Math.PI);
        ctxol.stroke();
    }
}
canvasol.addEventListener("pointerdown", (e) => {
    curoff = 0;
    pointerEvents.length = 0;
    handlePointerMove(e);
    removeEventListener("pointermove", handlePointerMove);
    addEventListener("pointermove", handlePointerMove);
    if (e.pointerType === 'touch') {
        if (activePointers.size < 1)
            touchTmp = e;
        activePointers.add(e.pointerId);
    }
    pointerEnd = true;
});
let pointerEnd = false;
let pointerUp = false;
addEventListener("pointerup", (e) => {
    if (laste === undefined)
        return;
    removeEventListener("pointermove", handlePointerMove);
    if (pointerEnd) {
        pointerUp = true;
        ctxol.clearRect(0, 0, canvas.width, canvas.height);
        smooth();
        pointerUp = false;
        pointerEnd = false;
    }
    if (e.pointerType === 'touch') {
        touchTmp = null;
        activePointers.delete(e.pointerId);
    }
});
function cbs(t, a, b = a, c = b, d = c) {
    let tt = t * t;
    return (a + 4 * b + c
        + 3 * (t * (-a + c)
            + tt * (a - b - b + c))
        + tt * t * (-a + 3 * (b - c) + d)) / 6;
}
class BezierMapper {
    constructor() {
        this.controlPoints = [[0, 0], [0.25, 0], [0.75, 1], [1, 1]];
    }
    /**
     * Function to update the control point (must be between 0 and 1 for both x and y)
     * @param cx - x-coordinate of the control point
     * @param cy - y-coordinate of the control point
     */
    setControlPoint(index, cx, cy) {
        var _a, _b, _c, _d;
        if (index < 0 || index >= this.controlPoints.length) {
            console.warn("Invalid control point index.");
            return;
        }
        let prevX = (_b = (_a = this.controlPoints[index - 1]) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : 0;
        let nextX = (_d = (_c = this.controlPoints[index + 1]) === null || _c === void 0 ? void 0 : _c[0]) !== null && _d !== void 0 ? _d : 1;
        cx = clamp(cx, prevX, nextX);
        cy = clamp(cy);
        this.controlPoints[index] = [cx, cy];
        // this.controlPoints.sort((a, b) => a[0] - b[0]);
    }
    addControlPoint(cx, cy) {
        cx = clamp(cx);
        cy = clamp(cy);
        this.controlPoints.push([cx, cy]);
        this.controlPoints.sort((a, b) => a[0] - b[0]);
    }
    getControlPointIdx(target, tolerance = 0) {
        let index = -1;
        let minDist = tolerance;
        this.controlPoints.forEach(([x, y], i) => {
            const dist = Math.hypot(x - target[0], y - target[1]);
            if (dist <= minDist) {
                minDist = dist;
                index = i;
            }
        });
        return index;
    }
    getControlPointDist(index, pos) {
        if (index < 0 || index >= this.controlPoints.length) {
            console.warn("Invalid control point index.");
            return -1;
        }
        const [x, y] = this.controlPoints[index];
        return Math.hypot(x - pos[0], y - pos[1]);
    }
    removeControlPoint(index) {
        if (this.controlPoints.length < 2) {
            console.warn("Can't delete last control point.");
            return;
        }
        this.controlPoints = this.controlPoints.filter((_, i) => i !== index);
    }
    /**
     * Map an x-value to a y-value using the Bézier curve.
     * @param x - The input x-value (between 0 and 1)
     * @returns The corresponding y-value (between 0 and 1)
     */
    mapXToY(x) {
        let frstX = this.controlPoints[0][0];
        let lastX = this.controlPoints[this.controlPoints.length - 1][0];
        let frstY = this.controlPoints[0][1];
        let lastY = this.controlPoints[this.controlPoints.length - 1][1];
        if (x >= lastX)
            return lastY;
        if (x < frstX)
            return -1;
        let i = 1;
        for (; i < this.controlPoints.length - 2; i += 1) {
            const avgx = (this.controlPoints[i][0] + this.controlPoints[i + 1][0]) * 0.5;
            const avgy = (this.controlPoints[i][1] + this.controlPoints[i + 1][1]) * 0.5;
            if (x < avgx) {
                lastX = avgx;
                lastY = avgy;
                break;
            }
            frstX = avgx;
            frstY = avgy;
        }
        const t = (x - frstX) / (lastX - frstX);
        const bx = (this.controlPoints[i][0] - frstX) / (lastX - frstX);
        const by = this.controlPoints[i][1];
        return this.XToY(t, frstY, bx, by, lastY);
    }
    XToY(x, ay, bx, by, cy) {
        if (x <= 0) {
            return clamp(ay);
        }
        else if (x >= 1) {
            return clamp(cy);
        }
        // Solve for t using the quadratic formula
        const a = 2 * -bx + 1;
        const b = 2 * bx;
        const c = -x;
        if (a === 0) {
            const t = x;
            const it = 1 - t;
            const y = clamp(it * it * ay + 2 * it * t * by + t * t * cy);
            return y;
        }
        // Calculate the discriminant
        const discriminant = b * b - 4 * a * c;
        if (discriminant < 0) {
            console.warn("Warning: no real solutions.");
        }
        // // Solve for t for both values (t2 is not necessary I think??)
        // const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
        // const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);
        // const t = (t1 < 0 || t1 > 1) ? t2 : t1;
        // if (t < 0 || t > 1) throw new Error("No valid solution for t in [0, 1].");
        const t = (-b + Math.sqrt(discriminant)) / (2 * a);
        const it = 1 - t;
        // Calculate y using the Bézier formula
        const y = clamp(it * it * ay + 2 * it * t * by + t * t * cy);
        return y;
    }
}
const pressureMap = new BezierMapper;
const alphaMap = new BezierMapper;
// Create trigger div dynamically
const triggerDiv = document.createElement('div');
triggerDiv.style.position = 'absolute'; // Positions the div absolutely
triggerDiv.style.zIndex = '1000'; // Ensures it appears above other elements
triggerDiv.textContent = 'Pressure Map';
triggerDiv.style.width = '100px';
triggerDiv.style.height = '50px';
triggerDiv.style.backgroundColor = 'lightblue';
triggerDiv.style.textAlign = 'center';
triggerDiv.style.lineHeight = '50px';
triggerDiv.style.cursor = 'pointer';
document.body.appendChild(triggerDiv);
// Create canvas wrapper and canvas dynamically
const canvasWrapper = document.createElement('div');
canvasWrapper.style.display = 'none';
canvasWrapper.style.position = 'absolute';
canvasWrapper.style.top = '50%';
canvasWrapper.style.left = '50%';
canvasWrapper.style.transform = 'translate(-50%, -50%)';
document.body.appendChild(canvasWrapper);
const canO = 24;
const canvi = document.createElement('canvas');
canvi.id = 'myCanvas';
canvi.width = 360 + canO * 2;
canvi.height = 360 + canO * 2;
canvi.style.backgroundColor = 'lightgray';
canvasWrapper.appendChild(canvi);
const ctxP = canvi.getContext('2d');
ctxP.translate(canO, canO);
const [canX, canY] = [canvi.width - canO * 2, canvi.height - canO * 2];
function drawPressureMap() {
    ctxP.clearRect(-canO, -canO, canvi.width, canvi.height);
    ctxP.fillStyle = "rgba(255, 255, 255, 1)";
    ctxP.fillRect(0, 0, canX, canY);
    ctxP.strokeStyle = "rgb(255,0,0)";
    ctxP.beginPath();
    ctxP.moveTo(pressureMap.controlPoints[0][0] * canX, canY);
    ctxP.lineTo(pressureMap.controlPoints[0][0] * canX, (1 - pressureMap.controlPoints[0][1]) * canY);
    ctxP.stroke();
    ctxP.strokeStyle = "rgb(0,0,0)";
    ctxP.beginPath();
    ctxP.moveTo(pressureMap.controlPoints[0][0] * canX, (1 - pressureMap.controlPoints[0][1]) * canY);
    for (let i = 1; i < pressureMap.controlPoints.length - 1; ++i) {
        const [x1, y1] = pressureMap.controlPoints[i];
        let x2 = 0, y2 = 0;
        if (i < pressureMap.controlPoints.length - 2) {
            x2 = (pressureMap.controlPoints[i + 1][0] + x1) / 2;
            y2 = (pressureMap.controlPoints[i + 1][1] + y1) / 2;
        }
        else {
            x2 = pressureMap.controlPoints[i + 1][0];
            y2 = pressureMap.controlPoints[i + 1][1];
        }
        ctxP.quadraticCurveTo(x1 * canX, (1 - y1) * canY, x2 * canX, (1 - y2) * canY);
    }
    ctxP.lineTo((pressureMap.controlPoints[pressureMap.controlPoints.length - 1][0]) * canX, (1 - pressureMap.controlPoints[pressureMap.controlPoints.length - 1][1]) * canY);
    ctxP.stroke();
    ctxP.beginPath();
    ctxP.moveTo((pressureMap.controlPoints[pressureMap.controlPoints.length - 1][0]) * canX, (1 - pressureMap.controlPoints[pressureMap.controlPoints.length - 1][1]) * canY);
    ctxP.strokeStyle = "rgb(255, 0, 0)";
    ctxP.lineTo(canX, (1 - pressureMap.controlPoints[pressureMap.controlPoints.length - 1][1]) * canY);
    ctxP.stroke();
    for (let i = 0; i < pressureMap.controlPoints.length; ++i) {
        const [x, y] = pressureMap.controlPoints[i];
        ctxP.fillStyle = (i === 0 || i === pressureMap.controlPoints.length - 1) ? "red" : "blue";
        ctxP.beginPath();
        ctxP.arc(x * canX, (1 - y) * canY, 5, 0, 6.2831853);
        ctxP.fill();
    }
}
drawPressureMap();
let conPtI = -1;
canvi.addEventListener('pointerdown', (e) => {
    const tolerance = 0.1;
    const eX = (e.offsetX - canO) / canX;
    const eY = (canY - e.offsetY + canO) / canY;
    conPtI = pressureMap.getControlPointIdx([eX, eY], tolerance);
    if (conPtI === -1) {
        pressureMap.addControlPoint(eX, eY);
        conPtI = pressureMap.getControlPointIdx([eX, eY], tolerance);
    }
});
addEventListener('pointerup', (e) => {
    if (conPtI !== -1) {
        const maxDist = 0.2;
        const eX = (e.offsetX - canO) / canX;
        const eY = (canY - e.offsetY + canO) / canY;
        if (pressureMap.getControlPointDist(conPtI, [eX, eY]) > maxDist) {
            pressureMap.removeControlPoint(conPtI);
            drawPressureMap();
        }
    }
    conPtI = -1;
});
canvi.addEventListener('pointermove', (e) => {
    if (conPtI !== -1) {
        const eX = (e.offsetX - canO);
        const eY = (e.offsetY - canO);
        pressureMap.setControlPoint(conPtI, eX / canX, 1 - eY / canY);
        drawPressureMap();
    }
});
// Show canvas when clicking on trigger div
triggerDiv.addEventListener('click', () => {
    canvasWrapper.style.display = 'block';
});
// Hide canvas when clicking outside the canvas
document.addEventListener('pointerdown', (event) => {
    if (!canvasWrapper.contains(event.target) && event.target !== triggerDiv) {
        canvasWrapper.style.display = 'none';
    }
});
function clamp(num, min = 0, max = 1) {
    return Math.min(Math.max(num, min), max);
}
// function cubicBezier(t, a, b, c, d) {
//     let tt = t * t;
//     return a
//         + t * 3 * (-a + b)
//         + tt * 3 * (a - 2 * b + c)
//         + tt * t * (-a + 3 * (b - c) + d);
// }
// function lerp(t, a, b) {
//     return a + t * (b - a);
// }
// create a div to change the headsize
const headsizeDiv = document.createElement('div');
headsizeDiv.style.position = 'absolute';
headsizeDiv.style.zIndex = '1000';
headsizeDiv.textContent = 'Size: ' + headsize.toFixed(1);
headsizeDiv.style.userSelect = 'none';
headsizeDiv.style.width = '100px';
headsizeDiv.style.height = '50px';
headsizeDiv.style.backgroundColor = 'lightblue';
headsizeDiv.style.textAlign = 'center';
headsizeDiv.style.lineHeight = '50px';
headsizeDiv.style.top = '50%';
headsizeDiv.style.left = '0';
headsizeDiv.style.transform = 'translate(0, 100%)';
document.body.appendChild(headsizeDiv);
let sizeDown = false;
let sizeStartY = 0;
headsizeDiv.addEventListener('pointerdown', (e) => {
    sizeDown = true;
    sizeStartY = e.clientY;
});
addEventListener('pointerup', () => {
    sizeDown = false;
});
addEventListener('pointermove', (e) => {
    if (sizeDown) {
        const dy = sizeStartY - e.clientY;
        sizeStartY = e.clientY;
        headsize = clamp(headsize + dy * 0.1, 0.1, 100);
        headsizeDiv.textContent = 'Size: ' + headsize.toFixed(1);
    }
});
const temp123 = document.createElement('div');
temp123.style.position = 'absolute';
temp123.style.zIndex = '1000';
temp123.textContent = 'Drag up/down to change the size';
temp123.style.userSelect = 'none';
temp123.style.width = '100px';
temp123.style.textAlign = 'center';
temp123.style.lineHeight = '20px';
temp123.style.bottom = '50%';
temp123.style.left = '0';
temp123.style.transform = 'translate(0, 50%)';
document.body.appendChild(temp123);
// create a div to change the headdist
const headdistDiv = document.createElement('div');
headdistDiv.style.position = 'absolute';
headdistDiv.style.zIndex = '1000';
headdistDiv.textContent = 'Dist: ' + headdist.toFixed(2);
headdistDiv.style.userSelect = 'none';
headdistDiv.style.width = '100px';
headdistDiv.style.height = '50px';
headdistDiv.style.backgroundColor = 'lightblue';
headdistDiv.style.textAlign = 'center';
headdistDiv.style.lineHeight = '50px';
headdistDiv.style.bottom = '50%';
headdistDiv.style.left = '0';
headdistDiv.style.transform = 'translate(0, -100%)';
document.body.appendChild(headdistDiv);
let distDown = false;
let distStartY = 0;
headdistDiv.addEventListener('pointerdown', (e) => {
    distDown = true;
    distStartY = e.clientY;
});
addEventListener('pointerup', () => {
    distDown = false;
});
addEventListener('pointermove', (e) => {
    if (distDown) {
        const dy = distStartY - e.clientY;
        distStartY = e.clientY;
        headdist = clamp(headdist + dy * 0.01, 0.01, 10);
        headdistDiv.textContent = 'Dist: ' + headdist.toFixed(2);
    }
});
// create a div to clear canvas
const clearDiv = document.createElement('div');
clearDiv.style.position = 'absolute';
clearDiv.style.zIndex = '10020';
clearDiv.textContent = 'Clear';
clearDiv.style.userSelect = 'none';
clearDiv.style.width = '100px';
clearDiv.style.height = '50px';
clearDiv.style.backgroundColor = 'lightblue';
clearDiv.style.textAlign = 'center';
clearDiv.style.lineHeight = '50px';
clearDiv.style.bottom = '0';
clearDiv.style.left = '50%';
clearDiv.style.transform = 'translate(-50%, 0)';
document.body.appendChild(clearDiv);
clearDiv.addEventListener('click', (e) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});
