var canvas;
var context;

var rooms = [];

var LEFT = 0;
var RIGHT = 1;
var BOTTOM = 2;
var TOP = 3;

var closestWall = {room: null, wallId: null, distance: Infinity};
var MINWALLOFFSET = 50;

var isMovingWall = false;


function checkClosestWall(x, y, room) {
    var distance = Infinity;
    var wall;

    if (room.x <= x && x <= room.x + room.width) {
        var wallTopDistance = Math.abs(y - room.y);
        var wallBotDistance = Math.abs(y - (room.y + room.height));

        if (wallTopDistance < wallBotDistance) {
            wall = TOP;
            distance = wallTopDistance;
        } else {
            wall = BOTTOM;
            distance = wallBotDistance;
        }

    }
    if (room.y <= y && y <= room.y + room.height) {
        var wallLeftDistance = Math.abs(x - room.x);
        var wallRightDistance = Math.abs(x - (room.x + room.width));

        if (Math.min(distance, wallLeftDistance, wallRightDistance) != distance) {
            if (wallRightDistance < wallLeftDistance) {
                wall = RIGHT;
                distance = wallRightDistance;
            } else {
                wall = LEFT;
                distance = wallLeftDistance;
            }
        }
    }

    if (distance <= MINWALLOFFSET && distance < closestWall.distance) {
        closestWall = {
            room: room,
            wallId: wall,
            distance: distance
        };
    }
}

function mouseMoveEventFindClosestWall(x, y) {
    if (closestWall.distance !== Infinity) {
        resetView();
    }

    closestWall = {room: null, wallId: null, distance: Infinity};
    for (var i in rooms) {
        checkClosestWall(x, y, rooms[i]);
    }
    if (closestWall.distance !== Infinity) {
        highlightWall(closestWall.room, closestWall.wallId, "yellow");
    }
}

function moveWall(x, y) {
    switch (closestWall.wallId) {
        case TOP:
            var y2 = closestWall.room.y + closestWall.room.height;
            closestWall.room.y = y;
            closestWall.room.height = y2 - y;
            break;
        case LEFT:
            var x2 = closestWall.room.x + closestWall.room.width;
            closestWall.room.x = x;
            closestWall.room.width = x2 - x;
            break;
        case BOTTOM:
            var y2 = closestWall.room.y;
            closestWall.room.height = y - y2;
            closestWall.room.y = y2;
            break;
        case RIGHT:
            var x2 = closestWall.room.x;
            closestWall.room.width = x - x2;
            closestWall.room.x = x2;
            break;
    }
    resetView();
}

function mouseMoveEvent(event) {
    var rect = canvas.getBoundingClientRect();
    var x = ~~(event.clientX - rect.left);
    var y = event.clientY - rect.top;

    if (!isMovingWall) {
        mouseMoveEventFindClosestWall(x, y);
    } else {
        moveWall(x, y);
    }

}

function mouseDownEvent(event) {
    if (closestWall.distance !== Infinity) {
        var rect = canvas.getBoundingClientRect();
        var x = ~~(event.clientX - rect.left);
        var y = event.clientY - rect.top;

        isMovingWall = true;
        moveWall(x, y);
    }
}

function mouseUpEvent(event) {
    isMovingWall = false;
}

function highlightWall(room, wall, color) {
    context.beginPath();
    context.strokeStyle = color;
    switch (wall) {
        case TOP:
            context.moveTo(room.x, room.y);
            context.lineTo(room.x + room.width, room.y);
            break;
        case LEFT:
            context.moveTo(room.x, room.y);
            context.lineTo(room.x, room.y + room.height);
            break;
        case BOTTOM:
            context.moveTo(room.x, room.y + room.height);
            context.lineTo(room.x + room.width, room.y + room.height);
            break;
        case RIGHT:
            context.moveTo(room.x + room.width, room.y);
            context.lineTo(room.x + room.width, room.y + room.height);
            break;
    }
    context.closePath();
    context.stroke();
}

function addRoom(x, y, width, height) {
    rooms.push({x: x, y: y, width: width, height: height});
    resetView();
}

function resetView() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "blue";
    context.fillRect(0, 0, canvas.width, canvas.height);

    for (var i in rooms) {
        var room = rooms[i];
        context.beginPath();
        context.moveTo(room.x, room.y);
        context.lineTo(room.x + room.width, room.y);
        context.lineTo(room.x + room.width, room.y + room.height);
        context.lineTo(room.x, room.y + room.height);
        context.lineTo(room.x, room.y);
        context.closePath();
    }

    context.strokeStyle = "white";
    context.stroke();
}

function init() {
    var editView = document.getElementById("EditView");
    canvas = document.getElementById("blueprint");
    context = canvas.getContext("2d");
    canvas.width = editView.offsetWidth -200;
    canvas.height = editView.offsetHeight;

    canvas.addEventListener("mousemove", mouseMoveEvent);
    canvas.addEventListener("mousedown", mouseDownEvent);
    canvas.addEventListener("mouseup", mouseUpEvent);

    addRoom(canvas.width/2 - 100, canvas.height/2 - 100, 200, 200);
}
