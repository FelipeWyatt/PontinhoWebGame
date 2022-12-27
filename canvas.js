//------------------------------IMPORTS-----------------------------------
// import ace from './img/png/1x/spade_1.png'
const ace = new Image() // Create new img element
ace.src = "./img/png/1x/spade_1.png" // Set source path
// to draw the image
// c.drawImage(ace, 0, 0, ace.width, ace.height, this.x , this.y, Card.w, Card.h)
            

//---------------------------CANVAS SETUP---------------------------------
const canvas = document.querySelector('canvas')

canvas.height = 600 //window.innerHeight;
canvas.width = canvas.height //window.innerWidth;

const c = canvas.getContext('2d')
// c.scale(1.5, 1.5) // zoom in canvas draws 
// Ideia, para ocupar o máximo da tela dar scale a partir de um fator do window.innerHeight
// igual ao funcionamento do colonist.io

let mouseDown = false
let holdingCard = null
let mouseX = 0
let mouseY = 0

//-----------------------------CLASSES------------------------------------
const SUITS = ["♠", "♣", "♥", "♦"]
const VALUES = [  "A",  "2",  "3",  "4",  "5",  "6",  "7",  "8",  "9",  "10",  "J",  "Q",  "K", "joker"]

class Card {
    
    static w = canvasWidthPct(7)   // canvas = 600 => 42px, original: 29px
    static h = canvasHeightPct(10) // canvas = 600 => 60px, original: 40px

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
        this.highlight = false
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
        let b = Card.h*0.07 // orig: 3px
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
                // *** mudar joker para JOK vertical na esquerda
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
                
                c.font = canvasHeightPct(4.33).toString() + "px Oswald" // 26px para canvas=600
                // c.textAlign = 'center';
                // c.textBaseline = 'middle';
                if (this.value == "J") {c.fillText(this.value, -0.35*Card.w, -0.07*Card.h)}
                else if (this.value == "Q") {c.fillText(this.value, -0.45*Card.w, -0.07*Card.h)}
                else if (this.value == "10") {
                    c.font = canvasHeightPct(2.67).toString() + "px Oswald" // 16px para canvas=600
                    c.fillText("1", -0.35*Card.w, -0.22*Card.h);
                    c.fillText("0", -0.37*Card.w, 0.07*Card.h);
                }
                else {c.fillText(this.value, -0.43*Card.w, -0.07*Card.h)}
                
                // desenha o naipe pequeno
                c.font = canvasHeightPct(2.33).toString() + "px Noto Sans JP" // 14px para canvas=600
                if (this.value == "10") {c.fillText(this.suit, -0.44*Card.w, 0.34*Card.h)}
                else {c.fillText(this.suit, -0.44*Card.w, 0.2*Card.h)}

                // desenha 2 naipes grandes
                // c.font = canvasHeightPct(3.7).toString() + "px Noto Sans JP"
                // c.fillText(this.suit, -0.1*Card.w, 0.3*Card.h)
                // c.fillText(this.suit, -0.1*Card.w, -0.1*Card.h)


            }
        }
        
        

        if (this.highlight){
            c.fillStyle = 'rgba(255, 255, 0, 0.3)'
            c.fillRect(-Card.w / 2, - Card.h / 2, Card.w, Card.h)
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
            this.cards.forEach(card => {card.update()})
        }
    }
}
  


class Deck extends Stack{
    
    static hSpacing = 8
    static vSpacing = 2

    constructor(cards = freshDeck(), x = 0, y = 0) {
        super(cards, x, y, false, 'down', false)
        this.cards.forEach(card => {card.x = this.x; card.y = this.y;})
        // this.shuffle()
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
    static scatterRadius = 60
    static cornerRadius = 10

    constructor(x = 0, y = 0) {
        super([], x, y, true, 'down', false)
        // Can only buy the top card
        this.buyable = false
        this.highlight = false
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
        let loc = randomPointInSquare(this.x, this.y, Discards.scatterRadius)
        card.newTargetPos(loc.x, loc.y)
        super.add(card)
        this.buyable = true
    }

    insideArea(x, y) {
        // check if it is inside circle
        // const distance = Math.sqrt((x - this.x) ** 2 + (y - this.y) ** 2);
        // return distance <= Discards.scatterRadius;
        return (Math.abs(x - this.x) <= Discards.scatterRadius && Math.abs(y - this.y) <= Discards.scatterRadius)
    }

    update(){
        super.update()

        if (this.highlight){
            c.save();
            c.fillStyle = 'rgba(255, 255, 0, 0.3)';

            // Draw the square
            c.beginPath();
            //c.rect(this.x - Discards.scatterRadius, this.y - Discards.scatterRadius, 2 * Discards.scatterRadius, 2 * Discards.scatterRadius);
            //c.arc(this.x, this.y, Discards.scatterRadius, 0, 2 * Math.PI);
            c.moveTo(this.x - Discards.scatterRadius + Discards.cornerRadius, this.y - Discards.scatterRadius);
            c.arcTo(this.x + Discards.scatterRadius, this.y - Discards.scatterRadius, this.x + Discards.scatterRadius, this.y + Discards.scatterRadius, Discards.cornerRadius);
            c.arcTo(this.x + Discards.scatterRadius, this.y + Discards.scatterRadius, this.x - Discards.scatterRadius, this.y + Discards.scatterRadius, Discards.cornerRadius);
            c.arcTo(this.x - Discards.scatterRadius, this.y + Discards.scatterRadius, this.x - Discards.scatterRadius, this.y - Discards.scatterRadius, Discards.cornerRadius);
            c.arcTo(this.x - Discards.scatterRadius, this.y - Discards.scatterRadius, this.x + Discards.scatterRadius, this.y - Discards.scatterRadius, Discards.cornerRadius);
            
            c.fill();
            c.restore();
        }
    }
}



class Hand extends Stack{
    static defaultSpacing = 0.4*Card.w

