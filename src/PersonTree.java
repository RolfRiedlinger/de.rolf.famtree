import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.Enumeration;
import java.util.List;
import java.util.ArrayList;

import javax.naming.Context;
import javax.naming.InitialContext;
import javax.sql.DataSource;

public class PersonTree {

	public List<Person> searchresult = new ArrayList<Person>();

	public List<Person> quickSearchPerson(Person query) {
		int first = 0;
		String[] sqlExpression = { " WHERE ", " OR" };
		String sql = "Select * from MASTERTABLE ";
		Enumeration<?> pEnum = query.propertyNames();

		while (pEnum.hasMoreElements()) {
			String key = (String) pEnum.nextElement();
			sql += sqlExpression[first] + " (" + key + " LIKE '%"
					+ query.getProperty(key) + "%') ";
			first = 1;
		}

		System.out.println(sql);
		return queryDatabase(sql);
	}

	public List<Person> searchPerson(Person query) {
		int first = 0;
		String[] sqlExpression = { "", " AND " };
		String sql = "Select * from MASTERTABLE where ";

		Enumeration<?> pEnum = query.propertyNames();

		while (pEnum.hasMoreElements()) {
			String key = (String) pEnum.nextElement();
			sql += sqlExpression[first] + key + "='" + query.getProperty(key)
					+ "'";
			first = 1;
		}
		if(query.getProperty("ID") != null){
			sql += sqlExpression[first] + "ID"+ "='" + query.getProperty("ID")	+ "'";
		}
			
		
		System.out.println(sql);
		return queryDatabase(sql);
	}

	public int createPerson(Person myPerson) {
		// TODO Auto-generated method stub

		String sql = "INSERT INTO MASTERTABLE (";
		String sql2 = " ";
		Enumeration<?> pEnum = myPerson.propertyNames();

		while (pEnum.hasMoreElements()) {
			String key = (String) pEnum.nextElement();
			sql += key + ",";
			sql2 += "'" + myPerson.getProperty(key) + "',";
		}
		sql = sql.substring(0, sql.length() - 1);
		sql2 = sql2.substring(0, sql2.length() - 1);
		sql += ") VALUES (" + sql2 + ")";

		System.out.println(sql);
		return callDatabase(sql);

	}
	
	public int updatePerson(Person myPerson) {
		// TODO Auto-generated method stub

		String sql = "UPDATE MASTERTABLE SET ";

		Enumeration<?> pEnum = myPerson.propertyNames();

		while (pEnum.hasMoreElements()) {
			String key = (String) pEnum.nextElement();
			sql += key + "=" + "'" + myPerson.getProperty(key) + "',";
		}
		sql = sql.substring(0, sql.length() - 1);

		sql += " WHERE ID=" + myPerson.getProperty("ID");

		System.out.println(sql);

		return callDatabase(sql);

	}

	

	private List<Person> queryDatabase(String sql) {
		Connection con;
		Statement stmt;
		try {
			Context initContext = new InitialContext();
			DataSource ds = (DataSource) initContext
					.lookup("java:comp/env/jdbc/fmtreedb");
			// Get a database connection
			con = ds.getConnection();

			// Prepare a statement object used to execute query
			stmt = con.createStatement();
			ResultSet rs = stmt.executeQuery(sql);

			while (rs.next()) {
				// Person myPerson = new Person(rs);
				Person myPerson = new Person(rs,con);
				searchresult.add(myPerson);
			}
			// get father and mother values
			for (Person item : searchresult) {
				/*
				String fatherId = AttributeNames.A7.getName();
				if (item.getProperty(fatherId) != null) {
					sql = "Select * from MASTERTABLE where ID='"
							+ item.getProperty(fatherId) + "'";
					System.out.println(sql);
					rs = stmt.executeQuery(sql);
					while (rs.next()) {
						item.setFather(rs);						
					}
				}
				*/
				String motherId = AttributeNames.A8.getName();
				if (item.getProperty(motherId) != null) {
					sql = "Select * from MASTERTABLE where ID='"
							+ item.getProperty(motherId) + "'";
					System.out.println(sql);
					rs = stmt.executeQuery(sql);
					while (rs.next()) {
						item.setMother(rs);
					}
				}

			}

			stmt.close();
			con.close();
		} catch (java.lang.Exception e) {
			e.printStackTrace();
			System.err.print(e.getClass().getName());
			System.err.println(e.getMessage());

		}
		return searchresult;
	}

	

	private int callDatabase(String sql) {
		Connection con;
		Statement stmt;
		int rc = 0;
		try {
			Context initContext = new InitialContext();
			DataSource ds = (DataSource) initContext
					.lookup("java:comp/env/jdbc/fmtreedb");
			// Get a database connection
			con = ds.getConnection();

			// Prepare a statement object used to execute query
			stmt = con.createStatement();
			rc = stmt.executeUpdate(sql);
			stmt.close();
			con.close();

		} catch (java.lang.Exception e) {
			e.printStackTrace();
			System.err.print(e.getClass().getName());
			System.err.println(e.getMessage());

		}
		return rc;

	}


}
