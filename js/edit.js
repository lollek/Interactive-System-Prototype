var blueprint = {};

blueprint.canvas = undefined;
blueprint.context = undefined;

blueprint.house = undefined;
blueprint.walls = [];

blueprint.closestWall = {
		type: undefined,
		angle: undefined,
		room: null,
		distance: Infinity
};

blueprint.isMovingWall = false;
blueprint.MINWALLOFFSET = 50;

blueprint.INNERWALL = 0;
blueprint.OUTERWALL = 1;

blueprint.LEFT = 0;
blueprint.RIGHT = 1;
blueprint.BOTTOM = 2;
blueprint.TOP = 3;

blueprint.HORIZONTAL = 0;
blueprint.VERTICAL = 1;

blueprint.checkClosestWall = function(x, y) {
	var isInHouseX = false;
	var isInHouseY = false;
    var distance = Infinity;
    var type;
    var angle;
    var room;

    if (blueprint.house.x <= x && x <= blueprint.house.x + blueprint.house.width) {
    	isInHouseX = true;
        var wallTopDistance = Math.abs(y - blueprint.house.y);
        var wallBotDistance = Math.abs(y - (blueprint.house.y + blueprint.house.height));

        if (wallTopDistance < wallBotDistance) {
        	type = blueprint.OUTERWALL;
        	room = blueprint.house;
            angle = blueprint.TOP;
            distance = wallTopDistance;
        } else {
        	type = blueprint.OUTERWALL;
        	room = blueprint.house;
            angle = blueprint.BOTTOM;
            distance = wallBotDistance;
        }

    }
    if (blueprint.house.y <= y && y <= blueprint.house.y + blueprint.house.height) {
    	isInHouseY = true;
        var wallLeftDistance = Math.abs(x - blueprint.house.x);
        var wallRightDistance = Math.abs(x - (blueprint.house.x + blueprint.house.width));

        if (Math.min(distance, wallLeftDistance, wallRightDistance) != distance) {
            if (wallRightDistance < wallLeftDistance) {
            	type = blueprint.OUTERWALL;
            	room = blueprint.house;
                angle = blueprint.RIGHT;
                distance = wallRightDistance;
            } else {
            	type = blueprint.OUTERWALL;
            	room = blueprint.house;
                angle = blueprint.LEFT;
                distance = wallLeftDistance;
            }
        }
    }
    
    if (isInHouseX && isInHouseY) {
    	for (var i in blueprint.walls) {
    		var wall = blueprint.walls[i];
    		if (wall.angle == blueprint.VERTICAL) {
    			var wallDistance = Math.abs(x - wall.pos);
    			if (wallDistance < distance) {
                	type = blueprint.INNERWALL;
                	room = wall;
                    angle = wall.angle;
                    distance = wallDistance;
    			}
    		}
    	}
    }

    if (distance <= blueprint.MINWALLOFFSET) {
        blueprint.closestWall = {
        	type: type,
            angle: angle,
            room: room,
            distance: distance
        };
    }
};

blueprint.mouseMoveEventFindClosestWall = function(x, y) {
    if (blueprint.closestWall.distance !== Infinity) {
        blueprint.resetView();
    }

    blueprint.closestWall = {
    		type: undefined,
    		angle: undefined,
    		room: null,
    		distance: Infinity
    };
    
    blueprint.checkClosestWall(x, y);
    if (blueprint.closestWall.distance !== Infinity) {
        blueprint.highlightWall(blueprint.closestWall);
    }
};

