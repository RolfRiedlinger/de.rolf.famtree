import java.io.IOException;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Enumeration;
import java.util.Properties;

import javax.servlet.http.HttpServletRequest;

import com.mysql.jdbc.Connection;

public class Person {
	
	private Properties myPerson;
    private Properties personId;
	
    private Person father=null;
    private Person mother=null;
	
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

	// das wird der Konstruktor, um die ganze Vorfahrenkette zu holen. 
	public Person(ResultSet rs,  java.sql.Connection con ) throws SQLException {
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
		
		String father_id= null;
		try {
			father_id = rs.getString("FATHER_ID");
		} catch (SQLException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		if (father_id != null) {
			String sql = "Select * from MASTERTABLE where ID='"
					+ father_id + "'";
			Statement stmt = con.createStatement();
			System.out.println(sql);
			ResultSet rs2 = stmt.executeQuery(sql);
			while (rs2.next()) {
					this.father= new Person (rs2,con);	
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
			xmlString += "<MOTHER><description>"; 
			xmlString += "<ID>"+ mother.getProperty("ID")+"</ID>";
			Enumeration<?> pMother = mother.propertyNames();
			while(pMother.hasMoreElements()){
				String key = (String)pMother.nextElement();
				xmlString += "<"+ key+">"+mother.getProperty(key)+"</"+key+">";
			}
			xmlString += "</description></MOTHER>"; 
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

	public void setFather(ResultSet rs)  {
		this.father = new Person(rs);
				
	}

	public Person getMother() {
		return mother;
	}

	public void setMother(ResultSet rs) {
		this.mother = new Person(rs);
	}
	
	

	
}

