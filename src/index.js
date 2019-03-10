/* global document */
import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import Game from './game';
import { WIDTH, HEIGHT } from './constants';

class App extends Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
    this.state = {
      game: null,
    };
  }

  getCtx = () => this.canvasRef.current.getContext('2d');

  startGame = (speedMode) => {
    if (this.state.game) {
      this.stopGame();
    }
    this.setState({
      game: new Game(this.getCtx(), speedMode),
    }, () => {
      this.state.game.startGame();
    });
  }

  stopGame = () => {
    const { game } = this.state;
    game.kill();
    this.setState({ game: null });
  }

  render() {
    const { game } = this.state;
    return (
      <div className="App">
        <div>
          {game ? (
            <React.Fragment>
              <input
                type="button"
                value="Hizlandir!"
                onClick={() => this.startGame(true)}
              />
              <input
                type="button"
                value="Durdur"
                onClick={() => this.stopGame()}
              />
            </React.Fragment>
          ) : (
            <input
              type="button"
              value="Ogrenmeye basla!"
              onClick={() => this.startGame()}
            />
          )}
        </div>
        <canvas
          ref={this.canvasRef}
          width={WIDTH}
          height={HEIGHT}
          style={{ marginTop: '24px', border: '1px solid #c3c3c3' }}
        >
          Your browser does not support the canvas element.
        </canvas>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
