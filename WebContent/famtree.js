//--------------------------------------------------------------------------------------------
//  Javascript global variables and arrays
//--------------------------------------------------------------------------------------------
// some attribute arrays. Currently in the "play around" state and not fully thought through 
// intention is to easily scale the software with new person features. 
var attribute = [ "ID", "PRENAME", "SURNAME", "BIRTHDAY", "LASTMARRIAGE",
		"LASTPROFESSION" ];
// German labels for the current attributes
var label = [ "ID", "Vorname", "Nachname", "Geburtstag", "Heirat", "Beruf" ];
// margin: parameter for the <svg> grafics
var margin = {
	top : 40,
	left : 40,
	bottom : 40,
	right : 40
};
// width and height for the branch view, in order to edit a branch. 
// currently hard coded to 600x400 - margins.
// fontsize is used to compute the panel width and height 
var width = 600 - margin.left - margin.right;
var height = 600 - margin.top - margin.bottom;
var fontSize = 15;


var req; // req variable for the http communication

// --------------------------------------------------------------------------------------------
// Javascript global objects
// --------------------------------------------------------------------------------------------

// listOfPerson object holds the result of a query to the famtree database.
// push() , adds a person to the list, get() returns a person from the list
// methods:
// toTable: writes the list in an html table. Als Parameter wird ein class
// Name �bergeben, �ber den sp�ter die
// Zeilen der Tabelle highlighted werden.
// clear : l�schen der Liste.
var listOfPerson = {
	_listOfPerson : [],
	push : function(value) {
		this._listOfPerson.push(value);
	},
	get : function(index) {
		// Hier wird ein Kopie des Elementes zur�ckgegeben 
		// das muss passieren, weil die Funktion benutzt wird um 
		// f�r eine mainPerson Vater und Mutter aus der Datenbank zu bestimmen
		// der callback der Datanbank w�rde eine Referenz mit dneuen daten �berschreiben. 
		return this._listOfPerson.slice(index, index + 1)[0];
	},
	// Das generiert eine Tabelle f�r die Liste von Personen
	// wird benutzt um in der bottom sektion Query resultate anzuzeigen.
	toTable : function(styleAttribute) {
		var tableString = "<table>";
		tableString += personListHeader();

		for (var i = 0; i < this._listOfPerson.length; i++) {
			tableString += this._listOfPerson[i].toRow(styleAttribute);
		}

		tableString += "</table>";
		return tableString;
	},
	// bevor eine neue Anfrage an die Datenbank bearbeitet wird, muss 
	// die aktuelle Liste gel�scht werden.
	clear : function() {
		while (this._listOfPerson.length > 0) {
			this._listOfPerson.pop();
		}
	}
};
// branch is defined as a person + its relationsships. Currently implemented are
// the parents
// mainPerson = the root person for this branch
var mainPerson = null;


