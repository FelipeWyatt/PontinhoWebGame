//---------------------------CANVAS SETUP---------------------------------
// c.scale(1.5, 1.5) // zoom in canvas draws 
// Ideia, para ocupar o máximo da tela dar scale a partir de um fator do window.innerHeight
// igual ao funcionamento do colonist.io
export const canvas = document.querySelector('canvas')

canvas.height = 600 //window.innerHeight;
canvas.width = canvas.height //window.innerWidth;

export const c = canvas.getContext('2d')

//----------------------------AUX FUNCTIONS--------------------------

export function canvasHeightPct(pct){
    return Math.round(canvas.height*pct/100)
}


export function canvasWidthPct(pct){
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

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}


//-----------------------------CLASSES------------------------------------
const velocity = 0.1 // card movement velocity
const SUITS = ["♠", "♣", "♥", "♦"]
const VALUES = [  "A",  "2",  "3",  "4",  "5",  "6",  "7",  "8",  "9",  "10",  "J",  "Q",  "K", "joker"]
const valuesDict = {
    "A": 15,
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "10": 10,
    "J": 10,
    "Q": 10,
    "K": 10,
    "joker": 20};

export class Card {
    
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

export class Stack {
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
          })
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
            this.cards.forEach(card => {
                card.update();
            })
        }
    }
}



export class Deck{
    
    static hSpacing = canvasWidthPct(2)
    static vSpacing = canvasHeightPct(0.5)
    static highlight
    static cards
    static x
    static y
    
    static init(x, y) { 
        Deck.cards = freshDeck()
        Deck.x = x
        Deck.y = y
        Deck.cards.forEach(card => {
            card.flipped = false;
            card.orientation = 'down';
            card.grab.movable = false;
            card.newPos(Deck.x, Deck.y)
          });
        Deck.shuffle()
        Deck.highlight = false
    }

    static numberOfCards() {
        return Deck.cards.length
    }

    static buy(){
        return this.cards.pop()
    }

    static newHand(){
        const removedCards = [];
        for (let i = 0; i < 9; i++) {
            removedCards.push(this.cards.pop())
        }
        return removedCards;
    }
    
    static insideArea(x, y){
        const cond1 = Math.abs(Deck.x - x) <= Card.w/2 + Deck.hSpacing
        const cond2 = Math.abs(Deck.y - y) <= Card.h/2 + Deck.vSpacing
        return cond1 && cond2
    }

  
    static shuffle() {
        // Randomize array in-place using Durstenfeld shuffle algorithm
        for (let i = Deck.numberOfCards() - 1; i > 0; i--) {
            const newIndex = Math.floor(Math.random() * (i + 1))
            const oldValue = Deck.cards[newIndex]
            Deck.cards[newIndex] = Deck.cards[i]
            Deck.cards[i] = oldValue
        }
      
    }


    static update(){
        let n = Deck.numberOfCards()
        if (n > 0) {
            let i = n - 4 // Só desenha as 4 últimas cartas do array
            if (i < 0) { i = 0 }
            while (i < n){
                Deck.cards[i].newPos(Deck.x + Deck.hSpacing*(i - n + 2), Deck.y + Deck.vSpacing*(i - n + 2))
                Deck.cards[i].highlight = Deck.highlight
                Deck.cards[i].update() // Only draw the last cards
                i++
            }
        }
    }
}

export class Discards{
    static scatterRadius = canvasHeightPct(13)
    static cornerRadius = 4
    static cards
    static x
    static y
    static buyable
    static highlight
    static frame


    static init(x, y) {
        Discards.cards = []
        Discards.x = x
        Discards.y = y
        Discards.cards.forEach(card => {
            card.flipped = true;
            card.orientation = 'down';
            card.grab.movable = false;
          });
        // Can only buy the last card
        Discards.buyable = false
        Discards.highlight = false
        Discards.frame = false
    }

    static lastCard(){
        if (Discards.numberOfCards() > 0){
            return Discards.cards[Discards.cards.length - 1]
        }
        return null
    }

    static numberOfCards() {
        return Discards.cards.length
    }

  
    static buy() {
        // Return the top card
        if (Discards.buyable){
            Discards.buyable = false
            return Discards.cards.pop()
        } else {
            return false
        }
    }
  
