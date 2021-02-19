
var cubeRotationX = 0.0;
var cubeRotationY = 0.0;
var cubeRotationZ = 0.0;
var cubeZoom = -4.0;
var cubeTranslationX = 0.0;
var cubeTranslationY = 0.0;

const FLAT_SHADED = 0;
const SMOOTHLY_SHADED = 1;
const WIREFRAME = 2;
const SHADED_WITH_WIREFRAME = 3;
var displayMode = FLAT_SHADED;

// Smooth shading and/or wireframes
var objPositions;
var objPositionNormals;
var objFaceIndices;
var objFaceIndicesWireframe;

// Flat shading
var objPositions0;			// Duplicate vertices
var objPositionNormals0;	// Face normals for 3 groups of vertices in objPositions0
var objFaceIndices0;		// Keeps track of indices from objPositions0

var loadedShape = false;
var shapeInfo;

var test0 = "# 24 12\n" +
"v -1 -1 1\n" +
"v 1 -1 1\n" +
"v 1 1 1\n" +
"v -1 1 1\n" +
"v -1 -1 -1\n" +
"v -1 1 -1\n" +
"v 1 1 -1\n" +
"v 1 -1 -1\n" +
"v -1 1 -1\n" +
"v -1 1 1\n" +
"v 1 1 1\n" +
"v 1 1 -1\n" +
"v -1 -1 -1\n" +
"v 1 -1 -1\n" +
"v 1 -1 1\n" +
"v -1 -1 1\n" +
"v 1 -1 -1\n" +
"v 1 1 -1\n" +
"v 1 1 1\n" +
"v 1 -1 1\n" +
"v -1 -1 -1\n" +
"v -1 -1 1\n" +
"v -1 1 1\n" +
"v -1 1 -1\n" +
"f 1 2 3\n" +
"f 1 3 4\n" +
"f 5 6 7\n" +
"f 5 7 8\n" +
"f 9 10 11\n" +
"f 9 11 12\n" +
"f 13 14 15\n" +
"f 13 15 16\n" +
"f 17 18 19\n" +
"f 17 19 20\n" +
"f 21 22 23\n" +
"f 21 23 24";

var test1 = "# 4 4\n" +
"v 0.57735 0 0\n" +
"v -0.288675 0.5 0\n" +
"v -0.288675 -0.5 0\n" +
"v 0 0 0.816497\n" +
"f 1 2 4\n" +
"f 2 3 4\n" +
"f 1 4 3\n" +
"f 1 3 2";


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// -- GUI operations --
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function displayFlatShadedMesh() {
	updateDisplay(FLAT_SHADED);
}

function displaySmoothlyShadedMesh() {
	updateDisplay(SMOOTHLY_SHADED);
}

function displayWireframeMesh() {
	updateDisplay(WIREFRAME);
}

function displayShadedWithMeshEdges() {
	updateDisplay(SHADED_WITH_WIREFRAME);
}

