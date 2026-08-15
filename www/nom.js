import {Images} from "./images.js";
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

    const floors = [
        240,
        162,
        80
    ];


    // load stuff
    const images = new Images();
    images.load("floor.png");
    images.load("nom_c.png");
    images.load("nom_r.png");
    images.load("nom_l.png");

    const noms = [
        images.nom_c,
        images.nom_r,
        images.nom_c,
        images.nom_l,
    ];

    images.loaded(() => {
        mode = "game";
    });

    // painting
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

            for (let i=0; i<(size.x/64)+1; i++) {
                for (const floor of floors) {
                    canvas.drawImage(images.floor, (i*64)-offset, floor);    
                }
            }

            canvas.drawImage(noms[Math.floor(frame/6)], 64, floors[1] - 64);

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
}