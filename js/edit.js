"use strict";

var blueprint = {};

blueprint.canvas = undefined;
blueprint.context = undefined;

blueprint.house = undefined;
blueprint.walls = [];
blueprint.closestWall = undefined;

blueprint.isMovingWall = false;
blueprint.isMovingPart = false;
blueprint.HIGHLIGHT_OFFSET = 50;

blueprint.INNERWALL = 0;
blueprint.OUTERWALL = 1;

blueprint.LEFT = 0;
blueprint.RIGHT = 1;
blueprint.BOTTOM = 2;
blueprint.TOP = 3;

blueprint.DOOR = 0;
blueprint.WINDOW = 1;

blueprint.HORIZONTAL = 0;
blueprint.VERTICAL = 1;

blueprint.PartWidths = [50, 50]; // Index 0 == DOOR as DOOR == 0 ^

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
      switch (wall.angle) {
        case blueprint.VERTICAL:
          var wallDistance = Math.abs(x - wall.pos);
          if (wallDistance < distance) {
            type = blueprint.INNERWALL;
            room = wall;
            angle = wall.angle;
            distance = wallDistance;
          }
          break;

        case blueprint.HORIZONTAL:
          var wallDistance = Math.abs(y - wall.pos);
          if (wallDistance < distance) {
            type = blueprint.INNERWALL;
            room = wall;
            angle = wall.angle;
            distance = wallDistance;
          }
          break;
      }
    }
  }

  if (distance <= blueprint.HIGHLIGHT_OFFSET) {
    blueprint.closestWall = {
      type: type,
      angle: angle,
      room: room,
      distance: distance
    };
  }
};

