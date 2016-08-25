Game.prototype.init = function(){
	this.colours = ["#0080ff", "#008000", "#ff0000", "#df0000", "#bf0000", "#9f0000", "#800000", "#600000"];
	this.grid = [];
	this.grid_w = 32; this.grid_h = 20;
	this.revealed = 0; this.flagged = 0;
	this.scene = 0; // 0 = set-up, 1 = start, 2 = playing, 3 = won, 4 = lost
	this.diff = 2; // 0 = easy, 1 = medium, 2 = hard
	this.clock_start = Date.now(); this.min = 0; this.sec = 0;
	
	//events
	this.canvas.oncontextmenu = function(e) { // stop the right click menu
		e.preventDefault(); e.stopPropagation();
		return false;
	}
	document.addEventListener("keydown", this.handle_keyhit.bind(this), false);
	this.canvas.addEventListener("mousedown", this.handle_click.bind(this), false);
	this.m_pos = {x: 0, y: 0};
}

Game.prototype.init_board = function(){
	var i, x, y, x2, y2;
	this.scene = 1;
	
	this.num_mines = Math.floor(this.grid_w*this.grid_h*(0.10+0.025*this.diff));
	this.revealed = 0; this.flagged = 0;
	this.tile_size = Math.min(Math.floor(this.width/this.grid_w), Math.floor((this.height-64)/this.grid_h));
	this.grid_x = Math.floor((this.width - this.grid_w*this.tile_size)/2);
	this.grid_y = 64+Math.floor((this.height-64)-this.grid_h*this.tile_size);
	
	this.grid = new Array(this.grid_w);
	for (x = 0; x < this.grid_w; x++){
		this.grid[x] = new Array(this.grid_h);
		for (y = 0; y < this.grid_h; y++){
			this.grid[x][y] = [0, 0]	//number on tile (-1 = mine), state (unrevealed, revealed, flagged)
		}
	}
	
	//distribute mines
	for (i = 0; i < this.num_mines; ){
		x = Math.floor(Math.random()*this.grid_w);
		y = Math.floor(Math.random()*this.grid_h);
		if (this.grid[x][y][0] > -1){
			i++;
			this.grid[x][y][0] = -1;
			for (x2 = -1; x2 <= 1; x2++){
				for (y2 = -1; y2 <= 1; y2++){
					if (x+x2 >= 0 && x+x2 < this.grid_w && y+y2 >= 0 && y+y2 < this.grid_h){
						if (this.grid[x+x2][y+y2][0] > -1)
							this.grid[x+x2][y+y2][0]++;
					}
				}
			}
		}
	}
}

Game.prototype.handle_keyhit = function(e){
	var key = e.which || e.keyCode;
	switch (key){
	case 27:
		this.scene = 0;
		break;
	case 32:
		e.preventDefault(); e.stopPropagation();
		if (this.scene === 1) {
			var temp = false, x, y;	//just check that there actually are blank spaces
			for (x = 0; x < this.grid_w; x++){
				for (y = 0; y < this.grid_h; y++){
					if (this.grid[x][y][0] === 0){
						temp = true;
						break;
					}
				}
				if (temp === true) break;
			}
			if (temp === true){
				while(true){
					x = Math.floor(Math.random()*this.grid_w);
					y = Math.floor(Math.random()*this.grid_h);
					if (this.grid[x][y][0] === 0){
						this.click_tile(x, y);
						break;
					}
				}
			}
		}
		break;
	case 82:
		if (this.scene > 1)	//are actually playing
			this.init_board();
		break;
	}
}

Game.prototype.handle_click = function(e){
	var rect = this.canvas.getBoundingClientRect();
	this.m_pos.x = Math.floor(e.clientX-rect.left);
	this.m_pos.y = Math.floor(e.clientY-rect.top);
	e.preventDefault(); e.stopPropagation();
	
	if (e.button == 0){	//left click
		switch (this.scene){
		case 0:
			if (this.mouseRectCollide(336, 542, 128, 32))	// start button
				this.init_board();
			else if (this.mouseRectCollide(32, 84, 180, 16)){	// easy preset
				this.grid_w = 10;
				this.grid_h = 10;
				this.diff = 0;
			}else if (this.mouseRectCollide(32, 108, 220, 16)){	// medium preset
				this.grid_w = 25;
				this.grid_h = 16;
				this.diff = 1;
			}else if (this.mouseRectCollide(32, 132, 180, 16)){	// hard preset
				this.grid_w = 32;
				this.grid_h = 20;
				this.diff = 2;
			}else if (this.mouseRectCollide(34, 214, 12, 12)){	// - width
				if (this.grid_w > 8) this.grid_w--;
			}else if (this.mouseRectCollide(70, 214, 12, 12)){	// + width
				if (this.grid_w < 32) this.grid_w++;
			}else if (this.mouseRectCollide(34, 310, 12, 12)){	// - height
				if (this.grid_h > 5) this.grid_h--;
			}else if (this.mouseRectCollide(70, 310, 12, 12)){	// + height
				if (this.grid_h < 20) this.grid_h++;
			}else if (this.mouseRectCollide(32, 404, 40, 16))	// easy
				this.diff = 0
			else if (this.mouseRectCollide(160, 404, 60, 16))	// medium
				this.diff = 1;
			else if (this.mouseRectCollide(288, 404, 40, 16))	// hard
				this.diff = 2;
			break;
		case 1: case 2:
			this.click_tile(Math.floor((this.m_pos.x - this.grid_x)/this.tile_size), Math.floor((this.m_pos.y - this.grid_y)/this.tile_size));
		}
	}else if (e.button == 2){	// right click
		if (this.scene === 1 || this.scene === 2){
			var x = Math.floor((this.m_pos.x - this.grid_x)/this.tile_size), y = Math.floor((this.m_pos.y - this.grid_y)/this.tile_size);
			if (this.grid[x][y][1] === 0){
				this.grid[x][y][1] = 2;
				this.flagged++;
			}else if (this.grid[x][y][1] === 2){
				this.grid[x][y][1] = 0;
				this.flagged--;
			}
		}
	}
}

