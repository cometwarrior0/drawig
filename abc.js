"use strict";
const canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d");
const activePointers = new Set();
const pointerEvents = [];
let laste;
let curoff = 0.0;
let headsize = 16.0;
let headdist = 0.125;
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
    const xl1 = x2 - x1;
    const xl2 = x3 - x2;
    const yl0 = y1 - y0;
    const yl1 = y2 - y1;
    const yl2 = y3 - y2;
    const l0 = Math.sqrt(xl0 * xl0 + yl0 * yl0);
    const l1 = Math.sqrt(xl1 * xl1 + yl1 * yl1);
    const l2 = Math.sqrt(xl2 * xl2 + yl2 * yl2);
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
        curoff -= dlen;
        if ((curoff + cp * headdist) < 0.25) {
            ctx.beginPath();
            ctx.arc(cx, cy, cp, 0, 6.2831853);
            ctx.fill();
            curoff = cp * headdist;
        }
        lx = cx;
        ly = cy;
    }
}
let animId = null;
function smooth() {
    let prs = laste.pressure;
    let pms = pressureMap.activeRange.start;
    let pme = pressureMap.activeRange.end;
    if (prs >= pme) {
        prs = pressureMap.mapXToY(1);
    }
    else if (prs >= pms) {
        prs = pressureMap.mapXToY((prs - pms) / (pme - pms));
    }
    else {
        pointerEvents.length = 0;
        return;
    }
    if (prs < 0 || prs > 1) {
        console.log(prs);
        prs = Math.min(Math.max(prs, 0), 1);
    }
    if (pointerEvents.length < 4) {
        while (pointerEvents.length < 4)
            pointerEvents.push([laste.offsetX, laste.offsetY, prs]);
        drawCircle();
    }
    else if (pointerEvents[3][0] !== laste.offsetX || pointerEvents[3][1] !== laste.offsetY) {
        pointerEvents.push([laste.offsetX, laste.offsetY, prs]);
        drawCircle();
    }
}
let touchsy = null;
function handlePointerMove(e) {
    laste = e;
    if (e.pointerType === 'pen') {
        animId = requestAnimationFrame(smooth);
    }
    else if (e.pointerType === 'touch' && activePointers.size === 3) {
        if (touchsy === null) {
            touchsy = e.offsetY;
        }
        else {
            headsize = Math.max(1, headsize + (touchsy - e.offsetY) * 0.01);
        }
    }
    else {
        touchsy = null;
    }
}
addEventListener("pointerdown", (e) => {
    curoff = Number.NEGATIVE_INFINITY;
    pointerEvents.length = 0;
    handlePointerMove(e);
    removeEventListener("pointermove", handlePointerMove);
    addEventListener("pointermove", handlePointerMove);
    if (e.pointerType === 'touch') {
        activePointers.add(e.pointerId);
    }
});
addEventListener("pointerup", (e) => {
    if (animId !== null && e.pointerType === 'pen') {
        cancelAnimationFrame(animId);
        animId = null;
        smooth();
    }
    removeEventListener("pointermove", handlePointerMove);
    if (e.pointerType === 'touch') {
        activePointers.delete(e.pointerId);
    }
});
function cbs(t, a, b = a, c = b, d = c) {
    let tt = t * t;
    return (a + 4 * b + c
        + 3 * (t * (-a + c)
            + tt * (a - b - b + c))
        + tt * t * (-a + 3 * (b - c) + d)) * 0.1666666666666666666666667;
}
class BezierMapper {
    constructor() {
        // The control point (cx, cy) for the quadratic Bézier curve
        this.activeRange = { start: 0.0625, end: 1 };
        this.endPoints = { start: 0, end: 1 };
        this.controlPoint = { x: 0.125, y: 0.0 }; // Default control point
    }
    setActiveRange(range) {
        if (range.start > range.end) {
            throw new Error("Ending point must be bigger than starting point.");
        }
        else if (range.start < 0 || range.end > 1) {
            throw new Error("Active range must be between 0 and 1.");
        }
        this.activeRange = range;
    }
    setEndPoints(endPoints) {
        if (endPoints.start < 0 || endPoints.start > 1 || endPoints.end < 0 || endPoints.end > 1) {
            throw new Error("End points must be between 0 and 1.");
        }
        this.endPoints = endPoints;
    }
    /**
     * Function to update the control point (must be between 0 and 1 for both x and y)
     * @param bx - x-coordinate of the control point
     * @param by - y-coordinate of the control point
     */
    setControlPoint(bx, by) {
        if (bx < 0 || bx > 1 || by < 0 || by > 1) {
            throw new Error("Control point coordinates must be between 0 and 1.");
        }
        this.controlPoint = { x: bx, y: by };
    }
    /**
     * Map an x-value to a y-value using the Bézier curve.
     * @param x - The input x-value (between 0 and 1)
     * @returns The corresponding y-value (between 0 and 1)
     */
    mapXToY(x) {
        if (x < 0 || x > 1)
            throw new Error("x must be between 0 and 1.");
        else if (x === 0)
            return this.endPoints.start;
        else if (x === 1)
            return this.endPoints.end;
        const bx = this.controlPoint.x;
        const by = this.controlPoint.y;
        const ay = this.endPoints.start;
        const cy = this.endPoints.end;
        // Solve for t using the quadratic formula
        const a = 2 * -bx + 1;
        const b = 2 * bx;
        const c = -x;
        if (a === 0) {
            const t = x / b;
            const it = 1 - t;
            const y = it * it * ay + 2 * it * t * by + t * t * cy;
            return y;
        }
        // Calculate the discriminant
        const discriminant = b * b - 4 * a * c;
        if (discriminant < 0)
            throw new Error("Error: no real solutions.");
        // Solve for t for both values (t2 is not necessary I think??)
        const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
        const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);
        const t = (t1 < 0 || t1 > 1) ? t2 : t1;
        if (t < 0 || t > 1)
            throw new Error("No valid solution for t in [0, 1].");
        const it = 1 - t;
        // Calculate y using the Bézier formula
        const y = it * it * ay + 2 * it * t * by + t * t * cy;
        return y;
    }
}
const pressureMap = new BezierMapper;
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
