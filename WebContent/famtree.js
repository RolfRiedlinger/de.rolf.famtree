var attribute = [ "ID", "PRENAME", "SURNAME", "BIRTHDAY", "LASTMARRIAGE",
		"LASTPROFESSION", "FATHER_ID", "MOTHER_ID" ];
var createAttribute = [ "PRENAME", "SURNAME", "BIRTHDAY", "LASTPROFESSION" ];
var updateAttribute = [ "ID", "PRENAME", "SURNAME", "BIRTHDAY", "LASTMARRIAGE",
		"LASTPROFESSION", "FATHER_ID", "MOTHER_ID" ];

var margin = {
	top : 40,
	left : 10,
	bottom : 40,
	right : 10
};

var width = 500 - margin.left - margin.right;
var height = 500 - margin.top - margin.bottom;
var fontSize = 15;

function personListHeader() {
	var myString = "";
	for (var i = 0; i < attribute.length; i++) {
		myString += "<th>" + attribute[i] + "</th>";
	}
	return myString;
}

var req;

var listOfPerson = {
	_listofPerson : [],
	push : function(value) {
		this._listofPerson.push(value);
	},
	get : function(index) {
		return this._listofPerson[index];
	},
	toTable : function() {
		var tableString = "<table border = 2 cellpaddding = 10>";
		tableString += personListHeader();
		for (var i = 0; i < this._listofPerson.length; i++)
			tableString += this._listofPerson[i].toRow;
		tableString += "</table>";
		return tableString;
	},
	toDialogTable : function() {
		var tableString = "<table border = 2 cellpaddding = 10>";
		tableString += personListHeader();
		for (var i = 0; i < this._listofPerson.length; i++)
			tableString += this._listofPerson[i].toDialogRow;
		tableString += "</table>";
		return tableString;
	},
	clear : function() {
		while (this._listofPerson.length > 0) {
			this._listofPerson.pop();
		}
	}
};

var Person = function(node1) {

	Object.defineProperties(
					this,
					
					{
						
						"anchor" :{
							set: function(val){
								this._anchor=val;
							},
							get: function() {
								return this._anchor;
							}
						},
						"print" : {
							get : function() {
								var myString = "Person:";
								for (var i = 0; i < attribute.length; i++) {
									if (this[attribute[i]] != undefined) {
										myString += attribute[i] + "="
												+ this[attribute[i]] + " ";
									}
								}

								return myString;
							},

						},
						"toRow" : {
							get : function() {
								var myString = "<tr  class=updateClass>";
								for (var i = 0; i < attribute.length; i++) {
									if (this[attribute[i]] != undefined)
										myString += "<td>" + this[attribute[i]]
												+ "</td>";
									else
										myString += "<td>&nbsp;</td>";
								}
								myString += "</tr>";
								return myString;
							}
						},
						"toDialogRow" : {
							get : function() {
								var myString = "<tr  class=dialogUpdateClass>";
								for (var i = 0; i < attribute.length; i++) {
									if (this[attribute[i]] != undefined)
										myString += "<td>" + this[attribute[i]]
												+ "</td>";
									else
										myString += "<td>&nbsp;</td>";
								}
								myString += "</tr>";
								return myString;
							}
						},
						"toForm" : {
							get : function() {
								var temp = "";
								temp += "<table>";
								temp += "<tr><td>ID</td><td><input type=text name=ID value="
										+ this.ID + " readonly>";
								temp += "</td><td>";
								for (var i = 0; i < createAttribute.length; i++) {
									temp += "<tr><td>"
											+ createAttribute[i]
											+ "</td><td><input  class=updateform ";
									temp += "type=text name="
											+ createAttribute[i]
											+ " size=20 + ";
									temp += "value='"
											+ this[createAttribute[i]]
											+ "'></td></tr>";
								}
								temp += '<tr><td>FATHER</td><td><input  class=updateform type=text name=FATHER size=20 readonly';
								if (this.father != undefined)
									temp += ' value="' + this.father.PRENAME
											+ " " + this.father.SURNAME + '"';
								temp += '></td>';
								temp += '<td>ID:</td><td><input name=FATHER_ID size = 5 value="'
										+ this.FATHER_ID + '" readonly></td>';
								temp += '<td><button onclick=searchFather()>Modify Father</button>';

								temp += '<tr><td>MOTHER</td><td><input  class=updateform type=text name=MOTHER size=20 readonly';
								if (this.mother != undefined)
									temp += ' value="' + this.mother.PRENAME
											+ " " + this.mother.SURNAME + '"';
								temp += '></td>';
								temp += '<td>ID:</td><td><input name=MOTHER_ID size = 5 value="'
										+ this.MOTHER_ID + '" readonly></td>';
								temp += '<td><button onclick=searchMother()>Modify Mother</button>';
								temp += '</table>';
								return temp;
							}
						},
					});
	var description = node1.getElementsByTagName("description");
	if (description.length > 0) {
		for (var j = 0; j < attribute.length; j++) {
			var xx = description[0].getElementsByTagName(attribute[j]);
			try {
				this[attribute[j]] = xx[0].firstChild.nodeValue;
			} catch (er) {
				console.log("hier: Error parsing " + attribute[j]);
				this[attribute[j]] = "";
			}
		}
	}
	var xx = node1.getElementsByTagName("FATHER");
	if (xx.length > 0)
		this["father"] = new Person(xx[0]);
	xx = node1.getElementsByTagName("MOTHER");
	if (xx.length > 0)
		this["mother"] = new Person(xx[0]);
};

