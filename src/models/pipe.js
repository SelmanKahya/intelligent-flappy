import {
  WIDTH, HEIGHT, MIN_PIPE_HEIGHT, PIPE_WIDTH,
} from '../constants';

export default class Pipe {
  constructor(ctx, height, space) {
    this.ctx = ctx;
    this.isDead = false;

    this.x = WIDTH;
    this.y = height ? HEIGHT - height : 0;
    this.width = PIPE_WIDTH;
    this.height = height || MIN_PIPE_HEIGHT
      + Math.random() * (HEIGHT - space - MIN_PIPE_HEIGHT * 2);
  }

  draw() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  update = () => {
    this.x -= 1;
    if ((this.x + PIPE_WIDTH) < 0) {
      this.isDead = true;
    }
  }
}
