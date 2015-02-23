var offset = 70; // px
var curr_button = null; // Hovered / Unhovered, EditExpandButton

$(".EditExpandButton").hover(function() {
  var root = $(this).find(".circle-container");
  var at = 0;
  root.toggleClass("circle-resize");
  curr_button = $(this);
  fix_top_pos_expand();
  curr_button = null;

  root.find("a").each(function() {
    if(!$(this).hasClass("center"))
    {
      var degree = (360/(root.find("a").length -1)) * at;
      at += 1;
      $(this).css({
        '-moz-transform': 'rotate(' + degree + 'deg)' + 
        ' translate(' + offset + 'px)' +
        ' rotate(-' + degree + 'deg)'});
    }
  });
}, function() {
  var root = $(this).find(".circle-container");
  var at = 0;
  root.toggleClass("circle-resize");
  curr_button = $(this);
  fix_top_pos_deflate();
  curr_button = null;

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

function fix_top_pos_expand() {
  increase_higth = false;
  var nr = 0;
  $("#EditView").find(".EditExpandButton").each(function() {
    if(increase_higth)
    {
      $(this).css({'top': (nr*100+100) + 'px'});
    }
    else if($(this).is(curr_button))
    {
      increase_higth = true;
    }
    nr += 1;
  });
}

function fix_top_pos_deflate() {
  decrease_higth = false;
  var nr = 0;
  $("#EditView").find(".EditExpandButton").each(function() {
    if(decrease_higth)
    {
      $(this).css({'top': (nr*100) + 'px'});
    }
    else if($(this).is(curr_button))
    {
      decrease_higth = true;
    }
    nr += 1;
  });
}