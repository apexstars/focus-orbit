import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import * as core from "../src/core.js";

async function createApp() {
  const elements = new Map();
  function element(selector) {
    if (!elements.has(selector)) {
      elements.set(selector, {
        value: selector === "#duration-select" ? "25" : "",
        options: ["15", "25", "45", "60"].map((value) => ({ value })),
        style: {}, listeners: {}, textContent: "", open: false,
        addEventListener(type, callback) { this.listeners[type] = callback; },
        querySelector() { return element(selector + " span"); },
        replaceChildren() {}, append() {}, setAttribute() {},
        showModal() { this.open = true; }, close() { this.open = false; },
        content: { cloneNode() { return {}; } }
      });
    }
    return elements.get(selector);
  }
  let now = 0;
  let nextInterval = 0;
  const intervals = new Map();
  let saved = null;
  const context = vm.createContext({
    ...core, console, Blob, URL, navigator: {},
    Date: class extends Date { static now() { return now; } },
    localStorage: {
      getItem() { return null; },
      setItem(key, value) { saved = JSON.parse(value); }
    },
    document: {
      querySelector: element, createElement: element, addEventListener() {}
    },
    window: {
      setInterval(callback) { const id = ++nextInterval; intervals.set(id, callback); return id; },
      clearInterval(id) { intervals.delete(id); }
    }
  });
  const source = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  vm.runInContext(source.replace(/^import .*;\n/, ""), context);
  return {
    element,
    click(selector) { element(selector).listeners.click(); },
    advance(milliseconds) {
      now += milliseconds;
      for (const callback of [...intervals.values()]) callback();
    },
    saved() { return saved; }
  };
}

test("a delayed focus tick earns one reward and keeps the completion message", async () => {
  const app = await createApp();
  app.click("#start-button");
  app.advance(25 * 60 * 1000);
  assert.equal(app.element("#timer-status").textContent, "ORBIT COMPLETE");
  assert.equal(app.saved().credits, 5);
  assert.equal(app.saved().sessions.length, 1);
  app.advance(60 * 1000);
  assert.equal(app.saved().sessions.length, 1);
  app.click("#spend-button");
  assert.equal(app.saved().credits, 0);
  assert.equal(app.element("#break-dialog").open, true);
  app.advance(5 * 60 * 1000);
  assert.equal(app.element("#break-dialog").open, false);
});

test("focus stays paused during an earned break", async () => {
  const app = await createApp();
  app.click("#start-button");
  app.advance(25 * 60 * 1000);
  app.click("#start-button");
  app.advance(10 * 1000);
  app.click("#spend-button");
  const pausedTime = app.element("#timer-value").textContent;
  app.advance(5 * 60 * 1000);
  assert.equal(app.element("#timer-value").textContent, pausedTime);
  assert.equal(app.element("#timer-status").textContent, "ORBIT PAUSED");
});
