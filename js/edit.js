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
blueprint.markedWall = undefined;
blueprint.markedPartIndex = undefined;

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

// Will modify size of all objects, 
blueprint.PIXELS_PER_METER = 50;

// Assign in meters (will be * pixels_per_meter)
blueprint.PartWidths = [1, 1]; // Index 0 == DOOR as blueprint.DOOR == 0 ^


blueprint.undoStack = [];
blueprint.stackPointer = 0;

blueprint.checkClosestPart = function(x, y) {
  if (toolbox.selectedTool !== undefined) {
    blueprint.useToolClick(x, y, toolbox.selectedTool);

  } else if (blueprint.closestWall !== undefined) {
    var room = blueprint.closestWall.room; // The wall...
    var isWallUnmarking = false;
    blueprint.isMovingWall = true;

    // Mark the wall / Unmark if wall already marked / Mark this wall, unmark last
    if(blueprint.markedWall !== undefined) {
      if(blueprint.markedWall === room) {
        isWallUnmarking = true;
      } else {
        blueprint.markedWall = room;
        blueprint.markedPartIndex = undefined; // Becouse don't want both wall and part to be marked. (When a wall is what we want)
      }
    } else {
      blueprint.markedWall = room;
      blueprint.markedPartIndex = undefined; // Becouse don't want both wall and part to be marked. (When a wall is what we want)
    }

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

        // Mark the part / Unmark if part already marked / Mark this part, unmark last
        if(blueprint.markedPartIndex !== undefined) {
          if(blueprint.markedPartIndex == i) {
            blueprint.markedPartIndex = undefined;
            blueprint.markedWall = undefined;
          } else {
            blueprint.markedPartIndex = i;
          }
        } else {
          blueprint.markedPartIndex = i;
        }

        isWallUnmarking = false;


        blueprint.isMovingWall = false;
        blueprint.isMovingPart = true;
        blueprint.closestWall.movingPartIndex = i; // TODO Change ".movingPartIndex" to ".activePartIndex" as it will be used for highlights aswell
        break;
      }
    }

    if(isWallUnmarking) {
      // Switch from marked part to marked wall (When part belongs to this wall)
      if(blueprint.markedPartIndex !== undefined) {
        blueprint.markedPartIndex = undefined;
      } else {
        blueprint.markedWall = undefined;
      }
    }

    if (blueprint.isMovingWall) {
      blueprint.moveWall(x, y);
    }
    blueprint.resetView();
  }
};

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