function updateDisplay(mode) {
	if (!loadedShape) return;
	displayMode = mode;
	main();
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


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// -- Save/Load and set up OBj files --
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function generateLoadedShape(output) {
	output = test0.split('\n');
	//output = test1.split('\n');
	//output = output.split('\n');
	
	var firstLine = output[0].split(" ");
	var v = parseInt(firstLine[1]);
	var f = parseInt(firstLine[2]);
	let shapeInfo =  new WingedEdge(v, f);
	
	var v_index = 0;
	var f_index = 0;
	var ei = 0;
	for (var i = 0; i < output.length; i++) {
		var contents = output[i].split(" ");
		if (contents[0] === "v") {
			var x = parseFloat(contents[1]);
			var y = parseFloat(contents[2]);
			var z = parseFloat(contents[3]);
			shapeInfo.setVertex(v_index++, [x, y, z]);
		}
		else if (contents[0] === "f") {
			var v1 = parseInt(contents[1]) - 1;
			var v2 = parseInt(contents[2]) - 1;
			var v3 = parseInt(contents[3]) - 1;
			shapeInfo.setEdge(ei+0, v1,v2, f_index, ei+2,ei+1);
			shapeInfo.setEdge(ei+1, v2,v3, f_index, ei+0,ei+2);
			shapeInfo.setEdge(ei+2, v3,v1, f_index, ei+1,ei+0);
			f_index++;
			ei += 3;
		}
	}
	shapeInfo.computeFaceNormals();
	shapeInfo.computeVertexNormals();
	
	objPositions = [];
	objPositionNormals = [];
	objFaceIndices = [];
	objPositions0 = [];
	objPositionNormals0 = [];
	objFaceIndices0 = [];
	
	var iter = 0;
	for (var i = 0; i < shapeInfo.F.length; i++) {
		var f = shapeInfo.F[i];
		for (var j = 0; j < f.edges.length; j++) {
			var v = f.edges[j].srcVertex;
			objFaceIndices.push(v.index);
			objFaceIndices0.push(iter++);
			objPositions0.push(v.x);
			objPositions0.push(v.y);
			objPositions0.push(v.z);
			objPositionNormals0.push(f.normX);
			objPositionNormals0.push(f.normY);
			objPositionNormals0.push(f.normZ);
		}
	}
	var v0 = shapeInfo.V[0];
	for (var i = 0; i < shapeInfo.V.length; i++) {
		var v = shapeInfo.V[i];
		objPositions.push(v.x);
		objPositions.push(v.y);
		objPositions.push(v.z);
		objPositionNormals.push(v.normX);
		objPositionNormals.push(v.normY);
		objPositionNormals.push(v.normZ);
	};
	objFaceIndicesWireframe = [];
	for (var i = 0; i < objFaceIndices.length; i += 3) {
		objFaceIndicesWireframe.push(objFaceIndices[i]);
		objFaceIndicesWireframe.push(objFaceIndices[i+1]);
		objFaceIndicesWireframe.push(objFaceIndices[i+1]);
		objFaceIndicesWireframe.push(objFaceIndices[i+2]);
		objFaceIndicesWireframe.push(objFaceIndices[i+2]);
		objFaceIndicesWireframe.push(objFaceIndices[i]);
	}
}

//Function demonstrating how to load a sample file from the internet.
function loadFileFunction() {
	var output = "";
	var client = new XMLHttpRequest();
	client.open('GET', 'https://www.cs.sfu.ca/~haoz/teaching/cmpt464/assign/a1/goodhand.obj');
	client.onreadystatechange = function() {
		if (client.readyState == 4 && client.status == 200) {
			generateLoadedShape(client.responseText);
			loadedShape = true;
			main();
		}
	}
	client.send();
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
	fileContent = "# " + (objPositions.length/3) + " " + (objFaceIndices.length/3);
	for (var i = 0; i < objPositions.length; i += 3) {
	  fileContent += "\nv " + objPositions[i] + " " + objPositions[i+1] + " " + objPositions[i+2];
	}
	for (var i = 0; i < objFaceIndices.length; i += 3) {
	  fileContent += "\nf " + (objFaceIndices[i]+1) + " " + (objFaceIndices[i+1]+1) + " " + (objFaceIndices[i+2]+1);
	}
	downloadFile(file, fileContent);
}



///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// -- Buffers and rendering --
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function main() {
  const canvas = document.querySelector('#glcanvas');
  const gl = canvas.getContext('webgl2');// || canvas.getContext('experimental-webgl');
  if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }
  if (!loadedShape) return;
  
  // Vertex and fragment shader programs
  var vsSource;
  var fsSource;
  
  if (displayMode == WIREFRAME) {
	  vsSource = `
		attribute vec4 aVertexPosition, aVertexNormal;
		uniform mat4 uProjectionMatrix, uModelViewMatrix, uNormalMatrix;
		attribute vec4 aVertexColor;
		varying lowp vec4 vColor;
		void main(void) {
		  gl_Position = uNormalMatrix * aVertexNormal;	// Include these variables to prevent buffer issues
		  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
		  vColor = aVertexColor;
		}
	  `;
	  fsSource = `
		varying lowp vec4 vColor;
		void main(void) {
		  gl_FragColor = vColor;
		}
	  `
  } else {
	  vsSource = `
		attribute vec4 aVertexPosition, aVertexNormal;
		uniform mat4 uProjectionMatrix, uModelViewMatrix, uNormalMatrix;
		varying vec3 normalInterp, vertPos;
		
		float Ka = 0.5;
		float Kd = 1.0;
		float Ks = 1.0;
		float shininess = 128.0;
		
		varying lowp vec4 vColor;
		vec3 ambientColor = vec3(0.1, 0.1, 0.2);
		attribute vec3 aVertexColor;
		vec3 specularColor = vec3(1.0, 1.0, 1.0);
		vec3 lightPos = vec3(0, 0, 0.5);
		
		void main(void) {
		  vertPos = vec3(aVertexPosition) / aVertexPosition[3];
		  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
		  
		  normalInterp = vec3(uNormalMatrix * aVertexNormal);
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
	  fsSource = `
		varying lowp vec4 vColor;
		void main(void) {
		  gl_FragColor = vColor;
		}
	  `;
  }

  // Initialize a shader program; this is where all the lighting for the vertices and so forth is established
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Collect all the info needed to use the shader program
  // Look up which attributes our shader program is using for aVertexPosition, aVevrtexColor and also look up uniform locations
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
	  vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
      vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
	  normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
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
  var arrP, arrN, arrF;
  if (displayMode == FLAT_SHADED) {
	  arrP = objPositions0;
	  arrN = objPositionNormals0;
	  arrF = objFaceIndices0;
  } else {
	  arrP = objPositions;
	  arrN = objPositionNormals;
	  arrF = objFaceIndices;
  }
	
  // Define shape
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arrP), gl.STATIC_DRAW);

  // Define normals
  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arrN), gl.STATIC_DRAW);
	
  // Define colors
  var diffuse = [1.0, 1.0, 1.0, 1.0];
  var colors = [];
  for (var i = 0; i < arrF.length; i += 3) {
	  colors = colors.concat(diffuse, diffuse, diffuse);	// Color for each vertex
  }
  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  
  // Define color wireframe
  var frameColor = [1.0, 0.0, 0.0, 1.0];
  var colorsWireframe = [];
  for (var i = 0; i < objFaceIndicesWireframe.length; i += 3) {
	  colorsWireframe = colorsWireframe.concat(frameColor, frameColor, frameColor);		// Color for each vertex
  }
  const colorWireframeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorWireframeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorsWireframe), gl.STATIC_DRAW);
	
  // Define indices
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(arrF), gl.STATIC_DRAW);
  
  // Define wireframe indices
  const indexWireframeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexWireframeBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(objFaceIndicesWireframe), gl.STATIC_DRAW);

  return {
	  position: positionBuffer,
	  normal: normalBuffer,
	  color: colorBuffer,
	  colorWireframe: colorWireframeBuffer,
	  indices: indexBuffer,
	  indicesWireframe: indexWireframeBuffer,
  };
}


function drawScene(gl, programInfo, buffers, deltaTime) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Projection Matrix
  const projectionMatrix = mat4.create();
  const fieldOfView = 45 * Math.PI / 180;
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

  // Model View Matrix: Set the drawing position to the "identity" point, which is the center of the scene.
  const modelViewMatrix = mat4.create();
  const deg2rad = Math.PI / 180.0;
  mat4.translate(modelViewMatrix, modelViewMatrix, [-cubeTranslationX, cubeTranslationY, cubeZoom]);
  mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotationX * deg2rad, [1, 0, 0]);
  mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotationY * deg2rad, [0, 1, 0]);
  mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotationZ * deg2rad, [0, 0, 1]);

  // Normal Matrix
  var mtx = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
  for (var i = 0; i < 4; i++) {
	  for (var j = 0; j < 4; j++) {
		  mtx[i][j] = modelViewMatrix[i*4+j];
	  }
  }
  mtx = math.transpose(math.inv(mtx));
  var nm = [];
  for (var i = 0; i < 4; i++) {
	  for (var j = 0; j < 4; j++) {
		  nm.push(mtx[i][j]);
	  }
  }
  const normalMatrix = nm;

  // Tell WebGL how to pull out the contents from their buffers and into their respective attributes
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);		// numComponents, type, normalize, stride, offset
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
  gl.vertexAttribPointer(programInfo.attribLocations.vertexNormal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal);

  // Tell WebGL which indices to use to use the program when drawing
  gl.useProgram(programInfo.program);

  // Tell WebGL which indices to use to index the vertices then use our program when drawing
  if (displayMode != SHADED_WITH_WIREFRAME) {
	  if (displayMode == WIREFRAME) gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indicesWireframe);
	  else gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
  }

  // Set the shader uniforms
  gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
  gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
  gl.uniformMatrix4fv(programInfo.uniformLocations.normalMatrix, false, normalMatrix);

  // Settings before drawing the triangles and lines
  const type = gl.UNSIGNED_SHORT;
  const offset = 0;
  
  // Tell WebGL which indices to use to index the vertices then use our program, indices are colored before they are drawn
  if (displayMode == WIREFRAME || displayMode == SHADED_WITH_WIREFRAME) {
	  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colorWireframe);
	  gl.vertexAttribPointer(programInfo.attribLocations.vertexColor, 4, gl.FLOAT, false, 0, 0);
	  gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
	  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indicesWireframe);
	  gl.drawElements(gl.LINES, objFaceIndicesWireframe.length, type, offset);
  }
  if (displayMode != WIREFRAME) {
	  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
	  gl.vertexAttribPointer(programInfo.attribLocations.vertexColor, 4, gl.FLOAT, false, 0, 0);
	  gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
	  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
	  var len = (displayMode == FLAT_SHADED) ? objFaceIndices0.length : objFaceIndices.length;
	  gl.drawElements(gl.TRIANGLES, len, type, offset);
  }
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// -- Shader programs --
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Initialize a shader program, so WebGL knows how to draw our data
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

// creates a shader of the given type, uploads the source and compiles it.
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