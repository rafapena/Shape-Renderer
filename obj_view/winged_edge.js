class Edge {
  constructor(index) {
	  this.index = index;
	  this.active = true;
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
  linkVertices(src, dest) {
	  this.srcVertex = src;
	  this.destVertex = dest;
  }
  setFace(left) {
	  this.face = left;
	  this.face.edge = this;
  }
  setCCWEdges(prev, next) {
	  this.ccwPrev = prev;
	  this.ccwNext = next;
  }
}

class Vertex {
  constructor(index) {
	  this.index = index;
	  this.active = true;
	  this.edges = [];
	  this.x = 0;
	  this.y = 0;
	  this.z = 0;
	  this.normX = 0;
	  this.normY = 0;
	  this.normZ = 0;
	  this.Q = [[0,0,0,0], [0,0,0,0], [0,0,0,0], [0,0,0,0]];
  }
  computeNormal() {
	  this.normX = 0; 
	  this.normY = 0;
	  this.normZ = 0;
	  var start = this.edges[0];
	  var e = start;
	  var iter = 0;
	  var str = "";
	  do {
		  str += getEdge(e);
		  if (iter++ > this.edges.length*2) alert("VERTEX v-" + this.edges.length + " INFINITE LOOP\n" + str);
		  this.normX += e.face.normX;
		  this.normY += e.face.normY;
		  this.normZ += e.face.normZ;
		  e = e.ccwPrev.oppEdge;
	  } while (e.index != start.index);
  }
}

class Face {
  constructor(index) {
	  this.index = index;
	  this.active = true;
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
	  var iter = 0;
	  var str = "";
	  do {
		  str += getEdge(e);
		  if (iter++ > 6) alert("FACE INFINITE LOOP\n" + str);
		  this.normX += (e.srcVertex.y - e.destVertex.y) * (e.srcVertex.z + e.destVertex.z);
		  this.normY += (e.srcVertex.z - e.destVertex.z) * (e.srcVertex.x + e.destVertex.x);
		  this.normZ += (e.srcVertex.x - e.destVertex.x) * (e.srcVertex.y + e.destVertex.y);
		  e = e.ccwNext;
	  } while (e.index != start.index);
  }
  getInfo() {
	  var str = "FACE " + this.index + ":  ( ";
	  var start = this.edge;
	  var e = start;
	  do {
		  str += e.srcVertex.index + " ";
		  e = e.ccwNext;
	  } while (e.index != start.index);
	  return str + ")\n";
  }
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// -- Main data structure --
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class WingedEdge {
  
  constructor() {
	  this.setup();
  }
  
  setup() {
	  this.E = [];
	  this.V = [];
	  this.F = [];
	  this.minVertexVal = Infinity;
	  this.maxVertexVal = -Infinity;
  }
  
  setupTables(v, f) {
	  this.setup();
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
  
  
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /// -- Decimation algorithm --
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  
  decimate(k) {
	  var target = this.V.length - k;
	  if (target < 3) {
		  this.E = [];
		  this.V = [];
		  this.F = [];
		  return;
	  }
	  while (this.V.length > target) {
		  this.decimateOne();
	  }
  }
  
  decimateOne() {
	  // Get edge data of the source (to-be-removed) vertex
	  var res = this.computeSimplification();
	  var minE = this.E[res[0]];
	  var destV = this.V[minE.destVertex.index];
	  
	  // Simply get rid of the vertex if it's valence 3
	  if (minE.srcVertex.edges.length == 3) {
		  this.destroyValence3Vertex(minE.srcVertex);
		  this.updateAllKeys();
		  this.recomputeNormals(destV);
		  return;
	  }
	  
	  // Group up the edges surrounding the to-be-deleted vertex in CCW order, starting at minE
	  var eList = [];
	  var start = minE;
	  var e = start;
	  do {
		  // Just delete the valence-3 vertex instead
		  if (this.destroyValence3Vertex(e.destVertex)) {
			  this.updateAllKeys();
			  return;
		  }
		  eList.push(e);
		  e = e.ccwPrev.oppEdge;
	  } while (e.index != start.index);
	  
	  // Do not decimate if destV is linked to a vertex that was previously linked to the to-be-removed vertex
	  for (var i = 2; i < eList.length-1; i++) {
		  if (this.findEdgeIdx(eList[i].destVertex, destV) >= 0) return;
	  }
	  
	  // Remove edges from the 3 vertices next to the to-be-removed vertex and edge minE
	  var v1 = eList[1].destVertex;
	  var v0 = eList[eList.length - 1].destVertex;
	  v0.edges.splice(this.findEdgeIdx(v0, minE.srcVertex), 1);
	  destV.edges.splice(this.findEdgeIdx(destV, minE.srcVertex), 1);
	  v1.edges.splice(this.findEdgeIdx(v1, minE.srcVertex), 1);
	  
	  // Mark for deletion (Note: minE == eList[0])
	  eList[0].active = false;
	  eList[0].oppEdge.active = false;
	  eList[1].active = false;
	  eList[1].oppEdge.active = false;
	  eList[eList.length-1].active = false;
	  eList[eList.length-1].oppEdge.active = false;
	  minE.face.active = false;
	  minE.oppEdge.face.active = false;
	  minE.srcVertex.active = false;
	  
	  // Link new next edge for destV
	  var E1 = minE.ccwNext;
	  var pE1 = eList[2].oppEdge;
	  var nE1 = eList[2].oppEdge.ccwPrev;
	  E1.setFace(pE1.face);
	  pE1.ccwNext = E1;
	  nE1.ccwPrev = E1;
	  E1.ccwNext = nE1;
	  E1.ccwPrev = pE1;
	  
	  // Link new previous edge for destV
	  var E0 = minE.oppEdge.ccwPrev;
	  var pE0 = eList[eList.length-2].ccwNext;
	  var nE0 = eList[eList.length-2];
	  E0.setFace(nE0.face);
	  pE0.ccwNext = E0;
	  nE0.ccwPrev = E0;
	  E0.ccwNext = nE0;
	  E0.ccwPrev = pE0;
	  
	  // Relink the vertex of each edge
	  for (var i = 2; i < eList.length-1; i++) {
		  var e = eList[i].oppEdge;
		  e.destVertex = destV;
		  e.oppEdge.srcVertex = destV;
		  destV.edges.push(e.oppEdge);
	  }
	  
	  // Update list keys then set destination vertex to the location between the deleted source vertex and itself
	  this.updateAllKeys();
	  var v1 = res[1];
	  destV.x = v1.x;
	  destV.y = v1.y;
	  destV.z = v1.z;
	  this.recomputeNormals(destV);
  }
  
  
  // Use multiple choice to choose vertex and edge to remove
  computeSimplification() {
	  var min_delta = Infinity;
	  var min_delta_index = 0;
	  var randomPoolSize = 100;
	  var newV = new Vertex(this.V.length);
	  
	  // Multiple choice: Get quadrics first
	  for (var i = 0; i < randomPoolSize; i++) {
		  var e = this.E[Math.floor(Math.random() * this.E.length)];
		  var q1 = this.computeQuadricError(e.srcVertex);
		  var q2 = this.computeQuadricError(e.destVertex);
		  var q = this.addQuadrics(q1, q2);
		  
		  // Get vertex destination
		  var tempX = (e.srcVertex.x + e.destVertex.x) / 2;
		  var tempY = (e.srcVertex.y + e.destVertex.y) / 2;
		  var tempZ = (e.srcVertex.z + e.destVertex.z) / 2;
		  var delta = this.getVtQV(tempX, tempY, tempZ, q);
		  if (delta < min_delta) {
			  min_delta = delta;
			  min_delta_index = e.index;
			  newV.x = tempX;
			  newV.y = tempY;
			  newV.z = tempZ;
			  newV.Q = q;
		  }
	  }
	  return [min_delta_index, newV];
  }
  
  computeQuadricError(v) {
	  var Q = [[0,0,0,0], [0,0,0,0], [0,0,0,0], [0,0,0,0]];
	  for (var i = 0; i < v.edges.length; i++) {
		  var a = v.edges[i].face.normX;
		  var b = v.edges[i].face.normY;
		  var c = v.edges[i].face.normZ;
		  var aa = a * a;
		  var bb = b * b;
		  var cc = c * c;
		  var ab = a * b;
		  var ac = a * c;
		  var bc = b * c;
		  var m = [
			[aa, ab, ac, a],
			[ab, bb, bc, b],
			[ac, bc, cc, c],
			[a,  b,  c,  1]
		  ];
		  for (var i0; i0 < 4; i0++) {
			  for (var j0; j0 < 4; j0++) {
				  Q[i0][j0] += m[i0][j0];
			  }
		  }
	  }
	  return Q;
  }
  
  addQuadrics(q1, q2) {
	  return [
		[q1[0][0]+q2[0][0], q1[0][1]+q2[0][1], q1[0][2]+q2[0][2], q1[0][3]+q2[0][3]],
		[q1[1][0]+q2[1][0], q1[1][1]+q2[1][1], q1[1][2]+q2[1][2], q1[1][3]+q2[1][3]],
		[q1[2][0]+q2[2][0], q1[2][1]+q2[2][1], q1[2][2]+q2[2][2], q1[2][3]+q2[2][3]],
		[q1[3][0]+q2[3][0], q1[3][1]+q2[3][1], q1[3][2]+q2[3][2], q1[3][3]+q2[3][3]]
	  ]
  }
  
  getVtQV(x, y, z, q) {
	  var vtQ = [
		x*q[0][0] + y*q[1][0] + z*q[2][0] + q[3][0],
		x*q[0][1] + y*q[1][1] + z*q[2][1] + q[3][1],
		x*q[0][2] + y*q[1][2] + z*q[2][2] + q[3][2],
		x*q[0][3] + y*q[1][3] + z*q[2][3] + q[3][3]
	  ];
	  return x*vtQ[0] + y*vtQ[1] + z*vtQ[2] + vtQ[3];
  }
  
  // Remove the vertex and its 3 edges
  destroyValence3Vertex(v) {
	  if (v.edges.length != 3) return false;
	  var eSaved = [];
	  v.active = false;
	  var start = v.edges[0];
	  var e = start;
	  do {
		  eSaved.push(e.ccwNext);
		  var destV = e.destVertex;
		  destV.edges.splice(this.findEdgeIdx(destV, v), 1);	// Unlink from the edges between v and the surrounding vertices
		  if (e.index != start.index) e.face.active = false;	// Do not delete the 1st face: remaining edges must link to a face
		  e.active = false;
		  e.oppEdge.active = false;
		  e = e.ccwPrev.oppEdge;
	  } while (e.index != start.index);
	  this.uniteEdges(eSaved[0], eSaved[1], eSaved[2], v.edges[0].face);
	  return true;
  }

  // Get the entry i from v1's edges
  findEdgeIdx(v1, v2) {
	  for (var i = 0; i < v1.edges.length; i++) {
		  var e = v1.edges[i];
		  if (e.active && e.destVertex.index == v2.index) return i;
	  }
	  return -1;
  }

  // Note: function will not link srcVertex and destVertex - must be done manually
  uniteEdges(e1, e2, e3, f) {
	  var eList = [e1, e2, e3];
	  var t = [2, 0, 1, 2, 0];
	  for (var i = 0; i < 3; i++) {
		  var pEdge = eList[t[i]];
		  var edge = eList[t[i+1]];
		  var nEdge = eList[t[i+2]];
		  edge.setCCWEdges(pEdge, nEdge);
		  edge.setFace(f);
	  }
  }

  updateAllKeys() {
	  for (var i = 0; i < this.F.length; i++) {
		  this.F[i].index = i;
		  if (this.F[i].active) continue;
		  delete this.F[i];
		  this.F.splice(i--, 1);
	  }
	  for (var i = 0; i < this.E.length; i++) {
		  this.E[i].index = i;
		  if (this.E[i].active) continue;
		  delete this.E[i];
		  this.E.splice(i--, 1);
	  }
	  for (var i = 0; i < this.V.length; i++) {
		  this.V[i].index = i;
		  if (this.V[i].active) continue;
		  delete this.V[i];
		  this.V.splice(i--, 1);
	  }
  }
  
  recomputeNormals(v) {
	  for (var i = 0; i < v.edges.length; i++) v.edges[i].face.computeNormal();
	  v.computeNormal();
  }
  
  // DEBUG
  displayEntireMesh(message) {
	  var str = message + "\n";
	  for (var i = 0; i < this.V.length; i++) {
		  str += this.V[i].index + " ==> ";
		  for (var j = 0; j < this.V[i].edges.length; j++) {
			  str += this.V[i].edges[j].destVertex.index + ", ";
		  }
		  str += "\n";
	  }
	  alert(str);
  }
}

// DEBUG
function getEdge(e) {
	return "(" + e.srcVertex.index + " " + e.destVertex.index + ") ";
}