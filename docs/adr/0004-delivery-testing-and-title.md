# Delivery, Testing, and Title

We will build MVP 1 in small committed slices, test mostly through user-visible browser behavior with a tiny debug snapshot hook for deterministic assertions, include minimal synthesized sound effects with mute but no music, skip undo for the first version, expose an unlocked level select, and use Circuit Fetch as the in-game title. These choices keep the implementation inspectable and testable while giving the clone its own identity instead of presenting itself as the original game.