// numOfLevelMembers ist ein Array, was pro Level eines Baumes mit der ersten Person als root 
// die Information speichert, wieviele Person sich auf gleicher stufe befinden 
// Diese Info wird benutzt um die Gr��e der Fenster f�r den Nachfahren-baum und den 
// Vorfahren-baum zu berechnen
// numOfLevelMembers.length gibt die H�he des Baumes an. Das Maxim von numOfLevelMembers[i] ist 
// ein Ma� f�r die Breite. 
var numOfLevelMembers = []; 
// person is the object to hold the person's information
// these are the attributes as well as the father and the mother, partners and childs
// the structure is defined recursively, it has a person object for father and
// one for mother as well as for partners and childs.
// this way a whole tree could be kept in this structure.
var Person = function(node1,level) {
	this._level = level;
	// If root person -- reset the levelMember area
	// needed to compute width and height of the tree
	if(level == 0){
		for(key in numOfLevelMembers)
		numOfLevelMembers.pop();
		numOfLevelMembers.pop();
	}
	
	if(numOfLevelMembers[level] ==undefined)
		numOfLevelMembers[level] = 0;
	++numOfLevelMembers[level];
	
	for(key in numOfLevelMembers)
		console.log("level:" + key + "member:" + numOfLevelMembers[key]);
	
	Object.defineProperties(this,

	{

		// toRow: schreibt die Attribute der Person in eine html Tabellenzeile
		// wird gerufen von listOfPerson.toTable
		"toRow" : {
			value : function(className) {
				var myString = "<tr  class=" + className + ">";
				for (var i = 0; i < 3; i++) {
					if (this[attribute[i]] != undefined)
						myString += "<td>" + this[attribute[i]] + "</td>";
					else
						myString += "<td>&nbsp;</td>";
				}
				myString += "</tr>";
				return myString;
			}
		},
		// toForm: wird benutzt f�r die "diese Person bearbeiten" Option 
		"toForm" : {
			value : function() {
				var temp = "";
				temp += "<table>";
				temp += "<tr><td>ID</td><td><input type=text name=ID value="
						+ this.ID + " readonly>";
				temp += "</td>";
				for (var i = 1; i < attribute.length; i++) {
					temp += "<tr><td>" + label[i]
							+ "</td><td><input  class=updateform ";
					temp += "type=text name=" + attribute[i] + " size=20 + ";
					temp += "value='" + this[attribute[i]] + "'></td></tr>";
				}
				temp += '</table>';
				return temp;
			}
		},
	});
	
	
	// Hier wird der XML stream geparsed
	var description = node1.getElementsByTagName("description");
	if (description != null && description.length > 0) {
		for (var j = 0; j < attribute.length; j++) {
			var xx = description[0].getElementsByTagName(attribute[j]);
			try {
				this[attribute[j]] = xx[0].firstChild.nodeValue;
			} catch (er) {
				console.log("hier: Error parsing " + attribute[j]);
				this[attribute[j]] = "";
			}
		}
	} else {
		console.log("Description not found!! Person not fully created ");
		return;
	}

	// description muss immer da sein,
	// als n�chstes kann jetzt folgen
	// <FATHER>, <MOTHER>, <PERSON> oder null. Letzteres ist wenn eine Personen
	// description das Ende der response bildet.
	var nextTag = description[0].nextSibling;

	if (nextTag != null && nextTag.nodeName == "FATHER") {
		this.father = new Person(nextTag,level+1); // Hier erfolgt der rekursive Aufruf
											// um das objekt aufzubauen
		this.children = []; // children [] brauche ich f�r das D3 Treelayout
		this.children[0] = this.father;

		nextTag = nextTag.nextSibling; // move to next Tag
	} else
		this.father = new EmptyPerson();

	if (nextTag != null && nextTag.nodeName == "MOTHER") {
		this.mother = new Person(nextTag,level+1);
		if (this.children == undefined) {
			this.children = [];
			this.children[0] = this.mother;
		} else
			this.children[1] = this.mother;
		nextTag = nextTag.nextSibling;
	} else
		this.mother = new EmptyPerson();
	
	
	// Hier kommt der aktuelle Partner rein 
	// Der wird in dem Tag Relation hinterlegt
	// Beim der Stammbaum view gibt es auch die Möglichkeit den Partner mit anzuzeigen, 
	// das habe ich aber derzeit ausgebaut 
	// 
	if(nextTag != null && nextTag.nodeName == "RELATION"){
		this.partner = new Person(nextTag,level+1);
	}
	else
		this.partner = new EmptyPerson();

	
	
	// / Hier kommt der Parser code wenn der Nachfahren Tree angefragt wurde
	// Dessen Struktur kommt als Person -Partner - Child --was alles auf das
	// Children Feld gemappt wird
	// 

	 if (nextTag != null && nextTag.nodeName == "PARTNER") {
		if (this.children == undefined)
			this.children = []; // Brauche ich f�r die D3 Mimik.
		var i = 0;
		while (nextTag != null && nextTag.nodeName == "PARTNER") {
			this.children[i++] = new Person(nextTag,level+1);
			nextTag = nextTag.nextSibling; // move to nextTag
		}
	}

	if (nextTag != null && nextTag.nodeName == "CHILD") {
		if (this.children == undefined)
			this.children = []; // Brauche ich f�r die D3 Mimik.
		var i = 0; // children und PArtner schliessen sich aus, daher kannhier
					// der index wieder mit 0 beginnen
		while (nextTag != null && nextTag.nodeName == "CHILD") {
			this.children[i++] = new Person(nextTag,level+1);
			nextTag = nextTag.nextSibling; // move to nextTag
		}
	}

};

// =====================================================================
// empty Person constructor
// constructs an empty person for the showbranch view
// in case mother and father of a branch are not defined
var EmptyPerson = function() {

	for (key in attribute)
		this[attribute[key]] = " ";
	this.PRENAME = "unbekannt";
	this.SURNAME = "";
	this.LASTPROFESSION = "anklicken";
	console.log(this);
};

// --------------------------------------------------------------------------------------------
// Aux function: Http Request initialisation
// --------------------------------------------------------------------------------------------
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

// --------------------------------------------------------------------------------------------
// Aux function: HTML content : menu move in and out + help text
// --------------------------------------------------------------------------------------------
function movein(which) {
	which.style.background = 'sienna';
}

function moveout(which) {
	which.style.background = 'bisque';
}

// --------------------------------------------------------------------------------------------
// Aux function: HTML content : personListHeader: set the header in (search
// result) table
// --------------------------------------------------------------------------------------------
function personListHeader() {
	var myString = "<thead><tr>";
	for (var i = 0; i < 3; i++) {
		myString += "<th>" + label[i] + "</th>";
	}
	myString += "</thead>"
	return myString;
}

