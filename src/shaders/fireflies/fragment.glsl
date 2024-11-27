void main()
{
  float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
  float strength = clamp(0.05 / distanceToCenter - 0.1, 0.0, 1.0);

  gl_FragColor = vec4(1.0, 1.0, 0.0, strength);
}