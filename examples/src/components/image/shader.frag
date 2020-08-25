#ifdef GL_OES_standard_derivatives
  #extension GL_OES_standard_derivatives : enable
#endif

uniform vec3 u_color;
uniform float u_pixelRatio;
uniform float u_time;
uniform float u_progress;
uniform float u_visibility;
uniform float u_viewport;
uniform vec2 u_res;

uniform sampler2D u_texture;

varying vec2 v_uv;

void main() {

  float parallaxSize = 0.; // 10% of image size

  // zoom texture so we can parallax
  vec2 uv = v_uv * (1.0 - parallaxSize) + (parallaxSize * 0.5);

  // parallax image position
  uv.y += mix(-parallaxSize, parallaxSize, u_progress);

  // fetch image color at current uv
  vec4 color = texture2D(u_texture, uv);

  // fade in image as it enters viewport
  float alpha = smoothstep(0.0, .5, u_viewport);

  color.r *= u_viewport;

  // float delta = fwidth(uv.a) * 1.;
  // float delta = length(fwidth(gl_FragCoord));
  vec2 uv2 = (2.0 * v_uv - 1.0); // -1.0 .. 1.0

  float delta = length(fwidth(uv2.x));
  float alphaY = smoothstep(0.999, 1.0, length(uv2.y)) * 1.;
  float alphaX = smoothstep(0.999, 1.0, length(uv2.x)) * 1.;
  float mask = 1. - alphaX - alphaY;

  // RGB shift
  float angle = 3.14 * 0.5;
  float scale = 0.;
  float shift = mix(0.0, 0.5, smoothstep(0.5, 1.0, u_progress));
  vec2 p = (uv - vec2(0.5, 0.5)) * (1.0 - scale) + vec2(0.5, 0.5);
  vec2 offset = shift / 4.0 * vec2(cos(angle), sin(angle));
  vec4 cr = texture2D(u_texture, p + offset);
  vec4 cga = texture2D(u_texture, p);
  vec4 cb = texture2D(u_texture, p - offset);

  // gl_FragColor = vec4(cr.r, cga.g, cb.b, alpha * mask);
  gl_FragColor = vec4(cr.r, cga.g, cb.b, alpha);
  // gl_FragColor = vec4(color.rgb, alpha * mask);
}

