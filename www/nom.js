import {Images} from "./images.js";
import {Canvas} from "./canvas.js";

function debounce(callback, time) {
    let timer;
    return function() {
        clearTimeout(timer);
        timer = setTimeout(callback, time);
    };
}

function isTouchDevice() {
    return ('ontouchstart' in window) || navigator.maxTouchPoints>0 || navigator.msMaxTouchPoints>0;
}

const HEIGHT = 256;
const WIDTH = Math.floor(HEIGHT * 19.5 / 9);
const BLOCK_SIZE = 64;
const FLOORS = 3;
const FLOOR_HEIGHT = 16;
const LADDER_WIDTH = 32;
const LADDERS = 5;
const LADDER_MIN = 2;
const LADDER_MAX = 6;
const NOM_POS = 1;

export function nom(parentElement) {
    let debug = "hello";
    let mode = "loading";

    // load stuff
    const images = new Images();
    images.load("floor.png");
    images.load("ladder.png");
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
        start();
    });

    // painting
    const canvas = Canvas.new({
        parentElement,
        height: HEIGHT,
        width: WIDTH,
        forceLandscape: isTouchDevice(),
        touch: touch,
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

            canvas.drawImage(noms[frame % 4], NOM_POS * BLOCK_SIZE, floors[floor] - BLOCK_SIZE - climb);

            const offset = distance % BLOCK_SIZE;
            for (let i=0; i<(size.x/BLOCK_SIZE)+1; i++) {
                for (const floor of floors) {
                    canvas.drawImage(images.floor, (i*BLOCK_SIZE)-offset, floor);    
                }
            }
            for (let floor = 0; floor < FLOORS - 1; floor++) {
                for (const ladder of ladders[floor]) {
                    canvas.drawImage(images.ladder, ladder - distance, floors[floor] - BLOCK_SIZE);
                }
            }

            canvas.restore();
        }

        // full screen
        canvas
            .save()
            .font("8px monospace")
            .fillStyle("rgb(63, 63, 63)")
            .textAlign("center")
            .textBaseline("top")            
            .fillText("fullscreen", size.x/2, 5)
            .restore()

        // debug
        canvas
            .save()
            .font("8px monospace")
            .fillStyle("rgb(63, 255, 63)")
            .textBaseline("top")
            .fillText(debug, 5, 5)
            .restore()
    }

    // interaction
    parentElement.addEventListener("keydown", (event) => {
        switch (event.key) {
            case "ArrowUp":
                moveUp();
                break;
            case "ArrowDown":
                moveDown();
                break;
        }
    });

    let startPoint;
    function touch(event) {
        switch (event.type) {
            case "start":
                startPoint = event.point;
                break;
            case "move":
                if (!startPoint) {
                    startPoint = event.point;
                } else {
                    if (Math.abs(event.point.y - startPoint.y) > 5) {
                        if (event.point.y < startPoint.y) {
                            moveUp();
                        } else {
                            moveDown();
                        }
                        startPoint = undefined;
                    }
                }
                break;
            case "end":
                if (startPoint) {
                    if (Math.abs(event.point.y - startPoint.y) < 5) {
                        if (event.point.distanceTo(canvas.topCentre) < 40) {
                            if (document.fullscreenElement) {
                                document.exitFullscreen();
                            } else {
                                canvas.canvas.requestFullscreen()
                            }
                        }
                    }
                    startPoint = undefined;
                }
                break;
        }
    }

    // logic
    const floors = [];
    for (let floor = 0; floor < FLOORS; floor++) {
        floors[floor] = HEIGHT - (FLOOR_HEIGHT * (floor + 1)) - (BLOCK_SIZE * floor);
    }
    let floor;
    let climb;
    let distance;
    let direction;
    let move;

    const ladders = [];    
    
    let startTime;
    let frame;

    function start() {
        mode = "game";

        floor = 1;
        climb = 0;
        distance = 0;
        direction = 0;
        move = 0;

        for (let floor = 0; floor < FLOORS - 1; floor++) {
            ladders[floor] = [];
            ladders[floor][0] = (Math.floor(Math.random() * LADDER_MAX) + LADDER_MIN + (NOM_POS * 2)) * BLOCK_SIZE;
            for (let ladder = 1; ladder < LADDERS; ladder++) {
                ladders[floor][ladder] = ((Math.floor(Math.random() * LADDER_MAX) + LADDER_MIN) * BLOCK_SIZE) + ladders[floor][ladder-1];
            }
        }

        startTime = undefined;

        requestAnimationFrame(animate);
    }

    function moveUp() {
        if (floor < FLOORS-1) {
            if (ladders[floor].map(ladder => (ladder - distance) / BLOCK_SIZE).find(ladder => ladder > NOM_POS + 0.25 && ladder < NOM_POS + 1.25)) {
                debug = "up";
                move = 1;
            }
        }
    }
    function moveDown() {
        if (floor > 0) {
            if (ladders[floor-1].map(ladder => (ladder - distance) / BLOCK_SIZE).find(ladder => ladder > NOM_POS + 0.25 && ladder < NOM_POS + 1.25)) {
                debug = "down";
                move = -1;
            }
        }
    }

    function animate(currentTime) {
        if (startTime === undefined) {
            startTime = currentTime;
        }
        const elapsedTime = currentTime - startTime;

        if (mode == "game") {
            frame = Math.round(elapsedTime / 60);
            let delta = Math.min(Math.round(elapsedTime / 5), 4);

            if (direction == 0 && move != 0) {
                if (ladders[move > 0 ? floor : floor-1].map(ladder => (ladder - distance) / BLOCK_SIZE).find(ladder => ladder > NOM_POS && ladder < NOM_POS + 0.3)) {
                    direction = move;
                }
            }

            if (direction == 0) {
                distance += delta;
                for (let floor = 0; floor < 2; floor++) {
                    if (ladders[floor][0] < distance - 32) {
                        ladders[floor].shift();
                        ladders[floor].push(((Math.floor(Math.random() * LADDER_MAX) + LADDER_MIN) * BLOCK_SIZE) + ladders[floor][LADDERS-2]);
                    }
                }
            } else {
                if (climb < BLOCK_SIZE && climb > -BLOCK_SIZE) {
                    climb += delta * direction;
                } else {
                    floor += direction;
                    move = 0;
                    climb = 0;
                    direction = 0;
                    debug = "";
                }
            }            
        }
        paint();
        requestAnimationFrame(animate);
    }
}