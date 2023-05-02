//------------------------------IMPORTS-----------------------------------
import {Card, Deck, Discards, Table, Button, User, Bot, Combination} from './classes.js';
import {canvas, c} from './classes.js';
import {canvasHeightPct, canvasWidthPct} from './classes.js';


// -----------------------------TO DO LIST--------------------------------
// + Adicionar estados de Segurando joker e Batida
// + Fazer funcionar para web mobile
//      - Tutorial: https://bencentra.com/code/2014/12/05/html5-canvas-touch-events.html
//      - Fazer zoom fitar tela
// + Escrever Livro de regras
//      - Incluir batidas por 4 dublês e flush
//      - Incluir sistema de fichas
//      - Incluir Espivinca e Loba
// + Tutorial e/ou dicas com pop-ups
// + Resolver pontuação da Rodada e fichas ganhas na sessão
// + Possibilitar alterar velocidade das jogadas dos bots
// + Alterar nível de dificuldade dos bots

// + Futuras versões e ideias:
//      - Versão 2.0: de 4 a 6 jogadores na mesa, gráficos melhorados e mais eficiente.
//      - Versão 3.0: database e online/friends play

//---------------------------FSM (Final State Machine)---------------------

class State {
    constructor(name){
        this.name = name;
        this.stateMachine = null;
        this.connections = [];
        // Function to return the new state (or not) based on an action
        this.eventHandler = (event) => {return this};
        // Piece of code to do when entering the state, called in run inside FSM
        this.enter = () => {return true};
        // Piece of code to do when exiting the state, called in run inside FSM
        this.exit = () => {return true};
    }

    setStateMachine(stateMachine){
        this.stateMachine = stateMachine;
    }

    setConnections(listPossibleStates){
        this.connections = listPossibleStates;
    }

    setHandlerFunction(func){
        this.eventHandler = func;
    }

    setEnterFunction(func){
        this.enter = func;
    }

    setExitFunction(func){
        this.exit = func;
    }    

    toString(){
		let msg = this.name + " -> (";

        for (let state of this.connections){
            msg += state.name + ", ";
        }
		
		msg = msg.slice(0, msg.length-2) + ")";
        return msg;
    }
}

class StateWithDropSelection extends State {
    constructor(name){
		super(name);
		this.dropSelection = [];
        this.defaultEnterFunction = () => {
            this.clearDropSelection();
        };
        this.defaultExitFunction = () => {
            this.clearDropSelection();
        };
	}

    setEnterFunction(func){
        this.enter = () => {
            this.defaultEnterFunction();
            func();
        }
    }

    setExitFunction(func){
        this.exit = () => {
            this.defaultExitFunction();
            func();
        }
    }

    setDropSelection(cards){
        // Downlight the previous cards
        this.dropSelection.forEach(card => {card.highlight = false});
        this.dropSelection = cards;
        this.dropSelection.forEach(card => {card.highlight = true});
    }
    
    addToDropSelection(card){
        card.highlight = true;
        this.dropSelection.push(card);
    }

    removeFromDropSelection(card){
        card.highlight = false;
        this.dropSelection.splice(this.dropSelection.indexOf(card), 1);
    }

    clearDropSelection(){
        this.dropSelection.forEach(card => {card.highlight = false});
        this.dropSelection = [];
    }
}

class StateWithLockedCard extends StateWithDropSelection {
	constructor(name){
		super(name);
		this.lockedCard = null;
        this.defaultEnterFunction = (lockedCard) => {
            this.setLockedCard(lockedCard);
        };
        this.defaultExitFunction = () => {
            this.clearLockedCard();
        };
	}

    setEnterFunction(func){
        this.enter = (lockedCard) => {
            this.defaultEnterFunction(lockedCard);
            func();
        }
    }

    setExitFunction(func){
        this.exit = () => {
            this.defaultExitFunction();
            func();
        }
    }

    setLockedCard(card){
        this.lockedCard = card;
        this.resetDropSelection();
    }

    clearDropSelection(){
        this.lockedCard = null;
        super.clearDropSelection();
    }

    resetDropSelection(){
        this.setDropSelection([this.lockedCard]);
    }
}

