/**
 * Cell color index reference:
 * blue becomes yellow
 * yellow becomes red
 * red becomes black - loop back around to original cell color
 */

let SET_COUNT_MODE = false;
let COUNTDOWN_TIMER = 0;

let colorHash = {
    0: '#009', //BLUE
    1: '#ff0', //YELLOW
    2: '#900', //RED
    3: '#000' //BLACK
};

let colorIndex = {
    BLUE: 0, // TURN LEFT
    YELLOW: 1, // GO STRAIGHT
    RED: 2, // TURN RIGHT
    BLACK: 3 // TURN LEFT
};

// clockwise-direction - where the nose of the bot will be pointing
let noseDir = {
    NORTH: 0, // UP
    EAST: 1, // RIGHT
    SOUTH: 2, // DOWN
    WEST: 3 // LEFT
};

let g_canvas = { cell_size:10, wid:60, hgt:40 }; // JS Global var, w canvas size info.
let g_frame_cnt = 0; // Setup a P5 display-frame counter, to do anim
let g_frame_mod = 3; // Update ever 'mod' frames.
let g_stop = 0; // Go by default.

const sz = g_canvas.cell_size;
const sz2 = sz / 2;

function setup() // P5 Setup Fcn
{
    let sz = g_canvas.cell_size;
    let width = sz * g_canvas.wid;  // Our 'canvas' uses cells of given size, not 1x1 pixels.
    let height = sz * g_canvas.hgt;
    createCanvas( width, height );  // Make a P5 canvas.
    draw_grid( 10, 50, 'black', 'yellow');
}

// Initial values set for the bot - start position (30, 20) and initial color index is set to black, bot will be pointing North
let g_bot = { dir:noseDir.NORTH, x:30, y:20, color:colorIndex.BLACK };
let g_box = { t:1, hgt:40, l:1, wid:60 }; // Box in which bot can move.

/**
 * turnRight/turnLeft functions called based on bot movement to cell
 * Functions to increment or decrement the nose direction of the bot on the grid. As we use clockwise direction then turning right on the grid will be increment, left is decrement by 1
 */
let turnRight = () => {
    g_bot.dir++;
    // WEST has value of 3 and is the largest value, so set back to direction of NORTH (0) for direction as it cannot be higher
    if (g_bot.dir > noseDir.WEST) {
        g_bot.dir = noseDir.NORTH;
    }
}

let turnLeft = () => {
    g_bot.dir--;
    // Same as turnRight but instead when direction is NORTH (0) then turn left to change to WEST
    if (g_bot.dir < noseDir.NORTH) {
        g_bot.dir = noseDir.WEST;
    }
}

/**
 * Function to change x,y position for bot based on nose direction
 * In web pages the very top left corner is (0,0). This means going up on the y-axis (north) will be a decrement each time, while south is increment. Same for right/left.
 * Based on nose direction and as we move forward based on the direction, function decrements the y or x axis value accordingly.
 */
let moveForward = () => {
    if (g_bot.dir === noseDir.NORTH) {
        g_bot.y--;
    } else if (g_bot.dir === noseDir.EAST) {
        g_bot.x++;
    } else if (g_bot.dir === noseDir.SOUTH) {
        g_bot.y++;
    } else if (g_bot.dir === noseDir.WEST) {
        g_bot.x--;
    }
    g_bot.x = (g_bot.x + g_box.wid) % g_box.wid;
    g_bot.y = (g_bot.y + g_box.hgt) % g_box.hgt;
}

/**
 * Function for setCountMode - called when SET_COUNT_MODE is true
 * Upon entering setCountMode we check for whether countdown mode is already set or not, if not then move forward one cell and set the color index to the countdown timer, in turn starting countdown mode
 * If countdown mode and set count mode are both set, then loop in a straight direction with the current color index of the cell for the amount of times set for the timer
 * (In total, we move 2 extra steps upon entering both modes, and the timer will be anywhere between 0-3 steps. Min 2 moves forward and max of 5)
 */
let setCountMode = () => {
    // If countdown timer not set yet in set count mode, then move forward 1 more and then set timer to current color index
    if (COUNTDOWN_TIMER === 0) {
        moveForward();
        // Set countdown timer to current color index after move forward
        COUNTDOWN_TIMER = checkCellColor();
    } else {
        // if already in set count mode, then move forward no change in direction
        while (COUNTDOWN_TIMER >= 0) {
            draw_bot();
            moveForward();
            COUNTDOWN_TIMER--;
        }
        // Countdown timer set back at 0 so set count mode back to false and resume LR mode
        SET_COUNT_MODE = false;
        COUNTDOWN_TIMER = 0
    }
}