// --------------------------------------------------------------------------------------------
// Aux function: HTML content : searchForm: generate a search for person input
// form
// --------------------------------------------------------------------------------------------
function searchForm() {

	$(".submenu").hide();
	var temp = "<div id=search><H2> Personensuche </H2> <table>";
	for (var i = 0; i < attribute.length; i++) {
		temp += "<tr><td>" + label[i] + "</td><td><input type=text name="
				+ attribute[i] + " onkeyup=advancedSearch() size=20></td></tr>";
	}
	context = "person";
	temp += '</table>';
	temp += "</div><div id=result></div>";

	document.getElementById('upper_right').innerHTML = temp;

}
// --------------------------------------------------------------------------------------------
// Aux function: HTML content : createForm: form for the create Dialog
// called by: "Neuer Zweig" Menu entry , 
// called by: createOrEditPerson() -- triggered by Menu entry "Person bearbeiten" if 
// 			  person isnot defined yet. 
// --------------------------------------------------------------------------------------------
function createForm(calledby) {

	$("#upper_right").html("");
	$(".submenu").hide();
	// $("#dialog1bottom").html("");

	var temp = "<H2> Neue Person anlegen </H2><table>";
	
	// Create fields for the attributes: 
	// The first Element is the ID field - we skip this , the id is defined by

	for (var i = 1; i < attribute.length; i++) {
		temp += "<tr><td>" + label[i]
				+ "</td><td><input  class=updateform type=text name="
				+ attribute[i] + " size=20></td></tr>";
	}
	temp += '</table>'; 
	
    // temp += '<input type=button value=create  onclick="createEntry()">';
    // $("#upper_right").html(temp);
	
	$("#dialog1top").html(temp);
	$("#dialog1").dialog("option", "title", "Neue Person anlegen");
	$( "#dialog1" ).dialog( "option", "buttons", { 
		 "Person anlegen": function() { createEntry(calledby); $(this).dialog("close"); } 
		} );
	

	$("#dialog1").dialog("open");
	 
}
// --------------------------------------------------------------------------------------------
// Aux function: HTML content : edit or create person
// called by: Menu entry "Person bearbeiten" in branch view 
// --------------------------------------------------------------------------------------------
function updateForm(person) {

		console.log(this);
		if(person.ID == " ")
			createForm(calledby);
		else {
		$("#dialog1top").html(person.toForm());
		$("#dialog1bottom").html("");
		$("#dialog1").dialog("option", "title", "Person Bearbeiten");
		$( "#dialog1" ).dialog( "option", "buttons", { 
			 "Daten abschicken": function() {updateEntry(); $(this).dialog("close"); } 
			} );
		$("#dialog1").dialog("open");
		}
}
// --------------------------------------------------------------------------------------------
// Aux function: HTML content : search in Database
// called by: Menu entry "Suche in Datenbank" 
// --------------------------------------------------------------------------------------------
function searchInDatabase(calledby) {
	
	var temp = '<input type="text" id="quicksearchinDialog" \
		        size=10></td>';

	$("#dialog1top").html(temp);
	
	// Add Eventhandler 
	switch(calledby){
	case "mainpersonmenu": $("#quicksearchinDialog").on("keyup", function(){quickSearchInDialog("mainpersonmenu");});break;
	case "fathermenu": $("#quicksearchinDialog").on("keyup", function(){quickSearchInDialog("fathermenu");});break;
	case "mothermenu": $("#quicksearchinDialog").on("keyup", function(){quickSearchInDialog("mothermenu");});break;
	default: break;
	}
	$("#dialog1bottom").html(" ");
	$("#dialog1").dialog("option", "title", "Person in Datenbank suchen");
	$( "#dialog1" ).dialog( "option", "buttons", { 
		 "OK": function() {$(this).dialog("close"); } 
		} );
	$("#dialog1").dialog("open");

}
//--------------------------------------------------------------------------------------------
//Aux function: HTML content : partnerRelation Dialog
//called by: setDialogPersonOnclick 
//--------------------------------------------------------------------------------------------
function partnerRelationDialog(person) {

	// Jetzt die Partnerinfo aus der Datenbank abfragen und anzeigen. 
	// Die Felder der Partnerinfo können dann editiert und erweitert werden 
	// Diese werden dann an den Server gegeben, der die Einträge dann neu anlegt. 
	
	var query = "type=p&ID1="+mainPerson.ID+"&ID2="+person.ID;
	
	req.onreadystatechange = function(person){
	
		var temp = "<table border = 2 cellpaddding = 10 align=center>" + mainPerson.toRow() + person.toRow() + "</table>";
		temp += "<H3> W&auml;hle das Verh&auml;ltnis </h3>" ;
		
		
		
		$("#dialog2top").html(temp);
		
		$("#dialog2bottom").html(" ");
		$("#dialog2").dialog("option", "title", "Partner Beziehung setzen");
		$( "#dialog2" ).dialog( "option", "buttons", { 
			 "OK": function() {$(this).dialog("close"); } 
			} );
		$("#dialog2").dialog("open");

	};
	
	
	
}


