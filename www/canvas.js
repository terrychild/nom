import {Point} from "./point.js";

const handler = {
    get(target, prop, receiver) {
        if (target[prop]) {
            return target[prop];
        }
        if (target.ctx[prop]) {
            if (typeof target.ctx[prop] == "function") {
                return function(...args) {
                    target.ctx[prop].apply(target.ctx, args);
                    return receiver;
                }
            }
            return function(arg) {
                target.ctx[prop] = arg;
                return receiver;
            }
        }
        return undefined;
    }
};

export class Canvas {
    static new(options) {
        return new Proxy(new Canvas(options), handler);
    }

    #canvas;
    #ctx;
    #width;
    #height;
    #scale;
    #translation;
    #rotation;
    #offsetX;
    #offsetY;
    
    constructor(options) {
        this.#canvas = options.parentElement.appendChild(document.createElement("canvas"));
        this.#ctx = this.#canvas.getContext("2d");

        this.#width = options.width;
        this.#height = options.height;

        (new ResizeObserver(() => {
            let elementWidth = Math.floor(this.#canvas.offsetWidth * window.devicePixelRatio);
            let elementHeight = Math.floor(this.#canvas.offsetHeight * window.devicePixelRatio);
            this.#canvas.width = elementWidth;
            this.#canvas.height = elementHeight;            

            this.#ctx.reset();
            this.#ctx.fillStyle = "rgb(255, 0, 255)";
            this.#ctx.fillRect(0, 0, elementWidth, elementHeight);

            if(elementWidth < elementHeight && options.forceLandscape) {
                this.#translation = this.#height;
                this.#rotation = Math.PI/2;
                const temp = elementHeight;
                elementHeight = elementWidth;
                elementWidth = temp;
            } else {
                this.#translation = 0;
                this.#rotation = 0;
            }

            const scaleX = elementWidth / this.#width;
            const scaleY = elementHeight / this.#height;
            if(scaleX<scaleY) {
                this.#scale = scaleX;
                this.#offsetX = 0;
                this.#offsetY = (this.#translation > 0 ? -1 : 1) * ((elementHeight / this.#scale) - this.#height) / 2;
            } else {
                this.#scale = scaleY;
                this.#offsetX = ((elementWidth / this.#scale) - this.#width) / 2;
                this.#offsetY = 0;
            }

            this.#ctx.scale(this.#scale, this.#scale);
            this.#ctx.translate(this.#translation, 0);
            this.#ctx.rotate(this.#rotation);
            this.#ctx.translate(this.#offsetX, this.#offsetY);

            this.#ctx.beginPath();
            this.#ctx.rect(0, 0, this.#width, this.#height);
            this.#ctx.clip();

        })).observe(this.#canvas);        
    }

    get ctx() {
        return this.#ctx;
    }

    get bottomRight() {
        return new Point(this.#width, this.#height);
    }
}