
window.onload = function () {

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
            storage.messageChoice = storage.messageChoice || 1;
            resolve(storage);
        });
    });

    initPromise.then(storage => {
        console.log(storage);
        initialize(storage);
    });
}

let initialize = function (storage) {
    $('.duration-picker').durationPicker();
    $('#newWebsite').on("click", addWebsiteTableRow);


    $('#websiteGrid').jsGrid({
        inserting: true,
        editing: true,
        width: "100%",
        data: storage.websites,
        fields: [
            { name: "url", type: "text", validate: "required" , title: "Website URL"},
            { name: "time", type: "duration" , title: "Visitation Time",
                validate: [
                    {validator: function(value, item) { return value >= 60000;}, message:"Please choose a duration greater than 1 minute."}
                ]
            },
            { type: "control" }
        ],
        controller: {
            insertItem: function (item) {
                chrome.runtime.sendMessage({
                    type: "added_website",
                    url: item.url,
                    time: item.time
                });

            },
            updateItem: function (item) {
                chrome.runtime.sendMessage({
                    type: "updated_website",
                    url: item.url,
                    time: item.time
                });
            },
            deleteItem: function (item) {
                chrome.runtime.sendMessage({
                    type: "removed_website",
                    url: item.url
                });
            }
        }
    })

    $('#friendGrid').jsGrid({
        inserting: true,
        editing: true,
        width: "100%",
        data: storage.friends,
        fields: [
            { name: "name", type: "text", validate: "required" , title: "Name"},
            { name: "phoneNumber", type: "phone", title: "Phone Number",
                validate: [
                    {validator: function(value, item) { return value.length == 12;}, message:"Please use a 10-digit phone number."},
                    {validator: function(value, item) {return !isNaN(value);}, message:"Please use only numbers."}
                ]
            },
            { type: "control" }
        ],

        controller: {
            insertItem: function (item) {
                chrome.runtime.sendMessage({
                    type: "added_friend",
                    name: item.name,
                    phoneNumber: item.phoneNumber
                });
            },
            updateItem: function (item) {
                chrome.runtime.sendMessage({
                    type: "updated_friend",
                    name: item.name,
                    phoneNumber: item.phoneNumber
                });
            },
            deleteItem: function (item) {
                chrome.runtime.sendMessage({
                    type: "removed_friend",
                    name: item.name
                });
            }
        }
    });

    $('#name').val(storage.name);
    $('#saveNameButton').on('click', function() {
        var name = $('#name').val();
        chrome.runtime.sendMessage({
            type: "updated_name",
            name: name
        });
    })
    $("#messagePicker").val(storage.messageChoice);
    $('#messagePicker').on('change',function(){
        chrome.runtime.sendMessage({
            type: "updated_message_choice",
            messageChoice: $('#messagePicker').val()
        });
    });

}

var generateWebsiteTableRow = function () {
    var row = $("<tr><td><input type='text'></td><td><input class='duration-picker' type='text' name='duration-picker'></td></td>");
    row.durationPicker();
    return row;
}
var populateWebsiteTable = function () {
    chrome.storage.local.get("websites", function (sites) {
        sites.forEach(function (item, index) {

        })
    })
}
var addWebsiteTableRow = function () {
    generateWebsiteTableRow().show().appendTo($('#websiteTable tbody'));
}

var DurationField = function (config) {
    jsGrid.Field.call(this, config);
};

