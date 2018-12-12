const _ = require("lodash");
const { MongooseUtils } = require("koma/plugins/mongoose");
const { findById, pagination, updateById, done } = MongooseUtils;

module.exports = {
  methods: {},
  models: {
    User: {
      schema: {
        nickname: { type: "string", required: true, unique: true },
        username: { type: "string" },
        usertype: { type: "string", enum: ["Customer", "Provider"], require: true },
        gender: { type: "string" },
        address: { type: "string" }
      },
      options: {
        timestamps: true
      }
    }
  }
};
