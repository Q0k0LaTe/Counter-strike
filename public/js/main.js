// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Create and initialize game
    const game = new Game();
    game.init();
    
    // Debug logging to identify loading issues
    console.log("Debug: Game initialization completed");
  });