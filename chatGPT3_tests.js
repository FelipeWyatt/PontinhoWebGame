const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d');


canvas.height = window.innerHeight;
canvas.width = window.innerWidth;

const cardWidth = 35;
const cardHeight = 50;

const suits = ['hearts', 'diamonds', 'spades', 'clubs'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// An array to store the card objects
let cards = [];

// A variable to store the card currently being dragged, if any
let draggedCard = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

// Function to draw a card at a given position
function drawCard(card) {
    // Set the fill color based on the suit
    let fillColor;
    if (card.suit === 'hearts' || card.suit === 'diamonds') {
      fillColor = 'red';
    } else {
      fillColor = 'black';
    }
  
    // Save the current context state
    ctx.save();
  
    // Translate the context to the center of the card
    ctx.translate(card.x + cardWidth / 2, card.y + cardHeight / 2);
  
    // Rotate the context by 90 degrees if needed
    if (card.horizontal) {
      ctx.rotate(Math.PI / 2);
    }
  
    // Draw the card at the origin (since the context has been translated)
    ctx.fillStyle = 'white';
    ctx.fillRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight);
    ctx.strokeRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight);
  
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = fillColor;
    ctx.fillText(card.value, 0, 0);
  
    // Draw the suit symbol in the top left corner of the card
    ctx.font = '20px sans-serif';
    ctx.fillStyle = fillColor;
    ctx.fillText(getSuitSymbol(card.suit), -cardWidth / 2 + 5, -cardHeight / 2 + 15);
  
    // Restore the context to its original state
    ctx.restore();
  }

  
  
// Returns the Unicode symbol for a given suit
function getSuitSymbol(suit) {
  switch (suit) {
    case 'hearts':
      return "♥";
    case 'diamonds':
      return "♦";
    case 'spades':
      return "♠";
    case 'clubs':
      return "♣";
    default:
      return '';
  }
}

// Function to redraw all cards on the canvas
function drawCards() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  cards.forEach(drawCard);
}

// Function to handle mouse down events on the canvas
function handleMouseDown(event) {
    // Get the mouse position relative to the canvas
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
  
    // Find the card that was clicked, if any
    const card = cards.find(c =>
      x >= c.x && x <= c.x + cardWidth && y >= c.y && y <= c.y + cardHeight
    );
  
    // If a card was clicked, set it as the dragged card and save the offset
    // between the mouse position and the top left corner of the card
    if (card) {
      draggedCard = card;
      dragOffsetX = x - card.x;
      dragOffsetY = y - card.y;
    }
  }
  

  // Function to handle mouse move events on the canvas
// function handleMouseMove(event) {
//     // Get the mouse position relative to the canvas
//     const rect = canvas.getBoundingClientRect();
//     const mouseX = event.clientX - rect.left;
//     const mouseY = event.clientY - rect.top;
  
//     // If a card is being dragged, update its position and velocity
//     if (draggedCard) {
//       const spring = 0.1; // Spring constant
//       const damping = 0.9; // Damping constant
  
//       // Calculate the displacement of the mouse from the card's center
//       const displacementX = mouseX - (draggedCard.x + draggedCard.width / 2);
//       const displacementY = mouseY - (draggedCard.y + draggedCard.height / 2);
  
//       // Update the velocity based on the displacement and the spring and damping constants
//       draggedCard.vx += displacementX * spring;
//       draggedCard.vy += displacementY * spring;
//       draggedCard.vx *= damping;
//       draggedCard.vy *= damping;
  
//       // Update the position based on the velocity
//       draggedCard.x += draggedCard.vx;
//       draggedCard.y += draggedCard.vy;
  
//       drawCards();
//     }
//   }

  
  // Function to handle mouse move events on the canvas
function handleMouseMove(event) {
    // Get the mouse position relative to the canvas
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
  
    // If a card is being dragged, update its position
    if (draggedCard) {
      draggedCard.x = x - dragOffsetX;
      draggedCard.y = y - dragOffsetY;
      drawCards();
    }
}
  // Function to handle mouse up events on the canvas
// function handleMouseUp() {
//     // If a card was being dragged, release it
//     if (draggedCard) {
//       draggedCard = null;
  
//       // Arrange the cards in a line
//       const spacing = 10; // Spacing between cards
//       for (let i = 0; i < cards.length; i++) {
//         const card = cards[i];
//         card.x = i * (card.width + spacing) + 500;
//         card.y = 500;
//       }
  
//       drawCards();
//     }
//   }
  
  // Function to handle mouse up events on the canvas
  function handleMouseUp(event) {
    // Clear the dragged card reference
    draggedCard = null;
  }
  
  // Add event listeners to the canvas
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseup', handleMouseUp);
  
  // Draw 52 cards (a full deck)
  for (let i = 0; i < 52; i++) {
    const suit = suits[i % 4];
    const value = values[Math.floor(i / 4)];
    const x = Math.random() * (canvas.width - cardWidth);
    const y = Math.random() * (canvas.height - cardHeight);
    cards.push({ suit, value, x, y});
  }

//   function animate(){ // default FPS = 60
//     // setup block
//     requestAnimationFrame(animate);
//     drawCards();
//   }
  