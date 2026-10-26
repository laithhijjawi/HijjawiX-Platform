# Tesla Sound X — Real-Time Engine Physics V3 (2026-10-26)

## Why V3 replaces V1 / V2

V1 played synthetic oscillators without a firing-order model. V2 tried to modify recorded vehicle clips by changing playbackRate. Neither approach gave convincing throttle-dependent engine behavior.

V3 produces audio continuously in the browser using a **new, independent acoustic model**. TeslaSound.io has a similar high-level architecture, but its proprietary implementation and sound recordings are not used.

## Audio signal path

1. The host UI computes a virtual drivetrain state (RPM, throttle/load, gear, shift event) using either on-screen pedals or GPS speed. GPS speed may lag real throttle inputs; **physical accelerator position is not available to a normal webpage**.
2. `engine-worklet.js` runs real-time DSP inside Web Audio’s AudioWorklet thread; `app.js` provides a compatibility fallback using ScriptProcessor.
3. `engine-core.js` models:
   - Four-stroke firing frequency, cylinder count, and firing order/bank sequence.
   - Bank-specific exhaust pressure decay and individual modal resonators.
   - Reflections and sound transmission through simulated exhaust pipes/headers.
   - Air-intake hiss under load, optional supercharger/rotor whine, and overrun crackles.
   - Shift events; separate original electric drive synthesis.
4. High-pass filtering, bass shelf, dynamic compression and master gain feed the cabin audio system.
5. No third-party sound recordings are loaded. Only same-origin JavaScript modules are required.

**Sound accuracy limitation:** The engine is an *acoustically inspired procedural model*, not a calibrated physical combustion solver, commercial engine-sound library, or verified replica of the specific OEM vehicle. Results vary with the Tesla audio system. Human listening tests are required.

## Profiles

- Crossplane 6.2L Muscle V8 — open dual headers; 6 simulated gears.
- Naturally aspirated 5.2L Supercar V10 — sharp high-rev; 7 gears.
- Naturally aspirated 6.5L Italian V12 — smoother; 7 gears.
- GT3-style 4.0L Flat-6 — 9000 RPM; 7 gears.
- 6.2L Supercharged V8 — long-tube headers and whine; 6 gears.
- Original Electric Sport — **Taycan-inspired style only, not an OEM Porsche soundtrack**, single ratio.

## How to validate on Tesla

With the vehicle parked:
1. Open `https://hijjawix.com/tesla-sound/` and verify `PHYSICS V3.0` appears.
2. Select Muscle V8, start audio and confirm the source indicator reads `AUDIO WORKLET` or `COMPATIBILITY AUDIO ENGINE`.
3. While in Park Rev, press the virtual pedal. RPM and sound should rise, and virtual speed should remain zero.
4. Set Headers character high (70–90%) and Crackle to 25–45%. Keep speaker volume low initially.
5. Use 22-second Demo Run to listen to changing RPM and shifts; compare V8, V10 and Flat-6.
6. Drive/GPS mode should only be evaluated with a passenger handling the screen and after confirming browser location access.

## Security and safety

- The website never sends vehicle control messages.
- GPS `coords.speed` stays in browser memory, not transmitted to a server.
- Exterior Boombox/PWS speaker cannot be selected by a webpage; the supported external playback settings are vehicle-dependent and generally limited to Park.
- Keep alert sounds audible and configure the app while stationary.
- No payment, login, installation, sample licenses or keys.

## Internal QA

- `npm test`: complete static portal tests plus pure Node engine audio numerical tests (nonzero bounded output and timbre distinctions).
- `tests/browser-responsive.mjs`: mobile/desktop UI, Park Rev, Drive Demo, GPS, and audio initialization.
