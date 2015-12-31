"use strict";

var canvas;
var ctx;
var maze;

var debug_level = 3;

// level - type
// 0 - error
// 1 - warning
// 2 - statistics/diagnostics
// 3 - dev messages
function debug(message, level) {
	if (level > debug_level)
		return;

	switch (level) {
		case 0:
			console.error(message);
			break;
		case 1:
			console.warn(message);
			break;
		default:
			if (message.join === undefined) {
				console.log("LOG (" + level + "): " + message);
			} else {
				console.log("LOG (" + level + "): [" + message.join(', ') + "]");
			}
	}
}

function generate() {
	var columns = Number(document.getElementById("columns").value);
	var rows = Number(document.getElementById("rows").value);

	window.clearInterval(maze.intervalID);

	maze = new Maze(columns, rows);
	//maze.drawTileBuffer();
	maze.generateDepthFirst();
}

function solve() {	
	window.clearInterval(maze.intervalID);

	maze.pathBuffer = new Array;
	maze.solverPath = new Array;

	maze.solveBreadthFirst();
}

function init() {
	canvas = document.getElementById("canvas");
	ctx = canvas.getContext("2d");

	maze = new Maze(100, 100);
	//maze.drawGrid();
	//maze.paintTile(0, 0, 'green');
	maze.drawTileBuffer();

	//init_grid(10, 10, 2);
	//paint_tile(10, 10, 2, 0, 0, 'green');
}

function Maze(M, N) {
	this.M = M;
	this.N = N;
	this.line_thickness = 2;

	this.wallBuffer = new Uint8Array(this.M*(this.M+1) + this.N*(this.N+1));
	this.tileBuffer = new Uint8Array(this.M*this.N);
	this.pathBuffer = new Array;
	this.solverPath = new Array;
	this.drawDelay = 5;

	this.last_current = new Array;
	this.current = new Array;
	this.start = [0, 0];
	this.end = [this.M-1, this.N-1];
}

Maze.prototype.solveBreadthFirst = function() {
	this.tileBuffer.fill(1);
	this.tileBuffer[this.start[0] + this.start[1]*maze.M] = 3;
	this.pathBuffer.push([this.start]);

	this.intervalID = window.setInterval(breadthFirstTick, this.drawDelay, this);
}

function breadthFirstTick(maze) {
	debug("Breadth first tick ------", 3);

	var i;

	console.log(maze.pathBuffer);

	var path = maze.pathBuffer.shift();

	console.log(path);

	var tile = path[path.length-1];

	console.log(tile);

	var dir = [[-1,0],[1,0],[0,-1],[0,1]];

	for (i=0; i<dir.length; i++) {
		var new_tile = [tile[0]+dir[i][0], tile[1]+dir[i][1]];

		console.log(new_tile);

		if (maze.getWall(tile, dir[i]) == 1 && maze.tileBuffer[new_tile[0] + new_tile[1]*maze.M] == 1) {			
			maze.tileBuffer[new_tile[0] + new_tile[1]*maze.M] = 4;

			maze.paintTile(new_tile[0], new_tile[1], 'gray');

			var new_path = path.slice(0);		
			new_path.push(new_tile);

			console.log(new_path);
			console.log(path);

			if (new_tile[0] == maze.end[0] && new_tile[1] == maze.end[1]) {
				window.clearInterval(maze.intervalID);

				maze.solverPath = new_path;
				maze.drawPath();

				break;
			}

			maze.pathBuffer.push(new_path);
		}
	}

	debug("End tick ------", 3);
}

Maze.prototype.drawPath = function(path) {
	var i;

	this.clear();

	for (i=0; i<this.solverPath.length; i++) {
		var tile = this.solverPath[i];
		if (tile[0] == this.start[0] && tile[1] == this.start[1])
			this.paintTile(tile[0], tile[1], 'orange');
		else if (tile[0] == this.end[0] && tile[1] == this.end[1])
			this.paintTile(tile[0], tile[1], 'red');
		else
			this.paintTile(tile[0], tile[1], 'gray');

	}
}

Maze.prototype.generateDepthFirst = function() {

	this.wallBuffer.fill(0);
	this.tileBuffer.fill(0);

	// TODO: randomly select start/end positions

	this.current[0] = this.start[0];
	this.current[1] = this.start[1];

	this.tileBuffer[this.start[0] + this.start[1]*this.M] = 3;
	this.tileBuffer[this.end[0] + this.end[1]*this.M] = 0;

	this.not_visited_tiles = this.M*this.N - 1;

	this.clear();
	this.drawTileBuffer();

	this.intervalID = window.setInterval(depthFirstTick, this.drawDelay, this);
}

