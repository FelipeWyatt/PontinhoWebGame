//------------------------------IMPORTS-----------------------------------
import {Card, Stack, Deck, Discards, Hand, Combination, Table, Button, Player, Bot} from './classes.js';
import {canvas, c} from './classes.js';
import {canvasHeightPct, canvasWidthPct} from './classes.js';
// import ace from './img/png/1x/spade_1.png'
// const ace = new Image() // Create new img element
// ace.src = "./img/png/1x/spade_1.png" // Set source path
// to draw the image
// c.drawImage(ace, 0, 0, ace.width, ace.height, this.x , this.y, Card.w, Card.h)

            

//---------------------------CANVAS SETUP---------------------------------
// c.scale(1.5, 1.5) // zoom in canvas draws 
// Ideia, para ocupar o máximo da tela dar scale a partir de um fator do window.innerHeight
// igual ao funcionamento do colonist.io

let clickedCard = null
let holdingCard = null
let dropSelection = []
let mouseX = 0
let mouseY = 0
let mouseDownX = 0
let mouseDownY = 0
let mouseUpX = 0
let mouseUpY = 0
const botSlowness = 120 // time for bot to play = botSlowness/60 [s] 


//-----------------------------CLASSES------------------------------------
const velocity = 0.1 // card movement velocity
const SUITS = ["♠", "♣", "♥", "♦"]
const VALUES = [  "A",  "2",  "3",  "4",  "5",  "6",  "7",  "8",  "9",  "10",  "J",  "Q",  "K", "joker"]


class Round{// Classe static pois não é necessário estanciá-la
    static deck
    static discardPile
    static table
    // static dropButton
    // static cancelButton
    static player
    static bots
    static elements
    static order
    static turn
    static lastTurn
    static phase // buy -> think
                //      fly <->  (phase that can happen on the think phase)

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
        Round.discardPile = new Discards(canvasWidthPct(64),  canvasHeightPct(33))
        Round.table = new Table(canvasWidthPct(50), canvasHeightPct(66.67), canvasWidthPct(66.67), canvasHeightPct(36.67))
        
        // Round.cancelButton = new Button(canvasWidthPct(8), canvasHeightPct(78), canvasWidthPct(14), canvasHeightPct(6), 'Cancel', false)
        // Round.dropButton = new Button(canvasWidthPct(92), canvasHeightPct(78), canvasWidthPct(14), canvasHeightPct(6), 'Drop', false)
        
        Round.player = new Player(Round.deck.buy(9), canvasWidthPct(50), canvasHeightPct(97) - Card.h/2)
        const bot1 = new Bot(Round.deck.buy(9), canvasWidthPct(50), canvasHeightPct(3) + Card.h/2, 'up')
        const bot2 = new Bot(Round.deck.buy(9), canvasWidthPct(3) + Card.h/2, canvasHeightPct(50), 'left')
        const bot3 = new Bot(Round.deck.buy(9), canvasWidthPct(97) - Card.h/2, canvasHeightPct(50), 'right')
        Round.bots = [bot1, bot2, bot3]

        //                                           Round.cancelButton, Round.dropButton,
        Round.elements = [Round.deck, Round.discardPile, Round.table, Round.player, bot1, bot2, bot3]
        console.log(Round.elements)