Game.prototype.mouseRectCollide = function(x, y, w, h){
	return !(this.m_pos.x < x || this.m_pos.y < y || this.m_pos.x >= x+w || this.m_pos.y >= y+h);
}

Game.prototype.update = function(dt){
	var ctx = this.ctx, x, y;
	
	//background
	ctx.fillStyle = "#000000";
	ctx.fillRect(0, 0, this.width, this.height);
	
	if (this.scene === 0){	//setup
		//sliders
		ctx.beginPath();
		ctx.rect(336, 542, 128, 32);
		ctx.lineWidth = 4;
		ctx.strokeStyle = "#008000";
		ctx.stroke();
		ctx.fillStyle = "#00bf00";
		ctx.fill();
		
		//text
		ctx.beginPath();
		ctx.font = "Bold 24pt Courier";
		ctx.textAlign = "center";
		ctx.fillStyle = "#ffffff";
		ctx.fillText("Set-Up", 400, 32);
		ctx.fillText("START", 400, 568);
		ctx.font = "Bold 16pt Courier";
		ctx.textAlign = "left";
		ctx.fillText("Presets:", 16, 64);
		ctx.fillText("Width:", 16, 192);
		ctx.fillText("Height:", 16, 288);
		ctx.fillText("Difficulty:", 16, 384);
		
		//difficulty
		ctx.font = "Bold 12pt Courier";
		ctx.fillText("Easy (10x10, Easy)", 32, 96);
		ctx.fillText("Medium (25x16, Medium)", 32, 120);
		ctx.fillText("Hard (32x20, Hard)", 32, 144);
		ctx.textAlign = "center";
		ctx.fillText(this.grid_w, 58, 224);
		ctx.fillText(this.grid_h, 58, 320);
		ctx.textAlign = "left";
		ctx.fillStyle = this.diff === 0 ? "#ffffff" : "#bfbfbf";
		ctx.fillText("Easy", 32, 416);
		ctx.fillStyle = this.diff === 1 ? "#ffffff" : "#bfbfbf";
		ctx.fillText("Medium", 160, 416);
		ctx.fillStyle = this.diff === 2 ? "#ffffff" : "#bfbfbf";
		ctx.fillText("Hard", 288, 416);
		
		//grid size
		ctx.beginPath();
		ctx.moveTo(44, 214); ctx.lineTo(44, 226); ctx.lineTo(34, 220);
		ctx.fillStyle = this.grid_w > 8 ? "#ffffff" : "#808080";
		ctx.fill();
		ctx.beginPath();
		ctx.moveTo(72, 214); ctx.lineTo(72, 226); ctx.lineTo(82, 220);
		ctx.fillStyle = this.grid_w < 32 ? "#ffffff" : "#808080";
		ctx.fill();
		ctx.beginPath();
		ctx.moveTo(44, 310); ctx.lineTo(44, 322); ctx.lineTo(34, 316);
		ctx.fillStyle = this.grid_h > 5 ? "#ffffff" : "#808080";
		ctx.fill();
		ctx.beginPath();
		ctx.moveTo(72, 310);ctx.lineTo(72, 322);ctx.lineTo(82, 316);
		ctx.fillStyle = this.grid_h < 20 ? "#ffffff" : "#808080";
		ctx.fill();
	}else{
		//grid
		for (x = 0; x < this.grid_w; x++){
			for (y = 0; y < this.grid_h; y++){
				if (this.grid[x][y][1] === 1) { //revealed
					if (this.grid[x][y][0] === -1){	//mine
						ctx.beginPath();
						ctx.arc((x+0.5)*this.tile_size+this.grid_x, (y+0.5)*this.tile_size+this.grid_y, this.tile_size*0.3, 0, 2*Math.PI);
						ctx.fillStyle = "#ff0000";
						ctx.fill();
						ctx.lineWidth = 2;
						ctx.strokeStyle = "#800000";
						ctx.stroke();
					}else if (this.grid[x][y][0] > 0){	//number
						ctx.beginPath();
						ctx.font = "Bold "+(this.tile_size*0.4)+"pt Courier";
						ctx.textAlign = "center";
						ctx.fillStyle = this.colours[this.grid[x][y][0]-1];
						ctx.fillText(this.grid[x][y][0], (x+0.5)*this.tile_size+this.grid_x,(y+0.5)*this.tile_size+this.grid_y);
					}
				}else if (this.grid[x][y][1] === 2){ // flagged
					ctx.beginPath();
					ctx.moveTo((x+0.4)*this.tile_size+this.grid_x, (y+0.8)*this.tile_size+this.grid_y);
					ctx.lineTo((x+0.4)*this.tile_size+this.grid_x, (y+0.2)*this.tile_size+this.grid_y);
					ctx.lineTo((x+0.6)*this.tile_size+this.grid_x, (y+0.35)*this.tile_size+this.grid_y);
					ctx.lineTo((x+0.4)*this.tile_size+this.grid_x, (y+0.5)*this.tile_size+this.grid_y);
					ctx.fillStyle = "#ff0000";
					ctx.fill();
					ctx.lineWidth = 2;
					ctx.strokeStyle = "#ff0000";
					ctx.stroke();
				}else{
					ctx.beginPath();
					ctx.rect(x*this.tile_size+this.grid_x, y*this.tile_size+this.grid_y, this.tile_size, this.tile_size);
					ctx.lineWidth = 1;
					ctx.strokeStyle = "#808080";
					ctx.stroke();
				}
			}
		}
		ctx.beginPath();
		ctx.rect(this.grid_x, this.grid_y, this.grid_w*this.tile_size, this.grid_h*this.tile_size);
		ctx.lineWidth = 2;
		ctx.strokeStyle = "#808080";
		ctx.stroke();
		
		//the box at the top 
		ctx.beginPath();
		ctx.rect(0, 0, 800, 64);
		ctx.stroke();
		ctx.beginPath();
		ctx.font = "Bold 12pt Courier";
		ctx.textAlign = "left";
		ctx.fillStyle = "#ffffff";
		ctx.fillText("Tiles revealed: "+this.revealed, 4, 20);
		ctx.fillText("Tiles flagged: "+this.flagged+"/"+this.num_mines, 4, 36);
		if (this.scene < 3){
			this.min = 0;
			this.sec = 0;
			if (this.scene === 2){
				this.sec = Math.floor((Date.now()-this.clock_start)/1000);
				this.min = Math.floor(this.sec/60);
				this.sec %= 60;
			}
		}
		ctx.font = "Bold 20pt Courier";
		ctx.textAlign = "right";
		ctx.fillText(this.min+":"+"0".substring(this.sec >= 10)+this.sec, 796, 32);
		
		if (this.scene > 2){ //game completed
			ctx.font = "Bold 32pt Courier";
			ctx.textAlign = "center";
			ctx.fillStyle = "#ffffff";
			ctx.fillText(this.scene === 3 ? "You win!" : "You lost...", 400, 300);
			ctx.font = "Bold 20pt Courier";
			ctx.fillText("Hit R to reset", 400, 348);
			ctx.fillText("Or Esc to return to set-up", 400, 380);
		}
	}
}

