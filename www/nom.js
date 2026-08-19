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
const BLOCKS_X = Math.ceil(WIDTH / BLOCK_SIZE) + 1;
const FLOORS = 3;
const FLOOR_HEIGHT = 16;
const LADDER_WIDTH = 32;
const LADDER_CHANCE = 0.183;
const LADDER_MIN = 2;
const LADDER_MAX = 6;
const SNACK_Y = 20;
const SNACK_SIZE = 4;
const SNACK_CHANCE = 0.333;
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

            canvas.drawImage(noms[frame % 4], NOM_POS * BLOCK_SIZE, floors[floor] - BLOCK_SIZE - offsetY);

            for (let i=0; i<(size.x/BLOCK_SIZE)+1; i++) {
                for (const floor of floors) {
                    canvas.drawImage(images.floor, (i * BLOCK_SIZE) - offsetX, floor);
                }
            }
            
            for (let floor = 0; floor < FLOORS; floor++) {
                for (let x=0; x<BLOCKS_X; x++) {
                    if (floor < FLOORS - 1 && ladders[floor][x]) {
                        canvas.drawImage(images.ladder, (x * BLOCK_SIZE) - offsetX + ((BLOCK_SIZE - LADDER_WIDTH) / 2), floors[floor] - BLOCK_SIZE);
                    }
                    if (snacks[floor][x]) {
                        canvas
                            .save()
                            .fillStyle("rgb(255, 255, 255)")
                            .beginPath()
                            .arc((x * BLOCK_SIZE) - offsetX + (BLOCK_SIZE / 2), floors[floor] - SNACK_Y, SNACK_SIZE, 0, 2 * Math.PI)
                            .fill()
                            .restore();
                    }

                    canvas
                        .save()
                        .strokeStyle("rgb(255, 255, 255)")
                        .strokeRect((x * BLOCK_SIZE) - offsetX, floors[floor] - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE)
                        .restore();
                }
            }
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
    let offsetX;
    let offsetY;
    let direction;
    let move;

    const ladders = [];
    const snacks = [];
    
    let startTime;
    let frame;

    function start() {
        mode = "game";

        floor = 1;
        offsetX = 0;
        offsetY = 0;
        direction = 0;
        move = 0;

        for (let floor = 0; floor < FLOORS; floor++) {
            if (floor < FLOORS - 1) {
                ladders[floor] = Array.from({length: BLOCKS_X}, (v) => false);
                ladders[floor][NOM_POS + LADDER_MIN + Math.floor(Math.random() * (BLOCKS_X - NOM_POS - LADDER_MIN))] = true;
            }
            snacks[floor] = Array.from({length: BLOCKS_X}, (v) => false);
        }

        startTime = undefined;

        requestAnimationFrame(animate);
    }

    function moveUp() {
        if (floor < FLOORS-1) {
            if (ladders[floor][NOM_POS + 1]) {
                debug = "up";
                move = 1;5
            }
        }
    }
    function moveDown() {
        if (floor > 0) {
            if (ladders[floor-1][NOM_POS + 1]) {
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
                if (offsetX < 4 || offsetX > BLOCK_SIZE - 4) {
                    direction = move;
                }
            }

            if (direction == 0) {
                offsetX += delta;
                if (offsetX > BLOCK_SIZE) {
                    offsetX %= BLOCK_SIZE;
                    for (let floor = 0; floor < FLOORS; floor++) {
                        if (floor < FLOORS - 1) {
                            ladders[floor].shift();
                            let lastLadder = BLOCKS_X - ladders[floor].lastIndexOf(true) - 1;
                            ladders[floor].push(lastLadder > LADDER_MAX ? true : lastLadder < LADDER_MIN ? false : Math.random() < LADDER_CHANCE);
                        }
                        snacks[floor].shift();
                        snacks[floor].push(floor == FLOORS - 1 || !ladders[floor][BLOCKS_X - 1] ? Math.random() < SNACK_CHANCE : false);
                    }
                }
            } else {
                if (offsetY < BLOCK_SIZE && offsetY > -BLOCK_SIZE) {
                    offsetY += delta * direction;
                } else {
                    floor += direction;
                    move = 0;
                    offsetY = 0;
                    direction = 0;
                    debug = "";
                }
            }            
        }
        paint();
        requestAnimationFrame(animate);
    }
}