function searchForm() {

	var temp = "<H2> Advanced Search Form </H2> <table>";
	for (var i = 0; i < attribute.length; i++) {
		temp += "<tr><td>" + attribute[i] + "</td><td><input type=text name="
				+ attribute[i] + " size=20></td></tr>";
	}
	context = "person";
	temp += '</table><input type=button value=search onclick="advancedSearch()">';

	document.getElementById('upper_right').innerHTML = temp;

}

function createForm() {

	$("#upper_right").html("");
	$("#footer2").html("");

	var temp = "<H2> Create a  new person entry</H2> <table>";
	// The first Element is the ID field - we skip this , the id is defined by
	// the database

	for (var i = 0; i < createAttribute.length; i++) {
		temp += "<tr><td>" + createAttribute[i]
				+ "</td><td><input  class=updateform type=text name="
				+ createAttribute[i] + " size=20></td></tr>";
	}
	temp += '</table><input type=button value=create onclick="createEntry()">';
	$("#dialog2").html(temp);
	$("#dialog2").dialog("option", "title", "Create person");
	$("#dialog2").dialog("open");

}
function updateForm(index) {

	switch (context) {
	case "person":
		var temp = "<H2> Update person entry </H2> ";
		temp += listOfPerson.get(index).toForm;
		temp += '<input type=button value=update onclick="updateEntry()">';
		$("#upper_right").html(temp);
		break;
	case "father":
		if (index < 0) {
			$("input[name='FATHER']")[0].value = "";
			$("input[name='FATHER_ID']")[0].value = "";
		} else {
			$("input[name='FATHER']")[0].value = listOfPerson.get(index)["PRENAME"]
					+ " " + listOfPerson.get(index)["SURNAME"];
			$("input[name='FATHER_ID']")[0].value = listOfPerson.get(index)["ID"];
		}
		break;
	case "mother":
		if (index < 0) {
			$("input[name='MOTHER']")[0].value = "";
			$("input[name='MOTHER_ID']")[0].value = "";
		} else {
			$("input[name='MOTHER']")[0].value = listOfPerson.get(index)["PRENAME"]
					+ " " + listOfPerson.get(index)["SURNAME"];
			$("input[name='MOTHER_ID']")[0].value = listOfPerson.get(index)["ID"];
		}
		break;
	}

}