//--------------------------------------------------------------------------------------------
//Aux function: HTML content : thisPerson2main
//called by: Menu entry "Zweig dieser Person bearbeiten" 
//--------------------------------------------------------------------------------------------
function thisPerson2Main(person) {

	// relevant ist die ID der person die geklickt hat
	// deren Daten werden von der Datenbank geholt und angezeigt
	// F�r diese Person muss Mutter undVater aus der Datenbank geholt werden. 
	init();
	req.onreadystatechange = function() {
		if (req.readyState == 4) {
			// req Status 200 = OK, 404 = page not found
			if (req.status == 200) {
				processXMLResponse();
				var footer = $("#footer2");
				footer.html(listOfPerson.toTable("updateClass"));
				setPersonOnClick();
				mainPerson = listOfPerson.get(0);
				showBranch();
			}
		}
	};
	query = "type=a&ID=" + person.ID;
	req.send(query);
}

// --------------------------------------------------------------------------------------------
// Aux function: Call server with form data from Dialog 
// called by: SearchInDatabase (das ist die Funktion, wenn der Search button im Dialog
//            gedr�ckt wird ) 
// --------------------------------------------------------------------------------------------
function quickSearchInDialog(calledby) {
	// quicksearch ist eine fuzzy search,
	// was die Datenbank nach �hnlichen Nach- und Vornamen durchsucht
	// Die Onclick Aktion ist:
	// die Details der geklickten Person werden oben rechts angezeigt und
	// k�nnen bearbeitet werden
	var query = $("input[id='quicksearchinDialog']"); // Suchtext wird gelesen
	init();
	switch(calledby){
	case "mainpersonmenu": req.onreadystatechange = function(){personListinDialog("mainpersonmenu");};break;
	case "fathermenu":  req.onreadystatechange = function(){personListinDialog("fathermenu");};break;
	case "mothermenu":  req.onreadystatechange = function(){personListinDialog("mothermenu");};break;
	default: break;
	}
	
	req.send("type=q&SURNAME=" + query[0].value + "&PRENAME=" + query[0].value);

}
// --------------------------------------------------------------------------------------------
// Aux function: Call server with form data for quicksearch
// called by: quicksearch field in left menu
// --------------------------------------------------------------------------------------------
function quickSearch() {
	// quicksearch ist eine fuzzy search,
	// wasdie Datenbank nach �hnlichen Nach- und Vornamen durchsucht
	// Die Onclick Aktion ist:
	// die Details der geklickten Person werden oben rechts angezeigt und
	// k�nnen bearbeitet werden
	var query = $("input[name='quicksearch']"); // Suchtext wird gelesen
	init();
	req.onreadystatechange = personList;
	req.send("type=q&SURNAME=" + query[0].value + "&PRENAME=" + query[0].value);

}

// --------------------------------------------------------------------------------------------
// Aux function: Call server with form data from advanced searchForm() 
// called by: advanced search form , triggered by "Personensuche", left menu
// --------------------------------------------------------------------------------------------
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


