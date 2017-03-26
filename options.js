
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
            { name: "time", type: "duration" , title: "Visitation Time"},
            { type: "control" }
        ],
        controller: {
            insertItem: function (item) {
                var ar = item.time.split(',');
                var t = ar[0].split('h')[0] * 3600000 + ar[1].split('m')[0] * 60000 + ar[2].split('s')[0] * 1000;
                chrome.runtime.sendMessage({
                    type: "added_website",
                    url: item.url,
                    time: t
                });

            },
            updateItem: function (item) {
                var ar = item.time.split(',');
                var t = ar[0].split('h')[0] * 3600000 + ar[1].split('m')[0] * 60000 + ar[2].split('s')[0] * 1000;
                chrome.runtime.sendMessage({
                    type: "updated_website",
                    url: item.url,
                    time: t
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
            { name: "phoneNumber", type: "text", title: "Phone Number" },
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
        return value;
    },

    insertTemplate: function (value) {
        this._insertPicker = $("<div><input class='duration-picker' type='text' name='duration-picker'></div>");
        this._insertPicker.find('input').durationPicker();
        this._insertPicker.show();
        return this._insertPicker;
    },

    editTemplate: function (value) {
        this._editPicker = $("<div><input class='duration-picker' type='text' name='duration-picker'></div>");
        this._editPicker.find('input').durationPicker();
        this._editPicker.show();
        return this._editPicker;
    },

    insertValue: function () {
        return this._insertPicker.find('.duration-picker').val();
    },

    editValue: function () {
        return this._editPicker.find('.duration-picker').val();
    }
});

jsGrid.fields.duration = DurationField;