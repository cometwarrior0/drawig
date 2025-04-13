const canvas = document.createElement('canvas');
canvas.style.position = "absolute";
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d")!;

const canvasol = document.createElement('canvas');
canvasol.style.position = "absolute";
canvasol.width = window.innerWidth;;
canvasol.height = window.innerHeight;
document.body.appendChild(canvasol);

const ctxol = canvasol.getContext("2d")!;

const activePointers = new Set();
const pointerEvents: number[][] = [];
let laste: PointerEvent;
let curoff = 0.0;

let headsize = 8.0;
let headdist = 0.125;

function drawCircle(PE: number[][], ct: CanvasRenderingContext2D, coff = curoff) {
    if (PE.length > 4) {
        PE.splice(0, PE.length - 4);
    }

    const x0 = PE[0][0];
    const x1 = PE[1][0];
    const x2 = PE[2][0];
    const x3 = PE[3][0];

    const y0 = PE[0][1];
    const y1 = PE[1][1];
    const y2 = PE[2][1];
    const y3 = PE[3][1];

    const p0 = PE[0][2];
    const p1 = PE[1][2];
    const p2 = PE[2][2];
    const p3 = PE[3][2];

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
        const dlen = Math.sqrt(dx * dx + dy * dy);

        lx = cx;
        ly = cy;

        coff -= dlen;
        if (cp <= 0) continue;
        ct.beginPath();
        if ((coff + cp * headdist) < 0.25) {
            ct.arc(cx, cy, cp, 0, 6.2831853);
            coff = cp * headdist;
        }
        ct.fill();
    }
    return coff;
}

function smooth() {
    let prs = pressureMap.mapXToY(laste.pressure);
    if (prs === null) {
        pointerEvents.length = 0;
        return;
    }
    if (pointerEvents.length < 4) {
        while (pointerEvents.length < 4) pointerEvents.push([laste.clientX, laste.clientY, prs]);
        curoff = drawCircle(pointerEvents, ctx);
    }
    else if (
        pointerEvents[3][0] !== laste.clientX
        || pointerEvents[3][1] !== laste.clientY
        || pointerEvents[2][0] !== pointerEvents[3][0]
        || pointerEvents[2][1] !== pointerEvents[3][1]
        || pointerEvents[1][0] !== pointerEvents[2][0]
        || pointerEvents[1][1] !== pointerEvents[2][1]
    ) {
        pointerEvents.push([laste.clientX, laste.clientY, prs]);
        curoff = drawCircle(pointerEvents, ctx);

        ctxol.clearRect(0, 0, canvas.width, canvas.height);
        const tctx = (pointerUp) ? ctx : ctxol;
        const tpe = pointerEvents.slice();
        let toff = curoff;
        let latest = pointerEvents[3];
        for (let i = 0; i < 2; ++i) {
            tpe.push(latest);
            toff = drawCircle(tpe, tctx, toff);
        }
    }
}

let touchData: { id: number, x: number, y: number } | null = null;
let lockedGesture: number | null = null;

function handlePointerMove(e: PointerEvent) {
    laste = e;
    if (e.pointerType !== 'touch') {
        smooth();
        return;
    }
    if (activePointers.size !== 3) {
        touchData = null;
        lockedGesture = null;
        return;
    }
    if (touchData === null) {
        touchData = { id: e.pointerId, x: e.clientX, y: e.clientY };
        return;
    }
    if (touchData.id !== e.pointerId) return;
    if (lockedGesture === null) {
        const dx = Math.abs(touchData.x - e.clientX);
        const dy = Math.abs(touchData.y - e.clientY);
        if (Math.max(dx, dy) > 20) lockedGesture = dx > dy ? 1 : 2;
    }
    if (lockedGesture === 1) {
        headdist = Math.min(15, Math.max(0.0625, headdist + (e.clientX - touchData.x) * 0.001));
        return;
    }
    else if (lockedGesture === 2) {
        headsize = Math.min(255, Math.max(1, headsize + (touchData.y - e.clientY) * 0.02));
    }
}

canvasol.addEventListener("pointerdown", (e) => {
    console.log(e);
    curoff = Number.NEGATIVE_INFINITY;

    pointerEvents.length = 0;
    handlePointerMove(e);

    removeEventListener("pointermove", handlePointerMove);
    addEventListener("pointermove", handlePointerMove);

    if (e.pointerType === 'touch') {
        activePointers.add(e.pointerId);
    }
});

let pointerUp: boolean = false;
addEventListener("pointerup", (e: PointerEvent) => {
    removeEventListener("pointermove", handlePointerMove);

    if (e.pointerType !== 'touch') {
        pointerUp = true;
        ctxol.clearRect(0, 0, canvas.width, canvas.height);
        smooth();
        pointerUp = false
    }

    if (e.pointerType === 'touch') {
        activePointers.delete(e.pointerId);
    }
});

function cbs(t: number, a: number, b = a, c = b, d = c) {
    let tt = t * t;
    return (a + 4 * b + c
        + 3 * (t * (-a + c)
            + tt * (a - b - b + c))
        + tt * t * (-a + 3 * (b - c) + d)) * 0.1666666666666666666666667;
}

class BezierMapper {
    private controlPoints: number[][] = [[0, 0], [0.125, 0], [0.875, 1], [1, 1]];

    /**
     * Function to update the control point (must be between 0 and 1 for both x and y)
     * @param cx - x-coordinate of the control point
     * @param cy - y-coordinate of the control point
     */

