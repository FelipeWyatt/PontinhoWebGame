//------------------------------IMPORTS-----------------------------------
// import ace from './img/png/1x/spade_1.png'
const ace = new Image() // Create new img element
ace.src = "./img/png/1x/spade_1.png" // Set source path

//---------------------------CANVAS SETUP---------------------------------
const canvas = document.querySelector('canvas')

canvas.height = 400 //window.innerHeight;
canvas.width = 400 //window.innerWidth;

const c = canvas.getContext('2d')

let mouseDown = false
let holdingCard = null
let mouseX = 0
let mouseY = 0

//-----------------------------CLASSES------------------------------------
const SUITS = ["♠", "♣", "♥", "♦"]
const VALUES = [  "A",  "2",  "3",  "4",  "5",  "6",  "7",  "8",  "9",  "10",  "J",  "Q",  "K", "joker"]

class Card {
    
    static w = 29
    static h = 40

    constructor(value, suit, flipped = false, x = 0, y = 0, orientation = 'down') {
        this.suit = suit
        this.value = value
        this.flipped = flipped
        this.x = x
        this.y = y
        this.xTarget = x
        this.yTarget = y
        this.grab = {movable: false, holding: false, dx: 0, dy: 0}
        this.orientation = orientation
    }

    get color() {
        return this.suit === "♣" || this.suit === "♠" ? "black" : "red"
    }

    newPos(x, y){
        this.x = x
        this.y = y
        this.xTarget = x
        this.yTarget = y
    }

    newTargetPos(x, y){
        this.xTarget = x
        this.yTarget = y
    }

    insideCard(x, y){
        if (x > this.x && x < this.x + Card.w){
            if (y > this.y && y < this.y + Card.h){
                return true
            }
        }
        return false
    }

    draw() {
        
        let b = 3
        // Save the current context state
        c.save();
    
        // Translate the context to the center of the card
        c.translate(this.x + Card.w / 2, this.y + Card.h / 2);
    
        // Rotate the context by 90 degrees if needed
        if (this.orientation == 'left') { c.rotate(Math.PI / 2); }
        else if (this.orientation == 'up') { c.rotate(Math.PI); }
        else if (this.orientation == 'right') { c.rotate(- Math.PI / 2); }

        // Margin one pixel wide
        let margin = 1  
        c.fillStyle = "black"
        c.fillRect(-Card.w / 2, - Card.h / 2, Card.w, Card.h)

        if (!this.flipped){
            // Draw the card at the origin (since the context has been translated)    
            c.fillStyle = "white"
            c.fillRect(-Card.w / 2 + margin, - Card.h / 2 + margin, Card.w - 2*margin, Card.h - 2*margin)
            c.fillStyle = "#d12d36"
            c.fillRect(-Card.w / 2 + b, - Card.h / 2 + b, Card.w - 2*b, Card.h - 2*b)
        } else {
            c.fillStyle = "white"
            c.fillRect(-Card.w / 2 + margin, - Card.h / 2 + margin, Card.w - 2*margin, Card.h - 2*margin)

            if (this.value == "joker"){ 
                // Rotaciona o texto
                c.rotate(50*Math.PI / 180) 
                c.fillStyle = this.color
                c.font = "13px arial"
                c.textAlign = 'center';
                c.textBaseline = 'middle';
                c.fillText("Joker", 0, 0)

                // Desrotaciona o texto
                c.rotate(-50*Math.PI / 180) 
            } else {

                c.fillStyle = this.color
                c.font = "20px arial"
                c.textAlign = 'center';
                c.textBaseline = 'middle';
                c.fillText(this.value, 0, -0.21*Card.h)
                
                c.font = "26px arial"
                c.fillText(this.suit, 0, 0.21*Card.h)

            }
        }
    
        // Restore the context to its original state
        c.restore();
        
    }