    constructor(cards = [], xCenter = 0, yCorner = 0, flipped = false, movable = false, orientation = 'down', spacing = Card.w + 2) {
        super(cards, xCenter, yCorner, flipped, orientation, movable)
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

    highlightCards(){
        this.cards.forEach(card => {card.highlight = true})
    }

    downlightCards(){
        this.cards.forEach(card => {card.highlight = false})
    }
   
    insideArea(x, y){
        let n = this.cards.length
        let comp = (this.spacing)*(n-1) + Card.w
        if (this.orientation == 'up' || this.orientation == 'down'){
            return (Math.abs(x - this.x) <= comp/2 && y - this.y <= Card.h && y - this.y >= 0)
        } else {
            return (Math.abs(y - this.y) <= comp/2 && x - this.x <= Card.h && x - this.x >= 0)
        }
    }

    update(){

        let n = this.cards.length
        let xi = this.x - (this.spacing)*n/2 //- Card.w/2
        let yi = this.y - (this.spacing)*n/2 - Card.w/2

        if (this.orientation == 'up' || this.orientation == 'down'){
            // Ordena vetor das cartas pela posição em x
            this.cards.sort(function(card1, card2){
                return card1.x - card2.x;
            });

            for (let i = 0; i < n; i++){
                this.cards[i].newTargetPos(xi + (this.spacing)*i, this.y)
            }
            
            // Reverte para desenhar as cartas da esquerda para direita
            if (this.orientation == 'up') { this.cards.reverse() }
        } else {
            // Ordena vetor das cartas pela posição em y
            this.cards.sort(function(card1, card2){
                return card1.y - card2.y;
            });
            
            for (let i = 0; i < n; i++){
                this.cards[i].newTargetPos(this.x, yi + (this.spacing)*i)
            }

            // Reverte para desenhar as cartas da esquerda para direita
            if (this.orientation == 'right') { this.cards.reverse() }
        }

        super.update()
    }
}

class Combination extends Hand {
    constructor(cards = [], xCenter = 0, yCenter = 0){
        super(cards, xCenter, yCenter, true, false, 'down', 10)
    }

    calculateWidth(){
        return (this.spacing)*(this.cards.length-1) + Card.w
    }
}

class Table {

    constructor(xCenter, yCenter, w = 100, h = 50, internalSpacing = 2){
        this.combs = []
        this.x = xCenter
        this.y = yCenter
        this.w = w
        this.h = h
        this.internalSpacing = internalSpacing
        this.flipped = true
        this.orientation = 'down'
    }

    static checkCombination(cards){
        // realiza os checks se combinação é possivel
        if (cards.length < 3){
            return false
        }
        return true
    }

    addCombination(cards){
        if (Table.checkCombination(cards)){
            this.combs.push(new Combination(cards, this.x, this.y))
        }
    }

