
// Buffer setup
var buffers;
var buffersSetUp = false;

// UI starting values
var objRotationX = document.getElementById("rotationXSliderAmount").value;
var objRotationY = document.getElementById("rotationYSliderAmount").value;
var objRotationZ = document.getElementById("rotationZSliderAmount").value;
var objZoom = document.getElementById("zoomSliderAmount").value;
var objTranslationX = document.getElementById("transitionXSliderAmount").value;
var objTranslationY = document.getElementById("transitionYSliderAmount").value;

// Display modes
const FLAT_SHADED = 0;
const SMOOTHLY_SHADED = 1;
const WIREFRAME = 2;
const SHADED_WITH_WIREFRAME = 3;
var displayMode = SHADED_WITH_WIREFRAME;	//FLAT_SHADED;

// Faces and vertices
var objPositions;
var objPositionNormals;
var objFaceIndices;
var objFaceIndicesWireframe;
var loadedShape = false;
var shapeInfo = new WingedEdge();


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// -- EDITABLE REGION --
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Shader settings
const ambientCoefficient = 0.5;
const diffuseCoefficient = 1.0;
const specularCoefficient = 1.0;
const shininess = 128.0;
const ambientColor = [0.1, 0.1, 0.3];
const diffuseColor = [0.9, 0.7, 0.4, 1.0];
const specularColor = [1.0, 1.0, 1.0];
const lightPosition = [0.0, 0.0, 0.5];

// Wireframe settings
const frameColor = [0.8, 0.0, 0.0, 1.0];


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// -- GUI operations --
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function displayFlatShadedMesh() {
	displayMode = FLAT_SHADED;
	main();
}

function displaySmoothlyShadedMesh() {
	displayMode = SMOOTHLY_SHADED;
	main();
}

function displayWireframeMesh() {
	displayMode = WIREFRAME;
	main();
}

function displayShadedWithMeshEdges() {
	displayMode = SHADED_WITH_WIREFRAME;
	main();
}

function updateRotationXSlider(slideAmount) {
	objRotationX = parseFloat(slideAmount);
}

function updateRotationYSlider(slideAmount) {
	objRotationY = parseFloat(slideAmount);
}

function updateRotationZSlider(slideAmount) {
	objRotationZ = parseFloat(slideAmount);
}

function updateZoomSlider(slideAmount) {
	objZoom = parseFloat(slideAmount);
}

function updateTranslationXSlider(slideAmount) {
	objTranslationX = -parseFloat(slideAmount);
}

function updateTranslationYSlider(slideAmount) {
	objTranslationY = parseFloat(slideAmount);
}