        Round.order = [Round.player, bot2, bot1, bot3] // sentido horário
        Round.turn = Round.order[0]
        Round.phase = 'buy'
    }

    static stateMachineUpdate(){
        // Called on mousedown event
        // States when is player's turn
        if (Round.turn == Round.player){
            // Possible actions when in 'buy' state
            if (Round.phase == 'buy'){
                // Player buys from deck
                if (Round.deck.numberOfCards() > 0 && Round.deck.insideArea(mouseDownX, mouseDownY)){
                    Round.turnBuyFromDeck()
                    Round.phase = 'think' // Next state
                
                // Player buys from discard pile
                } else if (Round.discardPile.buyable && Round.discardPile.lastCard() == clickedCard){
                    Round.turnBuyFromDiscardPile()
                    Round.phase = 'drop'
                }

            // Possible actions when in 'drop' state
            } else if (Round.phase == 'drop'){
                if (Round.table.insideArea(mouseDownX, mouseDownY)){
                    if (Round.turnDropCombination(dropSelection)) {
                        dropSelection = []
                        Round.phase = 'think'
                    } else {
                        dropSelection = dropSelection.slice(0, 1)
                    }
                // Click on discard pile to cancel the drop
                } else if (dropSelection.length == 1 && Round.discardPile.insideArea(mouseDownX, mouseDownY)){
                    Round.turn.hand.remove(dropSelection[0])
                    Round.discardPile.add(dropSelection[0])
                    dropSelection = []
                    // Next turn
                    Round.turn = Round.nextPlayer(Round.turn)
                    Round.phase = 'buy'
                }
            
            // Possible actions when in 'think' state
            } else if (Round.phase == 'think'){
                // Discard a card and calls next player
                // *** Adicionar warning se tentar jogar joker ou mais de uma carta
                if (dropSelection.length == 1 && dropSelection[0].value != "joker" && Round.discardPile.insideArea(mouseDownX, mouseDownY)){
                    Round.turnDiscardCard()
                    dropSelection = []
                    // Next turn
                    Round.turn = Round.nextPlayer(Round.turn)
                    Round.phase = 'buy'
                    // if (Round.bots.includes(Round.turn)) {
                    //     // O bot joga
                    //     Round.botPlay()
                    // }

                // Player dropped a combination
                } else if (Round.table.insideArea(mouseDownX, mouseDownY)){
                    Round.turnDropCombination(dropSelection)
                    dropSelection = []
                }


            } else if (Round.phase == 'fly') {
                // Selected drop area to drop currently combination on the fly
                if (Round.table.insideArea(mouseDownX, mouseDownY)){
                    if (Round.turnDropCombination(dropSelection)) {
                        dropSelection = []
                        Round.phase = 'think'
                        Round.turn = lastTurn
                    } else {
                        dropSelection = dropSelection.slice(0, 1)
                    }

                // Selected drop area to cancel the fly
                } else if (dropSelection.length == 1 && Round.discardPile.insideArea(mouseDownX, mouseDownY)){
                    Round.turn.hand.remove(dropSelection[0])
                    Round.discardPile.add(dropSelection[0])
                    dropSelection = []
                    Round.phase = 'think'
                    Round.turn = Round.lastTurn
                }
            }

        } else { // Not player turn
            // Selected discardPile to buy on the fly
            if (Round.turn != Round.nextPlayer(Round.player) && Round.phase == 'think' && Round.discardPile.buyable && Round.discardPile.lastCard() == clickedCard){
                Round.lastTurn = Round.turn
                Round.phase = 'fly'
                Round.turn = Round.player
                Round.boughtOnTheFLy(Round.player)
            }
        }        
    }

    static botPlayCheck(){
        // called every botSlowness/60 seconds
        if (Round.turn == Round.player) {
            // *** Check if bot can buy on the fly, in order
            return
        } else {
            if (Round.phase == 'buy') {
                Round.turnBuyFromDeck();
                Round.phase = 'think'
            } else if (Round.phase == 'think') {
                dropSelection.push(Round.turn.hand.chooseRandomCard())
                Round.turnDiscardCard()
                dropSelection = []
                Round.turn = Round.nextPlayer(Round.turn)
                Round.phase = 'buy'
            }
        }  
    }

    static turnBuyFromDeck(){
        // player or bot of turn took an action to buy from deck
        Round.turn.hand.add(Round.deck.buy())
    }

    static turnBuyFromDiscardPile(){
        // player or bot of turn took an action to buy from discardPile
        // Round.turn.hand.add(Round.discardPile.buy())
        const lastCard = Round.discardPile.buy() 
        Round.turn.hand.add(lastCard)
        dropSelection.push(lastCard)
    }

    static turnDropCombination(cards){
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

    static boughtOnTheFLy(player){
        // precisa baixar um jogo com a carta e volta para o turno e phase
        const lastCard = Round.discardPile.buy() 
        player.hand.add(lastCard)
        dropSelection.push(lastCard)
    }

    static turnDiscardCard(){
        Round.discardPile.add(Round.turn.hand.remove(dropSelection[0]))
    }

    // static endTurn() { // Finaliza o turno atual
    //     Round.turn = Round.nextPlayer(Round.turn)
    //     Round.phase = 'buy'
    //     if (Round.bots.includes(Round.turn)) {
    //         // O bot joga
    //         Round.botPlay()
    //     }
    // }

    static nextPlayer(player){
        const currentIndex = Round.order.indexOf(player)
        // define o próximo jogador pela ordem
        if (currentIndex == Round.order.length - 1) {
            return Round.order[0]
        } else {
            return Round.order[currentIndex + 1]
        }
    }

    
    // static botPlay(){
    //     if (Round.phase == 'buy'){
    //         setTimeout(function() { 
    //             Round.turnBuyFromDeck();
    //             // If someone buys on the fly, waits to discard a card
    //             const checkPhase = setInterval(function() {
    //                 if (Round.phase != 'fly') {
    //                   clearInterval(checkPhase);
    //                   Round.turnDiscardCard(Round.turn.hand.chooseRandomCard())
    //                 }
    //               }, 3000); // sets the bot play speed
    //         }, 1000);
    //     }        
    // }
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

    if (++frameCount >= botSlowness){
        Round.botPlayCheck()
        frameCount = 0
    }
}

