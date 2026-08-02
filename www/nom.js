import {Canvas} from "./canvas.js";

function debounce(callback, time) {
    let timer;
    return function() {
        clearTimeout(timer);
        timer = setTimeout(callback, time);
    };
}

export function nom(parentElement) {
    let mode = "loading";

    const canvas = Canvas.new({
        parentElement,
        onResize: debounce(() => paint, 50),
    });

    function paint() {
        const size = canvas.bottomRight;

        if (mode == "loading") {
            canvas
                .save()
                .fillStyle("rgb(0, 0, 0)")
                .fillRect(0, 0, size.x, size.y)
                .font("30px sans-serif")
                .textAlign("center")
                .fillStyle("rgb(255, 255, 255)")
                .fillText("loading...", size.x/2, size.y/2)
                .restore();
        }
    }

    function animate() {
        paint();
        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
}