//------------------------------IMPORTS-----------------------------------
import {Card, Deck, Discards, Table, Button, User, Bot} from './classes.js';
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


let user
let bots
let elements
let order
let turn
let lastTurn
let phase // buy -> think
            //      fly <->  (phase that can happen on the think phase)

function init(){
    // Begin round
    Deck.init(canvasWidthPct(33.33), canvasHeightPct(35))
    Discards.init(canvasWidthPct(64),  canvasHeightPct(33))
    Table.init(canvasWidthPct(50), canvasHeightPct(66.67), canvasWidthPct(66.67), canvasHeightPct(36.67))
    
    // cancelButton = new Button(canvasWidthPct(8), canvasHeightPct(78), canvasWidthPct(14), canvasHeightPct(6), 'Cancel', false)
    // dropButton = new Button(canvasWidthPct(92), canvasHeightPct(78), canvasWidthPct(14), canvasHeightPct(6), 'Drop', false)
    
    user = new User(Deck.buy(9), canvasWidthPct(50), canvasHeightPct(97) - Card.h/2)
    const bot1 = new Bot(Deck.buy(9), canvasWidthPct(50), canvasHeightPct(3) + Card.h/2, 'up')
    const bot2 = new Bot(Deck.buy(9), canvasWidthPct(3) + Card.h/2, canvasHeightPct(50), 'left')
    const bot3 = new Bot(Deck.buy(9), canvasWidthPct(97) - Card.h/2, canvasHeightPct(50), 'right')
    bots = [bot1, bot2, bot3]

    //                                           cancelButton, dropButton,
    elements = [Deck, Discards, Table, user, bot1, bot2, bot3]

    order = [user, bot2, bot1, bot3] // sentido horário
    turn = order[0]
    phase = 'buy'
}

function htmlDisplayAttributes() {
    // update the cells in the table with the values of the Round class attributes
    document.getElementById("deck").innerHTML = Deck.numberOfCards()
    document.getElementById("discardPile").innerHTML = Discards.numberOfCards()
    document.getElementById("turn").innerHTML = turn.orientation
    document.getElementById("phase").innerHTML = phase
}
    

function stateMachineUpdate(){
    // Called on mousedown event
    // States when is user's turn
    if (turn == user){
        // Possible actions when in 'buy' state
        if (phase == 'buy'){
            // user buys from deck
            if (Deck.numberOfCards() > 0 && Deck.insideArea(mouseDownX, mouseDownY)){
                user.buyFromDeck()
                phase = 'think' // Next state
            
            // user buys from discard pile
            } else if (Discards.buyable && Discards.lastCard() == clickedCard){
                dropSelection = [user.buyFromDiscards()]
                phase = 'drop'
            }

        // Possible actions when in 'drop' state
        } else if (phase == 'drop'){
            if (Table.insideArea(mouseDownX, mouseDownY)){
                if (user.dropCombination(dropSelection)) {
                    dropSelection = []
                    phase = 'think'
                } else {
                    // Invalid selection
                    dropSelection = dropSelection.slice(0, 1)
                }
            // Click on discard pile to cancel the drop
            } else if (dropSelection.length == 1 && Discards.insideArea(mouseDownX, mouseDownY)){
                user.discardCard(dropSelection[0])
                dropSelection = []
                // Next turn
                turn = nextPlayer(turn)
                phase = 'buy'
            }
        
        // Possible actions when in 'think' state
        } else if (phase == 'think'){
            // Discard a card and calls next user
            // *** Adicionar warning se tentar jogar joker ou mais de uma carta
            if (dropSelection.length == 1 && dropSelection[0].value != "joker" && Discards.insideArea(mouseDownX, mouseDownY)){
                user.discardCard(dropSelection[0])
                dropSelection = []
                // Next turn
                turn = nextPlayer(turn)
                phase = 'buy'
                // if (bots.includes(turn)) {
                //     // O bot joga
                //     botPlay()
                // }

            // user dropped a combination
            } else if (Table.insideArea(mouseDownX, mouseDownY)){
                user.dropCombination(dropSelection)
                dropSelection = []
            }


        } else if (phase == 'fly') {
            // Selected drop area to drop currently combination on the fly
            if (Table.insideArea(mouseDownX, mouseDownY)){
                if (user.dropCombination(dropSelection)) {
                    dropSelection = []
                    phase = 'think'
                    turn = lastTurn
                } else {
                    dropSelection = dropSelection.slice(0, 1)
                }

            // Selected drop area to cancel the fly
            } else if (dropSelection.length == 1 && Discards.insideArea(mouseDownX, mouseDownY)){
                user.discardCard(dropSelection[0])
                dropSelection = []
                phase = 'think'
                turn = lastTurn
            }
        }

    } else { // Not user turn
        // Selected discardPile to buy on the fly
        if (turn != nextPlayer(user) && phase == 'think' && Discards.buyable && Discards.lastCard() == clickedCard){
            lastTurn = turn
            phase = 'fly'
            turn = user
            dropSelection = [user.buyFromDiscards()]
        }
    }        
}

