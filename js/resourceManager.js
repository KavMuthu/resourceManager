var user_data, events_data, date_finalValue,date_val,user_name;
//global access to user.json objects
user_data = (function () {
    var json = null;
    $.ajax({
        'async': false,
        'global': false,
        'url': "json/users.json",
        'dataType': "json",
        'success': function (data) {
            json = data;
        }
    });
    return json;
})();
console.log(user_data);

//global access to resources_events.json objects
events_data = (function () {
    var json = null;
    $.ajax({
        'async': false,
        'global': false,
        'url': "json/resource_event.json",
        'dataType': "json",
        'success': function (data) {
            json = data;
        }
    });
    return json;
})();
console.log(events_data);

//method to populate the user names in the drop down menu
(function () {
    var dropwdown_menu = document.getElementById("user_menu");
    var li_tag;
    var ids = [];

    for (var i in user_data) {
        user_data[i].forEach(function (res) {
            ids.push(res.sys_id);
            var a_tag = document.createElement('a');
            a_tag.append(res.name);

            li_tag = document.createElement('li')
            li_tag.append(a_tag);
            dropwdown_menu.append(li_tag);
        });
    }


}());



//method to get the user name
$(document.body).on('click', '.dropdown-menu li a', function (e) {
    user_name = $(this).text();
    $('#userlabel').text(user_name);
});
//on click method for selection of dates
$(document.body).on('click', '#eachDay', function (e) {
    var date = $('#dateValue').val();
    date_val = date.split("/");

    //printing date in the format 20170303 by appending zeroes to the months and days less than 9
    if (parseInt(date_val[1]) <= 9) {
        if (parseInt(date_val[2]) <= 9) {
            date_val[1] = '0' + date_val[1];
            date_val[2] = '0' + date_val[2];
        }
    }
    if (parseInt(date_val[2]) >= 10) {
        date_val[1] = '0' + date_val[1];
        date_val[2] = parseInt(date_val[2]);
    }

    date_finalValue = date_val.join("");

    if (user_name == null) {
        alert("Please select the user name");
        return;
    }

    userObjHelper();
});

var User = function (id, name, date, start_time, end_time, type){
    this.id = id;
    this.name = name;
    this.date = date;
    this.start_time = start_time;
    this.end_time = end_time;
    this.type = type;


    this.toJson = function(){
        return {
            "id" : this.id,
            "name": this.name,
            "date": this.date,
            "start_time": this.start_time,
            "end_time": this.end_time,
            "type": this.type
        }
    }
};
User.fromJson = function (json){
    var obj = JSON.parse (json);
    return new User (obj.id, obj.name, obj.date, obj.start_time, obj.end_time, obj.type);
};

var userObj_array = {};
function userObjHelper() {

    //create a list of user_ids
    var sys_id = [{}];
    for (var i in user_data) {
        user_data[i].forEach(function (res) {
            sys_id.push({"id":res.sys_id, "user_name":res.name});
        });
    }

    //creates a user object array and stores sys_id, date, start_time, end_time and type for a particular date selected.
    var users = [{}];
    var usersForRepetitiveTasks = [{}];
    var u_id = ' ', task_date = ' ', u_startTime = ' ', u_endTime = ' ', user= ' ', json= ' ';
    for (var i in events_data) {

        events_data[i].forEach(function (res) {
            for (var j in sys_id) {
                if (sys_id[j].id === res.user.value) {

                    var end_date_time = res.end_date_time;
                    var start_date_time = res.start_date_time;
                    var work_type = res.type;

                    var end_time = end_date_time.split("T");
                    var start_time = start_date_time.split("T");
                    u_id = res.user.value;
                    task_date = end_time[0];
                    u_startTime = start_time[1];
                    u_endTime = end_time[1];

                    user = new User (u_id, sys_id[j].user_name, task_date, u_startTime, u_endTime, work_type);
                    json = user.toJson();
                    //console.log(json);
                    usersForRepetitiveTasks.push(json);


                    if (end_time[0] == date_finalValue) {
                        users.push(json);
                    }
                }
            }

        })
    }
    //console.log(usersForRepetitiveTasks);
    taskList(users);

    //consolidates the number of hours each user has worked on a particular day.
    var users_avbl = {};

    for (var i in users) {
        var item = users[i];
        if (users[item.id] === undefined) {
            users_avbl[item.id] = "0 ";
        }

        users_avbl[item.id] += item.start_time + " ";
        users_avbl[item.id] += item.end_time + " ";

    }
    console.log(users_avbl);
    var results = {};
    results = [];
    var end_time = {};
    var start_time = {};
    for (var i in users_avbl) {
        results.push({'user_id': i, 'work_hours': users_avbl[i]});
    }
    userObj_array = [];

    //creates an user object array with sys_is and consolidated work start and end times.
    for (var i in results) {
        end_time = [];
        start_time = [];
        var user_id = results[i].user_id;
        var work_hours = results[i].work_hours.split(' ');

        console.log(work_hours);

        for (var i = 1; i <= work_hours.length - 2; i++) {
            if (i % 2 == 0) {
                end_time.push(work_hours[i]);
            } else {
                start_time.push(work_hours[i]);
            }

        }

        userObj_array.push({"user_id": user_id,"start_time": start_time, "end_time": end_time});
    }
    console.log(userObj_array);
    availableHours(userObj_array);
    userUnAvailableHours(users);
    maxMinAvailability(userObj_array);
    //invocation of the following method to find the employee(s) available from 8AM - 12PM for assigning repetitive tasks
    repTaskSchedule(usersForRepetitiveTasks);
}

