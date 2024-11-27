uniform float uPixelRatio;
uniform float uSize;
uniform float uTime;

attribute float aScale;

void main()
{
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  modelPosition.x += sin(uTime + modelPosition.y * 20.0) * (aScale * 0.1);
  modelPosition.y += sin(uTime + modelPosition.x * 100.0) * (aScale * 0.05);
  modelPosition.z += sin(uTime + modelPosition.x * 100.0) * (aScale * 0.05);

  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;

  gl_Position = projectedPosition;
  gl_PointSize = uSize * uPixelRatio * aScale;
  gl_PointSize *= (1.0 / -viewPosition.z);
}