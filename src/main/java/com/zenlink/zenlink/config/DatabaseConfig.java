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
        // Check environment variable directly as well (Railway might set it as env var)
        String envDatabaseUrl = System.getenv("DATABASE_URL");
        String finalDatabaseUrl = (envDatabaseUrl != null && !envDatabaseUrl.isEmpty()) ? envDatabaseUrl : databaseUrl;
        
        log.info("DATABASE_URL from @Value: {}", databaseUrl != null ? (databaseUrl.isEmpty() ? "(empty)" : "***") : "(null)");
        log.info("DATABASE_URL from env: {}", envDatabaseUrl != null ? (envDatabaseUrl.isEmpty() ? "(empty)" : "***") : "(null)");
        
        // Try to use individual Railway variables if DATABASE_URL is not available
        String pgHost = System.getenv("PGHOST");
        String pgPort = System.getenv("PGPORT");
        String pgDatabase = System.getenv("PGDATABASE");
        String pgUser = System.getenv("PGUSER");
        String pgPassword = System.getenv("PGPASSWORD");
        
        log.info("Checking Railway individual variables: PGHOST={}, PGDATABASE={}, PGUSER={}", 
            pgHost != null ? pgHost : "(null)", 
            pgDatabase != null ? pgDatabase : "(null)",
            pgUser != null ? pgUser : "(null)");
        
        // If DATABASE_URL is provided (Railway), parse it
        if (finalDatabaseUrl != null && !finalDatabaseUrl.isEmpty() && !finalDatabaseUrl.startsWith("jdbc:")) {
            try {
                log.info("Parsing DATABASE_URL from Railway...");
                // Railway provides: postgresql://user:password@host:port/database
                // Convert to: jdbc:postgresql://host:port/database?user=user&password=password
                URI dbUri = new URI(finalDatabaseUrl);
                
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
                
                log.info("Database connection configured from DATABASE_URL: host={}, port={}, database={}, username={}", 
                    host, port, database, username);
                
                return DataSourceBuilder.create()
                    .url(jdbcUrl)
                    .username(username)
                    .password(password)
                    .driverClassName("org.postgresql.Driver")
                    .build();
            } catch (Exception e) {
                log.error("Failed to parse DATABASE_URL: {}", finalDatabaseUrl != null ? "***" : "(null)", e);
                throw new RuntimeException("Failed to parse DATABASE_URL", e);
            }
        }
        
        // If individual Railway variables are available, use them
        if (pgHost != null && !pgHost.isEmpty() && 
            pgDatabase != null && !pgDatabase.isEmpty() && 
            pgUser != null && !pgUser.isEmpty() && 
            pgPassword != null && !pgPassword.isEmpty()) {
            
            int port = (pgPort != null && !pgPort.isEmpty()) ? Integer.parseInt(pgPort) : 5432;
            String jdbcUrl = String.format("jdbc:postgresql://%s:%d/%s?sslmode=disable", 
                pgHost, port, pgDatabase);
            
            log.info("Database connection configured from individual Railway variables: host={}, port={}, database={}, username={}", 
                pgHost, port, pgDatabase, pgUser);
            
            return DataSourceBuilder.create()
                .url(jdbcUrl)
                .username(pgUser)
                .password(pgPassword)
                .driverClassName("org.postgresql.Driver")
                .build();
        }
        
        log.info("Using default Spring Boot datasource configuration");
        // Fallback to default Spring Boot configuration
        return DataSourceBuilder.create().build();
    }
}
