var meshRotationX = 0.0;
var meshRotationY = 0.0;
var meshRotationZ = 0.0;
var meshZoom = -6.0;
var meshTranslationX = 0.0;
var meshTranslationY = 0.0;

var displayFlatShaded = true;
var displayFaces = true;
var displayWireframe = false;

var shapePositions;
var shapePositionNormals;
var shapeIndices;
var shapeIndexNormals;

var loadedShape = false;
var shapeInfo;


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
	meshRotationX = parseFloat(slideAmount);
}

function updateRotationYSlider(slideAmount) {
	meshRotationY = parseFloat(slideAmount);
}

function updateRotationZSlider(slideAmount) {
	meshRotationZ = parseFloat(slideAmount);
}

function updateZoomSlider(slideAmount) {
	meshZoom = parseFloat(slideAmount);
}

function updateTranslationXSlider(slideAmount) {
	meshTranslationX = -parseFloat(slideAmount);
}

function updateTranslationYSlider(slideAmount) {
	meshTranslationY = parseFloat(slideAmount);
}

function generateLoadedShape(output) {
	var firstLine = output[0].split(" ");
	var v = parseInt(firstLine[1]);
	var f = parseInt(firstLine[2]);
	let shapeInfo =  new WingedEdge(v, f);
	
	var v_index = 0;
	for (var vi = 0; vi < v; vi++) {
		var contents = output[vi].split(" ");
		if (contents[0] !== "v") continue;
		var x = parseFloat(contents[1]);
		var y = parseFloat(contents[2]);
		var z = parseFloat(contents[3]);
		shapeInfo.setVertex(v_index++, [x, y, z]);
	}
	var f_index = 0;
	var ei = 0;
	for (var fi = 0; fi < f; fi++) {
		var contents = output[v+fi].split(" ");
		if (contents[0] !== "f") continue;
		var v1 = parseInt(contents[1]) - 1;
		var v2 = parseInt(contents[2]) - 1;
		var v3 = parseInt(contents[3]) - 1;
		shapeInfo.setEdge(ei+0, v1,v2, f_index, ei+2,ei+1);
		shapeInfo.setEdge(ei+1, v2,v3, f_index, ei+0,ei+2);
		shapeInfo.setEdge(ei+2, v3,v1, f_index, ei+1,ei+0);
		f_index++;
		ei += 3;
	}
	shapeInfo.computeFaceNormals();
	shapeInfo.computeVertexNormals();
	
	shapePositions = [];
	shapePositionNormals = [];
	shapeIndices = [];
	for (var i = 0; i < shapeInfo.F.length; i++) {
		for (var j = 0; j < shapeInfo.F[i].edges.length; j++) {
			var v = shapeInfo.F[i].edges[j].srcVertex;
			shapeIndices.push(v.index);
		}
	}
	for (var i = 0; i < shapeInfo.V.length; i++) {
		var v = shapeInfo.V[i];
		shapePositions.push(v.x);
		shapePositions.push(v.y);
		shapePositions.push(v.z);
		shapePositionNormals.push(v.normX);
		shapePositionNormals.push(v.normY);
		shapePositionNormals.push(v.normZ);
	}
	/*for (var i = 0; i < shapeInfo.F.length; i++) {
		var start = shapeInfo.F[i].edge;
		var e = start;
		do {
			shapeIndices.push(e.srcVertex.index);
			shapePositions.push(e.srcVertex.x);
			shapePositions.push(e.srcVertex.y);
			shapePositions.push(e.srcVertex.z);
			e = e.nextEdge;
		} while (e.index != start.index)
	}*/
}

