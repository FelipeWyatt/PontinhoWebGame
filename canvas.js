//------------------------------IMPORTS-----------------------------------
import {Card, Deck, Discards, Table, Button, User, Bot, Combination} from './classes.js';
import {canvas, c} from './classes.js';
import {canvasHeightPct, canvasWidthPct} from './classes.js';

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
        this.setExitFunction(() => {
            this.clearDropSelection();
        });
	}

    setDropSelection(cards){
        this.dropSelection = cards;
    }

    clearDropSelection(){
        this.dropSelection = [];
    }
}

class StateWithLockedCard extends StateWithDropSelection {
	constructor(name){
		super(name);
		this.lockedCard = null;
        this.setExitFunction(() => {
            this.clearLockedCard();
        });
	}

    setLockedCard(card){
        this.lockedCard = card;
        this.resetDropSelection();
    }

    clearLockedCard(){
        this.lockedCard = null;
        this.clearDropSelection();
    }

    resetDropSelection(){
        this.dropSelection = [this.lockedCard];
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

    changeState(newState, lockedCard = null){
        if (this.state != this.finalState){
            this.state.exit();
            this.lastState = this.state;
            this.state = newState;
            if (newState instanceof StateWithLockedCard && lockedCard != null){
                newState.enter(lockedCard);
            } else {
                newState.enter();
            }
        }
    }

    checkWin(player){
        if (player.hand.numberOfCards() == 0){
            phaseMachine.changeState(WIN);
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
// let dropSelection = [] // ***tratar dropSelection dentro da State machine em vez de global?
// let lockedCard = null  // ***tratar lockedCard dentro da classe LockedCardState em vez de global?
//                         *** ideia: unificar dropSelection e lockedCard?
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
DROP.setEnterFunction((lockedCard) => {
    DROP.setLockedCard(lockedCard);
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
            if (user.dropCombination(dropSelection)) {
                dropSelection = []
                lockedCard = null

                phaseMachine.checkWin(user);
                
                phaseMachine.changeState(THINK);

            } else {
                // Invalid selection
                dropSelection = [lockedCard]
            }
        
        // user added cards to combination
        } else if (dropSelection.length >= 1 && clickedElement instanceof Combination){
        if (user.addToCombination(dropSelection, clickedElement)) {
            dropSelection = []
            lockedCard = null

            phaseMachine.checkWin(user);
            
            phaseMachine.changeState(THINK);

        } else {
            dropSelection = [lockedCard]
        }
    
        // Click on discard pile to cancel the drop
        } else if (dropSelection.length == 1 && (clickedElement == Discards || clickedElement == Discards.lastCard())){
            user.discardCard(lockedCard)
            dropSelection = []
            lockedCard = null
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
                        lockedCard = player.buyFromDiscards();
                        phaseMachine.changeState(FLY);
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
                    lockedCard = user.buyFromDiscards()
                    dropSelection = [lockedCard];
                    phaseMachine.changeState(FLY);  
                }

            } else {
                clearTimeout(changingStateTimer); // Cancela o timer para mudar de estado
                // *** Colocar essas mudanças de turn e locked card no .enterState() do Fly
                lastTurn = turn
                turn = user
                lockedCard = user.buyFromDiscards()
                dropSelection = [lockedCard];
                phaseMachine.changeState(FLY);  

            }
        }
    }
});

THINK.setConnections([WIN, BUY]);
THINK.setEnterFunction(() => {
    if (turn != user) {// Bot
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

        if (turn.hand.cards.length > 0){
            turn.discardCard(turn.chooseDiscardCard())
        }

        phaseMachine.checkWin(turn);

        // Next turn
        turn = nextPlayer(turn)
        phaseMachine.changeState(BUY);
    }
});
THINK.setHandlerFunction((clickedElement) => {
    if (turn == user){
        // Discard a card and calls next user
        if (dropSelection.length == 1 && dropSelection[0].value != "joker" && (clickedElement == Discards || clickedElement == Discards.lastCard())){
            user.discardCard(dropSelection[0])
            dropSelection = []

            phaseMachine.checkWin(user);

            // Next turn
            turn = nextPlayer(turn)
            phaseMachine.changeState(BUY);
            
        // user added cards to combination
        } else if (dropSelection.length >= 1 && clickedElement instanceof Combination){
            user.addToCombination(dropSelection, clickedElement)
            dropSelection = []

            phaseMachine.checkWin(user);
            
        // user dropped a combination
        } else if (dropSelection.length >= 3 && clickedElement == Table){
            user.dropCombination(dropSelection)
            dropSelection = []

            phaseMachine.checkWin(user);
            
        // user tried to discard invalid card
        } else if ((dropSelection.length > 1 || (dropSelection.length == 1 && dropSelection[0].value == "joker")) && clickedElement == Discards){
            // *** Adicionar warning se tentar jogar joker ou mais de uma carta
            console.log('Nao pode jogar essa selecao de cartas')
            dropSelection = []
        }
    }
});

