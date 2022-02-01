// NOTE: This is from elsewhere, copied in for reference.

// language=GLSL
export default `
    uniform vec4 origin;
    attribute float size;
    varying vec3 vColor;
    void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float cameraDist = distance(mvPosition, origin);
        gl_PointSize = size * (150.0 / cameraDist);
        gl_Position = projectionMatrix * mvPosition;
    }
`;