/**
 * Function to move the bot based on the current cells color index.
 * Direction for each cell color: Blue && Black cell = turn left, red cell = turn right, yellow cell = enter set count mode, go straight.
 */
function move_bot() {
    // Check what the current cell color is and draw cell color at the x,y position
    g_bot.color = checkCellColor();
    draw_bot();
    // if set count mode is true then call setCountMode
    if (SET_COUNT_MODE) {
        // Want to call function to let bot run while in this mode to either set countdown timer or have bot run straight with current cell color index
        setCountMode();
        // return here as we do not need to do anything else with bot movement based on color index while in this mode, so skip bottom statement
        return;
    }
    // switch state of cells based on current cell colorIndex
    switch (g_bot.color) {
        case 0: {
            // Blue cell means turn left
            turnLeft();
            moveForward();
            break;
        }
        case 1: {
            // Enter set count mode on yellow and move forward 1
            if (!SET_COUNT_MODE) {
                SET_COUNT_MODE = true;
            }
            moveForward();
            break;
        }
        case 2: {
            // Red cell means turn right
            turnRight();
            moveForward();
            break;
        }
        case 3: {
            // Black cell means turn left
            turnLeft();
            moveForward();
            break;
        }
    }
}

/**
 * checkCellColor - function that will check the current color index of the cell based on x, y position
 * @returns {number} - upon checking the rgba values of the cell, it will return the current cells color index for bot movement
 */
let checkCellColor = () => {
    // make global constants/variables when cleaning up
    let x = 1+ g_bot.x * sz; // Set x one pixel inside the sz-by-sz cell.
    let y = 1+ g_bot.y * sz;
    // console.log( "x,y,big = " + x + "," + y);

    // Get cell interior pixel color [RGBA] array.
    let acolors = get( x + sz2, y + sz2 );
    let red = acolors[0];
    let green = acolors[1];
    let blue = acolors[2];
    // let pix = red + green + blue;
    // console.log( "acolors,pix = " + acolors + ", " + pix );
    if (red && green) {
        return colorIndex.YELLOW;
    } else if (blue) {
        return colorIndex.BLUE;
    } else if (red) {
        return colorIndex.RED;
    } else {
        return colorIndex.BLACK;
    }
}

/**
 * Function to draw the bot and color the cell
 * Cells color index change is referenced for each at the top
 */
function draw_bot()
{
    let x = 1+ g_bot.x*sz; // Set x one pixel inside the sz-by-sz cell.
    let y = 1+ g_bot.y*sz;
    let big = sz - 2; // Stay inside cell walls.
    // stroke( 'white' ); // bot visiting this cell
    // Fill 'color': its a keystring, or a hexstring like "#5F", etc.  See P5 docs.

    // If bot color index is black, then color it blue, else it will color the cell based on the current bot color incremented by 1
    if (g_bot.color === 3) {
        fill(colorHash[0]);
        stroke(colorHash[0]);
    } else {
        fill(colorHash[g_bot.color+1]);
        stroke(colorHash[g_bot.color+1]);
    }

    // Paint the cell.
    rect( x, y, big, big );
}

function draw_update()  // Update our display.
{
    move_bot();
    // draw_bot( );
}

function draw()  // P5 Frame Re-draw Fcn, Called for Every Frame.
{
    // frameCountEvent
    ++g_frame_cnt;
    if (0 === g_frame_cnt % g_frame_mod)
    {
        if (!g_stop) draw_update();
    }
}

function keyPressed( )
{
    g_stop = !g_stop;
}

function mousePressed( )
{
    let x = mouseX;
    let y = mouseY;
    // console.log("mouse x,y = " + x + "," + y);
    let gridx = round( (x-0.5) / sz );
    let gridy = round( (y-0.5) / sz );
    // console.log( "grid x,y = " + gridx + "," + gridy );
    // console.log( "box wid,hgt = " + g_box.wid + "," + g_box.hgt );
    g_bot.x = gridx + g_box.wid; // Ensure its positive.
    // console.log( "bot x = " + g_bot.x );
    g_bot.x %= g_box.wid; // Wrap to fit box.
    g_bot.y = gridy + g_box.hgt;
    // console.log( "bot y = " + g_bot.y );
    g_bot.y %= g_box.hgt;
    // console.log( "bot x,y = " + g_bot.x + "," + g_bot.y );
}
