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
		  str += e.index + " ";
		  if (iter++ > 30) alert("VERTEX v-" + this.edges.length + " INFINITE LOOP: " + str);
		  
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
		  str += e.index + " ";
		  if (iter++ > 30) alert("FACE INFINITE LOOP: " + str);
		  
		  this.normX += (e.srcVertex.y - e.destVertex.y) * (e.srcVertex.z + e.destVertex.z);
		  this.normY += (e.srcVertex.z - e.destVertex.z) * (e.srcVertex.x + e.destVertex.x);
		  this.normZ += (e.srcVertex.x - e.destVertex.x) * (e.srcVertex.y + e.destVertex.y);
		  e = e.ccwNext;
	  } while (e.index != start.index);
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
	  this.computeFaceNormals();
	  this.computeVertexNormals();
	  for (var i = 0; i < k; i++) {
		  this.decimateOne();
		  this.computeFaceNormals();
		  this.computeVertexNormals();
	  }
  }
  
  decimateOne() {
	  // Get edge data of the source (to-be-removed) vertex
	  var res = this.computeSimplification();
	  var minE = this.E[res[0]];
	  var destV = this.V[minE.destVertex.index];
	  var E0, E1;
	  
	  // Set up edge linking data
	  // Get rid of valence 3 vertices connecting to both the to-be-deleted vertex and destV
	  var str0 = "";
	  var str1 = "";
	  do {
		  E0 = this.E[minE.oppEdge.ccwPrev.index];
		  var dv = this.destroyValence3Vertex(E0.srcVertex.index);
		  //if (str0.length > 0) alert("VALENCE-3 VERTEX REMOVED (CW): " + str0 + " " + E0.index);
		  //str0 += E0.index;
	  } while (dv);
	  do {
		  E1 = this.E[minE.ccwNext.index];
		  var dv = this.destroyValence3Vertex(E1.destVertex.index);
		  //if (str1.length > 0) alert("VALENCE-3 VERTEX REMOVED (CCW): " + str1 + " " + E1.index);
		  //str1 += E1.index;
	  } while (dv);
	  
	  // Declare the new previous and next edges for both E0 and E1
	  var prevE0 = this.E[minE.oppEdge.ccwNext.oppEdge.ccwPrev.index];
	  var nextE0 = this.E[minE.oppEdge.ccwNext.oppEdge.ccwNext.index];
	  var prevE1 = this.E[minE.ccwPrev.oppEdge.ccwPrev.index];
	  var nextE1 = this.E[minE.ccwPrev.oppEdge.ccwNext.index];
	  
	  // Update destVertex's previous edge
	  nextE0.srcVertex = destV;
	  nextE0.oppEdge.destVertex = destV;
	  destV.edges.push(nextE0);
	  E0.setFace(nextE0.face);
	  E0.setCCWEdges(prevE0, nextE0);
	  prevE0.ccwNext = E0;
	  nextE0.ccwPrev = E0;
	  
	  // Update destVertex's next edge
	  prevE1.destVertex = destV;
	  prevE1.oppEdge.srcVertex = destV;
	  destV.edges.push(prevE1.oppEdge);
	  E1.setFace(prevE1.face);
	  E1.setCCWEdges(prevE1, nextE1);
	  prevE1.ccwNext = E1;
	  nextE1.ccwPrev = E1;
	  
	  // Setup deletion for to-be-removed faces, vertices, and edges
	  this.E[minE.index].active = false;
	  this.E[minE.oppEdge.index].active = false;
	  this.E[minE.ccwPrev.index].active = false;
	  this.E[minE.ccwPrev.oppEdge.index].active = false;
	  this.E[minE.oppEdge.ccwNext.index].active = false;
	  this.E[minE.oppEdge.ccwNext.oppEdge.index].active = false;
	  this.F[minE.face.index].active = false;
	  this.F[minE.oppEdge.face.index].active = false;
	  this.V[minE.srcVertex.index].active = false;
	  this.unlinkDeletedEdges([E0.srcVertex, destV, E1.destVertex]);
	  
	  // Update list keys
	  this.updateFaceListKeys();
	  this.updateEdgeListKeys(destV);
	  this.updateVertexListKeys();
	  
	  // Set destination vertex to the location between the deleted source vertex and itself
	  var v1 = res[1];
	  destV.x = v1.x;
	  destV.y = v1.y;
	  destV.z = v1.z;
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
  
  destroyValence3Vertex(vIdx) {
	  var v = this.V[vIdx];
	  if (v.edges.length != 3) return false;
	  
	  // Set up deletion for the center edge and its 3 vertices
	  var e = [];
	  this.V[vIdx].active = false;
	  for (var i = 0; i < 3; i++) {
		  e.push(this.E[v.edges[i].ccwNext.index]);
		  this.E[v.edges[i].index].active = false;
		  this.E[v.edges[i].oppEdge.index].active = false;
		  if (i > 0) this.F[e[i].face.index].active = false;
	  }
	  
	  // Attach edges
	  var t = [2, 0, 1, 2, 0];
	  for (var i = 0; i < 3; i++) {
		  this.E[e[i].index].linkVertices(e[i].srcVertex, e[t[i+2]].srcVertex);
		  this.E[e[i].index].setFace(e[0].face);
		  this.E[e[i].index].setCCWEdges(e[t[i]], e[t[i+2]]);
	  }
	  var de = [ this.V[e[0].srcVertex.index], this.V[e[1].srcVertex.index], this.V[e[2].srcVertex.index] ];
	  this.unlinkDeletedEdges(de);
	  return true;
  }
  
  unlinkDeletedEdges(vertexList) {
	  for (var i = 0; i < vertexList.length; i++) {
		  for (var j = 0; j < vertexList[i].edges.length; j++) {
			  if (vertexList[i].edges[j].active) continue;
			  vertexList[i].edges.splice(j, 1);
			  break;
		  }
	  }
  }

  updateFaceListKeys() {
	  for (var i = 0; i < this.F.length; i++) {
		  if (!this.F[i].active) {
			  delete this.F[i];
			  this.F.splice(i--, 1);
		  } else {
			  this.F[i].index = i;
		  }
	  }
  }
  
  updateEdgeListKeys(targetV) {
	  for (var i = 0; i < this.E.length; i++) {
		  if (!this.E[i].active) {
			  delete this.E[i];
			  this.E.splice(i--, 1);
		  } else {
			  this.E[i].index = i;
			  if (!targetV) continue;
			  // Relink dangling edges to the target vertex targetV
			  if (!this.E[i].srcVertex.active) {
				  this.E[i].srcVertex = targetV;
				  targetV.edges.push(this.E[i]);
			  }
			  if (!this.E[i].destVertex.active) {
				  this.E[i].destVertex = targetV;
			  }
		  }
	  }
  }
  
  updateVertexListKeys() {
	  for (var i = 0; i < this.V.length; i++) {
		  if (!this.V[i].active) {
			  delete this.V[i];
			  this.V.splice(i--, 1);
		  } else {
			  this.V[i].index = i;
		  }
	  }
  }
  
  
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /// -- DEBUG --
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  
  printEdges(pe, ce, ne) {
	  var str = "Base: " + ce.index + " --> " + ne.index + " --> " + pe.index + "\n";
	  var start = ce;
	  var e = start;
	  do {
		  str += e.index + " ";
		  e = e.ccwNext;
	  } while (e.index != start.index);
	  str += "\n";
	  var e = start;
	  do {
		  str += e.index + " ";
		  e = e.ccwPrev;
	  } while (e.index != start.index);
	  alert(str);
  }
  
  printVertexEdges(sv, v, dv, sre, re, dre) {
	  var str = "";
	  if (sre) str = "Predicted removal: " + sre.index + " " + re.index + " " + dre.index;
	  str += "\nPList: ";
	  for (var i = 0; i < sv.edges.length; i++) {
		  str += sv.edges[i].index + " ";
	  }
	  str += "\nCList: ";
	  for (var i = 0; i < v.edges.length; i++) {
		  str += v.edges[i].index + " ";
	  }
	  str += "\nNList: ";
	  for (var i = 0; i < dv.edges.length; i++) {
		  str += dv.edges[i].index + " ";
	  }
	  alert(str);
  }
}