    public setControlPoint(target: [number, number], cx: number, cy: number): void {
        if (cx < 0 || cx > 1 || cy < 0 || cy > 1) {
            console.warn("Control point coordinates must be between 0 and 1. Clamping the values...");
            cx = Math.min(1, Math.max(0, cx));
            cy = Math.min(1, Math.max(0, cy));
        }

        const index = this.controlPoints.findIndex(
            controlPoint => controlPoint[0] === target[0] && controlPoint[1] === target[1]
        );

        if (index !== -1) {
            this.controlPoints[index] = [cx, cy];
        }

        this.controlPoints.sort((a, b) => a[0] - b[0]);
    }

    public addControlPoint(cx: number, cy: number): void {
        if (cx < 0 || cx > 1 || cy < 0 || cy > 1) {
            console.warn("Control point coordinates must be between 0 and 1. Clamping the values...");
            cx = Math.min(1, Math.max(0, cx));
            cy = Math.min(1, Math.max(0, cy));
        }
        this.controlPoints.push([cx, cy]);
        this.controlPoints.sort((a, b) => a[0] - b[0]);
    }

    public removeControlPoint(target: [number, number]): void {
        if (this.controlPoints.length < 3) {
            console.warn("Cannot remove control point. There are not enough points to do so.");
            return;
        }
        const index = this.controlPoints.findIndex(
            controlPoint => controlPoint[0] === target[0] && controlPoint[1] === target[1]
        );

        if (index !== -1) {
            this.controlPoints = this.controlPoints.filter((_, i) => i !== index);
        }
    }

    /**
     * Map an x-value to a y-value using the Bézier curve.
     * @param x - The input x-value (between 0 and 1)
     * @returns The corresponding y-value (between 0 and 1)
     */
    public mapXToY(x: number): number | null {
        let frstX = this.controlPoints[0][0];
        let lastX = this.controlPoints[this.controlPoints.length - 1][0];
        let frstY = this.controlPoints[0][1];
        let lastY = this.controlPoints[this.controlPoints.length - 1][1];
        if (x >= lastX) return lastY;
        if (x < frstX) return null;
        // x = (x - frstX) / (lastX - frstX);
        // if (this.controlPoints.length === 2) {
        //     return Math.min(1, Math.max(0, frstY + (lastY - frstY) * x));
        // }

        let i = 0;
        for (; i < this.controlPoints.length - 1; i += 1) {
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
        return this.XToY(t, frstY, this.controlPoints[i][0], this.controlPoints[i][1], lastY)
    }

    private XToY(x: number, ay: number, bx: number, by: number, cy: number): number {
        if (x <= 0) {
            return Math.min(1, Math.max(0, ay));
        }
        else if (x >= 1) {
            return Math.min(1, Math.max(0, cy));
        }

        // Solve for t using the quadratic formula
        const a = 2 * -bx + 1;
        const b = 2 * bx;
        const c = -x;

        if (a === 0) {
            const t = x;
            const it = 1 - t;
            const y = Math.min(1, Math.max(0, it * it * ay + 2 * it * t * by + t * t * cy));
            return y;
        }

        // Calculate the discriminant
        const discriminant = b * b - 4 * a * c;
        if (discriminant < 0) throw new Error("Error: no real solutions.");

        // // Solve for t for both values (t2 is not necessary I think??)
        // const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
        // const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);

        // const t = (t1 < 0 || t1 > 1) ? t2 : t1;
        // if (t < 0 || t > 1) throw new Error("No valid solution for t in [0, 1].");

        const t = (-b + Math.sqrt(discriminant)) / (2 * a);

        const it = 1 - t;

        // Calculate y using the Bézier formula
        const y = Math.min(1, Math.max(0, it * it * ay + 2 * it * t * by + t * t * cy));

        return y;
    }
}

const pressureMap = new BezierMapper;

// Create trigger div dynamically
const triggerDiv = document.createElement('div');
triggerDiv.style.position = 'absolute'; // Positions the div absolutely
triggerDiv.style.zIndex = '1000';      // Ensures it appears above other elements
triggerDiv.id = 'triggerDiv';
triggerDiv.textContent = 'Click Me';
triggerDiv.style.width = '100px';
triggerDiv.style.height = '50px';
triggerDiv.style.backgroundColor = 'lightblue';
triggerDiv.style.textAlign = 'center';
triggerDiv.style.lineHeight = '50px';
triggerDiv.style.cursor = 'pointer';
document.body.appendChild(triggerDiv);

// Create canvas wrapper and canvas dynamically
const canvasWrapper = document.createElement('div');
canvasWrapper.id = 'canvasWrapper';
canvasWrapper.style.display = 'none';
canvasWrapper.style.position = 'absolute';
canvasWrapper.style.top = '50%';
canvasWrapper.style.left = '50%';
canvasWrapper.style.transform = 'translate(-50%, -50%)';
canvasWrapper.style.border = '4px solid black';
document.body.appendChild(canvasWrapper);

const canvi = document.createElement('canvas');
canvi.id = 'myCanvas';
canvi.width = 400;
canvi.height = 300;
canvi.style.backgroundColor = 'lightgray';
canvasWrapper.appendChild(canvi);

// Show canvas when clicking on trigger div
triggerDiv.addEventListener('click', () => {
    canvasWrapper.style.display = 'block';
});

// Hide canvas when clicking outside the canvas
document.addEventListener('click', (event) => {
    if (!canvasWrapper.contains(event.target as Node) && event.target !== triggerDiv) {
        canvasWrapper.style.display = 'none';
    }
});



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