    static add(card) {
        // Add card to the end of the array
        const lastCard = this.lastCard()
        const loc = randomPointInSquare(Discards.x, Discards.y, Discards.scatterRadius)
        card.newTargetPos(loc.x, loc.y)
        card.flipped = true
        card.orientation = 'down'
        card.grab.movable = false
        card.highlight = false
        Discards.cards.push(card)
        Discards.buyable = true
        if (lastCard != null) {
            lastCard.highlight = false // pode estar acessa se mouse estiver em cima e outra carta for jogada
        }
    }

    static insideArea(x, y) {
        // check if it is inside circle
        // const distance = Math.sqrt((x - Discards.x) ** 2 + (y - Discards.y) ** 2);
        // return distance <= Discards.scatterRadius;
        return (Math.abs(x - Discards.x) <= Discards.scatterRadius && Math.abs(y - Discards.y) <= Discards.scatterRadius)
    }

    static update(){
        if (Discards.numberOfCards() > 0) {
            Discards.cards.forEach(card => {
                card.update();
            })
        }

        if (Discards.highlight){
            c.save();
            c.fillStyle = 'rgba(255, 255, 0, 0.3)';

            // Draw the square
            c.beginPath();
            //c.rect(Discards.x - Discards.scatterRadius, Discards.y - Discards.scatterRadius, 2 * Discards.scatterRadius, 2 * Discards.scatterRadius);
            //c.arc(Discards.x, Discards.y, Discards.scatterRadius, 0, 2 * Math.PI);
            c.moveTo(Discards.x - Discards.scatterRadius + Discards.cornerRadius, Discards.y - Discards.scatterRadius);
            c.arcTo(Discards.x + Discards.scatterRadius, Discards.y - Discards.scatterRadius, Discards.x + Discards.scatterRadius, Discards.y + Discards.scatterRadius, Discards.cornerRadius);
            c.arcTo(Discards.x + Discards.scatterRadius, Discards.y + Discards.scatterRadius, Discards.x - Discards.scatterRadius, Discards.y + Discards.scatterRadius, Discards.cornerRadius);
            c.arcTo(Discards.x - Discards.scatterRadius, Discards.y + Discards.scatterRadius, Discards.x - Discards.scatterRadius, Discards.y - Discards.scatterRadius, Discards.cornerRadius);
            c.arcTo(Discards.x - Discards.scatterRadius, Discards.y - Discards.scatterRadius, Discards.x + Discards.scatterRadius, Discards.y - Discards.scatterRadius, Discards.cornerRadius);
            
            c.fill();
            c.restore();
        }

        if (Discards.frame){
            c.save();
            c.strokeStyle = 'rgba(255, 25, 25, 1)';
            c.lineWidth = 3;
            
            c.beginPath();
            c.moveTo(Discards.x - Discards.scatterRadius + Discards.cornerRadius, Discards.y - Discards.scatterRadius);
            c.arcTo(Discards.x + Discards.scatterRadius, Discards.y - Discards.scatterRadius, Discards.x + Discards.scatterRadius, Discards.y + Discards.scatterRadius, Discards.cornerRadius);
            c.arcTo(Discards.x + Discards.scatterRadius, Discards.y + Discards.scatterRadius, Discards.x - Discards.scatterRadius, Discards.y + Discards.scatterRadius, Discards.cornerRadius);
            c.arcTo(Discards.x - Discards.scatterRadius, Discards.y + Discards.scatterRadius, Discards.x - Discards.scatterRadius, Discards.y - Discards.scatterRadius, Discards.cornerRadius);
            c.arcTo(Discards.x - Discards.scatterRadius, Discards.y - Discards.scatterRadius, Discards.x + Discards.scatterRadius, Discards.y - Discards.scatterRadius, Discards.cornerRadius);
            
            
            c.stroke();
            c.restore();
        }
    }
}



export class Hand extends Stack{
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
                if (!this.cards[i].grab.holding){ // Altera a posicao so se carta nao esta sendo segurada
                    this.cards[i].newTargetPos(xi + (this.spacing)*i, this.y)
                }
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
                if (!this.cards[i].grab.holding){
                    this.cards[i].newTargetPos(this.x, yi + (this.spacing)*i)
                }
            }

            // Reverte para desenhar as cartas da esquerda para direita
            if (this.orientation == 'right') { this.cards.reverse() }
        }

        super.update()
    }
}