blueprint.moveWallOuter = function(x, y) {
	var MIN_HOUSE_SIZE = 50;
	var newHouse = JSON.parse(JSON.stringify(blueprint.closestWall.room)); // copy by reference
	
    switch (blueprint.closestWall.angle) {
        case blueprint.TOP:
            var y2 = newHouse.y + newHouse.height;
            newHouse.y = y;
            newHouse.height = y2 - y;
            break;
        case blueprint.LEFT:
            var x2 = newHouse.x + newHouse.width;
            newHouse.x = x;
            newHouse.width = x2 - x;
            break;
        case blueprint.BOTTOM:
            var y2 = newHouse.y;
            newHouse.height = y - y2;
            newHouse.y = y2;
            break;
        case blueprint.RIGHT:
            var x2 = newHouse.x;
            newHouse.width = x - x2;
            newHouse.x = x2;
            break;
    }
    
    if (newHouse.width >= MIN_HOUSE_SIZE && newHouse.height >= MIN_HOUSE_SIZE) {
    	blueprint.closestWall.room.x = newHouse.x;
    	blueprint.closestWall.room.width = newHouse.width;
    	blueprint.closestWall.room.y = newHouse.y;
    	blueprint.closestWall.room.height = newHouse.height;
        blueprint.resetView();
    }
	
};

blueprint.moveWallInner = function(x, y) {
	if (blueprint.closestWall.angle == blueprint.VERTICAL) {
		blueprint.closestWall.room.pos = x;
		if (blueprint.closestWall.room.pos < blueprint.house.x) {
			blueprint.closestWall.room.pos = blueprint.house.x
		} else if (blueprint.closestWall.room.pos > blueprint.house.x + blueprint.house.width) {
			blueprint.closestWall.room.pos = blueprint.house.x + blueprint.house.width;
		}
		blueprint.resetView();
	}
};

blueprint.moveWall = function(x, y) {
	if (blueprint.closestWall.type == blueprint.OUTERWALL) {
		blueprint.moveWallOuter(x, y);
	} else if (blueprint.closestWall.type == blueprint.INNERWALL) {
		blueprint.moveWallInner(x, y);
	}
	
};

blueprint.useToolMove = function(x, y, toolName) {
	if (toolName == "verticalWall"
		&& blueprint.house.x < x && x < blueprint.house.x + blueprint.house.width
		&& blueprint.house.y < y && y < blueprint.house.y + blueprint.house.height) {
		if (blueprint.walls.length > 0) {
			blueprint.walls[blueprint.walls.length -1].pos = x;
			blueprint.resetView();
		}
	}
};

blueprint.addWall = function(type) {
	blueprint.walls.push({
		angle: type,
		pos: blueprint.house.x
	});
};

blueprint.useToolClick = function(x, y, toolName) {
	toolbox.selectedTool = undefined;
};

blueprint.mouseMoveEvent = function(event) {
    var rect = blueprint.canvas.getBoundingClientRect();
    var x = ~~(event.clientX - rect.left);
    var y = event.clientY - rect.top;

    if (blueprint.isMovingWall) {
        blueprint.moveWall(x, y);
    } else if (toolbox.selectedTool !== undefined) {
        blueprint.useToolMove(x, y, toolbox.selectedTool);
    } else {
        blueprint.mouseMoveEventFindClosestWall(x, y);
    }

};

blueprint.mouseDownEvent = function(event) {
    var rect = blueprint.canvas.getBoundingClientRect();
    var x = ~~(event.clientX - rect.left);
    var y = event.clientY - rect.top;
    
    if (toolbox.selectedTool !== undefined) {
    	blueprint.useToolClick(x, y, toolbox.selectedTool);
    } else if (blueprint.closestWall.distance !== Infinity) {
        blueprint.isMovingWall = true;
        blueprint.moveWall(x, y);
    }
};

blueprint.mouseUpEvent = function(event) {
	if (blueprint.isMovingWall) {
		blueprint.isMovingWall = false;
		for (var i in blueprint.walls) {
			var wall = blueprint.walls[i];
			if (wall.angle == blueprint.VERTICAL
					&& !(blueprint.house.x < wall.pos && wall.pos < blueprint.house.x + blueprint.house.width)) {
				blueprint.walls.splice(i,1);
				blueprint.resetView();
			}
		}
	}
};

