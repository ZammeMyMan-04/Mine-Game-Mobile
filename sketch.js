// --- GLOBALA VARIABLER ---
let deadZoneSizeX, deadZoneSizeY;
let player;
let amount_ores;
let ores = [];
let minePath = []; // Döpt om från 'mine' för att undvika förvirring med klassen Mine

// Variabler för touch/mus-kontroller
let touchTimer = 0;
let touchThreshold = 20; // Antal frames som räknas som "klick" istället för "drag"
let isTouching = false;
let dragStartPoint = null;

const tnt = '#C41010';
const fuel = '#4ED821';
const silver = '#BFBFBF';
const gold = '#E8CD00';
const bgColor = 0;
const oreType = [tnt, fuel, silver, gold];

let lightSize = 60;
let score = 0;
let highscore = 0; // Fixat från highscore = score
let drillPower = 10;

const MENU = 1;
const PLAY = 2;
const GAME_OVER = 3;
let game_state = MENU;

// --- SETUP OCH DRAW ---
function setup() {
  // Skapar en canvas som passar skärmen men max 1000x1000
  let canvasSize = min(windowWidth, windowHeight, 1000);
  createCanvas(canvasSize, canvasSize); 
  
  // Förhindra att sidan scrollar när man drar med fingret på mobilen
  document.body.addEventListener('touchstart', function(e){ e.preventDefault(); }, {passive: false});
  document.body.addEventListener('touchmove', function(e){ e.preventDefault(); }, {passive: false});

  deadZoneSizeX = width / 10;
  deadZoneSizeY = height / 10;
  amount_ores = (width - 2 * deadZoneSizeX) * (height - 2 * deadZoneSizeY) / 1500;
  player = new Player();

  for (let i = 0; i < amount_ores; i++) {
    ores.push(new Ore(oreType[floor(random(oreType.length))], i));
  }
  minePath.push(new Mine(player.pos.x, player.pos.y));
}

function draw() {
  if (isTouching) {
    touchTimer++; // Räknar upp så länge fingret är på skärmen
  }

  noStroke();
  background(0);

  switch (game_state) {
    case MENU: menuScreen(); break;
    case PLAY: playScreen(); break;
    case GAME_OVER: gameOverScreen(); break;
  }

  player.move(); // Anropar rörselse-logiken
  player.display(lightSize);
  drawDeadZone();
  statsScreen();
}

// --- KONTROLLER ---
// mousePressed körs även vid "Tap" på mobilen
function mousePressed() {
  touchStarted();
  return false;
}

function mouseReleased() {
  touchEnded();
  return false;
}

// Vi lägger till touchStarted för att vara extra säkra på mobilen
function touchStarted() {
  if (game_state === MENU) {
    game_state = PLAY;
  } else if (game_state === PLAY) {
    // Sätt startvärden när skärmen vidrörs (Punkt A)
    isTouching = true;
    touchTimer = 0;
    dragStartPoint = createVector(mouseX, mouseY);
  } else if (game_state === GAME_OVER) {
     isTouching = true;
     touchTimer = 0;
     dragStartPoint = createVector(mouseX, mouseY);
  }
  return false; // Förhindrar scroll
}

function touchEnded() {
  if (game_state === PLAY && isTouching) {
    // Om vi släpper fingret och timern är under gränsen (t.ex. 20 frames) -> Gräv!
    // (Tips: 40 frames är nästan en hel sekund i 60fps, så 15-20 brukar kännas mer som ett "klick")
    if (touchTimer < touchThreshold) {
      minePath.push(new Mine(player.pos.x, player.pos.y));
      drillPower--;
    }
    // Nollställ när man släpper
    isTouching = false;
    dragStartPoint = null;
  } 
  else if (game_state === GAME_OVER && touchTimer < touchThreshold) {
    resetGame();
  }
  return false;
}

/*function handleAction() {
  if (game_state === MENU) {
    game_state = PLAY;
  } else if (game_state === PLAY) {
    minePath.push(new Mine(player.pos.x, player.pos.y));
    drillPower--;
  }
}*/

function keyPressed() {
  if (key === 'r' && game_state === GAME_OVER) {
    resetGame();
  }
}

function resetGame() {
  ores = [];
  minePath = [];
  for (let i = 0; i < amount_ores; i++) {
    ores.push(new Ore(oreType[floor(random(oreType.length))], i));
  }
  player.respawn();
  minePath.push(new Mine(player.pos.x, player.pos.y));
  lightSize = 60;
  score = 0;
  drillPower = 10;
  game_state = MENU;
}

// --- HJÄLPFUNKTIONER ---
function explode(center) {
  let explosionSize = 5;
  let explodeRadius = 20;
  for (let i = 0; i < explosionSize; i++) {
    let x = random(center.x - explodeRadius, center.x + explodeRadius);
    let y = random(center.y - explodeRadius, center.y + explodeRadius);
    minePath.push(new Mine(x, y));
  }
}

