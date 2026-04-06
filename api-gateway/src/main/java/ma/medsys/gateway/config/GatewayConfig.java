package ma.medsys.gateway.config;

import org.springframework.context.annotation.Configuration;

/**
 * GatewayConfig provides additional programmatic route configuration if needed.
 * Primary routing rules are defined declaratively in application.yml.
 */
@Configuration
public class GatewayConfig {
    // Routes are configured declaratively in application.yml.
    // Add programmatic RouteLocator beans here if dynamic routing is needed in the future.
}
