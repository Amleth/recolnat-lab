/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.dicen.recolnat.services.core.format;

import java.text.SimpleDateFormat;

/**
 * Static Date formatters for reuse.
 * @author dmitri
 */
public class DateFormatUtils {
  /**
   * Format: yyyy-MM-dd-HH:mm:ss
   */
  public static SimpleDateFormat export = new SimpleDateFormat("yyyy-MM-dd-HH:mm:ss");
}