blueprint.movePart = function(x, y, partType) {
  var oldWall = blueprint.closestWall;
  var oldRoom = oldWall ? oldWall.room : undefined;

  blueprint.closestWall = undefined;
  blueprint.checkClosestWall(x, y);

  var newWall = blueprint.closestWall;
  var newRoom = newWall ? newWall.room : undefined;

  if (oldRoom == newRoom && newRoom !== undefined) {
    blueprint.checkClosestPart(x, y);

    var i = blueprint.closestWall.movingPartIndex;
    if (i === undefined)
      return;

    var room = oldRoom;
    if (room.angle == blueprint.VERTICAL) {
      room.parts[i].offset = y - blueprint.house.y - room.parts[i].width/2;
    } else if (room.angle == blueprint.HORIZONTAL) {
      room.parts[i].offset = x - blueprint.house.x - room.parts[i].width/2;
    }
    blueprint.resetView();

  } else /* oldRoom != newRoom || newRoom == oldRoom == undefined */ {
    var doReset = false;

    if (oldWall !== undefined && oldRoom.parts !== undefined) {
      oldRoom.parts.pop();
      doReset = true;
    }

    if (newWall !== undefined && newRoom.parts !== undefined) {
      var offset;
      switch (newWall.angle) {
        case blueprint.VERTICAL:
          offset = y - blueprint.house.y - (blueprint.PartWidths[partType] * blueprint.PIXELS_PER_METER / 2);
          break;
        case blueprint.HORIZONTAL:
          offset = x - blueprint.house.x - (blueprint.PartWidths[partType] * blueprint.PIXELS_PER_METER / 2);
          break;
      }

      newWall.room.parts.push({
        width: blueprint.PartWidths[partType] * blueprint.PIXELS_PER_METER,
        offset: offset,
        type: partType
      });

      newWall.movingPartIndex = newWall.room.parts.length -1;
      doReset = true;
    }

    if (oldWall !== undefined && newWall !== undefined
        && oldWall.movingPartIndex !== undefined) {
      newWall.movingPartIndex = oldWall.movingPartIndex;
    }

    if (doReset) {
      blueprint.resetView();
    }
  }
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
        width: blueprint.PartWidths[partType] * blueprint.PIXELS_PER_METER,
        offset: y - blueprint.house.y - ((blueprint.PartWidths[partType] * blueprint.PIXELS_PER_METER) / 2),
        type: partType
      });
    } else if (blueprint.closestWall.angle == blueprint.HORIZONTAL) {
      blueprint.closestWall.room.parts.push({
        width: blueprint.PartWidths[partType] * blueprint.PIXELS_PER_METER,
        offset: x - blueprint.house.x - ((blueprint.PartWidths[partType] * blueprint.PIXELS_PER_METER) / 2),
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
  blueprint.saveState(); //Save state when added object
  toolbox.selectedTool = undefined;
};

blueprint.mouseMoveEvent = function(event) {
  var rect = blueprint.canvas.getBoundingClientRect();
  var x = ~~(event.clientX - rect.left);
  var y = event.clientY - rect.top;

  if (blueprint.isMovingWall) {
    blueprint.moveWall(x, y);

  } else if (blueprint.isMovingPart) {
    var partType = undefined;

    if (blueprint.closestWall !== undefined
        && blueprint.closestWall.movingPartIndex !== undefined) {
      var i = blueprint.closestWall.movingPartIndex;
      partType = blueprint.closestWall.room.parts[i].type;
    }
    blueprint.movePart(x, y, partType);

  } else {
    blueprint.mouseMoveEventFindClosestWall(x, y);
  }
};

blueprint.mouseDownEvent = function(event) {
  var rect = blueprint.canvas.getBoundingClientRect();
  var x = ~~(event.clientX - rect.left);
  var y = event.clientY - rect.top;

  blueprint.checkClosestPart(x, y);
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
        if(blueprint.markedWall == blueprint.walls[i]) {
          blueprint.markedWall = undefined;
          blueprint.markedPartIndex = undefined;
        }
        blueprint.walls.splice(i,1);
        blueprint.resetView();
      }
    }
    blueprint.saveState(); //Save state of walls when done moving wall

  } else if (blueprint.isMovingPart) {
    var wall = blueprint.closestWall;
    var room = wall.room;
    var i = wall.movingPartIndex;
    blueprint.isMovingPart = false;

    if ((room.angle == blueprint.VERTICAL
         && !isBetween(room.parts[i].offset, 0, blueprint.house.height))
        ||(room.angle == blueprint.HORIZONTAL
         && !isBetween(room.parts[i].offset, 0, blueprint.house.width))) {
      if(blueprint.markedWall == room && blueprint.markedPartIndex == i) {
        blueprint.markedPartIndex = undefined;
      }
      room.parts.splice(i, 1);
      blueprint.resetView();
    }
    blueprint.saveState(); //Save state of walls when done moving part
  }
};

blueprint.tossInTrash = function() {
  if(blueprint.markedWall !== undefined) {
    var wallIndex = 0;
    for(var i in blueprint.walls) {
      if(blueprint.walls[i] === blueprint.markedWall) {
        wallIndex = i;
        break;
      }
    }
    if(blueprint.markedPartIndex !== undefined) {
      console.log("Marked Part index: " + blueprint.markedPartIndex);
      blueprint.walls[wallIndex].parts.splice(blueprint.markedPartIndex, 1);
      blueprint.markedPartIndex = undefined;
      blueprint.markedWall = undefined;
    } else {
      blueprint.walls.splice(wallIndex, 1);
      blueprint.markedWall = undefined;
    }
  } // Else do nothing, becouse nothing marked. Warning message? (Nothing marked) TODO
  console.log("Marked wall (toss): " + blueprint.markedWall);
  console.log("marked part (toss): " + blueprint.markedPartIndex);
  blueprint.resetView();
};

blueprint.highlightWall = function() {
  var wall = blueprint.markedWall;

  console.log("In HighlightWall, wall: " + wall.pos);

  blueprint.context.beginPath();
  blueprint.context.strokeStyle = "yellow";
  blueprint.context.lineWidth = 3;

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

  blueprint.context.closePath();
  blueprint.context.stroke();

  console.log("Done in highlightWall");
};

