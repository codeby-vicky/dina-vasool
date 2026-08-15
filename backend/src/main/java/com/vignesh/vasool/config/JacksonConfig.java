package com.vignesh.vasool.config;

import com.fasterxml.jackson.datatype.hibernate6.Hibernate6Module;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Without this, Jackson crashes trying to serialize Hibernate's lazy-loading
 * proxy objects (ByteBuddyInterceptor error) whenever a JPA entity with an
 * uninitialized @OneToMany/@ManyToOne is returned directly from a controller
 * - e.g. GET /api/customers, since Customer.loanPhases -> LoanPhase.category
 * / LoanPhase.disbursedBy are lazy-loaded proxies.
 *
 * This module tells Jackson to just serialize unfetched lazy fields as
 * null/empty instead of crashing, and to unwrap proxies to their real type
 * when they ARE loaded.
 */
@Configuration
public class JacksonConfig {

    @Bean
    public Hibernate6Module hibernate6Module() {
        Hibernate6Module module = new Hibernate6Module();
        module.disable(Hibernate6Module.Feature.FORCE_LAZY_LOADING);
        return module;
    }
}