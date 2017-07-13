// ---------------------------------------------------------------------------
// PeekCanvasBounds
// ---------------------------------------------------------------------------
export class PeekCanvasBounds {
    x: number;
    y: number;
    w: number;
    h: number;

    constructor(x: number | PeekCanvasBounds = 0.0, y: number = 0.0,
                w: number = 0.0, h: number = 0.0) {

        // Copy constructor
        if (x instanceof PeekCanvasBounds) {
            this.x = parseFloat(x.x.toString());
            this.y = parseFloat(x.y.toString());
            this.w = parseFloat(x.w.toString());
            this.h = parseFloat(x.h.toString());
            return;
        }

        this.x = 0.0;
        this.y = 0.0;
        this.w = 0.0;
        this.h = 0.0;

        if (x)
            this.x = parseFloat(x.toString());

        if (y)
            this.y = parseFloat(y.toString());

        if (w)
            this.w = parseFloat(w.toString());

        if (h)
            this.h = parseFloat(h.toString());

        if (this.w < 0) {
            this.w *= -1;
            this.x = this.x - this.w;
        }

        if (this.h < 0) {
            this.h *= -1;
            this.y = this.y - this.h;
        }
    }

    // Class method
    static fromGeom(geom) {
        let self = new PeekCanvasBounds();

        let firstPoint = geom[0]; // get details of point

        let lx = firstPoint.x; // Low x
        let ux = firstPoint.x; // Upper x
        let ly = firstPoint.y; // Low y
        let uy = firstPoint.y; // Upper y


        for (let i = 1; i < geom.length; ++i) {
            let point = geom[i];

            // Work out our bounds
            if (point.x < lx)
                lx = point.x;

            if (ux < point.x)
                ux = point.x;

            if (point.y < ly)
                ly = point.y;

            if (uy < point.y)
                uy = point.y;
        }

        self.x = lx;
        self.y = ly;
        self.w = ux - lx;
        self.h = uy - ly;

        return self;
    };

    contains(x, y, margin) {
        let b = this;

        // For Bounding Box
        let left = b.x - margin / 2;
        let right = b.x + b.w + margin / 2;
        let top = b.y - margin / 2;
        let bottom = b.y + b.h + margin / 2;

        return (left <= x && x <= right) //
            && (top <= y && y <= bottom);
    };

    withIn(x, y, w, h) {
        if (x instanceof PeekCanvasBounds) {
            y = x.y;
            w = x.w;
            h = x.h;
            x = x.x;
        }

        let b = this;
        return (x <= b.x) && (b.x + b.w <= x + w) //
            && (y <= b.y) && (b.y + b.h <= y + h);
    };

    isEqual(other) {

        if (!other instanceof PeekCanvasBounds)
            return false;

        return (this.x === other.x) //
            && (this.y === other.y) //
            && (this.w === other.w) //
            && (this.h === other.h) //
            ;
    };

    area() {
        return this.w * this.h;
    };

    toString() {
        return this.x + "x," + this.y + "y," + this.w + "w," + this.h + "h,"
    };
}

            