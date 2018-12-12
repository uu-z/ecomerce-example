const { koma } = require("koma");
const path = require("path");

koma.$use({
  start: {
    metas: {
      mongoose: { load: true },
      graphql: { load: true },
      jwt: { load: true }
    },
    load: {
      plugins: [],
      modules: ["modules"].map(i => path.join(__dirname, i))
    },
    config: {
      RUN: true
    }
  }
});