//Function demonstrating how to load a sample file from the internet.
function loadFileFunction() {
	var output = "";
	var client = new XMLHttpRequest();
	var token = 'AEY6SZ2YCD6BMCGBN7KEOBDAFQ62G';
	//client.open('GET', 'https://raw.githubusercontent.com/rafapena/CMPT-464-Assignment1/main/Part2/polyhedron.obj?token=' + token);
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




function parseOBJ(text) {
  // because indices are base 1 let's just fill in the 0th data
  const objPositions = [[0, 0, 0]];
  const objTexcoords = [[0, 0]];
  const objNormals = [[0, 0, 0]];

  // same order as `f` indices
  const objVertexData = [
    objPositions,
    objTexcoords,
    objNormals,
  ];

  // same order as `f` indices
  let webglVertexData = [
    [],   // positions
    [],   // texcoords
    [],   // normals
  ];

  const materialLibs = [];
  const geometries = [];
  let geometry;
  let groups = ['default'];
  let material = 'default';
  let object = 'default';

  const noop = () => {};

  function newGeometry() {
    // If there is an existing geometry and it's
    // not empty then start a new one.
    if (geometry && geometry.data.position.length) {
      geometry = undefined;
    }
  }

  function setGeometry() {
    if (!geometry) {
      const position = [];
      const texcoord = [];
      const normal = [];
      webglVertexData = [
        position,
        texcoord,
        normal,
      ];
      geometry = {
        object,
        groups,
        material,
        data: {
          position,
          texcoord,
          normal,
        },
      };
      geometries.push(geometry);
    }
  }

  function addVertex(vert) {
    const ptn = vert.split('/');
    ptn.forEach((objIndexStr, i) => {
      if (!objIndexStr) {
        return;
      }
      const objIndex = parseInt(objIndexStr);
      const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
      webglVertexData[i].push(...objVertexData[i][index]);
    });
  }

  const keywords = {
    v(parts) {
      objPositions.push(parts.map(parseFloat));
    },
    vn(parts) {
      objNormals.push(parts.map(parseFloat));
    },
    vt(parts) {
      // should check for missing v and extra w?
      objTexcoords.push(parts.map(parseFloat));
    },
    f(parts) {
      setGeometry();
      const numTriangles = parts.length - 2;
      for (let tri = 0; tri < numTriangles; ++tri) {
        addVertex(parts[0]);
        addVertex(parts[tri + 1]);
        addVertex(parts[tri + 2]);
      }
    },
    s: noop,    // smoothing group
    mtllib(parts, unparsedArgs) {
      // the spec says there can be multiple filenames here
      // but many exist with spaces in a single filename
      materialLibs.push(unparsedArgs);
    },
    usemtl(parts, unparsedArgs) {
      material = unparsedArgs;
      newGeometry();
    },
    g(parts) {
      groups = parts;
      newGeometry();
    },
    o(parts, unparsedArgs) {
      object = unparsedArgs;
      newGeometry();
    },
  };

  const keywordRE = /(\w*)(?: )*(.*)/;
  const lines = text.split('\n');
  for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
    const line = lines[lineNo].trim();
    if (line === '' || line.startsWith('#')) {
      continue;
    }
    const m = keywordRE.exec(line);
    if (!m) {
      continue;
    }
    const [, keyword, unparsedArgs] = m;
    const parts = line.split(/\s+/).slice(1);
    const handler = keywords[keyword];
    if (!handler) {
      console.warn('unhandled keyword:', keyword);  // eslint-disable-line no-console
      continue;
    }
    handler(parts, unparsedArgs);
  }

  // remove any arrays that have no entries.
  for (const geometry of geometries) {
    geometry.data = Object.fromEntries(
        Object.entries(geometry.data).filter(([, array]) => array.length > 0));
  }

  return {
    geometries,
    materialLibs,
  };
}

