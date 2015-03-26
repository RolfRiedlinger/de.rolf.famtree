import java.io.IOException;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Enumeration;
import java.util.List;
import java.util.Properties;

import javax.servlet.http.HttpServletRequest;

public class Person {
	
	private Properties myPerson;
    private Properties personId;
	
    private Person father=null;
    private Person mother=null;
    private List <Person> children = null; 
    private List <Person> partner =null;
    	
	public Person(){
	  myPerson	= new Properties();
	  
	}
	
		
	public Person(HttpServletRequest request) throws IOException{
		// create a List Object . Person indeed is a Properties object
		myPerson = new Properties();
		personId = new Properties();
		
		
		
		for (AttributeNames aName : AttributeNames.values()){
			String tmpName =  aName.getName();
			if (request.getParameter(tmpName) != null)
					myPerson.setProperty(tmpName, request.getParameter(tmpName));
		}
		// ID is not a person attribute, that can be modified 
		// It is the unique ID provided by the database 
		// therefore need to be handled differently, 
		// used in update where clause to identify the correct record , that needs to be updated 
		if (request.getParameter("ID") != null)
			personId.setProperty("ID", request.getParameter("ID"));
	}
	
	
	
	public Person(ResultSet rs) {
		// TODO Auto-generated constructor stub
		
		myPerson = new Properties();
		personId = new Properties ();
		
		try {
			if (rs.getString("ID") != null)
				personId.setProperty("ID",rs.getString("ID"));
		} catch (SQLException e1) {
			// TODO Auto-generated catch block
			e1.printStackTrace();
		}
		
		for (AttributeNames aName : AttributeNames.values()){
			String tmpName =  aName.getName();
			try {
				if (rs.getString(tmpName) != null){
					myPerson.setProperty(tmpName,rs.getString(tmpName));
				}
			} catch (SQLException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}
	}

	
	public String toXMLString() throws IOException {
		
		String xmlString = "<description>"; 
		xmlString += "<ID>"+ personId.getProperty("ID")+"</ID>";
		
		Enumeration<?> pEnum = myPerson.propertyNames();	
		while(pEnum.hasMoreElements()){
			String key = (String)pEnum.nextElement();
			xmlString += "<"+ key+">"+myPerson.getProperty(key)+"</"+key+">";
		}
		xmlString += "</description>"; 
		if(father != null){
			xmlString += "<FATHER>";
			xmlString += father.toXMLString();
			xmlString += "</FATHER>";
		}
		if(mother != null){
			xmlString += "<MOTHER>"; 
			xmlString += mother.toXMLString();
			xmlString += "</MOTHER>";
			
		}
		if(partner != null && !partner.isEmpty()){
			for (Person key: partner){
				xmlString += "<PARTNER>"; 
				xmlString += key.toXMLString();
				xmlString += "</PARTNER>";
					
			}
		}
			
		if(children != null && !children.isEmpty()){
			for (Person key: children){
				xmlString += "<CHILD>"; 
				xmlString += key.toXMLString();
				xmlString += "</CHILD>";
					
			}
				
		}
	
		return xmlString;
	}
	
	public Enumeration<?> propertyNames(){
		return myPerson.propertyNames();
	}
	public String getProperty(String key){
		
		if(key.equals("ID"))
			return personId.getProperty(key);
		else
			return myPerson.getProperty(key);
	}

	public Person getFather() {
		return father;
	}

	public void setFather(Person person)  {
		this.father = person;
				
	}

	public Person getMother() {
		return mother;
	}

	public void setMother(Person person) {
		this.mother = person;
	}


	public List <Person> getChildren() {
		return children;
	}


	public void setChildren(List <Person> children) {
		this.children = children;
	}


	public List <Person> getPartner() {
		return partner;
	}


	public void setPartner(List <Person> partner) {
		this.partner = partner;
	}
	
	

	
}

