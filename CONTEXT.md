# Chips Challenge Clone

This context names the puzzle-game concepts for a small, faithful Chips Challenge-style clone. The language favors deterministic tile puzzle behavior over arcade approximation.

## Language

**Clone Target**:
A faithful rules-first top-down tile puzzle inspired by Chips Challenge, delivered first as a compact playable MVP.
_Avoid_: Themed approximation, arcade remake

**Grid**:
The fixed two-dimensional play space made of square cells that actors occupy and tiles modify.
_Avoid_: Map, board

**Cell**:
One addressable square in the grid.
_Avoid_: Space, slot

**Tile**:
A cell's terrain or interactive surface, such as floor, wall, water, fire, socket, door, or exit.
_Avoid_: Block, square

**Actor**:
A moving entity that occupies a cell, such as the player or a monster.
_Avoid_: Character, sprite

**Player**:
The actor controlled by the human, responsible for collecting chips and reaching the exit.
_Avoid_: Chip, avatar, hero

**Chip**:
A collectible required to open the chip socket.
_Avoid_: Coin, token, gem

**Chip Socket**:
A gate that opens only after the level's required chips have been collected.
_Avoid_: Socket, chip gate

**Exit**:
The tile that completes the level when the player reaches it after satisfying the level requirements.
_Avoid_: Goal, portal

**Key**:
A collectible that permits opening a matching colored door.
_Avoid_: Unlock, pass

**Inventory**:
The player's current collection of keys and boots within a level.
_Avoid_: Backpack, items

**Door**:
A colored gate that consumes or requires its matching key when opened.
_Avoid_: Lock, barrier

**Hazard**:
A tile that defeats the player unless the player has the corresponding protection.
_Avoid_: Trap, obstacle

**Boots**:
A collectible protection that lets the player traverse a matching hazard.
_Avoid_: Shoes, power-up

**Level**:
A self-contained puzzle with a grid, starting player position, required chips, win condition, and reset boundary.
_Avoid_: Stage, room, map

**Level Pack**:
An ordered set of levels played by the same game rules.
_Avoid_: Campaign, world

**Failure State**:
The short stopped state after defeat that preserves the cause before the level resets.
_Avoid_: Death screen, game over

**Tick**:
One deterministic simulation step used to resolve movement and future timed actor behavior.
_Avoid_: Frame, turn

**Reset**:
Returning the current level to its initial state after defeat or user request.
_Avoid_: Restart, respawn

**Level Timer**:
An optional countdown constraint for a level.
_Avoid_: Clock, time limit
