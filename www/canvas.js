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

        // Interaction
        if (options.touch) {
            this.#canvas.addEventListener("touchstart", this.#touchStart.bind(this, options.touch));
            this.#canvas.addEventListener("mousedown", this.#mouseEvent.bind(this, "start", options.touch));

            this.#canvas.addEventListener("touchmove", this.#touchEvent.bind(this, "move", options.touch));
            this.#canvas.addEventListener("mousemove", this.#mouseEvent.bind(this, "move", options.touch));

            this.#canvas.addEventListener("touchend", this.#touchEvent.bind(this, "end", options.touch));
            this.#canvas.addEventListener("mouseup", this.#mouseEvent.bind(this, "end", options.touch));
            this.#canvas.addEventListener("mouseout", this.#mouseEvent.bind(this, "end", options.touch));
        }
    }

    get canvas() {
        return this.#canvas;
    }

    get ctx() {
        return this.#ctx;
    }

    get bottomRight() {
        return new Point(this.#width, this.#height);
    }

    #getTouchPoint(x, y) {
        let bounds = this.#canvas.getBoundingClientRect();
        return (new Point(x, y))
            .scale(window.devicePixelRatio)
            .translate(-bounds.left, -bounds.top)
            .translate(-this.#offsetX, -this.#offsetY)
            .rotate(-this.#rotation)
            .translate(0, this.#translation)
            .scale(1 / this.#scale);
    }

    #getTouchRadius(touch) {
        return (touch.radiusX + touch.radiusY)/2 * window.devicePixelRatio;
    }

    #touchId;
    #touchStart(listener, event) {
        if(event.touches.length==1) { //TODO: detect last touch instead???
            event.preventDefault();
            this.#touchId = event.touches[0].identifier;
            listener({type: "start", point: this.#getTouchPoint(event.touches[0].clientX, event.touches[0].clientY), radius: this.#getTouchRadius(event.touches[0])});
        }
    }
    #touchEvent(type, listener, event) {
        let touches = event.changedTouches;
        for(let i=0; i<touches.length; i++) {
            if(touches[i].identifier==this.#touchId) {
                event.preventDefault();
                listener({type: type, point: this.#getTouchPoint(touches[i].clientX, touches[i].clientY), radius: this.#getTouchRadius(touches[i])});
            }
        }
    }

    #mouseEvent(type, listener, event) {
        event.preventDefault();
        listener({type: type, point: this.#getTouchPoint(event.clientX, event.clientY), radius: 1});
    }

    #keyEvent(type, listener, event) {
        event.preventDefault();
        console.log(event);
        listener({type: type, key: event.key, original: event});
    }
}