    update(){
        this.draw()
        if (this.grab.movable && this.grab.holding){
            this.newPos(mouseX - this.grab.dx , mouseY - this.grab.dy)
        }

        // Checa se está dentro da coordenada target, com uma tolerancia
        let velocity = 0.1
        if (Math.abs(this.x - this.xTarget) >= 1){
            this.x += velocity*(this.xTarget - this.x)
        } else {
            this.x = this.xTarget
        }

        if (Math.abs(this.y - this.yTarget) >= 1){
            this.y += velocity*(this.yTarget - this.y)
        } else {
            this.y = this.yTarget
        }
    }
  
}

class Deck {
    constructor(cards = freshDeck(), x = 0, y = 0) {
        this.cards = cards
        this.x = x
        this.y = y
        this.cards.forEach(card => {card.x = this.x; card.y = this.y;})
        this.shuffle();
    }
  
    get numberOfCards() {
        return this.cards.length
    }

    buy(nCards = 1){
        if (nCards == 1){
            return this.cards.shift()
        } else {
            let l = []
            for (let i = 0; i < nCards; i++){
                l.push(this.cards.shift())
            }
            return l
        }
        
    }

  
    shuffle() {
        // Randomize array in-place using Durstenfeld shuffle algorithm
        for (let i = this.numberOfCards - 1; i > 0; i--) {
            const newIndex = Math.floor(Math.random() * (i + 1))
            const oldValue = this.cards[newIndex]
            this.cards[newIndex] = this.cards[i]
            this.cards[i] = oldValue
        }
      
    }


    draw() {
        let hSpacing = 8
        let vSpacing = 2
        let n = this.numberOfCards
        if (n > 3) {n = 3}
        else if (n <= 0) {return null}

        for (let i = 0; i < n; i++){
            this.cards[i].newPos(this.x + hSpacing*i, this.y + vSpacing*i)
            this.cards[i].draw()
        }
    }

    update(){
        this.draw()
    }
}

class Discards {
    static scatter_radius = 60

    constructor(x = 0, y = 0) {
        this.cards = []
        this.x = x
        this.y = y
        // Can only buy the top card
        this.buyable = false
    }
  
    get numberOfCards() {
        return this.cards.length
    }
  
    buyLastCard() {
        // Return the top card
        if (this.buyable){
            this.buyable = false
            return this.cards.shift()
        } else {
            return false
        }
    }
  
    add(card) {
        // Add card to the end of the array
        let loc = randomPointInCircle(this.x, this.y, Discards.scatter_radius)
        card.newTargetPos(loc.x, loc.y)
        card.grab.movable = false
        card.flipped  = true
        card.orientation = 'down'
        this.cards.push(card)
        this.buyable = true
    }
  
    newPos(x, y){
        this.x = x
        this.y = y
    }

    update(){
        this.cards.forEach(card => {card.update();})
    }
}



class Hand {
    constructor(cards = [], x = 0, y = 0, flipped = false, movable = false, orientation = 'down', spacing = Card.w + 2) {
        this.cards = cards
        this.x = x
        this.y = y
        this.flipped = flipped
        this.movable = movable
        this.orientation = orientation
        this.spacing = spacing
        this.cards.forEach(card => {
            card.flipped = this.flipped;
            card.grab.movable = this.movable;
            card.orientation = this.orientation;
          });
        
    }

    discard() {
        // Return the top card
        return this.cards.shift()
    }
    
    update(){
        // Ordena vetor das cartas pela posição em x
        this.cards.sort(function(card1, card2){
            return card1.x - card2.x;
        });

        let n = this.cards.length
        let xi = this.x - (this.spacing)*n/2 //- Card.w/2
        let yi = this.y - (this.spacing)*n/2 - Card.w/2

        if (this.orientation == 'up' || this.orientation == 'down'){
            for (let i = 0; i < n; i++){
                this.cards[i].newTargetPos(xi + (this.spacing)*i, this.y)
            }
        } else {
            for (let i = 0; i < n; i++){
                this.cards[i].newTargetPos(this.x, yi + (this.spacing)*i)
            }
        }

        this.cards.forEach(card => {card.update();})
        
    }
}

