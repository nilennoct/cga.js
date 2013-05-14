var doorTexture = {
	type: "material",
	baseColor: { r: 1.0, g: 1.0, b: 1.0 },

	nodes: [
		{
			type: "texture",
			layers: [
				{
					// Only the image URI is mandatory:
					uri:'models/door.jpg',
					scale : {
						x: 1,
						y: 1,
						z: 1
					}

				}
			],

			nodes: [

			]
		}
	]
}