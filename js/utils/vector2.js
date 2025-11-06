// Vector2 utility class for optimized vector operations
export class Vector2 {
    // Normalize a vector to unit length, returns [x, y]
    static normalize(x, y) {
        const mag = Math.sqrt(x * x + y * y);
        return mag > 0 ? [x / mag, y / mag] : [0, 0];
    }

    // Calculate distance between two points (expensive - use sparingly)
    static distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Calculate squared distance (fast - no sqrt, good for comparisons)
    static distanceSquared(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return dx * dx + dy * dy;
    }

    // Get direction vector from point A to point B (normalized)
    static direction(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Vector2.normalize(dx, dy);
    }

    // Linear interpolation between two vectors
    static lerp(x1, y1, x2, y2, t) {
        return [
            x1 + (x2 - x1) * t,
            y1 + (y2 - y1) * t
        ];
    }

    // Reflect a vector across a normal
    static reflect(vx, vy, nx, ny) {
        const dot = 2 * (vx * nx + vy * ny);
        return [vx - dot * nx, vy - dot * ny];
    }

    // Rotate a vector by angle (in radians)
    static rotate(x, y, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return [x * cos - y * sin, x * sin + y * cos];
    }

    // Add two vectors
    static add(x1, y1, x2, y2) {
        return [x1 + x2, y1 + y2];
    }

    // Scale a vector by a scalar
    static scale(x, y, scalar) {
        return [x * scalar, y * scalar];
    }
}
