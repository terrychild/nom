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

const DEBUG = false;

const FPS = 60;
const HEIGHT = 336;
const WIDTH = Math.floor(HEIGHT * 19.5 / 9);
const BLOCK_SIZE = 64;
const BLOCKS_X = Math.ceil(WIDTH / BLOCK_SIZE) + 1;
const WIGGLE = 4;
const FLOORS = 4;
const FLOOR_HEIGHT = 16;
const LADDER_WIDTH = 32;
const LADDER_CHANCE = 0.25;
const LADDER_MIN = 2;
const LADDER_MAX = 6;
const SNACK_Y = 20;
const SNACK_CHANCE = 0.183;
const NOM_POS = 1;

export function nom(parentElement) {
    let debug = "hello";
    let mode = "loading";

    // load stuff
    const images = new Images();
    images.load("floor.png");
    images.load("ladder.png");
    images.load("nom_c.png");
    images.load("nom_co.png");
    images.load("nom_r.png");
    images.load("nom_ro.png");
    images.load("nom_l.png");
    images.load("nom_lo.png");

    const noms = [
        [images.nom_c, images.nom_co],
        [images.nom_r, images.nom_ro],
        [images.nom_c, images.nom_co],
        [images.nom_l, images.nom_lo],
    ];

    images.loaded(() => {
        start();
    });

    // snack styles
    const snack_scores = [];
    snack_scores.push(...Array.from({length: 500}, (v) => 1));
    snack_scores.push(...Array.from({length: 200}, (v) => 3));
    snack_scores.push(...Array.from({length: 100}, (v) => 5));
    snack_scores.push(...Array.from({length: 50}, (v) => 10));
    snack_scores.push(...Array.from({length: 30}, (v) => 30));
    snack_scores.push(...Array.from({length: 10}, (v) => 50));
    snack_scores.push(...Array.from({length: 5}, (v) => 100));
    snack_scores.push(...Array.from({length: 3}, (v) => 300));
    snack_scores.push(...Array.from({length: 1}, (v) => 500));

    const snack_styles = [];
    snack_styles[1] = "rgb(0, 191, 0)";
    snack_styles[3] = "rgb(0, 0, 223)";
    snack_styles[5] = "rgb(191, 0, 0)";
    snack_styles[10] = "rgb(0, 255, 0)";
    snack_styles[30] = "rgb(0, 0, 255)";
    snack_styles[50] = "rgb(255, 0, 0)";
    snack_styles[100] = "rgb(255, 0, 255)";
    snack_styles[300] = "rgb(255, 165, 0)";
    snack_styles[500] = "rgb(63, 63, 63)";

    const snack_sizes = [];
    snack_sizes[1] = 4;
    snack_sizes[3] = 4;
    snack_sizes[5] = 4;
    snack_sizes[10] = 6;
    snack_sizes[30] = 6;
    snack_sizes[50] = 6;
    snack_sizes[100] = 8;
    snack_sizes[300] = 8;
    snack_sizes[500] = 8;

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

            // nom
            canvas.drawImage(noms[Math.floor(frame / 5) % noms.length][snacks[floor][square] > 0 && offsetX > (BLOCK_SIZE / 2) ? 1 : 0], NOM_POS * BLOCK_SIZE, floors[floor] - BLOCK_SIZE - offsetY);

            // floors
            for (let floor = 0; floor < FLOORS; floor++) {
                for (let x=0; x<BLOCKS_X; x++) {
                    // floor
                    canvas.drawImage(images.floor, (x * BLOCK_SIZE) - offsetX, floors[floor]);

                    // ladder
                    if (ladders[floor][x]) {
                        canvas.drawImage(images.ladder, (x * BLOCK_SIZE) - offsetX + ((BLOCK_SIZE - LADDER_WIDTH) / 2), floors[floor] - BLOCK_SIZE);
                    }

                    // snack
                    if (snacks[floor][x] > 0) {
                        canvas
                            .save()
                            .fillStyle(snack_styles[snacks[floor][x]])
                            .beginPath()
                            .arc((x * BLOCK_SIZE) - offsetX + (BLOCK_SIZE / 2), floors[floor] - SNACK_Y, snack_sizes[snacks[floor][x]], 0, 2 * Math.PI)
                            .fill()
                            .restore();
                    }

                    // grid
                    if (DEBUG) {
                        canvas
                            .save()
                            .strokeStyle("rgb(255, 255, 255)")
                            .strokeRect((x * BLOCK_SIZE) - offsetX, floors[floor] - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE)
                            .restore();
                    }
                }
            }

            // active square
            if (DEBUG) {
                canvas
                    .save()
                    .strokeStyle("rgb(0, 255, 0)")
                    .strokeRect((square * BLOCK_SIZE) - offsetX, floors[floor] - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE)
                    .restore();

                if (aligned) {
                    canvas
                        .save()
                        .strokeStyle("rgb(255, 0, 0)")
                        .strokeRect((square * BLOCK_SIZE) - offsetX, floors[floor] - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE)
                        .restore();
                }
            }

            // score
            canvas
                .save()
                .font("8px monospace")
                .fillStyle("rgb(255, 255, 255)")
                .textAlign("right")
                .textBaseline("top")            
                .fillText(score, size.x-20, 5)
                .restore()
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

        // debug text
        if (DEBUG) {
            canvas
                .save()
                .font("8px monospace")
                .fillStyle("rgb(63, 255, 63)")
                .textBaseline("top")
                .fillText(debug, 20, 5)
                .restore()
        }
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
    let snack_floor;
    let square;
    let aligned;
    let offsetX;
    let offsetY;
    let direction;
    let move;
    let speed;

    const ladders = [];
    const snacks = [];

    let score;
    
    let startTime;
    let frame;

    function start() {
        mode = "game";

        floor = 1;
        snack_floor = 1;
        square = NOM_POS;
        aligned = true;
        offsetX = 0;
        offsetY = 0;
        direction = 0;
        move = 0;
        speed = 3;

        for (let floor = 0; floor < FLOORS; floor++) {
            ladders[floor] = Array.from({length: BLOCKS_X}, (v) => false);
            snacks[floor] = Array.from({length: BLOCKS_X}, (v) => 0);
        }

        score = 0;

        startTime = undefined;
        frame = 0;

        requestAnimationFrame(animate);
    }

    function moveUp() {
        if (floor < FLOORS-1) {
            if (ladders[floor][square]) {
                debug = "up";
                move = 1;5
            }
        }
    }
    function moveDown() {
        if (floor > 0) {
            if (ladders[floor-1][square]) {
                debug = "down";
                move = -1;
            }
        }
    }

    function animate(currentTime) {
        if (startTime === undefined) {
            startTime = currentTime;
        }
        const newFrame = Math.round((currentTime - startTime) / 1000 * FPS) % FPS;
        const delta = (newFrame - frame + (newFrame < frame ? FPS : 0)) * speed;
        frame = newFrame;

        if (mode == "game") {
            if (aligned && direction == 0 && move != 0) {
                direction = move;
            }

            if (direction == 0) {
                offsetX += delta;

                if (offsetX > BLOCK_SIZE) {
                    offsetX %= BLOCK_SIZE;
                    for (let floor = 0; floor < FLOORS; floor++) {
                        if (floor < FLOORS - 1) {
                            ladders[floor].shift();
                            if (floor > 0 && ladders[floor - 1][BLOCKS_X - 1]) {
                                ladders[floor].push(false);
                            } else if(floor < FLOORS - 1 && ladders[floor + 1][BLOCKS_X - 1]) {
                                ladders[floor].push(false);
                            } else {
                                const lastLadder = BLOCKS_X - ladders[floor].lastIndexOf(true) - 1;
                                if (lastLadder < LADDER_MIN) {
                                    ladders[floor].push(false);
                                } else if (lastLadder > LADDER_MAX) {
                                    ladders[floor].push(true);
                                } else {
                                    ladders[floor].push(Math.random() < LADDER_CHANCE);
                                }
                            }
                        }

                        snacks[floor].shift();
                        if (ladders[floor][BLOCKS_X - 1] || (floor > 0 && ladders[floor - 1][BLOCKS_X - 1])) {
                            snacks[floor].push(0);
                        } else if (floor == snack_floor || Math.random() < SNACK_CHANCE) {
                            snacks[floor].push(snack_scores[Math.floor(Math.random() * snack_scores.length)]);
                        } else {
                            snacks[floor].push(0);
                        }
                    }

                    if (ladders[snack_floor][BLOCKS_X - 1]) {
                        snack_floor += 1;
                    } else if (snack_floor > 0 && ladders[snack_floor - 1][BLOCKS_X - 1]) {
                        snack_floor -= 1;
                    }
                }

                square = offsetX < WIGGLE ? NOM_POS : NOM_POS + 1;
                aligned = offsetX < WIGGLE || offsetX > BLOCK_SIZE - WIGGLE;

                if (aligned && snacks[floor][square] > 0) {
                    score += snacks[floor][square];
                    snacks[floor][square] = 0;
                }
            } else {
                if (offsetY < BLOCK_SIZE + FLOOR_HEIGHT && offsetY > -(BLOCK_SIZE + FLOOR_HEIGHT)) {
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