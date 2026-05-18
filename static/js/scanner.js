// frontend/src/js/scanner.js


// SoundManager object
// Doesn't need to be a class because we only need one instance
const SoundManager = {
    ctx: null, // Only activate on interaction

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        // If the browser suspended it due to autoplay restrictions, wake it up
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    _playNote(frequency, startTime, duration) {
        // Create and configure an oscillator
        var oscillator = this.ctx.createOscillator();

        oscillator.type = 'sine';
        oscillator.frequency.value = frequency; 
        
        // Set gain
        var gainNode = this.ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        gainNode.gain.value = 0.5; 


        // Start oscillator and stop after timeout
        gainNode.connect(this.ctx.destination);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    },

    playScanSuccess() {
        this.init();

        const now = this.ctx.currentTime; // Get current time to schedule notes relative to it
        let noteDuration = 0.1; // Duration of each note in seconds

        this._playNote(600, now, noteDuration);
        this._playNote(700, now + noteDuration + 0.001, noteDuration);
    }


}

const BarcodeScanner = {
    isScanning: false,
    targetElement: document.querySelector('#interactive-camera-stream'),
    _detectionCallback: null,

    start() {
        if (this.isScanning) return; // Prevent initializing multiple times

        if (!this.targetElement) {
            console.error("Camera container target not found in DOM.");
            return;
        }

        this.isScanning = true;

        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: this.targetElement, // Injects video stream into our dashboard container
                constraints: {
                    width: 640,
                    height: 480,
                    facingMode: "environment" // Force back-facing camera on mobile phones. will switch later to use front
                },
            },
            locator: {
                patchSize: "medium",
                halfSample: true
            },
            numOfWorkers: navigator.hardwareConcurrency || 2, // Use device processing power
            decoder: {
                // Standard food barcode formats 
                readers: [
                    "ean_reader",
                    "ean_8_reader",
                    "upc_reader", 
                    "upc_e_reader",
                    "code_128_reader"
                ],
                debug: {
                    drawBoundingBox: true, 
                    drawScanline: true
                }
            },
            locate: true // Enables real-time background tracking/localization
        }, (err) => {
            if (err) {
                console.error("Failed to initialize camera stream:", err);
                this.isScanning = false;
                alert("Could not access camera. Ensure you have given permissions and are running over HTTPS/localhost.");
                return;
            }
            console.log("Quagga initialization succeeded. Starting video stream...");
            Quagga.start();
        });

        // Enable - use arrow function to preserve 'this' context and store reference for cleanup
        this._detectionCallback = (data) => this._handleBarcodeDetection(data);
        Quagga.onDetected(this._detectionCallback);
    },

    async _handleBarcodeDetection(data) {
        if (!data || !data.codeResult) return;

        const barcodeValue = data.codeResult.code;
        console.log("Auto-Detected Barcode Code String: " + barcodeValue);

        // For now: stop scanning to prevent multiple detections of same code.
        // In future will implement a cooldown / same code check
        this.stop();

        // Feedback (temporary / demo)
        const feedbackBox = document.querySelector('#scan-feedback');
        if (feedbackBox) {
            feedbackBox.innerHTML = `<p style="color: green;">Processing barcode: ${barcodeValue}...</p>`;
            SoundManager.playScanSuccess();
        }

        r = await fetch(`/api/barcode/${barcodeValue}`);
        const productCard = await r.text();
        document.getElementById('scan-feedback').innerHTML = productCard;


    },

    stop() {
        if (!this.isScanning) return;
        
        console.log("Stopping hardware camera stream...");
        if (this._detectionCallback) {
            Quagga.offDetected(this._detectionCallback); // Unhook callback
            this._detectionCallback = null;
        }
        Quagga.stop();
        this.isScanning = false;
    }

}
