const { mongoose, MongooseUtils } = require("koma/plugins/mongoose");
const { models } = MongooseUtils;
const { SchemaTypes } = mongoose;
const _ = require("lodash");
const dayjs = require("dayjs");

module.exports = {
  gql: {
    Query: {
      OrderPaymentAnalysis: {
        type: `type OrderPaymentAnalysis {year: [JSON], month: [JSON], day: [JSON]}`,
        args: {
          date: "Date"
        },
        resolve: async ({ args }) => {
          const d = dayjs(args.date);
          let day = await models("Order").aggregate([
            {
              $match: {
                createdAt: { $gte: d.startOf("month").toDate() }
              }
            },
            {
              $group: {
                _id: {
                  month: { $month: "$createdAt" },
                  day: { $dayOfMonth: "$createdAt" },
                  year: { $year: "$createdAt" },
                  saleType: "$saleType"
                },
                paymentAmount: { $sum: "$paymentAmount" },
                debtAmount: { $sum: "$debtAmount" }
              }
            }
          ]);
          let month = await models("Order").aggregate([
            {
              $match: {
                createdAt: { $gte: d.startOf("year").toDate() }
              }
            },
            {
              $group: {
                _id: {
                  month: { $month: "$createdAt" },
                  year: { $year: "$createdAt" },
                  saleType: "$saleType"
                },
                paymentAmount: { $sum: "$paymentAmount" },
                debtAmount: { $sum: "$debtAmount" }
              }
            }
          ]);
          let year = await models("Order").aggregate([
            {
              $group: {
                _id: {
                  year: { $year: "$createdAt" },
                  saleType: "$saleType"
                },
                paymentAmount: { $sum: "$paymentAmount" },
                debtAmount: { $sum: "$debtAmount" }
              }
            }
          ]);
          let map = (v, k) => {
            let val = { _id: k };
            _.each(v, (v1, k1) => {
              val[`${v1._id.saleType}PaymentAmount`] = v1.paymentAmount;
              val[`${v1._id.saleType}debtAmount`] = v1.debtAmount;
            });
            val["realSalePaymentAmount"] =
              _.get(val, "SalePaymentAmount", 0) - _.get(val, "ReturnedSalePaymentAmount", 0);
            return val;
          };

          day = _.chain(day)
            .groupBy(o => `${o._id.day}`)
            .map(map)
            .value();
          month = _.chain(month)
            .groupBy(o => `${o._id.month}`)
            .map(map)
            .value();
          year = _.chain(year)
            .groupBy(o => `${o._id.year}`)
            .map(map)
            .value();

          return { day, month, year };
        }
      },
      UserPaymentByIds: {
        type: `type UserPaymentByIds {items: [JSON]}`,
        args: {
          ids: "JSON!"
        },
        resolve: async ({ args }) => {
          const result = await models("Order").find({ targetUser: { $in: args.ids } });

          const data = _.chain(result)
            .groupBy("targetUser")
            .map((v, k) => {
              let val = {
                totalAmount: 0,
                paymentAmount: 0,
                debtAmount: 0
              };

              _.each(v, (v1, k1) => {
                _.each(val, (v2, k2) => {
                  val[k2] += v1[k2];
                });
              });

              return {
                _id: k,
                ...val
              };
            })
            .value();
          return { items: data };
        }
      },
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
              val.totalAvg = Math.floor(val.totalAmount / (val.in - val.returnIn));
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
        timestamps: true
      }
    }
  }
};
