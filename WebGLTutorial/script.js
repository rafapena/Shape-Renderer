
var positionBuffer = [
	0, 0, 0, 0,
	0, 0.5, 0, 0,
	0.7, 0, 0, 0
];

function main() {
	
	const canvas = document.querySelector("#glCanvas");
	const gl = canvas.getContext("webgl");
	if (gl === null) {
		alert("Unable to initialize WebGL. Your browser or machine may not support it.");
		return;
	}
	
	// Set clear color to black, fully opaque then clear the color buffer with specified clear color
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);
}

window.onload = main;