// --------------------------------------------------------------------------------------------
// Aux function: Call server with form data from Dialog -- create person
// --------------------------------------------------------------------------------------------
function createEntry(calledby) {
	// CallFuntion um einen Eintrag in der Datenbank zu ezeugen.
	// Highlights von Feldern werden zur�ckgenommen
	// Dann wird der http request String aufgebaut
	// $(".green").removeClass("green");

	var query = "type=c";
	for (var i = 1; i < attribute.length; i++) {
		var field = $("input[name='" + attribute[i] + "']");
		if (field[0].value) {
			query += "&" + attribute[i] + "=" + field[0].value;
		}
	}

	// Cleanup the dialog form, so that the input field cannot be referenced
	// anymore
	$("#dialog1top").html(" ");
	init();
	// Schreib doch die callback function hier rein
	req.onreadystatechange = function() {
		// Callbackfunktion f�r create query 
		// der server legt die Person in der datenbank an und fragt zur Kontrolle 
		// den angelgten record wieder ab undschickt ihn alsXML response.
		// die XML response des http requests wird geparsed
		// es muss genau ein Entry zur�ckkommen
		// Es ist aber zu entscheiden, ob die neu angelegte Funktion eine
		// Hauptperson, ein Vater oder eine Mutter ist 

		if (req.readyState == 4) {

			// req Status 200 = OK, 404 = page not found
			if (req.status == 200) {
				processXMLResponse();
				// Unterscheidung der F�lle ob Vater, Mutter angelegt worden ist
				// calledby = 1 , Vater wurde angelegt
				if (calledby != "new" ) {
					var query2 = "type=u";
					if(calledby == "fathermenu") {
					query2 += "&" + "FATHER_ID=" + listOfPerson.get(0).ID + "&ID=" + mainPerson.ID;
					}
					// fall 2: Mutter wurde angelegt: Dann muss die ID, jetzt
					// bei
					// mainperson einegtragen werden
					if (calledby == "mothermenu") {
						query2 += "&" + "MOTHER_ID=" + listOfPerson.get(0).ID
								+ "&ID=" + mainPerson.ID;
					}

					// call server to update database
					// Dann das Resultat als mainperson setzen
					// und showBranch aufrufen
					init();
					req.onreadystatechange = function() {
						if (req.readyState == 4) {
							// req Status 200 = OK, 404 = page not found
							if (req.status == 200) {
								processXMLResponse();
								var footer = $("#footer2");
								footer.html(listOfPerson.toTable("updateClass"));
								setPersonOnClick();
								mainPerson = listOfPerson.get(0);						
								showBranch();
							}
						}
					};
					req.send(query2);
				} else {
					// Das ist der Fall, wo eine eigenst�ndige neue Person angelegt wird
					// ohne das eine Vater / Mutter Beziehung gesetzt werden muss
					var footer = $("#footer2");
					footer.html(listOfPerson.toTable("updateClass"));
					setPersonOnClick();
					mainPerson = listOfPerson.get(0);
					showBranch();
				}
			} // end of create callback status 200
		} // end of create callback status 4
	}; // end of callback for create person
	req.send(query);

}
// --------------------------------------------------------------------------------------------
// Aux function: Call server with form data -- update person
// currently
// --------------------------------------------------------------------------------------------
function updateEntry() {
	// CallFunction um einen Eintrag in der Datenbank zu erneuern.
	// Die Dialogfelder werden ausgelesen 
	// Danach der update request abgefeuert f�r die entsprechende ID abgefeuert 
	// und daraufhin die mainPerson des Branches wieder geholt.
	
	var query = "type=u";
	for (var i = 0; i < attribute.length; i++) {
		var field = $("input[name='" + attribute[i] + "']");
		if (field[0].value) {
			query = query + "&" + attribute[i] + "=" + field[0].value;
		}
	}
	init();
	req.onreadystatechange = function() {
		if (req.readyState == 4) {

			// req Status 200 = OK, 404 = page not found
			if (req.status == 200) {
				// Mit der folgenden Datenbankabfrage jetzt die Hauptperson des
				// branches lesen. Beim update kommt ja die updated Person zur�ck
				// das reicht aber nicht, um den branch aufzubauen
				init();
				req.onreadystatechange = function() {
					if (req.readyState == 4) {

						// req Status 200 = OK, 404 = page not found
						if (req.status == 200) {
							processXMLResponse();
							var footer = $("#footer2");
							footer.html(listOfPerson.toTable("updateClass"));
							setPersonOnClick();
							mainPerson = listOfPerson.get(0);
							showBranch();
						}
					}
				};
				query = "type=a&ID=" + mainPerson.ID;
				req.send(query);
			}
		}
	};

	req.send(query);

}

// --------------------------------------------------------------------------------------------
// Aux function:  set click behavior of rows: called by personList()
// After the result is put into a table, the onclick behviour of rows is set
// --------------------------------------------------------------------------------------------
function setPersonOnClick() {

	var obj = $(".updateClass");
	obj.click(function() {
		var pos = obj.index(this);
		$(".updateClass").removeClass("green");
		$(this).addClass("green");
		mainPerson = listOfPerson.get(pos);
		// showMenu();
		showBranch();
	});
}
//--------------------------------------------------------------------------------------------
//Aux function: set click behavior in a rowof a table in adialog
//called by: personListInDialog()
//After the result is put into a table, the onclick behavior of rows is set
//--------------------------------------------------------------------------------------------
function setDialogPersonOnClick(calledby) {
	// alle rows in einer table in einem dialog sind von der Klasse dialogUpdateClass.
	var obj = $(".dialogUpdateClass");
	obj.click(function() {
		var pos = obj.index(this);
		// die ausgew�hlte Reihe wird highlighted
		$(".dialogUpdateClass").removeClass("green");
		$(this).addClass("green"); 
		// Hier muss jetzt der code rein, wo die ausgew�hlte Person 
		// Denn jetzt in der Branch view hinplatziert werden soll
		// Case 0: mainperson Menu: Option "anderer Zweig bearbeiten" 
		//         die ausgew�hlte Person wird geladen, als mainPerson gesetzt und angezeigt 
		// case 1: Father Menu: die ausgew�hlte Person wird als Vater  der mainPerson aktualisiert
		// 					die aktualisierte mainPerson wirdvom server zur�ckgegeben und angezeigt
		// case 2  Mother Menu: die ausgew�hlte Person wird als Mutter der mainPerson aktualisiert
		//					die aktualisierte mainPerson wirdvom server zur�ckgegeben und angezeigt
	
		if (calledby == "mainpersonmenu") {
			mainPerson = listOfPerson.get(pos);
			var footer = $("#footer2");
			// listOfPerson.clear();
			// listOfPerson.push(mainPerson);
			var temp = "<table border = 2 cellpaddding = 10 align=center>";
			temp += personListHeader() + mainPerson.toRow("updateClass")
					+ "</table>";
			footer.html(temp);
			setPersonOnClick();
			showBranch();
		} else 
			if(calledby == 3)
			{
				partnerRelationDialog(listOfPerson.get(pos));
			}
			else
				{
			var query2 = "type=u";
			if (calledby == "fathermenu") {
				query2 += "&" + "FATHER_ID=" + listOfPerson.get(pos).ID
						+ "&ID=" + mainPerson.ID;
			}
			if (calledby == "mothermenu") {
				query2 += "&" + "MOTHER_ID=" + listOfPerson.get(pos).ID
						+ "&ID=" + mainPerson.ID;
			}
			// Jetzt muss diese ID bei der mainPerson als Parent
			// eingetragen werden
			init();
			req.onreadystatechange = function() {
				if (req.readyState == 4) {
					// req Status 200 = OK, 404 = page not found
					if (req.status == 200) {
						processXMLResponse();
						var footer = $("#footer2");
						footer.html(listOfPerson.toTable("updateClass"));
						setPersonOnClick();
						mainPerson = listOfPerson.get(0);
						showBranch();
					}
				}
			};
			req.send(query2);
		}
		; // end of else condition: edit of father or mother set
	}); // end of object.click function
} // end of callback setDialogPersonOnClick()


