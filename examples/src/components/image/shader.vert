uniform float u_time;
uniform vec2 u_res;
uniform float u_pixelRatio;
uniform float u_progress;
uniform float u_visibility;
uniform float u_viewport;
uniform float u_velocity;
uniform float u_scaleMultiplier;

varying vec2 v_uv;

void main(){
  v_uv = uv;


  vec3 pos = position;

  float prog = mix(1., 0.0, smoothstep(0.0, 0.5, u_progress));
        prog = mix(prog, 1., smoothstep(0.5, 1.0, u_progress));


  vec2 uv2 = (2.0 * v_uv - 1.0); // -1.0 .. 1.0

  pos.x *= 1. + pow(sin(3.14 * 1.0 * u_progress + uv2.y) * 0.2, 2.0) * u_scaleMultiplier;
  pos.y = pos.y * 1. + ((sin(uv.x * 3.1415926535897932384626433832795)) * 100. * (.5 - u_progress)) * u_scaleMultiplier;

  pos.z += sin(3.14 * 2. * uv2.x + u_progress * 10.) * 50. * u_scaleMultiplier;

  vec4 modelViewPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * modelViewPosition;
}
