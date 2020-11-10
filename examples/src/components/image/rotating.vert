#define M_PI 3.1415926535897932384626433832795
#define HALF_PI 1.5707963267948966

uniform float u_time;
uniform vec2 u_res;
uniform float u_pixelRatio;
uniform float u_progress;
uniform float u_visibility;
uniform float u_viewport;
uniform float u_velocity;
uniform float u_scaleMultiplier;

varying vec2 v_uv;

mat4 rotationMatrix(vec3 axis, float angle)
  {
      axis = normalize(axis);
      float s = sin(angle);
      float c = cos(angle);
      float oc = 1.0 - c;

      return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                  oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                  oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                  0.0,                                0.0,                                0.0,                                1.0);
  }

void main() {
  v_uv = uv;


  vec3 pos = position;


  mat4 translate = mat4(1.0, 0.0, 0.0, pos.x,
                          0.0, 1.0, 0.0, 0.,
                          0.0, 0.0, 1.0, -10000.,
                          0.0, 0.0, 0.0, 1.0);


  float prog = mix(-3., 0.0, smoothstep(0.0, 0.5, u_progress));
        prog = mix(prog, 3., smoothstep(0.5, 1.0, u_progress));

  float bend = mix(1., 0.0, smoothstep(0.0, 0.4, u_progress));
        bend = mix(bend, 1., smoothstep(0.6, 1.0, u_progress));
  // float bend = mix(1., 0.0, smoothstep(0.1, 0.4, u_progress));
  //       bend = mix(bend, 1., smoothstep(0.6, .9, u_progress));

  float progZ = mix(-1., 0.0, smoothstep(0.0, 0.4, u_progress));
        progZ = mix(progZ, -1., smoothstep(0.6, 1.0, u_progress));


  vec2 uv2 = (2.0 * v_uv - 1.0); // -1.0 .. 1.0

  // pos.x *= 1. + pow(sin(3.14 * 1.0 * u_progress + uv2.y) * 0.2, 2.0);
  // pos.y = pos.y * 1. + ((sin(uv.x * 3.1415926535897932384626433832795)) * 100. * (.5 - u_progress));
  // pos.z += sin(3.14 * 2. * uv2.x + u_progress * 10.) * 50.;

  // pos.z += sin(3.14 * 2. * uv.x) * 100.;

  // float cordX = gl_FragCoord.x;

  // pos.z += pow(uv.x * 50., 2.0) * uv2.x;
  // pos.y += pow(sin(3.14 * 0.5 + 3.14 * .5 * uv2.x), 2.0) * 100.;
  // pos.z += pow(sin(3.14 * 0.5 + 3.14 * .5 * uv2.y * prog), 2.0) * 100.;

  // pos.z += pow(sin(3.14 * 0.5 + 3.14 * .5 * (uv2.y + prog)), 1.5) * 150.;
  // vec3 midPoint = vec3(0., -u_res.y*0.5, 0.);
  // vec3 midPoint = vec3(0., 0., -1000.);
  // vec3 midPoint = vec3(0., 0., u_res.y*-.0);

  // mat4 rotMat = rotationMatrix(vec3(1.,0.,0.), -M_PI*0.08*uv2.y+prog);
  // mat4 rotMat = rotationMatrix(vec3(1.,0.,0.), -M_PI*0.08*uv2.y+prog);
  mat4 rotMat = rotationMatrix(vec3(1.,.0,0.), (M_PI*-0.2)*(uv2.y + prog) * bend);

  // pos = (vec4(pos - midPoint, 0.0) * rotMat).xyz + midPoint;
  pos = (vec4(pos, 0.0) * rotMat).xyz;
  // pos.z += progZ * 400.;
  // pos.z += progZ * u_res.y*0.5;
  pos.z += progZ * u_res.y * 0.9 * u_scaleMultiplier;

  // mat4 rotateIt = inverse(translate) * rotMat * translate;
  // pos = (vec4(pos, 0.0) * rotateIt).xyz;


  vec4 modelViewPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * modelViewPosition;
}