FLY.setConnections([WIN, BUY]);
FLY.setEnterFunction(() => {
    if (turn != user) {
        // *** em vez de checar da melhor comb, checa se é possivel usar a lokced card em alguma
        let hipotheticalBestComb = turn.checkForGame([...turn.hand.cards, lockedCard])

        if (hipotheticalBestComb != false && hipotheticalBestComb.includes(lockedCard)){
            turn.dropCombination(hipotheticalBestComb);
            
            phaseMachine.checkWin(turn);
                            
        } else {
            turn.discardCard(lockedCard)
        }

        dropSelection = [];
        lockedCard = null;
        turn = lastTurn;
        
        phaseMachine.changeState(THINK);
        
    }
});
FLY.setHandlerFunction((clickedElement) => {
    if (turn == user) {
        // Selected drop area to drop currently combination on the fly
        if (dropSelection.length >= 3 && clickedElement == Table){
            if (user.dropCombination(dropSelection)) {
                phaseMachine.checkWin(user);
                // *** Mudar o locked card e drop selection managing para .exit() do estado FLY
                dropSelection = []
                lockedCard = null
                turn = lastTurn
                
                
                phaseMachine.changeState(THINK);
                
            } else {
                dropSelection = [lockedCard]
            }
    
        // user added cards to combination
        } else if (dropSelection.length >= 1 && clickedElement instanceof Combination){
            if (user.addToCombination(dropSelection, clickedElement)) {
                phaseMachine.checkWin(user);
                
                dropSelection = []
                lockedCard = null
                turn = lastTurn
                
                
                phaseMachine.changeState(THINK);
            } else {
                dropSelection = [lockedCard]
            }
            
        // Selected drop area to cancel the fly
        } else if (dropSelection.length == 1 && (clickedElement == Discards || clickedElement == Discards.lastCard())){
            user.discardCard(lockedCard)
            dropSelection = []
            lockedCard = null
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
    
/*
function runStateMachine(){
    // Called on mousedown event
    // States when is user's turn

    if (turn == user){
        // Possible actions when in BUY state
        if (state == BUY){
            // user buys from deck
            if (Deck.numberOfCards() > 0 && clickedElement == Deck){
                user.buyFromDeck()
                state = WAIT // Next state
                
                // Calls bot to play to check if buys on the fly
                setTimeout(botPlay, 200) // Needs to be fast, so user don't click make another action
            
            // user buys from discard pile
            } else if (Discards.buyable && clickedElement == Discards.lastCard()){
                lockedCard = user.buyFromDiscards()
                dropSelection = [lockedCard]
                state = DROP
            }

        // Possible actions when in DROP state
        } else if (state == DROP){
            if (clickedElement == Table){
                if (user.dropCombination(dropSelection)) {
                    dropSelection = []
                    lockedCard = null
                    state = THINK

                    checkWin()
                } else {
                    // Invalid selection
                    dropSelection = [lockedCard]
                }
                

            // user added cards to combination
            } else if (dropSelection.length >= 1 && clickedElement instanceof Combination){
                if (user.addToCombination(dropSelection, clickedElement)) {
                    dropSelection = []
                    lockedCard = null
                    state = THINK
                } else {
                    dropSelection = [lockedCard]
                }

                checkWin()
            
            // Click on discard pile to cancel the drop
            } else if (dropSelection.length == 1 && (clickedElement == Discards || clickedElement == Discards.lastCard())){
                user.discardCard(lockedCard)
                dropSelection = []
                lockedCard = null
                // Next turn
                turn = nextPlayer(turn)
                state = BUY
                
                checkWin()  

                // Calls bot to play
                setTimeout(botPlay, gameSlowness)
            }

        
        // Possible actions when in THINK state
        } else if (state == THINK){
            // Discard a card and calls next user
            if (dropSelection.length == 1 && dropSelection[0].value != "joker" && (clickedElement == Discards || clickedElement == Discards.lastCard())){
                user.discardCard(dropSelection[0])
                dropSelection = []
                // Next turn
                turn = nextPlayer(turn)
                state = BUY  
                
                checkWin()

                // Calls bot to play
                setTimeout(botPlay, gameSlowness)
                
            // user added cards to combination
            } else if (dropSelection.length >= 1 && clickedElement instanceof Combination){
                user.addToCombination(dropSelection, clickedElement)
                dropSelection = []

                checkWin()
                
            // user dropped a combination
            } else if (dropSelection.length >= 3 && clickedElement == Table){
                user.dropCombination(dropSelection)
                dropSelection = []

                checkWin()
                
            // user tried to discard invalid card
            } else if ((dropSelection.length > 1 || (dropSelection.length == 1 && dropSelection[0].value == "joker")) && clickedElement == Discards){
                // *** Adicionar warning se tentar jogar joker ou mais de uma carta
                console.log('Nao pode jogar essa selecao de cartas')
                dropSelection = []
            }

        } else if (state == FLY) {
            // Selected drop area to drop currently combination on the fly
            if (dropSelection.length >= 3 && clickedElement == Table){
                if (user.dropCombination(dropSelection)) {
                    dropSelection = []
                    lockedCard = null
                    state = THINK
                    turn = lastTurn

                    checkWin()
                    
                    // Calls bot to play
                    setTimeout(botPlay, gameSlowness)
                } else {
                    dropSelection = [lockedCard]
                }

            // user added cards to combination
            } else if (dropSelection.length >= 1 && clickedElement instanceof Combination){
                if (user.addToCombination(dropSelection, clickedElement)) {
                    dropSelection = []
                    lockedCard = null
                    state = THINK
                    turn = lastTurn

                    checkWin()

                    // Calls bot to play
                    setTimeout(botPlay, gameSlowness)
                } else {
                    dropSelection = [lockedCard]
                }
                
            // Selected drop area to cancel the fly
            } else if (dropSelection.length == 1 && (clickedElement == Discards || clickedElement == Discards.lastCard())){
                user.discardCard(lockedCard)
                dropSelection = []
                lockedCard = null
                state = THINK
                turn = lastTurn

                // Calls bot to play
                setTimeout(botPlay, gameSlowness)
            }
        }

    } else { // Not user turn
        // Selected discardPile to buy on the fly
        if (turn != nextPlayer(user) && state == WAIT && Discards.buyable && clickedElement == Discards.lastCard()){
            lastTurn = turn
            state = FLY
            turn = user
            lockedCard = user.buyFromDiscards()
            dropSelection = [lockedCard]
        }
    }

}
*/

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

/*
function checkWin(){
    for (let player of [user, ...bots]){
        if (player.hand.numberOfCards() == 0){
            state = WIN
            turn = player
            for (let player_ of [user, ...bots]) {
                for (let card of player_.hand.cards){
                    card.flipped = true
                }
            }
            return true
        }
    }
    return false
}


function botPlay(){
    // called when an important state changes
    if (turn != user) {
        if (state == BUY) {
            let choice = turn.chooseBuy()

            if (choice == 'Deck'){
                state = WAIT

                // Calls bot to play
                setTimeout(botPlay, 200)
            } else {
                state = DROP
            }


        } else if (state == THINK) {
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

            if (turn.hand.cards.length > 0){
                turn.discardCard(turn.chooseDiscardCard())
            }

            checkWin()
            
            turn = nextPlayer(turn)
            state = BUY

            if (bots.includes(turn)){
                // Calls bot to play
                setTimeout(botPlay, Math.round(gameSlowness/2))
            }

        } else if (state == FLY) {
            // *** em vez de checar da melhor comb, checa se é possivel usar a lokced card em alguma
            let hipotheticalBestComb = turn.checkForGame([...turn.hand.cards, lockedCard])

            if (hipotheticalBestComb != false && hipotheticalBestComb.includes(lockedCard)){
                turn.dropCombination(hipotheticalBestComb);
                checkWin()
            } else {
                turn.discardCard(lockedCard)
            }
            
            turn = lastTurn
            state = THINK
            lockedCard = null
            
            // Call bot to play
            if (bots.includes(turn)){
                setTimeout(botPlay, gameSlowness)
            }

        }

    }

    if (state == WAIT){
        for (let bot = nextPlayer(turn); bot != previousPlayer(turn); bot = nextPlayer(bot)){
            console.log(bot)
        }
        if (Discards.buyable){
            // Check if bots can buy on the fly, in order
            // *** Adicionar feature que quem vai bater com a carta tem prioridade

            if (turn == user || turn == nextPlayer(user) || turn == nextPlayer(nextPlayer(user))){
                // Casos em que o player não pode comprar o descarte ou é o último em prioridade
                // Checa rapidamente se os bots querem comprar e muda o estado
                for (let bot = nextPlayer(turn); bot != previousPlayer(turn); bot = nextPlayer(bot)){
                    // *** em vez de checar da melhor comb, checa se é possivel usar a locked card em alguma
                    let hipotheticalBestComb = bot.checkForGame([...bot.hand.cards, Discards.lastCard()])

                    // Compra do descarte se a melhor combinacao é feita com a carta do descarte
                    if (hipotheticalBestComb != false && hipotheticalBestComb.includes(Discards.lastCard())){
                        lastTurn = turn
                        state = FLY
                        turn = bot
                        lockedCard = bot.buyFromDiscards()
                        setTimeout(botPlay, Math.round(gameSlowness/2))
                        return
                    }
                }

                // Nenhum bot quer a carta
                state = THINK
            } else {
                // Checa rapidamente os bots com preferência a comprar, espera 2*gameSlowness, checa se o user não comprou
                // e então checa o resto dos bots e muda o estado
                for (let bot = nextPlayer(turn); bot != user; bot = nextPlayer(bot)){
                    // *** em vez de checar da melhor comb, checa se é possivel usar a locked card em alguma
                    let hipotheticalBestComb = bot.checkForGame([...bot.hand.cards, Discards.lastCard()])

                    // Compra do descarte se a melhor combinacao é feita com a carta do descarte
                    if (hipotheticalBestComb != false && hipotheticalBestComb.includes(Discards.lastCard())){
                        lastTurn = turn
                        state = FLY
                        turn = bot
                        lockedCard = bot.buyFromDiscards()
                        setTimeout(botPlay, Math.round(gameSlowness/2))
                        return // return importante para evitar o check do player
                    }
                }

                setTimeout(() => {
                    if (turn != user && state == WAIT && Discards.buyable){
                        for (let bot = nextPlayer(user); bot != previousPlayer(turn); bot = nextPlayer(bot)){
                            // *** em vez de checar da melhor comb, checa se é possivel usar a locked card em alguma
                            let hipotheticalBestComb = bot.checkForGame([...bot.hand.cards, Discards.lastCard()])
        
                            // Compra do descarte se a melhor combinacao é feita com a carta do descarte
                            if (hipotheticalBestComb != false && hipotheticalBestComb.includes(Discards.lastCard())){
                                lastTurn = turn
                                state = FLY
                                turn = bot
                                lockedCard = bot.buyFromDiscards()
                                setTimeout(botPlay, Math.round(gameSlowness/2))
                                return // return importante para evitar o check do player
                            }
                        }
                        // Nenhum bot quer a carta
                        state = THINK
                    }
                }, Math.round(gameSlowness*1.5))
            }
        } else {
            state = THINK
        }
    }

}

  
*/

//---------------------------------MAIN------------------------------

function animate(){ // default FPS = 60
    // setup block begin
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

    

    frameCount++;

}


// init()
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
})

addEventListener('mouseup', (event) => {
    const rect = canvas.getBoundingClientRect();
    let mouseUpX = event.clientX - rect.left;
    let mouseUpY = event.clientY - rect.top;

    if (holdingCard != null){
        holdingCard.grab.holding = false
        holdingCard = null
    }

    // 3 pixels square tolerance
    const notMoved = Math.abs(mouseDownX - mouseUpX) <= 3 && Math.abs(mouseDownY - mouseUpY) <= 3

    if (clickedElement instanceof Card && user.hand.cards.includes(clickedElement) && notMoved && turn == user && state != BUY){
        // Selected or unselected a card to compose the drop combination
        // Cant unselect the bought card on the fly
        if (lockedCard == null || clickedElement != lockedCard) {
            if (dropSelection.includes(clickedElement)){
                dropSelection.splice(dropSelection.indexOf(clickedElement), 1)
            } else {
                dropSelection.push(clickedElement)
            }
        }
    }

})

addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect()
    let mouseX = event.clientX - rect.left
    let mouseY = event.clientY - rect.top

    if (holdingCard != null) {
        holdingCard.newPos(mouseX - holdingCard.grab.dx, mouseY - holdingCard.grab.dy)
    } 

    const cond1 = turn == user && holdingCard == null

    Deck.highlight = cond1 && state == BUY && Deck.insideArea(mouseX, mouseY)

    if (Discards.lastCard() != null){
        Discards.lastCard().highlight = Discards.lastCard().insideArea(mouseX, mouseY) && holdingCard == null && ((state == BUY && turn == user) || (state == THINK && turn != user && turn != nextPlayer(user))) 
    } 
    
    Discards.frame = Discards.insideArea(mouseX, mouseY) && cond1 && dropSelection.length == 1 && state != BUY
    
    for (let comb of Table.combs){
        comb.highlight = dropSelection.length >= 1 && comb.insideArea(mouseX, mouseY) && cond1 && state != BUY
    }

    Table.frame = cond1 && state != BUY && dropSelection.length >= 3 && Table.insideArea(mouseX, mouseY) && !Table.combs.some((comb) => comb.insideArea(mouseX, mouseY))

    // // Spread cards when mouse is over
    // if (user.hand.insideArea(mouseX, mouseY)){
    //     user.hand.spacing = Card.w + 2
    // } else {
    //     user.hand.spacing = Hand.defaultSpacing
    // }
})