Round.init()
let frameCount = 0
animate()


addEventListener('mousedown', (event) => {
    // *** Mover condições para as funções em Round
    // *** tornar variaveis desse escopo globais
    const rect = canvas.getBoundingClientRect();
    mouseDownX = event.clientX - rect.left;
    mouseDownY = event.clientY - rect.top;

    // console.log(mouseX, mouseY)

    // Finds which card was clicked in some groups: player.hand, discardPile.cards, Table.combs
    clickedCard = null
    // Filter all cards if click was inside it
    let possibleCards =  Round.player.hand.cards.filter(card => card.insideArea(mouseDownX, mouseDownY))
    possibleCards = possibleCards.concat(Round.discardPile.cards.filter(card => card.insideArea(mouseDownX, mouseDownY)))
    for (let comb of Round.table.combs) {
        possibleCards = possibleCards.concat(comb.cards.filter(card => card.insideArea(mouseDownX, mouseDownY)))
    }

    if (possibleCards.length >= 1){
        // Find the closest card (by x corner) to the click point
        clickedCard = possibleCards[0]
        let closest_dx = mouseDownX - (clickedCard.x - Card.w/2)

        for (let i = 1; i < possibleCards.length; i++) {
            let card = possibleCards[i]
            let dx = mouseDownX - (card.x - Card.w/2)
            if (dx < closest_dx){
                clickedCard = card
                closest_dx = dx
            }
        }
    }

    Round.stateMachineUpdate()

    if (clickedCard != null){        
        if (clickedCard.grab.movable){
            holdingCard = clickedCard
            holdingCard.grab.holding = true
            holdingCard.grab.dx = mouseDownX - holdingCard.x
            holdingCard.grab.dy = mouseDownY - holdingCard.y
            return
        }
    }
})

addEventListener('mouseup', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    mouseUpX = x
    mouseUpY = y

    if (holdingCard != null){
        holdingCard.grab.holding = false
        holdingCard = null
    }

    // 3 pixels square tolerance
    const notMoved = Math.abs(mouseDownX - mouseUpX) <= 3 && Math.abs(mouseDownY - mouseUpY) <= 3

    if (clickedCard != null && Round.player.hand.cards.includes(clickedCard) && notMoved && Round.turn == Round.player && Round.phase != 'buy'){
        // Selected or unselected a card to compose the drop combination
        if ((Round.phase == 'fly' || Round.phase == 'drop') && clickedCard == dropSelection[0]){
            // Cant unselect the bought card on the fly
            console.log('fly case, dropSelection:')
            console.log(dropSelection)
            return
        } else {
            if (dropSelection.includes(clickedCard)){
                dropSelection.splice(dropSelection.indexOf(clickedCard), 1)
            } else {
                dropSelection.push(clickedCard)
            }
            console.log('selected card, dropSelection:')
            console.log(dropSelection)
            return
        }
        
    }

})

addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect()
    mouseX = event.clientX - rect.left
    mouseY = event.clientY - rect.top

    if (holdingCard != null && holdingCard.grab.movable) {
        holdingCard.newTargetPos(mouseX, mouseY)
    }

    const cond1 = Round.turn == Round.player && holdingCard == null && dropSelection.length >= 1
    const cond2 = Round.phase == 'think' || Round.phase == 'fly'

    let insideAnyComb = false
    for (let comb of Round.table.combs) {
        if (comb.insideArea(mouseX, mouseY)){
            insideAnyComb = true
        }
        comb.highlight = cond1 && cond2 && comb.insideArea(mouseX, mouseY)
    }
    if (insideAnyComb){
        Round.table.frame = false
    } else {
        Round.table.frame = cond1 && cond2 && Round.table.insideArea(mouseX, mouseY)
    }
    Round.discardPile.frame = cond1 && cond2 && dropSelection.length == 1 && Round.discardPile.insideArea(mouseX, mouseY)
    


    
    // // Spread cards when mouse is over
    // if (Round.player.hand.insideArea(mouseX, mouseY)){
    //     Round.player.hand.spacing = Card.w + 2
    // } else {
    //     Round.player.hand.spacing = Hand.defaultSpacing
    // }
})
