import { doExpensiveMath } from "./utils.js"

/**
 * 재귀적으로 순회하며 계산
 */
export const runAtomicDfs = (node) => {
    doExpensiveMath(10)
    let child = node.children;
    while (child) {
        runAtomicDfs(child);
        child = child.sibling;
    }

}