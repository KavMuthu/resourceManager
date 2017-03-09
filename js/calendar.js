/**
 * Created by Kavi on 3/6/17.
 */
"use strict";
var calendar = document.getElementById("calendar");
var mainDate = new Date();
var year = mainDate.getFullYear();
var currentYear = mainDate.getFullYear();
var month = mainDate.getMonth();
var febMnth = 1;
var months = [{name:"January", days:31}, {name:"February", days:febDays(year)}, {name:"March", days:31}, {name:"April", days:30}, {name:"May", days:31}, {name:"June", days:30}, {name:"July", days:31},{name:"August", days:31}, {name:"September", days:30}, {name:"October", days:31}, {name:"November", days:30}, {name:"December", days:31}];
var weeks = ["Sunday", "Monday", "Tueaday", "Wednesday", "Thursday", "Friday", "Saturday"];
var monthName = "";
var monthDays = 0;
var innerHTML = "";
var monthNumbers = "";

var dayActive = "";
var currentDate = mainDate.getDate();
var currentMonth = mainDate.getMonth();
var currentYear = mainDate.getFullYear();

monthsPrint(year, month);
//Method to calculate the leap year
function febDays(year) {
	if ((year % 100 !== 0) && (year % 4 === 0) || (year % 400 === 0)) {
		return 29;
	} else {
		return 28;
	}
}
//Method to loop through months,days to print calendar using table format.
function monthsPrint(year, month) {
	var months = [{name:"January", days:31}, {name:"February", days:febDays(year)}, {name:"March", days:31}, {name:"April", days:30}, {name:"May", days:31}, {name:"June", days:30}, {name:"July", days:31},{name:"August", days:31}, {name:"September", days:30}, {name:"October", days:31}, {name:"November", days:30}, {name:"December", days:31}];
	for(var i=0; i<12; i++) {
		monthName = months[i].name;
		monthDays = months[i].days;
		if(month==i) {
			var shoWClass="showClass";
		} else {
			var shoWClass="hideClass";
		}
		innerHTML+="<div class='"+shoWClass+"' id='myTable'><div class='year'>"+year+"</div><div id='monthName' class='month "+shoWClass+"'><a class='btn' id='prevYear' onclick='prevYear();'> - </a> "+monthName+" <a class='btn' id='nextYear' onclick='nextYear();'> + </a></div> <div class='weeks'>";
		weekPrint();
		innerHTML+="</div>";
		daysPrint(i);
		innerHTML+="</div>";

	}
	calendar.innerHTML = innerHTML;
	printDateFormat(months);
}

//Method to print weeks
function weekPrint() {
	for(var k=0; k<weeks.length; k++) {
		innerHTML+="<span>"+weeks[k].substring(0,3)+"</span>";
	}
}
//Method to print days
function daysPrint(i) {
	for (var j=1; j<=monthDays; j++) {
		//var day = j;
		var currentDay = new Date((i+1) +", "+j+", "+ year);
		var monthStart = new Date((i+1)+","+1+", "+year);
		var n = currentDay.getDay();
		var s =monthStart.getDay();
		var totalDays = 7-s;
		var dayActive = "";
		var disabled = "";
		if(j==1) {
			var myClass= "first";
			for(var l=0; l<s; l++) {
				if(s!=0) {
					innerHTML+="<span></span>";
				}
			}

		}  else {
			var myClass = "";
			var myTd = "";
		}

		if(currentYear == year) {
			if( i==currentMonth && j<currentDate) {
				dayActive = "prevDay";
				//disabled = "disabled";
			} else if(i>currentMonth) {
				dayActive = "forwardDay";
				//disabled = "";
			} else if(i<currentMonth) {
				dayActive = "prevDay";
				//disabled = "disabled";
			} else if(j==currentDate) {
				dayActive = "dayActive";
				//disabled = "";
			}
		} else if(year<currentYear) {
			dayActive = "prevDay";
		}
		//print each day in the calendar
		innerHTML+="<span data-day='"+j+"/"+(month+1)+"/"+year+"' class='"+myClass+" "+dayActive+"'><button id='eachDay' "+disabled+">"+j+"</button></span>";
	}
}

function addCurrendDateClass(i, j) {
	var dayActive = "";
	var currentDate = mainDate.getDate();
	var currentMonth = mainDate.getMonth();
	var currentYear = mainDate.getFullYear();
	if(currentMonth == i) {
		if( i<=currentMonth && j<currentDate) {
			dayActive = "prevDay";
		} else if(currentDate==j) {
			dayActive = "dayActive";
		} else {
			dayActive = "forwardDay";
		}
	}
}

//Method to move to the next month
function nextYear() {
	month++;
	if(month>11) {
		month=0;
		year++;
	}
	innerHTML="";
	monthsPrint(year, month);
}
//Method to move to the previous month
function prevYear() {
	month--;
	if(month<0) {
		month=11;
		year--;
	}
	innerHTML="";
	monthsPrint(year, month);

}
//selected date value is append to a html input element.
function printDateFormat(months) {
	$("button").each(function() {
		$(this).click(function() {
			$("button").parent().removeClass("selected");
			$(this).parent().addClass("selected");
			$("#dateValue").val(year+"/"+(month+1)+"/"+$(this).html());
		});
	});
}