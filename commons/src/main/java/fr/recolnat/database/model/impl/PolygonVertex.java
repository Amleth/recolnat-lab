package fr.recolnat.database.model.impl;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 09/06/15.
 */
public class PolygonVertex {
  private int x;
  private int y;

  public PolygonVertex(int x, int y) {
    this.x = x;
    this.y = y;
  }

  public int getX() {
    return x;
  }

  public int getY() {
    return y;
  }
}
