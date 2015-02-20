/*
$(".EditExpandButton").mouseenter(function() {
	$(".EditExpandButton").css("background-color", "yellow");
	// on hover
  $(".circle-container").toggleClass("circle-container-changed");
  $(".deg135").toggleClass("deg135-changed");
  $(".deg180").toggleClass("deg180-changed");
  $(".deg225").toggleClass("deg225-changed");
  $(".circle-container").toggleClass("circle-container-changed");
  $(".circle-container").toggleClass("circle-container-changed");
  $(".circle-container").toggleClass("circle-container-changed");
});
$(".EditExpandButton").mouseout(function() {
  // on mouseout
  //$(".circle-container-changed").toggleClass("circle-container");
});
*/

$(".EditExpandButton").mouseenter(function() {
  // on hover
  $(".circle-container").toggleClass("circle-resize");
  $(".deg135").toggleClass("deg135-spanned-out");
  $(".deg180").toggleClass("deg180-spanned-out");
  $(".deg225").toggleClass("deg225-spanned-out");
});
$(".EditExpandButton").mouseout(function() {
  // on mouseout
  $(".circle-container").toggleClass("circle-resize");
  $(".deg135").toggleClass("deg135-spanned-out");
  $(".deg180").toggleClass("deg180-spanned-out");
  $(".deg225").toggleClass("deg225-spanned-out");
});


/*
function setMouseHover() {
  $(".EditExpandButton").mouseenter(function() {
    $(".EditExpandButton").css("background-color", "yellow");
    // on hover
    $(".circle-container").toggleClass("circle-container-changed");
    $("a.center").toggleClass("a.center-changed");
    $(".deg135").toggleClass("deg135-changed");
    $(".deg180").toggleClass("deg180-changed");
    $(".deg225").toggleClass("deg225-changed");
  });
  $(".EditExpandButton").mouseout(function() {
    // on mouseout
    $(".EditExpandButton").css("background-color", "white");
    //$(".circle-container-changed").toggleClass("circle-container");
  });
}
*/