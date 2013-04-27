/**
 * @fileOverview CGA
 * @author Neo He
 * @version 0.1.0
 */

/**
 * @class CGA Class
 * @param  {String} sceneId  Scene ID
 * @param  {String} canvasId Canvas ID
 */
function clsCGA(sceneId, canvasId) {
	this.rule = {};
	this.env = {};
	this.node = new clsNode('root');
	this.scene = {
		id: sceneId,
		canvasId: canvasId,
		nodes: [
			{
				type: "lookAt",
				eye : { x: 0.0, y: 15.0, z: 15 },
				look : { y:1.0 },
				up : { y: 1.0 },
				nodes: [
					{
						type: "camera",
						id: "mainCamera",
						optics: {
							type: "perspective",
							fovy : 25.0,
							aspect : 1.47,
							near : 0.10,
							far : 300.0
						},
						nodes: [

						/* Renderer node to set BG colour
						 */
							{
								type: "renderer",
								// clearColor: { r: 0.3, g: 0.3, b: 0.6 },
								clear: {
									depth : true,
									color : true
								},

								nodes: [

									/* Point lights
									 */
									{
										type: "light",
										mode: "dir",
										color: { r: 1.0, g: 1.0, b: 1.0 },
										diffuse: true,
										specular: true,
										dir: { x: 1.0, y: -0.5, z: -1.0 }
									},

									{
										type: "rotate",
										id: "pitch",
										angle: 0.0,
										x : 1.0,

										nodes: [
											{
												type: "rotate",
												id: "yaw",
												angle: 0.0,
												y : 1.0,

												nodes: [

													/* Ambient, diffuse and specular surface properties
													 */
													{
														type: "material",
														id: "main",
														emit: 0,
														baseColor:      { r: 0.5, g: 0.5, b: 0.6 },
														specularColor:  { r: 0.9, g: 0.9, b: 0.9 },
														specular:       1.0,
														shine:          50.0,

														nodes: [
															// {
															// 	type: "cube",
															// 	xSize: 2
															// },
															// {
															// 	type: "cube",
															// 	ySize: 2
															// }
														]
													}
												]
											}
										]
									}
								]
							}
						]
					}
				]
			}
		]
	};
}

/**
 * Add a rule
 * @param {String|Arrary|Object} id          Rule's ID
 * @param {String} predecessor
 * @param {String} cond        Condition
 * @param {String} successor
 * @param {String} prob        Probability
 */
clsCGA.prototype.addRule = function(id, predecessor, cond, successor, prob) {
	var type = getTypeof(id);
	var newRule;
	if (type == 'String') {
		newRule = this.rule[id] = {
			"predecessor": predecessor,
			"cond": cond,
			"successor": successor,
			"prob": prob
		}
	}
	else if (type == 'Object') {
		newRule = this.rule[id.id] = {
			"predecessor": id.predecessor,
			"cond": id.cond,
			"successor": id.successor,
			"prob": id.prob
		}
	}
	else if (type == 'Array') {
		newRule = this.rule[id[0]] = {
			"predecessor": predecessor[1],
			"cond": cond[2],
			"successor": successor[3],
			"prob": prob[4]
		}
	}
	newRule.func = newRule.func || [];
	var arr = newRule.successor.match(/\S+\([^\s()]+\)(\{.+\})?(?=(\s+|$))/g);
	var r;

	arr.forEach(function(e) {
		if (r = e.match(/(\w+)\((.+)\)(\{(.+)\})?/)) {
			if (r[3] != undefined) {
				newRule.func.push([r[1], r[2], r[4]]);
			}
			else {
				newRule.func.push([r[1], r[2]]);
			}
		}
	});

	return newRule;
};

/**
 * Apply rule on cga node
 * @param  {Object} rule
 * @param  {clsNode} node
 */
function handleNode(rule, node) {
	if (Math.random() > parseFloat(rule.prob)) return;

	if (node.raw && node.name == rule.predecessor) {
		rule.func.forEach(function(fe, fi) {
			fe[2] == undefined ? node[fe[0]](fe[1]) : node[fe[0]](fe[1], fe[2]);
		});
	}
	if (node.children.length > 0) {
		node.children.forEach(function(ce, ci) {
			handleNode(rule, ce);
		})
	}
};

/**
 * Insert a node into the scene
 * @param  {Scene} scene     Scene to insert node
 * @param  {clsNode} node      Node to be inserted
 * @param  {SceneNode} sceneNode Parent scene node, where a new child node will be inserted
 * @param  {String} index     Used to void id clash
 */
