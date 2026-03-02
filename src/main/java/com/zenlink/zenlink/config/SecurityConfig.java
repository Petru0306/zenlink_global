package com.zenlink.zenlink.config;

import com.zenlink.zenlink.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.ArrayList;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${ALLOWED_ORIGINS:}")
    private String allowedOriginsEnv;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/health/**").permitAll()
                .requestMatchers("/uploads/**").permitAll() // Allow access to uploaded files
                // Protected endpoints
                .requestMatchers("/api/me/**").authenticated()
                .requestMatchers("/api/upload/**").authenticated() // Upload requires authentication
                // For now, allow all to maintain backward compatibility
                // Uncomment below to enforce authentication:
                // .requestMatchers("/api/admin/**").hasRole("CLINIC")
                // .requestMatchers("/api/doctors/**").hasAnyRole("DOCTOR", "CLINIC")
                .anyRequest().permitAll()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            // Add JWT filter before UsernamePasswordAuthenticationFilter
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Build allowed origins list
        List<String> allowedOrigins = new ArrayList<>(Arrays.asList(
            "http://localhost:5173", 
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000"
        ));
        
        // Add origins from environment variable (comma-separated)
        if (allowedOriginsEnv != null && !allowedOriginsEnv.isEmpty()) {
            String[] origins = allowedOriginsEnv.split(",");
            for (String origin : origins) {
                String trimmed = origin.trim();
                if (!trimmed.isEmpty() && !allowedOrigins.contains(trimmed)) {
                    allowedOrigins.add(trimmed);
                }
            }
        }
        
        // If ALLOWED_ORIGINS is set, use those specific origins
        // Otherwise allow all origins (permissive default for development/unknown platforms)
        if (allowedOriginsEnv != null && !allowedOriginsEnv.isEmpty()) {
            configuration.setAllowedOrigins(allowedOrigins);
        } else {
            configuration.setAllowedOriginPatterns(java.util.Arrays.asList("*"));
        }
        
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setExposedHeaders(Arrays.asList("Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