var context = "person";

function searchFather() {
	listOfPerson.clear();
	$("#footer2").html(""); // Cleanup footer
	$("#dfooter2").html(""); // Cleanup footer
	context = "father";
	$("#dialog1").dialog("option", "title", "Set father");
	$("#dialog1").dialog("open");

}

function searchMother() {
	listOfPerson.clear();
	$("#footer2").html(""); // Cleanup footer
	$("#dfooter2").html(""); // Cleanup footer
	context = "mother";
	$("#dialog").dialog("option", "title", "Set mother");
	$("#dialog").dialog("open");

}

function init() {
	if (window.XMLHttpRequest) {
		req = new XMLHttpRequest();
	} else if (window.ActiveXObject) {
		req = new ActiveXObject("Microsoft.XMLHTTP");
	}
	var url = "/de.rolf.famtree/TreeServlet2";
	req.open("POST", url, true);
	req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
}

function quickSearch() {
	// quicksearch ist eine fuzzy search,
	// wasdie Datenbank nach ähnlichen Nach- und Vornamen durchsucht
	// Die Onclick Aktion ist:
	// die Details der geklickten Person werden oben rechts angezeigt und
	// können bearbeitet werden
	context = "person";
	var query = $("input[name='quicksearch']"); // Suchtext wird gelesen
	init();
	req.onreadystatechange = personList;
	req.send("type=q&SURNAME=" + query[0].value + "&PRENAME=" + query[0].value);

}
function quickSearchInDialog() {
	// quicksearch ist eine fuzzy search,
	// wasdie Datenbank nach ähnlichen Nach- und Vornamen durchsucht
	// Die Onclick Aktion ist:
	// die Details der geklickten Person werden oben rechts angezeigt und
	// können bearbeitet werden
	var query = $("input[name='quicksearchindialog']"); // Suchtext wird gelesen
	init();
	req.onreadystatechange = personListinDialog;
	req.send("type=q&SURNAME=" + query[0].value + "&PRENAME=" + query[0].value);

}

function advancedSearch() {

	var query = "type=a";
	for (var i = 0; i < attribute.length; i++) {
		var field = document.getElementsByName(attribute[i]);
		if (field[0].value) {
			query = query + "&" + attribute[i] + "=" + field[0].value;
		}
		console.log(query);
	}

	init();
	req.onreadystatechange = personList;
	req.send(query);
}
//
// Konstruktor für das Anchor Objekt
//
var Anchor = function(x, y, person) {

	this.x = x;
	this.y = y;
	var maxLen = 20;

	/*
	for (var i = 0; i < attribute.length; i++) {
		if (person[attribute[i]].length > maxLen)
			maxLen = person[attribute[i]].length;
	}
	*/
	this.width = maxLen * fontSize * .5;
	this.height = (3 + 3.4) * fontSize;
};

