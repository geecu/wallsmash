let ctx;
let socreSpan;

let numRows = 0;
let numCols = 0;

let balls = []
let game_state = 'aiming'
let mouse = {x:0, y:0}
let ball_start_pos
let particles = []

let currentLevel = 33

const level = `..........
....888...
.8.88888..
...88..88.`

const BALL_SPEED = 1200

const cells = [] 

level
.split('\n')
.map((k, row) => k
.split('')
.forEach((char, col) => cells.push([row, col, Number(char) *4 || 0 ])))

let frame_number = 0

function updateCellsForCurrentLevel() {

    //Shift each cell down one
    for (i=0; i<cells.length;i++) {
        let currentCell = cells[i];
        currentCell[0] += 1;
    }

    //create new row
    let numPossibleBricks = 10;
    let chanceOfBrick = 0.5;
    for (i=0; i<numPossibleBricks; i++) {
        let shouldAddBrick = Math.random() <= chanceOfBrick;
        let tempRow = 0;
        let tempCol = i;
        let tempVal = 0;
        if (shouldAddBrick) {
            tempVal = currentLevel;
        }
        newCell = [tempRow, tempCol, tempVal];
        cells.push(newCell);
    }
}

function tick(t){
    frame_number++
    const dt = (t - last) / 1000

    last = t
    requestAnimationFrame(tick)

    canvas.width = innerWidth * 1.5
    canvas.height = innerHeight * 1.5

    ctx.clearRect(0,0, canvas.width, canvas.height)


    // ctx.setTransform(1, 0, 0, 1, 0, 0);

    update_ball_positions(dt)
    update_particles(dt)
    render()

    if(game_state === 'playing'){

        if(balls.length < currentLevel) {
            const r = 10
            const x = ball_start_pos || canvas.width / 2
            const y = canvas.height - r

            const dx = mouse.x - x
            const dy = mouse.y - y
            const d = Math.sqrt(dx*dx + dy*dy)

            balls.push({
                x,
                y,
                vx:dx / d * BALL_SPEED,
                vy:dy / d * BALL_SPEED,
                r
            })
        } else {
            if(balls.every(ball => ball.gathered)) {
                balls = []

                //update to next level
                currentLevel++;
                socreSpan.innerHTML = String(currentLevel)
                updateCellsForCurrentLevel()

                //change game state
                game_state = 'aiming'
            }
        }

        balls
        .filter(ball => ball.done)
        .forEach(ball => {
            // console.log(ball_start_pos, ball.x, ball.gather_dir)
            const d = ball_start_pos - ball.x
            if(Math.abs(d) < 1e-8 || d / ball.gather_dir < 0) {
                ball.x = ball_start_pos
                ball.vx = 0
                ball.gathered = true
                // console.log('gathered', ball)
            }
        })


    }
}

function keyPressed(evt) {
    if (evt.keyCode == 32) {
        shoot();
    }
}

function touchMoved(evt) {
    if (game_state != 'aiming') {return};

    var rect = canvas.getBoundingClientRect();

    var x = evt.touches[0].pageX;
    var y = evt.touches[0].pageY;

    mouse = {
        x: (x - rect.left) * 2,
        y: (y - rect.top) * 2
    }
}

function shoot() {
    if(game_state === 'aiming'){
        balls = []
        game_state = 'playing'
    }
}

document.addEventListener('mousemove', e => {
    if(game_state != 'aiming') return;
    var rect = canvas.getBoundingClientRect();
    mouse = {
        x: (e.clientX - rect.left) * 2,
        y: (e.clientY - rect.top) * 2
    }
})

//for desktop: spacebar or mousedown to fire
document.addEventListener('keydown', keyPressed, true);
document.addEventListener('mousedown', shoot, true);
//for mobile: touchmove to pan around, touchend to fire
document.addEventListener('touchmove', touchMoved, true);
document.addEventListener('touchend', shoot, true);

//prevent scrolling on touchscreen
document.ontouchstart = function(e){ 
    if ('ontouchstart' in document.documentElement) {
        e.preventDefault(); 
    }
}

//once HTML loads, grab the canvas and score elements
window.onload = function() {
    ctx = canvas.getContext('2d');
    socreSpan = document.getElementById("score")
    socreSpan.innerHTML = String(currentLevel)
}



