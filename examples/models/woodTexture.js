var woodTexture = {
	type: "material",
	baseColor: { r: 1.0, g: 1.0, b: 1.0 },

	nodes: [
		{
			type: "texture",
			layers: [
				{
					// Only the image URI is mandatory:
					uri:'models/wood.jpg',
					wrapS: "repeat",                       // Options are “clampToEdge” (default)
                                                           //      or “repeat”

                    wrapT: "repeat",
					scale : {
                        x: 2,
                        y: 2,
                        z: 1
                    }
				}
			],

			nodes: [

			]
		}
	]
}