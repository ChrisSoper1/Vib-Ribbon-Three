// NOTE: This is from elsewhere, copied in for reference.

// language=GLSL
export default `
    uniform vec3 baseColor;
    uniform sampler2D texture;
    varying vec3 vColor;

    void main() {
        gl_FragColor = vec4(baseColor * vColor, 1.0);
        gl_FragColor = gl_FragColor * texture2D(texture, gl_PointCoord);
        if (gl_FragColor.a < 0.5)
        discard;
    }
`;
