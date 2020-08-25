const { edit, getPaths } = require("@rescripts/utilities");

const predicate = valueToTest => {
  return valueToTest.oneOf;
}

const transform = match => ({
  ...match,
  oneOf: [
    // Need to add as second-to-last to avoid being intercepted by the file-loader in CRA
    ...match.oneOf.slice(0, -1),
    {
      test: /\.(glsl|frag|vert)$/,
      exclude: [/node_modules/],
      use: ["raw-loader", "glslify-loader"]
    },
    ...match.oneOf.slice(-1)
  ]
});

function rescriptGlslifyPlugin() {
  return config => {
    const matchingPaths = getPaths(predicate, config);
    return edit(transform, matchingPaths, config);
  };
}

module.exports = [
  [
    rescriptGlslifyPlugin,
  ],
]