//--------------------------------------------------------------------------------------------
//Aux function: callback function personList
//called by: quicksearch()  and advancedSearch()
//After the result is put into a table, the onclick behviour of rows is set
//--------------------------------------------------------------------------------------------
function personList() {
	// Callbackfunktion f�r die Suchanfragen an die Datenbank
	// Eine Suchanfrage liefert immer eine Liste von Personen, die sich f�r die
	// Suche qualifiziert haben, zur�ck
	// die XML response des http requests wird geparsed
	// und die Resultatliste der Personen aufgebaut.
	// Das Ergebnis wird als Tabelle unten hingeschrieben.
	// danach wird die Onclick Aktion gesetzt.
	if (req.readyState == 4) {
		// req Status 200 = OK, 404 = page not found
		if (req.status == 200) {
			processXMLResponse(); // parse XML response, generate list of persons
			var footer = $("#result");
			footer.html(listOfPerson.toTable("updateClass"));
			// set click behavior of table rows
			setPersonOnClick();
		}
	}
}
//--------------------------------------------------------------------------------------------
//Aux function: callback function personListinDialog
//called by: 
//After the result is put into a table, the onclick behaviour of rows is set
//--------------------------------------------------------------------------------------------
function personListinDialog(calledby) {
	// Callbackfunktion f�r die Suchanfragen an die Datenbank
	// Eine Suchanfrage liefert immer eine Liste von Personen, die sich f�r die
	// Suche qualifizieren, zur�ck
	// die XML response des http requests wird geparsed
	// und die Resultatliste der Personen aufgebaut.
	// Das Ergebnis wird als Tabelle unten hingeschrieben.
	// danach wird die Onclick Aktion gesetzt.
	
	if (req.readyState == 4) {
		// req Status 200 = OK, 404 = page not found
		if (req.status == 200) {
			processXMLResponse();
			var footer = $("#dialog1bottom");
			footer.html(listOfPerson.toTable("dialogUpdateClass"));
			// Das click behavior im Dialog ist anders als bei einer quicksearch oder advancedsearch
			setDialogPersonOnClick(calledby);  
		}
	}
}

//--------------------------------------------------------------------------------------------
//Aux function: processXMLResponse()
//called by: various callback function
//Purpose: parse the server's XML response and generate the list of person objects
//--------------------------------------------------------------------------------------------
function processXMLResponse() {
	listOfPerson.clear(); // clear existing list of objects 
	$("#menu2").html(""); // reset the menus for the tree viewson the left side 
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
				person = new Person(node1, 0);
				listOfPerson.push(person);
			}
		}
	}
}


