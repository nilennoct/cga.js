var testTexture = {
	type: "material",
	baseColor: { r: 1.0, g: 1.0, b: 1.0 },

	nodes: [
		{
			type: "texture",
			layers: [
				{
					// Only the image URI is mandatory:

					uri:$SCRIPT_ROOT + '/static/models/water.jpg',

					// Optional params:

					applyTo: "baseColor",                  // Options so far are
														   //      “baseColor” (default),
														   //      “specular” for specular mapping
														   //      "alpha" for transparency mapping
														   //      "emit" for glow mapping
														   //      and "normals" for bump mapping

					minFilter: "linear",                   // Options are ”nearest”,
														   //      “linear” (default),
														   //      “nearestMipMapNearest”,
														   //      ”nearestMipMapLinear” or
														   //      “linearMipMapLinear”

					magFilter: "linear",                   // Options are “nearest” or
														   //      “linear” (default)

					wrapS: "repeat",                       // Options are “clampToEdge” (default)
														   //      or “repeat”

					wrapT: "repeat",                       // Options are "clampToEdge” (default)
														   //      or “repeat”

					isDepth: false,                        // Options are false (default) or true
					depthMode:"luminance",                 // (default)
					depthCompareMode: "compareRToTexture", // (default)
					depthCompareFunc: "lequal",            // (default)
					flipY: false,                          // Options are true (default) or false
					width: 1,
					height: 1,
					internalFormat:"lequal",               // (default)
					sourceFormat:"alpha",                  // (default)
					sourceType: "unsignedByte",            // (default)
					blendMode: "multiply",                 // Options are "add" (default) or
														   //      "multiply"

					// Optional transformations to apply to geometry UV coordinates
					// before they are mapped to the texture. Note that these
					// will have some performance overhead.

					rotate: {            // Currently textures are 2-D, so only
										 //      rotation about Z makes sense
						z: 45.0
					},

					translate : {
						x: 10,
						y: 0,
						z: 0
					},

					scale : {
						x: 1,
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