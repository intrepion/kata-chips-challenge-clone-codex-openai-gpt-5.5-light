const { test, expect } = require("@playwright/test");
const path = require("path");
const { pathToFileURL } = require("url");

async function snapshot(page) {
  return JSON.parse(await page.locator("#debug-state").textContent());
}

async function move(page, key, times = 1) {
  for (let index = 0; index < times; index += 1) {
    await page.keyboard.press(key);
  }
}

test("plays through collection, socket, door, hazard, boots, and level select", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Reset progress" }).click();
  await page.locator("#game-canvas").click();

  await move(page, "ArrowRight", 3);
  expect(await snapshot(page)).toMatchObject({
    level: 0,
    chips: { collected: 1, required: 1 },
    mode: "ready",
  });

  await move(page, "ArrowRight", 4);
  expect(await snapshot(page)).toMatchObject({ level: 0, mode: "complete", unlockedLevel: 1 });

  await move(page, "ArrowRight");
  await move(page, "ArrowRight", 6);
  expect(await snapshot(page)).toMatchObject({ level: 1, mode: "complete", unlockedLevel: 2 });

  await move(page, "ArrowRight");
  await move(page, "ArrowRight", 2);
  expect(await snapshot(page)).toMatchObject({ level: 2, keys: { red: 1 } });
  await move(page, "ArrowRight", 2);
  expect(await snapshot(page)).toMatchObject({ level: 2, keys: { red: 0 } });
  await move(page, "ArrowRight", 2);
  expect(await snapshot(page)).toMatchObject({ level: 2, mode: "complete", unlockedLevel: 3 });
  await move(page, "ArrowRight");

  await page.getByRole("button", { name: /4\. Boot Bridge/ }).click();
  await page.locator("#game-canvas").click();
  await move(page, "ArrowDown");
  await move(page, "ArrowRight", 3);
  expect(await snapshot(page)).toMatchObject({ level: 3, mode: "failed" });

  await move(page, "ArrowRight");
  await move(page, "ArrowRight", 2);
  expect(await snapshot(page)).toMatchObject({ level: 3, boots: { water: true } });
  await move(page, "ArrowRight", 2);
  expect(await snapshot(page)).toMatchObject({ level: 3, mode: "ready", player: { x: 5, y: 1 } });

  await page.reload();
  await expect(page.getByRole("button", { name: /4\. Boot Bridge - Unlocked/ })).toBeEnabled();
  expect(errors).toEqual([]);
});

test("boots through the committed index.html over file protocol", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto(pathToFileURL(path.resolve(__dirname, "..", "index.html")).href);
  await expect(page.getByRole("heading", { name: /Training Trace/ })).toBeVisible();
  const state = await snapshot(page);
  expect(state).toMatchObject({
    level: 0,
    title: "Training Trace",
    mode: "ready",
    chips: { collected: 0, required: 1 },
  });
  expect(errors).toEqual([]);
});