function showBranch(pos) {
	var person = listOfPerson.get(pos);
	$("#upper_right").html("");
	
	var holder = d3.select("#upper_right") // select the 'upper right' element
	.append("svg") // Grafik Element in upper_right platzieren
	.attr("width", width + margin.left + margin.right).attr("height",
			height + margin.top + margin.bottom).attr("class", "chart").append(
			"g") // im Grafik element eine Gruppe platzieren, dieses wird an
					// holder zurückgegeben
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var panel = holder.append("g"); // eine weitere Gruppe definieren, dass ist
									// das panel mit dem Text

	// Die PanelWidth errechnet sich heuristisch aus der average geschätzten
	// FontWidth und der maximalen Länge der
	// Eigenschaften der Person das ist jetzt noch nicht optimal. hab aber noch
	// nichts besseres
	// Lege das Panel für die Person an

	var anchor = new Anchor(0, 0, person);
	anchor.x = 0.5 * width - anchor.width / 2;
	anchor.y = 0.67 * height - anchor.height / 2;
	person.anchor = anchor;
	createPanel(panel, person);
	if(person.father != null){
		panel = holder.append("g");
		person.father.anchor = new Anchor(0,0,person.father);
		createPanel(panel, person.father);
	}
	if(person.mother != null){
		panel = holder.append("g");
		person.mother.anchor = new Anchor(0,0,person.mother);
		person.mother.anchor.x = width-person.mother.anchor.width;
		createPanel(panel, person.mother);
	}
	holder.append("polyline")
	.style("stroke","grey")
	.style("fill", "none")
	.attr("points", (person.father.anchor.x+person.father.anchor.width)+","+ 
					(person.father.anchor.y+person.father.anchor.height/2)+","+
					(person.anchor.x+person.anchor.width/2-10)+","+
					(person.father.anchor.y+person.father.anchor.height/2)+","+
					(person.anchor.x+person.anchor.width/2-10)+","+
					person.anchor.y);
	holder.append("polyline")
	.style("stroke","grey")
	.style("fill", "none")
	.attr("points", (person.mother.anchor.x)+","+ 
			(person.mother.anchor.y+person.mother.anchor.height/2)+","+
			(person.anchor.x+person.anchor.width/2+10)+","+
			(person.mother.anchor.y+person.mother.anchor.height/2)+","+
			(person.anchor.x+person.anchor.width/2+10)+","+
			person.anchor.y);

	
}

function createPanel(panel, person){
	panel.append("rect")  // Jetzt das Rechteck einfügen
	.attr("width", person.anchor.width)
	.attr("height",person.anchor.height)
	.attr("rx", 10)
	.attr("ry", 5)
	.attr("fill", "steelblue");

var textbox = panel.append("g")   // textbox hinzufügen
	  	.attr("transform", "translate("+fontSize+","+(fontSize*2)+")") // Schade dass hier nicht em als Einheit genommen werden kann 
		.style("font-size", fontSize +"px")
		.style("fill", "white");
textbox.append("text")
	.text(person.PRENAME);
textbox.append("text")
	.attr("dy", "1.5em")
	.text(person.SURNAME);
textbox.append("text")
	.attr("dy", "3.0em")
	.text(person.LASTPROFESSION);
panel.attr("transform","translate("+person.anchor.x+","+person.anchor.y+")");	
	return;
}


function setPersonOnClick() {

	// für updateForm (default): die Details der geklickten Person werden oben
	// rechts angezeigt und
	// können bearbeitet werden
	// für FATHER: Der Vater Vor und Nachname und ID für die Person, die oben
	// rechts
	// bearbeitet wird, wird gesetzt
	// für MOTHER: Der Mutter or und Nachname und ID für die Person, die oben
	// rechts
	// bearbeitet wird, wird gesetzt

	var obj = $(".updateClass");
	obj.click(function() {
		var pos = obj.index(this);
		$(".updateClass").removeClass("green");
		$(this).addClass("green");
		showBranch(pos);
	});
}
function setDialogPersonOnClick() {

	// für updateForm (default): die Details der geklickten Person werden oben
	// rechts angezeigt und
	// können bearbeitet werden
	// für FATHER: Der Vater Vor und Nachname und ID für die Person, die oben
	// rechts
	// bearbeitet wird, wird gesetzt
	// für MOTHER: Der Mutter or und Nachname und ID für die Person, die oben
	// rechts
	// bearbeitet wird, wird gesetzt

	var obj = $(".dialogUpdateClass");
	obj.click(function() {
		var pos = obj.index(this);
		$(".dialogUpdateClass").removeClass("green");
		$(this).addClass("green");
		updateForm(pos);
	});
}

function personList() {
	// Callbackfunktion für die Suchanfragen an die Datenbank
	// Eine Suchanfrage liefert immer eine Liste von Personen, die sich für die
	// Suche qualifizieren, zurück
	// die XML response des http requests wird geparsed
	// und die Resultatliste der Personen aufgebaut.
	// Das Ergebnis wird als Tabelle unten hingeschrieben.
	// danach wird die Onclick Aktion gesetzt.
	processXMLResponse();
	var footer = $("#footer2");
	footer.html(listOfPerson.toTable());
	setPersonOnClick();
}

