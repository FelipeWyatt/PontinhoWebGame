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
let dropSelection = []
let mouseX = 0
let mouseY = 0

//-----------------------------CLASSES------------------------------------
const velocity = 0.1 // card movement velocity
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

    insideArea(x, y){
        const cond1 = Math.abs(this.x - x) <= Card.w/2
        const cond2 = Math.abs(this.y - y) <= Card.h/2
        return cond1 && cond2
    }

    draw() {
        c.save() // Save the current context state
    
        c.translate(this.x, this.y); // to draw by the top left corner: c.translate(this.x + Card.w/2, this.y + Card.h/2);

        // Rotate the context by 90 degrees if needed
        if (this.orientation == 'up') {
            c.rotate(Math.PI)
        } else if (this.orientation == 'left') { 
            c.rotate(Math.PI / 2)
        } else if (this.orientation == 'right') { 
            c.rotate(- Math.PI / 2)
        }

        // black Margin one pixel wide
        let margin = 1  
        let b = Card.h*0.07 // white margin back of the card
        c.fillStyle = "black"
        c.fillRect(-Card.w / 2, -Card.h / 2, Card.w, Card.h)
        c.fillStyle = "white"
        c.fillRect(-Card.w / 2 + margin, - Card.h / 2 + margin, Card.w - 2*margin, Card.h - 2*margin)
        

        if (!this.flipped){
            c.fillStyle = "#d12d36"
            c.fillRect(-Card.w / 2 + b, - Card.h / 2 + b, Card.w - 2*b, Card.h - 2*b)
        } else {
            c.fillStyle = this.color
            
            if (this.value == "joker"){ 
                c.font = canvasHeightPct(3.33).toString() + "px Oswald" // 20px para canvas=600
                c.fillText("J", -0.35*Card.w, -0.18*Card.h)
                c.fillText("O", -0.4*Card.w, 0.13*Card.h)
                c.fillText("K", -0.38*Card.w, 0.45*Card.h)
            } else {
                c.font = canvasHeightPct(4.33).toString() + "px Oswald" // 26px para canvas=600
                
                if (this.value == "J") {c.fillText(this.value, -0.35*Card.w, -0.07*Card.h)}
                else if (this.value == "Q") {c.fillText(this.value, -0.45*Card.w, -0.07*Card.h)}
                else if (this.value == "10") {
                    c.font = canvasHeightPct(2.67).toString() + "px Oswald" // 16px para canvas=600
                    c.fillText("1", -0.35*Card.w, -0.22*Card.h);
                    c.fillText("0", -0.37*Card.w, 0.07*Card.h);
                } else {c.fillText(this.value, -0.43*Card.w, -0.07*Card.h)}
                
                // desenha o naipe pequeno
                c.font = canvasHeightPct(2.33).toString() + "px Noto Sans JP" // 14px para canvas=600
                if (this.value == "10") {c.fillText(this.suit, -0.44*Card.w, 0.34*Card.h)}
                else {c.fillText(this.suit, -0.44*Card.w, 0.2*Card.h)}

                // desenha o naipe grande
                c.font = canvasHeightPct(3).toString() + "px Noto Sans JP"
                c.fillText(this.suit, 0.005*Card.w, 0.4*Card.h)
                
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

        // Checa se está dentro da coordenada target, com uma tolerancia de 1 pixel
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
    
    static hSpacing = canvasWidthPct(2)
    static vSpacing = canvasHeightPct(0.5)

    constructor(cards = freshDeck(), x = 0, y = 0) {
        super(cards, x, y, false, 'down', false)
        this.cards.forEach(card => {card.newPos(this.x, this.y)})
        this.shuffle()
    }

    insideArea(x, y){
        const cond1 = Math.abs(this.x - x) <= Card.w/2 + Deck.hSpacing
        const cond2 = Math.abs(this.y - y) <= Card.h/2 + Deck.vSpacing
        return cond1 && cond2
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


    update(){
        let n = this.numberOfCards()
        if (n > 0) {
            let i = n - 4 // Só desenha as 4 últimas cartas do array
            if (i < 0) { i = 0 }
            while (i < n){
                this.cards[i].newPos(this.x + Deck.hSpacing*(i - n + 2), this.y + Deck.vSpacing*(i - n + 2))
                this.cards[i].update() // Only draw the last cards
                i++
            }
        }
    }
}

class Discards extends Stack{
    static scatterRadius = canvasHeightPct(13)
    static cornerRadius = 2

    constructor(x = 0, y = 0) {
        super([], x, y, true, 'down', false)
        // Can only buy the last card
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
        const loc = randomPointInSquare(this.x, this.y, Discards.scatterRadius)
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

    constructor(cards = [], x = 0, y = 0, flipped = false, movable = false, orientation = 'down', spacing = Hand.defaultSpacing, sorted = false) {
        super(cards, x, y, flipped, orientation, movable)
        this.spacing = spacing
        this.sorted = sorted
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
            return (Math.abs(this.x - x) <= comp/2 && Math.abs(y - this.y) <= Card.h/2)
        } else {
            return (Math.abs(this.y - y) <= comp/2 && Math.abs(x - this.x) <= Card.w/2)
        }
    }

    update(){

        let n = this.cards.length
        let xi = this.x - (this.spacing)*(n - 1)/2
        let yi = this.y - (this.spacing)*(n - 1)/2

        if (this.orientation == 'up' || this.orientation == 'down'){
            if (!this.sorted){
                // Ordena vetor das cartas pela posição em x
                this.cards.sort(function(card1, card2){
                    return card1.x - card2.x;
                });
            }

            for (let i = 0; i < n; i++){
                this.cards[i].newTargetPos(xi + (this.spacing)*i, this.y)
            }
            
            // Reverte para desenhar as cartas da esquerda para direita
            if (this.orientation == 'up') { this.cards.reverse() }
        } else {
            if(!this.sorted){
                // Ordena vetor das cartas pela posição em y
                this.cards.sort(function(card1, card2){
                    return card1.y - card2.y;
                });
            }
            
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
        super(cards, xCenter, yCenter, true, false, 'down', Hand.defaultSpacing, true)
    }

    calculateWidth(){
        return (this.spacing)*(this.numberOfCards() - 1) + Card.w
    }
}

class Table {
    static cornerRadius = 2

    constructor(xCenter, yCenter, w, h, internalSpacing = canvasWidthPct(1.67)){
        this.combs = []
        this.x = xCenter
        this.y = yCenter
        this.w = w
        this.h = h
        this.internalSpacing = internalSpacing
        this.flipped = true
        this.orientation = 'down'
        this.highlight = false
    }

    static checkCombination(cards, ending = false){
        // Checa se é um jogo possível
        const n = cards.length
        if (n < 3){
            return false
        }

        let countValues = {}
        let countSuits = {}
        for (let value of VALUES){
            countValues[value] = 0
        }
        for (let suit of SUITS){
            countSuits[suit] = 0
        }
        for (let card of cards){
            countValues[card.value]++
            if (card.value != "joker"){
                // Joker cards dont have a suit
                countSuits[card.suit]++
            }
        }

        // Check if it is supposed to be a sequence or trio
        let type = null
        let countDifferentSuits = 0
        let countDifferentValues = 0
        for (let suit of SUITS){
            if (countSuits[suit] > 0){
                countDifferentSuits++
            } 
        }
        for (let value of VALUES){
            if (countValues[value] > 0 && value != "joker"){
                countDifferentValues++
            } 
        }


        if (countDifferentSuits == 1){
            type = 'seq'
        } else if ((countDifferentSuits == 3 || countDifferentSuits == 4) && countDifferentValues == 1){
            type = 'trio'
        } else {
            return false
        } 


        // check if the sequence is valid
        if (type == 'seq'){
            for (let value of VALUES){
                if (countValues[value] > 1 && value != "joker" && value != "A"){
                    // if has duplicates
                    return false
                } 
            }

            cards.sort(function(card1, card2){
                return VALUES.indexOf(card1.value) - VALUES.indexOf(card2.value);
            });
    
            // check descontinuitys
            let descontinuitys = 0
            let nJokers = countValues["joker"]
            let jokers = []
            if (nJokers > 0){
                jokers = cards.slice(-nJokers)
                cards = cards.slice(0, -nJokers) // remove the jokers
            }
            if (countValues["A"] == 2) {
                cards.push(cards.shift()) // joga um dos áses no final
            }

            for (let i = 1; i < cards.length; i++){
                if (i == cards.length - 1 && cards[i].value == "A") {
                    // Se tem um ás na última posição, considera que é sucessor do rei
                    descontinuitys += 13 - 1 - VALUES.indexOf(cards[i - 1].value)
                } else {
                    descontinuitys += VALUES.indexOf(cards[i].value) - 1 - VALUES.indexOf(cards[i-1].value)
                }
            }

            console.log("descontinuitys ", descontinuitys)

            if (descontinuitys != nJokers){
                if (countValues["A"] == 1){
                    // Joga o ás para o final e checa de novo
                    cards.push(cards.shift())
                    console.log("tentando mover o as: ", cards[2])
                    descontinuitys = 0
                    for (let i = 1; i < cards.length; i++){
                        if (i == cards.length - 1 && cards[i].value == "A") {
                            // Se tem um ás na última posição, considera que é sucessor do rei
                            descontinuitys += 13 - 1 - VALUES.indexOf(cards[i - 1].value)
                        } else {
                            descontinuitys += VALUES.indexOf(cards[i].value) - 1 - VALUES.indexOf(cards[i-1].value)
                        }
                    }

                    if (descontinuitys != nJokers){
                        return false
                    }
                } else {
                    return false
                }
            }

            // Se chegou até aqui está correta, insere os joker nos lugares necessários
            if (nJokers > 0){
                let descontinuitySize = {}
                descontinuitys = 0
                for (let i = 1; i < cards.length; i++){
                    descontinuitySize[i + descontinuitys] = VALUES.indexOf(cards[i].value) - 1 - VALUES.indexOf(cards[i-1].value)
                    descontinuitys += VALUES.indexOf(cards[i].value) - 1 - VALUES.indexOf(cards[i-1].value)
                }
                console.log("descontinuitySize ", descontinuitySize)
                for (let i in descontinuitySize){
                    for (let j = 0; j < descontinuitySize[i]; j++){
                        // add the number of necessary jokers to array at necessary index
                        cards.splice(parseInt(i) + j, 0, jokers.pop())
                        console.log('added at ', parseInt(i) + j)
                    }
                }
                for (let i = 0; i < cards.length; i++){
                    console.log(cards[i])
                }
                console.log(jokers)
            }
            
        } else if (type == 'trio'){
            if (countValues["joker"] > 0 ){
                return false
            }

            if (countDifferentSuits == 4){
                let maxCountSuits = 0
                for (let suit of SUITS){
                    if (countSuits[suit] > maxCountSuits) {
                        maxCountSuits = countSuits[suit]
                    }
                }
                if (maxCountSuits != 2){
                    // if four suits, one suit must have the 2 cards
                    return false
                }
            }

            // Se chegou até aqui está correto
            cards.sort(function(card1, card2){
                return SUITS.indexOf(card1.suit) - SUITS.indexOf(card2.suit);
            });
        } 


        return cards
    }

    addCombination(cards){
        let response = Table.checkCombination(cards)
        if (response != false){
            // then response is the cards array sorted
            this.combs.push(new Combination(response, this.x, this.y))
            return true
        }
        return false
    }

    insideArea(x, y){
        return Math.abs(this.x - x) <= this.w/2 && Math.abs(this.y - y) <= this.h/2
    }

    update(){
        if (this.combs.length > 0){
            // Define os lugares das combinations
            let xCorner = this.x - this.w/2
            let yCorner = this.y - this.h/2
            let xComb = xCorner + this.internalSpacing// x dimension of corner of comb
            let yComb = yCorner + this.internalSpacing + Card.h/2 // y dimension of corner of comb
            for (let comb of this.combs){
                let comp = comb.calculateWidth()
    
                if (xComb + comp > this.x + this.w/2){
                    // Se sair da largura da Table, "adiciona mais uma linha"
                    yComb += Card.h + this.internalSpacing
                    xComb = xCorner + this.internalSpacing
                }
    
                comb.x = xComb + comp/2
                comb.y = yComb
    
                xComb += comp + this.internalSpacing
    
                comb.update()
            }
        }

        if (this.highlight){
            c.save();
            c.fillStyle = 'rgba(255, 255, 0, 0.3)';

            c.beginPath();
            c.moveTo(this.x - this.w/2 + Table.cornerRadius, this.y - this.h/2);
            c.arcTo(this.x + this.w/2, this.y - this.h/2, this.x + this.w/2, this.y + this.h/2, Table.cornerRadius);
            c.arcTo(this.x + this.w/2, this.y + this.h/2, this.x - this.w/2, this.y + this.h/2, Table.cornerRadius);
            c.arcTo(this.x - this.w/2, this.y + this.h/2, this.x - this.w/2, this.y - this.h/2, Table.cornerRadius);
            c.arcTo(this.x - this.w/2, this.y - this.h/2, this.x + this.w/2, this.y - this.h/2, Table.cornerRadius);
            
            c.fill();
            c.restore();
        }
    }
}

class Button {
    static cornerRadius = 5

    constructor(x, y, w, h, text, visible = false){
        this.x = x
        this.y = y
        this.w = w
        this.h = h
        this.text = text
        this.visible = visible
        this.highlight = false
    }

    insideArea(x, y){
        return Math.abs(this.x - x) <= this.w/2 && Math.abs(this.y - y) <= this.h/2
    }

    draw(){
        c.save();
        c.fillStyle = 'rgba(255, 255, 255, 0.8)'

        c.beginPath();
        c.moveTo(this.x - this.w/2 + Button.cornerRadius, this.y - this.h/2);
        c.arcTo(this.x + this.w/2, this.y - this.h/2, this.x + this.w/2, this.y + this.h/2, Button.cornerRadius);
        c.arcTo(this.x + this.w/2, this.y + this.h/2, this.x - this.w/2, this.y + this.h/2, Button.cornerRadius);
        c.arcTo(this.x - this.w/2, this.y + this.h/2, this.x - this.w/2, this.y - this.h/2, Button.cornerRadius);
        c.arcTo(this.x - this.w/2, this.y - this.h/2, this.x + this.w/2, this.y - this.h/2, Button.cornerRadius);
        c.fill();

        c.textAlign = 'center'
        c.textBaseline = 'middle'
        c.fillStyle = 'black'
        c.font = (0.6*this.h).toString() + "px arial" // 16px para canvas=600
        c.fillText(this.text, this.x, this.y)
                
        if (this.highlight){
            c.fillStyle = 'rgba(255, 255, 0, 0.5)'

            c.beginPath();
            c.moveTo(this.x - this.w/2 + Button.cornerRadius, this.y - this.h/2);
            c.arcTo(this.x + this.w/2, this.y - this.h/2, this.x + this.w/2, this.y + this.h/2, Button.cornerRadius);
            c.arcTo(this.x + this.w/2, this.y + this.h/2, this.x - this.w/2, this.y + this.h/2, Button.cornerRadius);
            c.arcTo(this.x - this.w/2, this.y + this.h/2, this.x - this.w/2, this.y - this.h/2, Button.cornerRadius);
            c.arcTo(this.x - this.w/2, this.y - this.h/2, this.x + this.w/2, this.y - this.h/2, Button.cornerRadius);
            c.fill();
        }

        c.restore();

    }

    update(){
        if (this.visible){
            this.draw()
        }
        
    }
}


class Bot {
    constructor(cards, x, y, orientation = 'up'){
        this.x = x
        this.y = y
        this.orientation = orientation
        this.hand = new Hand(cards, this.x, this.y, false, false, this.orientation, Hand.defaultSpacing)
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
        this.hand = new Hand(cards, this.x, this.y, true, true, this.orientation, Card.w + 2)
    }

    update(){
        this.hand.update()
    }
}

class Round{// Classe static pois não é necessário estanciá-la
    static deck
    static discardPile
    static table
    static dropButton
    static cancelButton
    static player
    static bots
    static elements
    static order
    static turn
    static phase // buy -> think <-> drop -> discard

    static htmlDisplayAttributes() {
        // update the cells in the table with the values of the Round class attributes
        document.getElementById("deck").innerHTML = Round.deck.numberOfCards()
        document.getElementById("discardPile").innerHTML = Round.discardPile.numberOfCards()
        document.getElementById("turn").innerHTML = Round.turn.orientation
        document.getElementById("phase").innerHTML = Round.phase
      }
      

    static init(){
        // Begin round
        let d = freshDeck()
        // d.push(new Card("K", SUITS[0]), new Card("K", SUITS[1]), new Card("K", SUITS[2]), new Card("K", SUITS[3]), new Card("3", SUITS[0]))
        Round.deck = new Deck(d, canvasWidthPct(33.33), canvasHeightPct(35))
        Round.discardPile = new Discards(canvasWidthPct(66.67),  canvasHeightPct(35))
        Round.table = new Table(canvasWidthPct(50), canvasHeightPct(66.67), canvasWidthPct(66.67), canvasHeightPct(36.67))
        
        Round.cancelButton = new Button(canvasWidthPct(8), canvasHeightPct(78), canvasWidthPct(14), canvasHeightPct(6), 'Cancel', false)
        Round.dropButton = new Button(canvasWidthPct(92), canvasHeightPct(78), canvasWidthPct(14), canvasHeightPct(6), 'Drop', false)
        
        Round.player = new Player(Round.deck.buy(9), canvasWidthPct(50), canvasHeightPct(97) - Card.h/2)
        const bot1 = new Bot(Round.deck.buy(9), canvasWidthPct(50), canvasHeightPct(3) + Card.h/2, 'up')
        const bot2 = new Bot(Round.deck.buy(9), canvasWidthPct(3) + Card.h/2, canvasHeightPct(50), 'left')
        const bot3 = new Bot(Round.deck.buy(9), canvasWidthPct(97) - Card.h/2, canvasHeightPct(50), 'right')
        Round.bots = [bot1, bot2, bot3]
        
        Round.elements = [Round.deck, Round.discardPile, Round.table, Round.cancelButton, Round.dropButton, Round.player, bot1, bot2, bot3]
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
        Round.phase = 'think'
        return true
    }

    static turnDroppedCombination(cards){
        if(Round.table.addCombination(cards)){
            for (let card of cards) {
                Round.turn.hand.remove(card)
            }
            console.log('combinacao adicionada okay')
            return true
        } else {
            // ***Adicionar pop-up (?) de aviso
            console.log('Combinacao invalida')
            return false
        }
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
    return mean - maxDiff + (Math.random() * (maxDiff * 2))
}

function randomPointInCircle(centerX, centerY, maxRadius) {
    // Generate a random radius between 0 and maxRadius
    let radius = Math.random() * maxRadius
  
    // Generate a random angle between 0 and 2*PI
    let angle = Math.random() * 2 * Math.PI
  
    // Calculate the x and y coordinates of the point on the circle at the given angle
    let x = centerX + radius * Math.cos(angle)
    let y = centerY + radius * Math.sin(angle)

    // Return the point as an object with x and y properties
    return { x, y }
}

function randomPointInSquare(centerX, centerY, halfSide) {
    let max_dx = 2*halfSide - Card.w
    let max_dy = 2*halfSide - Card.h

    // Generate random x and y coordinates within the allowable range
    let x = Math.random() * max_dx + (centerX - (halfSide - Card.w/2))
    let y = Math.random() * max_dy + (centerY - (halfSide - Card.h/2))

    // Return the point as an object with x and y properties
    return { x, y }
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

    console.log(mouseX, mouseY)

    // Finds which card was clicked in some groups: player.hand, discardPile.cards, Table.combs
    let clickedCard = null

    // Filter all cards if click was inside it
    let possibleCards =  Round.player.hand.cards.filter(card => card.insideArea(x, y))
    possibleCards = possibleCards.concat(Round.discardPile.cards.filter(card => card.insideArea(x, y)))
    for (let comb of Round.table.combs) {
        possibleCards = possibleCards.concat(comb.cards.filter(card => card.insideArea(x, y)))
    }

    if (possibleCards.length >= 1){
        // Find the closest card (by x corner) to the click point
        clickedCard = possibleCards[0]
        let closest_dx = x - (clickedCard.x - Card.w/2)

        for (let i = 1; i < possibleCards.length; i++) {
            let card = possibleCards[i]
            let dx = x - (card.x - Card.w/2)
            if (dx < closest_dx){
                clickedCard = card
                closest_dx = dx
            }
        }
    }

    // Round.discardPile.add(Round.deck.buy()) // test the discardPile

    // Check if click was to buy
    if (Round.turn == Round.player && Round.phase == 'buy'){
        if (Round.deck.insideArea(x, y)){
            Round.turnBoughtCard('deck')
            return
        } else if (Round.discardPile.buyable && Round.discardPile.lastCard().insideArea(x, y)){
            Round.turnBoughtCard('discardPile')
            return
        }
    }

    // Selected discardPile to discard
    if (Round.turn == Round.player && Round.phase == 'think' && Round.discardPile.highlight){
        Round.phase = 'discard'
        Round.turn.hand.highlightCards()
        return
    }

    // Selected Table to drop a combination
    if (Round.turn == Round.player && Round.phase == 'think' && Round.table.highlight){
        Round.phase = 'drop'
        Round.turn.hand.highlightCards()
        Round.cancelButton.visible = true
        Round.dropButton.visible = true
        return
    }


    // Selected dropButton to drop currently combination
    if (Round.turn == Round.player && Round.phase == 'drop' && Round.dropButton.highlight){
        const okay = Round.turnDroppedCombination(dropSelection)
        dropSelection = []
        if (okay) {
            Round.turn.hand.downlightCards()
            Round.cancelButton.visible = false
            Round.dropButton.visible = false
            Round.phase = 'think'
        } else {
            Round.turn.hand.highlightCards()
        }
        
        return
    }

    // Selected cancelButton to cancel the drop
    if (Round.turn == Round.player && Round.phase == 'drop' && Round.cancelButton.highlight){
        dropSelection = []
        Round.turn.hand.downlightCards()
        Round.cancelButton.visible = false
        Round.dropButton.visible = false
        Round.phase = 'think'
        return
    }

    if (clickedCard != null){
        // Selected a card to compose the drop combination
        if (Round.turn == Round.player && Round.phase == 'drop' && clickedCard.highlight){
            dropSelection.push(clickedCard)
            clickedCard.highlight = false
            return
        }

        // Unselected a card to compose the drop combination
        if (Round.turn == Round.player && Round.phase == 'drop' && !clickedCard.highlight){
            // Remove card from array
            dropSelection.splice(dropSelection.indexOf(clickedCard), 1)
            clickedCard.highlight = true
            return
        }
        
        // Selected a card to discard
        if (Round.turn == Round.player && Round.phase == 'discard'){
            Round.turn.hand.downlightCards()
            Round.turnDiscardedCard(clickedCard) // termina o turno
            return
        }
    
        // Selected a card to move with mouse, cannot move card in drop or discard phases of player turn
        if (Round.turn != Round.player || Round.phase == 'buy' || Round.phase == 'think'){
            if (clickedCard.grab.movable){
                holdingCard = clickedCard
                holdingCard.grab.holding = true
                holdingCard.grab.dx = x - holdingCard.x
                holdingCard.grab.dy = y - holdingCard.y
                return
            }
        }
    }

    
})

addEventListener('mouseup', () => {
    mouseDown = false
    if (holdingCard != null){
        holdingCard.grab.holding = false
        holdingCard = null
    }
})

addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    mouseX = x
    mouseY = y

    const cond1 = Round.turn == Round.player && holdingCard == null
    const cond2 = Round.phase == 'think'
    const cond3 = Round.phase == 'drop'
    
    Round.discardPile.highlight = cond1 && cond2 && Round.discardPile.insideArea(mouseX, mouseY)
    Round.table.highlight = cond1 && cond2 && Round.table.insideArea(mouseX, mouseY)
    
    Round.cancelButton.highlight = cond1 && cond3 && Round.cancelButton.insideArea(mouseX, mouseY)
    Round.dropButton.highlight = cond1 && cond3 && Round.dropButton.insideArea(mouseX, mouseY)
    
    // // Spread cards when mouse is over
    // if (Round.player.hand.insideArea(mouseX, mouseY)){
    //     Round.player.hand.spacing = Card.w + 2
    // } else {
    //     Round.player.hand.spacing = Hand.defaultSpacing
    // }
})
