import { doExpensiveMath } from "./utils.js"

let visited = 0;

export const performUnitOfWork = (node) => {
    doExpensiveMath(10)
    // visited++;

    if (node.children) return node.children;

    let n = node;
    while (n) {
        if (n.sibling) return n.sibling;
        n = n.parent
    }

    return null;
}


export const runInterruptibleDfs = (root, budgetMs = 12) => {
    // visited = 0;
    return new Promise((resolve) => {
        let t0 = performance.now();
        let workInProgress = root;

        function step() {

            const slice = performance.now();

            while (workInProgress && (performance.now() - slice) < budgetMs) {
                workInProgress = performUnitOfWork(workInProgress);
            }

            if (workInProgress) {
                requestAnimationFrame(step);
            } else {
                resolve((performance.now() - t0).toFixed(2));
            }
        }

        requestAnimationFrame(step)
    })
}