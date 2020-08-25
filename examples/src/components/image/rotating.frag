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

  // fetch image color at current uv
  vec4 color = texture2D(u_texture, v_uv);

  gl_FragColor = color;
}

