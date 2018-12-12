const { mongoose, MongooseUtils } = require("koma/plugins/mongoose");
const { models } = MongooseUtils;
const { SchemaTypes } = mongoose;
const _ = require("lodash");

module.exports = {
  models: {
    Product: {
      schema: {
        category: { type: "string", required: true },
        name: { type: "string", required: true, unique: true },
        code: { type: "string", required: true, unique: true },
        // type: { type: "string" },
        createdAt: { type: "date", index: true }
      },
      options: {
        timestamps: true
      }
    }
  }
};