    update(){
        // Define os lugares das combinations
        let xCorner = this.x - this.w/2
        let yCorner = this.y - this.h/2
        let xComb = xCorner + this.internalSpacing // x dimension of corner of comb
        let yComb = yCorner + Card.h + this.internalSpacing // y dimension of corner of comb
        for (let comb of this.combs){
            comb.x = xComb + comb.calculateWidth()/2
            comb.y = yComb

            xComb += comb.calculateWidth() + this.internalSpacing

            if (xComb + comb.calculateWidth() > this.x + this.w/2){
                // Se sair da largura da table, "adiciona mais uma linha"
                yComb += Card.h + this.internalSpacing
                xComb = xCorner + this.internalSpacing
            }

            comb.update()
        }
    }
}


class Bot {
    constructor(cards, x, y, orientation = 'up'){
        this.x = x
        this.y = y
        this.orientation = orientation
        this.hand = new Hand(cards, this.x, this.y, true, false, this.orientation, Hand.defaultSpacing)
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
    static table
    static player
    static bots
    static elements
    static order
    static turn
    static phase // buy, drop and discard

    static htmlDisplayAttributes() {
        // update the cells in the table with the values of the Round class attributes
        document.getElementById("deck").innerHTML = Round.deck.numberOfCards()
        document.getElementById("discardPile").innerHTML = Round.discardPile.numberOfCards()
        document.getElementById("turn").innerHTML = Round.turn.orientation
        document.getElementById("phase").innerHTML = Round.phase
      }
      

    static init(){
        // Begin round
        Round.deck = new Deck(freshDeck(), 120, 160)
        Round.discardPile = new Discards(240,  160 + Card.h/2)
        Round.table = new Table(200, 200)
        Round.table.addCombination(Round.deck.buy(3))

        Round.player = new Player(Round.deck.buy(9), canvasWidthPct(50), 400 - (Card.h + 10))
        const bot1 = new Bot(Round.deck.buy(9), 200, 10, 'up')
        const bot2 = new Bot(Round.deck.buy(9), 10, 200, 'left')
        const bot3 = new Bot(Round.deck.buy(9), 400 - (Card.w + 10), 200, 'right')
        Round.bots = [bot1, bot2, bot3]
        Round.elements = [Round.deck, Round.discardPile, Round.table, Round.player, bot1, bot2, bot3]
        console.log(Round.elements)

        Round.order = [Round.player, bot2, bot1, bot3] // sentido horário
        Round.turn = Round.order[0]
        Round.phase = 'buy'
    }

    static turnBoughtCard(from = 'deck'){
        // player or bot of turn took an action to buy from deck or discardPile
        if (from == 'deck'){
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
        // define o próximo jogador pela ordem
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
  
function canvasHeightPct(pct){
    return Math.round(canvas.height*pct/100)
}

function canvasWidthPct(pct){
    return Math.round(canvas.width*pct/100)
}

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

function randomPointInSquare(centerX, centerY, halfSide) {
    let maxX = centerX + halfSide - Card.w;
    let maxY = centerY + halfSide - Card.h;

    // Generate random x and y coordinates within the allowable range
    let x = Math.random() * (maxX - (centerX - halfSide)) + (centerX - halfSide);
    let y = Math.random() * (maxY - (centerY - halfSide)) + (centerY - halfSide);

    // Return the point as an object with x and y properties
    return { x, y };
}
  
function randomPointInRoundedSquare(Card, centerX, centerY, halfSide, cornerRadius) {
    // Calculate the maximum x and y coordinates for the top left corner of the card
    let maxX = centerX + halfSide - Card.w + cornerRadius;
    let maxY = centerY + halfSide - Card.h + cornerRadius;

    // Generate random x and y coordinates within the allowable range
    let x = Math.random() * (maxX - (centerX - halfSide + cornerRadius)) + (centerX - halfSide + cornerRadius);
    let y = Math.random() * (maxY - (centerY - halfSide + cornerRadius)) + (centerY - halfSide + cornerRadius);

    return { x, y };
}
  
//---------------------------------MAIN------------------------------

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

    Round.htmlDisplayAttributes()
}

Round.init()
animate()


addEventListener('mousedown', (event) => {
    mouseDown = true
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Round.discardPile.add(Round.deck.buy()) // test the discardPile

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

    // Selected discardPile
    if (Round.turn == Round.player && Round.phase == 'drop' && Round.discardPile.highlight){
        Round.phase = 'discard'
        Round.turn.hand.highlightCards()
        return
    }

    if (Round.turn == Round.player && Round.phase == 'discard'){
        let possibleCards =  Round.player.hand.cards.filter(card => card.insideCard(x, y))
        let len = possibleCards.length

        if (len >= 1){
            // Find the closest card (by x dimension) to the click point
            let clickedCard = possibleCards[0]
            let closest_dx = x - clickedCard.x

            for (let i = 1; i < len; i++) {
                let card = possibleCards[i]
                let dx = x - card.x
                if (dx < closest_dx){
                    clickedCard = card
                    closest_dx = dx
                }
                
            }

            Round.turn.hand.downlightCards()
            Round.turnDiscardedCard(clickedCard) // termina o turno
        }
      
        return
    }


    if (Round.phase != 'discard'){
        // Check if click was on movable card only if it's not player turn to drop
        let possibleCards =  Round.player.hand.cards.filter(card => card.grab.movable && card.insideCard(x, y))
        let len = possibleCards.length

        if (len >= 1) {
            // Find the closest card (by x dimension) to the click point
            holdingCard = possibleCards[0]
            let closest_dx = x - holdingCard.x
            let closest_dy = y - holdingCard.y

            for (let i = 1; i < len; i++) {
                let card = possibleCards[i]
                let dx = x - card.x
                if (dx < closest_dx){
                    holdingCard = card
                    closest_dx = dx
                    closest_dy = dy
                }
                
            }
            
            holdingCard.grab.holding = true
            holdingCard.grab.dx = closest_dx
            holdingCard.grab.dy = closest_dy
            
        }
    }
    
})

addEventListener('mouseup', () => {
    mouseDown = false
    if (holdingCard != null){
        holdingCard.grab.holding = false
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

    Round.discardPile.highlight = (Round.turn == Round.player && Round.phase == 'drop'
                                   && holdingCard == null && Round.discardPile.insideArea(mouseX, mouseY));

    for (let bot of Round.bots){
        if (bot.hand.insideArea(mouseX, mouseY)){
            bot.hand.spacing = Card.w + 2
        } else {
            bot.hand.spacing = Hand.defaultSpacing
        }
    }
})