class Bot {
    constructor(cards, x, y, orientation = 'up'){
        this.x = x
        this.y = y
        this.orientation = orientation
        this.hand = new Hand(cards, this.x, this.y, false, false, this.orientation, 10)
    }

    update(){
        this.hand.update()
    }
}

class Player {
    constructor(cards, x, y, orientation = 'down'){
        this.x = x
        this.y = y
        this.orientation = orientation
        this.hand = new Hand(cards, this.x, this.y, true, true, this.orientation)
    }

    update(){
        this.hand.update()
    }
}

//----------------------------AUX FUNCTIONS--------------------------
  
function freshDeck() {
    // Cria 2 listas com objetos únicos
    let d1 = SUITS.flatMap(suit => {
        return VALUES.map(value => {
            return new Card(value, suit)
        })
    });

    let d2 = SUITS.flatMap(suit => {
        return VALUES.map(value => {
            return new Card(value, suit)
        })
    });

    let d3 = SUITS.flatMap(suit => {
        return VALUES.map(value => {
            return new Card(value, suit)
        })
    });

    let deck =  d1.concat(d2).concat(d3)
    // Remove 5 joker para ter 3 no total
    for (let i = 0; i < 5; i++){
        let index = deck.findIndex(card => card.value == "joker")
        if (index !== -1) {
            deck.splice(index, 1);
        }
    }
    return deck
}

function map(current, in_min, in_max, out_min, out_max) {
    return ((current - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min
}

function randomNumber(mean, maxDiff) {
    // Generate a random number between mean - maxDiff and mean + maxDiff
    return mean - maxDiff + (Math.random() * (maxDiff * 2));
}

function randomPointInCircle(centerX, centerY, maxRadius) {
    // Generate a random radius between 0 and maxRadius
    let radius = Math.random() * maxRadius;
  
    // Generate a random angle between 0 and 2*PI
    let angle = Math.random() * 2 * Math.PI;
  
    // Calculate the x and y coordinates of the point on the circle at the given angle
    let x = centerX + radius * Math.cos(angle);
    let y = centerY + radius * Math.sin(angle);
  
    // Return the point as an object with x and y properties
    return { x, y };
  }

//---------------------------------MAIN------------------------------


const deck = new Deck(freshDeck(), 120, 160)

const discardPile = new Discards(240, 160)

const bot1 = new Bot(deck.buy(9), 200, 10, 'up')
const bot2 = new Bot(deck.buy(9), 10, 200, 'left')
const bot3 = new Bot(deck.buy(9), 400 - (Card.w + 10), 200, 'right')

const p1 = new Player(deck.buy(9), 200, 400 - (Card.h + 10))

const elements = [deck, discardPile, bot1, bot2, bot3, p1]


function animate(){ // default FPS = 60
    // setup block
    requestAnimationFrame(animate)
    c.clearRect(0, 0, innerWidth, innerHeight)
    // setup block end

    elements.forEach(elem => {elem.update()})
    // desenha a carta segurada por ultimo para ficar em primeiro
    if (holdingCard != null){
        holdingCard.draw()
    }

}

animate()


addEventListener('mousedown', (event) => {
    discardPile.add(deck.buy())

    mouseDown = true
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    holdingCard = null
    let dx, dy, minDx = 99999, minDy
    for (let card of p1.hand.cards){
        if (card.grab.movable && card.insideCard(x, y)){
            dx = x - card.x
            dy = y - card.y
            if (dx >= 0 && dx < minDx) {
                minDx = dx
                minDy = dy
                holdingCard = card
            }
        }
    }

    if (holdingCard != null){
        holdingCard.grab.holding = true
        holdingCard.grab.dx = minDx
        holdingCard.grab.dy = minDy
    }
})

addEventListener('mouseup', () => {
    mouseDown = false
    if (holdingCard != null){
        holdingCard.grab.holding = false
        holdingCard = null
    }
    
    // reorganiza posicao das cartas
    p1.hand.update()
})

addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    mouseX = x
    mouseY = y

    
})
