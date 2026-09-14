import { vertexShader, fragmentShader } from './shaders.js';

const numWords = {
    0: 'twelve', 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten',
    11: 'eleven', 12: 'twelve', 13: 'thirteen', 14: 'fourteen', 15: 'fifteen', 16: 'sixteen', 17: 'seventeen', 18: 'eighteen', 19: 'nineteen',
    20: 'twenty', 30: 'thirty', 40: 'forty', 50: 'fifty'
};

function getMinuteWord(m) {
    if (m === 0) return "";
    if (m < 10) return `oh ${numWords[m]}`;
    if (m < 20) return numWords[m];
    if (m % 10 === 0) return numWords[m];
    return `${numWords[Math.floor(m / 10) * 10]}-${numWords[m % 10]}`;
}

export class FluidClock {
    constructor() {
        this.clockCanvas = document.createElement('canvas');
        this.ctx = this.clockCanvas.getContext('2d');
        this.lastTimeStr = "";
        this.clockOpacity = 1.0;
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clockMaterial = null;
        this.clockTexture = null;
        this.threeClock = new window.THREE.Clock();
        
        this.initWebGL();
        this.resizeClockCanvas();
    }

    resizeClockCanvas() {
        this.clockCanvas.width = window.innerWidth;
        this.clockCanvas.height = window.innerHeight;
        this.lastTimeStr = ""; 
    }

    updateClockCanvas() {
        const now = new Date();
        const h = now.getHours();
        const m = now.getMinutes();
        
        const hourWord = numWords[h % 12 || 12];
        const minuteWord = m === 0 ? '' : ` ${getMinuteWord(m)}`;
        const ampm = h >= 12 ? 'p.m.' : 'a.m.';
        
        const currentTimeStr = `${hourWord}${minuteWord} ${ampm}`;
        if (currentTimeStr === this.lastTimeStr) return;
        this.lastTimeStr = currentTimeStr;

        const width = this.clockCanvas.width;
        const height = this.clockCanvas.height;

        this.ctx.filter = 'none';
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, width, height);

        const fontSize = Math.floor(width * 0.045); 
        this.ctx.font = `400 ${fontSize}px "Sarina", cursive, sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.lineJoin = 'round';

        const cy = height / 2;
        const cx = width / 2;

        if (!this.textCanvas) {
            this.textCanvas = document.createElement('canvas');
            this.tCtx = this.textCanvas.getContext('2d');
        }
        this.textCanvas.width = width;
        this.textCanvas.height = height;
        this.tCtx.font = this.ctx.font;
        this.tCtx.textAlign = 'center';
        this.tCtx.textBaseline = 'middle';

        this.ctx.globalCompositeOperation = 'lighter';

        const drawLayer = (r, g, b, alpha, blurPx) => {
            this.tCtx.clearRect(0, 0, width, height);
            this.tCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            this.tCtx.fillText(currentTimeStr, cx, cy);
            
            this.ctx.filter = `blur(${blurPx}px)`;
            this.ctx.globalAlpha = alpha;
            this.ctx.drawImage(this.textCanvas, 0, 0);
        };

        drawLayer(100, 180, 255, 0.20, width * 0.05);
        drawLayer(160, 220, 255, 0.28, width * 0.015);
        drawLayer(220, 240, 255, 0.45, width * 0.002);
        this.ctx.globalAlpha = 1.0;

        if (this.clockTexture) this.clockTexture.needsUpdate = true;
    }

    initWebGL() {
        const container = document.getElementById('webgl-container');
        this.scene = new window.THREE.Scene();
        this.camera = new window.THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        this.renderer = new window.THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(this.renderer.domElement);

        this.clockTexture = new window.THREE.CanvasTexture(this.clockCanvas);
        this.clockTexture.minFilter = window.THREE.LinearFilter;
        this.clockTexture.magFilter = window.THREE.LinearFilter;

        this.clockMaterial = new window.THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                u_time: { value: 0.0 },
                u_resolution: { value: new window.THREE.Vector2(window.innerWidth, window.innerHeight) },
                u_heightMap: { value: this.clockTexture },
                u_clockOpacity: { value: 1.0 }
            }
        });

        const geometry = new window.THREE.PlaneGeometry(2, 2);
        const mesh = new window.THREE.Mesh(geometry, this.clockMaterial);
        this.scene.add(mesh);
    }

    onWindowResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.clockMaterial.uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
        this.resizeClockCanvas();
    }

    render(targetOpacity) {
        if (Math.abs(this.clockOpacity - targetOpacity) > 0.001) {
            this.clockOpacity += (targetOpacity - this.clockOpacity) * 0.03;
        } else {
            this.clockOpacity = targetOpacity;
        }

        this.updateClockCanvas();
        this.clockMaterial.uniforms.u_time.value = this.threeClock.getElapsedTime();
        this.clockMaterial.uniforms.u_clockOpacity.value = this.clockOpacity;
        this.renderer.render(this.scene, this.camera);
    }
}
