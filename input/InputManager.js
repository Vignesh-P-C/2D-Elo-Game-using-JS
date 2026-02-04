export class InputManager {
  constructor(canvas) {
    this.keys = {};

    this.mouse = {
      x: 0,
      y: 0,
      left: false,
      right: false,
    };

    // 🔑 Keyboard
    window.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });

    // 🖱 Mouse
    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    canvas.addEventListener("mousedown", (e) => {
      if (e.button === 0) this.mouse.left = true;
      if (e.button === 2) this.mouse.right = true;
    });

    canvas.addEventListener("mouseup", (e) => {
      if (e.button === 0) this.mouse.left = false;
      if (e.button === 2) this.mouse.right = false;
    });

    // 🚫 Disable right-click menu
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  // ✅ Helper for keyboard input
  isKeyDown(code) {
    return !!this.keys[code];
  }

  // 🗡 Melee attack (J key)
  isAttacking() {
    return this.isKeyDown("KeyJ") || this.mouse.left;
  }
}
