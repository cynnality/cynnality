// sketch1
const sketch1 = (p) => {
  let cloudOneX = 50; 

  p.setup = () => {
    p.createCanvas(400, 400);
    p.frameRate(15);
  };

  p.draw = () => {
    p.background('lightblue');

    // moon
    p.fill(255);
    p.stroke('lightblue');
    p.circle(350, 50, 100);
    p.fill('lightblue');
    p.circle(320, 50, 100);

    // gray mountains
    p.stroke(0);
    p.fill(80);
    p.triangle(-40, 300, 75, 100, 250, 300);
    p.triangle(100, 300, 300, 100, 500, 300);

    // grass
    p.fill('rgb(50,76,50)');
    p.rect(0, 300, 400, 100);

    // cloud
    p.fill(255);
    p.ellipse(cloudOneX, 50, 80, 40);
    p.ellipse(cloudOneX - 40, 100, 60, 20);
    p.ellipse(cloudOneX + 20, 150, 40, 10);
    cloudOneX = p.frameCount % p.width;

    p.fill(255);
    p.text(`${p.mouseX}, ${p.mouseY}`, 20, 30);
  };
};


// sketch2 (chatgpt generated from a question i had about several canvases in one file)
const sketch2 = (p) => {
  p.setup = () => {
    p.createCanvas(400, 200);
    p.background(30);
  };

  p.draw = () => {
    p.fill(0, 255, 0);
    p.rect(p.mouseX, p.mouseY, 50, 50);
  };
};



// sketch#3 - flowers
const meadowFlowers = (meadow) => {
    let flowers = [];

    meadow.setup = () => {
        meadow.createCanvas(400, 400);
        meadow.frameRate(15); //setting frame rate to 15

        flowerPower();
    }

    meadow.draw = () => {
        meadow.background('lightblue');

        updateAndDrawFlowers();
    }

   meadow.mousePressed = () => {
        let flower = createFlower();
        flower.x = meadow.mouseX;
        flower.y = meadow.mouseY;
        flowers.push(flower);
        }

    function updateAndDrawFlowers ()  {
        for (let flower of flowers) {
            //drawing flower
            drawFlower(flower);
            //applying wilting effect: reducing size by 1%
            flower.size *= 0.99;
            //reducing lifespan
            flower.lifespan -= 1;
            if (flower.lifespan <=0) {
                // save index of the flower
                let i = flowers.indexOf(flower);
                //removing wilted flower
                flowers.splice(i, 1);
            }
        }
    }

    //creating 20 flowers
    function flowerPower() {
        for (let i = 0; i < 20; i += 1 ) {
            //putting flowers in random locations
            let flower1 = createFlower();
            //adding flowers to array
            flowers.push(flower1);
        }
    }

    function createFlower () {
    //defining a flower object
    let flower = {
        x: meadow.random(20, 380),
        y: meadow.random(20, 380),
        size: meadow.random(20, 75),
        lifespan: meadow.random(255, 300),
        color: meadow.color(meadow.random(255), meadow.random(255), meadow.random(255)),
    };
    //return the flower object
    return flower;
    }

    function drawFlower(flower) {
        meadow.noStroke();
        meadow.fill(flower.color);
        //petals
        meadow.ellipse(flower.x, flower.y, flower.size / 2, flower.size);
        meadow.ellipse(flower.x, flower.y, flower.size, flower.size / 2);
        //draw yellow center
        meadow.fill(255, 204, 0);
        meadow.circle(flower.x, flower.y, flower.size / 2);
    }
}

// sketch#4 - example of arrays
const exampleArray = (exrray) => { // arrow function: receives one argument, the p5 instance at the end of file "new p5()"

    let flowers = ["Rose", "Daisy", "Tulip"];

    exrray.setup = () => {
        exrray.createCanvas(200, 200);
        exrray.background(220);

        exrray.fill('red');
        exrray.text(flowers[0], 10, 50); // [] #of item in array, posX, posY

        exrray.fill('green');
        exrray.text(flowers[1], 10, 100);

        exrray.fill('blue');
        exrray.text(flowers[2], 10, 150);
    };
}

const gridColor = (grid) => {
    let size = 20;
    let c = [];

    grid.setup = () => {
        grid.createCanvas(400, 400);
        grid.cols = grid.width / size;
        grid.rows = grid.height / size;

        for (let i=0; i<grid.cols; i++){
                c[i] = [];
                for (let j=0; j<grid.rows; j++){
                    c[i][j] = grid.color(
                        grid.random(25), grid.random(256), grid.random(256)
                    );
                }
            }
        }

    grid.draw = () => {
        grid.background(220);
        for (let i=0; i<grid.cols; i++) {
            for (let j=0; j<grid.rows; j++) {
                grid.fill(c[i][j]);
                grid.rect(i*size, j*size, size, size);
            }
        }
    }
}

// Create all p5 instances and attach them to the HTML elements
new p5(sketch1, "canvas1");
new p5(sketch2, "canvas2");
new p5(meadowFlowers, "canvas3");
new p5(exampleArray, "canvas4");
new p5(gridColor, "canvas5");
