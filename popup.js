
function onOff(){
    var x = $("#slider").is(':checked');
    if(x){
        $("#s1").text("LnlyPpl Enabled")
    }
    else{
        $("#s1").text("LnlyPpl Disabled")
    }
}

function updateActiveStatus(isActive){
    if(isActive){
        $("#slider").prop('checked', true);
        $("#s1").text("LnlyPpl Enabled")
    }
    else{
        $("#slider").prop('checked', false);
        $("#s1").text("LnlyPpl Disabled")
    }
}

window.onload=function(){

    let initPromise = new Promise((resolve, reject) => {
            chrome.storage.sync.get(storage => {
            // Verify fields exist, otherwise create them
            if (!storage.hasOwnProperty("active")) {
                storage.active = true;
            }
            storage.friends = storage.friends || [];
            storage.websites = storage.websites || [];
            storage.textHistory = storage.textHistory || 0;
            storage.webHistory = storage.webHistory || [];
            resolve(storage);
        });
    });

    initPromise.then(storage => {
        console.log(storage);
        updateActiveStatus(storage.active);
        $("#text").text(storage.textHistory);
        var hours = 0;
        for (let site in storage.webHistory){
            hours += site.time;
        }
        $('#tt').text(hours);
    });

    $('#slider').on("change", onOff);

    $("#settingsButton").on("click", function() {
        chrome.tabs.create({url:"options.html"});
    })

    $('#slider').on('change', function() {
        var x = $("#slider").is(':checked');
        chrome.runtime.sendMessage({
            type: "toggle",
            toggle: x
        });
    })
}
