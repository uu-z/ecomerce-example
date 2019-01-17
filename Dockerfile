FROM node:alpine as build
WORKDIR /app
COPY package.json ./
RUN yarn install --prod
FROM node:alpine
COPY --from=build /app /
COPY . .
EXPOSE 8082
CMD ["npm", "start"]
