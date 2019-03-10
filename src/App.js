/* eslint-disable no-param-reassign */
import React, { Component } from 'react';
import { NeuralNetwork } from './neural/nn';
import './App.css';

const TOTAL_BIRDS = 1000;
const HEIGHT = 500;
const WIDTH = 800;
const PIPE_WIDTH = 80;
const MIN_PIPE_HEIGHT = 40;
const FPS = 960;

class Bird {
  constructor(ctx, brain) {
    this.ctx = ctx;
    this.x = 150;
    this.y = 150;
    this.age = 0;
    this.fitness = 0;
    this.gravity = 0;
    this.velocity = 0.1;
    this.isDead = false;

    if (brain) {
      this.brain = brain.copy();
      this.mutate();
    } else {
      this.brain = new NeuralNetwork(5, 10, 2);
    }
  }

  draw() {
    this.ctx.fillStyle = 'red';
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, 10, 0, 2 * Math.PI);
    this.ctx.fill();
  }

  update = (pipeX, spaceStartY, spaceEndY) => {
    this.age += 1;
    this.gravity += this.velocity;
    this.gravity = Math.min(4, this.gravity);
    this.y += this.gravity;

    if (this.y < 0) {
      this.y = 0;
    } else if (this.y > HEIGHT) {
      this.y = HEIGHT;
    }

    this.think(pipeX, spaceStartY, spaceEndY);
  }

  think = (pipeX, spaceStartY, spaceEndY) => {
    // inputs:
    // [bird.x, bird.y]
    // [closestPipe.x, pipe.y]
    // [closestPipe.x, pipe.y + pipe.height]
    const inputs = [
      Math.abs((this.x - pipeX) / WIDTH).toFixed(2),
      (spaceStartY / HEIGHT).toFixed(2),
      (spaceEndY / HEIGHT).toFixed(2),
      (this.y / HEIGHT).toFixed(2),
      // 0.28
      // 0.82
      (this.gravity / 3).toFixed(2),
    ];
    // range 0, 1
    const output = this.brain.predict(inputs);
    if (output[0] < output[1]) {
      this.jump();
    }
  }

  mutate = () => {
    this.brain.mutate((x) => {
      if (Math.random() < 0.2) {
        const offset = Math.random() * 0.5;
        return x + offset;
      }
      return x;
    });
  }

  jump = () => {
    this.gravity = -3;
  }
}

let counter = 0;

class Pipe {
  constructor(ctx, height, space) {
    this.ctx = ctx;
    this.isDead = false;
    this.x = WIDTH;
    this.y = height ? HEIGHT - height : 0;
    this.width = PIPE_WIDTH;
    // this.height = height || Math.abs((counter++ * (counter % 2 ? 40 : 80)) % (HEIGHT - 80));
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

class App extends Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
    this.frameCount = 0;
    this.space = 120;
    this.pipes = [];
    this.birds = [];
    this.deadBirds = [];
    this.state = {
      gameSpeed: FPS,
      shouldDraw: false,
    };
  }

  componentDidMount() {
    this.startGame();
  }

  startGame = () => {
    counter++;
    console.log('jenerasyon: ', counter);
    if (counter > 0) {
      this.setState({ shouldDraw: true });
    }
    this.frameCount = 0;
    clearInterval(this.loop);
    const ctx = this.canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    this.pipes = this.generatePipes();
    this.birds = this.generateBirds();
    this.deadBirds = [];
    this.loop = setInterval(this.gameLoop, 1000 / this.state.gameSpeed);
  }

  // USER ONLY MODE
  // onKeyDown = (e) => {
  //   if (e.code === 'Space') {
  //     this.birds[0].jump();
  //   }
  // }

  getCtx = () => this.canvasRef.current.getContext('2d');

  generatePipes = () => {
    const ctx = this.getCtx();
    const firstPipe = new Pipe(ctx, null, this.space);
    const secondPipeHeight = HEIGHT - firstPipe.height - this.space;
    const secondPipe = new Pipe(ctx, secondPipeHeight, 80);
    return [firstPipe, secondPipe];
  }

  generateBirds = () => {
    const birds = [];
    const ctx = this.getCtx();
    for (let i = 0; i < TOTAL_BIRDS; i += 1) {
      const brain = this.deadBirds.length && this.pickOne().brain;
      const newBird = new Bird(ctx, brain);
      birds.push(newBird);
    }
    return birds;
  };

  gameLoop = () => {
    if (this.state.shouldDraw) {
      this.update();
    } else {
      for (let i = 0; i < 10000; i++) {
        this.update();
      }
    }
    this.draw();
  }

  update = () => {
    this.frameCount = this.frameCount + 1;
    if ((this.frameCount % 240) === 0) {
      const pipes = this.generatePipes();
      this.pipes.push(...pipes);
    }

    // update pipe positions
    this.pipes.forEach(pipe => pipe.update());

    // update bird positions
    this.birds.forEach((bird) => {
      const nextPipe = this.getNextPipe(bird);
      const spaceStartY = nextPipe.y + nextPipe.height;
      bird.update(nextPipe.x, spaceStartY, spaceStartY + this.space);
    });

    // delete off-screen pipes
    this.pipes = this.pipes.filter(pipe => !pipe.isDead);

    // delete dead birds
    this.updateBirdDeadState();
    this.deadBirds.push(...this.birds.filter(bird => bird.isDead));
    this.birds = this.birds.filter(bird => !bird.isDead);

    if (this.birds.length === 0) {
      let totalAge = 0;
      // calculate cumulative age
      this.deadBirds.forEach((deadBird) => { totalAge += deadBird.age; });

      // calculate fitness ratio
      this.deadBirds.forEach((deadBird) => { deadBird.fitness = deadBird.age / totalAge; });
      this.startGame();
    }
  }

  pickOne = () => {
    let index = 0;
    let r = Math.random();
    while (r > 0) {
      r -= this.deadBirds[index].fitness;
      index += 1;
    }
    index -= 1;
    return this.deadBirds[index];
  }

  getNextPipe = (bird) => {
    for (let i = 0; i < this.pipes.length; i++) {
      if (this.pipes[i].x > bird.x) {
        return this.pipes[i];
      }
    }
  }

  updateBirdDeadState = () => {
    // detect collisions
    this.birds.forEach((bird) => {
      this.pipes.forEach((pipe) => {
        if (
          bird.y <= 0 || bird.y >= HEIGHT || (
            bird.x >= pipe.x && bird.x <= pipe.x + pipe.width
            && bird.y >= pipe.y && bird.y <= pipe.y + pipe.height)
        ) {
          bird.isDead = true;
        }
      });
    });
  }

  draw() {
    if (!this.state.shouldDraw) {
      return;
    }
    const ctx = this.canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    this.pipes.forEach(pipe => pipe.draw());
    this.birds.forEach(bird => bird.draw());
  }

  render() {
    return (
      <div className="App">
        <canvas
          ref={this.canvasRef}
          width={WIDTH}
          height={HEIGHT}
          style={{ marginTop: '24px', border: '1px solid #c3c3c3' }}
        >
          Your browser does not support the canvas element.
        </canvas>
        <div>
          <input
            type="range"
            min="120"
            max="1000"
            value={this.state.gameSpeed}
            onChange={e => this.setState({ gameSpeed: e.target.value }, this.startGame)}
          />
        </div>
      </div>
    );
  }
}

export default App;
