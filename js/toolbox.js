var toolbox = {};
toolbox.selectedTool = undefined;

toolbox.selectIcon = function(iconName) {
  toolbox.selectedTool = iconName;
  switch (toolbox.selectedTool) {
    case "verticalWall":
      blueprint.addWall(blueprint.VERTICAL);
      break;
    case "horizontalWall":
      blueprint.addWall(blueprint.HORIZONTAL);
      break;
    case "trashBin":
    	blueprint.tossInTrash();
      toolbox.selectedTool = undefined;
    	break;
    }
};