DurationField.prototype = new jsGrid.Field({

    align: "center",              // redefine general property 'align'


    itemTemplate: function (value) {
        var hour = Math.floor(value/3600000);
        var min = Math.floor((value - hour*3600000)/60000);
        var sec = Math.floor((value - hour*3600000 - min*60000)/1000);
        var str = "";
        if (hour > 0) str += hour + " Hour(s) ";
        if (min > 0) str += min + " Minute(s) ";
        if (sec > 0) str += sec + " Second(s)";
        return str;
    },

    insertTemplate: function (value) {
        this._insertPicker = $("<div><input class='duration-picker' type='text' name='duration-picker'></div>");
        this._insertPicker.find('input').durationPicker();
        this._insertPicker.show();
        return this._insertPicker;
    },

    editTemplate: function (value) {
        var hour = Math.floor(value/3600000);
        var min = Math.floor((value - hour*3600000)/60000);
        var sec = Math.floor((value - hour*3600000 - min*60000)/1000);
        this._editPicker = $("<div><input class='duration-picker' type='text' name='duration-picker'></div>");
        var dp = this._editPicker.find('input').durationPicker();
        dp.setvalues({hours:hour, minutes:min, seconds: sec});
        this._editPicker.show();
        return this._editPicker;
    },

    insertValue: function () {
        var line = this._insertPicker.find('.duration-picker').val();
        var ar = line.split(',');
        var t = ar[0].split('h')[0] * 3600000 + ar[1].split('m')[0] * 60000 + ar[2].split('s')[0] * 1000;
        return t;
    },

    editValue: function () {
        var line = this._editPicker.find('.duration-picker').val();
        var ar = line.split(',');
        var t = ar[0].split('h')[0] * 3600000 + ar[1].split('m')[0] * 60000 + ar[2].split('s')[0] * 1000;
        return t;
    }
});

jsGrid.fields.duration = DurationField;

var DurationField = function (config) {
    jsGrid.Field.call(this, config);
};

DurationField.prototype = new jsGrid.Field({

    align: "center",              // redefine general property 'align'


    itemTemplate: function (value) {
        var hour = Math.floor(value/3600000);
        var min = Math.floor((value - hour*3600000)/60000);
        var sec = Math.floor((value - hour*3600000 - min*60000)/1000);
        var str = "";
        if (hour > 0) str += hour + " Hour(s) ";
        if (min > 0) str += min + " Minute(s) ";
        if (sec > 0) str += sec + " Second(s)";
        return str;
    },

    insertTemplate: function (value) {
        this._insertPicker = $("<div><input class='duration-picker' type='text' name='duration-picker'></div>");
        this._insertPicker.find('input').durationPicker();
        this._insertPicker.show();
        return this._insertPicker;
    },

    editTemplate: function (value) {
        var hour = Math.floor(value/3600000);
        var min = Math.floor((value - hour*3600000)/60000);
        var sec = Math.floor((value - hour*3600000 - min*60000)/1000);
        this._editPicker = $("<div><input class='duration-picker' type='text' name='duration-picker'></div>");
        var dp = this._editPicker.find('input').durationPicker();
        dp.setvalues({hours:hour, minutes:min, seconds: sec});
        this._editPicker.show();
        return this._editPicker;
    },

    insertValue: function () {
        var line = this._insertPicker.find('.duration-picker').val();
        var ar = line.split(',');
        var t = ar[0].split('h')[0] * 3600000 + ar[1].split('m')[0] * 60000 + ar[2].split('s')[0] * 1000;
        return t;
    },

    editValue: function () {
        var line = this._editPicker.find('.duration-picker').val();
        var ar = line.split(',');
        var t = ar[0].split('h')[0] * 3600000 + ar[1].split('m')[0] * 60000 + ar[2].split('s')[0] * 1000;
        return t;
    }
});

jsGrid.fields.duration = DurationField;

var PhoneField = function(config) {
    jsGrid.Field.call(this, config);
};

PhoneField.prototype = new jsGrid.Field({

    align: "center",              // redefine general property 'align'


    itemTemplate: function(value) {
        var first = value.substr(0,2);
        var second = value.substr(2,3);
        var third = value.substr(5,3);
        var last = value.substr(8);
        return first+" ("+second+") "+third+"-"+last;
    },

    insertTemplate: function(value) {
        return this._insertPicker = $("<input>");
    },

    editTemplate: function(value) {
        this._editPicker = $("<input>");
        this._editPicker.val(value.substring(2));
        return this._editPicker;
    },

    insertValue: function() {
        return "+1" + this._insertPicker.val();
    },

    editValue: function() {
        return "+1" + this._editPicker.val();
    }
});

jsGrid.fields.phone = PhoneField;