function insertNode(scene, node, sceneNode, index) {
	var newSceneNode = {
		type: "translate",
		x: node.position.translate[0],
		y: node.position.translate[1],
		z: node.position.translate[2],
		nodes: [
			{
				type: "scale",

				x: node.position.scale[0],
				y: node.position.scale[1],
				z: node.position.scale[2],
				nodes: [
					{
						id: node.name + '_' + index,
						type: node.entity,
						nodes: []
					}
				]
			}
		]
	}
	sceneNode.add("node", newSceneNode);
	if (node.children.length > 0) {
		var lastNode = scene.findNode(node.name + '_' + index);
		node.children.forEach(function(e, i) {
			insertNode(scene, e, lastNode, index + '_' + i);
		});
	}
}

/**
 * Build node tree in clsCGA
 */
clsCGA.prototype.buildNodes = function() {
	for(var i in this.rule) {
		handleNode(this.rule[i], this.node);
	}
};

/**
 * Create scene, and save scene handler
 */
clsCGA.prototype.buildScene = function() {
	SceneJS.createScene(this.scene);
	this.scene = SceneJS.scene(this.scene.id);
};

/**
 * Render scene, insert all node into scene
 * @param  {Object} func Functions to be called in start()
 */
clsCGA.prototype.renderScene = function(func) {
	this.scene.start(func);
	insertNode(this.scene, this.node, this.scene.findNode('main'), 0);
};

/**
 * @class Node Class
 * @param  {String} name
 */
function clsNode(name) {
	this.name = name;
	this.children = [];
	this.entity = null;
	this.raw = true;
	this.position = {
		'translate': [0, 0, 0],
		'scale': [1, 1, 1]
	};
	this.attributes = {};
}

/**
 * Translate function
 * @param {String} args Translate arguments
 */
clsNode.prototype.T = function(args) {
	var argsArr = args.split(/\s*,\s*/);
	for (var i = argsArr.length - 1; i >= 0; i--) {
		argsArr[i] = parseFloat(argsArr[i]);
	};

	this.position.translate = argsArr;
};

/**
 * Scale function
 * @param {String} args Scale arguments
 */
clsNode.prototype.S = function(args) {
	var argsArr = args.split(/\s*,\s*/);
	for (var i = argsArr.length - 1; i >= 0; i--) {
		argsArr[i] = parseFloat(argsArr[i]);
	};

	this.position.scale = argsArr;
};

/**
 * Identity function
 * @param {String} args Identity name
 */
clsNode.prototype.I = function(args) {
	this.entity = args;
};

/**
 * Sub-divide function
 * @param {String} args  Axis and divide arguments
 * @param {String} names Name of each part
 */
clsNode.prototype.Subdiv = function(args, names) {
	var that = this;
	var argsArr = args.split(/\s*,\s*/);
	var namesArr = names.trim().split(/\s*\|\s*/);
	var axis = getAxis(argsArr.shift());
	var newNode = null;
	var offset = 0;
	var sum = 0;
	for (var i = argsArr.length - 1; i >= 0; i--) {
		argsArr[i] = parseFloat(argsArr[i]);
		sum += argsArr[i];
	};
	namesArr.forEach(function(e, i) {
		newNode = new clsNode(e);
		newNode.entity = that.entity;
		newNode.position.translate[axis] = (offset * 2 + argsArr[i] - sum) / sum * that.position.scale[axis];
		newNode.position.scale[axis] = argsArr[i] / sum * that.position.scale[axis];
		that.children.push(newNode);
		offset += argsArr[i];
	});
	that.position.scale[axis] = 1;
	that.entity = 'layer';
	that.raw = false;
};

/**
 * Get axis number
 * @param  {Char} a Axis name
 * @return {Int}   Axis number
 */
function getAxis(a) {
	if (a == 'X' || a == 'x') return 0;
	else if (a == 'Y' || a == 'y') return 1;
	else if (a == 'Z' || a == 'z') return 2;
	else{
		console.error("Axis error! Set as X-axis");
		return 0;
	}
};

/**
 * Get variable's type
 * @param  {Any} a Variable
 * @return {String}   a's type
 */
function getTypeof(a) {
	var r = a.constructor.toString().match(/function\s(\w+)\(\).+/);
	return r[1];
}

/**
 * Clone array
 * @return {Array}
 */
Array.prototype.clone = function() {
	return this.slice(0);
};