blueprint.mouseMoveEventFindClosestWall = function(x, y) {
  if (blueprint.closestWall !== undefined) {
    blueprint.resetView();
    blueprint.closestWall = undefined;
  }

  blueprint.checkClosestWall(x, y);
  if (blueprint.closestWall !== undefined) {
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
  var room;
  var position;
  var min;
  var max;

  if (blueprint.closestWall.angle == blueprint.VERTICAL) {
    room = blueprint.closestWall.room;
    room.pos = x;
    min = blueprint.house.x;
    max = blueprint.house.x + blueprint.house.width;
  } else if (blueprint.closestWall.angle == blueprint.HORIZONTAL) {
    room = blueprint.closestWall.room;
    room.pos = y;
    min = blueprint.house.y;
    max = blueprint.house.y + blueprint.house.height;
  }

  if      (room.pos < min) { room.pos = min; }
  else if (room.pos > max) { room.pos = max; }

  blueprint.resetView();
};

blueprint.moveWall = function(x, y) {
  if (blueprint.closestWall.type == blueprint.OUTERWALL) {
    blueprint.moveWallOuter(x, y);
  } else if (blueprint.closestWall.type == blueprint.INNERWALL) {
    blueprint.moveWallInner(x, y);
  }
};

blueprint.movePart = function(x, y) {
  var wall = blueprint.closestWall;
  var room = wall.room;
  var i = wall.movingPartIndex;
  if (room.angle == blueprint.VERTICAL) {
    room.parts[i].offset = y - blueprint.house.y - room.parts[i].width/2;
  } else if (room.angle == blueprint.HORIZONTAL) {
    room.parts[i].offset = x - blueprint.house.x - room.parts[i].width/2;
  }
  blueprint.resetView();
};

blueprint.useToolMove = function(x, y, toolName) {
  var isBetween = function(x, min, max) {
    return (min < x && x < max);
  }

  if (isBetween(x, blueprint.house.x, blueprint.house.x + blueprint.house.width)
      && isBetween(y, blueprint.house.y, blueprint.house.y + blueprint.house.height)) {
    switch (toolName) {
      case "verticalWall":
        blueprint.walls[blueprint.walls.length -1].pos = x;
        break;
      case "horizontalWall":
        blueprint.walls[blueprint.walls.length -1].pos = y;
        break;
    }
    blueprint.resetView();
  }
};

blueprint.addWall = function(type) {
  var pos;
  switch (type) {
    case blueprint.VERTICAL:   pos = blueprint.house.x; break;
    case blueprint.HORIZONTAL: pos = blueprint.house.y; break;
  }

  blueprint.walls.push({
    angle: type,
    pos: pos,
    parts: []
  });
};

blueprint.addPart = function(x, y, partType) {
  blueprint.checkClosestWall(x, y);

  if (blueprint.closestWall !== undefined) {
    if (blueprint.closestWall.angle == blueprint.VERTICAL) {
      blueprint.closestWall.room.parts.push({
        width: blueprint.PartWidths[partType],
        offset: y - blueprint.house.y - (blueprint.PartWidths[partType] / 2),
        type: partType
      });
    } else if (blueprint.closestWall.angle == blueprint.HORIZONTAL) {
      blueprint.closestWall.room.parts.push({
        width: blueprint.PartWidths[partType],
        offset: x - blueprint.house.x - (blueprint.PartWidths[partType] / 2),
        type: partType
      });
    }
    blueprint.resetView();
  }
};

blueprint.useToolClick = function(x, y, toolName) {
  switch (toolName) {
    case "door":
      blueprint.addPart(x, y, 0);
      break;
    case "window":
      blueprint.addPart(x, y, 1);
      break;
  }
  toolbox.selectedTool = undefined;
};

blueprint.mouseMoveEvent = function(event) {
  var rect = blueprint.canvas.getBoundingClientRect();
  var x = ~~(event.clientX - rect.left);
  var y = event.clientY - rect.top;

  if (blueprint.isMovingWall) {
    blueprint.moveWall(x, y);
  } else if (blueprint.isMovingPart) {
    blueprint.movePart(x, y);
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

  } else if (blueprint.closestWall !== undefined) {
    var room = blueprint.closestWall.room;
    blueprint.isMovingWall = true;

    for (var i in room.parts) {
      var part_x;
      var part_y;

      if (room.angle == blueprint.VERTICAL) {
        part_x = room.pos;
        part_y = room.parts[i].offset + room.parts[i].width/2 + blueprint.house.y;
      } else if (room.angle == blueprint.HORIZONTAL) {
        part_x = room.parts[i].offset + room.parts[i].width/2 + blueprint.house.x;
        part_y = room.pos;
      }

      part_x = Math.abs(part_x - x);
      part_y = Math.abs(part_y - y);

      if (part_x <= blueprint.HIGHLIGHT_OFFSET && part_y <= blueprint.HIGHLIGHT_OFFSET) {
        blueprint.isMovingWall = false;
        blueprint.isMovingPart = true;
        blueprint.closestWall.movingPartIndex = i;
        break;
      }
    }

    if (blueprint.isMovingWall) {
      blueprint.moveWall(x, y);
    }
  }
};

blueprint.mouseUpEvent = function(event) {
  var isBetween = function(x, min, max) {
    return (min < x && x < max);
  }

  if (blueprint.isMovingWall) {
    blueprint.isMovingWall = false;

    for (var i in blueprint.walls) {
      var wall = blueprint.walls[i];
      if ((wall.angle == blueprint.VERTICAL
            && !(isBetween(wall.pos, blueprint.house.x, blueprint.house.x + blueprint.house.width)))
          || (wall.angle == blueprint.HORIZONTAL
            && !(isBetween(wall.pos, blueprint.house.y, blueprint.house.y + blueprint.house.height)))) {
        blueprint.walls.splice(i,1);
        blueprint.resetView();
      }
    }

  } else if (blueprint.isMovingPart) {
    var wall = blueprint.closestWall;
    var room = wall.room;
    var i = wall.movingPartIndex;
    blueprint.isMovingPart = false;

    if ((room.angle == blueprint.VERTICAL
         && !isBetween(room.parts[i].offset, 0, blueprint.house.height))
        ||(room.angle == blueprint.HORIZONTAL
         && !isBetween(room.parts[i].offset, 0, blueprint.house.width))) {
      room.parts.splice(i, 1);
      blueprint.resetView();
    }
  }
};

blueprint.highlightWall = function(room) {
  blueprint.context.beginPath();
  blueprint.context.strokeStyle = "yellow";
  blueprint.context.lineWidth = 3;

  var x = 0;
  var y = 0;
  var width = 0;
  var height = 0;

  if (room.type == blueprint.INNERWALL) {
    x = blueprint.house.x;
    y = blueprint.house.y;

    switch (room.angle) {
      case blueprint.VERTICAL:
        x = room.room.pos;
        height = blueprint.house.height;
        break;
      case blueprint.HORIZONTAL:
        y = room.room.pos;
        width = blueprint.house.width;
        break;
    }
    blueprint.context.moveTo(x, y);
    blueprint.context.lineTo(x + width, y + height);

  } else if (room.type == blueprint.OUTERWALL) {
    x = room.room.x;
    y = room.room.y;
    width = room.room.width;
    height = room.room.height;

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
  }
  blueprint.context.closePath();
  blueprint.context.stroke();
};

blueprint.drawParts = function(wall) {

  for(var i in wall.parts) {
    //Draw the 'part' itself
    if(wall.angle == blueprint.VERTICAL) {
        blueprint.context.moveTo(wall.pos, //Move to start of arc
                                 blueprint.house.y +
                                 wall.parts[i].offset +
                                 wall.parts[i].width);
    }
    else if(wall.angle == blueprint.HORIZONTAL) {
        blueprint.context.moveTo(blueprint.house.x + //Move to start of arc
                                 wall.parts[i].offset +
                                 wall.parts[i].width,
                                 wall.pos);
    }

    switch(wall.parts[i].type) {
      case blueprint.DOOR:
        if(wall.angle == blueprint.VERTICAL) {            
            blueprint.context.arc(wall.pos, //Draw arc
                                  blueprint.house.y + wall.parts[i].offset,
                                  wall.parts[i].width,
                                  Math.PI / 2,
                                  Math.PI / 3,
                                  true); //Clockwise
            blueprint.context.lineTo(wall.pos, blueprint.house.y + wall.parts[i].offset); //Draw door
        }
        else if(wall.angle == blueprint.HORIZONTAL) {
            blueprint.context.arc(blueprint.house.x + wall.parts[i].offset, //Draw arc
                                  wall.pos,
                                  wall.parts[i].width,
                                  0,
                                  Math.PI / 5,
                                  false); //Counter clockwise
            blueprint.context.lineTo(blueprint.house.x + wall.parts[i].offset, wall.pos); //Draw door
        }
        break;
      case blueprint.WINDOW:
        if(wall.angle == blueprint.VERTICAL) {
            blueprint.context.lineTo(wall.pos, blueprint.house.y + wall.parts[i].offset); //Draw window
        }
        else if(wall.angle == blueprint.HORIZONTAL) {
            blueprint.context.lineTo(blueprint.house.x + wall.parts[i].offset, wall.pos); //Draw window
        }
        break;
    }

    if(wall.angle == blueprint.VERTICAL) {
        blueprint.context.moveTo(wall.pos, //Skip to end of part
                                 blueprint.house.y +
                                 wall.parts[i].offset +
                                 wall.parts[i].width);
    }
    else if(wall.angle == blueprint.HORIZONTAL) {
         blueprint.context.moveTo(blueprint.house.x + //Skip to end of part
                                  wall.parts[i].offset +
                                  wall.parts[i].width,
                                  wall.pos);
    }
  }
};

blueprint.drawWall = function(wall) {
  if (wall.angle == blueprint.VERTICAL) {
    blueprint.context.moveTo(wall.pos, blueprint.house.y);

    wall.parts.sort(function(a, b) {
      return a.offset - b.offset;
    });

    for(var i in wall.parts) {
      blueprint.context.lineTo(wall.pos, //Line to part
          blueprint.house.y +
          wall.parts[i].offset);

      blueprint.context.moveTo(wall.pos, //Skip to end of part
          blueprint.house.y +
          wall.parts[i].offset +
          wall.parts[i].width);

    }
    blueprint.context.lineTo(wall.pos, blueprint.house.y + blueprint.house.height);
  } else if (wall.angle == blueprint.HORIZONTAL) {
    blueprint.context.moveTo(blueprint.house.x, wall.pos);

    wall.parts.sort(function(a, b) {
      return a.offset - b.offset;
    });

    for(var i in wall.parts) {
      blueprint.context.lineTo(blueprint.house.x + //Line to part
                               wall.parts[i].offset,
                               wall.pos);

      blueprint.context.moveTo(blueprint.house.x + //Skip to end of part
                               wall.parts[i].offset +
                               wall.parts[i].width,
                               wall.pos);

    }
      
    blueprint.context.lineTo(blueprint.house.x + blueprint.house.width, wall.pos);
  }
};

blueprint.resetView = function() {
  blueprint.context.clearRect(0, 0, blueprint.canvas.width, blueprint.canvas.height);

  blueprint.context.beginPath();
  blueprint.context.strokeStyle = "white";

  blueprint.context.moveTo(blueprint.house.x, blueprint.house.y);
  blueprint.context.lineTo(blueprint.house.x + blueprint.house.width, blueprint.house.y);
  blueprint.context.lineTo(blueprint.house.x + blueprint.house.width, blueprint.house.y + blueprint.house.height);
  blueprint.context.lineTo(blueprint.house.x, blueprint.house.y + blueprint.house.height);
  blueprint.context.lineTo(blueprint.house.x, blueprint.house.y);

  for (var i in blueprint.walls) {
    blueprint.drawWall(blueprint.walls[i]);
  }

  blueprint.context.closePath();
  blueprint.context.strokeStyle = "white";
  blueprint.context.lineWidth = 2;
  blueprint.context.stroke();

  // Stroke the parts
  blueprint.context.beginPath();
  blueprint.context.strokeStyle = "white";

  for (var i in blueprint.walls) {
    blueprint.drawParts(blueprint.walls[i]);
  }

  blueprint.context.closePath();
  blueprint.context.strokeStyle = "white";
  blueprint.context.lineWidth = 1;
  blueprint.context.stroke();
};

blueprint.initInnerWalls = function() {
    blueprint.walls.push({
        angle: blueprint.VERTICAL,
        pos: blueprint.house.x + 300,
        parts: []
    });

    blueprint.addPart(blueprint.house.x + 300, blueprint.house.y + 50, 0);
    blueprint.addPart(blueprint.house.x + 300, blueprint.house.y + 300, 0);
    
    blueprint.walls.push({
        angle: blueprint.HORIZONTAL,
        pos: blueprint.house.y + 200,
        parts: []
    });

    blueprint.addPart(blueprint.house.x + 50, blueprint.house.y + 200, 0);
    blueprint.addPart(blueprint.house.x + 200, blueprint.house.y + 200, 1);
    blueprint.addPart(blueprint.house.x + 350, blueprint.house.y + 200, 1);
};

blueprint.init = function() {
  var editView = document.getElementById("EditView");
  blueprint.canvas = document.getElementById("blueprint");
  blueprint.context = blueprint.canvas.getContext("2d");
  blueprint.canvas.width = editView.offsetWidth;
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
  
  blueprint.initInnerWalls();

  blueprint.resetView();
};
