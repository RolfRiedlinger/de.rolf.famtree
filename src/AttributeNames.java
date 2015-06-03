
public enum AttributeNames {

	A1 ("ID","ID","id"),
	A2 ("PRENAME","PRENAME","text"),
	A3 ("SURNAME","SURNAME","text"),
	A4 ("BIRTHDAY","BIRTHDAY","date"),
	A5 ("MARRIAGE","LASTMARRIAGE","date"),
	A6 ("PROFESSION","LASTPROFESSION","text"),
	A7 ("FATHER", "FATHER_ID","id"),
	A8 ("MOTHER", "MOTHER_ID","id");
	
	String aLabel;
	String aName;
	String aType;
	
	
	AttributeNames(String aLabel, String aName, String aType ){
		this.aName = aName;
		this.aLabel =aLabel;
		this.aType = aType;
		
	}
	
	
	public String getName(){return this.aName;};
	public String getLabel(){return this.aLabel;};
	public String getType(){return this.aType;};
		
	public static void main (String[] args ){
		for (AttributeNames attr: AttributeNames.values()){
			System.out.println(attr.getName());
		}
	}
	
}
