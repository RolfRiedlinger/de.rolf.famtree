import java.util.Properties;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Enumeration;

public class PartnerRelation {
	private Properties myRelation;
	private Person partner;

	
	public String getProperty(String key){
		return myRelation.getProperty(key);
		
	}
	
	public PartnerRelation(Person partner, ResultSet rs) throws SQLException{
		myRelation = new Properties();
		// set the relation status.
		while(rs.next()){
				myRelation.setProperty(rs.getString("STATUS"), rs.getString("SINCE"));
				System.out.println("STATUS:" + rs.getString("STATUS") + "SINCE: "+rs.getString("SINCE"));
			}
		this.partner = partner;
		
	}
	public String toXML() {
		String xmlString = "<RELATION>";
		Enumeration<?> pEnum = myRelation.propertyNames();	
		while(pEnum.hasMoreElements()){
			String key = (String)pEnum.nextElement();
			xmlString += "<"+ key+">"+myRelation.getProperty(key)+"</"+key+">";
		}
		xmlString += partner.toXMLString();
		xmlString +="</RELATION>" ;
		return xmlString;
	}

	public Person getPartner() {
		return partner;
	}

	public void setPartner(Person partner) {
		this.partner = partner;
	}
}


