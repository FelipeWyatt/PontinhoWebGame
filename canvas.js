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
        this.draw()
    }
  
}

class Stack {
    constructor(cards = [], x = 0, y = 0, flipped = false, orientation = 'down', movable = false) {
        this.cards = cards
        this.x = x
        this.y = y
        this.flipped = flipped
        this.orientation = orientation
        this.movable = movable
        // cards gets this object caracteristics
        this.cards.forEach(card => {
            card.flipped = this.flipped;
            card.orientation = this.orientation;
            card.grab.movable = this.movable;
          });
        
    }
    
    numberOfCards() {
        return this.cards.length
    }

    add(card) {
        // Set the Stack caracteristics to the card and add it to the end of the array
        card.flipped = this.flipped
        card.orientation = this.orientation
        card.grab.movable = this.movable
        this.cards.push(card)
    }
  
    remove(card) {
        // Remove specific card of array
        if (this.cards.includes(card)) {
            const index = this.cards.indexOf(card)
            return this.cards.splice(index, 1)[0]
        }
        return false
    }

    buy(nCards = 1){
        // Remove and return last nCards of array
        if (nCards == 1){
            return this.cards.pop()
        } else {
            const removedCards = [];
            for (let i = 0; i < nCards; i++) {
                removedCards.push(this.cards.pop())
            }
            return removedCards;
        }
    }
  
    
    update() {
        if (this.numberOfCards() > 0) {
            this.cards.forEach(card => {card.update();})
        }
    }
}
  


class Deck extends Stack{
    
    static hSpacing = 8
    static vSpacing = 2

    constructor(cards = freshDeck(), x = 0, y = 0) {
        super(cards, x, y, false, 'down', false)
        this.cards.forEach(card => {card.x = this.x; card.y = this.y;})
        this.shuffle()
    }

    insideDeck(x, y){
        if (x > this.x && x < this.x + Card.w + 2*Deck.hSpacing){
            if (y > this.y && y < this.y + Card.h + 2*Deck.vSpacing){
                return true
            }
        }
        return false
    }

  
    shuffle() {
        // Randomize array in-place using Durstenfeld shuffle algorithm
        for (let i = this.numberOfCards() - 1; i > 0; i--) {
            const newIndex = Math.floor(Math.random() * (i + 1))
            const oldValue = this.cards[newIndex]
            this.cards[newIndex] = this.cards[i]
            this.cards[i] = oldValue
        }
      
    }


    draw() {
        let n = this.numberOfCards()
        if (n > 3) {n = 3}
        else if (n <= 0) {return null}

        for (let i = 0; i < n; i++){
            this.cards[i].newPos(this.x + Deck.hSpacing*i, this.y + Deck.vSpacing*i)
            this.cards[i].draw()
        }
    }

    update(){
        this.draw()
    }
}

class Discards extends Stack{
    static scatter_radius = 60

    constructor(x = 0, y = 0) {
        super([], x, y, true, 'down', false)
        // Can only buy the top card
        this.buyable = false
    }

    lastCard(){
        return this.cards[this.cards.length - 1]
    }
  
  
    buy() {
        // Return the top card
        if (this.buyable){
            this.buyable = false
            return super.buy()
        } else {
            return false
        }
    }
  
    add(card) {
        // Add card to the end of the array
        let loc = randomPointInCircle(this.x, this.y, Discards.scatter_radius)
        card.newTargetPos(loc.x, loc.y)
        super.add(card)
        this.buyable = true
    }

    insideArea(x, y) {
        const distance = Math.sqrt((x - this.x) ** 2 + (y - this.y) ** 2);
        // Verifica se a distância é menor ou igual ao raio do círculo
        return distance <= Discards.scatter_radius;
    }

    update(){
        super.update()
    }
}



class Hand extends Stack{
    constructor(cards = [], x = 0, y = 0, flipped = false, movable = false, orientation = 'down', spacing = Card.w + 2) {
        super(cards, x, y, flipped, orientation, movable)
        this.spacing = spacing
    }
    