blueprint.highlightWall = function(room) {
    blueprint.context.beginPath();
    blueprint.context.strokeStyle = "yellow";
    blueprint.context.lineWidth = 3;
    
    var x;
    var y;
    var width;
    var height;
    if (room.type == blueprint.INNERWALL) {
    	if (room.angle == blueprint.VERTICAL) {
    		x = room.room.pos;
    		y = blueprint.house.y;
    		width = blueprint.house.width;
    		height = blueprint.house.height;
    	}
    	
    } else if (room.type == blueprint.OUTERWALL) {
    	x = room.room.x;
    	y = room.room.y;
    	width = room.room.width;
    	height = room.room.height;
    }

	if (room.type == blueprint.OUTERWALL) {
		switch (room.angle) {
	        case blueprint.TOP:
	            blueprint.context.moveTo(x, y);
	            blueprint.context.lineTo(x + width, y);
	            break;
	        case blueprint.LEFT:
	            blueprint.context.moveTo(x, y);
	            blueprint.context.lineTo(x, y + height);
	            break;
	        case blueprint.BOTTOM:
	            blueprint.context.moveTo(x, y + height);
	            blueprint.context.lineTo(x + width, y + height);
	            break;
	        case blueprint.RIGHT:
	            blueprint.context.moveTo(x + width, y);
	            blueprint.context.lineTo(x + width, y + height);
	            break;
		}
	} else if (room.type == blueprint.INNERWALL) {
    	if (room.angle == blueprint.VERTICAL) {
    		blueprint.context.moveTo(x, y);
    		blueprint.context.lineTo(x, y + height);
    	}
	}
	
    blueprint.context.closePath();
    blueprint.context.stroke();
};

blueprint.resetView = function() {
    blueprint.context.clearRect(0, 0, blueprint.canvas.width, blueprint.canvas.height);

    blueprint.context.fillStyle = "blue";
    blueprint.context.fillRect(0, 0, blueprint.canvas.width, blueprint.canvas.height);
    
    
    blueprint.context.beginPath();
    blueprint.context.strokeStyle = "white";

    blueprint.context.moveTo(blueprint.house.x, blueprint.house.y);
    blueprint.context.lineTo(blueprint.house.x + blueprint.house.width, blueprint.house.y);
    blueprint.context.lineTo(blueprint.house.x + blueprint.house.width, blueprint.house.y + blueprint.house.height);
    blueprint.context.lineTo(blueprint.house.x, blueprint.house.y + blueprint.house.height);
    blueprint.context.lineTo(blueprint.house.x, blueprint.house.y);
    
    for (var i in blueprint.walls) {
    	var wall = blueprint.walls[i];
    	if (wall.angle == blueprint.VERTICAL) {
    		blueprint.context.moveTo(wall.pos, blueprint.house.y);
    		blueprint.context.lineTo(wall.pos, blueprint.house.y + blueprint.house.height);
    	}
    }
    
    blueprint.context.closePath();
    blueprint.context.strokeStyle = "white";
    blueprint.context.lineWidth = 1;
    blueprint.context.stroke();
};

blueprint.init = function() {
    var editView = document.getElementById("EditView");
    blueprint.canvas = document.getElementById("blueprint");
    blueprint.context = blueprint.canvas.getContext("2d");
    blueprint.canvas.width = editView.offsetWidth; //Annars pajjar expand buttons! (beror på skärmen)
    blueprint.canvas.height = editView.offsetHeight;

    blueprint.canvas.addEventListener("mousemove", blueprint.mouseMoveEvent);
    blueprint.canvas.addEventListener("mousedown", blueprint.mouseDownEvent);
    blueprint.canvas.addEventListener("mouseup", blueprint.mouseUpEvent);

    blueprint.house = {
    	x: blueprint.canvas.width/2 - 300,
    	y: blueprint.canvas.height/2 - 300,
    	width: 400,
    	height: 400
    };
    blueprint.resetView();
};
