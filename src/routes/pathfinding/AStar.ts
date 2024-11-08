import { get } from 'svelte/store';
import { COLORS, Grid, Node } from './Grid';
import { stopped } from './stores';

export default class AStar extends Grid {
	open: Node[] = [];
	closed: Node[] = [];
	gScore = new Map<Node, number>();
	fScore = new Map<Node, number>();

	constructor(canvas: HTMLCanvasElement) {
		super(canvas);
	}

	getMapValueCurry(m: Map<Node, number>, default_v: number) {
		return function (n: Node) {
			const k = m.get(n);
			return k ?? default_v;
		};
	}

	solve(ctx: CanvasRenderingContext2D) {
		this.open = [this.start];
		this.closed = [];
		super.solve(ctx);
	}

	solutionIteration(ctx: CanvasRenderingContext2D) {
		if (get(stopped) || !this.start) return;

		if (this.open.length === 0) {
			this.resolveSolution();
			return;
		}

		this.gScore.set(this.start, 0);
		this.fScore.set(this.start, this.heuristic(this.start, this.end));

		const getG = this.getMapValueCurry(this.gScore, Number.POSITIVE_INFINITY);
		const getF = this.getMapValueCurry(this.fScore, Number.POSITIVE_INFINITY);

		let bestIndex = 0;

		for (let i = 1; i < this.open.length; i++) {
			if (getF(this.open[i]) < getF(this.open[bestIndex])) {
				bestIndex = i;
				this.fillColor(ctx, this.open[i], COLORS.open);
			}
		}

		for (const node of this.closed) {
			this.fillColor(ctx, node, COLORS.closed);
		}

		const current = this.open[bestIndex];
		this.animateCurrentPath(ctx, current);

		if (current === this.end) {
			// found
			this.resolveSolution();
			return;
		}

		this.open.splice(bestIndex, 1);
		this.closed.push(current);

		for (const neighbor of current.getSiblings(this.nodes, true, false)) {
			const tentativeGScore = getG(current) + this.heuristic(current, neighbor);

			if (tentativeGScore < getG(neighbor)) {
				neighbor.parent = current;
				this.gScore.set(neighbor, tentativeGScore);
				this.fScore.set(neighbor, tentativeGScore + this.heuristic(neighbor, this.end));

				if (!this.open.includes(neighbor)) {
					this.open.push(neighbor);
				}
			}
		}

		requestAnimationFrame(() => this.solutionIteration(ctx));
	}
}