/*
class TraceableState extends State {
	constructor(name){
		super(name);
		this.movements = [];
	}
	
	addMovement(card, fromObj, toObj){
		this.movements.push({'obj':card, 'from':fromObj, 'to':toObj});
	}
	
	clearMovements(){
		this.movements = [];
	}
	
	undoMovements(){
		for (let i = this.movements.length - 1; i >= 0; i--){
			let card = this.movements[i]['card'];
			let fromObj = this.movements[i]['from'];
			let toObj = this.movements[i]['to'];
			
			// Para cada tipo de objeto, adicionar de forma diferente
			toObj.remove(card);
			toObj.update();
			fromObj.add(card);
			fromObj.update();
		}
		return true;
	}
}
*/

//----------------------FSM (Finite State Machine)-----------------
class FSM {
    // Finite State Machine
    constructor(name){
        this.name = name;
        this.statesList = [];
        this.state = null;
        this.lastState = null;
        this.startState = null;
        this.finalState = null;
    }

    addState(newState){
        newState.setStateMachine(this);
        this.statesList.push(newState);
    }

    addStates(newStates){
        for (let state of newStates){
            this.addState(state);
        }
    }

    init(initialState, finalState){
        this.state = initialState;
        this.lastState = this.state;
        this.startState = initialState;
        this.finalState = finalState;
    }

    run(event){
        this.state.eventHandler(event);
        return this.state;
    }

    changeState(newState, auxParam = null){
        if (this.state != this.finalState){
            this.state.exit();
            this.lastState = this.state;
            this.state = newState;
            if (auxParam != null) {
                newState.enter(auxParam);
            } else {
                newState.enter();
            }
        }
    }

    checkWin(player){
        if (player.hand.numberOfCards() == 0){
            phaseMachine.state = this.finalState;
            turn = player;
        }
    }

    toString(){
        let msg = this.name + " FSM:\n+ State: " + this.state.name + "\n";
		msg += "+ Last state: " + this.lastState.name + "\n";
		
		msg += "+ Flow graph:\n";

        for (let state of this.statesList){
            msg += "\t" + state.toString() + "\n";
        }
        
        return msg;
    }
}

//-----------------------------GLOBAL VARIABLES--------------------------
const gameSlowness = 2000 // time of bot plays and waiting for fly in ms
let frameCount = 0
let clickedElement = null
let holdingCard = null
let mouseDownX = 0
let mouseDownY = 0

//------------------------------INIT--------------------------

// Begin round
Deck.init(canvasWidthPct(33.33), canvasHeightPct(35))
Discards.init(canvasWidthPct(64),  canvasHeightPct(33))
Table.init(canvasWidthPct(50), canvasHeightPct(66.67), canvasWidthPct(66.67), canvasHeightPct(36.67))

// cancelButton = new Button(canvasWidthPct(8), canvasHeightPct(78), canvasWidthPct(14), canvasHeightPct(6), 'Cancel', false)
// dropButton = new Button(canvasWidthPct(92), canvasHeightPct(78), canvasWidthPct(14), canvasHeightPct(6), DROP, false)

const user = new User(Deck.newHand(), canvasWidthPct(50), canvasHeightPct(97) - Card.h/2)
const bot1 = new Bot(Deck.newHand(), canvasWidthPct(50), canvasHeightPct(3) + Card.h/2, 'up')
const bot2 = new Bot(Deck.newHand(), canvasWidthPct(3) + Card.h/2, canvasHeightPct(50), 'left')
const bot3 = new Bot(Deck.newHand(), canvasWidthPct(97) - Card.h/2, canvasHeightPct(50), 'right')
const bots = [bot1, bot2, bot3]

//                                           cancelButton, dropButton,
const elements = [Deck, Discards, Table, user, bot1, bot2, bot3]

let order = [user, bot2, bot1, bot3] // sentido horário
let turn = order[0]
let lastTurn = null // *** Criar FSM para turnos, e método que volta para o ultimo turno, trocar turn = nextPlayer(turn) para funcao dessa nova FSM 

//---------------------------------STATES----------------------------------

const phaseMachine = new FSM('Phase');