//Method to find hours when the users are occupied with tasks or meetings.
function userUnAvailableHours(users) {

    var user_namelabel = document.createElement('label');
    user_namelabel.append(user_name + " is unavailable during: ");

    //looping through the user object to display the busy hours
    users.forEach(function(res){
        if(res.name === user_name){


            var hours_label = document.createElement('li');
            hours_label.id = 'usersLabel';
            hours_label.innerHTML = convertTimestamp(res.start_time) + " - " + convertTimestamp(res.end_time);
            user_namelabel.append(hours_label);


        }
    });

    //the html li elements are appended to the main 'user_busy_hours' div tag
    var div = document.getElementById("user_busy_hours");
    var hr = document.createElement("hr");
    $('#user_busy_hours').empty();
    div.append(user_namelabel);
    div.append(hr);
}

/**
 *
 * @param userObj_array - array of user data (ids, start_times and end_times)
 * Method to find the hours the user is available. This method uses two static arrays.
 * One for storing the hours and one for holding boolean values. The boolean array has false for the number of hours the user is busy and true for no.of hours the user is free.
 */

function availableHours(userObj_array) {

    console.log("Available hours");
    console.log(userObj_array);

    var user_namelabel = document.createElement('label');
    user_namelabel.id = 'user_namelabel';
    user_namelabel.class = "label-success";
    user_namelabel.append(user_name + " is available during: ");

    var user_id = ' ';
    for (var i in user_data) {
        user_data[i].forEach(function (res) {
            if (user_name === res.name) {
                user_id = res.sys_id;
            }
        })
    }
    //hours array
    var timingsArray = [080000, 090000, 100000, 110000, 120000, 130000, 140000, 150000, 160000, 170000];
    //boolean array
    var boolArray = [true, true, true, true, true, true, true, true, true, true];
    var userTimings = [{}];
    var startIndices = [];
    var endIndices = [];
    //creates list with start and end indices that maps the busy hours indices in the hours array.
    for (var i in userObj_array) {
        var user = userObj_array[i];
        var u_id = user.user_id;
        console.log("available: " + user_id);
        console.log(user_id == u_id);
        if (user_id == u_id) {
            console.log(user.start_time);
            for (var i = 0; i < user.start_time.length; i++) {
                var start_index = timingsArray.indexOf(parseInt(user.start_time[i]));
                startIndices.push(start_index);

                var end_index = timingsArray.indexOf(parseInt(user.end_time[i]));
                endIndices.push(end_index);
            }
        }

    }
    //boolean array is created with true, false values based on user busy hours.
    for (var j in startIndices) {
        var diff = endIndices[j] - startIndices[j];
        console.log(diff);
        if (diff > 1) {
            for (var i = startIndices[j]; i <= endIndices[j]; i++) {
                boolArray[i] = false;
            }
        }
        else {
            boolArray[start_index] = false;
            boolArray[end_index] = false;
        }

    }
    console.log(boolArray);
    //indices array holds the indices of the free hours
    var indicesList = [];
    for (var b in boolArray) {
        if (boolArray[b]) {
            indicesList.push(b);
        }

    }
    //free hours are converted to 8:00 AM time string and appended to the html li elements
    for (var i in indicesList) {

        var start;
        var end;
        var end_time;
        var start_time;

        var timings = timingsArray[indicesList[i]];
        if (indicesList[i] == null) {
            return;
        }
        //for hours values lesser that 100000 '0' is appended (090000) for the convertTimestamp method to process the hours for UI.
        if (timings <= 90000) {
            start = "0" + timings;
            end = timings + 10000;

            if (end <= 90000) {
                end_time = "0" + end;
            } else {
                end_time = end.toString();
            }
            var avbl_time = document.createElement('li');
            avbl_time.id = "avbl_time";
            avbl_time.append(convertTimestamp(start) + " " + convertTimestamp(end_time));
            user_namelabel.append(avbl_time);
        } else {
            start = timings;
            var start_time_stringVal = start.toString();
            start_time = start_time_stringVal;
            end = timings + 10000;
            var end_time_stringVal = end.toString();
            end_time = end_time_stringVal

            var start_hour = convertTimestamp(start_time);
            var end_hour = convertTimestamp(end_time);

            //break hours are eliminated
            if (start_hour == "12:00 PM" && end_hour == "1:00 PM") {

                var avbl_time = document.createElement('li');
                avbl_time.id = "avbl_time";
                avbl_time.append(" ");
                user_namelabel.append(avbl_time);
            }
            else if (start_hour == "5:00 PM" && end_hour == "6:00 PM") {
                var avbl_time = document.createElement('li');
                avbl_time.id = "avbl_time";
                avbl_time.append(" ");
                user_namelabel.append(avbl_time);
            } else {
                var avbl_time = document.createElement('li');
                avbl_time.id = "avbl_time";
                avbl_time.append(convertTimestamp(start_time) + " " + convertTimestamp(end_time));
                user_namelabel.append(avbl_time);
            }

        }

    }
    var div = document.getElementById("user_free_hours");
    $('#user_free_hours').empty();

    div.append(user_namelabel);
}