//--------------------------------------------------------------------------------------------
//Aux function: descendantTree() 
//Called by: showMenu() Option "Nachfahren als Baum anzeigen"
//gets all descendants from server and displays the tree view 
//--------------------------------------------------------------------------------------------
function descendantTree() {

	var query = "type=d&ID=" + mainPerson.ID;
	init();
	req.onreadystatechange = function() {
		if (req.readyState == 4) {
			// req Status 200 = OK, 404 = page not found
			if (req.status == 200) {
				processXMLResponse();
				var footer = $("#footer2");
				footer.html(listOfPerson.toTable("updateClass"));
				mainPerson = listOfPerson.get(0);
				setPersonOnClick();
				displayDescendantTree();
			}
		}
	};
	req.send(query);

}
//--------------------------------------------------------------------------------------------
//Aux function: ancestorTree() 
//Called by: showMenu() Option "Vorfahren als Baum anzeigen"
//gets all ancestors from server and displays the tree view 
//--------------------------------------------------------------------------------------------
function ancestorTree() {

	var query = "type=t&ID=" + mainPerson.ID;
	init();
	req.onreadystatechange = function() {
		processXMLResponse();
		var footer = $("#footer2");
		footer.html(listOfPerson.toTable("updateClass"));
		mainPerson = listOfPerson.get(0);
		setPersonOnClick();
		displayAncestorTree();
	};
	req.send(query);

}
//--------------------------------------------------------------------------------------------
//Aux function: displayDescendantTree() 
//Called by: descendantTree()
// D3 function generating the svg grafic 
//--------------------------------------------------------------------------------------------
function displayDescendantTree() {

	$("#dialog1top").html("");
	$("#dialog1bottom").html("");
	var maxNumOfMembers = Math.max.apply(null, numOfLevelMembers);
	console.log("maxNum of members = ",maxNumOfMembers );
	var width = maxNumOfMembers*280 - margin.right - margin.left;
	var height = numOfLevelMembers.length * 200 - margin.top - margin.bottom;

	var i = 0;

	var tree = d3.layout.tree().size([ width, height ]);

	var diagonal = d3.svg.diagonal().projection(function(d) {
		return [ d.x, d.y ];
	});

	var svg = d3.select("#dialog1top").append("svg").attr("width",
			width + margin.right + margin.left).attr("height",
			height + margin.top + margin.bottom)
			.append("g")
			.attr("transform","translate(" + margin.left + "," + margin.top + ")");

	root = mainPerson;

	// Compute the new tree layout.
	var nodes = tree.nodes(root).reverse(), links = tree.links(nodes);

	// Normalize for fixed-depth.
	nodes.forEach(function(d) {
		d.y = d.depth * 200;
	});

	// Declare the nodes
	var node = svg.selectAll("g.node").data(nodes, function(d) {
		return d.id || (d.id = ++i);
	});

	// Enter the nodes.
	var nodeEnter = node.enter().append("g").attr("class", "node").attr("fill",
			"white").attr("transform", function(d) {
		return "translate(" + (d.x - 50) + "," + (d.y) + ")";
	});

	nodeEnter.append("rect") // attach a rectangle
	.attr("width", 100).attr("height", 100).attr("rx", 10).attr("ry", 10).attr(
			"fill", "Darkgreen");

	nodeEnter.append("text").attr("dy", "2em").attr("dx", 50).attr(
			"text-anchor", "middle").text(function(d) {
		return d.PRENAME;
	}).style("fill-opacity", 1);
	nodeEnter.append("text").attr("dy", "3em").attr("dx", 50).attr(
			"text-anchor", "middle").text(function(d) {
		return d.SURNAME;
	}).style("fill-opacity", 1);
	nodeEnter.append("text").attr("dy", "4.5em").attr("dx", 50).attr(
			"text-anchor", "middle").text(function(d) {
		return d.BIRTHDAY;
	}).style("fill-opacity", 1);

	// Declare the links
	var link = svg.selectAll("path.link").data(links, function(d) {
		return d.target.id;
	});

	// Enter the links.
	link.enter().insert("path", "g").attr("class", "link").attr("d", diagonal);

	$("#dialog1").dialog("option", "title", "Baum der Nachfahren");
	$( "#dialog1" ).dialog( "option", "buttons", { 
		 "OK": function() {$(this).dialog("close"); } 
		} );
	$("#dialog1").dialog("open");
}
//--------------------------------------------------------------------------------------------
//Aux function: displayAncestorTree() 
//Called by: ancestorTree()
//D3 function generating the svg grafic 
//--------------------------------------------------------------------------------------------
function displayAncestorTree() {

	$("#dialog1top").html("");
	$("#dialog1bottom").html("");
	
	var maxNumOfMembers = Math.max.apply(null, numOfLevelMembers);
	var width = maxNumOfMembers*300 - margin.right - margin.left;
	var height = numOfLevelMembers.length * 200 - margin.top - margin.bottom;

	var i = 0;

	var tree = d3.layout.tree().size([ width, height ]);

	var diagonal = d3.svg.diagonal().projection(function(d) {
		return [ d.x, height - d.y - 100 ];
	});

	var svg = d3.select("#dialog1top").append("svg").attr("width",
			width + margin.right + margin.left).attr("height",
			height + margin.top + margin.bottom).append("g").attr("transform",
			"translate(" + margin.left + "," + margin.top + ")");

	root = mainPerson;

	// Compute the new tree layout.
	var nodes = tree.nodes(root).reverse(), links = tree.links(nodes);

	// Normalize for fixed-depth.
	nodes.forEach(function(d) {
		d.y = d.depth * 200;
	});

	// Declare the nodes
	var node = svg.selectAll("g.node").data(nodes, function(d) {
		return d.id || (d.id = ++i);
	});

	// Enter the nodes.
	var nodeEnter = node.enter().append("g").attr("class", "node").attr("fill",
			"white").attr("transform", function(d) {
		return "translate(" + (d.x - 50) + "," + (height - d.y - 100) + ")";
	});

	nodeEnter.append("rect") // attach a rectangle
	.attr("width", 100).attr("height", 100).attr("rx", 10).attr("ry", 10).attr(
			"fill", "Darkgreen");

	nodeEnter.append("text").attr("dy", "2em").attr("dx", 50).attr(
			"text-anchor", "middle").text(function(d) {
		return d.PRENAME;
	}).style("fill-opacity", 1);
	nodeEnter.append("text").attr("dy", "3em").attr("dx", 50).attr(
			"text-anchor", "middle").text(function(d) {
		return d.SURNAME;
	}).style("fill-opacity", 1);
	nodeEnter.append("text").attr("dy", "4.5em").attr("dx", 50).attr(
			"text-anchor", "middle").text(function(d) {
		return d.BIRTHDAY;
	}).style("fill-opacity", 1);

	// Declare the links
	var link = svg.selectAll("path.link").data(links, function(d) {
		return d.target.id;
	});

	// Enter the links.
	link.enter().insert("path", "g").attr("class", "link").attr("d", diagonal);

	$("#dialog1").dialog("option", "title", "Baum der Vorfahren");
	$( "#dialog1" ).dialog( "option", "buttons", { 
		 "OK": function() {$(this).dialog("close"); } 
		} );
	$("#dialog1").dialog("open");
}