Game.prototype.reveal_tile = function(x, y){
	if (x >= 0 && x < this.grid_w && y >= 0 && y < this.grid_h){
		if (this.grid[x][y][1] === 0){
			this.grid[x][y][1] = 1;
			this.revealed++;
			return true;
		}
	}
	return false;
}

Game.prototype.click_tile = function(x, y){
	if (x < 0 || x >= this.grid_w || y < 0 || y >= this.grid_h) return;
	
	if (this.grid[x][y][1] === 0){
		if (this.scene === 1){	//start timer
			this.scene = 2;
			this.clock_start = Date.now();
		}
		
		//reveal the tile
		this.grid[x][y][1] = 1;
		this.revealed++;
		
		//do extra things depending on the tile
		if (this.grid[x][y][0] === -1)	//mine
			this.scene = 4;
		else if (this.grid[x][y][0] === 0){	//blank
			var done = false, x, y, x2, y2;
			while (done === false){
				done = true;
				for (x = 0; x < this.grid_w; x++){
					for (y = 0; y < this.grid_h; y++){
						if (this.grid[x][y][0] === 0 && this.grid[x][y][1] === 1){
							for (x2 = -1; x2 <= 1; x2++){
								for (y2 = -1; y2 <= 1; y2++){
									if (this.reveal_tile(x+x2, y+y2) === true) done = false;
								}
							}
						}
					}
				}
			}
		}
		
		//check win
		if (this.scene === 2 && this.revealed+this.num_mines === this.grid_w*this.grid_h)
			this.scene = 3;
	}
}

window.onload = function(){
	game = new Game();
}
