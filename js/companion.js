/**
 * Created by victor on 2015-02-26.
 */


var my_JSON_object;

/*
var request = new XMLHttpRequest();
request.open("GET", "/../data/companionreplys.json", false);
request.send(null);
my_JSON_object = JSON.parse(request.responseText);
//alert (my_JSON_object.result[0]);
console.log(my_JSON_object.new_wall[2]);
*/

    var request = new XMLHttpRequest();
    request.open("GET", "/../data/companionreplys.json", false);
    request.send(null);
    my_JSON_object = JSON.parse(request.responseText);


function CompanionRespone(action){
    //action ~ category

    console.log(my_JSON_object[action][0]);
    document.getElementById("talk-bubbel").style.visibility = "visible";
    document.getElementById("companion-msg").textContent = my_JSON_object[action][0]

}