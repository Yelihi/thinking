

export class FiberNode {
    constructor(id, children = null, sibling = null, parent = null) {
        this.id = id;
        this.children = children;
        this.sibling = sibling;
        this.parent = parent;
    }
}

export class FiberTree {
    constructor(root) {
        this.root = root;
    }

    get lastNode() {
        if (!this.root) return null;
        let curr = this.root;
        while (curr.sibling) {
            curr = curr.sibling;
        }
        return curr;
    }
}

export const buildTree = ({ branching = 7, depth = 5 }) => {
    const root = new FiberNode('root');
    let id = 0;

    const build = (node, level) => {
        if (level >= depth) return;

        let prev = null;
        for (let i = 0; i < branching; i++) {
            const child = new FiberNode(`child-${id++}`);

            // ✅ 모든 child에 parent 설정
            child.parent = node;

            if (!node.children) {
                node.children = child;
            }

            if (prev) {
                prev.sibling = child;
            }
            prev = child;

            build(child, level + 1);
        }
    }

    build(root, 0);
    return new FiberTree(root);
}