function render(){

    //supposed to be motion trails
    // this works bad for some reason
    // ctx.fillStyle = 'rgba(0,0,255,.3)'
    // balls.forEach(({x,y,vx,vy,r}) => {
    //     const v = Math.sqrt(vx*vx + vy*vy)

    //     ctx.beginPath()
    //     ctx.moveTo(x- vx/v * 60, y - vy/v * 60)
    //     ctx.lineTo(x+vx/v * r, y-vy/v*r)
    //     ctx.lineTo(x-vx/v * r, y+vy/v*r)
    //     ctx.closePath()
    //     ctx.fill()
    // })
    
    ctx.fillStyle = '#48f'
    balls.forEach(({x,y,vx,vy,r}) => {
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
    })

    const launcher_x = ball_start_pos || canvas.width / 2
    
    //launcher

    //if balls can be launched, display line between bottomcenter and mouse 
    if (game_state === 'aiming') {

        ctx.save();
        ctx.strokeStyle = '#aaa'
        ctx.beginPath();
        ctx.setLineDash([5, 15]);
        ctx.lineWidth=5;
        ctx.moveTo(launcher_x, canvas.height - 10);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke()
        ctx.restore()

        ctx.beginPath()
        ctx.arc(launcher_x, canvas.height - 10, 10, 0, Math.PI * 2)
        ctx.fill()
    }


    function drawcell(cell, bang){
        const [r,c,num] = cell

        if(!num) return;

        const { w,h, x,y} = get_cell_rect(r,c)
        if(bang) ctx.translate((Math.random() - .5)*4, (Math.random() - .5)*4);

        ctx.fillStyle = 'rgba(' + gradient('yiorrd', 1-(num / 32)) + ',1)'
        ctx.fillRect(w*c , h*r , w,h)

        ctx.textBaseline = 'middle' 
        ctx.textAlign = 'center' 
        ctx.font = '40px Avenir'
        ctx.fillStyle = 'black';
        ctx.fillText(num, w*(c+.5), h*(r+.5)+2)
        ctx.fillStyle = 'white';
        ctx.fillText(num, w*(c+.5), h*(r+.5))
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    cells.forEach(c => drawcell(c))
    cells.filter(cell=>cell.hit).forEach(c => drawcell(c, true))



    particles.forEach(({x,y,r, vx,vy, age, lifetime}) => {
        const alpha = (1 - age/lifetime)
        ctx.fillStyle = 'rgba(' + gradient('hotish', 1-alpha) + ',' + alpha / 3 + ')'
        ctx.strokeStyle = 'rgba(' + gradient('hotish', 1-alpha) + ',' + alpha  + ')'
        ctx.beginPath()
        // ctx.arc(x, y, r, 0, Math.PI * 2)
        // ctx.fill() 
        ctx.lineWidth = r 
        ctx.moveTo(x,y)
        ctx.lineTo(x+vx /10, y + vy / 10)  
        ctx.stroke()
    })
    ctx.fillStyle = 'black'

}


function update_ball_positions(dt){
    cells.forEach(cell => cell.hit = false)

    balls.forEach(ball => {
        const total_displacement_x = ball.vx * dt
        const total_displacement_y = ball.vy * dt
        const total_displacement = Math.sqrt(total_displacement_y*total_displacement_y + total_displacement_x*total_displacement_x)

        let partial_displacement = 0


        function creep(displacement){
            ball.x+= total_displacement_x / total_displacement * displacement
            ball.y+= total_displacement_y / total_displacement * displacement

            let hit = false

            let abx = 0, aby = 0
            let adx = 0, ady = 0

            let vhits = 0
            let dhits = 0

            cells.forEach(cell => {

                const [r,c,num] = cell

                if(!num) return;

                let b = bounce(get_cell_rect(r,c), ball)

                if(!b) return;

                cell[2]--
                cell.hit = true

                let [bx, by, d] = b

                var normal_len = bx*ball.vx + by*ball.vy

                let nx = bx*normal_len, ny = by*normal_len
                let amt = 1+1
                
                abx -= amt*nx
                aby -= amt*ny

                vhits++

                let amt2 = ball.r - d
                if(amt2 > 0){
                    adx += amt2*bx
                    ady += amt2*by
                    dhits++
                }
                // reset current transformation matrix to the identity matrix
                for (var i = 0; i < 1; i++) {
                    

                    const v = Math.random()
                    const k = 1+ Math.random()

                    particles.push({
                        age: 0,
                        x: ball.x,
                        y: ball.y,
                        r: 1,
                        vx: (ball.vx - k*nx) * v,
                        vy: (ball.vy - k*ny) * v ,
                        vr: 30,
                        ax: 0,
                        ay: 0,
                        ar: 0,
                        f: .1,
                        lifetime: 1
                    })
                }

            })

            if(vhits > 0){
                ball.vx += abx/vhits
                ball.vy += aby/vhits
            }

            if(dhits > 0){
                ball.x += adx / dhits
                ball.y += ady / dhits
            }

            return vhits > 0 || dhits > 0
        }



        while(total_displacement - partial_displacement > 10 && !creep(10)){
            partial_displacement += 10
        }

        const remaining_displacement = total_displacement - partial_displacement
        if(remaining_displacement <= 10 && remaining_displacement > 0) {
            creep(total_displacement - partial_displacement)
        }

        if(ball.x > canvas.width - ball.r) {
            ball.x = canvas.width - ball.r
            ball.vx *= -1
        }
        if(ball.x < ball.r) {
            ball.x = ball.r
            ball.vx *= -1
        }
        if(ball.y > canvas.height - ball.r) {
            ball.y = canvas.height - ball.r
            // ball.vy *= -1
            ball.vx = 0
            ball.vy = 0

            if(!balls.some(ball => ball.done)){
                ball_start_pos = ball.x
            } else {
                ball.vx = (ball_start_pos - ball.x) * (2 + Math.random())
                ball.gather_dir = (ball_start_pos - ball.x) || 1
            }
            ball.done = true
        }
        if(ball.y < ball.r) {
            ball.y = ball.r
            ball.vy *= -1
        }

        const v = Math.sqrt(ball.vx*ball.vx+ball.vy*ball.vy)
        if(v == 0) ball.gathered = true
        if(v > 0 && !ball.done){
            ball.vx *= BALL_SPEED / v
            ball.vy *= BALL_SPEED / v
        }
    })
}



function update_particles(dt){
    const new_particles = []
    particles.forEach(p => {
        if(p.age > p.lifetime) return;

        p.vx += p.ax * dt
        p.vy += p.ay * dt
        p.vx *= (1 - p.f)
        p.vy *= (1 - p.f)
        p.vr += p.ar * dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.r += p.vr * dt

        if(p.r < 0) return;
        p.age += dt
        new_particles.push(p)
    })
    particles = new_particles
}



function bounce (rect, circle) {
    // compute a c2c-to-c2c vector
    var half = { x: rect.w/2, y: rect.h/2 };
    var c2c = {
        x: circle.x - (rect.x+half.x),
        y: circle.y - (rect.y+half.y)};

    // check circle position inside the rectangle quadrant
    var side_dist = {
        x: Math.abs(c2c.x) - half.x,
        y: Math.abs(c2c.y) - half.y};
    if (side_dist.x >  circle.r || side_dist.y >  circle.r) return false // outside
    if (side_dist.x < -circle.r && side_dist.y < -circle.r) return false // inside
    
    if (side_dist.x < 0 || side_dist.y < 0) { // intersects side or corner
        var dx = 0, dy = 0, d = 0;
        if (Math.abs(side_dist.x) < circle.r && side_dist.y < 0){
            dx = c2c.x*side_dist.x < 0 ? -1 : 1;
            d = Math.abs(side_dist.x)
        } else if (Math.abs(side_dist.y) < circle.r && side_dist.x < 0){
            dy = c2c.y*side_dist.y < 0 ? -1 : 1;
            d = Math.abs(side_dist.y)
        }
        return [dx, dy, d];
    }

    // circle is near the corner
    let bounce = side_dist.x*side_dist.x + side_dist.y*side_dist.y  < circle.r*circle.r;
    if (!bounce) return false

    var norm = Math.sqrt (side_dist.x*side_dist.x+side_dist.y*side_dist.y);
    var dx = c2c.x < 0 ? -1 : 1;
    var dy = c2c.y < 0 ? -1 : 1;
    return [dx*side_dist.x/norm, dy*side_dist.y/norm, norm]
}

function get_cell_rect(r,c){
    const w = canvas.width / 10, h = 100
    return { w,h, x: w*c, y: h*r}
}



let last

requestAnimationFrame(t => {
    last = t
    requestAnimationFrame(tick)
})
