const { mongoose, MongooseUtils } = require("koma/plugins/mongoose");
const { models } = MongooseUtils;
const { SchemaTypes } = mongoose;
const _ = require("lodash");

module.exports = {
  gql: {
    Query: {
      ProductStorageByNames: {
        type: `type ProductStorageByNames {items: [JSON]}`,
        args: {
          names: "JSON!"
        },
        resolve: async ({ args }) => {
          const result = await models("Order").find({ "products.productName": { $in: args.names } });

          const data = _.chain(result)
            .reduce((r, c) => [...r, ...c.products], [])
            .groupBy("productId")
            .map((v, k) => {
              let val = {
                _id: k,
                in: 0,
                inAmount: 0,
                inAvg: 0,
                out: 0,
                outAmount: 0,
                outAvg: 0,
                returnIn: 0,
                returnInAmount: 0,
                returnInAvg: 0,
                returnOut: 0,
                returnOutAmount: 0,
                returnOutAvg: 0
              };
              _.each(v, (v1, k1) => {
                val[v1.type] += v1.quantity;
                val[`${v1.type}Amount`] += v1.quantity * v1.price;
              });
              _.each(v, (v1, k1) => {
                val[`${v1.type}Avg`] = Math.floor(val[`${v1.type}Amount`] / val[v1.type]);
              });
              Object.assign(val, {
                total: val.in + val.returnOut - val.out - val.returnIn,
                totalAmount: -val.inAmount - val.returnOutAmount + val.outAmount + val.returnInAmount
              });
              val.totalAvg = Math.floor(val.totalAmount / val.total);
              return val;
            })
            .value();
          return { items: data };
        }
      }
    }
  },
  models: {
    Order: {
      schema: {
        // account: { type: SchemaTypes.ObjectId, ref: "Account", required: true },
        orderNumber: { type: "string" },
        targetUser: { type: SchemaTypes.ObjectId, ref: "User" },
        saleType: { type: "string", enum: ["Purchase", "ReturnedPurchase", "Sale", "ReturnedSale"], required: true },
        totalAmount: { type: "number", required: true, index: true },
        paymentAmount: { type: "number", index: true },
        debtAmount: { type: "number", index: true },
        products: {
          type: [
            {
              productId: { type: SchemaTypes.ObjectId, ref: "Product" },
              productName: { type: "string", ref: "Product" },
              quantity: { type: "number", required: true },
              price: { type: "number", required: true, index: true },
              type: { type: "string", enum: ["in", "out", "returnIn", "returnOut"] },
              remark: { type: "string" }
            }
          ]
        },
        remark: { type: "string" },
        createdAt: { type: "date", index: true }
      },
      options: {
        timestamp: true
      }
    }
  }
};
