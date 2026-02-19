package com.zenlink.zenlink.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DatabaseConfig {

    @Value("${DATABASE_URL:}")
    private String databaseUrl;

    @Bean
    @Primary
    public DataSource dataSource() {
        // If DATABASE_URL is provided (Railway), parse it
        if (databaseUrl != null && !databaseUrl.isEmpty() && !databaseUrl.startsWith("jdbc:")) {
            try {
                // Railway provides: postgresql://user:password@host:port/database
                // Convert to: jdbc:postgresql://host:port/database?user=user&password=password
                URI dbUri = new URI(databaseUrl);
                
                String username = dbUri.getUserInfo().split(":")[0];
                String password = dbUri.getUserInfo().split(":")[1];
                String host = dbUri.getHost();
                int port = dbUri.getPort();
                String path = dbUri.getPath();
                String database = path.startsWith("/") ? path.substring(1) : path;
                
                String jdbcUrl = String.format("jdbc:postgresql://%s:%d/%s?sslmode=require", 
                    host, port, database);
                
                return DataSourceBuilder.create()
                    .url(jdbcUrl)
                    .username(username)
                    .password(password)
                    .driverClassName("org.postgresql.Driver")
                    .build();
            } catch (Exception e) {
                throw new RuntimeException("Failed to parse DATABASE_URL: " + databaseUrl, e);
            }
        }
        
        // Fallback to default Spring Boot configuration
        return DataSourceBuilder.create().build();
    }
}
