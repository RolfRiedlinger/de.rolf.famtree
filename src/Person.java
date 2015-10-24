import java.io.IOException;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Enumeration;
import java.util.List;
import java.util.Properties;

import javax.servlet.http.HttpServletRequest;

public class Person {
	
	private Properties myPerson;
    private Person father=null;
    private Person mother=null;
    private List <Person> children = null; 
    private List <Person> partner =null;
    private List <PartnerRelation> partnerRelations = null;
    	
	public Person(){
	  myPerson	= new Properties();
	  
	}
	
		
	public Person(HttpServletRequest request) throws IOException{
		// create a List Object . Person indeed is a Properties object
		myPerson = new Properties();
		
		for (AttributeNames aName : AttributeNames.values()){
			String tmpName =  aName.getName();
			if (request.getParameter(tmpName) != null)
					myPerson.setProperty(tmpName, request.getParameter(tmpName));
		}
	}
	
	
	
	public Person(ResultSet rs) {
		// TODO Auto-generated constructor stub
		
		myPerson = new Properties();
		
		
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

	
	public String toXMLString()  {
		
		String xmlString = "<description>"; 

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
		if(partnerRelations != null && !partnerRelations.isEmpty()){
			for (PartnerRelation key: partnerRelations){
				xmlString += key.toXML();	
			}
		}
	
		return xmlString;
	}
	
	public Enumeration<?> propertyNames(){
		return myPerson.propertyNames();
	}
	public String getProperty(String key){
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


	public List <PartnerRelation> getPartnerRelations() {
		return partnerRelations;
	}


	public void setPartnerRelations(List <PartnerRelation> partnerRelation) {
		this.partnerRelations = partnerRelation;
	}
	
	

	
}

