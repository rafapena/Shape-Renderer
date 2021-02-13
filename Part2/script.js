
var cubeRotationX = 0.0;
var cubeRotationY = 0.0;
var cubeRotationZ = 0.0;
var cubeZoom = -6.0;
var cubeTranslationX = 0.0;
var cubeTranslationY = 0.0;

var displayFlatShaded = true;
var displayFaces = true;
var displayWireframe = false;

var shapePositions;
var shapeIndices;

var loadedShape = false;
var shapeFirstVertex;

class Edge {
  constructor(vert_origin, vert_destination) {
	  this.vert_origin = vert_origin;
	  this.vert_destination = vert_destination;
  }
  set_face(face_left, face_right) {
	  this.face_left = face_left;
	  this.face_right = face_right;
  }
  set_edges(edge_left_cw, edge_left_ccw, edge_right_cw, edge_right_ccw) {
	  this.edge_left_cw = edge_left_cw;
	  this.edge_left_ccw = edge_left_ccw 
	  this.edge_right_ccw = edge_right_ccw;
  }
}

class Vertex {
  constructor(x, y, z) {
	  this.x = x;
	  this.y = y;
	  this.z = z;
  }
  set_edge(edge) {
	  this.edge = edge;
  }
}

class Face {
  constructor(edge) {
	  this.edge = edge;
  }
}


function displayFlatShadedMesh() {
	displayMeshMode(true, true, false);
	main();
}

function displaySmoothlyShadedMesh() {
	displayMeshMode(false, true, false);
	main();
}

function displayWireframeMesh() {
	displayMeshMode(false, false, true);
}

function displayShadedWithMeshEdges() {
	displayMeshMode(displayFlatShaded, true, true);
}

function displayMeshMode(flat, face, wire) {
	displayFlatShaded = flat;
	displayFaces = face;
	displayWireframe = wire;
}

function updateRotationXSlider(slideAmount) {
	cubeRotationX = parseFloat(slideAmount);
}

function updateRotationYSlider(slideAmount) {
	cubeRotationY = parseFloat(slideAmount);
}

function updateRotationZSlider(slideAmount) {
	cubeRotationZ = parseFloat(slideAmount);
}

function updateZoomSlider(slideAmount) {
	cubeZoom = parseFloat(slideAmount);
}

function updateTranslationXSlider(slideAmount) {
	cubeTranslationX = -parseFloat(slideAmount);
}

function updateTranslationYSlider(slideAmount) {
	cubeTranslationY = parseFloat(slideAmount);
}

function generateLoadedShape(output) {
	shapePositions = [
		// Front face
		-1.0, -1.0,  1.0,
		 1.0, -1.0,  1.0,
		 1.0,  1.0,  1.0,
		-1.0,  1.0,  1.0,

		// Back face
		-1.0, -1.0, -1.0,
		-1.0,  1.0, -1.0,
		 1.0,  1.0, -1.0,
		 1.0, -1.0, -1.0,

		// Top face
		-1.0,  1.0, -1.0,
		-1.0,  1.0,  1.0,
		 1.0,  1.0,  1.0,
		 1.0,  1.0, -1.0,

		// Bottom face
		-1.0, -1.0, -1.0,
		 1.0, -1.0, -1.0,
		 1.0, -1.0,  1.0,
		-1.0, -1.0,  1.0,

		// Right face
		 1.0, -1.0, -1.0,
		 1.0,  1.0, -1.0,
		 1.0,  1.0,  1.0,
		 1.0, -1.0,  1.0,

		// Left face
		-1.0, -1.0, -1.0,
		-1.0, -1.0,  1.0,
		-1.0,  1.0,  1.0,
		-1.0,  1.0, -1.0,
	];
	shapeIndices = [
		0,  1,  2,      0,  2,  3,    // front
		4,  5,  6,      4,  6,  7,    // back
		8,  9,  10,     8,  10, 11,   // top
		12, 13, 14,     12, 14, 15,   // bottom
		16, 17, 18,     16, 18, 19,   // right
		20, 21, 22,     20, 22, 23,   // left
	];
	shapePositions = [];
	shapeIndices = [];
	for (var i = 0; i < output.length; i++) {
		var contents = output[i].split(" ");
		if (contents[0] === "v") {
			shapePositions.push(parseFloat(contents[1]));
			shapePositions.push(parseFloat(contents[2]));
			shapePositions.push(parseFloat(contents[3]));
		} else if (contents[0] === "f") {
			shapeIndices.push(parseInt(contents[1])-1);
			shapeIndices.push(parseInt(contents[2])-1);
			shapeIndices.push(parseInt(contents[3])-1);
		}
	}
}

//Function demonstrating how to load a sample file from the internet.
function loadFileFunction() {
	var output = "";
	var client = new XMLHttpRequest();
	client.open('GET', 'https://www.cs.sfu.ca/~haoz/teaching/cmpt464/assign/a1/horse.obj');
	client.onreadystatechange = function() {
		if (client.readyState == 4 && client.status == 200) {
			generateLoadedShape(client.responseText.split(/\r?\n/));
			loadedShape = true;
			main();
		}
	}
	client.send();
	//loadedShape = true;
	//main();
}

//A simple function to download files.
function downloadFile(filename, text) {
	var element = document.createElement('a');
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
	element.setAttribute('download', filename);
	element.style.display = 'none';
	document.body.appendChild(element);
	element.click();
	document.body.removeChild(element);
}