//Method to convert a string time (080000) to hours with am/pm appended (08:00 AM).
function convertTimestamp(timestamp) {

    var ampm = 'AM', hh, mm, time, h;
    for (var i = 0; i <= timestamp.length; i++) {

        hh = timestamp[0] + timestamp[1];
        mm = timestamp[2] + timestamp[3];
    }
    if (parseInt(hh) > 12) {
        h = hh - 12;
        ampm = 'PM';
    } else if (parseInt(hh) == 12) {
        h = 12;
        ampm = 'PM';
    } else if (parseInt(hh) == 0) {
        h = 12;
    } else {
        h = hh;
    }
    time = h + ":" + mm + ' ' + ampm;

    return time;
}

//Method to find users who are available through the week of March 6th for assigning  repetitive tasks for an hour.
function repTaskSchedule(users) {

    //html label creation
    var label = document.createElement('label');
    label.id = 'repTask_label';
    label.append("An hour of repetitive task between 8AM and 12PM on " + date_val[1]+"/" + date_val[2] + "/" +date_val[0] + " can be assigned to:");
    var repTasks_availableUsers = [{}];
    var repTasks_unAvailableUsers = [{}];

    //creates a list of users who are available for repetitive tasks
    for(var i in users){

        if(parseInt(users[i].date) >= date_finalValue && parseInt(users[i].date) <= date_finalValue){
            if (parseInt(users[i].start_time) > 080000 && parseInt(users[i].end_time) < 120000 && (parseInt(users[i].end_time) - parseInt(users[i].start_time) >= 1 )) {
                repTasks_availableUsers.push({"id":users[i].id,"name":users[i].name,"date":users[i].date});
            }

            if (users[i].start_time != '080000' && users[i].end_time != '120000') {
                repTasks_availableUsers.push({"id":users[i].id,"name":users[i].name,"date":users[i].date});

            } else {
                repTasks_unAvailableUsers.push({"id":users[i].id,"name":users[i].name,"date":users[i].date});
            }
        }
    }
    //creates a list of a employees working from 8AM-12PM and 1PM-5PM
    var unavbl_users = [];
    for(var i in users){
        for(var j in repTasks_availableUsers){
            if(users[i].id === repTasks_availableUsers[j].id){
                if(users[i].start_time === '080000' && users[i].end_time === '120000'){
                    unavbl_users.push(users[i].name);
                }
            }
        }
    }

    var unAvailableUsers = [];
    $.each(unavbl_users, function (i, el) {
        if ($.inArray(el, unAvailableUsers) === -1) unAvailableUsers.push(el);
    });
    //eliminates employees working from 1pm-5pm and retains employees working from 8am-12pm
    if(unAvailableUsers != null){
        unAvailableUsers.forEach(function(res){
            repTasks_availableUsers.forEach(function(response){
                if(response.name === res){
                    repTasks_availableUsers.splice(repTasks_availableUsers.indexOf(response), 1);
                }
            })
        });
    }

    //creates html elements for displaying the user(s) available to assign the repetitive tasks
    repTasks_availableUsers.forEach(function(res){
        if(res.name != undefined){
            var li_tag = document.createElement('li');
            li_tag.id = 'repTasks_list';
            li_tag.append(res.name);
            label.append(li_tag);
        }

    });

    var hr = document.createElement("hr");
    var repTasks_div = document.getElementById('repetitive_tasks');
    $('#repetitive_tasks').empty();
    repTasks_div.append(label);
    repTasks_div.append(hr);

}

