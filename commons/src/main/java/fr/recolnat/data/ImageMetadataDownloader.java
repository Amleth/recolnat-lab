/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.recolnat.data;

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
import javax.ws.rs.core.MediaType;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.w3c.dom.Document;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;

/**
 *
 * @author dmitri
 */
public class ImageMetadataDownloader {
  private static Logger log = LoggerFactory.getLogger(ImageMetadataDownloader.class);
  
  /**
   * 
   * @param imageId The image UUID without the "-"
   * @return 
   */
  public static JSONObject downloadImageMetadata(String imageId) throws ConnectException, JSONException {
    String stringMetadata = null;
    HttpURLConnection conn = null;
    try {
      URL dataUrl = new URL("https://mediatheque.mnhn.fr/service/public/media/" + imageId);
      conn = (HttpURLConnection) dataUrl.openConnection();
      conn.setDoOutput(true);
      conn.setRequestMethod("GET");
      conn.setRequestProperty("Accept", MediaType.APPLICATION_JSON);
      
      if(conn.getResponseCode() != 200) {
        log.error("Unable to download metadata for " + imageId + " got response: " + conn.getResponseMessage());
        return null;
      }
      
      StringBuilder builder = new StringBuilder();
      String line = "";
      BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream()));
      while((line = br.readLine()) != null) {
        builder.append(line);
      }
      br.close();
      stringMetadata = builder.toString();
    } catch (MalformedURLException ex) {
      throw new ConnectException("Unable to get metadta for " + imageId);
    } catch (ProtocolException ex) {
      throw new ConnectException("Unable to get metadta for " + imageId);
    } catch (IOException ex) {
      throw new ConnectException("Unable to get metadta for " + imageId);
    } finally {
      if(conn != null) {
        conn.disconnect();
      }
    }

    if(stringMetadata == null) {
      return null;
    }
    return new JSONObject(stringMetadata);
  }
}
