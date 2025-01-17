let lastTrigger = 0;
const DEBOUNCE_TIME = 3000; // 3 seconds minimum between triggers

export function setTrigger() {
  const now = Date.now();
  if (now - lastTrigger >= DEBOUNCE_TIME) {
    lastTrigger = now;
    return lastTrigger;
  }
  return lastTrigger; // Return existing timestamp if debounce is active
}

export function getTrigger() {
  return lastTrigger;
}