const BUY = new State('buy');
const DROP = new StateWithLockedCard('drop');
const WAIT = new State('wait');
const THINK = new StateWithDropSelection('think');
const FLY = new StateWithLockedCard('fly');
// const JOKER = new State('joker');
// const ENDING = new State('ending');
const WIN = new State('win');

// *** Add ending and joker functionalities

BUY.setConnections([WAIT, DROP]);
BUY.setEnterFunction(() => {
    if (turn != user){ // Bot
        // *** Só compra se o descarte seria a melhor combinacao, para melhorar comprar se gerar jogo
        let hipotheticalBestComb = turn.checkForGame([...turn.hand.cards, Discards.lastCard()])

        // Compra do descarte se a melhor combinacao é feita com a carta do descarte
        if (hipotheticalBestComb != false && hipotheticalBestComb.includes(Discards.lastCard())){
            setTimeout(() => {
                phaseMachine.changeState(DROP, turn.buyFromDiscards());
            }, gameSlowness);
            
        } else {
            setTimeout(() => {
                turn.buyFromDeck()
                phaseMachine.changeState(WAIT);
            }, gameSlowness);
        }

    }
});

BUY.setHandlerFunction((clickedElement) => {
    if (turn == user){
        // Possible actions when in BUY state
        // user buys from deck
        if (Deck.numberOfCards() > 0 && clickedElement == Deck){
            user.buyFromDeck();
            
            phaseMachine.changeState(WAIT); // Next state
        
        // user buys from discard pile
        } else if (Discards.buyable && clickedElement == Discards.lastCard()){
            
            phaseMachine.changeState(DROP, user.buyFromDiscards());
        }
    }
});

DROP.setConnections([THINK, WIN, BUY]);
DROP.setEnterFunction(() => {
    if (turn != user) { // Bot
        // *** Só compra se o descarte seria a melhor combinacao, para melhorar comprar se gerar jogo
        setTimeout(() => {
            turn.dropCombination(turn.checkForGame([...turn.hand.cards, DROP.lockedCard]));
            phaseMachine.checkWin(turn);
            phaseMachine.changeState(THINK);
        }, gameSlowness);
    }
});
DROP.setHandlerFunction((clickedElement) => {
    if (turn == user){
        if (clickedElement == Table){
            if (user.dropCombination(DROP.dropSelection)) {
                
                phaseMachine.checkWin(user);
                
                phaseMachine.changeState(THINK);

            } else {
                // Invalid selection
                DROP.resetDropSelection();
            }
        
        // user added cards to combination
        } else if (DROP.dropSelection.length >= 1 && clickedElement instanceof Combination){
            if (user.addToCombination(DROP.dropSelection, clickedElement)) {

                phaseMachine.checkWin(user);
                
                phaseMachine.changeState(THINK);

            } else {
                DROP.resetDropSelection();
            }
    
        // Click on discard pile to cancel the drop
        } else if (DROP.dropSelection.length == 1 && (clickedElement == Discards || clickedElement == Discards.lastCard())){
            user.discardCard(DROP.lockedCard)
            
            // Next turn
            turn = nextPlayer(turn)
            phaseMachine.changeState(BUY);
        }
    } 
});



let playerThatWantsFly = null;
let changingStateTimer = null;

WAIT.setConnections([THINK]);
WAIT.setEnterFunction(() => {
    playerThatWantsFly = null;
    changingStateTimer = null;
    if (Discards.buyable) {
        
        // *** Adicionar feature que quem vai bater com a carta tem prioridade
        for (let player = nextPlayer(turn); player != previousPlayer(turn); player = nextPlayer(player)){
            if (player != user) { // then it is bot
                // *** em vez de checar da melhor comb, checa se é possivel usar a locked card em alguma
                let hipotheticalBestComb = player.checkForGame([...player.hand.cards, Discards.lastCard()])

                // Bot quer comprar no voô se a melhor combinacao é feita com a carta do descarte
                if (hipotheticalBestComb != false && hipotheticalBestComb.includes(Discards.lastCard())){
                    playerThatWantsFly = player;
                    changingStateTimer = setTimeout(() => {
                        lastTurn = turn;
                        turn = player;
                        phaseMachine.changeState(FLY, player.buyFromDiscards());
                    }, gameSlowness);
                    
                    return
                }
            } 
        }

        // Nenhum player quer a carta
        changingStateTimer = setTimeout(() => {
            phaseMachine.changeState(THINK);
        }, gameSlowness);
        
    } else {
        phaseMachine.changeState(THINK);
    }
    
});