export class Combination extends Hand {
    constructor(cards = [], xCenter = 0, yCenter = 0, type = null){
        super(cards, xCenter, yCenter, true, false, 'down', Hand.defaultSpacing, true)
        this.type = type
        this.highlight = false
    }

    calculateWidth(){
        return (this.spacing)*(this.numberOfCards() - 1) + Card.w
    }

    addToCombination(cards){
        let response = Table.checkCombination(this.cards.concat(cards))
        if (response != false){
            // then cards is the cards array sorted
            this.cards = response[0] // [cards, type]
            this.cards.forEach(card => {
                card.flipped = this.flipped;
                card.orientation = this.orientation;
                card.grab.movable = this.movable;
              });
            return true
        }
        return false
    }

    update(){
        if (this.numberOfCards() > 0) {
            this.cards.forEach(card => {
                card.highlight = this.highlight;
            })
        }
        super.update()
    }
    
    // sort of seq depends on the joker placement, not as simple as below
    // sort(){
    //     if (this.type == 'seq'){
    //         this.cards.sort(function(card1, card2){
    //             return VALUES.indexOf(card1.value) - VALUES.indexOf(card2.value);
    //         });
    //     } else if (this.type == 'trio'){
    //         this.cards.sort(function(card1, card2){
    //             return SUITS.indexOf(card1.suit) - SUITS.indexOf(card2.suit);
    //         });
    //     }

    // }
}

export class Table {
    static cornerRadius = 4
    static combs = []
    static highlight = false
    static frame = false
    static x
    static y
    static w
    static h
    static internalSpacing


    static init(xCenter, yCenter, w, h, internalSpacing = canvasWidthPct(1.67)){
        Table.x = xCenter
        Table.y = yCenter
        Table.w = w
        Table.h = h
        Table.internalSpacing = internalSpacing
    }

    static sumCards(cards){
        if (Array.isArray(cards) && cards.length > 0){            
            return cards.reduce((sum, card) => sum + valuesDict[card.value], 0);
        }

        return false
    }

