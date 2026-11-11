# Stage 1: Build Expo Web (output "static": satu file HTML per route)
# React Native 0.8x butuh Node ^20.19.4 / ^22.13 / ^24.3; pakai Node 22 LTS.
FROM node:22-alpine AS build
WORKDIR /app

# Install dependensi persis sesuai package-lock (reproducible).
COPY package*.json ./
RUN npm ci

COPY . .

# Nilai EXPO_PUBLIC_* ditanam ke bundle saat build (terlihat publik di browser, jadi BUKAN rahasia).
# Diisi lewat build args dari deploy/docker-compose.prod.yml di repo Server.
ARG EXPO_PUBLIC_API_URL=https://luanna.shop/api
ARG EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
ARG EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL \
    EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=$EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID \
    EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=$EXPO_PUBLIC_GOOGLE_MAPS_API_KEY

RUN npx expo export -p web

# Stage 2: Serve static production files with Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
