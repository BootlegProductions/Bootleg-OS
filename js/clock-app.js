(function () {
  function partsFor(zone) {
    const now = new Date();

    if (zone === 'local') {
      return {
        h: now.getHours(),
        m: now.getMinutes(),
        s: now.getSeconds(),
        label: now.toLocaleTimeString([], {
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        })
      };
    }

    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: zone,
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    });
    const parts = Object.fromEntries(
      fmt.formatToParts(now)
        .filter(part => ['hour', 'minute', 'second'].includes(part.type))
        .map(part => [part.type, Number(part.value)])
    );
    return { h: parts.hour, m: parts.minute, s: parts.second, label: fmt.format(now) };
  }

  function centreFor(clock) {
    const pin = clock.querySelector('.clock-pin');
    if (pin) return { x: Number(pin.getAttribute('cx')), y: Number(pin.getAttribute('cy')) };
    const face = clock.querySelector('.clock-face');
    return { x: Number(face?.getAttribute('cx')) || 0, y: Number(face?.getAttribute('cy')) || 0 };
  }

  function handLength(hand, centre) {
    if (!hand.dataset.handLength) {
      const x2 = Number(hand.getAttribute('x2'));
      const y2 = Number(hand.getAttribute('y2'));
      hand.dataset.handLength = String(Math.hypot(x2 - centre.x, y2 - centre.y));
    }
    return Number(hand.dataset.handLength);
  }

  // Calculate the endpoint directly. This deliberately avoids SVG/CSS transforms,
  // so every browser keeps x1/y1 physically attached to the clock pin.
  function pointHand(clock, selector, degrees, centre) {
    const hand = clock.querySelector(selector);
    if (!hand) return;
    const length = handLength(hand, centre);
    const radians = degrees * Math.PI / 180;
    hand.removeAttribute('transform');
    hand.style.transform = 'none';
    hand.setAttribute('x1', centre.x);
    hand.setAttribute('y1', centre.y);
    hand.setAttribute('x2', centre.x + Math.sin(radians) * length);
    hand.setAttribute('y2', centre.y - Math.cos(radians) * length);
  }

  function tick() {
    const sky = document.querySelector("[data-clock-sky]");
    if (sky) {
      const h = new Date().getHours();
      sky.dataset.clockSky = h >= 5 && h < 11 ? "morning" : h >= 11 && h < 17 ? "afternoon" : h >= 17 && h < 21 ? "evening" : "night";
    }
    document.querySelectorAll('[data-clock-zone]').forEach(clock => {
      const time = partsFor(clock.dataset.clockZone);
      const centre = centreFor(clock);
      pointHand(clock, '.hour-hand', (time.h % 12) * 30 + time.m * 0.5, centre);
      pointHand(clock, '.minute-hand', time.m * 6 + time.s * 0.1, centre);
      pointHand(clock, '.second-hand', time.s * 6, centre);
      const readout = clock.querySelector('[data-clock-readout]');
      if (readout) readout.textContent = time.label;
    });
  }

  tick();
  setInterval(tick, 1000);
})();
