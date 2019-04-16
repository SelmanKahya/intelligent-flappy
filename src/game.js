/* eslint-disable no-param-reassign */
import Bird from './models/bird';
import Pipe from './models/pipe';
import {
  INITIAL_PIPE_SPACE, FPS, SPEED_MODE_FPS, WIDTH, HEIGHT, TOTAL_BIRDS, PIPE_WIDTH
} from './constants';

export default class Game {
  constructor(ctx, speedMode) {
    this.ctx = ctx;
    this.frameCount = 0;
    this.generationCount = 0;
    this.highscore = 0;
    this.space = INITIAL_PIPE_SPACE;
    this.gameSpeed = speedMode ? SPEED_MODE_FPS : FPS;

    this.pipes = [];
    this.birds = [];
    this.deadBirds = [];
  }

  // oyunu durdur
  kill = () => {
    clearInterval(this.loop);
  };

  // oyunu baslat
  startGame = () => {
    this.generationCount += 1;
    this.highscore = Math.max(this.highscore, this.gameStart ? Date.now() - this.gameStart : 0);
    this.gameStart = Date.now();
    this.frameCount = 0;
    clearInterval(this.loop);
    this.ctx.clearRect(0, 0, WIDTH, HEIGHT);

    this.pipes = this.generatePipes();
    this.birds = this.generateBirds();
    this.deadBirds = [];
    this.loop = setInterval(this.gameLoop, 1000 / this.gameSpeed);
  }

  // bir cift boru uret
  generatePipes = () => {
    const firstPipe = new Pipe(this.ctx, null, this.space);
    const secondPipeHeight = HEIGHT - firstPipe.height - this.space;
    const secondPipe = new Pipe(this.ctx, secondPipeHeight, 80);
    return [firstPipe, secondPipe];
  }

  // TOTAL_BIRDS adedince kus uret
  // eger 2. veya daha sonraki bir jenerasyon ise onceki jenerasyondan
  // olen kuslarin bazilarinin beynini kullanarak yeni kuslar uret.
  generateBirds = () => {
    const birds = [];
    for (let i = 0; i < TOTAL_BIRDS; i += 1) {
      const brain = this.deadBirds.length && this.pickOne().brain;
      const newBird = new Bird(this.ctx, brain);
      birds.push(newBird);
    }
    return birds;
  };

  // ana oyun dongusu
  gameLoop = () => {
    this.update();
    this.draw();
  }

  update = () => {
    this.frameCount = this.frameCount + 1;
    // arada bir ekranin sag tarafina bir boru koy
    if (this.frameCount % 300 === 0) {
      const pipes = this.generatePipes();
      this.pipes.push(...pipes);
    }

    // borulari guncelle
    this.pipes.forEach(pipe => pipe.update());

    // kuslari guncelle
    this.birds.forEach((bird) => {
      const nextPipe = this.getNextPipe(bird);
      const spaceStartY = nextPipe.y + nextPipe.height;
      bird.update(nextPipe.x, spaceStartY, spaceStartY + this.space);
    });

    // ekran disina cikan borulari temizle
    this.pipes = this.pipes.filter(pipe => !pipe.isDead);

    // olu kuslari sil
    this.updateBirdDeadState();
    this.deadBirds.push(...this.birds.filter(bird => bird.isDead));
    this.birds = this.birds.filter(bird => !bird.isDead);

    // tum kuslar oldu, oyunu tekrar baslat
    if (this.birds.length === 0) {
      let totalAge = 0;
      // tum kuslarin toplam yasini hesapla
      this.deadBirds.forEach((deadBird) => { totalAge += deadBird.age*deadBird.age; });

      // toplam yasi kullanarak her kus icin saglamlilik degeri ata
      this.deadBirds.forEach((deadBird) => { deadBird.fitness = deadBird.age*deadBird.age / totalAge; });
      this.deadBirds.sort(function(a, b){return b.fitness - a.fitness});
      this.startGame();
    }
  }

  // olen kuslar arasindan bir tane kus sec
  pickOne = () => {
    let index = 0;
    let r = Math.random();
    r = r*r; //lower index more likely
    while (r >= 0) {
      r -= this.deadBirds[index].fitness;
      index += 1;
    }
    index -= 1;
    return this.deadBirds[index];
  }

  // bir sonraki en yakin borunun koordinatlarini al
  getNextPipe = (bird) => {
    for (let i = 0; i < this.pipes.length; i++) {
      if (this.pipes[i].x + PIPE_WIDTH > bird.x) {
        return this.pipes[i];
      }
    }
  }

  // kus sinirlarin disina ciktiysa oldu olarak isaretle
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

  // herseyi ekrana ciz
  draw() {
    this.ctx.clearRect(0, 0, WIDTH, HEIGHT);
    this.pipes.forEach(pipe => pipe.draw());
    this.birds.forEach(bird => bird.draw());

    // oyun durumunu yaziyla ekrana yazdir
    this.ctx.font = '12px serif';
    this.ctx.fillStyle = 'black';
    this.ctx.fillText(`Jenerasyon: ${this.generationCount}`, 10, 15);
    this.ctx.fillText(`Kus sayisi: ${this.birds.length}`, 10, 30);
    this.ctx.fillText(`En iyi ilerleme: ${(this.highscore / 1000).toFixed(1)} sn`, 10, 45);
    this.ctx.fillText(`Mevcut ilerleme: ${((Date.now() - this.gameStart) / 1000).toFixed(1)} sn`, 10, 60);
  }
}