function personListinDialog() {
	// Callbackfunktion für die Suchanfragen an die Datenbank
	// Eine Suchanfrage liefert immer eine Liste von Personen, die sich für die
	// Suche qualifizieren, zurück
	// die XML response des http requests wird geparsed
	// und die Resultatliste der Personen aufgebaut.
	// Das Ergebnis wird als Tabelle unten hingeschrieben.
	// danach wird die Onclick Aktion gesetzt.
	processXMLResponse();
	var footer = $("#dfooter2");
	footer.html(listOfPerson.toDialogTable());
	setDialogPersonOnClick();
}

function processXMLResponse() {
	listOfPerson.clear();
	/*
	 * In the bottom section, create the list of persons that have been found by
	 * a query. With readyState check whether request is finished Holds the
	 * status of the XMLHttpRequest. Changes from 0 to 4: 0: request not
	 * initialized 1: server connection established 2: request received 3:
	 * processing request 4: request finished and response is ready
	 */
	if (req.readyState == 4) {

		// req Status 200 = OK, 404 = page not found
		if (req.status == 200) {

			// Parse XML tree
			var indexObj = req.responseXML.getElementsByTagName("person");
			for (var i = 0; i < indexObj.length; i++) {
				var node1 = indexObj[i];
				person = new Person(node1);
				listOfPerson.push(person);
			}
		}
	}
}

function createEntry() {
	// CallFuntion um einen Eintrag in der Datenbank zu ezeugen.
	// Highlights von Feldern werden zurückgenommen
	// Dann wird der http request String aufgebaut
	$(".green").removeClass("green");
	var query = "type=c";
	for (var i = 0; i < createAttribute.length; i++) {
		var field = $("input[name='" + createAttribute[i] + "']");
		if (field[0].value) {
			query += "&" + createAttribute[i] + "=" + field[0].value;
		}
	}

	init();
	req.onreadystatechange = personList;
	req.send(query);

}

function updateEntry() {
	// CallFuntion um einen Eintrag in der Datenbank zu erneuern.
	// Highlights von Feldern werden zurückgenommen
	// Dann wird der http request String aufgebaut
	$(".green").removeClass("green");
	var query = "type=u";
	for (var i = 0; i < updateAttribute.length; i++) {
		var field = $("input[name='" + updateAttribute[i] + "']");
		if (field[0].value) {
			query = query + "&" + updateAttribute[i] + "=" + field[0].value;
		}
	}

	init();
	req.onreadystatechange = personList;
	req.send(query);

}
$(function() {
	$("#dialog1").dialog({
		position : {
			my : "left+10 top+10",
			at : "left top",
			of : "#footer2"
		},
		height : "auto",
		width : "auto",
		dialogClass : "mydiag",
		autoOpen : false,
		modal : true,
		buttons : {
			"Cancel" : function() {
				updateForm(-1);
				$(this).dialog("close");
			},
			"OK" : function() {
				$(this).dialog("close");
			}
		},
		show : {
			effect : "blind",
			duration : 1000
		},
		hide : {
			effect : "explode",
			duration : 1000
		}
	});
	$("#dialog2").html("Hey here bin ich");
	$("#dialog2").dialog({
		position : {
			my : "left+10 top+10",
			at : "left top",
			of : "#footer2"
		},
		height : "auto",
		width : "auto",
		dialogClass : "mydiag",
		autoOpen : false,
		modal : true,
		buttons : {
			"Cancel" : function() {
				$(this).dialog("close");
			},
			"OK" : function() {
				$(this).dialog("close");
			}
		},
		show : {
			effect : "blind",
			duration : 1000
		},
		hide : {
			effect : "explode",
			duration : 1000
		}
	});
});
