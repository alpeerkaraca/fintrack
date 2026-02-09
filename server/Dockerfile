FROM docker.io/library/maven:3.9.12-eclipse-temurin-25-alpine AS build
LABEL authors="alpeerkaraca"
WORKDIR /app
COPY server/pom.xml server/pom.xml

COPY server/src server/src
RUN --mount=type=cache,target=/root/.m2 \
    mvn -f server/pom.xml package -DskipTests

WORKDIR /app/server/target
RUN java -Djarmode=tools extract --layers --launcher --destination extracted

FROM docker.io/library/eclipse-temurin:25-jre-alpine
LABEL authors="alpeerkaraca"
WORKDIR /app

COPY --from=build /app/server/target/extracted/dependencies/ /app/
COPY --from=build /app/server/target/extracted/spring-boot-loader/ /app/
COPY --from=build /app/server/target/extracted/snapshot-dependencies/ /app/
COPY --from=build /app/server/target/extracted/application/ /app/
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]