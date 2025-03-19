# Counter-Strike Style 5v5 Shooter Game

A 3D multiplayer first-person shooter game built with Node.js and Three.js, featuring team-based gameplay, weapons, bots, and classic CS-style mechanics.

## Features

- 5v5 team-based gameplay (Terrorists vs Counter-Terrorists)
- First-person shooter with mouse aim and keyboard movement
- Cube-based character models with team colors
- Shooting mechanics with recoil and bullet visualization
- Bot players that move and shoot
- Simple map with spawn points, buildings, and cover
- Round-based gameplay with scores
- UI elements (health bar, ammo counter, team scores, kill feed)

## Installation

1. **Clone the repository or create the file structure**

```
cs-shooter-game/
├── public/
│   ├── css/
│   ├── js/
│   ├── assets/
├── server/
```

2. **Install dependencies**

```bash
npm init -y
npm install express socket.io three nodemon
```

3. **Edit package.json**

Update the scripts section:

```json
"scripts": {
  "start": "node server/index.js",
  "dev": "nodemon server/index.js"
}
```

4. **Start the server**

```bash
npm run dev
```

5. **Open in browser**

Visit `http://localhost:3000` in your web browser

## Game Controls

- **W, A, S, D**: Move (forward, left, backward, right)
- **Mouse**: Look around
- **Left Click**: Shoot
- **R**: Reload
- **Shift**: Sprint

## Development Notes

- The game uses Socket.IO for real-time multiplayer communication
- Three.js is used for 3D rendering and physics
- GSAP is used for animations
- The game includes a bot system to fill empty team slots
- View shake is implemented instead of permanent recoil for better shooting mechanics
- Shooting rates are adjusted for better gameplay

## Known Issues and Fixes

If you experience issues with the game:

1. **Check that all script imports are correct in index.html**
2. **The pointer lock control needs to use ES modules in newer versions of Three.js**
3. **Make sure GSAP is properly loaded for animations**

## Credits

Built with:
- Three.js for 3D rendering
- Socket.IO for real-time communication
- Express for server-side
- GSAP for animations