//Method to find the max and min busy hours.
function maxMinAvailability(userObj_array) {

    //html label creation
    var max_label = document.createElement("label");
    max_label.append("High Availability: ");
    max_label.id = 'max_label';

    var min_label = document.createElement("label");
    min_label.append("Low Availability: ");
    max_label.id = 'min_label';

    //total no.of hours worked is calculated
    var user_workHours = [{}];

    for (var i in userObj_array) {
        var start_timeArray = userObj_array[i].start_time;
        var end_timeArray = userObj_array[i].end_time;
        var user_val = userObj_array[i].user_id;

        for (var i = 0; i < start_timeArray.length; i++) {
            var diff = parseInt(end_timeArray[i]) - parseInt(start_timeArray[i]);
            user_workHours.push({"u_id": user_val, "hours": diff});
        }
    }

    //ids with similar values are grouped. For each user, total no.of hours spent on meetings and tasks is calculated.
    var user_hours = {};
    var i = 2;
    for (var i in user_workHours) {
        var item = user_workHours[i];
        if (user_hours[item.u_id] === undefined) {
            user_hours[item.u_id] = 0;
        }
        user_hours[item.u_id] += item.hours;
    }
    var workHours = [{}];
    for (var j in user_hours) {
        workHours.push({'user_idNo': j, 'work_totalHours': user_hours[j]});
    }
    //max hours are calculated
    var max = -Infinity;
    for (var k = 2; k < workHours.length; k++) {
        if (workHours[k].work_totalHours > max) {
            max = workHours[k].work_totalHours;
        }
    }

    //min hours are calculated
    var min = Infinity;
    for (var k = 2; k < workHours.length; k++) {
        if (workHours[k].work_totalHours < min) {
            min = workHours[k].work_totalHours;
        }
    }

    //for each user  html li elements are created for the UI.
    for (var m in workHours) {
        for (var i in user_data) {
            user_data[i].forEach(function (res) {
                if (max == workHours[m].work_totalHours) {
                    if (res.sys_id == workHours[m].user_idNo) {
                        var li_tag = document.createElement('li');
                        li_tag.id = "min_availability";
                        li_tag.append(res.name);
                        min_label.append(li_tag);
                    }
                }
                if (min == workHours[m].work_totalHours) {
                    if (res.sys_id == workHours[m].user_idNo) {
                        var li_tag = document.createElement('li');
                        li_tag.id = "max_availability";
                        li_tag.append(res.name);
                        max_label.append(li_tag);
                    }
                }
            })
        }
    }

    var max_div = document.getElementById('max_availablity');
    $('#max_availablity').empty();
    max_div.append(max_label);


    var hr = document.createElement("hr");
    var min_div = document.getElementById('min_availablity');
    $('#min_availablity').empty();
    min_div.append(min_label);
    min_div.append(hr);


}
//Method to create a list of users max occupied with tasks and meetings in the descending order.
function taskList(userObj_array) {

    console.log(userObj_array);
    //html task label
    var task_label = document.createElement('label');
    task_label.append("List of Employees busy with tasks: ");
    //html meetings label
    var meetings_label = document.createElement('label');
    meetings_label.append("List of Employees busy with meetings: ");

    var tasksList = [{}];
    var meetingsList = [{}];

    //creation of task list and meetings list
    for (var i in userObj_array) {
        var type = userObj_array[i].type;
        var start_time = userObj_array[i].start_time;
        var end_time = userObj_array[i].end_time;
        var user_val = userObj_array[i].id;

        var diff = parseInt(end_time) - parseInt(start_time);
        if (type == "task") {
            tasksList.push({"u_id": user_val, "hours": diff, "type": type});
        }

        if (type == "meeting") {
            meetingsList.push({"u_id": user_val, "hours": diff, "type": type});
        }

    }

    //finding the total no.of hours spent on tasks and meetings by each user
    var taskEvents_list = {};
    var i = 1;
    for (var i in tasksList) {
        var item = tasksList[i];
        if (taskEvents_list[item.u_id] === undefined) {
            taskEvents_list[item.u_id] = 0;
        }
        taskEvents_list[item.u_id] += item.hours;
    }
    var taskHours_list = [{}];
    var taskHours = [];
    for (var j in taskEvents_list) {
        taskHours_list.push({'user_idNo': j, 'work_totalHours': taskEvents_list[j]});
        taskHours.push(taskEvents_list[j]);
    }
    var meetingEvents_list = {};
    var i = 1;
    for (var i in meetingsList) {
        var item = meetingsList[i];
        if (meetingEvents_list[item.u_id] === undefined) {
            meetingEvents_list[item.u_id] = 0;
        }
        meetingEvents_list[item.u_id] += item.hours;
    }
    var meetingsHours_list = [{}];
    var meetingsHours = [];
    for (var j in meetingEvents_list) {
        meetingsHours_list.push({'user_idNo': j, 'work_totalHours': meetingEvents_list[j]});
    }

    // //sorting the meetings list
    meetingsHours_list.sort(function (a, b) {
        return parseInt(b.work_totalHours) - parseInt(a.work_totalHours);
    });

    //sorting the tasks list
    taskHours_list.sort(function (a, b) {
        return parseInt(b.work_totalHours) - parseInt(a.work_totalHours);
    });
    // //looping through the user data to fetch names and display the user names list in the descending order of busy hours for tasks.
    taskHours_list.forEach(function (result) {
        for (var j in user_data) {
            user_data[j].forEach(function (res) {

                if (result.user_idNo === res.sys_id) {
                    var hoursString = result.work_totalHours.toString();
                    var hrs = hoursString.replace(/^0+|0+$/g, "");
                    var hrs_label;
                    if (hrs == "1") {
                        hrs_label = "hour";
                    } else {
                        hrs_label = "hours";
                    }
                    var li_tag = document.createElement('li');
                    li_tag.id = 'tasks_list';
                    li_tag.append(res.name + " - " + hrs + " " + hrs_label);
                    task_label.append(li_tag);
                }
            });
        }

    })
    // //appending the list to the html task label.

    var task_div = document.getElementById('task_list');
    $('#task_list').empty();
    task_div.append(task_label);

    //looping through the user data to fetch names and display the user names list in the descending order of busy hours for meetings.
    meetingsHours_list.forEach(function (result) {
        for (var j in user_data) {
            user_data[j].forEach(function (res) {

                if (result.user_idNo === res.sys_id) {

                    var hoursString = result.work_totalHours.toString();
                    var hrs = hoursString.replace(/^0+|0+$/g, "");
                    var hrs_label;
                    if (hrs == "1") {
                        hrs_label = "hour";
                    } else {
                        hrs_label = "hours";
                    }
                    var li_tag = document.createElement('li');
                    li_tag.id = 'meetings_list';
                    li_tag.append(res.name + " - " + hrs + " " + hrs_label);
                    meetings_label.append(li_tag);
                }
            });
        }

    })

    //appending the list to the html meetings label.
    var meetings_div = document.getElementById('meetings_list');
    $('#meetings_list').empty();
    meetings_div.append(meetings_label);
}

