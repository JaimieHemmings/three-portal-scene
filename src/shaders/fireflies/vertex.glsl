uniform float uPixelRatio;
uniform float uSize;
uniform float uTime;
attribute float aScale;

// Random number generator
float fastRandom(float st, float seed) {
    return 0.1 + fract(sin(st * 12.9898 + seed * 78.233)) * 0.3;
}

void main()
{
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    
    float randomFactor = fastRandom(aScale, 0.002);
    float timeModulatedX = sin(uTime + modelPosition.y * 20.0) * (randomFactor / 6.0);
    float timeModulatedY = sin(uTime + modelPosition.x * 100.0) * (randomFactor / 5.0);
    float timeModulatedZ = sin(uTime + modelPosition.x * 100.0) * (randomFactor / 8.0);
    
    modelPosition.x += timeModulatedX;
    modelPosition.y += timeModulatedY;
    modelPosition.z += timeModulatedZ;
    
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;
    
    gl_PointSize = uSize * uPixelRatio * aScale / abs(viewPosition.z);
}