function botPlayCheck(){
    // called every botSlowness/60 seconds
    if (turn == user) {
        // *** Check if bot can buy on the fly, in order
        return
    } else {
        if (phase == 'buy') {
            turn.buyFromDeck();
            phase = 'think'
        } else if (phase == 'think') {
            dropSelection = [turn.hand.chooseRandomCard()]
            turn.discardCard(dropSelection[0])
            dropSelection = []
            turn = nextPlayer(turn)
            phase = 'buy'
        }
    }  
}

// static endTurn() { // Finaliza o turno atual
//     turn = nextuser(turn)
//     phase = 'buy'
//     if (bots.includes(turn)) {
//         // O bot joga
//         botPlay()
//     }
// }

function nextuser(user){
    const currentIndex = order.indexOf(user)
    // define o próximo jogador pela ordem
    if (currentIndex == order.length - 1) {
        return order[0]
    } else {
        return order[currentIndex + 1]
    }
}


// static botPlay(){
//     if (phase == 'buy'){
//         setTimeout(function() { 
//             turnBuyFromDeck();
//             // If someone buys on the fly, waits to discard a card
//             const checkPhase = setInterval(function() {
//                 if (phase != 'fly') {
//                   clearInterval(checkPhase);
//                   turnDiscardCard(turn.hand.chooseRandomCard())
//                 }
//               }, 3000); // sets the bot play speed
//         }, 1000);
//     }        
// }



  

//---------------------------------MAIN------------------------------
function animate(){ // default FPS = 60
    // setup block
    requestAnimationFrame(animate)
    c.clearRect(0, 0, innerWidth, innerHeight)
    // setup block end
    user.hand.cards.forEach(card => {card.highlight = dropSelection.includes(card)})

    elements.forEach(elem => {elem.update()})
    // desenha a carta segurada por ultimo para ficar em primeiro
    if (holdingCard != null){
        holdingCard.draw()
    }


    htmlDisplayAttributes()

    if (++frameCount >= botSlowness){
        botPlayCheck()
        frameCount = 0
    }
}


init()
let frameCount = 0
animate()


addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouseDownX = event.clientX - rect.left;
    mouseDownY = event.clientY - rect.top;

    // Finds which card was clicked in some groups: user.hand, discardPile.cards, Table.combs
    clickedCard = null
    // Filter all cards if click was inside it
    let possibleCards =  user.hand.cards.filter(card => card.insideArea(mouseDownX, mouseDownY))
    possibleCards = possibleCards.concat(Discards.cards.filter(card => card.insideArea(mouseDownX, mouseDownY)))
    for (let comb of Table.combs) {
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

    stateMachineUpdate()

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

    if (clickedCard != null && user.hand.cards.includes(clickedCard) && notMoved && turn == user && phase != 'buy'){
        // Selected or unselected a card to compose the drop combination
        if ((phase == 'fly' || phase == 'drop') && clickedCard == dropSelection[0]){
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

    const cond1 = turn == user && holdingCard == null && dropSelection.length >= 1
    const cond2 = phase == 'think' || phase == 'fly'

    let insideAnyComb = false
    for (let comb of Table.combs) {
        if (comb.insideArea(mouseX, mouseY)){
            insideAnyComb = true
        }
        comb.highlight = cond1 && cond2 && comb.insideArea(mouseX, mouseY)
    }
    if (insideAnyComb){
        Table.frame = false
    } else {
        Table.frame = cond1 && cond2 && Table.insideArea(mouseX, mouseY)
    }
    Discards.frame = cond1 && cond2 && dropSelection.length == 1 && Discards.insideArea(mouseX, mouseY)
    
    // // Spread cards when mouse is over
    // if (user.hand.insideArea(mouseX, mouseY)){
    //     user.hand.spacing = Card.w + 2
    // } else {
    //     user.hand.spacing = Hand.defaultSpacing
    // }
})