function depthFirstTick(maze) {
	debug("Depth first tick ------", 3);
	debug(maze.current, 3);
	debug(maze.last_current, 3);
	//console.log(maze.tileBuffer);

	var current = maze.current;

	// stuck
	if (maze.last_current[0] == maze.current[0] && maze.last_current[1] == maze.current[1]) {
		var i, j;

		debug("STUCK", 3);	

		for (i=0; i<maze.M; i++) {
			for (j=0; j<maze.N; j++) {	
				if (maze.tileBuffer[i+j*maze.M] == 1) {
					debug([i, j], 3);
					current = [i,j];
					break;
				}
			}
		}
	}

	var possible_directions = new Array;

	if (current[0] != 0 && maze.tileBuffer[current[0]-1 + current[1]*maze.M] == 0)
		possible_directions.push([-1, 0]);

	if (current[0] != (maze.M-1) && maze.tileBuffer[current[0]+1 + current[1]*maze.M] == 0)
		possible_directions.push([1, 0]);

	if (current[1] != 0 && maze.tileBuffer[current[0] + (current[1]-1)*maze.M] == 0)
		possible_directions.push([0, -1]);		

	if (current[1] != (maze.N-1) && maze.tileBuffer[current[0] + (current[1]+1)*maze.M] == 0)
		possible_directions.push([0, 1]);

	if (Math.random() > 0.95) {
		var possible_Walls = new Array;

		if (current[0] != 0)
			possible_Walls.push([-1, 0]);

		if (current[0] != (maze.M-1))
			possible_Walls.push([1, 0]);

		if (current[1] != 0)
			possible_Walls.push([0, -1]);		

		if (current[1] != (maze.N-1))
			possible_Walls.push([0, 1]);

		var ind = Math.floor(Math.random()*possible_Walls.length);

		maze.setWall(current, possible_Walls[ind], 1);
	}

	if (possible_directions.length == 0) {
		if (maze.tileBuffer[current[0] + current[1]*maze.M] == 1) 
			maze.tileBuffer[current[0] + current[1]*maze.M] = 2;

		maze.last_current[0] = current[0];
		maze.last_current[1] = current[1];

		if (current[0] != 0 && (maze.tileBuffer[current[0]-1 + current[1]*maze.M] == 1 || maze.tileBuffer[current[0]-1 + current[1]*maze.M] == 3) && maze.getWall(current, [-1,0]) == 1) {
			current[0] -= 1;
		} else if (current[0] != maze.M && (maze.tileBuffer[current[0]+1 + current[1]*maze.M] == 1 || maze.tileBuffer[current[0]+1 + current[1]*maze.M] == 3)  && maze.getWall(current, [1,0]) == 1) {
			current[0] += 1;
		} else if (current[1] != 0 && (maze.tileBuffer[current[0] + (current[1]-1)*maze.M] == 1 || maze.tileBuffer[current[0] + (current[1]-1)*maze.M] == 3) && maze.getWall(current, [0,-1]) == 1) {
			current[1] -= 1;
		} else if (current[1] != maze.N && (maze.tileBuffer[current[0] + (current[1]+1)*maze.M] == 1 || maze.tileBuffer[current[0] + (current[1]+1)*maze.M] == 3) && maze.getWall(current, [0,1]) == 1) {
			current[1] += 1;
		}

		maze.current = current;		
		maze.drawTileBuffer();

		return;
	}

	var ind = Math.floor(Math.random()*possible_directions.length);

	maze.setWall(current, possible_directions[ind], 1);

	maze.last_current[0] = current[0];
	maze.last_current[1] = current[1];

	current[0] += possible_directions[ind][0];
	current[1] += possible_directions[ind][1];

	if (maze.tileBuffer[current[0] + current[1]*maze.M] == 0)
		maze.tileBuffer[current[0] + current[1]*maze.M] = 1;

	maze.not_visited_tiles -= 1;

	maze.current = current;
	maze.drawTileBuffer();

	if (maze.not_visited_tiles == 0) {
		console.log("CLEAR");
		window.clearInterval(maze.intervalID);

		maze.clear();
		maze.paintTile(maze.start[0], maze.start[1],'orange');
		maze.paintTile(maze.end[0], maze.end[1],'red');
	}

	debug("End tick ------", 3);

}

