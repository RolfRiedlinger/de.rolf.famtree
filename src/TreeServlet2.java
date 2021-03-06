
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Iterator;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;






import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;



/**
 * Servlet implementation class TreeServlet2
 */
public class TreeServlet2 extends HttpServlet {
	private static final long serialVersionUID = 1L;

	/**
	 * @see HttpServlet#HttpServlet()
	 */
	public TreeServlet2() {
		super();
		// TODO Auto-generated constructor stub
	}

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse
	 *      response)
	 */
	protected void doGet(HttpServletRequest request,
			HttpServletResponse response) throws ServletException, IOException {
		// TODO Auto-generated method stub
		this.doPost(request, response);
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse
	 *      response)
	 */
	protected void doPost(HttpServletRequest request,
			HttpServletResponse response) throws ServletException, IOException {
		// TODO Auto-generated method stub
		Person myPerson = new Person(request);
		ViewControl myControler = new ViewControl();

		String xmlString = "<root>";
		String type = request.getParameter("type");

		if (type == null) {
			xmlString += writeXML("no type given");
			xmlString += "</root>";
			this.writeResponse(response, xmlString);
			return;
		}
		// advanced search
		if (type.compareTo("a") == 0) {
			List<Person> myList = myControler.searchPerson(myPerson);
			xmlString += writeXML(myList);
		}
		// quicksearch
		if (type.compareTo("q") == 0) {
			List<Person> myList = myControler.quickSearchPerson(myPerson);
			xmlString += writeXML(myList);
		}
		// create a person
		if (type.compareTo("c") == 0) {
			String msg = null;
			int rc = myControler.createPerson(myPerson);
			switch (rc) {
			case 1:
				msg = "Entry successfully created ! ";
				List<Person> myList = myControler.searchPerson(myPerson);
				xmlString += writeXML(myList);
				break;
			default:
				msg = "Entry not created";
				break;
			}
			xmlString += writeXML(msg);

		}
		if (type.compareTo("u") == 0) {
			String msg = null;
			int rc = myControler.updatePerson(myPerson);
			switch (rc) {
			case 1:
				msg = "Entry successfully updated ! ";
				List<Person> myList = myControler.searchPerson(myPerson);
				xmlString += writeXML(myList);
				break;
			default:
				msg = "Entry not updated";
				break;
			}
			xmlString += writeXML(msg);

		}
		if(type.compareTo("t") == 0){
			
			xmlString +="<person>";
			Person result = myControler.getAncestorTreeFromDB(myPerson);
			if(result != null)
				xmlString += result.toXMLString();
			xmlString +="</person>";
			
		}
		if(type.compareTo("d") == 0){
			
			xmlString +="<person>";
			Person result = myControler. getDescendantTreeFromDB(myPerson);
			if(result != null)
				xmlString += result.toXMLString();
			xmlString +="</person>";
			
		}
		
		
		xmlString += "</root>";
		this.writeResponse(response, xmlString);
		return;
	}

	private String writeXML(List<Person> myList) throws IOException {
		String xmlString = "";
		Iterator<Person> it = myList.iterator();
		while (it.hasNext()) {
			xmlString +="<person>";
			Person myPerson = it.next();
			xmlString += myPerson.toXMLString();
			xmlString += "</person>"; 
		}

		return xmlString;

	}

	private String writeXML(String msg) {
		return "<msg>" + msg + "</msg>";
	}

	private void writeResponse(HttpServletResponse resp, String xmlString)
			throws IOException {
		// TODO Auto-generated method stub
		resp.setContentType("text/xml");
		resp.setHeader("Cache-Control", "no-cache");
		resp.getWriter().write(xmlString);
		resp.getWriter().close();
		System.out.println(xmlString);
		try {
			printOutXML(xmlString);
		} catch (ParserConfigurationException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (SAXException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}

	private void printOutXML(String xmlString)
			throws ParserConfigurationException, SAXException, IOException {
	
		
		ByteArrayInputStream stream = new ByteArrayInputStream(
				xmlString.getBytes("UTF-8"));
		DocumentBuilder builder = DocumentBuilderFactory.newInstance()
				.newDocumentBuilder();
		Document doc = builder.parse(stream);
		
		

		
		Node node = doc.getFirstChild();
		System.out.println("<"+node.getNodeName()+">");
		parseNode(node,1);
		System.out.println("\n</"+node.getNodeName()+">");
	}
	
	
	public int parseNode(Node node,int indent){
		NodeList nodelist = node.getChildNodes();
		if(nodelist.item(0).getNodeType() ==  Node.TEXT_NODE){
			System.out.print(node.getTextContent());
			return 0;
		}
		else{			
			for (int i = 0; i < nodelist.getLength();i++){
				System.out.println();
				for(int j= 0; j< indent; j++)
					System.out.print("\t");
				System.out.print("<"+nodelist.item(i).getNodeName()+">");
				if(parseNode(nodelist.item(i),indent+1) == 1){
					System.out.println();
					for(int j= 0; j< indent; j++)
						System.out.print("\t");
					System.out.print("</"+nodelist.item(i).getNodeName()+">");
				}
				else
					System.out.print("</"+nodelist.item(i).getNodeName()+">");
			}
			return 1;
		}
			
	}


}