//A buttom to download a file with the name provided by the user
function downloadFileFunction(){
	var file = document.getElementById("filename").value;
	fileContent = "# " + (shapePositions.length/3) + " " + (shapeIndices.length/3);
	for (var i = 0; i < shapePositions.length; i += 3) {
	  fileContent += "\nv " + shapePositions[i] + " " + shapePositions[i+1] + " " + shapePositions[i+2];
	}
	for (var i = 0; i < shapeIndices.length; i += 3) {
	  fileContent += "\nf " + (shapeIndices[i]+1) + " " + (shapeIndices[i+1]+1) + " " + (shapeIndices[i+2]+1);
	}
	downloadFile(file, fileContent);
}



//
// Start here
//
function main() {
  const canvas = document.querySelector('#glcanvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }
  if (!loadedShape) return;
  
  // Vertex shader program
  var vsSource;
  if (displayFlatShaded) {
	vsSource = `
		attribute vec4 aVertexPosition;
		attribute vec4 aVertexColor;
		uniform mat4 uModelViewMatrix;
		uniform mat4 uProjectionMatrix;

		varying lowp vec4 vColor;
		void main(void) {
		  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
		  vColor = aVertexColor;
		}
	  `;
  }
  else {
	vsSource = `
		attribute vec4 aVertexPosition;
		uniform mat4 uProjectionMatrix, uModelViewMatrix;
		varying vec3 normalInterp, vertPos;
		
		float Ka = 0.5;
		float Kd = 1.0;
		float Ks = 1.0;
		float shininess = 128.0;
		
		varying lowp vec4 vColor;
		vec3 ambientColor = vec3(0.2, 0.2, 0.0);
		attribute vec3 aVertexColor;
		vec3 specularColor = vec3(1.0, 1.0, 1.0);
		vec3 lightPos = vec3(1, 1, -1);
		
		void main(void) {
		  vertPos = vec3(aVertexPosition) / aVertexPosition[3];
		  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
		  
		  normalInterp = vec3(uModelViewMatrix * aVertexPosition);	//vec3(uNormalMatrix * aVertexNormal);
		  vec3 N = normalize(normalInterp);
		  vec3 L = normalize(lightPos - vertPos);
		  float lambertian = max(dot(N, L), 0.0);
		  
		  float specular = 0.0;
		  if (lambertian > 0.0) {
			vec3 R = reflect(-L, N);
			vec3 V = normalize(-vertPos);
			float specAngle = max(dot(R, V), 0.0);
			specular = pow(specAngle, shininess);
		  }
		  vColor = vec4(Ka*ambientColor + Kd*lambertian*aVertexColor + Ks*specular*specularColor, 1);
		}
	  `;
  }

  // Fragment shader program
  const fsSource = `
    varying lowp vec4 vColor;
    void main(void) {
      gl_FragColor = vColor;
    }
  `;

  // Initialize a shader program; this is where all the lighting for the vertices and so forth is established
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Collect all the info needed to use the shader program
  // Look up which attributes our shader program is using for aVertexPosition, aVevrtexColor and also look up uniform locations
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
    }
  };
  
  // Call the routine that builds all the objects we'll be drawing.
  const buffers = initBuffers(gl);

  // Draw the scene repeatedly
  var then = 0;
  function render(now) {
    now *= 0.001;  // convert to seconds
    const deltaTime = now - then;
    then = now;
    drawScene(gl, programInfo, buffers, deltaTime);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}



function initBuffers(gl) {
	
	// Define shape
	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shapePositions), gl.STATIC_DRAW);
	
	// Define colors
	color = [1.0,  1.0,  1.0,  1.0];
	const colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color), gl.STATIC_DRAW);
	
	// Define indices
	const indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(shapeIndices), gl.STATIC_DRAW);
	
	return {
		position: positionBuffer,
		color: colorBuffer,
		indices: indexBuffer,
	};
}


function drawScene(gl, programInfo, buffers, deltaTime) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  const projectionMatrix = mat4.create();
  const fieldOfView = 45 * Math.PI / 180;
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

  // Set the drawing position to the "identity" point, which is the center of the scene.
  const modelViewMatrix = mat4.create();
  const deg2rad = Math.PI / 180.0;
  mat4.translate(modelViewMatrix, modelViewMatrix, [-cubeTranslationX, cubeTranslationY, cubeZoom]);
  mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotationX * deg2rad, [1, 0, 0]);
  mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotationY * deg2rad, [0, 1, 0]);
  mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotationZ * deg2rad, [0, 0, 1]);

  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute
  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, numComponents, type, normalize, stride, offset);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
  }

  // Tell WebGL how to pull out the colors from the color buffer
  // into the vertexColor attribute.
  {
    const numComponents = 4;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexColor, numComponents, type, normalize, stride, offset);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
  }

  // Tell WebGL which indices to use to index the vertices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

  // Tell WebGL to use our program when drawing
  gl.useProgram(programInfo.program);

  // Set the shader uniforms
  gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
  gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
  //gl.uniformMatrix4fv(programInfo.uniformLocations.normalMatrix, false, normalMatrix);

  {
    const vertexCount = 36;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
	
    //This is how you draw triangles and lines
	if (displayFaces) gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    if (displayWireframe) gl.drawElements(gl.LINES, vertexCount, type, offset);
  }
}


//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }
  return shaderProgram;
}


//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

main();