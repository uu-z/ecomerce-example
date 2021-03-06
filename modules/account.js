const _ = require("lodash");
const { MongooseUtils } = require("koma/plugins/mongoose");
const { models } = MongooseUtils;
const { signJWT } = require("koma/plugins/jwt");

module.exports = {
  name: "User",
  gql: {
    resolvers: {
      Mutation: {
        Login: {
          type: `type Login {account: Account!, jwt: String!}`,
          args: { identifier: "String!", password: "String!" },
          resolve: async ({ args }) => {
            const { identifier, password } = args;
            const account = await models("Account")
              .findOne({ $or: [{ username: identifier }] })
              .select("+password");
            if (!account) throw new Error("用户不存在");
            const validPassword = await account.verifyPassword(password);
            if (validPassword) {
              delete account.password;
              return { account, jwt: signJWT({ _id: account._id, role: account.role }) };
            } else {
              throw new Error("用户名或密码错误");
            }
          }
        },
        SignUp: {
          type: `type SignUpPayload {username: String!}`,
          args: {
            username: "String!",
            password: "String!"
          },
          resolve: async ({ args }) => {
            const user = await models("Account").create(args);
            return user;
          }
        }
      }
    }
  },
  models: {
    Account: {
      schema: {
        username: { type: "string", required: true, unique: true },
        password: { type: "string", select: false, required: true, bcrypt: true, hidden: true }
      },
      options: {
        timestamps: true
      }
    }
  }
};