//--------------------------------------------------------------------------------------------
//Aux function: showBranch()
//--------------------------------------------------------------------------------------------

function showBranch(){
	
	// Jetzt muss das upper_right div Elemnt mit der default Ansicht eines Zweiges gefüllt werden 
	var tempString = ' \
	<H1>Familienzweig von ' + mainPerson.PRENAME + ' ' + mainPerson.SURNAME + '</H1><p>  \
	<div id=parents> \
	 <div class=container id=fathercontainer>Vater \
	  <div class=panel id=father></div> \
	 </div> \
	 <div class=container id=mothercontainer>Mutter\
	   <div class=panel id=mother></div>\
	 </div> \
	</div> \
	<div id=personandpartner> \
	<div class=container id=mainpersoncontainer>\
		<div class=panel  id=mainperson></div>	\
	</div> \
	<img id=partnerlink src=rings.png> \
	<div class=panel id=partner>Partner</div> \
	</div> \
	</div> \
	';
	$("#upper_right").html(tempString);
	
	
	
	$(".panel").on("mouseover", function(e){
		var element = e.target;
		var menuid = "#" + element.id + "menu" ;
		var filter = ".submenu:not('"+ menuid +"')";
		$(filter).hide();
		
		var selectedPanel = "#"+element.id;	
		var deselectedPanel =".panel:not('"+ element.id+"')";
		$(deselectedPanel).css("background-color","green");
		$(selectedPanel).css("background-color","sienna");
	
		$(menuid).css("background-color","sienna");
		$(menuid).show();
	
	
	});
	
	if(mainPerson.father.ID ==" "){
		$("#editfather").hide();
		$("#father2main").hide();
	}
	
	else
	{
		$("#father2show").hide();
		$("#editfather").show();
		$("#editfather").on("click",function(e){
		updateForm(mainPerson.father);
		});
	}
		
	// Panels mit Daten füllen 
	$("#father").html(mainPerson.father.PRENAME+ "<br>" + mainPerson.father.SURNAME +"<br>" + mainPerson.father.BIRTHDAY +"<br>" + mainPerson.father.LASTPROFESSION);
	$("#mother").html(mainPerson.mother.PRENAME+"<br> " + mainPerson.mother.SURNAME + "<br> " + mainPerson.mother.BIRTHDAY + "<br> " + mainPerson.mother.LASTPROFESSION);
	$("#mainperson").html(mainPerson.PRENAME+"<br> " + mainPerson.SURNAME + "<br> " + mainPerson.BIRTHDAY + "<br> " + mainPerson.LASTPROFESSION);
	$("#partner").html(mainPerson.partner.PRENAME+"<br> " + mainPerson.partner.SURNAME + "<br> " + mainPerson.partner.BIRTHDAY + "<br> " + mainPerson.partner.LASTPROFESSION);
	
	// Die Panel-width passt sich dem Text an, daher müssen jetzt die Verbindungslinien justiert werden 
	// momentan wird nur das Vaterpanel herangezogen. 
	// Das default Vaterpanel hat eine Länge von 172px. dazu gehört die Länge von 86px der Linie1. Zunächst werden die aktuelle Länge des Vaterpanels bestimmt
	// Danach die Linie1 justiert. Das reicht, denn linie2 fügt sich automatisch richtig ein durch floating layout. 
	var parentWidth = $("#fathercontainer").outerWidth(true);
	var diff = 172-parentWidth;
	$("#line1").outerWidth(diff+86);
	// Die vertikale Linie 3 muss auch justiert werden . Linie 4 fügt sich richtig einaufgrund des floating layouts. 
	$("#line3").css({"margin-left": diff +86-5});
	
	// $("#partner").html("parentWidth: "+ parentWidth +  "New lineWidth: " + $("#line1").outerWidth());
	
	
	
}

// --------------------------------------------------------------------------------------------
// Init function after document.ready() -- initialize the dialogs
// --------------------------------------------------------------------------------------------
$(function() {
	$("#dialog1").dialog({
		position : {
			my : "left+10 top+10",
			at : "left top",
			of : "#header"
		},
		height : "auto",
		width : "auto",
		dialogClass : "mydiag",
		autoOpen : false,
		modal : true,
		buttons : {
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
