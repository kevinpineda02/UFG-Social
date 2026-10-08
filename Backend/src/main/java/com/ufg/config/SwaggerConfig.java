package com.ufg.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// Configuración de Swagger para la documentación de la API
@Configuration
public class SwaggerConfig {

    // Configuración de la documentación de la API utilizando OpenAPI
    @Bean
    public OpenAPI apiInfo() {
        return new OpenAPI()
                .info(new Info()
                        .title("API Red Social Universitaria")
                        .description("Documentación de endpoints del backend")
                        .version("1.0.0"));
    }
}
