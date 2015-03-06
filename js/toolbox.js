var toolbox = {};
toolbox.currentlyDragging = undefined;

toolbox.drag = function(icon) {
  toolbox.currentlyDragging = icon;
  switch (toolbox.currentlyDragging) {
  case "verticalWall":
    blueprint.addWall(blueprint.VERTICAL);
    break;
  case "horizontalWall":
    blueprint.addWall(blueprint.HORIZONTAL);
    break;
  case "trashBin":
    blueprint.tossInTrash();
    toolbox.currentlyDragging = undefined;
    break;
  }
};
