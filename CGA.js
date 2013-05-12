/**
 * @fileOverview CGA
 * @author Neo He
 * @version 0.1.0
 */

var MODELSRC = "";
var FUNCQUEUE = [];

/**
 * @class CGA Class
 * @param  {String} sceneId  Scene ID
 * @param  {String} canvasId Canvas ID
 */
function clsCGA(sceneId, canvasId) {
	this.rule = {};
	this.env = {};
	this.node = [];//new clsNode('root');
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

									{
										type: "light",
										mode: "dir",
										color: { r: 0.5, g: 0.5, b: 0.5 },
										diffuse: true,
										specular: true,
										dir: { x: 0.0, y: -0.5, z: 0.0 }
									},

									{
										type: "light",
										mode: "dir",
										color: { r: 0.6, g: 0.6, b: 0.6 },
										diffuse: true,
										specular: true,
										dir: { x: 1.0, y: -0.5, z: -1.0 }
									},

									{
										type: "light",
										mode: "dir",
										color: { r: 0.6, g: 0.6, b: 0.6 },
										diffuse: true,
										specular: true,
										dir: { x: -1.0, y: -0.5, z: -1.0 }
									},

									{
										type: "translate",
										id: "mainTranslate",
										x: 0,
										y: 0,
										z: 0,

										nodes: [
											{
												type: "rotate",
												angle: -90.0,
												x: 1.0,

												nodes: [
													{
														type: "material",
														id: "ground",
														emit: 0,
														baseColor:      { r: 0.9, g: 0.9, b: 0.9 },
														specularColor:  { r: 0.9, g: 0.9, b: 0.9 },
														specular:       1.0,
														shine:          70.0,

														nodes: [
															{
																type: "quad",
																xSize: 10.0,
																ySize: 10.0
															}
														]
													}
												]
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
																	{
																		type: 'scale',
																		x: 0.1,
																		y: 0.1,
																		z: 0.1,

																		nodes: [
																			// tankJSON
																			// windowModel
																		]

																	},

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
	var arr = newRule.successor.match(/\S+\([^\s()]+\)(\{[^\}]+\})?(?=(\s+|$))/g);
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

	if (rule.predecessor == '') {
		rule.func.forEach(function(fe, fi) {
			if (fe[0] == 'I' || fe[0] == 'M') {
				var newNode = new clsNode(fe[2]);
				newNode[fe[0]](fe[1]);
				node.push(newNode);
			}
			else {//} if (fe[0] == 'T' || fe[0] == 'S' || fe[0] == 'R') {
				FUNCQUEUE.push(fe);
			}
		});
	}
	else if (node.raw && node.name == rule.predecessor) {
		rule.func.forEach(function(fe, fi) {
			fe[2] == undefined ? node[fe[0]](fe[1]) : node[fe[0]](fe[1], fe[2]);
		});
	}
	if (node.children != undefined && node.children.length > 0) {
		node.children.forEach(function(ce, ci) {
			handleNode(rule, ce);
		});
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
	var newSceneNode = (node.isModel != undefined) && (node.isModel == true) ?
		node.entity : {
			id: node.name + '_' + index,
			type: node.entity,
			nodes: []
		};

	if (node.attribute.texture != null) {
		// var tmpSceneNode = newSceneNode;
		// newSceneNode = eval(node.attribute.texture);
		node.attribute.texture.nodes[0].nodes.push(newSceneNode);
		newSceneNode = node.attribute.texture;
		newSceneNode.nodes[0].layers[0].scale = getTextureScale(node.attribute.scale);
	}

	if (node.attribute.scale.toString() != [1, 1, 1].toString()) {
		newSceneNode = {
			type: "scale",
			x: node.attribute.scale[0],
			y: node.attribute.scale[1],
			z: node.attribute.scale[2],

			nodes: [
				newSceneNode
			]
		}
	}
	if (node.attribute.rotate[1] != 0) {
		newSceneNode = {
			type: "rotate",
			angle: node.attribute.rotate[1],

			nodes: [
				newSceneNode
			]
		}
		newSceneNode[['x', 'y', 'z'][node.attribute.rotate[0]]] = 1.0;
	}
	if (node.attribute.translate.toString() != [0, 0, 0].toString()) {
		newSceneNode = {
			type: "translate",
			x: node.attribute.translate[0],
			y: node.attribute.translate[1],
			z: node.attribute.translate[2],

			nodes: [
				newSceneNode
			]
		}
	}

	// tmpNodes = entityNode[Number((node.isModel != undefined) && (node.isModel == true))];

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
		if (this.rule[i].predecessor == '') {
			handleNode(this.rule[i], this.node);
		}
		else {
			var that = this;
			this.node.forEach(function(e) {
				handleNode(that.rule[i], e);
			});
		}
	}
};

/**
 * Create scene, and save scene handler
 */
clsCGA.prototype.buildScene = function() {
	this.buildNodes();

	SceneJS.createScene(this.scene);
	this.scene = SceneJS.scene(this.scene.id);
};

/**
 * Render scene, insert all node into scene
 * @param  {Object} func Functions to be called in start()
 */
clsCGA.prototype.renderScene = function(func) {
	this.scene.start(func);
	var mainSceneNode = this.scene.findNode('main');
	this.node.forEach(function(e, i) {
		insertNode(this.scene, e, mainSceneNode, i);
	});
};

/**
 * Set src of models to be loaded
 * @param {String} src src of models
 */
clsCGA.prototype.setModelSrc = function(src) {
	MODELSRC = src;
}

/**
 * @class Node Class
 * @param  {String} name
 */
function clsNode(name) {
	this.name = name;
	this.children = [];
	this.entity = null;
	this.raw = true;
	this.attribute = {
		'translate': [0, 0, 0],
		'scale': [1, 1, 1],
		'rotate': [0, 0],
		'texture': null
	};
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

	this.attribute.translate = argsArr;
};

/**
 * Rotate function
 * @param {String} args Rotate arguments
 */
clsNode.prototype.R = function(args) {
	var argsArr = args.split(/\s*,\s*/);

	this.attribute.rotate = [getAxis(argsArr[0]), parseFloat(argsArr[1])];
};


clsNode.prototype.Text = function(args) {
	var that = this;

	loadScript(MODELSRC + args + '.js', function() {
		that.attribute.texture = eval(args);
	});
}

/**
 * Scale function
 * @param {String} args Scale arguments
 */
clsNode.prototype.S = function(args) {
	var argsArr = args.split(/\s*,\s*/);
	for (var i = argsArr.length - 1; i >= 0; i--) {
		argsArr[i] = parseFloat(argsArr[i]);
	};

	this.attribute.scale = argsArr;
	this.attribute.translate[1] += argsArr[1];
};

/**
 * Identity function
 * @param {String} args Identity name
 */
clsNode.prototype.I = function(args) {
	var f = null;
	this.entity = args;
	while (f = FUNCQUEUE.shift()) {
		this[f[0]](f[1]);
	}
};

/**
 * Model function
 * @param {String} args Model name
 */
clsNode.prototype.M = function(args) {
	var f = null;
	var that = this;
	while (f = FUNCQUEUE.shift()) {
		this[f[0]](f[1]);
	}

	loadScript(MODELSRC + args + '.js', function() {
		that.entity = eval(args);
		that.isModel = true;
	});
}

/**
 * Sub-divide function
 * @param {String} args  Axis and divide arguments
 * @param {String} names Name of each part
 */
clsNode.prototype.Subdiv = function(args, names) {
	if (this.isModel != undefined && this.isModel) {
		that.raw = false;
		return;
	}

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
		newNode.attribute.scale[axis] = argsArr[i] / sum * that.attribute.scale[axis];
		newNode.attribute.translate[axis] = (offset * 2 + argsArr[i] - sum) / sum * that.attribute.scale[axis];
		that.children.push(newNode);
		offset += argsArr[i];
	});
	that.attribute.scale[axis] = 1;
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

function getTextureScale(scale) {
	if (scale[2] <= 1) {
		return {
			x: scale[0],
			y: scale[1],
			z: 1
		};
	}
	else if (scale[0] <= scale[1] && scale[0] <= scale[2]) {
		return {
			x: scale[2],
			y: scale[1],
			z: 1
		};
	}
	else {
		return {
			x: scale[0],
			y: scale[2],
			z: 1
		};
	}
}

function loadScript(url, callback) {
	var script = document.createElement("Script");
	script.type = "text/javascript";

	//IE 验证脚本是否下载完成
	if (script.readyState) {
		script.onreadystatechange = function() {
			//readyState属性有5种取值
			//uninitialized：初始状态
			//loading：开始下载
			//interactive：数据完成下载但尚不可用
			//complete：数据已经准备就绪
			//实际使用时，readyState的值并不像我们预想的那样有规律，实践发现使用readyState
			//最靠谱的方式是同时检查以下2个状态，只要其中1个触发，就认为脚本下载完成。
			if (script.readyState == "loaded" || script.readyState == "complete") {
				//移除事件处理器，确保事件不会处理2次
				script.onreadystatechange = null;
				callback();
			}
		}
	}

	//其他浏览器
	else {
		script.onload = function() {
			callback();
		};
	}

	script.src = url;
	//把新建的<Script>添加到<head>里比添加到<body>里更保险。
	document.getElementsByTagName("head")[0].appendChild(script);
	}

/**
 * Clone array
 * @return {Array}
 */
Array.prototype.clone = function() {
	return this.slice(0);
};
