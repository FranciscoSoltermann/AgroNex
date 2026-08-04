package org.agronex.backend.infrastructure.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@Configuration
@EnableJpaAuditing // Esto activa el @CreatedDate y @LastModifiedDate
public class JpaConfig {
}