function decimateKEdges() {
	if (!loadedShape) {
		alert("Could not decimate:\nA shape must be loaded");
		return;
	}
	k = parseInt(document.getElementById("decimateEdges").value);
	if (isNaN(k) || k < 1 || k > shapeInfo.V.length) {
		alert("Could not decimate:\nEntry must be an integer between 1 and " + shapeInfo.V.length);
		return;
	}
	shapeInfo.decimate(k);
	transferWingedEdgeToArrays(shapeInfo);
	buffersSetUp = false;
	main();
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// -- Save/Load and set up OBj files --
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Set up the lists based on the contents of the output file
function generateLoadedShape(output) {
	output = "# 8 12\n" +
		"v -1.0 -1.0 1.0\n" +
		"v 1.0 -1.0 1.0\n" +
		"v -1.0 1.0 1.0\n" +
		"v 1.0 1.0 1.0\n" +
		"v -1.0 -1.0 -1.0\n" +
		"v 1.0 -1.0 -1.0\n" +
		"v -1.0 1.0 -1.0\n" +
		"v 1.0 1.0 -1.0\n" +
		"f 1 4 3\n" +
		"f 1 2 4\n" +
		"f 2 8 4\n" +
		"f 2 6 8\n" +
		"f 1 6 5\n" +
		"f 1 2 6\n" +
		"f 3 8 7\n" +
		"f 3 4 8\n" +
		"f 5 8 7\n" +
		"f 5 6 8\n" +
		"f 1 7 3\n" +
		"f 1 5 7";

	output = output.split('\n');
	var firstLine = output[0].split(" ");
	var v = parseInt(firstLine[1]);
	var f = parseInt(firstLine[2]);
	shapeInfo.setupTables(v, f);
	
	// Organize file data into winged edge data structure
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
	
	// Update winged edge object contents
	shapeInfo.normalizeVertices();
	shapeInfo.computeFaceNormals();
	shapeInfo.computeVertexNormals();
	transferWingedEdgeToArrays(shapeInfo);
}

//Function demonstrating how to load a sample file from the internet.
function loadFileFunction() {
	try {
		var client = new XMLHttpRequest();
		client.open('GET', document.getElementById("filenameLoad").value);
		client.onreadystatechange = function() {
			if (client.readyState == 4) {
				if (client.status == 200) {
					generateLoadedShape(client.responseText);
					loadedShape = true;
					buffersSetUp = false;
					main();
				} else {
					alert("Could not load file\nView the console log for more details\n\n" + client.responseText);
				}
			}
		}
		client.send();
	} catch(err) {}
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

//A button to download a file with the name provided by the user
function downloadFileFunction(){
	if (!loadedShape) {
		alert("Could not save shape: A file must be loaded first");
		return;
	}
	fileContent = "# " + (objPositions.length/3) + " " + (objFaceIndices.length/3);
	for (var i = 0; i < objPositions.length; i += 3) {
	  fileContent += "\nv " + objPositions[i] + " " + objPositions[i+1] + " " + objPositions[i+2];
	}
	for (var i = 0; i < objFaceIndices.length; i += 3) {
	  fileContent += "\nf " + (objFaceIndices[i]+1) + " " + (objFaceIndices[i+1]+1) + " " + (objFaceIndices[i+2]+1);
	}
	downloadFile(document.getElementById("filenameSave").value, fileContent);
}

// Arrays are used for the WebGL buffers
function transferWingedEdgeToArrays(wingedEdge) {
	objFaceIndices = [];
	for (var i = 0; i < wingedEdge.F.length; i++) {
		var start = wingedEdge.F[i].edge;
		var e = start;
		do {
			objFaceIndices.push(e.srcVertex.index);
			e = e.ccwNext;
		} while (e.index != start.index)
	}
	objPositions = [];
	objPositionNormals = [];
	for (var i = 0; i < wingedEdge.V.length; i++) {
		var v = wingedEdge.V[i];
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


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// -- Buffers and rendering --
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//
// The main program to set up and render content
//
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
	  vsSource = `#version 300 es
		in vec4 aVertexPosition;
		uniform mat4 uProjectionMatrix, uModelViewMatrix;
		in vec3 aVertexColor;
		flat out vec4 vColor;
		
		// Irrelevant attributes just used and replaced to suppress warnings
		in vec4 aVertexNormal;
		uniform mat4 uNormalMatrix;
		uniform float Ka, Kd, Ks, sh;
		uniform vec3 uAmbientColor, uSpecularColor, uLightPosition;
		
		void main(void) {
		  gl_Position = uNormalMatrix * aVertexNormal;
		  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
		  vColor = vec4(Ka*uAmbientColor + Kd*aVertexColor + Ks*sh*uSpecularColor, 1);
		  vColor = vec4(aVertexColor, 1);
		}
	  `;
	  fsSource = `#version 300 es
		precision mediump float;
		flat in vec4 vColor;
		out vec4 fragColor;
		void main(){
			fragColor = vColor;
		}
	  `;
  }
  
  else if (displayMode == FLAT_SHADED) {
	  vsSource = `#version 300 es
		in vec4 aVertexPosition, aVertexNormal;
		uniform mat4 uProjectionMatrix, uModelViewMatrix, uNormalMatrix;
		
		uniform float Ka, Kd, Ks, sh;
		in vec3 aVertexColor;
		uniform vec3 uAmbientColor, uSpecularColor, uLightPosition;
		flat out vec4 vColor;
		
		void main(void) {
		  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
		  
		  vec3 vertPos = vec3(aVertexPosition) / aVertexPosition[3];
		  vec3 normalInterp = vec3(uNormalMatrix * aVertexNormal);
		  vec3 N = normalize(normalInterp);
		  vec3 L = normalize(uLightPosition - vertPos);
		  float lambertian = max(dot(N, L), 0.0);
		  
		  float specular = 0.0;
		  if (lambertian > 0.0) {
			vec3 R = reflect(-L, N);
			vec3 V = normalize(-vertPos);
			float specAngle = max(dot(R, V), 0.0);
			specular = pow(specAngle, sh);
		  }
		  vColor = vec4(Ka*uAmbientColor + Kd*lambertian*aVertexColor + Ks*specular*uSpecularColor, 1);
		}
	  `;
	  fsSource = `#version 300 es
		precision mediump float;
		flat in vec4 vColor;
		out vec4 fragColor;
		void main(){
			fragColor = vColor;
		}
	  `;
  }
  
  else {
	  vsSource = `
		attribute vec4 aVertexPosition, aVertexNormal;
		uniform mat4 uProjectionMatrix, uModelViewMatrix, uNormalMatrix;
		
		uniform float Ka, Kd, Ks, sh;
		attribute vec3 aVertexColor;
		uniform vec3 uAmbientColor, uSpecularColor, uLightPosition;
		varying lowp vec4 vColor;
		
		void main(void) {
		  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
		  
		  vec3 vertPos = vec3(aVertexPosition) / aVertexPosition[3];
		  vec3 normalInterp = vec3(uNormalMatrix * aVertexNormal);
		  vec3 N = normalize(normalInterp);
		  vec3 L = normalize(uLightPosition - vertPos);
		  float lambertian = max(dot(N, L), 0.0);
		  
		  float specular = 0.0;
		  if (lambertian > 0.0) {
			vec3 R = reflect(-L, N);
			vec3 V = normalize(-vertPos);
			float specAngle = max(dot(R, V), 0.0);
			specular = pow(specAngle, sh);
		  }
		  vColor = vec4(Ka*uAmbientColor + Kd*lambertian*aVertexColor + Ks*specular*uSpecularColor, 1);
		}
	  `;
	  fsSource = `
		varying lowp vec4 vColor;
		void main(void) {
		  gl_FragColor = vColor;
		}
	  `;
  }

  // Initialize a shader program: this is where all the lighting for the vertices and so forth is established
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
	  Ka: gl.getUniformLocation(shaderProgram, 'Ka'),
	  Kd: gl.getUniformLocation(shaderProgram, 'Kd'),
	  Ks: gl.getUniformLocation(shaderProgram, 'Ks'),
	  shininess: gl.getUniformLocation(shaderProgram, 'sh'),
	  ambientColor: gl.getUniformLocation(shaderProgram, 'uAmbientColor'),
	  specularColor: gl.getUniformLocation(shaderProgram, 'uSpecularColor'),
	  lightPosition: gl.getUniformLocation(shaderProgram, 'uLightPosition'),
    }
  };
  
  // Call the routine that builds all the objects we'll be drawing.
  if (!buffersSetUp)
  {
	buffers = initBuffers(gl);
	buffersSetUp = true;
  }

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


//
// Set up the buffer content for each array
//
function initBuffers(gl) {
  // Define shape
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(objPositions), gl.STATIC_DRAW);

  // Define normals
  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(objPositionNormals), gl.STATIC_DRAW);
	
  // Define colors
  var colors = SetupVertexColors(objFaceIndices, diffuseColor);
  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  
  // Define color wireframe
  var colorWireframe = SetupVertexColors(objFaceIndicesWireframe, frameColor);
  const colorWireframeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorWireframeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorWireframe), gl.STATIC_DRAW);
	
  // Define indices
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(objFaceIndices), gl.STATIC_DRAW);
  
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

