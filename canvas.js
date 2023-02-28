//------------------------------IMPORTS-----------------------------------
import {Card, Deck, Discards, Table, Button, User, Bot, Combination} from './classes.js';
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

let clickedElement = null
let holdingCard = null
let dropSelection = []
let mouseX = 0
let mouseY = 0
let mouseDownX = 0
let mouseDownY = 0
let mouseUpX = 0
let mouseUpY = 0
const botSlowness = 120 // time for bot to play = botSlowness/60 [s] 
let frameCount = 0


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
    
    user = new User(Deck.newHand(), canvasWidthPct(50), canvasHeightPct(97) - Card.h/2)
    const bot1 = new Bot(Deck.newHand(), canvasWidthPct(50), canvasHeightPct(3) + Card.h/2, 'up')
    const bot2 = new Bot(Deck.newHand(), canvasWidthPct(3) + Card.h/2, canvasHeightPct(50), 'left')
    const bot3 = new Bot(Deck.newHand(), canvasWidthPct(97) - Card.h/2, canvasHeightPct(50), 'right')
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
            if (Deck.numberOfCards() > 0 && clickedElement == Deck){
                user.buyFromDeck()
                phase = 'think' // Next state
            
            // user buys from discard pile
            } else if (Discards.buyable && clickedElement == Discards.lastCard()){
                dropSelection = [user.buyFromDiscards()]
                phase = 'drop'
            }

        // Possible actions when in 'drop' state
        } else if (phase == 'drop'){
            if (clickedElement == Table){
                if (user.dropCombination(dropSelection)) {
                    dropSelection = []
                    phase = 'think'
                } else {
                    // Invalid selection
                    dropSelection = dropSelection.slice(0, 1)
                }

            // user added cards to combination
            } else if (dropSelection.length >= 1 && clickedElement instanceof Combination){
                if (user.addToCombination(dropSelection, clickedElement)) {
                    dropSelection = []
                    phase = 'think'
                } else {
                    dropSelection = dropSelection.slice(0, 1)
                }
            
            // Click on discard pile to cancel the drop
            } else if (dropSelection.length == 1 && (clickedElement == Discards || clickedElement == Discards.lastCard())){
                user.discardCard(dropSelection[0])
                dropSelection = []
                // Next turn
                turn = nextPlayer(turn)
                phase = 'buy'
            }
        
        // Possible actions when in 'think' state
        } else if (phase == 'think'){
            // Discard a card and calls next user
            if (dropSelection.length == 1 && dropSelection[0].value != "joker" && (clickedElement == Discards || clickedElement == Discards.lastCard())){
                user.discardCard(dropSelection[0])
                dropSelection = []
                // Next turn
                turn = nextPlayer(turn)
                phase = 'buy'  
                
                // user added cards to combination
            } else if (dropSelection.length >= 1 && clickedElement instanceof Combination){
                user.addToCombination(dropSelection, clickedElement)
                dropSelection = []
                
            // user dropped a combination
            } else if (dropSelection.length >= 3 && clickedElement == Table){
                user.dropCombination(dropSelection)
                dropSelection = []
                
            } else if ((dropSelection.length > 1 || (dropSelection.length == 1 && dropSelection[0].value == "joker")) && clickedElement == Discards){
                // *** Adicionar warning se tentar jogar joker ou mais de uma carta
                console.log('Nao pode jogar essa selecao de cartas')
                dropSelection = []
            }

        } else if (phase == 'fly') {
            // Selected drop area to drop currently combination on the fly
            if (dropSelection.length >= 3 && clickedElement == Table){
                if (user.dropCombination(dropSelection)) {
                    dropSelection = []
                    phase = 'think'
                    turn = lastTurn
                } else {
                    dropSelection = dropSelection.slice(0, 1)
                }

            // user added cards to combination
            } else if (dropSelection.length >= 1 && clickedElement instanceof Combination){
                if (user.addToCombination(dropSelection, clickedElement)) {
                    dropSelection = []
                    phase = 'think'
                    turn = lastTurn
                } else {
                    dropSelection = dropSelection.slice(0, 1)
                }
                
            // Selected drop area to cancel the fly
            } else if (dropSelection.length == 1 && (clickedElement == Discards || clickedElement == Discards.lastCard())){
                user.discardCard(dropSelection[0])
                dropSelection = []
                phase = 'think'
                turn = lastTurn
            }
        }

    } else { // Not user turn
        // Selected discardPile to buy on the fly
        if (turn != nextPlayer(user) && phase == 'think' && Discards.buyable && clickedElement == Discards.lastCard()){
            lastTurn = turn
            phase = 'fly'
            turn = user
            dropSelection = [user.buyFromDiscards()]
        }
    }

    if (user.hand.numberOfCards() == 0){
        phase = 'win'
        turn = user
        for (let bot of bots) {
            for (let card of bot.hand.cards){
                card.flipped = true
            }
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

function nextPlayer(player){
    const currentIndex = order.indexOf(player)
    // define o próximo jogador pela ordem
    if (currentIndex == order.length - 1) {
        return order[0]
    } else {
        return order[currentIndex + 1]
    }
}



function botPlay(){
    // called every botSlowness/60 seconds
    if (turn == user) {
        // *** Check if bot can buy on the fly, in order
        return
    } else {
        if (phase == 'buy') {
            // *** ver se eh melhor comprar do lixo
            turn.buyFromDeck()
            phase = 'think'
        } else if (phase == 'think') {
            // Check if there is a game to drop
            // *** ideia para melhorar eficiencia em vez de tratar dos objetos cards, 
            //     tratar de objetos mais simples como {value, suit}

            let response;
            do{
                response = turn.checkForGame();
                console.log("response ", response);
                if (response != false){
                    turn.dropCombination(response);
                }
            } while (response != false);

            

            // *** ve se tem carta a adicionar em algum jogo

            // *** para descartar carta, nao ser joker, nao ser colocada, mais alta
            // *** Para melhorar descartar carta sem duble
            turn.discardCard(turn.hand.chooseRandomCard())
            
            turn = nextPlayer(turn)
            phase = 'buy'
        }
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
        holdingCard.update()
    }


    htmlDisplayAttributes()

    if (++frameCount >= botSlowness){
        botPlay()
        frameCount = 0
    }
}


init()
animate()


addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouseDownX = event.clientX - rect.left;
    mouseDownY = event.clientY - rect.top;

    

    // Finds which element it was clicked on, with a priority
    if (Deck.insideArea(mouseDownX, mouseDownY)){
        clickedElement = Deck

    } else if (Discards.lastCard() != null && Discards.lastCard().insideArea(mouseDownX, mouseDownY)) {
        clickedElement = Discards.lastCard()

    } else if (Discards.insideArea(mouseDownX, mouseDownY)){
        clickedElement = Discards

    } else if (Table.combs.some((comb) => comb.insideArea(mouseDownX, mouseDownY))){ // Check if the was in some combination
        for (let comb of Table.combs){
            if (comb.insideArea(mouseDownX, mouseDownY)){
                clickedElement = comb
                break
            }
        }

    } else if (Table.insideArea(mouseDownX, mouseDownY)){
        clickedElement = Table

    } else if (user.hand.cards.some((card) => card.insideArea(mouseDownX, mouseDownY))) {
        // Filter all cards if click was inside it
        let possibleCards =  user.hand.cards.filter((card) => card.insideArea(mouseDownX, mouseDownY))

        clickedElement = possibleCards[0]

        if (possibleCards.length > 1){
            // Find the closest card (by x corner) to the click point
            let closest_dx = mouseDownX - (clickedElement.x - Card.w/2)

            for (let i = 1; i < possibleCards.length; i++) {
                let card = possibleCards[i]
                let dx = mouseDownX - (card.x - Card.w/2)
                if (dx < closest_dx){
                    clickedElement = card
                    closest_dx = dx
                }
            }
        }

    } else {
        clickedElement = null
    }

    stateMachineUpdate()

    if (clickedElement instanceof Card){        
        if (clickedElement.grab.movable){
            holdingCard = clickedElement
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

    if (clickedElement instanceof Card && user.hand.cards.includes(clickedElement) && notMoved && turn == user && phase != 'buy'){
        // Selected or unselected a card to compose the drop combination
        // Cant unselect the bought card on the fly
        if (clickedElement != dropSelection[0] || (phase != 'fly' && phase != 'drop')) {
            if (dropSelection.includes(clickedElement)){
                dropSelection.splice(dropSelection.indexOf(clickedElement), 1)
            } else {
                dropSelection.push(clickedElement)
            }
            return
        }
        
    }

})

addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect()
    mouseX = event.clientX - rect.left
    mouseY = event.clientY - rect.top

    if (holdingCard != null) {
        holdingCard.newPos(mouseX - holdingCard.grab.dx, mouseY - holdingCard.grab.dy)
    } 

    const cond1 = turn == user && holdingCard == null

    Deck.highlight = cond1 && phase == 'buy' && Deck.insideArea(mouseX, mouseY)

    if (Discards.lastCard() != null){
        Discards.lastCard().highlight = Discards.lastCard().insideArea(mouseX, mouseY) && holdingCard == null && ((phase == 'buy' && turn == user) || (phase == 'think' && turn != user && turn != nextPlayer(user))) 
    } 
    
    Discards.frame = Discards.insideArea(mouseX, mouseY) && cond1 && dropSelection.length == 1 && phase != 'buy'
    
    for (let comb of Table.combs){
        comb.highlight = dropSelection.length >= 1 && comb.insideArea(mouseX, mouseY) && cond1 && phase != 'buy'
    }

    Table.frame = cond1 && phase != 'buy' && dropSelection.length >= 3 && Table.insideArea(mouseX, mouseY) && !Table.combs.some((comb) => comb.insideArea(mouseX, mouseY))

    // // Spread cards when mouse is over
    // if (user.hand.insideArea(mouseX, mouseY)){
    //     user.hand.spacing = Card.w + 2
    // } else {
    //     user.hand.spacing = Hand.defaultSpacing
    // }
})
