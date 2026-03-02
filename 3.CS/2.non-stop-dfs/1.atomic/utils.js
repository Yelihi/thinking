export const animateBox = (el, ms) => {
    let x = ms;
    return function frame() {
        x++;
        el.style.transform = `translateX(${x % 300}px)`
        requestAnimationFrame(frame)
    }
}

export const doExpensiveMath = (n) => {
    let result = 0;

    // 일부러 큰 수까지 돌면서,
    // 각 숫자가 소수인지 검사하는 비용이 꽤 큼
    const LIMIT = 500; // 기존보다 훨씬 무겁게 느껴질 수 있음

    for (let i = 2; i < LIMIT; i++) {
        // 간단한 소수 판별 (비효율적으로 구현해서 더 무겁게)
        let isPrime = true;
        for (let j = 2; j * j <= i; j++) {
            if (i % j === 0) {
                isPrime = false;
                break;
            }
        }

        if (isPrime) {
            // n, i를 섞어서 약간 복잡한 연산
            result += (i * n) % 97;
            result ^= (i * 31) >>> 1;
        }
    }

    return result;
}

export const recordPerformanceTime = (callback) => {
    const t0 = performance.now();
    callback();
    const t1 = performance.now();
    return (t1 - t0).toFixed(2);
}

export const log = (el, msg) => {
    el.textContent += msg + "\n";
    console.log(msg)
}