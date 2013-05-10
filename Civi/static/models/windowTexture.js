var windowTexture = {
	type: "material",
	baseColor: { r: 1.0, g: 1.0, b: 1.0 },

	nodes: [
		{
			type: "texture",
			layers: [
				{
					// Only the image URI is mandatory:
					uri:$SCRIPT_ROOT + '/static/models/window.jpg',
				}
			],

			nodes: [

			]
		}
	]
}