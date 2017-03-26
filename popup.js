
function onOff(){
    var x = $("#slider").is(':checked');
    if(x){
        $("#s1").text("On")
    }
    else{
        $("#s1").text("Off")
    }
}

function updateActiveStatus(isActive){
    if(isActive){

        $("#slider").prop('checked', true);
        $("#s1").text("On")
    }
    else{
        $("#s1").text("Off")
    }
}

window.onload=function(){
    $("#slider").prop('checked', true);
    $("#s1").text("On")
    chrome.storage.local.get("active", updateActiveStatus)

    $('#slider').on("change", onOff);

    $("#settingsButton").on("click", function() {
        chrome.tabs.create({url:"options.html"});
    })
}