    static checkCombination(cards, ending = false){
        // *** Arrumar caso da adição das estrangeiras na trinca (como está agora da pra adicionar só uma estrangeira se fora adicionada junto com outra carta)
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


            if (descontinuitys != nJokers){
                if (countValues["A"] == 1){
                    // Joga o ás para o final e checa de novo
                    cards.push(cards.shift())
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
                    if (i == cards.length - 1 && cards[i].value == "A") {
                        // Se tem um ás na última posição, considera que é sucessor do rei
                        descontinuitySize[i + descontinuitys] = 13 - 1 - VALUES.indexOf(cards[i - 1].value)
                        descontinuitys += 13 - 1 - VALUES.indexOf(cards[i - 1].value)
                    } else {
                        descontinuitySize[i + descontinuitys] = VALUES.indexOf(cards[i].value) - 1 - VALUES.indexOf(cards[i-1].value)
                        descontinuitys += VALUES.indexOf(cards[i].value) - 1 - VALUES.indexOf(cards[i-1].value)
                    }
                }

                console.log("inserindo jokers:", descontinuitySize, descontinuitys, jokers)
                
                for (let i in descontinuitySize){
                    for (let j = 0; j < descontinuitySize[i]; j++){
                        // add the number of necessary jokers to array at necessary index
                        cards.splice(parseInt(i) + j, 0, jokers.pop())
                    }
                }
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


        return [cards, type]
    }

    static addCombination(cards){
        let response = Table.checkCombination(cards)
        if (response != false){
            let type = response[1]
            cards = response[0]
            Table.combs.push(new Combination(cards, Table.x, Table.y, type))
            return true
        }
        return false
    }

    static allSubsets(array, minLength = 3){
        let subsets = []
       
        function recursion(subset, start){
            for (let i = start; i < array.length; i++){
                subset.push(array[i])
                if (subset.length >= minLength){
                    subsets.push(subset.slice()) // create a copy of the array
                }
                recursion(subset, i + 1)
                subset.pop()
            }
        }
        
        recursion([], 0)
        
        return subsets
    }
    
    static insideArea(x, y){
        return Math.abs(Table.x - x) <= Table.w/2 && Math.abs(Table.y - y) <= Table.h/2
    }

    static update(){
        if (Table.combs.length > 0){
            // Define os lugares das combinations
            let xCorner = Table.x - Table.w/2
            let yCorner = Table.y - Table.h/2
            let xComb = xCorner + Table.internalSpacing// x dimension of corner of comb
            let yComb = yCorner + Table.internalSpacing + Card.h/2 // y dimension of corner of comb
            for (let comb of Table.combs){
                let comp = comb.calculateWidth()
    
                if (xComb + comp > Table.x + Table.w/2){
                    // Se sair da largura da Table, "adiciona mais uma linha"
                    yComb += Card.h + Table.internalSpacing
                    xComb = xCorner + Table.internalSpacing
                }
    
                comb.x = xComb + comp/2
                comb.y = yComb
    
                xComb += comp + Table.internalSpacing
    
                comb.update()
            }
        }

        if (Table.highlight){
            c.save();
            c.fillStyle = 'rgba(255, 255, 0, 0.3)';

            c.beginPath();
            c.moveTo(Table.x - Table.w/2 + Table.cornerRadius, Table.y - Table.h/2);
            c.arcTo(Table.x + Table.w/2, Table.y - Table.h/2, Table.x + Table.w/2, Table.y + Table.h/2, Table.cornerRadius);
            c.arcTo(Table.x + Table.w/2, Table.y + Table.h/2, Table.x - Table.w/2, Table.y + Table.h/2, Table.cornerRadius);
            c.arcTo(Table.x - Table.w/2, Table.y + Table.h/2, Table.x - Table.w/2, Table.y - Table.h/2, Table.cornerRadius);
            c.arcTo(Table.x - Table.w/2, Table.y - Table.h/2, Table.x + Table.w/2, Table.y - Table.h/2, Table.cornerRadius);
            
            c.fill();
            c.restore();
        }

        if (Table.frame){
            c.save();
            c.strokeStyle = 'rgba(109, 237, 66, 1)';
            c.lineWidth = 3;

            c.beginPath();
            c.moveTo(Table.x - Table.w/2 + Table.cornerRadius, Table.y - Table.h/2);
            c.arcTo(Table.x + Table.w/2, Table.y - Table.h/2, Table.x + Table.w/2, Table.y + Table.h/2, Table.cornerRadius);
            c.arcTo(Table.x + Table.w/2, Table.y + Table.h/2, Table.x - Table.w/2, Table.y + Table.h/2, Table.cornerRadius);
            c.arcTo(Table.x - Table.w/2, Table.y + Table.h/2, Table.x - Table.w/2, Table.y - Table.h/2, Table.cornerRadius);
            c.arcTo(Table.x - Table.w/2, Table.y - Table.h/2, Table.x + Table.w/2, Table.y - Table.h/2, Table.cornerRadius);
            
            c.stroke();
            c.restore();
        }
    }
}

export class Button {
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

class Player {
    constructor(cards, x, y, orientation, flipped, movable, spacing){
        this.x = x
        this.y = y
        this.orientation = orientation
        this.hand = new Hand(cards, this.x, this.y, flipped, movable, this.orientation, spacing)
    }

    buyFromDeck(){
        // player took an action to buy from deck
        this.hand.add(Deck.buy())
    }

    buyFromDiscards(){
        // player took an action to buy from discardPile
        const lastCard = Discards.buy() 
        this.hand.add(lastCard)
        return lastCard
    } 

    dropCombination(cards){
        if(Table.addCombination(cards)){
            for (let card of cards) {
                this.hand.remove(card)
            }
            console.log('combinacao adicionada okay')
            return true
        } else {
            // ***Adicionar pop-up (?) de aviso
            console.log('Combinacao invalida')
            return false
        }
    }

    addToCombination(cards, comb){
        if (cards instanceof Card){
            cards = [cards]
        }

        if(comb.addToCombination(cards)){
            for (let card of cards) {
                this.hand.remove(card)
            }
            console.log('combinacao adicionada okay')
            return true
        } else {
            // ***Adicionar pop-up (?) de aviso
            console.log('Combinacao invalida')
            return false
        }
    }

    discardCard(card){
        Discards.add(this.hand.remove(card))
    }

    update(){
        this.hand.update()
    }

}

export class Bot extends Player {
    constructor(cards, x, y, orientation){
        super(cards, x, y, orientation, true, false, Hand.defaultSpacing)
    }

    

