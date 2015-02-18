$('.EditExpandButton').mouseenter(function() {
	$('.EditExpandButton').css('background-color', 'yellow');
	// on hover
  $('.circle-container').toggleClass('circle-container-changed');
  $('.deg135').toggleClass('deg135-changed');
  $('.deg180').toggleClass('deg180-changed');
  $('.deg225').toggleClass('deg225-changed');
  $('.circle-container').toggleClass('circle-container-changed');
  $('.circle-container').toggleClass('circle-container-changed');
  $('.circle-container').toggleClass('circle-container-changed');
});
$(".EditExpandButton").mouseout(function() {
  // on mouseout
  //$('.circle-container-changed').toggleClass('circle-container');
});