WAIT.setHandlerFunction((clickedElement) => {
    if (turn != user){
        if (clickedElement == Discards.lastCard()){
            // Checa se alguem quis comprar

            if (playerThatWantsFly != null) {
                // Checa se player tem prioridade sobre usuário
                let hasPriority = false;
                for (let player = nextPlayer(turn); player != user; player = nextPlayer(player)){
                    if (player == playerThatWantsFly){
                        hasPriority = true;
                    }
                }

                if (!hasPriority) {
                    clearTimeout(changingStateTimer); // Cancela o timer para mudar de estado
                    // *** Colocar essas mudanças de turn e locked card no .enterState() do Fly
                    lastTurn = turn
                    turn = user
                    phaseMachine.changeState(FLY, user.buyFromDiscards());  
                }

            } else {
                clearTimeout(changingStateTimer); // Cancela o timer para mudar de estado
                // *** Colocar essas mudanças de turn e locked card no .enterState() do Fly
                lastTurn = turn
                turn = user
                phaseMachine.changeState(FLY, user.buyFromDiscards());  

            }
        }
    }
});

THINK.setConnections([WIN, BUY]);
THINK.setEnterFunction(() => {
    if (turn != user) {// Bot
        setTimeout(() => {
            // Check if there is a game to drop
            // *** ideia para melhorar eficiencia em vez de tratar dos objetos cards, 
            //     tratar de objetos mais simples como {value, suit}
    
            // First tries to drop combinations
            let response;
            do{
                response = turn.checkForGame(turn.hand.cards);
                
                if (response != false){
                    turn.dropCombination(response);
                }
            } while (response != false);
    
            // Adiciona cards até nao ter nenhum para adicionar a combinacao
            let added;
            do {
                added = turn.checkForAddition();
            } while (added);
    
            setTimeout(() => {
                if (turn.hand.cards.length > 0){
                    turn.discardCard(turn.chooseDiscardCard())
                }
        
                phaseMachine.checkWin(turn);
        
                // Next turn
                turn = nextPlayer(turn)
                phaseMachine.changeState(BUY);
                
            }, gameSlowness);
            
        }, gameSlowness);

    }
});
THINK.setHandlerFunction((clickedElement) => {
    if (turn == user){
        // Discard a card and calls next user
        if (THINK.dropSelection.length == 1 && THINK.dropSelection[0].value != "joker" && (clickedElement == Discards || clickedElement == Discards.lastCard())){
            user.discardCard(THINK.dropSelection[0])

            phaseMachine.checkWin(user);

            // Next turn
            turn = nextPlayer(turn)
            phaseMachine.changeState(BUY);
            
        // user added cards to combination
        } else if (THINK.dropSelection.length >= 1 && clickedElement instanceof Combination){
            user.addToCombination(THINK.dropSelection, clickedElement)
            
            THINK.clearDropSelection();

            phaseMachine.checkWin(user);
            
        // user dropped a combination
        } else if (THINK.dropSelection.length >= 3 && clickedElement == Table){
            user.dropCombination(THINK.dropSelection)

            THINK.clearDropSelection();

            phaseMachine.checkWin(user);
            
        // user tried to discard invalid card
        } else if ((THINK.dropSelection.length > 1 || (THINK.dropSelection.length == 1 && THINK.dropSelection[0].value == "joker")) && clickedElement == Discards){
            // *** Adicionar warning se tentar jogar joker ou mais de uma carta
            console.log('Nao pode jogar essa selecao de cartas')
            THINK.clearDropSelection();
        }
    }
});

