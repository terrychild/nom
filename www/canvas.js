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
    
    constructor(options) {
        this.#canvas = options.parentElement.appendChild(document.createElement("canvas"));
        this.#ctx = this.#canvas.getContext("2d");

        this.#width = this.#canvas.offsetWidth;
        this.#height = this.#canvas.offsetHeight;
        (new ResizeObserver((entries) => {
            const boxSize = entries[0].borderBoxSize[0];
            this.#width = Math.floor(boxSize.inlineSize * window.devicePixelRatio);
            this.#height = Math.floor(boxSize.blockSize * window.devicePixelRatio);

            this.#canvas.width = this.#width;
            this.#canvas.height = this.#height;

            if (options.onResize) {
                options.onResize();
            }
        })).observe(this.#canvas);
    }

    get ctx() {
        return this.#ctx;
    }

    get bottomRight() {
        return new Point(this.#width, this.#height);
    }
}