var offset = 70; // px

$(".EditExpandButton").hover(function() {
  var root = $(this).find(".circle-container")
  var at = 0;
  root.toggleClass("circle-resize");

  root.find("a").each(function() {
    if(!$(this).hasClass("center"))
    {
      var degree = (360/(root.find("a").length -1)) * at
      at += 1;
      $(this).css({
        '-moz-transform': 'rotate(' + degree + 'deg)' + 
        ' translate(' + offset + 'px)' +
        ' rotate(-' + degree + 'deg)'});
    }
  });
}, function() {
  var root = $(this).find(".circle-container")
  var at = 0;
  root.toggleClass("circle-resize");

  root.find("a").each(function() {
    if(!$(this).hasClass("center"))
    {
      $(this).css({
        '-moz-transform': 'rotate(' + 0 + 'deg)' + 
        ' translate(' + 0 + 'px)' +
        ' rotate(-' + 0 + 'deg)'});
    }
  });
});