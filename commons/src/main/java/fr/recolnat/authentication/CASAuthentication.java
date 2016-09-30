/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.recolnat.authentication;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.StringReader;
import java.net.ConnectException;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.ProtocolException;
import java.net.URL;
import java.nio.file.AccessDeniedException;
import javax.servlet.http.Cookie;
import javax.ws.rs.core.MediaType;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import org.w3c.dom.Document;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;

/**
 *
 * @author dmitri
 */
public class CASAuthentication {
  public static String getCASUserLogin(String tgt, String ticketUrl, String serviceValidateUrl) throws AccessDeniedException, ConnectException, IOException {
    // We have TGT. Send to CAS authentication.
    String serviceTicket = "";
    HttpURLConnection conn = null;
    try {
      URL ticketsUrl = new URL(ticketUrl + "/" + tgt);
      conn = (HttpURLConnection) ticketsUrl.openConnection();
      conn.setDoOutput(true);
      conn.setRequestMethod("POST");
      conn.setRequestProperty("Accept", MediaType.TEXT_PLAIN);
      
      String input = "service=https://wp5.recolnat.org";
      
      OutputStream os = conn.getOutputStream();
      os.write(input.getBytes());
      os.flush();
      
      if(conn.getResponseCode() != 200) {
        throw new AccessDeniedException("TGT validation failed, CAS responded with " + conn.getResponseMessage());
      }
      
      StringBuilder builder = new StringBuilder();
      String line = "";
      BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream()));
      while((line = br.readLine()) != null) {
        builder.append(line);
      }
      br.close();
      serviceTicket = builder.toString();
    } catch (MalformedURLException ex) {
      throw new ConnectException("Connection to CAS failed.");
    } catch (ProtocolException ex) {
      throw new ConnectException("Connection to CAS failed.");
    } catch (IOException ex) {
      throw new ConnectException("Connection to CAS failed.");
    } finally {
      if(conn != null) {
        conn.disconnect();
      }
    }

    String xmlData = "";
    conn = null;
    try {
      // Validate ST in order to be able to get user data.
      URL url = new URL(serviceValidateUrl + "?ticket=" + serviceTicket + "&service=https://wp5.recolnat.org");
      conn = (HttpURLConnection) url.openConnection();
      conn.setRequestMethod("POST");
      if(conn.getResponseCode() != 200) {
        throw new AccessDeniedException("ST validation failed, CAS responded with " + conn.getResponseMessage());
      }
      
      StringBuilder builder = new StringBuilder();
      String line = "";
      BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream()));
      while((line = br.readLine()) != null) {
        builder.append(line);
        builder.append("\n");
      }
      br.close();
      xmlData = builder.toString();
    } catch (MalformedURLException ex) {
      throw new ConnectException("Connection to CAS failed.");
    } catch (IOException ex) {
      throw new ConnectException("Connection to CAS failed.");
    } finally {
      if(conn != null) {
        conn.disconnect();
      }
    }
    
    // Parse XML response
    // Look for <cas:user>
    InputSource source = new InputSource(new StringReader(xmlData));
    DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
    DocumentBuilder db;
    Document docResponse = null;
    try {
      db = dbf.newDocumentBuilder();
      docResponse = db.parse(source);
    } catch (ParserConfigurationException ex) {
      throw new IOException("Unable to parse user XML data from CAS");
    } catch (SAXException ex) {
      throw new IOException("Unable to parse user XML data from CAS");
    } catch (IOException ex) {
      throw new IOException("Unable to parse user XML data from CAS");
    }

    String casNs = "http://www.yale.edu/tp/cas";
    
    NodeList users = docResponse.getElementsByTagName("cas:user");
    if (users.getLength() == 0) {
      throw new AccessDeniedException("CAS rejected to respond with user login.");
    }
    String user = users.item(0).getTextContent();
    return user;
  }
  
  public static String getCASTGT(Cookie[] cookies) {
    for (int i = 0; i < cookies.length; ++i) {
          Cookie c = cookies[i];
          if (c.getName().equals("CASTGC")) {
//          if (c.getSecure()) {
//            if (c.isHttpOnly()) {
            return c.getValue();
//            }
//          }
          }
        }
    return null;
  }
}
