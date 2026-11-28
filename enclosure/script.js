document.addEventListener('DOMContentLoaded', () => {

    const mainSwitch = document.getElementById('mainSwitch');
    const panelIndicator = document.getElementById('powerIndicator');
    const genPilotLight = document.getElementById('genPilotLight');
    const estopLight = document.getElementById('estopLight');
    const resetBtn = document.getElementById('resetBtn');
    const runLight = document.getElementById('runLight');
    const timerFrame = document.getElementById('timerFrame');

    const loadFrames = ['fanFrame', 'ampFrame', 'rpmFrame', 'genFrame'];

    let isPowerOn = false;
    let isLatched = false;
    let isEstopLocked = false;
    let safetyCircuitTripped = false;

    let holdTimer = null;
    const HOLD_DURATION = 6000;

    // =========================
    // RECEIVE MESSAGES (E-STOP)
    // =========================
    window.addEventListener('message', (event) => {

        if (event.data === 'ESTOP_ACTIVATED') {
            isEstopLocked = true;
            safetyCircuitTripped = true;
            shutdownSystem();
        }

        if (event.data === 'ESTOP_RESET') {
            isEstopLocked = false;
        }

    });

    // =========================
    // MAIN SWITCH PRESS
    // =========================
    mainSwitch.addEventListener('mousedown', () => {
        if (isEstopLocked || safetyCircuitTripped || isLatched) return;

        isPowerOn = true;
        updateSystem();

        holdTimer = setTimeout(() => {
            isLatched = true;
            updateSystem();
        }, HOLD_DURATION);
    });

    // =========================
    // MAIN SWITCH RELEASE
    // =========================
    window.addEventListener('mouseup', () => {
        if (!isLatched) {
            clearTimeout(holdTimer);
            isPowerOn = false;
        }
        updateSystem();
    });

    // =========================
    // RESET BUTTON
    // =========================
    resetBtn?.addEventListener('click', () => {
        if (!isEstopLocked && safetyCircuitTripped) {
            safetyCircuitTripped = false;
            estopLight?.classList.remove('active');
        }
    });

    // =========================
    // FORCE SHUTDOWN (E-STOP)
    // =========================
    function shutdownSystem() {
        clearTimeout(holdTimer);
        isPowerOn = false;
        isLatched = false;
        updateSystem();
    }

    // =========================
    // UPDATE SYSTEM STATE
    // =========================
    function updateSystem() {

        const powerState = (isPowerOn || isLatched) ? 'POWER_ON' : 'POWER_OFF';

        // Timer
        if (timerFrame) {
            timerFrame.contentWindow.postMessage(powerState, '*');
        }

        // Loads
        loadFrames.forEach(id => {
            const frame = document.getElementById(id);
            if (frame) {
                frame.contentWindow.postMessage(powerState, '*');
            }
        });

        updateVisuals();
    }

    function updateVisuals() {

        panelIndicator.style.background =
            (isPowerOn || isLatched) ? "#2ecc71" : "#444";

        if (safetyCircuitTripped) {
            estopLight?.classList.add('active');
        }

        if (isLatched) {
            genPilotLight?.classList.add('gen-on');
            runLight?.classList.add('active-green');
            mainSwitch.classList.add('latched-state');
        } else {
            genPilotLight?.classList.remove('gen-on');
            runLight?.classList.remove('active-green');
            mainSwitch.classList.remove('latched-state');
        }
    }

});