FLY.setConnections([WIN, BUY]);
FLY.setEnterFunction(() => {
    if (turn != user) {
        setTimeout(() => {
            // *** em vez de checar da melhor comb, checa se é possivel usar a lokced card em alguma
            let hipotheticalBestComb = turn.checkForGame([...turn.hand.cards, FLY.lockedCard])
    
            if (hipotheticalBestComb != false && hipotheticalBestComb.includes(FLY.lockedCard)){
                turn.dropCombination(hipotheticalBestComb);
                
                phaseMachine.checkWin(turn);
                                
            } else {
                turn.discardCard(FLY.lockedCard)
            }
    
            turn = lastTurn;
            
            phaseMachine.changeState(THINK);

        }, gameSlowness);
        
    }
});
FLY.setHandlerFunction((clickedElement) => {
    if (turn == user) {
        // Selected drop area to drop currently combination on the fly
        if (FLY.dropSelection.length >= 3 && clickedElement == Table){
            if (user.dropCombination(FLY.dropSelection)) {
                phaseMachine.checkWin(user);
                
                turn = lastTurn
                
                phaseMachine.changeState(THINK);
                
            } else {
                FLY.resetDropSelection();
            }
    
        // user added cards to combination
        } else if (FLY.dropSelection.length >= 1 && clickedElement instanceof Combination){
            if (user.addToCombination(FLY.dropSelection, clickedElement)) {
                phaseMachine.checkWin(user);
                
                turn = lastTurn
                                
                phaseMachine.changeState(THINK);
            } else {
                FLY.resetDropSelection();
            }
            
        // Selected drop area to cancel the fly
        } else if (FLY.dropSelection.length == 1 && (clickedElement == Discards || clickedElement == Discards.lastCard())){
            user.discardCard(FLY.lockedCard)
            
            turn = lastTurn

            phaseMachine.changeState(THINK);
        }
    }
});

phaseMachine.addStates([BUY, DROP, WAIT, THINK, FLY, WIN]);
phaseMachine.init(BUY, WIN);
console.log(phaseMachine.toString());


function htmlDisplayAttributes() {
    // update the cells in the table with the values of the Round class attributes
    document.getElementById("deck").innerHTML = Deck.numberOfCards()
    document.getElementById("discardPile").innerHTML = Discards.numberOfCards()
    document.getElementById("turn").innerHTML = turn.orientation
    document.getElementById("state").innerHTML = phaseMachine.state.name
}
    

function gameSlowPct(pct) {
    return Math.round(gameSlowness*pct/100);
}

function nextPlayer(player){
    const currentIndex = order.indexOf(player)
    // define o próximo jogador pela ordem
    if (currentIndex == order.length - 1) {
        return order[0]
    } else {
        return order[currentIndex + 1]
    }
}

function previousPlayer(player){
    const currentIndex = order.indexOf(player)
    // define o próximo jogador pela ordem
    if (currentIndex == 0) {
        return order[order.length - 1]
    } else {
        return order[currentIndex - 1]
    }
}


//---------------------------------MAIN------------------------------

function animate(){ // default FPS = 60
    // setup block begin
    requestAnimationFrame(animate)
    c.clearRect(0, 0, innerWidth, innerHeight)

    elements.forEach(elem => {elem.update()})
    // desenha a carta segurada por ultimo para ficar em primeiro
    if (holdingCard != null){
        holdingCard.update()
    }

    htmlDisplayAttributes()

    

    frameCount++;

}

function mouseDownHandler(mouseDownX, mouseDownY){

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

    if (clickedElement instanceof Card){        
        if (clickedElement.grab.movable){
            holdingCard = clickedElement
            holdingCard.grab.holding = true
            holdingCard.grab.dx = mouseDownX - holdingCard.x
            holdingCard.grab.dy = mouseDownY - holdingCard.y
        }
    }

    // runStateMachine()
    phaseMachine.run(clickedElement);
}

function mouseUpHandler(mouseUpX, mouseUpY){

    if (holdingCard != null){
        holdingCard.grab.holding = false
        holdingCard = null
    }

    // 3 pixels square tolerance
    const notMoved = Math.abs(mouseDownX - mouseUpX) <= 3 && Math.abs(mouseDownY - mouseUpY) <= 3

    if (clickedElement instanceof Card && user.hand.cards.includes(clickedElement) && notMoved && turn == user && phaseMachine.state instanceof StateWithDropSelection){
        // Selected or unselected a card to compose the drop combination
        // Cant unselect the bought card on the fly
        if (!(phaseMachine.state instanceof StateWithLockedCard) || phaseMachine.state.lockedCard == null || clickedElement != phaseMachine.state.lockedCard) {
            if (phaseMachine.state.dropSelection.includes(clickedElement)){
                phaseMachine.state.removeFromDropSelection(clickedElement);
            } else {
                phaseMachine.state.addToDropSelection(clickedElement);
            }
        }
    }

}