function statsScreen() {
  textSize(15);
  textAlign(LEFT, TOP); 
  fill(255);
  text("Drill power: " + drillPower, 5, 15);
  text("Score: " + score, 5, 30);
  text("Highscore: " + highscore, 5, 45);
}

function drawDeadZone() {
  fill(0);
  rect(0, 0, width, deadZoneSizeY);
  rect(0, 0, deadZoneSizeX, height);
  rect(0, height - deadZoneSizeY, width, deadZoneSizeY);
  rect(width - deadZoneSizeX, 0, deadZoneSizeX, height);
  stroke(255, 100);
  strokeWeight(3);
  noFill();
  rect(deadZoneSizeX, deadZoneSizeY, width - 2 * deadZoneSizeX, height - 2 * deadZoneSizeY);
}

// --- SPELLÄGEN (SCENES) ---
function menuScreen() {
  textSize(100);
  textAlign(CENTER, CENTER);
  text("> MINE GAME <", width / 2, height / 2 - 200);
  textSize(40);
  text("Click to mine", width / 2, height / 2 + 100);

  text("Ores:", deadZoneSizeX + 100, height / 2);
  for (let i = 0; i < oreType.length; i++) {
    fill(oreType[i]);
    ellipse(deadZoneSizeX + 50, height / 2 + 60 + 40 * i, ores[0].size, ores[0].size);
    textAlign(LEFT, CENTER);
    textSize(18);
    fill(255);
    
    // Använder let oreSample = ores[0] för att hämta värden säkert
    let oreSample = ores[0];
    if (i === 0) text("- tnt (explode)", deadZoneSizeX + 50 + 10, height / 2 + 60 + 40 * i - 5);
    if (i === 1) text(" - fuel (+" + oreSample.getValue(fuel) + " drill power)", deadZoneSizeX + 50 + 10, height / 2 + 60 + 40 * i - 5);
    if (i === 2) text(" - silver (+" + oreSample.getValue(silver) + "p)", deadZoneSizeX + 50 + 10, height / 2 + 60 + 40 * i - 5);
    if (i === 3) text(" - gold (+" + oreSample.getValue(gold) + "p)", deadZoneSizeX + 50 + 10, height / 2 + 60 + 40 * i - 5);
  }

  for (let path of minePath) path.display(player);
  for (let ore of ores) ore.display(player);
}

function playScreen() {
  for (let path of minePath) path.display(player);

  // Vi loopar baklänges här för att säkert kunna ta bort element (ores) från listan utan problem
  for (let i = ores.length - 1; i >= 0; i--) {
    let ore = ores[i];
    if (player.overlapse(ore)) {
      ore.applyValue();
      if (ore.type === tnt) explode(ore.pos);
      ores.splice(i, 1); // Tar bort oren från arrayen
    } else {
      ore.display(player);
    }
  }

  if (drillPower === -1) {
    game_state = GAME_OVER;
    drillPower = 0;
  }
  highscore = score > highscore ? score : highscore;

  // --- RITA LINJEN FRÅN A TILL B ---
  if (game_state === PLAY && isTouching && dragStartPoint) {
    
    // Vi kollar om vi har dragit fingret tillräckligt långt (mer än 5 pixlar)
    // Detta för att undvika att linjen blinkar till vid ett snabbt klick (grävning)
    let currentMousePoint = createVector(mouseX, mouseY);
    if (dragStartPoint.dist(currentMousePoint) > 5) {
      
      stroke(255);       // Sätt linjefärgen till vit
      strokeWeight(1);   // Gör linjen tunn (1 pixel)
      
      // Rita linjen från Punkt A (start) till Punkt B (nuvarande position)
      line(dragStartPoint.x, dragStartPoint.y, mouseX, mouseY);
      
      noStroke();        // VIKTIGT: Återställ så andra figurer inte får en ram
    }
  }
}

function gameOverScreen() {
  lightSize = 1500;

  for (let path of minePath) path.display(player);
  for (let ore of ores) ore.display(player);

  textSize(100);
  textAlign(CENTER, CENTER);
  fill(255);
  text("GAME OVER!", width / 2, height - deadZoneSizeY - 200);
  text("SCORE: " + score, width / 2, deadZoneSizeY + 100);
  textSize(25);
  text("HIGHSCORE: " + highscore, width / 2, deadZoneSizeY + 175);
  text("Mine size: " + minePath.length, width / 2, deadZoneSizeY + 215);
  textSize(50);
  text("Press 'r' to reset", width / 2, height - deadZoneSizeY - 100);
}

// --- KLASSER ---
class Player {
  constructor() {
    this.size = 12;
    this.r = this.size / 2;
    this.c = color('#2495A2');
    this.pos = createVector(width / 2, height / 2);
  }

  respawn() {
    this.pos = createVector(width / 2, height / 2);
  }

  overlapse(ore) {
    return this.pos.dist(ore.pos) < this.r;
  }

