FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /workspace

# The catalog is generated from frontend game folders during the Maven build.
COPY backend/pom.xml .
COPY backend/src src
COPY scripts /scripts
COPY frontend/src/games /frontend/src/games
RUN mvn -B -q -DskipTests package

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN apk add --no-cache wget \
    && addgroup -S spring \
    && adduser -S spring -G spring

COPY --from=build /workspace/target/*.jar app.jar
RUN chown spring:spring app.jar

USER spring
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