function mouseMoveHandler(mouseX, mouseY){

    if (holdingCard != null) {
        holdingCard.newPos(mouseX - holdingCard.grab.dx, mouseY - holdingCard.grab.dy)
    } 

    const cond1 = turn == user && holdingCard == null;

    Deck.highlight = cond1 && phaseMachine.state == BUY && Deck.insideArea(mouseX, mouseY)

    if (Discards.lastCard() != null){
        Discards.lastCard().highlight = Discards.lastCard().insideArea(mouseX, mouseY) && holdingCard == null && ((phaseMachine.state == BUY && turn == user) || (phaseMachine.state == WAIT && turn != user && turn != nextPlayer(user))) 
    } 
    
    Discards.frame = Discards.insideArea(mouseX, mouseY) && cond1 && phaseMachine.state instanceof StateWithDropSelection && phaseMachine.state.dropSelection.length == 1 ;
    
    for (let comb of Table.combs){
        comb.highlight = phaseMachine.state instanceof StateWithDropSelection && phaseMachine.state.dropSelection.length >= 1 && comb.insideArea(mouseX, mouseY) && cond1 ;
    }

    Table.frame = cond1 && phaseMachine.state instanceof StateWithDropSelection && phaseMachine.state.dropSelection.length >= 3 && Table.insideArea(mouseX, mouseY) && !Table.combs.some((comb) => comb.insideArea(mouseX, mouseY))

    // // Spread cards when mouse is over
    // if (user.hand.insideArea(mouseX, mouseY)){
    //     user.hand.spacing = Card.w + 2
    // } else {
    //     user.hand.spacing = Hand.defaultSpacing
    // }
}

// init()
animate()

addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouseDownX = event.clientX - rect.left;
    mouseDownY = event.clientY - rect.top;
    mouseDownHandler(mouseDownX, mouseDownY);
});

addEventListener('mouseup', (event) => {
    const rect = canvas.getBoundingClientRect();
    let mouseUpX = event.clientX - rect.left;
    let mouseUpY = event.clientY - rect.top;
    mouseUpHandler(mouseUpX, mouseUpY);
});

addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    let mouseX = event.clientX - rect.left;
    let mouseY = event.clientY - rect.top;
    mouseMoveHandler(mouseX, mouseY);
});

// Mobile app browser setup
// Set up touch events for mobile, etc
canvas.addEventListener("touchstart", function (event) {
    const rect = canvas.getBoundingClientRect();
    let touchDownX = event.touches[0].clientX - rect.left;
    let touchDownY = event.touches[0].clientY - rect.top;

    mouseDownHandler(touchDownX, touchDownY);
});

canvas.addEventListener("touchend", function (event) {
    const rect = canvas.getBoundingClientRect();
    let touchUpX = event.touches[0].clientX - rect.left;
    let touchUpY = event.touches[0].clientY - rect.top;

    mouseUpHandler(touchUpX, touchUpY);
});


canvas.addEventListener("touchmove", function (event) {
    const rect = canvas.getBoundingClientRect();
    let touchMoveX = event.touches[0].clientX - rect.left;
    let touchMoveY = event.touches[0].clientY - rect.top;

    mouseMoveHandler(touchMoveX, touchMoveY);
});


// Prevent scrolling when touching the canvas
document.body.addEventListener("touchstart", function (e) {
    if (e.target == canvas) {
      e.preventDefault();
    }
  }, false);

document.body.addEventListener("touchend", function (e) {
if (e.target == canvas) {
    e.preventDefault();
}
}, false);

document.body.addEventListener("touchmove", function (e) {
if (e.target == canvas) {
    e.preventDefault();
}
}, false);