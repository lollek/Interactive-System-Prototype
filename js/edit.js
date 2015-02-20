var blueprint = {};

blueprint.canvas = undefined;
blueprint.context = undefined;

blueprint.rooms = [];

blueprint.closestWall = {room: null, wallId: null, distance: Infinity};
blueprint.isMovingWall = false;
blueprint.MINWALLOFFSET = 50;

blueprint.LEFT = 0;
blueprint.RIGHT = 1;
blueprint.BOTTOM = 2;
blueprint.TOP = 3;

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
    for (var i in blueprint.rooms) {
        blueprint.checkClosestWall(x, y, blueprint.rooms[i]);
    }
    if (blueprint.closestWall.distance !== Infinity) {
        blueprint.highlightWall(blueprint.closestWall.room, blueprint.closestWall.wallId, "yellow");
    }
};

blueprint.moveWall = function(x, y) {
    switch (blueprint.closestWall.wallId) {
        case blueprint.TOP:
            var y2 = blueprint.closestWall.room.y + blueprint.closestWall.room.height;
            blueprint.closestWall.room.y = y;
            blueprint.closestWall.room.height = y2 - y;
            break;
        case blueprint.LEFT:
            var x2 = blueprint.closestWall.room.x + blueprint.closestWall.room.width;
            blueprint.closestWall.room.x = x;
            blueprint.closestWall.room.width = x2 - x;
            break;
        case blueprint.BOTTOM:
            var y2 = blueprint.closestWall.room.y;
            blueprint.closestWall.room.height = y - y2;
            blueprint.closestWall.room.y = y2;
            break;
        case blueprint.RIGHT:
            var x2 = blueprint.closestWall.room.x;
            blueprint.closestWall.room.width = x - x2;
            blueprint.closestWall.room.x = x2;
            break;
    }
    blueprint.resetView();
};

blueprint.mouseMoveEvent = function(event) {
    var rect = blueprint.canvas.getBoundingClientRect();
    var x = ~~(event.clientX - rect.left);
    var y = event.clientY - rect.top;

    if (!blueprint.isMovingWall) {
        blueprint.mouseMoveEventFindClosestWall(x, y);
    } else {
        blueprint.moveWall(x, y);
    }

};

blueprint.mouseDownEvent = function(event) {
    if (blueprint.closestWall.distance !== Infinity) {
        var rect = blueprint.canvas.getBoundingClientRect();
        var x = ~~(event.clientX - rect.left);
        var y = event.clientY - rect.top;

        blueprint.isMovingWall = true;
        blueprint.moveWall(x, y);
    }
};

blueprint.mouseUpEvent = function(event) {
    blueprint.isMovingWall = false;
};

blueprint.highlightWall = function(room, wall, color) {
    blueprint.context.beginPath();
    blueprint.context.strokeStyle = color;
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

blueprint.addRoom = function(x, y, width, height) {
    blueprint.rooms.push({x: x, y: y, width: width, height: height});
    blueprint.resetView();
};

blueprint.resetView = function() {
    blueprint.context.clearRect(0, 0, blueprint.canvas.width, blueprint.canvas.height);

    blueprint.context.fillStyle = "blue";
    blueprint.context.fillRect(0, 0, blueprint.canvas.width, blueprint.canvas.height);

    for (var i in blueprint.rooms) {
        var room = blueprint.rooms[i];
        blueprint.context.beginPath();
        blueprint.context.moveTo(room.x, room.y);
        blueprint.context.lineTo(room.x + room.width, room.y);
        blueprint.context.lineTo(room.x + room.width, room.y + room.height);
        blueprint.context.lineTo(room.x, room.y + room.height);
        blueprint.context.lineTo(room.x, room.y);
        blueprint.context.closePath();
    }

    blueprint.context.strokeStyle = "white";
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

    blueprint.addRoom(blueprint.canvas.width/2 - 100, blueprint.canvas.height/2 - 100, 200, 200);
};
