var blueprint = {};

blueprint.canvas = undefined;
blueprint.context = undefined;

blueprint.house = undefined;
blueprint.walls = [];

blueprint.closestWall = {room: null, wallId: null, distance: Infinity};
blueprint.isMovingWall = false;
blueprint.MINWALLOFFSET = 50;

blueprint.LEFT = 0;
blueprint.RIGHT = 1;
blueprint.BOTTOM = 2;
blueprint.TOP = 3;

blueprint.HORIZONTAL = 0;
blueprint.VERTICAL = 1;

blueprint.checkClosestWall = function(x, y, room) {
    var distance = Infinity;
    var wall;

    if (room.x <= x && x <= room.x + room.width) {
        var wallTopDistance = Math.abs(y - room.y);
        var wallBotDistance = Math.abs(y - (room.y + room.height));

        if (wallTopDistance < wallBotDistance) {
            wall = blueprint.TOP;
            distance = wallTopDistance;
        } else {
            wall = blueprint.BOTTOM;
            distance = wallBotDistance;
        }

    }
    if (room.y <= y && y <= room.y + room.height) {
        var wallLeftDistance = Math.abs(x - room.x);
        var wallRightDistance = Math.abs(x - (room.x + room.width));

        if (Math.min(distance, wallLeftDistance, wallRightDistance) != distance) {
            if (wallRightDistance < wallLeftDistance) {
                wall = blueprint.RIGHT;
                distance = wallRightDistance;
            } else {
                wall = blueprint.LEFT;
                distance = wallLeftDistance;
            }
        }
    }

    if (distance <= blueprint.MINWALLOFFSET && distance < blueprint.closestWall.distance) {
        blueprint.closestWall = {
            room: room,
            wallId: wall,
            distance: distance
        };
    }
};

blueprint.mouseMoveEventFindClosestWall = function(x, y) {
    if (blueprint.closestWall.distance !== Infinity) {
        blueprint.resetView();
    }

    blueprint.closestWall = {room: null, wallId: null, distance: Infinity};
    blueprint.checkClosestWall(x, y, blueprint.house);
    if (blueprint.closestWall.distance !== Infinity) {
        blueprint.highlightWall(blueprint.closestWall.room, blueprint.closestWall.wallId, "yellow");
    }
};

blueprint.moveWall = function(x, y) {
	var MIN_HOUSE_SIZE = 50; 
	var newHouse = JSON.parse(JSON.stringify(blueprint.closestWall.room)); // copy by reference
	
    switch (blueprint.closestWall.wallId) {
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
		type: type,
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
    	console.log(toolbox.selectedTool)
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
			if (wall.type == blueprint.VERTICAL
					&& !(blueprint.house.x < wall.pos && wall.pos < blueprint.house.x + blueprint.house.width)) {
				blueprint.walls.splice(i,1);
				blueprint.resetView();
			}
		}
	}
};

blueprint.highlightWall = function(room, wall, color) {
    blueprint.context.beginPath();
    blueprint.context.strokeStyle = color;
    blueprint.context.lineWidth = 3;
    
    switch (wall) {
        case blueprint.TOP:
            blueprint.context.moveTo(room.x, room.y);
            blueprint.context.lineTo(room.x + room.width, room.y);
            break;
        case blueprint.LEFT:
            blueprint.context.moveTo(room.x, room.y);
            blueprint.context.lineTo(room.x, room.y + room.height);
            break;
        case blueprint.BOTTOM:
            blueprint.context.moveTo(room.x, room.y + room.height);
            blueprint.context.lineTo(room.x + room.width, room.y + room.height);
            break;
        case blueprint.RIGHT:
            blueprint.context.moveTo(room.x + room.width, room.y);
            blueprint.context.lineTo(room.x + room.width, room.y + room.height);
            break;
    }
    blueprint.context.closePath();
    blueprint.context.stroke();
};

blueprint.resetView = function() {
    blueprint.context.clearRect(0, 0, blueprint.canvas.width, blueprint.canvas.height);

    blueprint.context.fillStyle = "blue";
    blueprint.context.fillRect(0, 0, blueprint.canvas.width, blueprint.canvas.height);
    blueprint.context.beginPath();

    blueprint.context.moveTo(blueprint.house.x, blueprint.house.y);
    blueprint.context.lineTo(blueprint.house.x + blueprint.house.width, blueprint.house.y);
    blueprint.context.lineTo(blueprint.house.x + blueprint.house.width, blueprint.house.y + blueprint.house.height);
    blueprint.context.lineTo(blueprint.house.x, blueprint.house.y + blueprint.house.height);
    blueprint.context.lineTo(blueprint.house.x, blueprint.house.y);
    
    for (var i in blueprint.walls) {
    	var wall = blueprint.walls[i];
    	if (wall.type == blueprint.VERTICAL) {
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
    blueprint.canvas.width = editView.offsetWidth -200;
    blueprint.canvas.height = editView.offsetHeight;

    blueprint.canvas.addEventListener("mousemove", blueprint.mouseMoveEvent);
    blueprint.canvas.addEventListener("mousedown", blueprint.mouseDownEvent);
    blueprint.canvas.addEventListener("mouseup", blueprint.mouseUpEvent);

    blueprint.house = {
    	x: blueprint.canvas.width/2 - 300,
    	y: blueprint.canvas.height/2 - 300,
    	width: 600,
    	height: 600
    };
    blueprint.resetView();
};
