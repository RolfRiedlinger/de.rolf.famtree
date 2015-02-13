
//--------------------------------------------------------------------------------------------
//  Javascript global variables and arrays
//--------------------------------------------------------------------------------------------
// some attribute arrays. Currently in the "play around" state and not fully thought through 
// intention is to easily scale the software with new person features.
// attribute and create attribute differ only in the ID. The ID is created by the database 
// however I like to have the ID displayed. It is the unique identifier of a person entry. 
var attribute = [ "ID", "PRENAME", "SURNAME", "BIRTHDAY", "LASTMARRIAGE",
		"LASTPROFESSION"];
var createAttribute = [ "PRENAME", "SURNAME", "BIRTHDAY", "LASTPROFESSION" ];

// margin: parameter for the <svg> grafics
// width, height define the grafc area size
// A person's information is displayed in a rectangle panel. 
// I try to compute the size of the rectangle's sizes  based on the fontsize, 
// the length of the longest person detail and the estimated fontwidth. needs 
// improvement. 

var margin = {
	top : 80,
	left : 40,
	bottom : 40,
	right : 40
};

var width = 600 - margin.left - margin.right;
var height = 400 - margin.top - margin.bottom;
var fontSize = 15;

var req;  // req variable for the http communication

//--------------------------------------------------------------------------------------------
// Javascript global objects
//--------------------------------------------------------------------------------------------

// listOfPerson object holds the result of a Query to the famtree database. 
// push() , adds a person to the list,  get() returns a person from the list 
// methods:
// toTable: writes the list in an html table. Als Parameter wird die ein class Name übergeben, über den später die 
// 			Zeilen der Tabelle highlighted werden. 
// clear :  löschen der Liste.
var listOfPerson = {
	_listOfPerson : [],
	push : function(value) {
		this._listOfPerson.push(value);
	},
	get : function(index) {
		return this._listOfPerson[index];
	},
	toTable : function(styleAttribute) {
		var tableString = "<table border = 2 cellpaddding = 10 align=center>";
		tableString += personListHeader();
		
		for (var i = 0; i < this._listOfPerson.length; i++){
			tableString += this._listOfPerson[i].toRow(styleAttribute);
		}
			
		tableString += "</table>";
		return tableString;
	},
	clear : function() {
		while (this._listOfPerson.length > 0) {
			this._listOfPerson.pop();
		}
	}
};

