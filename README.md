# Circuit Fetch

Circuit Fetch is a small, static, Canvas-based Chips Challenge-style puzzle game.

## Play

Open `index.html` directly in a browser, or serve the folder locally:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Then visit `http://127.0.0.1:4173`.

## Controls

- Arrow keys or WASD: move
- Hold a movement key: repeat movement
- On-screen direction buttons: touch or mouse movement
- Reset: restart the current level
- Reset progress: lock the level pack back to level 1

## Verification

The game is dependency-free. Use these checks before shipping changes:

```sh
node --check game.js
git diff --check
```
