// Make Deck, Discard e Table statics so Player and Bot can access at any time

//---------------------------CANVAS SETUP---------------------------------
export const canvas = document.querySelector('canvas')

canvas.height = 600 //window.innerHeight;
canvas.width = canvas.height //window.innerWidth;

export const c = canvas.getContext('2d')


export function canvasHeightPct(pct){
    return Math.round(canvas.height*pct/100)
}

export function canvasWidthPct(pct){
    return Math.round(canvas.width*pct/100)
}

let dropSelection = []

//-----------------------------CLASSES------------------------------------
const velocity = 0.1 // card movement velocity
const SUITS = ["♠", "♣", "♥", "♦"]
const VALUES = [  "A",  "2",  "3",  "4",  "5",  "6",  "7",  "8",  "9",  "10",  "J",  "Q",  "K", "joker"]

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
        // if (this.grab.movable && this.grab.holding){
        //     this.newPos(mouseX - this.grab.dx , mouseY - this.grab.dy)
        // }

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

        this.highlight = dropSelection.includes(this)

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
            this.cards.forEach(card => {
                card.update();
            })
        }
    }
}
  


export class Deck extends Stack{
    
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

export class Discards extends Stack{
    static scatterRadius = canvasHeightPct(13)
    static cornerRadius = 4

    constructor(x = 0, y = 0) {
        super([], x, y, true, 'down', false)
        // Can only buy the last card
        this.buyable = false
        this.highlight = false
        this.frame = false
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

        if (this.frame){
            c.save();
            c.strokeStyle = 'rgba(255, 25, 25, 1)';
            c.lineWidth = 3;
            
            c.beginPath();
            c.moveTo(this.x - Discards.scatterRadius + Discards.cornerRadius, this.y - Discards.scatterRadius);
            c.arcTo(this.x + Discards.scatterRadius, this.y - Discards.scatterRadius, this.x + Discards.scatterRadius, this.y + Discards.scatterRadius, Discards.cornerRadius);
            c.arcTo(this.x + Discards.scatterRadius, this.y + Discards.scatterRadius, this.x - Discards.scatterRadius, this.y + Discards.scatterRadius, Discards.cornerRadius);
            c.arcTo(this.x - Discards.scatterRadius, this.y + Discards.scatterRadius, this.x - Discards.scatterRadius, this.y - Discards.scatterRadius, Discards.cornerRadius);
            c.arcTo(this.x - Discards.scatterRadius, this.y - Discards.scatterRadius, this.x + Discards.scatterRadius, this.y - Discards.scatterRadius, Discards.cornerRadius);
            
            
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
        let type = response[1]
        cards = response[0]

        if (cards != false){
            // then cards is the cards array sorted
            this.cards = cards
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
        this.frame = false
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
                    descontinuitySize[i + descontinuitys] = VALUES.indexOf(cards[i].value) - 1 - VALUES.indexOf(cards[i-1].value)
                    descontinuitys += VALUES.indexOf(cards[i].value) - 1 - VALUES.indexOf(cards[i-1].value)
                }
                
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

    addCombination(cards){
        let response = Table.checkCombination(cards)
        if (response != false){
            let type = response[1]
            cards = response[0]
            console.log(response)
            this.combs.push(new Combination(cards, this.x, this.y, type))
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

        if (this.frame){
            c.save();
            c.strokeStyle = 'rgba(109, 237, 66, 1)';
            c.lineWidth = 3;

            c.beginPath();
            c.moveTo(this.x - this.w/2 + Table.cornerRadius, this.y - this.h/2);
            c.arcTo(this.x + this.w/2, this.y - this.h/2, this.x + this.w/2, this.y + this.h/2, Table.cornerRadius);
            c.arcTo(this.x + this.w/2, this.y + this.h/2, this.x - this.w/2, this.y + this.h/2, Table.cornerRadius);
            c.arcTo(this.x - this.w/2, this.y + this.h/2, this.x - this.w/2, this.y - this.h/2, Table.cornerRadius);
            c.arcTo(this.x - this.w/2, this.y - this.h/2, this.x + this.w/2, this.y - this.h/2, Table.cornerRadius);
            
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


export class Bot {
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

export class Player {
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