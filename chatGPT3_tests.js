
//---------------------------CANVAS SETUP---------------------------------
const canvas = document.querySelector('canvas')

canvas.height = 600 //window.innerHeight;
canvas.width = canvas.height //window.innerWidth;

const ctx = canvas.getContext('2d')

class Card {
  constructor(xCorner, yCorner, w, h, orientation) {
    this.xCorner = xCorner;
    this.yCorner = yCorner;
    this.w = w;
    this.h = h;
    this.orientation = orientation;
  }

  draw() {

    // Save the current context state
    ctx.save();

    // Translate the context to the center of the card
    ctx.translate(this.xCorner + this.w / 2, this.yCorner + this.h / 2);

    // Rotate the context according to the orientation
    if (this.orientation === 'up') {
      ctx.rotate(Math.PI);
    } else if (this.orientation === 'right') {
      ctx.rotate(-Math.PI / 2);
      // Translate the context to the left edge of the card
      ctx.translate((this.h - this.w) / 2, (this.h - this.w) / 2);
    } else if (this.orientation === 'left') {
      ctx.rotate(Math.PI / 2);
      // Translate the context to the top edge o
      ctx.translate(-(this.h - this.w) / 2, -(this.h - this.w) / 2);
    }

    // Set the fill style to white
    ctx.fillStyle = "black";

    // Draw the card at the origin (since the context has been translated)
    ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
    
    // Set the fill style to white
    ctx.fillStyle = "white";

    // Draw the card at the origin (since the context has been translated)
    ctx.fillRect(-this.w / 2 + 2, -this.h / 2 + 2, this.w - 4, this.h - 4);

    // Restore the context to its original state
    ctx.restore();
  }
}

let card1 = new Card(0, 0, 42, 60, 'up')
let card2 = new Card(0, 0, 42, 60, 'left')
card1.draw()
// card2.draw()