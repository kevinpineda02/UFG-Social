package com.ufg.config;

import com.ufg.jwt.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    // Inyección de dependencias del filtro de autenticación JWT y el proveedor de autenticación
    private final JwtAuthenticationFilter jwtAtuhentiucationFilter;
    // Inyección de dependencias del proveedor de autenticación
    private final AuthenticationProvider authProvider;

    // Configuración de CORS para permitir solicitudes desde dominios específicos
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(List.of(
                "http://localhost:3000",
                "http://localhost:5500",
                "http://localhost:8000",
                "http://localhost:8080",
                "http://localhost:8081",
                "http://127.0.0.1:5500",
                "https://ufg-social.vercel.app",
                "http://localhost:5173/"
        ));

        configuration.setAllowedMethods(List.of(
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS"
        ));

        configuration.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "Accept",
                "Origin"
        ));

        configuration.setExposedHeaders(List.of(
                "Authorization"
        ));

        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    // Configuración de seguridad HTTP, incluyendo CORS, CSRF, autorización de solicitudes y gestión de sesiones
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(authRequest ->
                        authRequest
                                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                                .requestMatchers("/auth/**").permitAll()
                                .requestMatchers(
                                        "/swagger-ui/**",
                                        "/swagger-ui.html",
                                        "/v3/api-docs/**"
                                ).permitAll()

                                .requestMatchers(HttpMethod.DELETE, "/publication/**").authenticated()
                                .requestMatchers(HttpMethod.PATCH, "/publication/**").authenticated()
                                .requestMatchers(HttpMethod.POST, "/publication/**").authenticated()

                                .requestMatchers(HttpMethod.PATCH, "/user/**").authenticated()
                                .requestMatchers("/follow/**").authenticated()
                                .requestMatchers("/chat/**").authenticated()

                                .anyRequest().authenticated()
                )
                .sessionManagement(sessionManager ->
                        sessionManager.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authenticationProvider(authProvider)
                .addFilterBefore(jwtAtuhentiucationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }
}

