# Build stage - compiles the Spring Boot app
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
# Cache-buster: change this value any time a deploy seems to be using stale
# cached layers instead of the latest code. Forces Docker to ignore cache
# from this line onward.
ARG CACHE_BUST=2
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Run stage - smaller image, just runs the built jar
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/vasool-backend-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
