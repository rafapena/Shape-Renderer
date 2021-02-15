class Edge {
  constructor(index) {
	  this.index = index;
  }
  set(vertex, face, prevEdge, nextEdge, oppEdge) {
	  this.vertex = vertex;		// Source vertex
	  this.face = face;			// Left face
	  this.prevEdge = prevEdge;	// prev->next CCW
	  this.nextEdge = nextEdge;
	  this.oppEdge = oppEdge;
  }
}

class Vertex {
  constructor(index) {
	  this.index = index;
	  this.edge = null;
	  this.x = 0;
	  this.y = 0;
	  this.z = 0;
	  this.normX = 0;
	  this.normY = 0;
	  this.normZ = 0;
  }
  computeNormal() {
	  this.normX = 0;
	  this.normY = 0;
	  this.normZ = 0;
	  var start = this.edge;
	  var e = start;
	  do {
		  this.normX += e.face.normX;
		  this.normY += e.face.normY;
		  this.normZ += e.face.normZ;
		  e = e.prevEdge.oppEdge;
	  } while (e.index != start.index)
  }
}

class Face {
  constructor(index) {
	  this.index = index;
	  this.edge = null;
	  this.normX = 0;
	  this.normY = 0;
	  this.normZ = 0;
  }
  computeNormal() {
	  this.normX = 0;
	  this.normY = 0;
	  this.normZ = 0;
	  var start = this.edge;
	  var e = start;
	  do {
		  const v = e.vertex;
		  const vNext = e.nextEdge.vertex;
		  this.normX += (v.y - vNext.y) * (v.z + vNext.z);
		  this.normY += (v.z - vNext.z) * (v.x + vNext.x);
		  this.normZ += (v.x - vNext.x) * (v.y + vNext.y);
		  e = e.nextEdge;
	  } while (e.index != start.index)
  }
}


//
// Class declaration
//
class WingedEdge {
  
  constructor(vertices, faces) {
	  var v = vertices.length;
	  var f = faces.length;
	  this.E = [];
	  this.V = [];
	  this.F = [];
	  for (var i = 0; i < v + f + 4; i++) {
		  this.E.push(new Edge(i));
	  }
	  for (var i = 0; i < v; i++) {
		  this.V.push(new Vertex(i));
	  }
	  for (var i = 0; i < f; i++) {
		  this.F.push(new Face(i));
	  }
  }
  
  setEdge(i, vi, fi, pei, nei, oei) {
	  var v = this.V[vi];
	  var f = this.F[fi];
	  var pe = this.E[pei];
	  var ne = this.E[nei];
	  var oe = this.E[oei];
	  this.E[i].set(v, f, pe, ne, oe);
  }
  
  setFace(i, ei) {
	  this.F[i].edge = this.E[ei];
  }
  
  setVertex(i, ei, coords) {
	  this.V[i].edge = this.E[ei];
	  this.V[i].x = coords[0];
	  this.V[i].y = coords[1];
	  this.V[i].z = coords[2];
  }
  
  computeVertexNormals() {
	  for (var i = 0; i < this.V.length; i++) {
		  this.V[i].computeNormal();
	  }
  }
  
  computeFaceNormals() {
	  for (var i = 0; i < this.F.length; i++) {
		  this.F[i].computeNormal();
	  }
  }
  
  addVertices() {
	  var vs = [];
	  for (var i = 0; i < this.V.length; i++) {
		  vs.push(this.V[i].x);
		  vs.push(this.V[i].y);
		  vs.push(this.V[i].z);
	  }
	  return vs;
  }
}