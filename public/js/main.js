document.addEventListener('DOMContentLoaded', () => {
    if (typeof Game !== 'undefined') {
      const game = new Game();
      game.init();
    } else {
      console.error("Game class is not loaded. Check your script loading order.");
    }
  });