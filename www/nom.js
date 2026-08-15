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
        height: 256,
        width: Math.floor(256 * 19.5 / 9),
        forceLandscape: true,
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
        } else if (mode == "game") {
            canvas
                .save()
                .fillStyle("rgb(0, 0, 0)")
                .fillRect(0, 0, size.x, size.y);

            /*for (let y=0; y<256; y+=10) {
                canvas
                    .strokeStyle("rgb(255, 255, 255)")
                    .moveTo(0, y)
                    .lineTo(10, y)
                    .stroke();
            }*/

            for (let i=0; i<(size.x/64); i++) {
                canvas.drawImage(drawing, (i*64)-offset, 80);
                canvas.drawImage(drawing, (i*64)-offset, 162);
                canvas.drawImage(drawing, (i*64)-offset, 240);
            }

            canvas.drawImage(noms[Math.floor(frame/6)], 64, 162 - 64);

            canvas.restore();
        }

        // debug
        canvas
            .save()
            .font("8px monospace")
            .fillStyle("rgb(63, 255, 63)")
            .textBaseline("top")
            .fillText("hello", 5, 5)
            .restore()
    }

    function animate() {
        paint();
        requestAnimationFrame(animate);
        offset = (offset + 4) % 64;
        frame = (frame + 1) % 24;
    }

    requestAnimationFrame(animate);

    let offset = 0;
    let frame = 0;
    let loading =4;
    const drawing = new Image();
    drawing.src = "floor.png";
    drawing.onload = function() {
        loading--;
        if (loading==0) {
            mode = "game";
        }
    };


    const nom_l = new Image();
    nom_l.src = "nom_l.png";
    nom_l.onload = function() {
        loading--;
        if (loading==0) {
            mode = "game";
        }
    };

    const nom_c = new Image();
    nom_c.src = "nom_c.png";
    nom_c.onload = function() {
        loading--;
        if (loading==0) {
            mode = "game";
        }
    };

    const nom_r = new Image();
    nom_r.src = "nom_r.png";
    nom_r.onload = function() {
        loading--;
        if (loading==0) {
            mode = "game";
        }
    };

    const noms = [
        nom_c,
        nom_r,
        nom_c,
        nom_l,
    ]
}