  /*move() {
    // VIKTIGT: mouseIsPressed är sann om man håller ner musen ELLER håller fingret på skärmen
    if (mouseIsPressed && game_state === PLAY) {
      let target = createVector(mouseX, mouseY);
      
      // Kolla om vi är tillräckligt långt bort från fingret/musen för att undvika "jitter"
        if (this.pos.dist(target) > 2) {
            let dir = p5.Vector.sub(target, this.pos);
            dir.normalize();
                    
            let nextPos = p5.Vector.add(this.pos, dir);

            // Kolla om nästa position är på en grävd gång (Mine)
            let onPath = false;
            for (let m of minePath) {
                if (nextPos.dist(m.pos) <= m.size / 2) {
                    onPath = true;
                    break;
                }
            }

            // Flytta bara om vi är på en gång och innanför spelplanen
            if (onPath && 
                nextPos.x > deadZoneSizeX && nextPos.x < width - deadZoneSizeX &&
                nextPos.y > deadZoneSizeY && nextPos.y < height - deadZoneSizeY) {
                this.pos.add(dir);
            }
        }
    }*/
    move() {
        // Rör oss bara om fingret/musen hålls ner och vi har en startpunkt (A)
        if (mouseIsPressed && dragStartPoint && game_state === PLAY) {
        
            let dragCurrentPoint = createVector(mouseX, mouseY); // Punkt B
            
            // Vi kollar så att vi faktiskt har dragit fingret litegrann (mer än 5 pixlar). 
            // Annars "skakar" spelaren till om man bara vill klicka.
            if (dragStartPoint.dist(dragCurrentPoint) > 5) {
                
                // Skapa rörelsevektorn från A till B och normalisera den
                let dir = p5.Vector.sub(dragCurrentPoint, dragStartPoint);
                dir.normalize();
                
                let nextPos = p5.Vector.add(this.pos, dir);

                // Kolla om nästa position är på en grävd gång (Mine)
                let onPath = false;
                for (let m of minePath) {
                if (nextPos.dist(m.pos) <= m.size / 2) {
                    onPath = true;
                    break;
                }
                }

                // Flytta om vi är på en gång och innanför spelplanen
                if (onPath && 
                    nextPos.x > deadZoneSizeX && nextPos.x < width - deadZoneSizeX &&
                    nextPos.y > deadZoneSizeY && nextPos.y < height - deadZoneSizeY) {
                this.pos.add(dir);
                }
            }
        }
    }

  display(lSize) {
    noStroke();
    fill(214, 173, 9, 30);
    ellipse(this.pos.x, this.pos.y, lSize, lSize);
    fill(this.c);
    ellipse(this.pos.x, this.pos.y, this.size, this.size);
  }
}

class Mine {
  constructor(xPos, yPos) {
    this.pos = createVector(xPos, yPos);
    this.size = player.size * 3;
    this.r = this.size / 2;
    this.c = color('#797975');
  }

  calculateAlpha(p) {
    let d = this.pos.dist(p.pos);
    if (d <= lightSize / 2 + this.r) {
      if (d <= lightSize / 4 + this.r) return 200;
      return 50;
    }
    return 30;
  }

  display(p) {
    let alphaVal = this.calculateAlpha(p);
    let cWithAlpha = color(red(this.c), green(this.c), blue(this.c), alphaVal);
    fill(cWithAlpha);
    ellipse(this.pos.x, this.pos.y, this.size, this.size);
  }
}

class Ore {
  constructor(type, id) {
    this.pos = createVector(deadZoneSizeX + random(width - 2 * deadZoneSizeX), deadZoneSizeY + random(height - 2 * deadZoneSizeY));
    this.size = 6;
    this.r = this.size / 2;
    this.type = type;
    this.id = id;
    this.valueArr = [25, 100, 3];
    this.silverN = 0;
    this.goldN = 1;
    this.fuelN = 2;
    this.seen = false;
  }

  applyValue() { 
    if (this.type === silver) score += this.valueArr[this.silverN];
    else if (this.type === gold) score += this.valueArr[this.goldN];
    else if (this.type === fuel) drillPower += this.valueArr[this.fuelN];
  }

  getValue(checkType) {
    if (checkType === silver) return this.valueArr[this.silverN];
    else if (checkType === gold) return this.valueArr[this.goldN];
    else if (checkType === fuel) return this.valueArr[this.fuelN];
    return 0;
  }

  calculateAlpha(p) {
    let d = this.pos.dist(p.pos);
    if (d <= lightSize / 2) {
      this.seen = true;
      if (d <= lightSize / 4) return 200;
      return 50;
    } else if (this.seen) return 50;
    return 0;
  }

  display(p) {
    let alphaVal = this.calculateAlpha(p);
    let c = color(this.type);
    c.setAlpha(alphaVal);
    fill(c);
    ellipse(this.pos.x, this.pos.y, this.size, this.size);
  }
}