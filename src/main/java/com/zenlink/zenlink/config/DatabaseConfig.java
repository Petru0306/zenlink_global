package com.zenlink.zenlink.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DatabaseConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConfig.class);

    @Value("${DATABASE_URL:}")
    private String databaseUrl;

    @Bean
    @Primary
    public DataSource dataSource() {
        // If DATABASE_URL is provided (Railway), parse it
        if (databaseUrl != null && !databaseUrl.isEmpty() && !databaseUrl.startsWith("jdbc:")) {
            try {
                log.info("Parsing DATABASE_URL from Railway...");
                // Railway provides: postgresql://user:password@host:port/database
                // Convert to: jdbc:postgresql://host:port/database?user=user&password=password
                URI dbUri = new URI(databaseUrl);
                
                String userInfo = dbUri.getUserInfo();
                if (userInfo == null || !userInfo.contains(":")) {
                    throw new IllegalArgumentException("Invalid DATABASE_URL format: missing user:password");
                }
                
                String username = userInfo.split(":")[0];
                String password = userInfo.split(":")[1];
                String host = dbUri.getHost();
                int port = dbUri.getPort() > 0 ? dbUri.getPort() : 5432;
                String path = dbUri.getPath();
                String database = path.startsWith("/") ? path.substring(1) : path;
                
                if (database.isEmpty()) {
                    throw new IllegalArgumentException("Invalid DATABASE_URL: database name is empty");
                }
                
                String jdbcUrl = String.format("jdbc:postgresql://%s:%d/%s?sslmode=disable", 
                    host, port, database);
                
                log.info("Database connection configured: host={}, port={}, database={}, username={}", 
                    host, port, database, username);
                
                return DataSourceBuilder.create()
                    .url(jdbcUrl)
                    .username(username)
                    .password(password)
                    .driverClassName("org.postgresql.Driver")
                    .build();
            } catch (Exception e) {
                log.error("Failed to parse DATABASE_URL: {}", databaseUrl, e);
                throw new RuntimeException("Failed to parse DATABASE_URL: " + databaseUrl, e);
            }
        }
        
        log.info("Using default Spring Boot datasource configuration");
        // Fallback to default Spring Boot configuration
        return DataSourceBuilder.create().build();
    }
}