// Helper function for the function above: Sets the color all vertices in indexList to "color"
function SetupVertexColors(indexList, color) {
  var colors = [];
  for (var i = 0; i < indexList.length; i += 4) {
	  colors.push(color[0]);
	  colors.push(color[1]);
	  colors.push(color[2]);
	  colors.push(color[3]);
  }
  return colors;
}


//
// Render the objects in controlled by the GUI
//
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
  mat4.translate(modelViewMatrix, modelViewMatrix, [-objTranslationX, objTranslationY, objZoom]);
  mat4.rotate(modelViewMatrix, modelViewMatrix, objRotationX * deg2rad, [1, 0, 0]);
  mat4.rotate(modelViewMatrix, modelViewMatrix, objRotationY * deg2rad, [0, 1, 0]);
  mat4.rotate(modelViewMatrix, modelViewMatrix, objRotationZ * deg2rad, [0, 0, 1]);

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
  gl.uniform1f(programInfo.uniformLocations.Ka, ambientCoefficient);
  gl.uniform1f(programInfo.uniformLocations.Kd, diffuseCoefficient);
  gl.uniform1f(programInfo.uniformLocations.Ks, specularCoefficient);
  gl.uniform1f(programInfo.uniformLocations.shininess, shininess);
  gl.uniform3fv(programInfo.uniformLocations.ambientColor, ambientColor);
  gl.uniform3fv(programInfo.uniformLocations.specularColor, specularColor);
  gl.uniform3fv(programInfo.uniformLocations.lightPosition, lightPosition);

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
	  gl.drawElements(gl.TRIANGLES, objFaceIndices.length, type, offset);
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