blueprint.highlightPart = function() {
  var wall = blueprint.markedWall;

  blueprint.context.beginPath();
  blueprint.context.strokeStyle = "yellow";
  blueprint.context.lineWidth = 3;

  for(var i in wall.parts) {
    //Draw the 'part' itself
    if(i == wall.movingPartIndex || i == blueprint.markedPartIndex) {
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

    var isOut = false;
    var topOut = false;
    var botOut = false;

    for(var i in wall.parts) {
      // Check if part is outside of house, then don't draw to it.
      if(wall.parts[i].offset + blueprint.house.y > blueprint.house.y + blueprint.house.height) {
        // Top part out of bounds DOWN aka Whole part out.
        blueprint.context.lineTo(wall.pos, //Line to part
          blueprint.house.y +
          blueprint.house.height);
        isOut = true;
      } else if(wall.parts[i].offset + blueprint.house.y < blueprint.house.y) {
        // Top part out of bounds UP
        blueprint.context.moveTo(wall.pos, //Skip to end of part
          blueprint.house.y +
          wall.parts[i].offset +
          wall.parts[i].width);
        topOut = true;
      } else {
        blueprint.context.lineTo(wall.pos, //Line to part
          blueprint.house.y +
          wall.parts[i].offset);
      }


      if(wall.parts[i].offset + wall.parts[i].width + blueprint.house.y < blueprint.house.y) {
        // Lower part out of bounds UP aka Whole part out.
        blueprint.context.moveTo(wall.pos, //Skip to start of house.
          blueprint.house.y);
        isOut = true;
      } else if(wall.parts[i].offset + wall.parts[i].width + blueprint.house.y > blueprint.house.y + blueprint.house.height) {
        // Lower part out of bounds DOWN
        blueprint.context.moveTo(wall.pos, //Skip to end of part
          blueprint.house.y +
          wall.parts[i].offset +
          wall.parts[i].width);
        botOut = true;
      } else {
        blueprint.context.moveTo(wall.pos, //Skip to end of part
          blueprint.house.y +
          wall.parts[i].offset +
          wall.parts[i].width);
      }
    }

    if(topOut) {
      blueprint.context.lineTo(wall.pos, blueprint.house.y + blueprint.house.height);
    } else if(botOut) {
    } else {
      blueprint.context.lineTo(wall.pos, blueprint.house.y + blueprint.house.height);
    }

  } else if (wall.angle == blueprint.HORIZONTAL) {
    blueprint.context.moveTo(blueprint.house.x, wall.pos);

    wall.parts.sort(function(a, b) {
      return a.offset - b.offset;
    });

    var isOut = false;
    var leftOut = false;
    var rightOut = false;

    for(var i in wall.parts) {
      // Check if part is outside of house, then don't draw to it.
      if(wall.parts[i].offset + blueprint.house.x > blueprint.house.x + blueprint.house.width) {
        // Left part out of bounds RIGHT aka Whole part out.
        blueprint.context.lineTo(blueprint.house.x +
          blueprint.house.width, 
          wall.pos);
        isOut = true;
      } else if(wall.parts[i].offset + blueprint.house.x < blueprint.house.x) {
        // Left part out of bounds LEFT
        blueprint.context.moveTo(blueprint.house.x +
          wall.parts[i].offset +
          wall.parts[i].width, 
          wall.pos);
        leftOut = true;
      } else {
        blueprint.context.lineTo(blueprint.house.x +
          wall.parts[i].offset, 
          wall.pos);
      }


      if(wall.parts[i].offset + wall.parts[i].width + blueprint.house.x < blueprint.house.x) {
        // Right part out of bounds LEFT aka Whole part out.
        blueprint.context.moveTo(blueprint.house.x,
          wall.pos);
        isOut = true;
      } else if(wall.parts[i].offset + wall.parts[i].width + blueprint.house.x > blueprint.house.x + blueprint.house.width) {
        // Right part out of bounds RIGHT
        blueprint.context.moveTo(blueprint.house.x +
          wall.parts[i].offset +
          wall.parts[i].width,
          wall.pos);
        rightOut = true;
      } else {
        blueprint.context.moveTo(blueprint.house.x +
          wall.parts[i].offset +
          wall.parts[i].width,
          wall.pos);
      }
    }

    if(leftOut) {
      blueprint.context.lineTo(blueprint.house.x + blueprint.house.width, wall.pos);
    } else if(rightOut) {
    } else {
      blueprint.context.lineTo(blueprint.house.x + blueprint.house.width, wall.pos);
    }
  }
};

blueprint.resetView = function() {

  //Draw canvas, bg, house sides, walls, and parts.

  blueprint.context.clearRect(0, 0, blueprint.canvas.width, blueprint.canvas.height);

  blueprint.context.beginPath();
  blueprint.context.moveTo(blueprint.house.x, blueprint.house.y);
  blueprint.context.lineTo(blueprint.house.x + blueprint.house.width, blueprint.house.y);
  blueprint.context.lineTo(blueprint.house.x + blueprint.house.width, blueprint.house.y + blueprint.house.height);
  blueprint.context.lineTo(blueprint.house.x, blueprint.house.y + blueprint.house.height);
  blueprint.context.lineTo(blueprint.house.x, blueprint.house.y);

  // X-axis for measures
  blueprint.context.moveTo(blueprint.house.x, blueprint.house.y + blueprint.house.height + 40);
  blueprint.context.lineTo(blueprint.house.x + blueprint.house.width, blueprint.house.y + blueprint.house.height + 40);

  // Draw extra line along outer axis, for marking start
  blueprint.context.moveTo(blueprint.house.x, blueprint.house.y + blueprint.house.height + 35);
  blueprint.context.lineTo(blueprint.house.x, blueprint.house.y + blueprint.house.height + 45);

  // Draw extra line along outer axis, for marking end
  blueprint.context.moveTo(blueprint.house.x + blueprint.house.width, blueprint.house.y + blueprint.house.height + 35);
  blueprint.context.lineTo(blueprint.house.x + blueprint.house.width, blueprint.house.y + blueprint.house.height + 45);

  blueprint.context.closePath();
  blueprint.context.strokeStyle = "white";
  blueprint.context.lineWidth = 2;
  blueprint.context.stroke();

  blueprint.context.fillStyle = 'white';
  blueprint.context.font = "bold 12px sans-serif";
  // X-axis text
  blueprint.context.fillText(Math.round(blueprint.house.width/blueprint.PIXELS_PER_METER) + " m", blueprint.house.x + blueprint.house.width/2 - 10, blueprint.house.y + blueprint.house.height + 65);
  // Y-axis text
  blueprint.context.fillText(Math.round(blueprint.house.height/blueprint.PIXELS_PER_METER) + " m", blueprint.house.x - 80, blueprint.house.y + blueprint.house.height/2 + 5);
 

  blueprint.context.beginPath();

  // Y-axis for measures
  blueprint.context.moveTo(blueprint.house.x - 40, blueprint.house.y);
  blueprint.context.lineTo(blueprint.house.x - 40, blueprint.house.y + blueprint.house.height);

  // Draw extra line along outer axis, for marking start
  blueprint.context.moveTo(blueprint.house.x - 35, blueprint.house.y);
  blueprint.context.lineTo(blueprint.house.x - 45, blueprint.house.y);

  // Draw extra line along outer axis, for marking end
  blueprint.context.moveTo(blueprint.house.x - 35, blueprint.house.y + blueprint.house.height);
  blueprint.context.lineTo(blueprint.house.x - 45, blueprint.house.y + blueprint.house.height);

  blueprint.context.moveTo(blueprint.house.x, blueprint.house.y);



  for (var i in blueprint.walls) {
    blueprint.drawWall(blueprint.walls[i]);
  }

  blueprint.context.closePath();
  blueprint.context.strokeStyle = "white";
  blueprint.context.lineWidth = 2;
  blueprint.context.stroke();

  // Stroke the parts
  blueprint.context.beginPath();

  for (var i in blueprint.walls) {
    blueprint.drawParts(blueprint.walls[i]);
  }

  blueprint.context.closePath();
  blueprint.context.strokeStyle = "white";
  blueprint.context.lineWidth = 1;
  blueprint.context.stroke();

  //Draw over highlight parts.

  blueprint.context.beginPath();

  if(blueprint.markedPartIndex !== undefined) {
    blueprint.highlightPart();
  }else if(blueprint.markedWall !== undefined) {
    blueprint.highlightWall();
  }

  blueprint.context.closePath();
  blueprint.context.strokeStyle = "yellow";
  blueprint.context.lineWidth = 3;
  blueprint.context.stroke();

};

blueprint.initInnerWalls = function() {
  blueprint.walls.push({
    angle: blueprint.VERTICAL,
    pos: blueprint.house.x + 300,
    parts: [
      {
        width: blueprint.PartWidths[0] * blueprint.PIXELS_PER_METER,
        offset: 50 - (blueprint.PartWidths[0] * blueprint.PIXELS_PER_METER /2),
        type: 0
      },
      {
        width: blueprint.PartWidths[0] * blueprint.PIXELS_PER_METER,
        offset: 300 - (blueprint.PartWidths[0] * blueprint.PIXELS_PER_METER /2),
        type: 0
      }
    ]
  });

  blueprint.walls.push({
    angle: blueprint.HORIZONTAL,
    pos: blueprint.house.y + 200,
    parts: [
      {
        width: blueprint.PartWidths[0] * blueprint.PIXELS_PER_METER,
        offset: 50 - (blueprint.PartWidths[0] * blueprint.PIXELS_PER_METER /2),
        type: 0
      },
      {
        width: blueprint.PartWidths[1] * blueprint.PIXELS_PER_METER,
        offset: 200 - (blueprint.PartWidths[1] * blueprint.PIXELS_PER_METER /2),
        type: 1
      },
      {
        width: blueprint.PartWidths[1] * blueprint.PIXELS_PER_METER,
        offset: 350 - (blueprint.PartWidths[1] * blueprint.PIXELS_PER_METER /2),
        type: 1
      }
    ]
  });
};

blueprint.onDropEvent = function(event) {
  toolbox.currentlyDragging = undefined;
  blueprint.isMovingPart = false;
};

blueprint.onDragOverEvent = function(event) {
  var rect = blueprint.canvas.getBoundingClientRect();
  var x = ~~(event.clientX - rect.left);
  var y = event.clientY - rect.top;
  event.preventDefault();

  var isInsideCanvas = function() {
    var isBetween = function(x, min, max) { return (min < x && x < max); };
    return (isBetween(x, blueprint.house.x, blueprint.house.x + blueprint.house.width)
      && isBetween(y, blueprint.house.y, blueprint.house.y + blueprint.house.height));
  };

  switch (toolbox.currentlyDragging) {
    case "verticalWall":
      if (isInsideCanvas()) {
        blueprint.walls[blueprint.walls.length -1].pos = x;
        blueprint.resetView();
      }
      break;
    case "horizontalWall":
      if (isInsideCanvas()) {
        blueprint.walls[blueprint.walls.length -1].pos = y;
        blueprint.resetView();
      }
      break;
    case "door": case "window":
      var partType;
      switch (toolbox.currentlyDragging) {
        case "door": partType = blueprint.DOOR; break;
        case "window": partType = blueprint.WINDOW; break;
      }
      blueprint.movePart(x, y, partType);
      break;
  }
};

blueprint.saveState = function() {//Call before things are added or moved
  if(blueprint.undoStack[blueprint.stackPointer]) {
      blueprint.stackPointer += 1;
  }
    
  blueprint.undoStack[blueprint.stackPointer] = (JSON.stringify(
      {"walls": blueprint.walls, "house": blueprint.house}));
    
  blueprint.undoStack = blueprint.undoStack.slice(0, blueprint.stackPointer + 1);
};

blueprint.loadState = function() {//Resets the state of walls to previous save    
  if(!blueprint.undoStack[blueprint.stackPointer]) {
    blueprint.stackPointer -= 1;
  }

  if(blueprint.stackPointer > 0) {
    blueprint.stackPointer -= 1;
  }
    
  var stateJson = blueprint.undoStack[blueprint.stackPointer];
  
  if(stateJson) {
     var state = JSON.parse(stateJson);
     blueprint.walls = state.walls;
     blueprint.house = state.house;
  }
  blueprint.resetView();
};

blueprint.forwardState = function() {//Call to return to state before undo
  var stateJson = blueprint.undoStack[blueprint.stackPointer + 1];
  
  if(stateJson) {
    blueprint.stackPointer += 1;
    var state = JSON.parse(stateJson);
    blueprint.walls = state.walls;
    blueprint.house = state.house;    
  }
  
  blueprint.resetView();
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
  blueprint.canvas.ondrop = blueprint.onDropEvent;
  blueprint.canvas.ondragover = blueprint.onDragOverEvent;

  blueprint.house = {
    x: blueprint.canvas.width/2 - 300,
    y: blueprint.canvas.height/2 - 300,
    width: 400,
    height: 400
  };

  blueprint.initInnerWalls();

  blueprint.resetView();
  blueprint.saveState();
};
