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

// Das sind Menudaten aus der Branchview. 
// Damit ist gespeichert was gedr�ckt wurde
// MenuData ist Teil des Objektes Person. 
var MenuData = function() {
	// display ist true, wenn menu angezeigt wird. Nochmaliges clicken setzt den 
	// den Wert wieder auf false. Dasmenu wird gel�scht. 
	this.display = false;
	// click speichert, ob irgendwas im Menu gew�hlt wurde 
	this.clicked = false;

};


function resetMenuData() {
	mainPerson.menu.display = false; 
	mainPerson.father.menu.display = false;
	mainPerson.mother.menu.display = false;
	mainPerson.menu.clicked = false; 
	mainPerson.father.menu.clicked = false;
	mainPerson.mother.menu.clicked = false;
};

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
		// Anchor: In dieser struktur werden Ankerpunkte
		// sowie widht and height f�r die Person definiert
		// Das wird in der branch view verwendet. 
		"anchor" : {
			set : function(val) {
				this._anchor = val;
			},
			get : function() {
				return this._anchor;
			}
		},
		// menu: Hier wird f�r die branchview gespeochert. was ein Benutzer 
		// gedr�ckt hat, siehe MenuData
		"menu" : {
			set : function(val) {
				this._menu = val;
			},
			get : function() {
				return this._menu;
			}
		},
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
	// hier werden neue MenuDaten angelegt
	this._menu = new MenuData();
	
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
	} else
		this.mother = new EmptyPerson();
	
	
	// Hier kommt der aktuelle Partner rein 
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

	Object
			.defineProperties(
					this,

					{

						"anchor" : {
							set : function(val) {
								this._anchor = val;
							},
							get : function() {
								return this._anchor;
							}
						},
						"menu" : {
							set : function(val) {
								this._menu = val;
							},
							get : function() {
								return this._menu;
							}
						},
					});

	for (key in attribute)
		this[attribute[key]] = " ";
	this.PRENAME = "unbekannt";
	this.SURNAME = "";
	this.LASTPROFESSION = "anklicken";
	this.menu = new MenuData();
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

	var temp = "<H2> Personensuche </H2> <table>";
	for (var i = 0; i < attribute.length; i++) {
		temp += "<tr><td>" + label[i] + "</td><td><input type=text name="
				+ attribute[i] + " size=20></td></tr>";
	}
	context = "person";
	temp += '</table><input type=button value=Suche onclick="advancedSearch()">';

	document.getElementById('upper_right').innerHTML = temp;

}
// --------------------------------------------------------------------------------------------
// Aux function: HTML content : createForm: form for the create Dialog
// called by: "Neuer Zweig" Menu entry , 
// called by: createOrEditPerson() -- triggered by Menu entry "Person bearbeiten" if 
// 			  person isnot defined yet. 
// --------------------------------------------------------------------------------------------
function createForm() {

	// $("#upper_right").html("");
	$("#dialog1bottom").html("");

	var temp = "<table>";
	
	// Create fields for the attributes: 
	// The first Element is the ID field - we skip this , the id is defined by

	for (var i = 1; i < attribute.length; i++) {
		temp += "<tr><td>" + label[i]
				+ "</td><td><input  class=updateform type=text name="
				+ attribute[i] + " size=20></td></tr>";
	}
	temp += '</table>'; // <input type=button value=create
						// onclick="createEntry()">';

	$("#dialog1top").html(temp);
	$("#dialog1").dialog("option", "title", "Neue Person anlegen");
	$( "#dialog1" ).dialog( "option", "buttons", { 
		 "Person anlegen": function() { createEntry(); $(this).dialog("close"); } 
		} );
	

	$("#dialog1").dialog("open");

}
// --------------------------------------------------------------------------------------------
// Aux function: HTML content : edit or create person
// called by: Menu entry "Person bearbeiten" in branch view 
// --------------------------------------------------------------------------------------------
function editOrCreatePerson(person) {


	// wenn empty Person, call the create Person Dialog
	if (person.ID == " ") {
		createForm();
	}

	// otherwise , prepare dialog for person's update
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
function searchInDatabase(person) {
	
	var temp = '<input type="text" name="quicksearchindialog" \
		        size=10 onkeyup=quickSearchInDialog() ></td>';

	$("#dialog1top").html(temp);
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
function quickSearchInDialog() {
	// quicksearch ist eine fuzzy search,
	// was die Datenbank nach �hnlichen Nach- und Vornamen durchsucht
	// Die Onclick Aktion ist:
	// die Details der geklickten Person werden oben rechts angezeigt und
	// k�nnen bearbeitet werden
	var query = $("input[name='quicksearchindialog']"); // Suchtext wird gelesen
	init();
	req.onreadystatechange = personListinDialog;
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
function createEntry() {
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
				if (mainPerson != null
						&& (mainPerson.father.menu.clicked == true || mainPerson.mother.menu.clicked == true)) {
					var query2 = "type=u";
					// fall 1: vater wurde angelegt: Dann muss die ID, jetzt bei
					// mainperson einegtragen werden
					if (mainPerson.father.menu.clicked == true) {
						query2 += "&" + "FATHER_ID=" + listOfPerson.get(0).ID
								+ "&ID=" + mainPerson.ID;
					}
					// fall 2: Mutter wurde angelegt: Dann muss die ID, jetzt
					// bei
					// mainperson einegtragen werden
					if (mainPerson.mother.menu.clicked == true) {
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
								footer
										.html(listOfPerson
												.toTable("updateClass"));
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
		showMenu();
		showBranch();
	});
}
//--------------------------------------------------------------------------------------------
//Aux function: set click behavior in a rowof a table in adialog
//called by: personListInDialog()
//After the result is put into a table, the onclick behavior of rows is set
//--------------------------------------------------------------------------------------------
function setDialogPersonOnClick() {
	// alle rows in einer table in einem dialog sind von der Klasse dialogUpdateClass.
	var obj = $(".dialogUpdateClass");
	obj.click(function() {
		var pos = obj.index(this);
		// die ausgew�hlte Reihe wird highlighted
		$(".dialogUpdateClass").removeClass("green");
		$(this).addClass("green"); 
		// Hier muss jetzt der code rein, wo die ausgew�hlte Person 
		// Denn jetzt in der Branch view hinplatziert werden soll
		// Case 1: mainperson Menu: Option "anderer Zweig bearbeiten" 
		//         die ausgew�hlte Person wird geladen, als mainPerson gesetzt und angezeigt 
		// case 2: Father Menu: die ausgew�hlte Person wird als Vater  der mainPerson aktualisiert
		// 					die aktualisierte mainPerson wirdvom server zur�ckgegeben und angezeigt
		// case 3  Mother Menu: die ausgew�hlte Person wird als Mutter der mainPerson aktualisiert
		//					die aktualisierte mainPerson wirdvom server zur�ckgegeben und angezeigt
		if (mainPerson.menu.clicked == true) {
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
			if(mainPerson.partner.menu.clicked == true)
			{
				partnerRelationDialog(listOfPerson.get(pos));
			}
			else
				{
			var query2 = "type=u";
			if (mainPerson.father.menu.clicked == true) {
				query2 += "&" + "FATHER_ID=" + listOfPerson.get(pos).ID
						+ "&ID=" + mainPerson.ID;
			}
			if (mainPerson.mother.menu.clicked == true) {
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
			var footer = $("#footer2");
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
function personListinDialog() {
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
			setDialogPersonOnClick();  
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
// --------------------------------------------------------------------------------------------
// Aux function: Additional Menu on the left side for tree views
// --------------------------------------------------------------------------------------------
//
function showMenu() {
	var temp = '<table class=coolmenu cellpadding=10> \
				<tr><td  onmouseover="movein(this)" onmouseout=\
						"moveout(this)" onclick="ancestorTree()">Vorfahren als Baum anzeigen</td>\
				</tr>\
				<tr><td onmouseover="movein(this)" onmouseout="moveout(this)" onclick=\
				"searchForm()">Vorfahren als Schalen anzeigen</td></tr>\
				<tr><td onmouseover="movein(this)" onmouseout="moveout(this)" onclick=\
				"descendantTree()">Nachfahren als Baum  zeigen</td></tr></table>';
	$("#menu2").html(temp);
	
	$("#coolmenu").height(120);
	temp = '<button class=option  onclick="createForm()">Neuen Zweig erstellen</button> \
			<button class=option  onclick="searchForm()">Person suchen</button> \
			<button class=option>Hilfe</button>	\
			<button class=option onclick="ancestorTree()">Baum der Vorfahren</button> \
			<button class=option  onclick="descendantTree()">Baum der Nachfahren</button>';
			
	$("#coolmenu").html(temp);
			

};

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

// --------------------------------------------------------------------------------------------
// Aux function: D3 Grafics, Anchor point
// Anchors are used in the branch view
// --------------------------------------------------------------------------------------------
//
// Konstruktor f�r das Anchor Objekt
//
var Anchor = function(x, y, width, height) {

	this.right = x;
	this.left = x+width;
	this.center = x+width/2;
	
	this.top = y;
	this.middle = y+height/2;
	this.bottom = y+ height;
	
	this.width = width; 
	this.height = height;
};
// --------------------------------------------------------------------------------------------
// Aux function: D3 grafics, Append Menu
// append father and mother submenu in branch view
// --------------------------------------------------------------------------------------------
function appendMenu(panel, person) {

	// Test, ob das menu noch in das Window passt
	// by default wird das Menu rechts unten verschoben zum Person panel
	// angezeigt
	// der Schatten des Men�s ist um 55px verschoben
	// Wenn das nicht geht, wird das Men� nach links unten verschoben
	var dx = 50;
	var dy = 50;
	if (person.anchor.left + person.anchor.width + 55 >= width)
		dx = -50;
	// Zuerst den Schatten einf�gen
	// er ist nochmal um 5 nach rechts und nach unten veschoben
	var group = panel.append("g").attr("id", "gmenu").attr("transform",
			"translate(" + dx + "," + dy + ")");

	group.append("rect").attr("class", "panel").attr("width", 220).attr(
			"height", person.anchor.height).attr("x", +5).attr("y", 5).attr(
			"fill", "grey");
	// Jetzt das Men� panel einf�gen
	group.append("rect").attr("class", "panel").attr("width", 220).attr(
			"height", person.anchor.height).attr("fill", "sienna");
	// Hier kommt die Textbox f�r das Men�
	// Schade dass hier nicht em als Einheit genommen werden kann
	var textbox = group.append("g").attr("class", "menu").attr("transform",
			"translate(" + (fontSize) + "," + (fontSize * 2) + ")")

	.style("font-size", fontSize + "px").style("fill", "white");
	// F�r die erste Menuezeile wird das Hintergrundrechteck eingef�gt
	// Die Farbe richtet sich nach dem, ob der Men�punkt selected ist
	textbox.append("rect").style("fill", function() {
		return (person.menu.edit) ? "black" : "grey";
	}).style("stroke", "black").attr("width", 200).attr("height", 2 * fontSize)
			.attr("y", -fontSize - 5).attr("x", -5);
	// hier kommt der text mit den highlight Functionen mouseover und mouseout
	textbox.append("text").style("cursor", "pointer").text(
			"Diese Person bearbeiten")
	/*
	 * .on("mouseover", function() { if(person.menu.edit == false){
	 * person.menu.edit = true; showBranch(); } }).on("mouseout", function() {
	 * if(person.menu.edit == true){ person.menu.edit = false; showBranch(); } })
	 */
	.on("click", function() {
		person.menu.clicked = true;
		editOrCreatePerson(person);
	});
	// F�r die zweite Menuezeile wird das Hintergrundrechteck eingef�gt
	// Die Farbe richtet sich nach dem, ob der Men�punkt selected ist
	textbox.append("rect").style("fill", function() {
		return (person.menu.search) ? "black" : "grey";
	}).style("stroke", "black").attr("width", 200).attr("height", 2 * fontSize)
			.attr("y", 1 * fontSize - 5).attr("x", -5);
	// hier kommt der text mit den highlight Functionen mouseover und mouseout
	textbox.append("text").style("cursor", "pointer").attr("dy", "2.0em").text(
			"In Datenbank suchen")
	/*
	 * .on("mouseover", function() { person.menu.search = true; showBranch();
	 * }).on("mouseout", function() { person.menu.search = false; showBranch(); })
	 */
	.on("click", function() {
		person.menu.clicked = true;
		searchInDatabase(person);
	});
	// Dritte Men�zeile einf�gen
	textbox.append("rect").style("fill", function() {
		return (person.menu.branch) ? "black" : "grey";
	}).style("stroke", "black").attr("width", 200).attr("height", 2 * fontSize)
			.attr("y", 3 * fontSize - 5).attr("x", -5);
	// hier kommt der text mit den highlight Functionen mouseover und mouseout
	textbox.append("text").style("cursor", "pointer").attr("dy", "4.0em").text(
			"Zweig dieser Person bearbeiten")

	// .on("mouseover", movein(this))
	// .on("mouseout", moveout(this))

	.on("click", function() {
		person.menu.clicked = true;
		thisPerson2Main(person);
	});

}
//--------------------------------------------------------------------------------------------
//Aux function: D3 grafics, Append Menu
//append mainPerson's submenu in branch view
//--------------------------------------------------------------------------------------------
function appendMainPersonMenu(panel, person) {

	// Test, ob das Menu noch in das Window passt
	// by default wird das Menu rechts unten verschoben zum Person panel
	// angezeigt
	// der Schatten des Men�s ist um 55px verschoben
	// Wenn das nicht geht, wird das Men� nach links unten verschoben
	var dx = 50;
	var dy = 50;
	if (person.anchor.x + person.anchor.width + 55 >= width)
		dx = -50;
	// Zuerst den Schatten einf�gen
	// er ist nochmal um 5 nach rechts und nach unten veschoben
	var group = panel.append("g").attr("id", "gmenu").attr("transform",
			"translate(" + dx + "," + dy + ")");

	group.append("rect").attr("class", "panel").attr("width", 220).attr(
			"height", person.anchor.height).attr("x", 5).attr("y", 5).attr(
			"fill", "grey");
	// Jetzt das Men� panel einf�gen
	group.append("rect").attr("class", "panel").attr("width", 220).attr(
			"height", person.anchor.height).attr("fill", "sienna");
	// Hier kommt die Textbox f�r das Men�
	// Schade dass hier nicht em als Einheit genommen werden kann
	var textbox = group.append("g").attr("class", "menu").attr("transform",
			"translate(" + (fontSize) + "," + (fontSize * 2) + ")")

	.style("font-size", fontSize + "px").style("fill", "white");
	// F�r die erste Menuezeile wird das Hintergrundrechteck eingef�gt
	// Die Farbe richtet sich nach dem, ob der Men�punkt selected ist
	textbox.append("rect").style("fill", function() {
		return (person.menu.edit) ? "black" : "grey";
	}).style("stroke", "black").attr("width", 200).attr("height", 2 * fontSize)
			.attr("y", -fontSize - 5).attr("x", -5);
	// hier kommt der text mit den highlight Functionen mouseover und mouseout
	textbox.append("text").style("cursor", "pointer").text(
			"Diese Person bearbeiten")
	/*
	 * .on("mouseover", function() { if(person.menu.edit == false){
	 * person.menu.edit = true; showBranch(); } }).on("mouseout", function() {
	 * if(person.menu.edit == true){ person.menu.edit = false; showBranch(); } })
	 */
	.on("click", function() {
		person.menu.clicked = true;
		editOrCreatePerson(person);
	});
	// F�r die zweite Menuezeile wird das Hintergrundrechteck eingef�gt
	// Die Farbe richtet sich nach dem, ob der Men�punkt selected ist
	textbox.append("rect").style("fill", function() {
		return (person.menu.search) ? "black" : "grey";
	}).style("stroke", "black").attr("width", 200).attr("height", 2 * fontSize)
			.attr("y", 1 * fontSize - 5).attr("x", -5);
	// hier kommt der text mit den highlight Functionen mouseover und mouseout
	textbox.append("text").style("cursor", "pointer").attr("dy", "2.0em").text(
			"Anderen Zweig bearbeiten")
	/*
	 * .on("mouseover", function() { person.menu.search = true; showBranch();
	 * }).on("mouseout", function() { person.menu.search = false; showBranch(); })
	 */
	.on("click", function() {
		person.menu.clicked = true;
		searchInDatabase(person);
	});

}

// --------------------------------------------------------------------------------------------
// Aux function: D3 Grafics, create a person's panel for showbranch
// --------------------------------------------------------------------------------------------
function createPanel(panel, person) {
	panel.append("rect") // Jetzt das Rechteck einf�gen
	.attr("width", person.anchor.width).attr("height", person.anchor.height)
			.attr("rx", 10).attr("ry", 5).on("click", function() {
				var temp = person.menu.display;
				// remove menus
				resetMenuData();
				d3.selectAll("#gmenu").remove();
				person.menu.display = !temp;
				if (person.menu.display == true) {
					if (person == mainPerson)
						appendMainPersonMenu(panel, mainPerson);
					else
						appendMenu(panel, person);
				}
			}).attr("fill", "Darkgreen");

	var textbox = panel.append("g") // textbox hinzuf�gen
	.attr("transform", "translate(" + fontSize + "," + (fontSize * 2) + ")") // Schade
	// dass
	// hier
	// em
	// nicht
	// geht
	.style("font-size", fontSize + "px").style("fill", "white");
	textbox.append("text").text(person.PRENAME);
	textbox.append("text").attr("dy", "1.5em").text(person.SURNAME);
	textbox.append("text").attr("dy", "3.0em").text(person.LASTPROFESSION);
	panel.attr("transform", "translate(" + person.anchor.right + ","
			+ person.anchor.top + ")");
	return;
}
var zaehler = 0;
// --------------------------------------------------------------------------------------------
// Aux function: D3 Grafics, showBranch(number)
// --------------------------------------------------------------------------------------------
function showBranch() {
	
	// we draw a new branch , reset the menu options
	resetMenuData();

	$("#upper_right").html("");
	if (mainPerson == undefined)
		console.log("ShowBranch undefined mainPerson" + (zaehler));
	var holder = d3.select("#upper_right") // select the 'upper right' element
	.append("svg") // Grafik Element in upper_right platzieren
	.attr("width", width + margin.left + margin.right).attr("height",
			height + margin.top + margin.bottom)
	.attr("class", "chart")
	.append("g") // im Grafik element eine Gruppe platzieren, dieses wird an 	// holder zur�ckgegeben
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	// Anchorpoints und Ma�e ausrechnen f�r die Linien
	// und f�r die Platzierung der Panels

	var panelWidth = 20 * fontSize * .5;
	var panelHeight= (4 + 3.4) * fontSize;
	
	mainPerson.anchor =  new Anchor(0.5 * width-panelWidth/2, 0.4 * height - panelHeight / 2, panelWidth, panelHeight);
	mainPerson.father.anchor = new Anchor(0, 0, panelWidth,panelHeight);
	mainPerson.mother.anchor = new Anchor(width-panelWidth, 0, panelWidth, panelHeight);
	mainPerson.partner.anchor = new Anchor(0.5 * width-panelWidth/2, 0.4 * height + panelHeight, panelWidth, panelHeight);

	// Hier die Linien zeichnen, damit sie unter den Menu panels liegen
	// ==================================================================
	holder
			.append("polyline")
			.style("stroke", "grey")
			.style("fill", "none")
			.attr(
					"points",
					(mainPerson.father.anchor.left)+ ","+ (mainPerson.father.anchor.middle)
							+ ","
							+ (mainPerson.anchor.center-10) + "," + (mainPerson.father.anchor.middle)
							+ ","
							+ (mainPerson.anchor.center-10) + "," + mainPerson.anchor.top);
	holder
			.append("polyline")
			.style("stroke", "grey")
			.style("fill", "none")
			.attr(
					"points",
					(mainPerson.mother.anchor.right) + ","+ (mainPerson.mother.anchor.middle)
							+ ","
							+ (mainPerson.anchor.center+10)+ ","	+ (mainPerson.mother.anchor.middle)
							+ ","
							+ (mainPerson.anchor.center+ 10) + "," + mainPerson.anchor.middle);

	holder
	.append("polyline")
	.style("stroke", "grey")
	.style("fill", "none")
	.attr(
			"points",
			(mainPerson.anchor.center) + ","+ (mainPerson.anchor.bottom)
					+ ","
					+ (mainPerson.anchor.center)+ ","	+ (mainPerson.partner.anchor.top));
	// Jetzt die panels zeichnen f�r Person, vater und Mutter
	// falls menu == true ist, dann auch menue zeichnen
	// =================================================================
		
	// Panel f�r die Hauptperson
	var panel = holder.append("g");
	createPanel(panel, mainPerson);
	// Panel f�r den Vater der Person
	panel = holder.append("g");
	createPanel(panel, mainPerson.father);
	// �berschrift "Vater" setzen
	panel.append("text").attr("dx", panelWidth / 2).attr("dy", -10).attr(
			"font-style", "italic").attr("text-anchor", "middle").text("Vater");
	panel = holder.append("g");
	createPanel(panel, mainPerson.mother);
	// �berschrift "Mutter"
	panel.append("text").attr("dx", panelWidth / 2).attr("dy", -10).attr(
			"font-style", "italic").attr("text-anchor", "middle")
			.text("Mutter");
	panel = holder.append("g");
	createPanel(panel, mainPerson.partner);
	// �berschrift "Partner"
	panel.append("text").attr("dy", -10).attr(
			"font-style", "italic").attr("text-anchor", "left")
			.text("Partner");
	
}

// --------------------------------------------------------------------------------------------
// Init function after document.ready() -- initialize the dialogs
// --------------------------------------------------------------------------------------------
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
