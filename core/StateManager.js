export const GAME_STATES = {
  PLAYING: "playing",
  PAUSED: "paused",
  GAME_OVER: "game_over",
};

export class StateManager {
  constructor() {
    this.currentState = GAME_STATES.PLAYING;
  }

  // ========================
  // STATE CONTROLS
  // ========================
  setState(newState) {
    this.currentState = newState;
  }

  isPlaying() {
    return this.currentState === GAME_STATES.PLAYING;
  }

  isPaused() {
    return this.currentState === GAME_STATES.PAUSED;
  }

  isGameOver() {
    return this.currentState === GAME_STATES.GAME_OVER;
  }

  togglePause() {
    if (this.isPaused()) {
      this.setState(GAME_STATES.PLAYING);
    } else if (this.isPlaying()) {
      this.setState(GAME_STATES.PAUSED);
    }
  }
}
