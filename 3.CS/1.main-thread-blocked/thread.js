const statusEl = document.getElementById('status');
const btns = [...document.querySelectorAll('button')];

let t = 0;

/**
 * transform 속성 기반으로 계속된 UI 업데이트
 */
function animate() {
    t++;
    document.querySelector("#box").style.transform = `translateX(${t % 260}px)`
    requestAnimationFrame(animate);
}

animate();

function setBusy(b) {
    btns.forEach(btn => btn.disabled = b)
}

/**
 * 무거운 작업 함수
 */
function heavyCalc(iterate = 1000000000) {
    let sum = 0;
    for (let i = 0; i < iterate; i++) {
        sum += i % 10;
    }
    return sum
}

/**
 * 동기적 작업 호출
 */
function runSync() {
    const t0 = performance.now();
    heavyCalc();
    const t1 = performance.now();
    return (t1 - t0).toFixed(1);
}

/**
 * 청크 단위로 구별하여 실행
 * @param {number} budgetMs - 한번에 작업할 최대 시간 (sync 이하로)
 */
function runChunk(done, iter = 1000000000, budgetMs = 12) {
    const t0 = performance.now();
    let i = 0, x = 0;

    function step() {
        const start = performance.now();

        while (i < iter && (performance.now() - start) < budgetMs) {
            x += i % 10;
            i++;
        }

        if (i < iter) {
            requestAnimationFrame(step);
        } else {
            done((performance.now() - t0).toFixed(1));
        }
    }
    requestAnimationFrame(step);
}

/**
 * web worker 사용
 */
const workerCode = `
    self.onmessage = (e) => {
        const { iter } = e.data;
        let x = 0;
        for (let i = 0; i < iter; i++) {
            x += i % 10;
        }
        self.postMessage({ x });
    }
`;

const worker = new Worker(URL.createObjectURL(new Blob([workerCode], { type: "text/javascript" })));

/**
 * 이벤트 연결
 */
document.querySelector("#sync").onclick = () => {
    setBusy(true);
    statusEl.textContent = "Sync running...";
    const ms = runSync();
    statusEl.textContent = `Sync done: ${ms}ms`;
    setBusy(false);
}

document.querySelector("#chunk").onclick = () => {
    setBusy(true);
    statusEl.textContent = "Chunk running...";
    runChunk((ms) => {
        statusEl.textContent = `Chunk done: ${ms}ms`;
        setBusy(false);
    })
}

document.querySelector("#worker").onclick = () => {
    setBusy(true);
    statusEl.textContent = "Worker running...";
    const t0 = performance.now();
    worker.onmessage = () => {
        const ms = (performance.now() - t0).toFixed(1);
        statusEl.textContent = `Worker done: ${ms}ms`;
        setBusy(false);
    }
    worker.postMessage({ iter: 1000000000 });

}