// person is the object to hold the person's information 
// these are the attributes as well as the father and the mother 
// the structure is defined recursively, it has a person object for father and one for mother
// this way a whole tree could be kept in this structure. 
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
							value : function(className) {
								var myString = "<tr  class="+ className+">";
								for (var i = 0; i < attribute.length; i++) {
									if (this[attribute[i]] != undefined)
										myString += "<td>" + this[attribute[i]]+ "</td>";
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
// empty Person constructor
// constructs an empty person for the showbranch view
// in case mother and father of a branch are not defined 
var emptyPerson = function (){
	for(key in attribute)
		this[key]="AAA";
	console.log(this);
};

//--------------------------------------------------------------------------------------------
//Aux function: Http Request initialisation
//--------------------------------------------------------------------------------------------
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

//--------------------------------------------------------------------------------------------
//Aux function: HTML content : menu move in and out + help text 
//--------------------------------------------------------------------------------------------
function movein(which){
which.style.background='sienna';
}

function moveout(which){
which.style.background='bisque';
}

//--------------------------------------------------------------------------------------------
// Aux function: HTML content : personListHeader: set the header in (search result) table
//--------------------------------------------------------------------------------------------
function personListHeader() {
	var myString = "";
	for (var i = 0; i < attribute.length; i++) {
		myString += "<th>" + attribute[i] + "</th>";
	}
	return myString;
}

//--------------------------------------------------------------------------------------------
//Aux function: HTML content : searchForm: generate a search for person input form
//--------------------------------------------------------------------------------------------
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
//--------------------------------------------------------------------------------------------
//Aux function: HTML content : createForm: form for the create Dialog
//--------------------------------------------------------------------------------------------
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
//--------------------------------------------------------------------------------------------
//Aux function: HTML content : update form table , currently not used
//--------------------------------------------------------------------------------------------
function updateForm(index) {

		var temp = "<H2> Update person entry </H2> ";
		temp += listOfPerson.get(index).toForm;
		temp += '<input type=button value=update onclick="updateEntry()">';
		$("#upper_right").html(temp);
}

//--------------------------------------------------------------------------------------------
//Aux function: HTML content : Search Dialogs, currently not used 
//--------------------------------------------------------------------------------------------
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



//--------------------------------------------------------------------------------------------
//Aux function: Call server with form data for quicksearch
//--------------------------------------------------------------------------------------------
function quickSearch() {
	// quicksearch ist eine fuzzy search,
	// wasdie Datenbank nach ähnlichen Nach- und Vornamen durchsucht
	// Die Onclick Aktion ist:
	// die Details der geklickten Person werden oben rechts angezeigt und
	// können bearbeitet werden
	var query = $("input[name='quicksearch']"); // Suchtext wird gelesen
	init();
	req.onreadystatechange = personList;
	req.send("type=q&SURNAME=" + query[0].value + "&PRENAME=" + query[0].value);

}

//--------------------------------------------------------------------------------------------
//Aux function: Call server with form data from Dialog -- not used anymore
//--------------------------------------------------------------------------------------------
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

//--------------------------------------------------------------------------------------------
//Aux function: Call server with form data from Dialog -- not used anymoreadvanced searchDialog
//--------------------------------------------------------------------------------------------
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
//--------------------------------------------------------------------------------------------
//Aux function: Call server with form data from Dialog -- create person
//--------------------------------------------------------------------------------------------
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
	// Schreib doch die callback function hier rein 
	req.onreadystatechange = function () {
		// Callbackfunktion für create 
		// Suche qualifizieren, zurück
		// die XML response des http requests wird geparsed
		// und die Resultatliste der Personen aufgebaut.
		// Das Ergebnis wird als Tabelle unten hingeschrieben.
		// danach wird die Onclick Aktion gesetzt.
		// neu: rufe das showbranch auf
		processXMLResponse();
		var footer = $("#footer2");
		footer.html(listOfPerson.toTable("updateClass"));
		setPersonOnClick();
		showBranch(0);
	};
personList;
	req.send(query);

}
//--------------------------------------------------------------------------------------------
//Aux function: Call server with form data -- update person -- not used currently
//--------------------------------------------------------------------------------------------
function updateEntry() {
	// CallFuntion um einen Eintrag in der Datenbank zu erneuern.
	// Highlights von Feldern werden zurückgenommen
	// Dann wird der http request String aufgebaut
	$(".green").removeClass("green");
	var query = "type=u";
	for (var i = 0; i < attribute.length; i++) {
		var field = $("input[name='" + attribute[i] + "']");
		if (field[0].value) {
			query = query + "&" + attribute[i] + "=" + field[0].value;
		}
	}

	init();
	req.onreadystatechange = personList;
	req.send(query);

}

//--------------------------------------------------------------------------------------------
//Aux function: request callback set click behavior: called by personList()
//After the result is put into a table, the onclick behviour of rows is set
//--------------------------------------------------------------------------------------------
function setPersonOnClick() {

	var obj = $(".updateClass");
	obj.click(function() {
		var pos = obj.index(this);
		$(".updateClass").removeClass("green");
		$(this).addClass("green");
		showBranch(pos);
	});
}
function setDialogPersonOnClick() {

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
	footer.html(listOfPerson.toTable("updateClass"));
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
	footer.html(listOfPerson.toTable("dialogUpdateClass"));
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

//--------------------------------------------------------------------------------------------
//Aux function: D3 Grafics, Anchor point 
//--------------------------------------------------------------------------------------------
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
//--------------------------------------------------------------------------------------------
//Aux function: D3 Grafics, create a person's panel for showbranch
//--------------------------------------------------------------------------------------------
function createPanel(panel, person){
	panel.append("rect")  // Jetzt das Rechteck einfügen
	.attr("width", person.anchor.width)
	.attr("height",person.anchor.height)
	.attr("rx", 10)
	.attr("ry", 5)
	.attr("fill", "Darkgreen");

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
//--------------------------------------------------------------------------------------------
//Aux function: D3 Grafics, Anchor point showbranch
//--------------------------------------------------------------------------------------------
function showBranch(pos) {
	var person = listOfPerson.get(pos);
	$("#upper_right").html("");
	
	var holder = d3.select("#upper_right") // select the 'upper right' element
	.append("svg") // Grafik Element in upper_right platzieren
	.attr("width", width + margin.left + margin.right).attr("height",
			height + margin.top + margin.bottom).attr("class", "chart")
	.append("g") // im Grafik element eine Gruppe platzieren, dieses wird an
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

	if(person.father == undefined){
		person.father = new emptyPerson();
		person.father.PRENAME="unbekannt";
		person.father.SURNAME="";
		person.father.LASTPROFESSION="anklicken";
	}
	panel = holder.append("g");
	person.father.anchor = new Anchor(0,0,person.father);
	panel.append("text")
		.attr("dx", anchor.width/2)
		.attr("dy", -10)
		.attr("font-style", "italic")
		.attr("text-anchor", "middle")
		.text("Vater");
	
	createPanel(panel, person.father);

	if(person.mother == undefined){
		person.mother = new emptyPerson();
		person.mother.PRENAME="unbekannt";
		person.mother.SURNAME="";
		person.mother.LASTPROFESSION="anklicken";
	}
	panel = holder.append("g");
	person.mother.anchor = new Anchor(0,0,person.mother);
	person.mother.anchor.x = width-person.mother.anchor.width;
	createPanel(panel, person.mother);
	panel.append("text")
	.attr("dx", anchor.width/2)
	.attr("dy", -10)
	.attr("font-style", "italic")
	.attr("text-anchor", "middle")
	.text("Mutter");

	
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

//--------------------------------------------------------------------------------------------
//Init function after document.ready() -- initialize the dialogs
//--------------------------------------------------------------------------------------------
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