Maze.prototype.drawWallBuffer = function() {
	var i, j;

	var dx = Math.floor((canvas.width - this.line_thickness)/this.M);
	var dy = Math.floor((canvas.height - this.line_thickness)/this.N);

	ctx.fillStyle = 'black';

	// horizontal walls
	for (i=0; i<this.M; i++) {
		for (j=0; j<this.N+1; j++) {
			if (this.wallBuffer[i+j*this.M] == 0)
				ctx.fillRect(i*dx, j*dy, dx+this.line_thickness, this.line_thickness);
		}
	}

	var offset = (this.N+1)*this.M;

	// vertical walls
	for (i=0; i<this.M+1; i++) {
		for (j=0; j<this.N; j++) {
			if (this.wallBuffer[i+j*(this.M+1) + offset] == 0) {				
				ctx.fillRect(i*dx, j*dy, this.line_thickness, dy);
			}
		}
	}
}

Maze.prototype.setWall = function(tile, dir, value) {
	var index;

	var offset = (this.N+1)*this.M;

	// vertical wall
	if (dir[0] != 0) {
		if (dir[0] < 0) // left wall
			index = tile[0] + tile[1]*(this.M+1) + offset;
		else			// right wall
			index = tile[0] + tile[1]*(this.M+1) + offset + 1;
	} else {	// horizontal wall
		if (dir[1] < 0) // top wall
			index = tile[0] + tile[1]*this.M;
		else			// bottom wall
			index = tile[0] + (tile[1]+1)*this.M;
	}

	this.wallBuffer[index] = value;
}

Maze.prototype.getWall = function(tile, dir) {
	var index;

	var offset = (this.N+1)*this.M;

	// vertical wall
	if (dir[0] != 0) {
		if (dir[0] < 0) // left wall
			index = tile[0] + tile[1]*(this.M+1) + offset;
		else			// right wall
			index = tile[0] + tile[1]*(this.M+1) + offset + 1;
	} else {	// horizontal wall
		if (dir[1] < 0) // top wall
			index = tile[0] + tile[1]*this.M;
		else			// bottom wall
			index = tile[0] + (tile[1]+1)*this.M;
	}

	return this.wallBuffer[index];
}

Maze.prototype.drawTileBuffer = function() {
	this.clear();

	var i, j;

	var tile_val;	

	for (i=0; i<this.M; i++) {
		for (j=0; j<this.N; j++) {
			tile_val = this.tileBuffer[i+j*this.M];

			switch (tile_val) {			
				case 1:					
					this.paintTile(i, j, 'blue');
					break;
				case 2:
					this.paintTile(i, j, 'white');
					break;
				case 3:
					this.paintTile(i, j, 'orange');
					break;
				case 4:
					this.paintTile(i, j, 'gray');
					break;
				default:
					this.paintTile(i, j, 'black');
			}

		}
	}

	if (this.current !== undefined)
		this.paintTile(this.current[0], this.current[1], 'red');
}

Maze.prototype.clear = function() {
	ctx.fillStyle = 'white';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	
	this.drawWallBuffer();
}

Maze.prototype.drawGrid = function() {
	var i,j;

	var dx = Math.floor((canvas.width - this.line_thickness)/this.M);
	var dy = Math.floor((canvas.height - this.line_thickness)/this.N);

	var width = this.M*dx;
	var height = this.N*dy;

	debug([dx, dy], 3);

	ctx.fillStyle = 'black';

	for (i=0; i<=this.M; i++) {
		debug([i*dx, 0, this.line_thickness, height], 3);
		ctx.fillRect(i*dx, 0, this.line_thickness, height);
	}

	for (j=0; j<=this.N; j++) {
		debug([0, j*dy, width, this.line_thickness], 3);
		ctx.fillRect(0, j*dy, width + this.line_thickness, this.line_thickness);
	}
}

Maze.prototype.paintTile = function(x, y, color) {
	if (x > this.M-1 || y > this.N-1) {
		debug("Attempting to paint a tile out of bounds", 1);
		return;
	}

	var size = this.line_thickness;

	var dx = Math.floor((canvas.width - size)/this.M);
	var dy = Math.floor((canvas.height - size)/this.N);

	ctx.fillStyle = color;
	ctx.fillRect(x*dx+size, y*dy+size, dx-size, dy-size);
}