var toolbox = {};
toolbox.selectedTool = undefined;

toolbox.selectIcon = function(iconName) {
    toolbox.selectedTool = iconName;
    switch (iconName) {
    	case "verticalWall":
    	    blueprint.addWall(blueprint.VERTICAL);
    	    break;
    	case "horizontalWall":
    	    blueprint.addWall(blueprint.HORIZONTAL);
    	    break;
    }
};
