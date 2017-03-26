

window.onload = function () {
    $('.duration-picker').durationPicker();
    $('#newWebsite').on("click", addWebsiteTableRow);


    $('#websiteGrid').jsGrid({
        inserting: true,
        editing: true,
        width:"100%",
        fields: [
            { name: "url", type: "text", validate: "required" },
            { name: "time", type: "duration" },
            { type: "control" }
        ],
        controller: {
            insertItem: function(item) {
                var time = item.time;
                chrome.runtime.sendMessage({
                    type: "added_website",
                    url: item.url,
                    time: 60000 // TODO: convert this to milliseconds as int
                });

            },
            updateItem: function(item) {
                chrome.runtime.sendMessage({
                    type: "updated_website",
                    url:item.url,
                    time: 60000 // TODO: convert this to milliseconds as int
                });
            },
            deleteItem: function(item) {
                chrome.runtime.sendMessage({
                    type: "removed_website",
                    url:item.url
                });
            }
        }
    })

    $('#friendGrid').jsGrid({
        inserting: true,
        editing: true,
        width:"100%",
        fields: [
            { name: "Name", type: "text", validate: "required" },
            { name: "Phone", type: "text" },
            { type: "control" }
        ],

        controller: {
            insertItem: function(item) {
                chrome.runtime.sendMessage({
                    type: "added_friend",
                    name: item.name,
                    phoneNumber: item.phoneNumber
                });
            },
            updateItem: function(item) {
                chrome.runtime.sendMessage({
                    type: "updated_friend",
                    name: item.name,
                    phoneNumber: item.phoneNumber
                });
            },
            deleteItem: function(item) {
                chrome.runtime.sendMessage({
                    type: "removed_friend",
                    name: item.name
                });
            }
        }
    })

    ;
}

var generateWebsiteTableRow = function() {
    var row = $("<tr><td><input type='text'></td><td><input class='duration-picker' type='text' name='duration-picker'></td></td>");
    row.durationPicker();
    return row;
}
var populateWebsiteTable = function () {
    chrome.storage.local.get("websites", function (sites) {
        sites.forEach(function(item, index) {

        })
    })
}
var addWebsiteTableRow = function() {
    generateWebsiteTableRow().show().appendTo($('#websiteTable tbody'));
}

var DurationField = function(config) {
    jsGrid.Field.call(this, config);
};

DurationField.prototype = new jsGrid.Field({

    align: "center",              // redefine general property 'align'


    itemTemplate: function(value) {
        return value;
    },

    insertTemplate: function(value) {
        this._insertPicker = $("<div><input class='duration-picker' type='text' name='duration-picker'></div>");
        this._insertPicker.find('input').durationPicker();
        this._insertPicker.show();
        return this._insertPicker;
    },

    editTemplate: function(value) {
        this._editPicker = $("<div><input class='duration-picker' type='text' name='duration-picker'></div>");
        this._editPicker.find('input').durationPicker();
        this._editPicker.show();
        return this._editPicker;
    },

    insertValue: function() {
        return this._insertPicker.find('.duration-picker').val();
    },

    editValue: function() {
        return this._editPicker.find('.duration-picker').val();
    }
});

jsGrid.fields.duration = DurationField;