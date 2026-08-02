export class Point {
    constructor(x, y) {
        this.x=x;
        this.y=y;
    }

    toString() {
        return "x: "+this.x+", y:"+this.y;
    }
    clone() {
        return new Point(this.x, this.y);
    }
    add(p) {
        this.x+=p.x;
        this.y+=p.y;
        return this;
    }
    minus(p) {
        this.x-=p.x;
        this.y-=p.y;
        return this;
    }
    translate(dx, dy) {
        this.x+=dx;
        this.y+=dy;
        return this;
    }
    move(a, d) {
        this.x += Math.cos(a) * d;
        this.y += Math.sin(a) * d;
        return this;
    }
    scale(scale) {
        this.x *= scale;
        this.y *= scale;
        return this;
    }
    rotate(a) {
        const x = this.x*Math.cos(a) - this.y*Math.sin(a);
        this.y = this.x*Math.sin(a) + this.y*Math.cos(a);
        this.x = x;
        return this;
    }
    distanceTo(p) {
        return Math.sqrt(Math.pow(this.x-p.x, 2)+Math.pow(this.y-p.y, 2));
    }
    angleTo(p) {
        const dx = p.x - this.x;
        const dy = p.y - this.y;

        if(dx>0 && dy>=0) {
            return Math.atan(dy/dx);
        } else if(dx<=0 && dy>0) {
            return Math.atan(-dx/dy) + (0.5 * Math.PI);
        } else if(dx<0 && dy<=0) {
            return Math.atan(-dy/-dx) + (Math.PI);
        } else /*if(dx>=0 && dy<0)*/ {
            return Math.atan(dx/-dy) + (1.5 * Math.PI);
        }
    }
}