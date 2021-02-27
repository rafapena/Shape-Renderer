class Edge {
  constructor(index) {
	  this.index = index;
	  this.oppEdge = null;
  }
  setVertices(src, dest) {
	  this.srcVertex = src;
	  this.destVertex = dest;
	  this.srcVertex.edges.push(this);
	  for (var i = 0; i < dest.edges.length; i++) {
		  if (dest.edges[i].destVertex.index == src.index && this.oppEdge == null) {	// Set the opposite edge
			  this.oppEdge = dest.edges[i];
			  dest.edges[i].oppEdge = this;
			  break;
		  }
	  }
  }
  setFace(left) {
	  this.face = left;
	  this.face.edges.push(this);
  }
  setCCWEdges(prev, next) {
	  this.ccwPrev = prev;
	  this.ccwNext = next;
  }
}

class Vertex {
  constructor(index) {
	  this.index = index;
	  this.edges = [];
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
	  for (var i = 0; i < this.edges.length; i++) {
		  this.normX += this.edges[i].face.normX;
		  this.normY += this.edges[i].face.normY;
		  this.normZ += this.edges[i].face.normZ;
	  }
	  /*var start = this.edges[0];
	  var e = start;
	  do {
		  this.normX += e.face.normX;
		  this.normY += e.face.normY;
		  this.normZ += e.face.normZ;
		  e = e.prevEdge.oppEdge;
	  } while (e.index != start.index)*/
  }
}

class Face {
  constructor(index) {
	  this.index = index;
	  this.edges = [];
	  this.normX = 0;
	  this.normY = 0;
	  this.normZ = 0;
  }
  computeNormal() {
	  this.normX = 0;
	  this.normY = 0;
	  this.normZ = 0;
	  for (var i = 0; i < this.edges.length; i++) {
		  const v = this.edges[i].srcVertex;
		  const vNext = this.edges[i].destVertex;
		  this.normX += (v.y - vNext.y) * (v.z + vNext.z);
		  this.normY += (v.z - vNext.z) * (v.x + vNext.x);
		  this.normZ += (v.x - vNext.x) * (v.y + vNext.y);
	  }
	  /*var start = this.edges[0];
	  var e = start;
	  do {
		  const v = e.srcVertex;
		  const vNext = e.nextEdge.srcVertex;
		  this.normX += (v.y - vNext.y) * (v.z + vNext.z);
		  this.normY += (v.z - vNext.z) * (v.x + vNext.x);
		  this.normZ += (v.x - vNext.x) * (v.y + vNext.y);
		  e = e.nextEdge;
	  } while (e.index != start.index)*/
  }
}


//
// Class declaration
//
class WingedEdge {
  
  constructor() {
	  this.E = [];
	  this.V = [];
	  this.F = [];
	  this.minVertexVal = Infinity;
	  this.maxVertexVal = -Infinity;
  }
  
  setupTables(v, f) {
	  for (var i = 0; i < f * 3; i++) {
		  this.E.push(new Edge(i));
	  }
	  for (var i = 0; i < v; i++) {
		  this.V.push(new Vertex(i));
	  }
	  for (var i = 0; i < f; i++) {
		  this.F.push(new Face(i));
	  }
  }
  
  setEdge(i, vi1, vi2, fi, pei, nei) {
	  this.E[i].setVertices(this.V[vi1], this.V[vi2]);
	  this.E[i].setFace(this.F[fi]);
	  this.E[i].setCCWEdges(this.E[pei], this.E[nei]);
  }
  
  setVertex(i, coords) {
	  this.V[i].x = coords[0];
	  this.V[i].y = coords[1];
	  this.V[i].z = coords[2];
	  this.minVertexVal = Math.min(coords[0], coords[1], coords[2], this.minVertexVal);
	  this.maxVertexVal = Math.max(coords[0], coords[1], coords[2], this.maxVertexVal);
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
  
  normalizeVertices() {
	  var range = this.maxVertexVal - this.minVertexVal;
	  for (var i = 0; i < this.V.length; i++) {
		  this.V[i].x = ((this.V[i].x - this.minVertexVal) / range - 0.5) * 2;
		  this.V[i].y = ((this.V[i].y - this.minVertexVal) / range - 0.5) * 2;
		  this.V[i].z = ((this.V[i].z - this.minVertexVal) / range - 0.5) * 2;
	  }
  }
  
  decimate(k) {
	  //
  }
}