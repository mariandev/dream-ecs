export class DependencyTree<T> {
	private _topDown: Map<T, T[]> = new Map();

	private _nodes: T[] = [];

	private _orderedNodes: T[] = [];
	public get OrderedNodes(): T[] {
		return this._orderedNodes;
	}

	/*
	* Source: https://gist.github.com/RubyTuesdayDONO/5006455
	* Original version: https://gist.github.com/six8/1732686
	* */
	private RegenerateOrder() {
		const graph = this._nodes.reduce((obj, node, index) => {
			const deps = this._topDown.get(node) || [];

			obj[index] = deps
				.map(n => this._nodes.indexOf(n).toString())
				.filter(i => i !== "-1");

			return obj;
		}, {} as {[node: string]: string[]});

		const sorted  = [] as string[], // sorted list of IDs ( returned value )
					visited = {} as {[node: string]: boolean}; // hash: id of already visited node => true

		// 2. topological sort
		function visit(node: string, ancestors: string[]) {
			ancestors.push(node);
			visited[node] = true;

			graph[node].forEach(function(dep) {
				if (ancestors.indexOf(dep) >= 0)  // if already in ancestors, a closed chain exists.
					throw new Error('Circular dependency "' +  dep + '" is required by "' + node + '": ' + ancestors.join(' -> '));

				// if already exists, do nothing
				if (visited[dep]) return;
				visit(dep, ancestors.slice(0)); // recursive call
			});

			if(sorted.indexOf(node)<0) sorted.push(node);
		}

		Object.keys(graph).forEach((node) => visit(node, []));

		this._orderedNodes = sorted.reverse().map(index => this._nodes[index]);
	}

	public AddElement(node: T) {
		if(this._nodes.indexOf(node) !== -1) return;

		this._nodes.push(node);

		this.RegenerateOrder();
	}

	public AddDependency(from: T, to: T) {
		if(!this._topDown.has(from)) {
			this._topDown.set(from, []);
		}

		this._topDown.get(from).push(to);

		this.RegenerateOrder();
	}
}
