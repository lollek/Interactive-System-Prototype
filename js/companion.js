/**
 * Created by victor on 2015-02-26.
 */


var my_JSON_object;

var request = new XMLHttpRequest();
request.open("GET", "/../data/companionreplys.json", false);
request.send(null);
my_JSON_object = JSON.parse(request.responseText);



function CompanionResponse(action){
    //action ~ category

    //for clearing all intervals
    var interval_id = window.setInterval("", 9999); // Get a reference to the last
    for (var i = 1; i < interval_id; i++) window.clearInterval(i);


    console.log(my_JSON_object[action][0]);
    document.getElementById("talk-bubbel").style.visibility = "visible";
    document.getElementById("companion-msg").textContent = my_JSON_object[action][0];



    setInterval(function(){

        document.getElementById("talk-bubbel").style.visibility = "hidden";
        document.getElementById("companion-msg").textContent = "";


    }, 5000);



}