    checkForGame(cards){
        let possibleCombs = []

        // Check seqs
        for (let suit of SUITS){ 
            let playableCards = cards.filter((card) => card.suit == suit || card.value == "joker")

            if (playableCards.length >= 3){
                let possibleSeqs = Table.allSubsets(playableCards, 3)

                if (possibleSeqs.length > 0){
                    // filtra as combinacoes que nao sao possiveis
                    possibleSeqs = possibleSeqs.filter((set) => Table.checkCombination(set) != false) 
                    
                    if (possibleSeqs.length >= 1){
                        possibleCombs = possibleCombs.concat(possibleSeqs.slice()) // a copy
                    }
                }
            }
        }


        // Check trios
        for (let value of VALUES){
            let playableCards = cards.filter((card) => card.value == value && card.value != "joker")

            if (playableCards.length >= 3){
                let possibleTrios = Table.allSubsets(playableCards, 3)
                
                if (possibleTrios.length > 0){
                    // filtra as combinacoes que nao sao possiveis
                    possibleTrios = possibleTrios.filter((set) => Table.checkCombination(set) != false) 

                    if (possibleTrios.length >= 1){
                        possibleCombs = possibleCombs.concat(possibleTrios.slice()) // a copy
                    }      
                }
            }
        }


        if (possibleCombs.length == 1){
            return possibleCombs[0]

        } else if (possibleCombs.length > 1){
            // Retorna a combinacao com maior soma
            return possibleCombs.reduce((maxValue, seq) => Table.sumCards(maxValue) > Table.sumCards(seq) ? maxValue : seq)
        }

        // Ideias para melhorar estratégia do bot
        //  - Avaliar possibilidade de batida
        //  - Atualmente usa o joker em sequencias por que vale mais
        //  - Se tiver joker, pensar em usar em outra sequencia                
        
        return false
    }

    chooseBuy(){
        let hipotheticalBestComb = this.checkForGame([...this.hand.cards, Discards.lastCard()])

        // Compra do descarte se a melhor combinacao é feita com a carta do descarte
        if (hipotheticalBestComb != false && hipotheticalBestComb.includes(Discards.lastCard())){
            this.buyFromDiscards()
            // Ja baixa combinacao para nao ser necessario entrar no estado 'drop'
            this.dropCombination(hipotheticalBestComb)
        } else {
            this.buyFromDeck()
        }
        return true
    }

    checkForAddition(){
        if (Table.combs.length > 0){
            for (let card of this.hand.cards){
                for (let comb of Table.combs){
                    if (this.addToCombination(card, comb)){
                        return true
                    }
                }
            }
        }
        return false
    }

    chooseDiscardCard(){
        // *** Para melhorar, avalia descartar cartas mais altas com o passar das rodadas
        let discardableCards = this.hand.cards.slice() // makes a copy
        discardableCards = discardableCards.filter((card) => card.value != "joker")

        // Filtra cartas que possuem dublê
        let dubleCards = []
        for (let card1 of discardableCards) {
            for (let card2 of discardableCards) {
                let distance 
                if (card1.value == "A" && card2.value == "K") {
                    distance = 1
                } else if (card1.value == "A" && card2.value == "Q") {
                    distance = 2
                } else {
                    distance = Math.abs(VALUES.indexOf(card1.value) - VALUES.indexOf(card2.value))
                }

                if ((distance >= 1 && distance <= 2 && card1.suit == card2.suit) || (distance == 0 && card1.suit != card2.suit)) {                        
                    if (!dubleCards.includes(card1)) {dubleCards.push(card1);}
                    if (!dubleCards.includes(card2)) {dubleCards.push(card2);}
                    break
                }
            }
        }

        // remove os dubles das cartas descartaveis
        for (let card of dubleCards){
            discardableCards.splice(discardableCards.indexOf(card), 1)
        }

        // Se todas as cartas são dubles, recria o array
        if (discardableCards.length == 0){
            discardableCards = this.hand.cards.slice().filter((card) => card.value != "joker")
        }

        // descarta a maior
        return discardableCards.reduce((maxValue, card) => valuesDict[maxValue.value] > valuesDict[card.value] ? maxValue : card)
    }

}

export class User extends Player{
    constructor(cards, x, y){
        super(cards, x, y, 'down', true, true, Card.w + 2)
    }
}