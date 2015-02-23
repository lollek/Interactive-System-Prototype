var toolbox = {};
toolbox.selectedTool = undefined;

toolbox.selectIcon = function(iconName) {
    toolbox.selectedTool = iconName;
    if (iconName == "verticalWall") {
    	blueprint.addWall(blueprint.VERTICAL);
    }
};