    chooseRandomCard(){
        // Return a random choice of card
        const index = Math.floor(Math.random() * this.numberOfCards())
        return this.cards[index]
    }

    removeRandomCard(){
        // Remove and return a random card
        const index = Math.floor(Math.random() * this.numberOfCards())
        return this.cards.splice(index, 1)[0]
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

        super.update()
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

class Round{// Classe static pois não é necessário estanciá-la
    static deck
    static discardPile
    static player
    static bots
    static elements
    static order
    static turn
    static phase // buy, drop and discard

    static init(){
        // Begin round
        Round.deck = new Deck(freshDeck(), 120, 160)
        Round.discardPile = new Discards(240, 160)

        Round.player = new Player(Round.deck.buy(9), 200, 400 - (Card.h + 10))
        const bot1 = new Bot(Round.deck.buy(9), 200, 10, 'up')
        const bot2 = new Bot(Round.deck.buy(9), 10, 200, 'left')
        const bot3 = new Bot(Round.deck.buy(9), 400 - (Card.w + 10), 200, 'right')
        Round.bots = [bot1, bot2, bot3]
        Round.elements = [Round.deck, Round.discardPile, Round.player, bot1, bot2, bot3]

        Round.order = [Round.player, bot2, bot1, bot3] // sentido horário
        Round.turn = Round.order[0]
        Round.phase = 'buy'
    }

    static turnBoughtCard(from = 'deck'){
        // player or bot of turn took an action to buy from deck or discardPile
        if (from == 'deck'){
            console.log(Round.deck.buy())
            Round.turn.hand.add(Round.deck.buy())
        } else if (from == 'discardPile' && Round.discardPile.buyable) {
            Round.turn.hand.add(Round.discardPile.buy())
        } else {
            return false
        }
        Round.phase = 'drop'
        return true
    }

    static turnDroppedCombination(){
        

    }

    static turnDiscardedCard(card){
        Round.discardPile.add(Round.turn.hand.remove(card))
        Round.endTurn()
    }

    static endTurn() { // Finaliza o turno atual
        const currentIndex = Round.order.indexOf(Round.turn)
    
        if (currentIndex == Round.order.length - 1) {
            Round.turn = Round.order[0]
        } else {
            Round.turn = Round.order[currentIndex + 1]
        }
        Round.phase = 'buy'
        if (Round.bots.includes(Round.turn)) {
            // O bot joga
            Round.botPlay()
        }
    }
    
    static botPlay(){
        if (Round.phase == 'buy'){
            setTimeout(function() { 
                Round.turnBoughtCard('deck');

                setTimeout(function() { 
                    Round.turnDiscardedCard(Round.turn.hand.chooseRandomCard())
                }, 1000);
                
            }, 1000);
        }
        // Waits 1 s to execute function
        
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

    let deck =  d1.concat(d2)
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

Round.init()
console.log(Round.elements)

function animate(){ // default FPS = 60
    // setup block
    requestAnimationFrame(animate)
    c.clearRect(0, 0, innerWidth, innerHeight)
    // setup block end

    Round.elements.forEach(elem => {elem.update()})
    // desenha a carta segurada por ultimo para ficar em primeiro
    if (holdingCard != null){
        holdingCard.draw()
    }

}

animate()


addEventListener('mousedown', (event) => {
    mouseDown = true
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if click was to buy
    if (Round.turn == Round.player && Round.phase == 'buy'){
        if (Round.deck.insideDeck(x, y)){
            Round.turnBoughtCard('deck')
            return
        } else if (Round.discardPile.buyable && Round.discardPile.lastCard().insideCard(x, y)){
            Round.turnBoughtCard('discardPile')
            return
        }
    }
    
    // Check if click was on movable card
    holdingCard = null
    let dx, dy, minDx = 99999, minDy
    for (let card of Round.player.hand.cards){
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
        if (Round.phase == 'drop' && Round.discardPile.insideArea(mouseX, mouseY)){
            Round.turnDiscardedCard(holdingCard)
        }
        holdingCard = null
    }
    
    // reorganiza posicao das cartas
    Round.player.update()
})

addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    mouseX = x
    mouseY = y

    
})