async function main() {
  const canvas = document.querySelector("#glcanvas");
  const gl = canvas.getContext("webgl");
  if (!gl) return;

  const vs = `
  attribute vec4 a_position;
  attribute vec3 a_normal;
  uniform mat4 u_projection;
  uniform mat4 u_view;
  uniform mat4 u_world;
  varying vec3 v_normal;
  void main() {
    gl_Position = u_projection * u_view * u_world * a_position;
    v_normal = mat3(u_world) * a_normal;
  }
  `;

  const fs = `
  precision mediump float;
  varying vec3 v_normal;
  uniform vec4 u_diffuse;
  uniform vec3 u_lightDirection;
  void main () {
    vec3 normal = normalize(v_normal);
    float fakeLight = dot(u_lightDirection, normal) * .5 + .5;
    gl_FragColor = vec4(u_diffuse.rgb * fakeLight, u_diffuse.a);
  }
  `;

  // compiles and links the shaders, looks up attribute and uniform locations
  const meshProgramInfo = webglUtils.createProgramInfo(gl, [vs, fs]);

  const response = await fetch('https://raw.githubusercontent.com/rafapena/CMPT-464-Assignment1/main/Part2/polyhedron.obj?token=AEY6SZ5FIHVFHP7JXZVLVMDAFTCQE');//('https://www.cs.sfu.ca/~haoz/teaching/cmpt464/assign/a1/goodhand.obj');
  const text = await response.text();
  const obj = parseOBJ(text);

  const parts = obj.geometries.map(({data}) => {
    // create a buffer for each array by calling gl.createBuffer, gl.bindBuffer, gl.bufferData
    const bufferInfo = webglUtils.createBufferInfoFromArrays(gl, data);
    return {
      material: {
        u_diffuse: [Math.random(), Math.random(), Math.random(), 1],
      },
      bufferInfo,
    };
  });

  function getExtents(positions) {
    const min = positions.slice(0, 3);
    const max = positions.slice(0, 3);
    for (let i = 3; i < positions.length; i += 3) {
      for (let j = 0; j < 3; ++j) {
        const v = positions[i + j];
        min[j] = Math.min(v, min[j]);
        max[j] = Math.max(v, max[j]);
      }
    }
    return {min, max};
  }

  function getGeometriesExtents(geometries) {
    return geometries.reduce(({min, max}, {data}) => {
      const minMax = getExtents(data.position);
      return {
        min: min.map((min, ndx) => Math.min(minMax.min[ndx], min)),
        max: max.map((max, ndx) => Math.max(minMax.max[ndx], max)),
      };
    }, {
      min: Array(3).fill(Number.POSITIVE_INFINITY),
      max: Array(3).fill(Number.NEGATIVE_INFINITY),
    });
  }

  const extents = getGeometriesExtents(obj.geometries);
  const range = m4.subtractVectors(extents.max, extents.min);
  
  // amount to move the object so its center is at the origin
  const objOffset = m4.scaleVector(m4.addVectors(extents.min, m4.scaleVector(range, 0.5)), -1);
  const cameraTarget = [0, 0, 0];
  
  // figure out how far away to move the camera so we can likely see the object.
  const radius = m4.length(range) * 1.2;
  const cameraPosition = m4.addVectors(cameraTarget, [0, 0, radius]);
  
  // Set zNear and zFar to something hopefully appropriate for the size of this object.
  const zNear = radius / 100;
  const zFar = radius * 3;

  function degToRad(deg) {
    return deg * Math.PI / 180;
  }

  function render(time) {
    time *= 0.001;  // convert to seconds

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    const fieldOfViewRadians = degToRad(60);
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

    const up = [0, 1, 0];
    // Compute the camera's matrix using look at.
    const camera = m4.lookAt(cameraPosition, cameraTarget, up);

    // Make a view matrix from the camera matrix.
    const view = m4.inverse(camera);

    const sharedUniforms = {
      u_lightDirection: m4.normalize([-1, 3, 5]),
      u_view: view,
      u_projection: projection,
    };

    gl.useProgram(meshProgramInfo.program);

    // calls gl.uniform
    webglUtils.setUniforms(meshProgramInfo, sharedUniforms);

    // compute the world matrix once since all parts are at the same space.
    let u_world = m4.xRotation(degToRad(meshRotationX));
	//u_world = m4.yRotation(degToRad(meshRotationY));
	//u_world = m4.zRotation(degToRad(meshRotationZ));
    //u_world = m4.translate(u_world, ...objOffset);

    for (const {bufferInfo, material} of parts) {
	  // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      webglUtils.setBuffersAndAttributes(gl, meshProgramInfo, bufferInfo);
	  // calls gl.uniform
      webglUtils.setUniforms(meshProgramInfo, {u_world, u_diffuse: material.u_diffuse});
	  // calls gl.drawArrays or gl.drawElements
      webglUtils.drawBufferInfo(gl, bufferInfo);
    }

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

main();
