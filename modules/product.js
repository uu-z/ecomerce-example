const { mongoose, MongooseUtils } = require("koma/plugins/mongoose");
const { models } = MongooseUtils;
const { SchemaTypes } = mongoose;
const _ = require("lodash");

module.exports = {
  routes: {
    "get /product/distinct": "getProductdistinct"
  },
  methods: {
    async getProductdistinct(ctx) {
      let result = await models("Product").aggregate([
        {
          $group: {
            _id: null,
            category: { $addToSet: "$category" },
            name: { $addToSet: "$name" },
            saleType: { $addToSet: "$saleType" },
            sku: { $addToSet: "$sku" }
          }
        }
      ]);

      ctx.body = result[0];
    }
  },
  models: {
    Product: {
      schema: {
        category: { type: "string", required: true },
        name: { type: "string", required: true, unique: true },
        code: { type: "string", required: true, unique: true },
        // type: { type: "string" },
        createdAt: { type: "date", index: true }
      }
    }
  }
};
